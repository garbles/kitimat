import * as _ from 'lodash';

import * as Fuzz from '../fuzz';
import { check } from '../check';
import { property } from '../property';

const object = Fuzz.object<{ a: number; b: string }>({
  a: Fuzz.integer({ minSize: 50, maxSize: 200 }),
  b: Fuzz.string({ maxSize: 120 }),
});

const string = Fuzz.string({ maxSize: 70 });

const number = Fuzz.integer({ minSize: 50, maxSize: 200 });

const array = Fuzz.array(Fuzz.integer({ minSize: -1e3, maxSize: 1e3 }), { maxSize: 400 });

test('check success', async () => {
  const prop = property([object, string, number, array], (a, b, c, d) => typeof a.b === 'string');
  const report = await check(prop, { seed: 12345678, maxNumTests: 1000 });
  expect(report).toMatchSnapshot();
});

test('check fail', async () => {
  const brokenSort = (arr: number[]) => _.uniq(_.sortBy(arr));

  const prop = property([array], arr => {
    const sorted = brokenSort(arr);
    return sorted.length === arr.length;
  });
  const report = await check(prop, { seed: 12345678, maxNumTests: 1000 });
  expect(report).toMatchSnapshot();
});
