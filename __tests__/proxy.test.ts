import { createDeepObjectObserver } from '../src/utilities/proxy.utility';

test('Deep Observer Test', () => {
  const handler = {
    onGet: jest.fn(),
    onSet: jest.fn(),
  };

  const target = {
    a: {
      b: {
        c: 1,
      },
    },
  };

  const proxy = createDeepObjectObserver(target, handler);

  expect(proxy.a.b.c).toBe(1);
  expect(handler.onGet).toHaveBeenCalledTimes(3);

  proxy.a.b.c = 2;
  expect(handler.onSet).toHaveBeenCalledTimes(1);
  expect(proxy.a.b.c).toBe(2);

  proxy.a.b = { c: 3 };
  expect(handler.onSet).toHaveBeenCalledTimes(2);
  expect(proxy.a.b.c).toBe(3);

  proxy.a = { b: { c: 4 } };
  expect(handler.onSet).toHaveBeenCalledTimes(3);
  expect(proxy.a.b.c).toBe(4);
});
