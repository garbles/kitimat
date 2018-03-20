import * as Random from './random';
import * as Iter from './iterable';

export const sample = <A>(a: Random.Generator<A>, seed?: Random.Seed): AsyncIterable<A> => {
  if (seed === undefined) {
    seed = Random.initialSeed(Date.now());
  }

  return Iter.create(async function*() {
    let nextSeed = seed!;

    while (true) {
      const next = a(nextSeed);
      yield next.value;
      nextSeed = next.nextSeed;
    }
  });
};
