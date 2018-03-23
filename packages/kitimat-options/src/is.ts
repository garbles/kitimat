export const number = (obj: any): obj is number => typeof obj === 'number';

export const object = <A extends object>(obj: any): obj is A =>
  Object.prototype.toString.call(obj) === '[object Object]';
