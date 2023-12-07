import { Callback } from '../types/callback.type';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createDeepObjectObserver, isObject } from './proxy.utility';

class GlobalSignalEffects {
  public static active: Function | null = null;
}

export class Signal<T> {
  #_value: T;
  #_is_processing_changes = false;
  #_subscribers = new Set<Callback<T>>();
  #_proxy_cache = new WeakMap<Object, Object>();
  #_subscriber_blacklist = new Set<Callback<T>>();

  constructor(initial: T) {
    this.#_value = initial;
  }

  #_unsubscribe = (callback: Callback<T> | null) => {
    if (callback) {
      this.#_subscriber_blacklist.add(callback);
    }
  };

  #_proxify = (value: T): T => {
    if (!isObject(value)) {
      return value;
    }

    const proxy = createDeepObjectObserver(
      value as Object,
      {
        beforeSet: () => {
          this.#_unsubscribe(GlobalSignalEffects.active as Callback<T>);
        },
        afterSet: () => {
          this.#_notify();
        },
      },
      this.#_proxy_cache,
    ) as T;

    return proxy;
  };

  #_notify = () => {
    if (this.#_is_processing_changes) {
      return;
    }

    this.#_is_processing_changes = true;

    queueMicrotask(() => {
      const subscribers = [...this.#_subscribers].filter(subscriber => !this.#_subscriber_blacklist.has(subscriber));

      subscribers.forEach(subscriber => {
        subscriber(this.#_proxify(this.#_value));
      });

      this.#_is_processing_changes = false;
    });
  };

  get value(): T {
    if (GlobalSignalEffects.active) {
      this.subscribe(GlobalSignalEffects.active as Callback<T>);
    }

    return this.#_proxify(this.#_value);
  }

  set value(value: T) {
    this.#_unsubscribe(GlobalSignalEffects.active as Callback<T>);
    this.#_value = value;
    this.#_notify();
  }

  public clone = (): Signal<T> => {
    const self = this;

    const copy = {
      ...self,
      get value() {
        return self.value;
      },
      set value(value: T) {
        self.value = value;
      },
      subscribe: (callback: Callback<T>) => {
        self.subscribe(callback);
      },
    };

    return copy;
  };

  public peek = (): T => {
    return this.#_value;
  };

  public subscribe = (callback: Callback<T>) => {
    this.#_subscribers.add(callback);
  };

  public useStateAdapter = (): Signal<T> => {
    const [signal, setSignal] = useState<Signal<T>>(this);

    useEffect(() => {
      this.subscribe(() => {
        setSignal(this.clone());
      });
    }, [this]);

    return signal;
  };
}

export const createSignal = <T>(initial: T) => {
  return new Signal<T>(initial);
};

export const signalEffect = (callback: Function) => {
  GlobalSignalEffects.active = callback;

  try {
    callback();
  } catch (error) {
    console.error('Error in signal effect:', error);
  }

  GlobalSignalEffects.active = null;
};

export const computedSignal = <T>(callback: () => T) => {
  const signal = createSignal<T>(callback());

  signalEffect(() => {
    const new_value = callback();

    if (new_value !== signal.peek()) {
      signal.value = new_value;
    }
  });

  return signal;
};

export const useSignal = <T>(initial: T) => {
  const [key, setKey] = useState(0);
  const ref = useRef<Signal<T> | null>(null);

  const signal = useMemo(() => {
    if (!ref.current) {
      const instance = createSignal<T>(initial);

      instance.subscribe(() => {
        ref.current = instance.clone();
        setKey(prev => prev + 1);
      });

      ref.current = instance;
    }

    return ref.current;
  }, [key]);

  return signal;
};
