import { useEffect, useState } from 'react';
import { Callback } from '../types/callback.type';
import { createDeepObjectObserver, isObject } from './proxy.utility';

class GlobalSignalEffects {
  public static active: Function | null = null;
}

export class Signal<T> {
  #_value: T;
  #_proxies = new WeakMap();
  #_subscribers = new Set<Callback<T>>();

  constructor(initial: T) {
    this.#_value = initial;
  }

  #_proxify = (value: T): T => {
    if (!isObject(value)) {
      return value;
    }

    return createDeepObjectObserver(
      value as Object,
      {
        onSet: () => {
          this.#_notify();
        },
      },
      this.#_proxies,
    ) as T;
  };

  #_notify = () => {
    this.#_subscribers.forEach(subscriber => subscriber(this.#_value));
  };

  get value(): T {
    if (GlobalSignalEffects.active) {
      this.#_subscribers.add(GlobalSignalEffects.active as Callback<T>);
    }

    return this.#_proxify(this.#_value);
  }

  set value(value: T) {
    this.#_value = this.#_proxify(value);
    this.#_notify();
  }

  public subscribe = (callback: Callback<T>) => {
    this.#_subscribers.add(callback);
  };

  #_getShallowCopy(): Signal<T> {
    const self = this;

    const copy = {
      ...self,
      get value() {
        return self.value;
      },
      set value(value: T) {
        self.value = value;
      },
    };

    return copy;
  }

  public useStateAdapter(): Signal<T> {
    const [signal, setSignal] = useState<Signal<T>>(this);

    useEffect(() => {
      this.subscribe(() => {
        setSignal(this.#_getShallowCopy());
      });
    }, [this]);

    return signal;
  }

  //Magic methods
  public toString(): string {
    return JSON.stringify(this.#_value);
  }

  public toJSON(): T {
    return this.#_value;
  }

  public valueOf(): T {
    return this.#_value;
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

export const useSignal = <T>(initial: T) => createSignal<T>(initial).useStateAdapter();
