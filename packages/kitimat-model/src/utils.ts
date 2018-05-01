import { DeepReadonly } from 'deep-freeze';
import deepFreeze = require('deep-freeze');

const isScalar = (obj: any): obj is void | null | boolean | string | number =>
  obj === undefined || obj === null || typeof obj === 'boolean' || typeof obj === 'string' || typeof obj === 'number';

export const freeze = <A>(obj: A): A => {
  if (isScalar(obj)) {
    return obj;
  }

  return deepFreeze(obj) as any;
};
