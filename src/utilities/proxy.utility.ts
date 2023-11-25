export interface IObserverHandler {
  onGet?: () => void;
  onSet?: () => void;
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
};

export const createDeepObjectObserver = <T extends Object>(
  target: T,
  handler: IObserverHandler,
  cache = new WeakMap(),
): T => {
  if (cache.has(target)) {
    return cache.get(target) as T;
  }

  const proxy = new Proxy(target, {
    get: (target, property, receiver) => {
      handler.onGet?.();
      const value = target[property as keyof T];

      if (isObject(value)) {
        return createDeepObjectObserver(value as Object, handler, cache);
      }

      return value;
    },
    set: (target, property, value, receiver) => {
      handler.onSet?.();
      return Reflect.set(target, property, value, receiver);
    },
  }) as T;

  cache.set(target, proxy);

  return proxy;
};
