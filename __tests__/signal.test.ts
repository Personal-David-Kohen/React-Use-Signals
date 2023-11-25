import { useEffect } from 'react';
import { renderHook } from '@testing-library/react';
import { createSignal, signalEffect } from '../src/utilities/signal.utility';

test('Counter Signals Test', () => {
  const counter = createSignal(0);

  const callback = jest.fn();
  counter.subscribe(callback);

  counter.value = 1;
  counter.value = 2;
  counter.value = 3;

  expect(callback).toHaveBeenCalledTimes(3);
  expect(counter.value).toBe(3);

  counter.value = 4;
  counter.value = 5;
  counter.value = 6;

  expect(callback).toHaveBeenCalledTimes(6);
  expect(counter.value).toBe(6);
});

test('React Signal Test', () => {
  const counterSignal = createSignal(0);

  const effectCallback = jest.fn();
  const useEffectCallback = jest.fn();

  signalEffect(() => {
    effectCallback(counterSignal.value);
  });

  const { result: counter } = renderHook(() => counterSignal.useStateAdapter());

  renderHook(() => {
    useEffect(() => {
      useEffectCallback();
    }, [counter]);
  });

  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(useEffectCallback).toHaveBeenCalledTimes(1);
});

test('Complex Signal Test', () => {
  const MOCK_USER = {
    name: 'John',
    age: 20,
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
    },
  };

  const userSignal = createSignal(MOCK_USER);

  const effectCallback = jest.fn();

  signalEffect(() => {
    effectCallback(userSignal.value);
  });

  expect(effectCallback).toHaveBeenCalledTimes(1);

  userSignal.value.name = 'Jane';
  expect(effectCallback).toHaveBeenCalledTimes(2);

  userSignal.value.address.city = 'Los Angeles';
  expect(effectCallback).toHaveBeenCalledTimes(3);

  userSignal.value.address.state = 'CA';
  expect(effectCallback).toHaveBeenCalledTimes(4);

  userSignal.value.age = 21;
  expect(effectCallback).toHaveBeenCalledTimes(5);

  expect(userSignal.value).toEqual({
    name: 'Jane',
    age: 21,
    address: {
      street: '123 Main St',
      city: 'Los Angeles',
      state: 'CA',
    },
  });
});

test('Signal Magic Methods Test', () => {
  const counter = createSignal(0);

  expect(counter.toString()).toBe('0');
  expect(counter.valueOf()).toBe(0);
  expect(counter.toJSON()).toBe(0);
});


