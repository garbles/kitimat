import * as Fuzz from './fuzz';
import * as Test from './test';
import * as Random from './random';
import * as RoseTree from './rosetree';
import * as Iter from './iterable';
import { Options } from './options';
import { sample } from './sample';
import { Awaitable } from './types';

export type Callback1<A> = (a: A) => Awaitable<boolean>;
export type Callback2<A, B> = (a: A, b: B) => Awaitable<boolean>;
export type Callback3<A, B, C> = (a: A, b: B, c: C) => Awaitable<boolean>;
export type Callback4<A, B, C, D> = (a: A, b: B, c: C, d: D) => Awaitable<boolean>;
export type Callback5<A, B, C, D, E> = (a: A, b: B, c: C, d: D, e: E) => Awaitable<boolean>;
export type Callback = (...args: any[]) => Awaitable<boolean>;

export type Property<A> = (runner: Test.Runner<A>, options: Options) => AsyncIterable<Test.TestRunnerEvent<A>>;

export function property<A>(fuzzers: [Fuzz.Fuzzer<A>], cb: Callback1<A>): Property<[A]>;
export function property<A, B>(fuzzers: [Fuzz.Fuzzer<A>, Fuzz.Fuzzer<B>], cb: Callback2<A, B>): Property<[A, B]>;
export function property<A, B, C>(
  fuzzers: [Fuzz.Fuzzer<A>, Fuzz.Fuzzer<B>, Fuzz.Fuzzer<C>],
  cb: Callback3<A, B, C>,
): Property<[A, B, C]>;
export function property<A, B, C, D>(
  fuzzers: [Fuzz.Fuzzer<A>, Fuzz.Fuzzer<B>, Fuzz.Fuzzer<C>, Fuzz.Fuzzer<D>],
  cb: Callback4<A, B, C, D>,
): Property<[A, B, C, D]>;
export function property<A, B, C, D, E>(
  fuzzers: [Fuzz.Fuzzer<A>, Fuzz.Fuzzer<B>, Fuzz.Fuzzer<C>, Fuzz.Fuzzer<D>, Fuzz.Fuzzer<E>],
  cb: Callback5<A, B, C, D, E>,
): Property<[A, B, C, D, E]>;
export function property(fuzzers: Fuzz.Fuzzer<any>[], cb: Callback): Property<any>;

export function property(fuzzers: Fuzz.Fuzzer<any>[], cb: Callback): Property<any> {
  let fuzzer: Fuzz.Fuzzer<any>;

  switch (fuzzers.length) {
    case 1:
      fuzzer = Fuzz.map(a_ => [a_], fuzzers[0]);
      break;
    case 2:
      fuzzer = Fuzz.zip(fuzzers[0], fuzzers[1]);
      break;
    case 3:
      fuzzer = Fuzz.zip3(fuzzers[0], fuzzers[1], fuzzers[2]);
      break;
    case 4:
      fuzzer = Fuzz.zip4(fuzzers[0], fuzzers[1], fuzzers[2], fuzzers[3]);
      break;
    case 5:
      fuzzer = Fuzz.zip5(fuzzers[0], fuzzers[1], fuzzers[2], fuzzers[3], fuzzers[4]);
      break;
  }

  const toTestRun = (args: any) => ({
    args,
    run: () => cb.apply(null, args),
  });

  return (runner: Test.Runner<any>, options: Options) => {
    const seed = Random.initialSeed(options.seed);
    const trees = Iter.take(options.maxNumTests, sample(fuzzer.generator, seed));
    const testRuns = Iter.map(tree => RoseTree.map(toTestRun, tree), trees);
    return runner(testRuns);
  };
}
