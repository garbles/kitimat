import { Graph, State, Action, Branch } from '../graph';
import { check } from 'kitimat-jest';
import { noopAction } from './helpers';
import { noopStatesFuzzer } from './fuzzers';

/**
 * This is a simple property that will just ensure everything works.
 * Reluctant to introduce anything more because this is testing internal
 * implementation details.
 */
check(
  'states loop if graph is a ring',
  [noopStatesFuzzer],
  states => {
    const [initialState, ...rest] = states;

    const graph = new Graph(initialState, {});
    graph.addStates(rest);

    for (let i = 0; i < states.length; i++) {
      const current = states[i];
      const next = states[i % states.length];

      graph.addBranch(current, next, noopAction());
    }

    let times = states.length;
    let i = 0;
    let currentState = graph.initialState;

    while (++i < times) {
      currentState = currentState.branches[0].nextState;
    }

    expect(currentState).toEqual(graph.initialState);
  },
  { maxNumTests: 5 },
);
