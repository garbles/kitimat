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
  preValidate(model: M): Awaitable<boolean>;
  postValidate(model: M, oracle: O): Awaitable<boolean>;
}

export interface Branch<M, O, D> {
  start: State<M, O>;
  end: State<M, O>;
  action: Action<M, O, D>;
}

export type StateMap<M, O> = Map<string, State<M, O>>;

export class Graph<M, O> {
  states: StateMap<M, O>;

  constructor(public initialState: State<M, O>, public initialModel: M, public oracle: O) {
    this.states = new Map();
    this.addState(initialState);
  }

  addState(state: State<M, O>) {
    if (this.states.has(state.name)) {
      throw new Error(`State "${state.name}" already exists.`);
    }

    this.states.set(state.name, state);
  }

  addBranch<D>(start: State<M, O>, end: State<M, O>, action: Action<M, O, D>) {
    if (!this.states.has(start.name)) {
      throw new Error(`State "${start.name}" must be registered with "addState" before it can be used in a line.`);
    }

    if (!this.states.has(end.name)) {
      throw new Error(`State "${end.name}" must be registered with "addState" before it can be used in a line.`);
    }

    const branch: Branch<M, O, D> = {
      start,
      end,
      action,
    };

    start.branches = start.branches.concat(branch);
  }
}
