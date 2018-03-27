import * as Random from './random';
import * as Shrink from './shrink';
import * as RoseTree from './rosetree';
import * as Iter from './iterable';
import * as Util from './utilities';
import * as is from './is';
import { sample } from './sample';

import { Shrinker } from './shrink';
import { Generator } from './random';
import { Rose } from './rosetree';

import invariant = require('invariant');

export class Fuzzer<A> {
  constructor(public generator: Generator<Rose<A>>) {}

  map<B>(fn: (a: A) => B): Fuzzer<B> {
    return map(fn, this);
  }

  flatMap<B>(fn: (a: A) => Fuzzer<B>): Fuzzer<B> {
    return flatMap(fn, this);
  }

  filter(fn: (a: A) => boolean): Fuzzer<A> {
    return filter(fn, this);
  }

  maybe(): Fuzzer<A | void> {
    return maybe(this);
  }

  noShrink(): Fuzzer<A> {
    return noShrink(this);
  }
}

export const custom = <A>(generator: Generator<A>, shrinker: Shrinker<A>): Fuzzer<A> => {
  const shrinkTree = (a: A): Rose<A> => RoseTree.rose(a, Iter.lazy(() => Iter.map(shrinkTree, shrinker(a))));

  return new Fuzzer(Random.map(shrinkTree, generator));
};

export const frequency = <A, B>(pairs: [number, Fuzzer<A>][]): Fuzzer<A> => {
  const genPairs = pairs.map((x): [number, Random.Generator<RoseTree.Rose<A>>] => [x[0], x[1].generator]);
  const generator = Random.frequency(genPairs);
  return new Fuzzer(generator);
};

const numberHelper = (
  createGenerator: (low: number, high: number) => Generator<number>,
  createShrinker: (min: number) => Shrinker<number>,
) => (props: Partial<{ minSize: number; maxSize: number }> = {}): Fuzzer<number> => {
  const { minSize = -1e9, maxSize = 1e9 } = props;

  invariant(is.number(minSize), 'minSize (%s) is not a number', minSize);
  invariant(is.number(maxSize), 'minSize (%s) is not a number', maxSize);
  invariant(
    maxSize >= minSize,
    'Number generator must have minSize (%s) less than or equal to maxSize (%s)',
    minSize,
    maxSize,
  );

  const gens: [number, Generator<number>][] = [[1, Random.constant(minSize)], [1, Random.constant(maxSize)]];

  if (maxSize > 50) {
    if (minSize >= 0) {
      gens.push([3, createGenerator(minSize, 50)]);
    } else {
      gens.push([3, createGenerator(0, 50)]);
    }
  }

  if (minSize < -50) {
    if (maxSize >= 0) {
      gens.push([3, createGenerator(-50, 0)]);
    } else {
      gens.push([3, createGenerator(-50, maxSize)]);
    }
  }

  if (minSize < 0 && maxSize > 0) {
    gens.push([1, Random.constant(0)]);
    gens.push([7, createGenerator(minSize, 0)]);
    gens.push([7, createGenerator(0, maxSize)]);
  } else {
    gens.push([15, createGenerator(minSize, maxSize)]);
  }

  const pivot = minSize >= 0 ? minSize : Math.min(0, maxSize);
  const shrinker = createShrinker(pivot);

  return custom<number>(Random.frequency(gens), shrinker);
};

const stringHelper = (
  createGenerator: (minLen: number, maxLen: number) => Generator<string>,
  shrinker: Shrinker<string>,
) => (props: Partial<{ maxSize: number }> = {}): Fuzzer<string> => {
  const { maxSize = 1e2 } = props;

  invariant(is.number(maxSize), 'maxSize (%s) is not a number', maxSize);
  invariant(maxSize >= 0, 'maxSize (%s) greater than or equal to zero', maxSize);

  const gens: [number, Generator<string>][] = [
    [1, createGenerator(maxSize, maxSize)],
    [1, Random.constant('')],
    [1, Random.whitespace],
  ];

  if (maxSize < 10) {
    gens.push([8, createGenerator(1, maxSize)]);
  } else if (maxSize < 50) {
    gens.push([4, createGenerator(1, 10)]);
    gens.push([4, createGenerator(11, maxSize)]);
  } else {
    gens.push([4, createGenerator(1, 10)]);
    gens.push([3, createGenerator(11, 50)]);
    gens.push([1, createGenerator(50, maxSize)]);
  }

  return custom(Random.frequency(gens), shrinker);
};

