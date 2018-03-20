import * as _ from 'lodash';
import * as Util from '../utilities';

test('take', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let i = -3;

  while (++i < 12) {
    expect(Util.take(i, arr)).toEqual(_.take(arr, i));
  }
});

test('drop', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let i = -3;

  while (++i < 12) {
    expect(Util.drop(i, arr)).toEqual(_.drop(arr, i));
  }
});
