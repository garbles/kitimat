import * as RoseTree from '../rosetree';
import * as Test from '../test';
import * as Iter from '../iterable';

const success = {
  args: [1],
  run() {
    return true;
  },
};

const fail = {
  args: [2],
  run() {
    return false;
  },
};

const error = {
  args: [3],
  run() {
    throw new Error('!!!');
  },
};

type TestEvent = typeof success | typeof fail | typeof error;

const toResult = (arr: [TestEvent, TestEvent[]][]) => {
  return Iter.toArray(
    Test.runner(
      Iter.from(
        arr.map(test => {
          const children = test[1].map(RoseTree.singleton);
          return RoseTree.rose(test[0], Iter.from(children));
        }),
      ),
    ),
  );
};

test('emits success events for success. does not run children if run is successful.', async () => {
  const events = await toResult([
    [success, [success, success]],
    [success, [success, success]],
    [success, [success, success]],
    [success, [success, success]],
    [success, [success, success]],
    [success, [success, success]],
  ]);

  // ignores children because they don't need to be run
  expect(events.filter(e => e.type === 'success')).toHaveLength(6);
  expect(events.filter(e => e.type === 'fail')).toHaveLength(0);
  expect(events.filter(e => e.type === 'complete')).toHaveLength(1);
});

test('emits fail events for child runs on fail. forks to children on first fail.', async () => {
  const events = await toResult([
    [success, [success, success]],
    [success, []],
    [success, []],
    [fail, [success, error]],
    [fail, []],
    [success, []],
    [success, []],
  ]);

  expect(events.filter(e => e.type === 'success')).toHaveLength(4);
  expect(events.filter(e => e.type === 'fail')).toHaveLength(2);
  expect(events.filter(e => e.type === 'complete')).toHaveLength(1);
});
