import * as _ from 'lodash'; // use the lodash implementation as an oracle for testing
import { sample } from './helpers';
import * as Random from '../random';
import * as Iter from '../iterable';

test('scan', async () => {
  const arr = await Iter.toArray(Iter.take(5, Iter.scan(x => x - 1, 10)));

  expect(arr).toEqual([10, 9, 8, 7, 6]);
});

test('take', async () => {
  const fuzz = Random.array(50, Random.integer(0, 2 ** 20));

  for await (let arr of sample(fuzz)) {
    expect(await Iter.toArray(Iter.take(20, Iter.from(arr)))).toEqual(_.take(arr, 20));
  }
});

test('drop', async () => {
  const fuzz = Random.array(50, Random.integer(0, 2 ** 20));

  for await (let arr of sample(fuzz)) {
    expect(await Iter.toArray(Iter.drop(20, Iter.from(arr)))).toEqual(_.drop(arr, 20));
  }
});

test('from', async () => {
  const arr = [1, 2, 3, 4, 5];
  const promArr = arr.map(i => Promise.resolve(i));

  const fromArr = Iter.from(arr);
  const fromPromArr = Iter.from(promArr);

  expect(await Iter.toArray(fromArr)).toEqual(arr);
  expect(await Iter.toArray(fromPromArr)).toEqual(arr);
});

test('map', async () => {
  const fuzz = Random.array(50, Random.integer(0, 2 ** 20));

  for await (let arr of sample(fuzz)) {
    const a = await Iter.toArray<number>(Iter.map<number, number>(x => x + 1, Iter.from(arr)));

    expect(a.length).toEqual(arr.length);

    for (let i in a) {
      expect(a[i] - 1).toEqual(arr[i]);
    }
  }
});

test('map2', async () => {
  const a = Iter.from([1, 2, 3, 4, 5]);
  const b = Iter.from([6, 7, 8]);
  expect(await Iter.toArray(Iter.map2<number, number, number>((a_, b_) => a_ + b_, a, b))).toEqual([7, 9, 11]);
  expect(await Iter.toArray(Iter.map2<number, number, number>((a_, b_) => a_ + b_, b, a))).toEqual([7, 9, 11]);
});

test('concat', async () => {
  const i = Iter.scan(x => x - 1, 10);
  const concatted = Iter.concat(Iter.from([1, 2, 3, 4]), i);
  const taken = Iter.take(7, concatted);

  expect(await Iter.toArray(taken)).toEqual([1, 2, 3, 4, 10, 9, 8]);
});

test('range', async () => {
  expect(await Iter.toArray(Iter.range(10, 15))).toEqual([10, 11, 12, 13, 14]);
  expect(await Iter.toArray(Iter.range(15, 10))).toEqual([10, 11, 12, 13, 14]);
  expect(await Iter.toArray(Iter.range(10, 10))).toEqual([]);
});

test('flatMap', async () => {
  const i = Iter.scan(x => x - 1, 10);
  const takenFirst = Iter.take(7, i);
  const concattedLast = Iter.flatMap<number, number>(x => Iter.from([x, x + 1]), takenFirst);
  const concattedFirst = Iter.flatMap<number, number>(x => Iter.from([x, x + 1]), i);
  const takenLast = Iter.take(7, concattedFirst);

  expect(await Iter.toArray(concattedLast)).toEqual([10, 11, 9, 10, 8, 9, 7, 8, 6, 7, 5, 6, 4, 5]);
  expect(await Iter.toArray(takenLast)).toEqual([10, 11, 9, 10, 8, 9, 7]);
});

test('endless', async () => {
  const iter1234 = Iter.from([1, 2, 3, 4]);
  const endless1234 = Iter.endless(iter1234);
  const taken1234 = Iter.take(13, endless1234);
  const result = await Iter.toArray(taken1234);

  expect(result).toEqual([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1]);

  // an endless iterable of an empty iterable results in []
  expect(await Iter.toArray(Iter.endless(Iter.empty()))).toEqual([]);
});

test('cached', async () => {
  const a = Iter.from([1, 2, 3, 4, 5, 6, 7, 8]);
  const fn = jest.fn((val: number) => val + 1);
  const b = Iter.cached(Iter.map(fn, a));

  const result1 = await Iter.toArray(b);

  expect(result1).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  expect(fn).toHaveBeenCalledTimes(8);

  const result2 = await Iter.toArray(b);

  /**
   * Caching does not change the result
   * and it does not re-run the map function
   */
  expect(result2).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  expect(fn).toHaveBeenCalledTimes(8);

  const c = Iter.take(4, b);
  const result3 = await Iter.toArray(c);

  expect(result3).toEqual([2, 3, 4, 5]);
  expect(fn).toHaveBeenCalledTimes(8);
});
