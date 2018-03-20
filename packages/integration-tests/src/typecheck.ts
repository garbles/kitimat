import {
  check,
  Fuzzer,
  boolean,
  constant,
  integer,
  float,
  string,
  asciiString,
  posInteger,
  negInteger,
  posFloat,
  negFloat,
  array,
  object,
  zip,
  zip3,
  zip4,
  zip5,
  map,
  map2,
  filter,
  frequency,
  maybe,
  noShrink,
  oneOf,
  flatMap,
} from 'kitimat-jest';

const a: Fuzzer<boolean> = boolean();
const b: Fuzzer<number> = constant(123);
const c: Fuzzer<number> = integer();
const d: Fuzzer<number> = float();
const e: Fuzzer<string> = string();
const f: Fuzzer<string> = asciiString();
const g: Fuzzer<number> = posInteger();
const h: Fuzzer<number> = negInteger();
const i: Fuzzer<number> = posFloat();
const j: Fuzzer<number> = negFloat();
const k: Fuzzer<boolean[]> = array(boolean());
const l: Fuzzer<{ a: string; b: number[] }> = object({ a: string(), b: array(integer()) });
const m: Fuzzer<[number, string]> = zip(float(), string());
const n: Fuzzer<[number, number, number]> = zip3(float(), float(), float());
const o: Fuzzer<[number, number, number, number]> = zip4(float(), float(), float(), float());
const p: Fuzzer<[number, number, number, number, number]> = zip5(float(), float(), float(), float(), float());
const q: Fuzzer<string> = g.map(num => num.toString());
const r: Fuzzer<string> = map2((a, b) => '' + a + b, integer(), integer());
const s: Fuzzer<number> = g.filter(num => num > 5);
const t: Fuzzer<number> = frequency([[10, posInteger()], [1, negInteger()]]);
const u: Fuzzer<number | void> = g.maybe();
const v: Fuzzer<number> = g.noShrink();
const w: Fuzzer<number> = oneOf([g, i]);
const x: Fuzzer<string> = g.flatMap(num => string({ maxSize: num }));

check('something', [boolean(), integer(), string()], (bool, int, str) => {
  const a: boolean = bool;
  const b: number = int;
  const c: string = str;
});

/**
 * Use async/await with same behavior as Jest it.
 */
check('something async', [boolean()], async bool => {});

/**
 * Use done with same behavior as Jest it.
 */
check('something async with done', [boolean()], async (bool, done) => {
  const d: Function = done;
});

/**
 * Same behavior as Jest it. This test will be skipped.
 */
check.skip('skip something', [boolean()], bool => {
  // ...
});

/**
 * Same behavior as Jest it. This is the only test in the suite that will run.
 */
check.only('only run this thing', [string()], str => {
  // ...
});
