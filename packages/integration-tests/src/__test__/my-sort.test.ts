import { check, integer, array } from 'kitimat-jest';
import { sort } from '../my-sort';

it('sorts some numbers', () => {
  const sorted = sort([6, 1, 2]);
  expect(sorted).toEqual([1, 2, 6]);
});

check('length does not change', [array(integer())], arr => {
  const sorted = sort(arr);
  expect(sorted.length).toEqual(arr.length);
});

check('idempotent', [array(integer())], arr => {
  const once = sort(arr);
  const twice = sort(sort(arr));
  expect(once).toEqual(twice);
});

check('ordered', [array(integer())], arr => {
  const sorted = sort(arr);
  for (let i = 0; i < sorted.length - 1; i++) {
    const prev = sorted[i];
    const next = sorted[i + 1];
    expect(prev).toBeLessThanOrEqual(next);
  }
});
