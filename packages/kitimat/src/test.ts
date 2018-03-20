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

export type RunnerEvent<A> = CompleteEvent | SuccessEvent<A> | FailEvent<A>;

export const runner = <B>(
  testRuns: AsyncIterable<RoseTree.Rose<TestRun<B>>>,
  depth = 0,
): AsyncIterable<RunnerEvent<B>> =>
  Iter.create<RunnerEvent<B>>(async function*() {
    for await (let testRun of testRuns) {
      const test = RoseTree.root(testRun);
      let result: boolean | Error;

      try {
        result = await test.run();
      } catch (err) {
        result = err;
      }

      if (result === true) {
        const event: SuccessEvent<B> = {
          type: 'success',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
      } else {
        const event: FailEvent<B> = {
          type: 'fail',
          data: {
            args: test.args,
            depth,
            result,
          },
        };

        yield event;
        const children = RoseTree.children(testRun);
        yield* runner(children, depth + 1);
        return;
      }
    }

    const event: CompleteEvent = {
      type: 'complete',
    };

    yield event;
  });
