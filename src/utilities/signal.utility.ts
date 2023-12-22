import { Selector } from '../types/selector.type';
import { Callback } from '../types/callback.type';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isObject, dereference, createDeepObjectObserver } from './proxy.utility';

class GlobalSignalEffects {
  public static active: Function | null = null;
}

/**
 * Signals are a way to manage state in your application.
 * When the signal changes, the subscribers will be notified and the callback will be run.
 * @constructor The constructor takes in the initial value of the signal.
 * @since 1.0.0
 */
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
        beforeDelete: () => {
          this.#_unsubscribe(GlobalSignalEffects.active as Callback<T>);
        },
        afterDelete: () => {
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
      this.#_subscribers.forEach(subscriber => {
        if (!this.#_subscriber_blacklist.has(subscriber)) {
          subscriber(this.#_proxify(this.#_value));
        }
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
    this.#_value = dereference<T>(value);
    this.#_notify();
  }

  /**
   * A method that allows you create a shallow copy of the signal.
   * The copy will have the same value as the original signal and will update when the original signal changes.
   * The only difference is that the memory reference will be different.
   * @returns A shallow copy of the signal.
   */
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

  /**
   * A method that allows you to get the raw current value of the signal without subscribing to it.
   * @returns The current value of the signal.
   */
  public peek = (): T => {
    return this.#_value;
  };

  /**
   * A method that allows you to subscribe to the signal and run a callback when the signal changes.
   * @param callback The callback that will be run when the signal changes.
   * @returns A function that will unsubscribe the callback from the signal.
   */
  public subscribe = (callback: Callback<T>) => {
    this.#_subscribers.add(callback);

    return () => {
      this.#_subscriber_blacklist.add(callback);
    };
  };

  /**
   * A React hook that binds the component to the signal and causes the component to re-render when the signal changes.
   * @returns The current value of the signal.
   */
  public useStateAdapter = (): Signal<T> => {
    const [signal, setSignal] = useState<Signal<T>>(this);

    useEffect(() => {
      this.subscribe(() => {
        setSignal(this.clone());
      });
    }, [this]);

    return signal;
  };

  /**
   * A React hook that helps optimize the selector so that it only re-renders when the value returned from the selector changes.
   * @param selector A callback that takes accepts the current signal's value and returns a specific property from it's contents.
   * @returns The selected property's value from the signal.
   * @since 1.7.3
   */
  public useSelector = <R>(selector: Selector<T, R>) => {
    const prev = useRef<R>(selector(this.value));
    const value = useRef<R>(selector(this.value));
    const [state, setState] = useState<R>(value.current);

    useEffect(() => {
      this.subscribe(() => {
        value.current = selector(this.value);

        if (value.current !== prev.current) {
          prev.current = value.current;
          setState(value.current);
        }
      });
    }, [this]);

    return state;
  };
}

/**
 * A function that creates a signal and should only be called outside of components in order to prevent the signal from being re-created on every render.
 * @param initial The initial value of the signal.
 * @returns A signal with the initial value.
 * @since 1.0.0
 */
export const createSignal = <T>(initial: T) => {
  return new Signal<T>(initial);
};

/**
 * Creates an effect that will run the callback that is being passed in and will subscribe to any signals that are accessed within the callback.
 * @param callback The callback that will be run.
 * @since 1.0.0
 */
export const signalEffect = (callback: Function) => {
  GlobalSignalEffects.active = callback;

  try {
    callback();
  } catch (error) {
    console.error('Error in signal effect:', error);
  }

  GlobalSignalEffects.active = null;
};

/**
 * A function that creates a signal whose value is computed by the callback that is passed in.
 * If any signals are accessed within the callback, the signal will be re-computed when the signal changes.
 * @param callback The callback that will be run to compute the value of the signal.
 * @returns A signal with the computed value.
 */
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

/**
 * A React hook that allows you to create a signal within a component and have the component re-render when the signal changes.
 * @param initial The initial value of the signal.
 * @returns A signal with the initial value.
 */
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
