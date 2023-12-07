import { useEffect } from 'react';
import { renderHook } from '@testing-library/react';
import { createSignal, signalEffect } from '../src/utilities/signal.utility';

test('Counter Signals Test', async () => {
  const counter = createSignal(0);

  const callback = jest.fn();
  counter.subscribe(callback);

  counter.value = 1;
  counter.value = 2;
  counter.value = 3;

  // Wait for the next microtask to run
  //This tests batch updates
  await new Promise<void>(resolve => queueMicrotask(() => resolve()));

  expect(callback).toHaveBeenCalledTimes(1);
  expect(counter.value).toBe(3);

  counter.value = 4;
  counter.value = 5;
  counter.value = 6;

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(callback).toHaveBeenCalledTimes(2);
  expect(counter.value).toBe(6);
});

test('React Signal Test', async () => {
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

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(useEffectCallback).toHaveBeenCalledTimes(1);
});

test('Complex Signal Test', async () => {
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

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(effectCallback).toHaveBeenCalledTimes(1);

  userSignal.value.name = 'Jane';

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(effectCallback).toHaveBeenCalledTimes(2);

  userSignal.value.address.city = 'Los Angeles';

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(effectCallback).toHaveBeenCalledTimes(3);

  userSignal.value.address.state = 'CA';

  await new Promise<void>(resolve => queueMicrotask(resolve));

  expect(effectCallback).toHaveBeenCalledTimes(4);

  userSignal.value.age = 21;

  await new Promise<void>(resolve => queueMicrotask(resolve));

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
