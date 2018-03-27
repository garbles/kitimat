import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Util from './utilities';

export type SuccessReport<Args> = {
  success: true;
  options: Options.Options;
  property: Property.Property<Args>;
  numTests: number;
};

export type FailReport<Args> = {
  success: false;
  options: Options.Options;
  property: Property.Property<Args>;
};

export type Report<Args> = SuccessReport<Args> | FailReport<Args>;

export const exists = async <A>(property: Property.Property<A>, options: Options.Options): Promise<Report<A>> => {
  const events = property(Test.existsRunner, options);
  const result = await Test.aggregateEvents(events);

  if (result.success.length > 0) {
    const numTests = result.success.length + result.fail.length;

    return { success: true, property, options, numTests };
  } else {
    return { success: false, property, options };
  }
};
