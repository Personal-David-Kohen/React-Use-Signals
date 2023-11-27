export interface IObserverHandler {
  beforeGet?: () => void;
  afterGet?: () => void;
  beforeSet?: () => void;
  afterSet?: () => void;
}

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
};

export const createDeepObjectObserver = <T extends Object>(target: T, handler: IObserverHandler): T => {
  const proxy = new Proxy(target, {
    get: (target, property) => {
      handler.beforeGet?.();

      const value = target[property as keyof T];

      handler.afterGet?.();

      if (isObject(value)) {
        return createDeepObjectObserver(value as Object, handler);
      }

      return value;
    },
    set: (object, key, value) => {
      handler.beforeSet?.();
      const success = Reflect.set(object, key, value);

      if (success) {
        handler.afterSet?.();
      }

      return success;
    },
  }) as T;

  return proxy;
};
