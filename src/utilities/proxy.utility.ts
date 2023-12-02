export interface IObserverHandler {
  beforeGet?: () => void;
  afterGet?: () => void;
  beforeSet?: () => void;
  afterSet?: () => void;
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
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
      const success = Reflect.set(object, key, value);

      if (success) {
        handler.afterSet?.();
      }

      return success;
    },
  }) as T;

  cache.set(target, proxy);

  return proxy;
};
