import { Graph, State, Action, Line } from '../graph';

type Model = {
  toggle: boolean;
};

type Oracle = {
  toggleOn(): Promise<void>;
  toggleOff(): Promise<void>;
  getToggle(): Promise<boolean>;
};

const state1: State<Model, Oracle> = {
  name: 'A',
  description: () => 'A',
  validate: async (model, oracle) => {
    return model.toggle === (await oracle.getToggle()) && model.toggle === true;
  },
  lines: [],
};

const state2: State<Model, Oracle> = {
  name: 'B',
  description: () => 'B',
  validate: async (model, oracle) => {
    return model.toggle === (await oracle.getToggle()) && model.toggle === false;
  },
  lines: [],
};

const action1To2: Action<Model, Oracle> = {
  description: () => 'toggle off',
  apply: (model, oracle) => oracle.toggleOff(),
  nextModel: (model, data) => ({ ...model, toggle: false }),
};

const action2To1: Action<Model, Oracle> = {
  description: () => 'toggle on',
  apply: (model, oracle) => oracle.toggleOn(),
  nextModel: (model, data) => ({ ...model, toggle: true }),
};

const initialModel: Model = {
  toggle: true,
};

const oracle = {
  toggle: true,

  async toggleOn() {},
  async toggleOff() {},
  async getToggle() {
    return this.toggle;
  },
};

const graph = new Graph(state1, initialModel, oracle as Oracle);

graph.addState(state2);
graph.addLine(state1, state2, action1To2);
graph.addLine(state2, state1, action2To1);
