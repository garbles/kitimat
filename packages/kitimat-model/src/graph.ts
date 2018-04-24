import { Fuzzer, Awaitable } from 'kitimat';

export interface State<M, O> {
  name: string;
  branches: Branch<M, O, any>[];
  description(model: M): string;
  validate(model: M, oracle: O): Awaitable<boolean>;
}

export interface Action<M, O, D = void> {
  fuzzer: Fuzzer<D>;
  apply(model: M, oracle: O, data: D): Awaitable<{}>;
  description(model: M, data: D): string;
  nextModel(model: M, data: D): M;
  preValidate(model: M): boolean;
  postValidate(prevModel: M, nextModel: M, oracle: O, data: D): Awaitable<boolean>;
}

export interface Branch<M, O, D> {
  nextState: State<M, O>;
  action: Action<M, O, D>;
}

export type StateMap<M, O> = Map<string, State<M, O>>;

export class Graph<M, O> {
  states: StateMap<M, O>;

  constructor(public initialState: State<M, O>, public initialModel: M) {
    this.states = new Map();
    this.addState(initialState);
  }

  addState(state: State<M, O>) {
    if (this.states.has(state.name)) {
      throw new Error(`State "${state.name}" already exists.`);
    }

    this.states.set(state.name, state);
  }

  addStates(states: State<M, O>[]) {
    states.forEach(state => this.addState(state));
  }

  addBranch<D>(currentState: State<M, O>, nextState: State<M, O>, action: Action<M, O, D>) {
    if (!this.states.has(currentState.name)) {
      throw new Error(
        `State "${currentState.name}" must be registered with "addState" before it can be used in a line.`,
      );
    }

    if (!this.states.has(nextState.name)) {
      throw new Error(`State "${nextState.name}" must be registered with "addState" before it can be used in a line.`);
    }

    const branch: Branch<M, O, D> = {
      nextState,
      action,
    };

    currentState.branches = currentState.branches.concat(branch);
  }
}
