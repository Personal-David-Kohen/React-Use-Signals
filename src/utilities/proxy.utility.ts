import { ProxifiedObject, getProxyTargetSymbol, isProxyObjectSymbol } from '../types/proxified.type';

export interface IObserverHandler {
  beforeGet?: () => void;
  afterGet?: () => void;
  beforeSet?: () => void;
  afterSet?: () => void;
  beforeDelete?: () => void;
  afterDelete?: () => void;
}

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const isProxified = <T extends object>(value: T): value is ProxifiedObject<T> => {
  return Boolean(Reflect.get(value, isProxyObjectSymbol));
};

export const deproxify = <T>(value: unknown): T => {
  if (!isObject(value)) {
    return value as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => deproxify(item)) as unknown as T;
  }

  if (!isProxified(value)) {
    return value as T;
  }

  return value[getProxyTargetSymbol] as T;
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

      if (property === isProxyObjectSymbol) {
        return true;
      }

      if (property === getProxyTargetSymbol) {
        return target;
      }

      const value = target[property as keyof T];

      handler.afterGet?.();

      if (!isObject(value)) {
        return value;
      }

      if (value instanceof Blob || value instanceof Date || value instanceof File || value instanceof RegExp) {
        return value;
      }

      return createDeepObjectObserver(value as Object, handler, cache, [...parents, target]);
    },
    set: (object, key, value) => {
      parents.forEach(parent => {
        cache.delete(parent);
      });

      cache.delete(object);

      handler.beforeSet?.();
      const success = Reflect.set(object, key, deproxify(value));

      if (success) {
        handler.afterSet?.();
      }

      return success;
    },
    deleteProperty(object, key) {
      if (key === isProxyObjectSymbol || key === getProxyTargetSymbol) {
        return false;
      }

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
