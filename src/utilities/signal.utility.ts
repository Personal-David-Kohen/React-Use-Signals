import { Callback } from "../types/callback.type";
import { useEffect, useMemo, useRef, useState } from "react";
import { createDeepObjectObserver, isObject } from "./proxy.utility";

class GlobalSignalEffects {
  public static active: Function | null = null;
}

export class Signal<T> {
  #_value: T;
  #_subscribers = new Set<Callback<T>>();

  constructor(initial: T) {
    this.#_value = initial;
  }

  #_proxify = (value: T): T => {
    if (!isObject(value)) {
      return value;
    }

    return createDeepObjectObserver(value as Object, {
      onSet: () => {
        this.#_notify();
      },
    }) as T;
  };

  #_notify = () => {
    this.#_subscribers.forEach((subscriber) => {
      subscriber(this.#_proxify(this.#_value));
    });
  };

  get value(): T {
    if (GlobalSignalEffects.active) {
      this.#_subscribers.add(GlobalSignalEffects.active as Callback<T>);
    }

    return this.#_proxify(this.#_value);
  }

  set value(value: T) {
    this.#_value = value;
    this.#_notify();
  }

  public clone(): Signal<T> {
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
  }

  public subscribe = (callback: Callback<T>) => {
    this.#_subscribers.add(callback);
  };

  public useStateAdapter(): Signal<T> {
    const [signal, setSignal] = useState<Signal<T>>(this);

    useEffect(() => {
      this.subscribe(() => {
        setSignal(this.clone());
      });
    }, [this]);

    return signal;
  }
}

export const createSignal = <T>(initial: T) => {
  return new Signal<T>(initial);
};

export const signalEffect = (callback: Function) => {
  GlobalSignalEffects.active = callback;
  callback();
  GlobalSignalEffects.active = null;
};

export const useSignal = <T>(initial: T) => {
  const [key, setKey] = useState(0);
  const ref = useRef<Signal<T> | null>(null);

  const signal = useMemo(() => {
    if (!ref.current) {
      const instance = createSignal<T>(initial);

      instance.subscribe(() => {
        setKey((prev) => prev + 1);
      });

      ref.current = instance;
    }

    return ref.current.clone();
  }, [initial, key]);

  return signal;
};
