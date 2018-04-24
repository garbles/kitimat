import { Graph, State, Action, Branch } from '../graph';
import * as K from 'kitimat';

export const noopState = (name: string): State<any, any> => {
  return {
    name: name,
    description: () => `NOOP: ${name}`,
    validate: async (model, oracle) => true,
    branches: [],
  };
};

export const noopAction = (): Action<any, any, any> => {
  return {
    fuzzer: K.constant(undefined),
    description: () => 'noop',
    apply: (model, oracle) => true,
    nextModel: model => model,
    preValidate: () => true,
    postValidate: () => true,
  };
};
