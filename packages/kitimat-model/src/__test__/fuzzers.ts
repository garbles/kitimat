import { Graph, State, Action, Branch } from '../graph';
import * as K from 'kitimat';
import { noopState, noopAction } from './helpers';

/**
 * Generate noop state
 */
export const noopStateGen = K.asciiString()
  .filter(str => str.length > 4)
  .map(name => noopState(name));

/**
 * Generate a list of noop states
 */
export const noopStatesGen = K.array(noopStateGen).filter(arr => arr.length >= 2);