const arrayHelper = <A>(trees: Rose<A>[]): Rose<A[]> => {
  const len = trees.length;
  const root = trees.map(RoseTree.root);

  let halved: AsyncIterable<Rose<A[]>>;

  if (len >= 8) {
    halved = Iter.lazy(() => {
      const firstHalf = arrayHelper<A>(Util.take(Math.round(len / 2), trees));
      const secondHalf = arrayHelper<A>(Util.drop(Math.round(len / 2), trees));
      return Iter.from([firstHalf, secondHalf]);
    });
  } else {
    halved = Iter.empty();
  }

  const shrinkOne = (prefix: Rose<A>[], suffix: Rose<A>[]): AsyncIterable<Rose<A[]>> => {
    if (suffix.length === 0) {
      return Iter.empty();
    }

    const [head, ...tail] = suffix;
    const children = RoseTree.children(head);
    return Iter.map(kid => arrayHelper([...prefix, kid, ...tail]), children);
  };

  const remove = <B>(index: number, list: B[]) => [...Util.take(index, list), ...Util.drop(index + 1, list)];

  const shrunkValues = Iter.flatMap<number, Rose<A[]>>(
    i => Iter.lazy(() => shrinkOne(Util.take(i, trees), Util.drop(i, trees))),
    Iter.range(0, len + 1),
  );

  const shortened = Iter.map(xs => arrayHelper(xs), Iter.map(i => remove(i, trees), Iter.range(0, len - 1)));

  /**
   * make sure that the children include an empty iterator so that we can try it on fail as the
   * minimum base case.
   */
  const empty = Iter.of(RoseTree.singleton([]));
  return RoseTree.rose([...root], Iter.concat4(empty, halved, shortened, shrunkValues));
};

export const boolean = () => custom<boolean>(Random.boolean, Shrink.boolean);
export const constant = <A>(value: A) => custom<A>(Random.constant(value as A), () => Iter.of(value));
export const string = stringHelper(Random.string, Shrink.string);
export const asciiString = stringHelper(Random.asciiString, Shrink.string);
export const integer = numberHelper(Random.integer, Shrink.atLeastInteger);
export const float = numberHelper(Random.float, Shrink.atLeastFloat);
export const number = (props: Partial<{ minSize: number; maxSize: number }> = {}) =>
  frequency([[3, integer(props)], [1, float(props)]]);

export const posInteger = (props: Partial<{ maxSize: number }> = {}) => integer({ ...props, minSize: 0 });
export const negInteger = (props: Partial<{ minSize: number }> = {}) => integer({ ...props, maxSize: -0 });
export const posFloat = (props: Partial<{ maxSize: number }> = {}) => float({ ...props, minSize: 0 });
export const negFloat = (props: Partial<{ minSize: number }> = {}) => float({ ...props, maxSize: -0 });
export const posNumber = (props: Partial<{ maxSize: number }> = {}) => number({ ...props, minSize: 0 });
export const negNumber = (props: Partial<{ minSize: number }> = {}) => number({ ...props, maxSize: -0 });

export const array = <A>(fuzzer: Fuzzer<A>, props: Partial<{ maxSize: number }> = {}): Fuzzer<A[]> => {
  const { maxSize = 1e2 } = props;

  invariant(is.number(maxSize), 'maxSize (%s) is not a number', maxSize);
  invariant(maxSize >= 0, 'maxSize (%s) greater than or equal to zero', maxSize);

  const gens: [number, Generator<number>][] = [[1, Random.constant(0)], [1, Random.constant(1)]];

  if (maxSize > 1 && maxSize < 10) {
    gens.push([6, Random.integer(2, maxSize)]);
  } else if (maxSize >= 10 && maxSize < 100) {
    gens.push([6, Random.integer(2, 10)]);
    gens.push([4, Random.integer(10, maxSize)]);
  } else if (maxSize >= 100) {
    gens.push([6, Random.integer(2, 10)]);
    gens.push([4, Random.integer(10, 100)]);
    gens.push([2, Random.integer(100, maxSize)]);
  }

  const generator = Random.map<Rose<A>[], Rose<A[]>>(
    arrayHelper,
    Random.flatMap(len => Random.array(len, fuzzer.generator), Random.frequency(gens)),
  );

  return new Fuzzer(generator);
};

export const object = <A>(obj: { [K in keyof A]: Fuzzer<A[K]> }): Fuzzer<A> => {
  if (Object.keys(obj).length === 0) {
    return constant({}) as Fuzzer<A>;
  }

  const keys = Object.keys(obj) as (keyof A)[];
  const fuzzers = keys.map(key => map(ak => ({ [key]: ak } as { [K in typeof key]: A[K] }), obj[key]));

  return fuzzers.reduce((prev, next) => map2((a, b) => Object.assign({}, a, b), prev, next));
};

