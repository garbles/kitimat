import * as RoseTree from './rosetree';
import * as Iter from './iterable';

export type TestRun<A> = {
  args: A;
  run(): boolean | Promise<boolean>;
};

export type CompleteEvent = {
  type: 'complete';
};

export type SuccessData<A> = {
  args: A;
  result: true;
  depth: number;
};

export type SuccessEvent<A> = {
  type: 'success';
  data: SuccessData<A>;
};

export type FailData<A> = {
  args: A;
  result: false | Error;
  depth: number;
};

export type FailEvent<A> = {
  type: 'fail';
  data: FailData<A>;
};

type Aggregate<Args> = {
  success: SuccessData<Args>[];
  fail: FailData<Args>[];
};

export type TestRunnerEvent<A> = CompleteEvent | SuccessEvent<A> | FailEvent<A>;

export type Runner<A> = (testRuns: AsyncIterable<RoseTree.Rose<TestRun<A>>>) => AsyncIterable<TestRunnerEvent<A>>;

const reducer = <A>(acc: Aggregate<A>, event: TestRunnerEvent<A>): Aggregate<A> => {
  switch (event.type) {
    case 'fail':
      return {
        ...acc,
        fail: acc.fail.concat(event.data),
      };
    case 'success':
      return {
        ...acc,
        success: acc.success.concat(event.data),
      };

    case 'complete':
      return acc;
  }
};

export const aggregateEvents = <A>(events: AsyncIterable<TestRunnerEvent<A>>): Promise<Aggregate<A>> => {
  const acc = {
    success: [],
    fail: [],
  };

  return Iter.reduce<Aggregate<A>, TestRunnerEvent<A>>(reducer, acc, events);
};

export const checkRunner = <A>(
  testRuns: AsyncIterable<RoseTree.Rose<TestRun<A>>>,
  depth = 0,
): AsyncIterable<TestRunnerEvent<A>> =>
  Iter.create<TestRunnerEvent<A>>(async function*() {
    for await (let testRun of testRuns) {
      const test = await RoseTree.root(testRun);
      let result: boolean | Error;

      try {
        result = await test.run();
      } catch (err) {
        result = err;
      }

      if (result === true) {
        const event: SuccessEvent<A> = {
          type: 'success',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
      } else {
        const event: FailEvent<A> = {
          type: 'fail',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
        const children = RoseTree.children(testRun);
        yield* checkRunner(children, depth + 1);
        return;
      }
    }

    const event: CompleteEvent = {
      type: 'complete',
    };

    yield event;
  });

export const existsRunner = <A>(
  testRuns: AsyncIterable<RoseTree.Rose<TestRun<A>>>,
  depth = 0,
): AsyncIterable<TestRunnerEvent<A>> =>
  Iter.create<TestRunnerEvent<A>>(async function*() {
    for await (let testRun of testRuns) {
      const test = await RoseTree.root(testRun);
      let result: boolean | Error;

      try {
        result = await test.run();
      } catch (err) {
        result = err;
      }

      if (result === true) {
        const event: SuccessEvent<A> = {
          type: 'success',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
        break;
      } else {
        const event: FailEvent<A> = {
          type: 'fail',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
      }
    }

    const event: CompleteEvent = {
      type: 'complete',
    };

    yield event;
  });
