export const isProxyObjectSymbol: unique symbol = Symbol('is_proxy_object');
export const getProxyTargetSymbol: unique symbol = Symbol('get_proxy_target');

export type ProxifiedObject<T> = T & {
  [isProxyObjectSymbol]: true;
  [getProxyTargetSymbol]: T;
};
