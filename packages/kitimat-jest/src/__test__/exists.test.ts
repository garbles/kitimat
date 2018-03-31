import { exists } from '../index';
import { exists as thisExists } from '../exists';
import { exists as baseExists } from 'kitimat';

test('make sure that exists exported by index is exists defined in this lib', () => {
  expect(thisExists).toEqual(exists);
  expect(baseExists).not.toEqual(exists);
});
