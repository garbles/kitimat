import { property, Fuzzer, Rose, Options, normalizeOptions, check as baseCheck } from 'kitimat';

interface JestSpec {
  addExpectationResult(passed: boolean, matcherResult: {}, isError: boolean): void;
  result: {
    description: string;
  };
}

interface JestError extends Error {
  matcherResult: {
    matcherName: string;
    expected: any;
    actual: any;
  };
}

interface JestResult {
  passed: boolean;
  error: Error | false;
  matcherName?: string;
  expected?: any;
  actual?: any;
}

const isJestError = (err: any): err is JestError => {
  return err instanceof Error && err.hasOwnProperty('matcherResult');
};

class Defer {
  private _resolve: () => void;
  private _promise: Promise<any>;

  constructor() {
    this._resolve = () => {};

    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
    });
  }

  wait = () => {
    return this._promise;
  };

  resolve = () => {
    this._resolve();
  };
}

// TODO:
// - should find a way to print the input and seed if it times out
// - can you make expect.assertions work?
const wrapCallback = (cb: CBAny<void>, hasDone: boolean): CBAny<boolean> => {
  if (!hasDone) {
    /**
     * If the callback doesn't use "done", then just make sure that we return true
     */
    return async (...args: any[]) => {
      await cb(...args);
      return true;
    };
  }

  /**
   * If the callback does use "done", then we should defer proceeding
   * to the next spec until it is called
   */
  return async (...args: any[]) => {
    const defer = new Defer();

    try {
      await cb(...args, defer.resolve);
      await defer.wait();
    } catch (err) {
      throw err;
    }

    return true;
  };
};

export type Awaitable<A> = A | Promise<A>;
export type Done = () => void;
export type CB1<A, B> = (a: A) => Awaitable<B>;
export type CB2<A, B, C> = (a: A, b: B) => Awaitable<C>;
export type CB3<A, B, C, D> = (a: A, b: B, c: C) => Awaitable<D>;
export type CB4<A, B, C, D, E> = (a: A, b: B, c: C, d: D) => Awaitable<E>;
export type CB5<A, B, C, D, E, F> = (a: A, b: B, c: C, d: D, e: E) => Awaitable<F>;
export type CB6<A, B, C, D, E, F, G> = (a: A, b: B, c: C, d: D, e: E, f: F) => Awaitable<G>;
export type CBAny<A> = (...args: any[]) => Awaitable<A>;

export interface Check {
  <A>(description: string, fuzzers: [Fuzzer<A>], cb: CB2<A, Done, void>, options?: Partial<Options>): void;
  <A>(description: string, fuzzers: [Fuzzer<A>], cb: CB1<A, void>, options?: Partial<Options>): any;
  <A, B>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>],
    cb: CB3<A, B, Done, void>,
    options?: Partial<Options>,
  ): void;
  <A, B>(description: string, fuzzers: [Fuzzer<A>, Fuzzer<B>], cb: CB2<A, B, void>, options?: Partial<Options>): void;
  <A, B, C>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>],
    cb: CB4<A, B, C, Done, void>,
    options?: Partial<Options>,
  ): void;
  <A, B, C>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>],
    cb: CB3<A, B, C, void>,
    options?: Partial<Options>,
  ): void;
  <A, B, C, D>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>, Fuzzer<D>],
    cb: CB5<A, B, C, D, Done, void>,
    options?: Partial<Options>,
  ): void;
  <A, B, C, D>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>, Fuzzer<D>],
    cb: CB4<A, B, C, D, void>,
    options?: Partial<Options>,
  ): void;
  <A, B, C, D, E>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>, Fuzzer<D>, Fuzzer<E>],
    cb: CB6<A, B, C, D, E, Done, void>,
    options?: Partial<Options>,
  ): void;
  <A, B, C, D, E>(
    description: string,
    fuzzers: [Fuzzer<A>, Fuzzer<B>, Fuzzer<C>, Fuzzer<D>, Fuzzer<E>],
    cb: CB5<A, B, C, D, E, void>,
    options?: Partial<Options>,
  ): void;
}

export interface ExtendedCheck extends Check {
  skip: Check;
  only: Check;
}

const createCheck = (it_: jest.It): Check => (
  description: string,
  fuzzers: Fuzzer<any>[],
  cb: CBAny<void>,
  checkOptions: Partial<Options> = {},
) => {
  const { seed, seedSource, maxNumTests, timeout } = normalizeOptions(checkOptions);

  const hasDone = cb.length > fuzzers.length;
  const wrapper = wrapCallback(cb, hasDone);
  const property_ = property(fuzzers, wrapper);

  const spec: JestSpec = <any>it_(
    description,
    async () => {
      const report = await baseCheck(property_, { seed, maxNumTests });

      if (report.success === false) {
        const error = report.data.result;

        let result: JestResult = {
          passed: false,
          error: report.data.result,
        };

        if (isJestError(error)) {
          const matcherResult = error.matcherResult;

          result.matcherName = matcherResult.matcherName;
          result.expected = matcherResult.expected;
          result.actual = matcherResult.actual;
        }

        spec.result.description += ` (seed: ${seed}, source: ${seedSource})`;
        spec.addExpectationResult(false, result, false);
      }
    },
    timeout,
  );
};

export const check = createCheck(it) as ExtendedCheck;
check.skip = createCheck(it.skip);
check.only = createCheck(it.only);
