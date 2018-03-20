import * as RoseTree from './rosetree';
import * as Random from './random';
import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Iter from './iterable';
import * as Util from './utilities';
import { sample } from './sample';

export type Aggregate<Args> = {
  success: Test.SuccessData<Args>[];
  fail: Test.FailData<Args>[];
};

export type SuccessReport<Args> = {
  success: true;
  options: Options.Options;
  property: Property.Property<Args>;
};

export type FailReport<Args> = {
  success: false;
  options: Options.Options;
  property: Property.Property<Args>;
  data: Test.FailData<Args>;
};

export type Report<Args> = SuccessReport<Args> | FailReport<Args>;

const reducer = <A>(acc: Aggregate<A>, event: Test.RunnerEvent<A>): Aggregate<A> => {
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

export const check = async <A>(
  property: Property.Property<A>,
  options_?: Partial<Options.Options>,
): Promise<Report<A>> => {
  const options = Options.normalizeOptions(options_);
  const events = property(options);

  const acc: Aggregate<A> = {
    success: [],
    fail: [],
  };

  const result = await Iter.reduce<Aggregate<A>, Test.RunnerEvent<A>>(reducer, acc, events);
  const data = Util.last(result.fail);

  // if data is present, the fail aggregate is populated
  // by at least one failing run.
  if (data) {
    return { success: false, property, data, options };
  } else {
    return { success: true, property, options };
  }
};
