export type Seed = { state: number; increment: number };

export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;

export type Result<A> = {
  value: A;
  nextSeed: Seed;
};

export type Generator<A> = (seed: Seed) => Promise<Result<A>>;

const next = (seed: Seed): Seed => {
  const { state, increment } = seed;
  // The magic constant is from Numerical Recipes and is inlined for perf.
  const next = (state * 1664525 + increment) >>> 0;
  return { state: next, increment };
};

const peel = (seed: Seed): number => {
  const { state } = seed;
  const word = ((state >>> ((state >>> 28) + 4)) ^ state) * 277803737;
  return ((word >>> 22) | word) >>> 0;
};

export const initialSeed = (x: number): Seed => {
  // The magic constant is from Numerical Recipes and is inlined for perf.
  const seed: Seed = next({ state: 0, increment: 1013904223 });
  const state2 = seed.state + (x >>> 0);
  return next({ state: state2, increment: seed.increment });
};

export const flatMap = <A, B>(fn: (a: A) => Generator<B>, a: Generator<A>): Generator<B> => async seed => {
  const { value, nextSeed } = await a(seed);
  const nextGen = fn(value);
  return nextGen(nextSeed);
};

export const map = <A, B>(fn: (a: A) => B | Promise<B>, a: Generator<A>): Generator<B> => async seed => {
  const { value, nextSeed } = await a(seed);
  return { value: await fn(value), nextSeed };
};

export const map2 = <A, B, C>(
  fn: (a: A, b: B) => C | Promise<C>,
  a: Generator<A>,
  b: Generator<B>,
): Generator<C> => async seed => {
  const { value: valA, nextSeed: seedA } = await a(seed);
  const { value: valB, nextSeed: seedB } = await b(seedA);
  return { value: await fn(valA, valB), nextSeed: seedB };
};

export const frequency = <A>(pairs: [number, Generator<A>][]): Generator<A> => {
  let total = 0;
  let totaledWeights: [number, Generator<A>][] = [];
  let i = -1;

  for (let pair of pairs) {
    total = pair[0] + total;
    const next: [number, Generator<A>] = [total, pair[1]];
    totaledWeights = [...totaledWeights, next];
  }

  const generator = integer(0, total - 1);

  return async seed => {
    const { value: pick, nextSeed } = await generator(seed);

    for (let pair of totaledWeights) {
      if (pair[0] > pick) {
        return pair[1](nextSeed);
      }
    }

    // impossible
    return totaledWeights[0][1](nextSeed);
  };
};

export const array = <A>(maxLen: number, gen: Generator<A>): Generator<A[]> => {
  const sizeGenerator = integer(0, maxLen);

  return async seed => {
    let i = -1;
    let xs: A[] = [];

    let { value: size, nextSeed } = await sizeGenerator(seed);

    while (++i < size) {
      const result = await gen(nextSeed);
      nextSeed = result.nextSeed;
      xs = xs.concat(result.value);
    }

    return { value: xs, nextSeed };
  };
};

export const constant = <A>(value: A): Generator<A> => async nextSeed => {
  return { value, nextSeed };
};

export const filter = <A>(fn: (a: A) => boolean, a: Generator<A>): Generator<A> => seed_ => {
  const tryNext: Generator<A> = async seed => {
    const { value, nextSeed } = await a(seed);
    return fn(value) === true ? { value, nextSeed } : tryNext(nextSeed);
  };

  return tryNext(seed_);
};

export const filterMap = <A>(fn: (a: A) => A | void, a: Generator<A>): Generator<A> => seed_ => {
  const tryNext: Generator<A> = async seed => {
    const { value, nextSeed } = await a(seed);
    const nextValue = fn(value);

    return nextValue !== undefined ? { value: nextValue, nextSeed } : tryNext(nextSeed);
  };

  return tryNext(seed_);
};

export const integer = (a: number, b: number): Generator<number> => async seed => {
  let min: number;
  let max: number;

  if (a < b) {
    min = a;
    max = b;
  } else {
    min = b;
    max = a;
  }

  const range = max - min + 1;

  // this is the same as asking, "is range a power of 2?""
  // we do this because the power of 2 path is 150% faster than if it isn't
  if (((range - 1) & range) === 0) {
    const value = ((peel(seed) & (range - 1)) >>> 0) + min;
    return { value, nextSeed: next(seed) };
  }

  const threshold = ((-range >>> 0) % range) >>> 0;

  const accountForBias = (seed: Seed): Result<number> => {
    const x = peel(seed);
    const nextSeed = next(seed);

    if (x < threshold) {
      return accountForBias(nextSeed);
    } else {
      return { value: x % range + min, nextSeed };
    }
  };

  return accountForBias(seed);
};

export const float = (min: number, max: number): Generator<number> => async seed => {
  const bit53 = 9007199254740992;
  const bit27 = 134217728;
  const nextSeed = next(seed);
  const n0 = peel(seed);
  const n1 = peel(nextSeed);

  const high = n0 & 0x03ffffff;
  const low = n1 & 0x07ffffff;

  const val = (high * bit27 + low) / bit53;
  const range = Math.abs(max - min);
  const scaled = val * range + min;

  return { value: scaled, nextSeed: next(nextSeed) };
};

export const boolean: Generator<boolean> = map(i => i === 1, integer(0, 1));

export const character = (minCharacter: number, maxCharacter: number): Generator<string> =>
  map(i => String.fromCharCode(i), integer(minCharacter, maxCharacter));

export const asciiCharacter = character(32, 126);

export const string = (minSize: number, maxSize: number): Generator<string> =>
  map(chars => chars.join(''), flatMap(size => array(size, character(32, 255)), integer(minSize, maxSize)));

export const asciiString = (minSize: number, maxSize: number): Generator<string> =>
  map(chars => chars.join(''), flatMap(size => array(size, asciiCharacter), integer(minSize, maxSize)));

export const sample = <A>(constants: A[]): Generator<A> => {
  const pairs = constants.map<[number, Generator<A>]>(c => [1, constant(c)]);
  return frequency(pairs);
};

export const whitespaceCharacter = sample([' ', '\t', '\n']);

export const whitespace: Generator<string> = map(
  chars => chars.join(''),
  flatMap(size => array(size, whitespaceCharacter), integer(1, 10)),
);
