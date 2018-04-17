import * as K from 'kitimat';

interface State<M, O> {
  name: string;
  description: (model: M) => string;
  validate: (model: M, oracle: O) => K.Awaitable<boolean>;
  lines: Line<M, O, any>[];
}

interface Action<M, O, D> {
  fuzzer: K.Fuzzer<D>;
  description: (model: M) => string;
  apply: <R>(model: M, oracle: O, data: D) => K.Awaitable<R>;
}

interface Line<M, O, D> {
  start: State<M, O>;
  end: State<M, O>;
  action: Action<M, O, D>;
}

type StateMap<M, O> = Map<string, State<M, O>>;

class Graph<M, O> {
  states: StateMap<M, O>;

  constructor(public initialState: State<M, O>, private initialModel: M, oracle: O) {
    this.states = new Map();
    this.addState(initialState);
  }

  addState(state: State<M, O>) {
    if (this.states.has(state.name)) {
      throw new Error(`State "${state.name}" already exists.`);
    }

    this.states.set(state.name, state);
  }

  addLine<D>(start: State<M, O>, end: State<M, O>, action: Action<M, O, D>) {
    if (!this.states.has(start.name)) {
      throw new Error(`State "${start.name}" must be registered with "addState" before it can be used in a line.`);
    }

    if (!this.states.has(end.name)) {
      throw new Error(`State "${end.name}" must be registered with "addState" before it can be used in a line.`);
    }

    const line: Line<M, O, D> = {
      start,
      end,
      action,
    };

    start.lines = start.lines.concat(line);
  }
}

type Walk<M, O> = K.Random.Generator<AsyncIterable<Line<M, O, any>>>;

const createWalk = <M, O>(graph: Graph<M, O>): Walk<M, O> => async seed => {
  const [tempSeed, returnableSeed] = await K.Random.independentSeed(seed);
  const lineGen = K.Random.oneOf<Line<M, O, any>>(graph.initialState.lines);
  const lineProm = lineGen(tempSeed);

  const scan = K.Iter.scan<K.Random.Result<Line<M, O, any>>>(x => {
    const { value, nextSeed } = x;
    const nextGen = K.Random.oneOf<Line<M, O, any>>(value.end.lines);
    return nextGen(nextSeed);
  }, lineProm);

  return {
    value: K.Iter.map<K.Random.Result<Line<M, O, any>>, Line<M, O, any>>(result => result.value, scan),
    nextSeed: returnableSeed,
  };
};
