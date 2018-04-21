import deepFreeze = require('deep-freeze');

export const data = <A>(obj: A): A => deepFreeze(JSON.parse(JSON.stringify(obj)));
