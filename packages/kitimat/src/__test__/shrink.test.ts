import * as Iter from '../iterable';
import * as Shrink from '../shrink';

const lessThanVal = (n: number) => (m: number) => {
  expect(m).toBeLessThan(n);
};

const greaterThanVal = (n: number) => (m: number) => {
  expect(m).toBeGreaterThan(n);
};

test('boolean', async () => {
  const sTrue = await Iter.toArray(Shrink.boolean(true));
  const sFalse = await Iter.toArray(Shrink.boolean(false));

  expect(sTrue).toEqual([false]);
  expect(sFalse).toEqual([]);
});

test('integer', async () => {
  const s20 = await Iter.toArray(Shrink.atLeastInteger(0)(20));
  const sNeg10 = await Iter.toArray(Shrink.atLeastInteger(0)(-10));
  const s5000 = await Iter.toArray(Shrink.atLeastInteger(0)(5e3));
  const s0 = await Iter.toArray(Shrink.atLeastInteger(0)(0));

  expect(s20[0]).toEqual(0);
  expect(sNeg10[0]).toEqual(-0);
  expect(s5000[0]).toEqual(0);
  expect(s0).toEqual([]);

  s20.forEach(lessThanVal(20));
  sNeg10.forEach(greaterThanVal(-10));
  s5000.forEach(lessThanVal(5000));

  expect(s20).toMatchSnapshot();
  expect(sNeg10).toMatchSnapshot();
  expect(s5000).toMatchSnapshot();
});

test('atLeastInteger 2', async () => {
  const bet5and20 = await Iter.toArray(Shrink.atLeastInteger(5)(20));
  const bet1and10 = await Iter.toArray(Shrink.atLeastInteger(1)(10));
  const bet9and10 = await Iter.toArray(Shrink.atLeastInteger(9)(10));
  const betNeg5andNeg10 = await Iter.toArray(Shrink.atLeastInteger(-5)(-10));
  const bet5andNeg20 = await Iter.toArray(Shrink.atLeastInteger(5)(-20));

  expect(bet5and20.length).toBeGreaterThan(0);
  bet5and20.forEach(greaterThanVal(4));
  bet5and20.forEach(lessThanVal(20));

  expect(bet1and10.length).toBeGreaterThan(0);
  bet1and10.forEach(greaterThanVal(0));
  bet1and10.forEach(lessThanVal(10));

  expect(bet9and10.length).toBeGreaterThan(0);
  bet9and10.forEach(greaterThanVal(8));
  bet9and10.forEach(lessThanVal(10));

  expect(betNeg5andNeg10.length).toBeGreaterThan(0);
  betNeg5andNeg10.forEach(greaterThanVal(-11));
  betNeg5andNeg10.forEach(lessThanVal(-4));

  expect(bet5andNeg20.length).toBeGreaterThan(0);
  bet5andNeg20.forEach(greaterThanVal(-21));
  bet5andNeg20.forEach(lessThanVal(5));

  expect(bet5and20).toMatchSnapshot();
  expect(bet1and10).toMatchSnapshot();
  expect(bet9and10).toMatchSnapshot();
  expect(betNeg5andNeg10).toMatchSnapshot();
  expect(bet5andNeg20).toMatchSnapshot();
});

test('float', async () => {
  const sA = await Iter.toArray(Shrink.atLeastFloat(0)(20.5));
  const sB = await Iter.toArray(Shrink.atLeastFloat(0)(-10.1));

  expect(sA[0]).toEqual(0);
  expect(sB[0]).toEqual(-0);

  sA.forEach(lessThanVal(20.5));
  sB.forEach(greaterThanVal(-10.1));

  expect(sA).toMatchSnapshot();
  expect(sB).toMatchSnapshot();
});

test('atLeastFloat 2', async () => {
  expect(await Iter.toArray(Shrink.atLeastFloat(10.1)(20.5))).toMatchSnapshot();
  expect(await Iter.toArray(Shrink.atLeastFloat(-5)(-10))).toMatchSnapshot();
  expect(await Iter.toArray(Shrink.atLeastFloat(5)(-20))).toMatchSnapshot();
  expect(await Iter.toArray(Shrink.atLeastFloat(-1)(5))).toMatchSnapshot();
});

test('char/atLeastChar/character', async () => {
  expect(await Iter.toArray(Shrink.character('Z'))).toMatchSnapshot();
});

test('array', async () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const sArr = await Iter.toArray(Shrink.array(Shrink.atLeastInteger(0))(arr));

  sArr.forEach((a: number[]) => {
    expect(Array.isArray(a)).toEqual(true);
    expect(a.length).toBeLessThanOrEqual(arr.length);
  });

  expect(sArr.some((a: number[]) => a.length < arr.length)).toEqual(true);
  expect(sArr[0]).toEqual([]);
  expect(sArr).toMatchSnapshot();
});

test('string', async () => {
  const str = 'gabe1234567890qq';
  const sStr = await Iter.toArray(Shrink.string(str));

  sStr.forEach((s: string) => {
    expect(s.length).toBeLessThanOrEqual(str.length);
  });

  expect(sStr.some((s: string) => s.length < str.length)).toEqual(true);
  expect(sStr[0]).toEqual('');
  expect(sStr).toMatchSnapshot();
});
