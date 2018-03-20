import * as path from 'path';
import * as is from './is';
import cosmiconfig = require('cosmiconfig');

export interface Options {
  maxNumTests: number;
  seed: number;
  timeout: number; // jest
  seedSource: string;
}

// If a seed is not specified then it should
// be the same for all tests
const defaults: Options = {
  timeout: 5000,
  maxNumTests: 100,
  seed: Date.now(),
  seedSource: 'Date.now()',
};

const rcConfig = (): Partial<Options> => {
  const configLoader = cosmiconfig<Options>('kitimat', { sync: true });
  const result = configLoader.load();

  if (!is.object(result)) {
    return {};
  }

  const { maxNumTests, seed, timeout } = result.config;

  return Object.assign(
    {},
    is.number(seed) ? { seed, seedSource: path.relative(process.cwd(), result.filepath) } : {},
    is.number(maxNumTests) ? { maxNumTests } : {},
    is.number(timeout) ? { timeout } : {},
  );
};

const envConfig = (): Partial<Options> => {
  if (process.env.KITIMAT_SEED) {
    return { seed: parseInt(process.env.KITIMAT_SEED, 10), seedSource: 'process.env.KITIMAT_SEED' };
  } else {
    return {};
  }
};

export const normalizeOptions = <T = {}>(temp: Partial<Options & T> = {}): Options & T => {
  const rc = rcConfig();
  const env = envConfig();

  return Object.assign({}, defaults, rc, temp, env) as Options & T;
};
