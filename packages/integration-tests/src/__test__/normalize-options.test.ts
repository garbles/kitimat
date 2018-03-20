import * as path from 'path';
import * as fs from 'fs';
import { normalizeOptions } from 'kitimat';

const rcPath = path.join(__dirname, '../../.kitimatrc');

describe('normalizeOptions', () => {
  test('timeout default', () => {
    const { timeout } = normalizeOptions();
    expect(timeout).toEqual(5000);
  });

  test('timeout set manually', () => {
    const { timeout } = normalizeOptions({ timeout: 4000 });
    expect(timeout).toEqual(4000);
  });

  test('seed set manually', () => {
    const { seed } = normalizeOptions({ seed: 0 });
    expect(seed).toEqual(0);
  });

  test('seed set by env', () => {
    const prev = normalizeOptions();
    expect(prev.seed).not.toEqual(111);

    (process.env as any).KITIMAT_SEED = '111';

    const next = normalizeOptions();
    expect(next.seed).toEqual(111);

    delete (process.env as any).KITIMAT_SEED;
  });

  test('seed set by env and manually', () => {
    (process.env as any).KITIMAT_SEED = '222';

    const { seed } = normalizeOptions({ seed: 123 });
    expect(seed).toEqual(222);

    delete (process.env as any).KITIMAT_SEED;
  });

  test('uses the .kitimatrc file', () => {
    const rc = JSON.parse(fs.readFileSync(rcPath).toString());
    const opts = normalizeOptions();

    expect(opts.seed).toEqual(rc.seed);
    expect(opts.maxNumTests).toEqual(rc.maxNumTests);
  });
});
