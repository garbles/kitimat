import { sample } from './helpers';
import * as Random from '../random';
import * as Iter from '../iterable';

const DEVIATION = 0.05;

const staticSeed = Random.initialSeed(1514568898760);
const randomSeed = Random.initialSeed(Date.now());

describe('unit', () => {
  test('sample/integer', async () => {
    const integer = Random.integer(-1e9, 1e9);

    const result = await Iter.toArray(sample(integer, 20, staticSeed));
    expect(result).toMatchSnapshot();
    expect(result.length).toEqual(20);
  });

  test('float', async () => {
    const float = Random.float(-1e9, 1e9);
    expect(await Iter.toArray(sample(float, 20, staticSeed))).toMatchSnapshot();
  });

  test('boolean', async () => {
    const boolean = Random.boolean;
    expect(await Iter.toArray(sample(boolean, 20, staticSeed))).toMatchSnapshot();
  });

  test('string', async () => {
    const string = Random.string(0, 10);
    expect(await Iter.toArray(sample(string, 20, staticSeed))).toMatchSnapshot();
  });

  test('array<integer>', async () => {
    const array = Random.array(10, Random.integer(-100, 100));
    expect(await Iter.toArray(sample(array, 20, staticSeed))).toMatchSnapshot();
  });

  test('filter', async () => {
    const integer = Random.integer(-100, 100);
    const integerArray = Random.array(100, integer);
    const gtZero = Random.filter(x => x > 0, integer);
    const gtZeroArray = Random.array(100, gtZero);

    const { value: ints, nextSeed: intLastSeed } = await integerArray(staticSeed);
    const { value: posInts, nextSeed: posIntLastSeed } = await gtZeroArray(staticSeed);

    expect(ints.some(x => x < 0)).toBe(true);
    expect(posInts.every(x => x > 0)).toBe(true);
    expect(ints).not.toEqual(posInts);
    expect(intLastSeed).not.toEqual(posIntLastSeed);
  });

  test('weighted', async () => {
    const generator = Random.frequency<boolean | string>([
      [1, Random.constant(true)],
      [2, Random.constant(false)],
      [6, Random.string(0, 40)],
    ]);

    expect(await Iter.toArray(sample(generator, 20, staticSeed))).toMatchSnapshot();
  });

  test('flatMap', async () => {
    const integer = Random.integer(-100, 100);
    const boolean = Random.flatMap(i => (i > 50 ? Random.constant(true) : Random.constant(false)), integer);
    const result = await Iter.toArray(sample(boolean, 20, staticSeed));

    expect(result).toMatchSnapshot();
    expect(result.every(x => typeof x === 'boolean')).toBe(true);
  });
});

describe('property', () => {
  test('integer where min and max are the same', async () => {
    const integer = Random.integer(10, 10);
    const { value } = await integer(randomSeed);
    expect(value).toEqual(10);
  });

  test('integer is within bounds', async () => {
    const min = -10;
    const max = 10;
    const integer = Random.integer(min, max);
    const { value } = await integer(randomSeed);
    expect(value).toBeLessThanOrEqual(max);
    expect(value).toBeGreaterThanOrEqual(min);
  });

  test('float is within bounds', async () => {
    const min = -1;
    const max = 1;
    const float = Random.float(min, max);
    const { value } = await float(randomSeed);
    expect(value).toBeLessThanOrEqual(max);
    expect(value).toBeGreaterThanOrEqual(min);
  });

  test('average integer is approximately (min + max) / 2', async () => {
    const runs = 1e4;
    let total = 0;
    const integer = Random.integer(-100, 100);
    const expected = 0;

    for await (let n of sample(integer, runs)) {
      total += n;
    }

    const average = total / runs;

    expect(average).toBeLessThan(expected + runs * DEVIATION);
    expect(average).toBeGreaterThan(expected - runs * DEVIATION);
  });

  test('average float is approximately (min + max) / 2', async () => {
    const runs = 1e4;
    let total = 0;
    const integer = Random.float(0, 200);
    const expected = 100;

    for await (let n of sample(integer, runs)) {
      total += n;
    }

    const average = total / runs;

    expect(average).toBeLessThan(expected + runs * DEVIATION);
    expect(average).toBeGreaterThan(expected - runs * DEVIATION);
  });

  test('same number of trues as falses', async () => {
    let average = 0;
    const runs = 1e4;

    for await (let n of sample(Random.boolean, runs)) {
      average += n ? 1 : -1;
    }

    expect(average).toBeLessThan(runs * DEVIATION);
    expect(average).toBeGreaterThan(-runs * DEVIATION);
  });

  test('weighted generators should return weighted results', async () => {
    const counts: { [key in 'true' | 'false' | 'undefined']: number } = {
      true: 0,
      false: 0,
      undefined: 0,
    };

    const runs = 1e4;
    const tWeight = 1;
    const fWeight = 4;
    const uWeight = 2;

    const generator = Random.frequency<boolean | void>([
      [tWeight, Random.constant(true)],
      [fWeight, Random.constant(false)],
      [uWeight, Random.constant(undefined)],
    ]);

    for await (let n of sample(generator, runs)) {
      counts[JSON.stringify(n) as 'true' | 'false' | 'undefined'] += 1;
    }

    const tExpected = runs * (tWeight / 7);
    const fExpected = runs * (fWeight / 7);
    const uExpected = runs * (uWeight / 7);

    expect(counts.true).toBeLessThan(tExpected + runs * DEVIATION);
    expect(counts.true).toBeGreaterThan(tExpected - runs * DEVIATION);
    expect(counts.false).toBeLessThan(fExpected + runs * DEVIATION);
    expect(counts.false).toBeGreaterThan(fExpected - runs * DEVIATION);
    expect(counts.undefined).toBeLessThan(uExpected + runs * DEVIATION);
    expect(counts.undefined).toBeGreaterThan(uExpected - runs * DEVIATION);
  });
});
