import { check } from '../index';
import { check as thisCheck } from '../check';
import { check as baseCheck } from 'kitimat';

test('make sure that check exported by index is check defined in this lib', () => {
  expect(thisCheck).toEqual(check);
  expect(baseCheck).not.toEqual(check);
});
