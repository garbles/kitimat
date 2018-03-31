import * as Test from './test';
import * as Property from './property';
import * as Options from './options';
import * as Util from './utilities';

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

export type Execution = <A>(property: Property.Property<A>, options: Options.Options) => Promise<Report<A>>;
