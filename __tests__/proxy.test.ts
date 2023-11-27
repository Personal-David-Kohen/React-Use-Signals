import { createDeepObjectObserver } from '../src/utilities/proxy.utility';

test('Deep Observer Test', () => {
  const handler = {
    afterGet: jest.fn(),
    afterSet: jest.fn(),
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
  expect(handler.afterGet).toHaveBeenCalledTimes(3);

  proxy.a.b.c = 2;
  expect(handler.afterSet).toHaveBeenCalledTimes(1);
  expect(proxy.a.b.c).toBe(2);

  proxy.a.b = { c: 3 };
  expect(handler.afterSet).toHaveBeenCalledTimes(2);
  expect(proxy.a.b.c).toBe(3);

  proxy.a = { b: { c: 4 } };
  expect(handler.afterSet).toHaveBeenCalledTimes(3);
  expect(proxy.a.b.c).toBe(4);
});
