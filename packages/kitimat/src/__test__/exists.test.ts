import * as _ from 'lodash';

import * as Fuzz from '../fuzz';
import { exists } from '../exists';
import { property } from '../property';

const object = Fuzz.object<{ a: number; b: string }>({
  a: Fuzz.integer({ minSize: 50, maxSize: 200 }),
  b: Fuzz.string({ maxSize: 120 }),
});

const string = Fuzz.string({ maxSize: 70 });

const number = Fuzz.integer({ minSize: 50, maxSize: 200 });

const array = Fuzz.array(Fuzz.integer({ minSize: -1e3, maxSize: 1e3 }), { maxSize: 400 });

test('exists success', async () => {
  const prop = property([object, string, number, array], (a, b, c, d) => typeof a.b === 'string');
  const report = await exists(prop, { seed: 12345678, maxNumTests: 1000 });

  if (!report.success) {
    throw new Error('impossible');
  }

  expect(report.success).toEqual(true);
  expect(report.numTests).toEqual(1);
  expect(report).toMatchSnapshot();
});

test('exists fail', async () => {
  const prop = property([number], num => {
    return num > 200;
  });

  const report = await exists(prop, { seed: 12345678, maxNumTests: 1000 });
  expect(report.success).toEqual(false);
  expect(report).toMatchSnapshot();
});
