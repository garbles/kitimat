import * as walk from '../walk';
import { Random } from 'kitimat';
import { check } from 'kitimat-jest';
import { noopGraphFuzzer } from './fuzzers';

const staticSeed = Random.initialSeed(1);

check.skip('creates a deterministic generator', [noopGraphFuzzer], async graph => {
  const props = {
    initialState: graph.initialState,
    initialModel: graph.initialModel,
    minSize: 10,
    maxSize: 100,
  };

  const gen = walk.generator(props);

  const resultA = await gen(staticSeed);
  const resultB = await gen(staticSeed);

  // expect(resultA).toEqual(resultB);
});
