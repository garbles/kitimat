import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Util from './utilities';
import * as Report from './report';

export const exists = async <A>(
  property: Property.Property<A>,
  options: Options.Options,
): Promise<Report.Report<A>> => {
  const events = property(Test.existsRunner, options);
  const result = await Test.aggregateEvents(events);

  if (result.success.length > 0) {
    return { success: true, property, options };
  } else {
    const data = Util.last(result.fail)!;
    return { success: false, property, options, data };
  }
};
