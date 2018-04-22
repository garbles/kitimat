import { DeepReadonly } from 'deep-freeze';
import deepFreeze = require('deep-freeze');

export const freeze = <A>(obj: A): A => deepFreeze(obj) as any;
