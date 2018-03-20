import * as Rose from '../rosetree';
import * as Random from '../random';
import * as Iter from '../iterable';
import { sample as endlessSample } from '../sample';

export const sample = <A>(a: Random.Generator<A>, size = 10, seed?: Random.Seed): AsyncIterable<A> =>
  Iter.take(size, endlessSample<A>(a, seed));
