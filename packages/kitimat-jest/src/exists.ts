import * as K from 'kitimat';
import * as It from './it';

export const exists = It.wrap(it, K.exists) as It.Extended;
exists.skip = It.wrap(it.skip, K.exists);
exists.only = It.wrap(it.only, K.exists);
