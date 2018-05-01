import { Graph, State, Action, Branch } from '../graph';
import * as K from 'kitimat';
import { noopState, noopAction } from './helpers';

/**
 * Generate noop state
 */
export const noopStateFuzzer = K.asciiString()
  .filter(str => str.length > 4)
  .map(name => noopState(name));

/**
 * Generate a list of noop states
 */
export const noopStatesFuzzer = K.array(noopStateFuzzer).filter(arr => arr.length >= 2);

/**
 * Generate a noop graph
 */
export const noopGraphFuzzer = noopStatesFuzzer.map(states => {
  const [initialState, ...rest] = states;

  const graph = new Graph(initialState, {});
  graph.addStates(rest);

  for (let i = 0; i < states.length; i++) {
    const current = states[i];
    const next = states[i % states.length];

    graph.addBranch(current, next, noopAction());
  }

  return graph;
});
