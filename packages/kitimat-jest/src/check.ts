import * as K from 'kitimat';
import * as It from './it';

export const check = It.wrap(it, K.check) as It.Extended;
check.skip = It.wrap(it.skip, K.check);
check.only = It.wrap(it.only, K.check);
