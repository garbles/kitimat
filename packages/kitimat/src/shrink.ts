import * as Iter from './iterable';
import * as Util from './utilities';

export type Shrinker<A> = (a: A) => AsyncIterable<A>;

const convert = <A, B>(bToA: (b: B) => A, aToB: (a: A) => B, shrinker: Shrinker<A>): Shrinker<B> => (b: B) =>
  Iter.map(i => aToB(i), shrinker(bToA(b)));

export const boolean: Shrinker<boolean> = n => {
  if (n === true) {
    return Iter.of(false);
  }

  return Iter.empty();
};

const seriesInt = (low: number, high: number): AsyncIterable<number> =>
  Iter.create<number>(async function*() {
    if (low >= high) {
      return;
    }

    yield low;

    if (low === high - 1) {
      return;
    }

    const next = low + Math.round((high - low) / 2);
    yield* seriesInt(next, high);
  });

const seriesFloat = (low: number, high: number): AsyncIterable<number> =>
  Iter.create<number>(async function*() {
    if (low >= high - 0.0001) {
      if (high !== 0.000001) {
        yield low;
      }

      return;
    }

    yield low;

    const next = low + (high - low) / 2;
    yield* seriesFloat(next, high);
  });

type SeriesFunction = (low: number, high: number) => AsyncIterable<number>;

const numberHelper = (makeSeries: SeriesFunction) => (pivot: number): Shrinker<number> => n => {
  if (pivot === 0 && n === 0) {
    return Iter.empty();
  }

  // go toward pivot from negative but end at zero
  if (pivot >= 0 && n < 0) {
    return Iter.map(m => -1 * m, makeSeries(0, -n));
  }

  // go toward pivot from positive but end at zero
  if (pivot < 0 && n >= 0) {
    return makeSeries(0, n);
  }

  // both pivot and n are positive, so n goes toward n
  if (pivot >= 0 && n >= 0) {
    if (n > pivot) {
      // pivot is less than n, so just start with pivot and go to n
      return makeSeries(pivot, n);
    } else {
      // pivot is greater than n, make them both negative so that
      // negative pivot is less than negative n (so that we start with
      // the pivot). make series, then map all by -1.
      return Iter.map(m => -1 * m, makeSeries(-pivot, -n));
    }
  }

  if (pivot < 0 && n < 0) {
    if (n > pivot) {
      return makeSeries(pivot, n);
    } else {
      return Iter.map(m => -1 * m, makeSeries(-pivot, -n));
    }
  }

  // impossible
  return Iter.empty();
};

export const atLeastInteger = numberHelper(seriesInt);
export const atLeastFloat = numberHelper(seriesFloat);

export const atLeastCharacter = (int: number): Shrinker<string> =>
  convert<number, string>((str: string) => str.charCodeAt(0), String.fromCharCode, atLeastInteger(int));

export const character: Shrinker<string> = atLeastCharacter(32);

export const array = <A>(shrinker: Shrinker<A>): Shrinker<A[]> => {
  const shrinkOne = (l: A[]): AsyncIterable<A[]> => {
    if (l.length === 0) {
      return Iter.empty();
    }

    const [head, ...tail] = l;
    return Iter.concat(Iter.map(a => [a, ...tail], shrinker(head)), Iter.map(arr => [head, ...arr], shrinkOne(tail)));
  };

  const removes = <B>(size: number, arrayLength: number, arr: B[]): AsyncIterable<B[]> => {
    if (size > arrayLength) {
      return Iter.empty();
    } else {
      const first = Util.take(size, arr);
      const rest = Util.drop(size, arr);
      const recursed = removes(size, arrayLength - size, rest);
      const appended = Iter.map<B[], B[]>(xs => [...xs, ...first], recursed);
      return Iter.cons(rest, appended);
    }
  };

  const makeRemovable = <B>(a: B[]): AsyncIterable<B[]> =>
    Iter.create<B[]>(async function*() {
      let len = a.length;
      const initLen = len;
      while (len > 0) {
        yield* removes(len, initLen, a);
        len = Math.floor(len / 2);
      }
    });

  return (a: A[]): AsyncIterable<A[]> => {
    const removable = makeRemovable(a);
    const shrunkOne = shrinkOne(a);
    return Iter.concat(removable, shrunkOne);
  };
};

export const string = convert<string[], string>(
  (str: string) => str.split(''),
  (arr: string[]) => arr.join(''),
  array(character),
);