export const zip = <A, B>(a: Fuzzer<A>, b: Fuzzer<B>): Fuzzer<[A, B]> => {
  const generator = Random.map2<Rose<A>, Rose<B>, Rose<[A, B]>>(RoseTree.zip, a.generator, b.generator);
  return new Fuzzer(generator);
};

export const zip3 = <A, B, C>(a: Fuzzer<A>, b: Fuzzer<B>, c: Fuzzer<C>): Fuzzer<[A, B, C]> =>
  map2((arr, val) => [...arr, val] as [A, B, C], zip(a, b), c);

export const zip4 = <A, B, C, D>(a: Fuzzer<A>, b: Fuzzer<B>, c: Fuzzer<C>, d: Fuzzer<D>): Fuzzer<[A, B, C, D]> =>
  map2((arr, val) => [...arr, val] as [A, B, C, D], zip3(a, b, c), d);

export const zip5 = <A, B, C, D, E>(
  a: Fuzzer<A>,
  b: Fuzzer<B>,
  c: Fuzzer<C>,
  d: Fuzzer<D>,
  e: Fuzzer<E>,
): Fuzzer<[A, B, C, D, E]> => map2((arr, val) => [...arr, val] as [A, B, C, D, E], zip4(a, b, c, d), e);

export const map = <A, B>(fn: (a: A) => B, a: Fuzzer<A>): Fuzzer<B> => {
  const generator = Random.map(a_ => RoseTree.map(fn, a_), a.generator);
  return new Fuzzer(generator);
};

export const map2 = <A, B, C>(fn: (a: A, b: B) => C, a: Fuzzer<A>, b: Fuzzer<B>): Fuzzer<C> => {
  const generator = Random.map2((a_, b_) => RoseTree.map2(fn, a_, b_), a.generator, b.generator);
  return new Fuzzer(generator);
};

export const filter = <A>(fn: (a: A) => boolean, a: Fuzzer<A>) => {
  const generator = Random.filterMap(a_ => RoseTree.filter(fn, a_), a.generator);
  return new Fuzzer(generator);
};

export const maybe = <A>(a: Fuzzer<A>): Fuzzer<A | void> => frequency([[3, a], [1, constant(undefined)]]);

export const noShrink = <A>(a: Fuzzer<A>): Fuzzer<A> => {
  const generator = Random.flatMap(tree => {
    const root = RoseTree.root(tree);
    return Random.constant(RoseTree.singleton(root));
  }, a.generator);

  return new Fuzzer(generator);
};

export const oneOf = <A>(fuzzers: Fuzzer<A>[]) =>
  frequency(fuzzers.map((fuzzer: Fuzzer<A>): [1, Fuzzer<A>] => [1, fuzzer]));

const flatMapRunAll = <A>(a: AsyncIterable<Fuzzer<Rose<A>>>): Generator<AsyncIterable<Rose<Rose<A>>>> => seed => {
  let seed_ = seed;

  const value = Iter.map<Fuzzer<Rose<A>>, Rose<Rose<A>>>(fuzz => {
    const { value, nextSeed } = fuzz.generator(seed_);
    seed_ = nextSeed;
    return value;
  }, a);

  return {
    value,
    nextSeed: seed_,
  };
};

const flatMapSequenceRose = <A>(a: Rose<Fuzzer<A>>): Fuzzer<Rose<A>> => {
  const root: Fuzzer<A> = RoseTree.root(a);
  const children: AsyncIterable<Fuzzer<Rose<A>>> = Iter.map(a_ => flatMapSequenceRose(a_), RoseTree.children(a));
  const generator = Random.map2((a_, b_) => RoseTree.rose(a_, b_), root.generator, flatMapRunAll(children));
  return new Fuzzer(generator);
};

export const flatMap = <A, B>(fn: (a: A) => Fuzzer<B>, a: Fuzzer<A>): Fuzzer<B> => {
  const generator = Random.flatMap<Rose<A>, Rose<B>>(roseA => {
    const roseGenA = RoseTree.map(fn, roseA);
    const trees = flatMapSequenceRose<B>(roseGenA);
    return Random.map<Rose<Rose<B>>, Rose<B>>(RoseTree.flatten, trees.generator);
  }, a.generator);

  return new Fuzzer(generator);
};
