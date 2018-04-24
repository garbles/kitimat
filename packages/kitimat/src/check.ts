import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Util from './utilities';
import * as Report from './report';

export const check = async <A>(property: Property.Property<A>, options: Options.Options): Promise<Report.Report<A>> => {
  const events = property(Test.checkRunner, options);
  const result = await Test.aggregateEvents(events);
  const first = Util.first(result.fail);
  const last = Util.last(result.fail);

  // if first is present, the fail aggregate is populated
  // by at least one failing run.
  if (first && last) {
    const data = {
      first,
      last,
    };

    return { success: false, property, data, options };
  } else {
    return { success: true, property, options };
  }
};
