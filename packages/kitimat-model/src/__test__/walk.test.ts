import * as walk from '../walk';
import { State } from '../graph';
import { Random } from 'kitimat';
import { check } from 'kitimat-jest';
import { noopGraphFuzzer } from './fuzzers';

const staticSeed = Random.initialSeed(1);

type Result = {
  state: State<any, any>;
  model: any;
  resolved: any;
};

const resolve = (comp: walk.Computation<any, any>): Result => {
  const { apply, ...rest } = comp;
  return { ...rest, resolved: apply(undefined) };
};

check(
  'creates a deterministic generator',
  [noopGraphFuzzer],
  async graph => {
    const props = {
      initialState: graph.initialState,
      initialModel: graph.initialModel,
      minSize: 10,
      maxSize: 100,
    };

    const gen = walk.generator(props);

    const resultA = (await gen(staticSeed)).value;
    const resultB = (await gen(staticSeed)).value;

    const dataA = resultA.map(resolve);
    const dataB = resultB.map(resolve);

    expect(dataA).toEqual(dataB);
    expect(resultA.length).toBeGreaterThanOrEqual(10);
    expect(resultA.length).toBeLessThanOrEqual(100);
  },
  { maxNumTests: 5 },
);
