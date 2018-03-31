import { check as baseCheck } from 'kitimat';
import * as It from './it';

const exe: It.Execution = async (spec, property, options) => {
  const report = await baseCheck(property, options);

  if (report.success === false) {
    const error = report.data.result;

    let result: It.JestResult = {
      passed: false,
      error: report.data.result,
    };

    if (It.isJestError(error)) {
      const matcherResult = error.matcherResult;

      result.matcherName = matcherResult.matcherName;
      result.expected = matcherResult.expected;
      result.actual = matcherResult.actual;
    }

    spec.result.description += ` (seed: ${options.seed}, source: ${options.seedSource})`;
    spec.addExpectationResult(false, result, false);
  }
};

export const check = It.wrap(it, exe) as It.Extended;
check.skip = It.wrap(it.skip, exe);
check.only = It.wrap(it.only, exe);
