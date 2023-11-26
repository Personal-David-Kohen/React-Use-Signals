export interface IObserverHandler {
  onGet?: () => void;
  onSet?: () => void;
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
};

export const createDeepObjectObserver = <T extends Object>(target: T, handler: IObserverHandler): T => {
  const proxy = new Proxy(target, {
    get: (target, property) => {
      handler.onGet?.();
      const value = target[property as keyof T];

      if (isObject(value)) {
        return createDeepObjectObserver(value as Object, handler);
      }

      return value;
    },
    set: (object, key, value) => {
      const result = Reflect.set(object, key, value);

      handler.onSet?.();

      return result;
    },
  }) as T;

  return proxy;
};
