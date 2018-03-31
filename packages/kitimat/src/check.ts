import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Util from './utilities';
import * as Report from './report';

export const check = async <A>(property: Property.Property<A>, options: Options.Options): Promise<Report.Report<A>> => {
  const events = property(Test.checkRunner, options);
  const result = await Test.aggregateEvents(events);
  const data = Util.last(result.fail);

  // if data is present, the fail aggregate is populated
  // by at least one failing run.
  if (data) {
    return { success: false, property, data, options };
  } else {
    return { success: true, property, options };
  }
};
