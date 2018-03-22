import * as path from 'path';
import * as fs from 'fs';
import { Options } from 'kitimat';

const rcPath = path.join(__dirname, '../../.kitimatrc');

describe('Options.normalizeOptions', () => {
  test('timeout default', () => {
    const { timeout } = Options.normalizeOptions();
    expect(timeout).toEqual(5000);
  });

  test('timeout set manually', () => {
    const { timeout } = Options.normalizeOptions({ timeout: 4000 });
    expect(timeout).toEqual(4000);
  });

  test('seed set manually', () => {
    const { seed } = Options.normalizeOptions({ seed: 0 });
    expect(seed).toEqual(0);
  });

  test('seed set by env', () => {
    const prev = Options.normalizeOptions();
    expect(prev.seed).not.toEqual(111);

    (process.env as any).KITIMAT_SEED = '111';

    const next = Options.normalizeOptions();
    expect(next.seed).toEqual(111);

    delete (process.env as any).KITIMAT_SEED;
  });

  test('seed set by env and manually', () => {
    (process.env as any).KITIMAT_SEED = '222';

    const { seed } = Options.normalizeOptions({ seed: 123 });
    expect(seed).toEqual(222);

    delete (process.env as any).KITIMAT_SEED;
  });

  test('uses the .kitimatrc file', () => {
    const rc = JSON.parse(fs.readFileSync(rcPath).toString());
    const opts = Options.normalizeOptions();

    expect(opts.seed).toEqual(rc.seed);
    expect(opts.maxNumTests).toEqual(rc.maxNumTests);
  });
});
