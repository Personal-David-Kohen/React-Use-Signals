import { useEffect, useState } from 'react'
import { Callback } from '../types/callback.type'

class GlobalSignalEffects {
  public static active: Function | null = null
}

export class Signal<T> {
  #_value: T
  private subscribers = new Set<Callback<T>>()

  constructor(initial: T) {
    this.#_value = initial
  }

  private notify = () => {
    this.subscribers.forEach(subscriber => subscriber(this.#_value))
  }

  get value(): T {
    if (GlobalSignalEffects.active) {
      this.subscribers.add(GlobalSignalEffects.active as Callback<T>)
    }

    return this.#_value
  }

  set value(value: T) {
    this.#_value = value
    this.notify()
  }

  public subscribe = (callback: Callback<T>) => {
    this.subscribers.add(callback)
  }

  public getShallowCopy(): Signal<T> {
    const self = this

    const copy = {
      ...self,
      get value() {
        return self.value
      },
      set value(value: T) {
        self.value = value
      },
      subscribe: self.subscribe,
    }

    return copy
  }

  public useStateAdapter(): Signal<T> {
    const [signal, setSignal] = useState<Signal<T>>(this)

    useEffect(() => {
      this.subscribe(() => {
        setSignal(this.getShallowCopy())
      })
    }, [this])

    return signal
  }
}

export const createSignal = <T>(initial: T) => {
  return new Signal<T>(initial)
}

export const signalEffect = (callback: Function) => {
  GlobalSignalEffects.active = callback
  callback()
  GlobalSignalEffects.active = null
}

export const useSignal = <T>(initial: T) => {
  const [signal, setSignal] = useState<Signal<T>>()

  useEffect(() => {
    const signal = createSignal(initial)

    signal.subscribe(() => {
      setSignal(signal.getShallowCopy())
    })

    setSignal(signal)
  }, [initial])

  return signal
}
