export interface IObserverHandler {
  beforeGet?: () => void;
  afterGet?: () => void;
  beforeSet?: () => void;
  afterSet?: () => void;
  beforeDelete?: () => void;
  afterDelete?: () => void;
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
};

export const dereference = <T>(value: unknown) => {
  if (!isObject(value)) {
    return value as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, element] of Object.entries(value as Record<string, unknown>)) {
    result[key] = dereference(element);
  }

  if (Array.isArray(value)) {
    return Object.values(result) as unknown as T;
  }

  return result as T;
};

export const createDeepObjectObserver = <T extends Object>(
  target: T,
  handler: IObserverHandler,
  cache: WeakMap<Object, Object>,
  parents: Object[] = [],
): T => {
  if (cache.has(target)) {
    return cache.get(target) as T;
  }

  const proxy = new Proxy(target, {
    get: (target, property) => {
      handler.beforeGet?.();

      const value = target[property as keyof T];

      handler.afterGet?.();

      if (isObject(value)) {
        return createDeepObjectObserver(value as Object, handler, cache, [...parents, target]);
      }

      return value;
    },
    set: (object, key, value) => {
      parents.forEach(parent => {
        cache.delete(parent);
      });

      cache.delete(object);

      handler.beforeSet?.();
      const success = Reflect.set(object, key, dereference(value));

      if (success) {
        handler.afterSet?.();
      }

      return success;
    },
    deleteProperty(object, key) {
      if (key in object) {
        parents.forEach(parent => {
          cache.delete(parent);
        });

        cache.delete(object);

        handler.beforeDelete?.();
        const success = Reflect.deleteProperty(object, key);

        if (success) {
          handler.afterDelete?.();
        }

        return success;
      }

      return false;
    },
  }) as T;

  cache.set(target, proxy);

  return proxy;
};
