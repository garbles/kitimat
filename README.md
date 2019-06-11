# Kitimat

Kitimat is a library for generative, property-based testing in TypeScript.

* **Easy to use**: Integrates directly into [Jest](https://github.com/facebook/jest) with zero additional configuration.

* **Asynchronous**: Kitimat supports async/await, Promises and `done()` out of the box.

* **Statically typed**: Using TypeScript under the hood, Kitimat generators are kept in sync with your application code.

## A quick example

A unit test typically validates that a system - e.g. a function - will assert something
given a specific set of inputs. This specificity is usually sufficient for small systems; however, as the system increases in complexity it usually means that enumerating all possible test cases becomes an impossible task. Instead, generating test cases should be left up to a computer. A developer derives generalizable properties that the system will hold for any input of a given type. The computer should verify these properties by running them against hundreds or thousands of input cases. This is the essence of generative, property-based testing.

```ts
// my-sort.test.ts

import { check, integer, array } from 'kitimat-jest';
import { sort } from './my-sort';

it('sorts some numbers', () => {
  const sorted = sort([6, 1, 2]);
  expect(sorted).toEqual([1, 2, 6]);
});

check('length does not change', [array(integer())], arr => {
  const sorted = sort(arr);
  expect(sorted.length).toEqual(arr.length);
});

check('idempotent', [array(integer())], arr => {
  const once = sort(arr);
  const twice = sort(sort(arr));
  expect(once).toEqual(twice);
});

check('ordered', [array(integer())], arr => {
  const sorted = sort(arr);

  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i];
    const next = sorted[i + 1];
    expect(prev).toBeLessThanOrEqual(next);
  }
});
```

## Installing

You can install Kitimat on its own, but it is recommend that you use it with Jest.

```
yarn add kitimat kitimat-jest jest --dev
```

## Configuration

Kitimat uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) so you can
put your configuration in a `.kitimatrc`, `kitimat.config.js` or the key `"kitimat"`
in your `package.json`. These values can be overridden on a test-by-test basis
([see API reference](#api-reference)).

### `maxNumTests: number = 100`

The number of test cases generated for each property. Defaults to 100.

### `seed: number = Date.now()`

The seed for generating pseudo-random values. If the seed is set to a constant value,
then the same pseudo-random values will be generated for every run; otherwise,
Kitimat will use `Date.now()`.

This value can be overridden by using the environment variable `KITIMAT_SEED`.

### `timeout: number = 5000`

Jest only. The number of milliseconds for a single property before Jest triggers a timeout
error.

## API Reference

### `check(description: string, fuzzers: Fuzzer[], callback: Function, options: Options): void`

A light wrapper around Jest `it`, but accepts a list of Fuzzers and generates values,
passing them into the `it` callback.

```ts
import { check, boolean, integer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

check('something', [boolean(), integer(), string()], (bool, int, str) => {
  expect(typeof bool).toEqual('boolean');
  expect(typeof int).toEqual('number');
  expect(typeof str).toEqual('string');
});

/**
 * Use async/await with same behavior as Jest it.
 */
check('something async', [boolean()], async bool => {
  const result = await someFunc(bool);
  expect(result).toEqual(true);
});

/**
 * Use done with same behavior as Jest it.
 */
check('something async with done', [boolean()], async (bool, done) => {
  someFunc(bool).then(result => {
    expect(result).toEqual(true);
    done();
  });
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
```

### `exists(description: string, fuzzers: Fuzzer[], callback: Function, options: Options): void`

A light wrapper around Jest `it`, but accepts a list of Fuzzers and generates values,
passing them into the `it` callback. Similar to `check` except that it completes on the first
successful test case. `exists` fails if it does not find a successful test case after the
configured number of test cases.

```ts
import { exists, boolean } from 'kitimat-jest';

exists('something async', [boolean()], async bool => {
  expect(result).toEqual(true);
});
```

### `boolean(): Fuzzer<boolean>`

Creates a boolean Fuzzer.

```ts
import { check, Fuzzer, boolean } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<boolean> = boolean();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('boolean');

  expect(someFunc(val)).toEqual(true);
});
```

### `constant<A>(val: A): Fuzzer<A>`

Wraps a constant value in a Fuzzer.

```ts
import { check, Fuzzer, constant } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<string> = constant('my string');

check('something', [fuzzer], val => {
  expect(val).toEqual('my string');

  expect(someFunc(val)).toEqual(true);
});
```

### `number(opts?: { minSize?: number, maxSize?: number }): Fuzzer<number>`

Creates an number Fuzzer.

```ts
import { check, Fuzzer, number } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = number();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `posNumber(opts?: { maxSize?: number }): Fuzzer<number>`

Creates an number Fuzzer of positive values.

```ts
import { check, Fuzzer, posNumber } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = posNumber();

check('something', [fuzzer], val => {
  expect(val).toBeGreaterThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `negNumber(opts?: { minSize?: number }): Fuzzer<number>`

Creates an number Fuzzer of negative values.

```ts
import { check, Fuzzer, negNumber } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = negNumber();

check('something', [fuzzer], val => {
  expect(val).toBeLessThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `integer(opts?: { minSize?: number, maxSize?: number }): Fuzzer<number>`

Creates an integer Fuzzer.

```ts
import { check, Fuzzer, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = integer();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `posInteger(opts?: { maxSize?: number }): Fuzzer<number>`

Creates an integer Fuzzer of positive values.

```ts
import { check, Fuzzer, posInteger } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = posInteger();

check('something', [fuzzer], val => {
  expect(val).toBeGreaterThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `negInteger(opts?: { minSize?: number }): Fuzzer<number>`

Creates an integer Fuzzer of negative values.

```ts
import { check, Fuzzer, negInteger } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = negInteger();

check('something', [fuzzer], val => {
  expect(val).toBeLessThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `float(opts?: { minSize?: number, maxSize?: number }): Fuzzer<number>`

Creates an float Fuzzer.

```ts
import { check, float } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = float();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `posFloat(opts?: { maxSize?: number }): Fuzzer<number>`

Creates a float Fuzzer of positive values.

```ts
import { check, Fuzzer, posFloat } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = posFloat();

check('something', [fuzzer], val => {
  expect(val).toBeGreaterThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `negFloat(opts?: { minSize?: number }): Fuzzer<number>`

Creates a float Fuzzer of negative values.

```ts
import { check, Fuzzer, negFloat } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = negFloat();

check('something', [fuzzer], val => {
  expect(val).toBeLessThanOrEqual(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `string(opts?: { maxSize?: number }): Fuzzer<string>`

Creates a string Fuzzer.

```ts
import { check, Fuzzer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<string> = string();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('string');

  expect(someFunc(val)).toEqual(true);
});
```

### `asciiString(opts?: { maxSize?: number }): Fuzzer<string>`

Creates a ASCII string Fuzzer.

```ts
import { check, Fuzzer, asciiString } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<string> = asciiString();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('string');

  expect(someFunc(val)).toEqual(true);
});
```

### `array<A>(a: Fuzzer<A>, opts?: { maxSize?: number }): Fuzzer<A[]>`

Takes a Fuzzer of some type and creates an array Fuzzer of that type.

```ts
import { check, Fuzzer, array, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number[]> = array(integer());

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'number')).toEqual(true);

  expect(someFunc(val)).toEqual(true);
});
```

### `object<A>({ [K in keyof A]: Fuzzer<A[K]> }): Fuzzer<A>`

Takes an object where the values are fuzzers and creates an object Fuzzer of that type.

```ts
import { check, Fuzzer, object, asciiString, posInteger } from 'kitimat-jest';
import { someFunc } from './some-func';

type Person = {
  name: string;
  age: number;
};

const fuzzer: Fuzzer<Person> = object<Person>({
  name: asciiString(),
  age: posInteger(),
});

check('something', [fuzzer], val => {
  expect(typeof val.name).toEqual('string');
  expect(typeof val.age).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `zip<A, B>(a: Fuzzer<A>, b: Fuzzer<B>): Fuzzer<[A, B]>`

Takes two fuzzers and creates a tuple Fuzzer.

```ts
import { check, Fuzzer, zip, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<[number, number]> = zip(integer(), integer());

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'number')).toEqual(true);
  expect(val).toHaveLength(2);

  expect(someFunc(val)).toEqual(true);
});
```

### `zip3<A, B, C>(a: Fuzzer<A>, b: Fuzzer<B>, c: Fuzzer<C>): Fuzzer<[A, B, C]>`

Takes three fuzzers and creates a tuple Fuzzer.

```ts
import { check, Fuzzer, zip3, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<[number, number, number]> = zip3(integer(), integer(), integer());

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'number')).toEqual(true);
  expect(val).toHaveLength(3);

  expect(someFunc(val)).toEqual(true);
});
```

### `zip4<A, B, C, D>(a: Fuzzer<A>, b: Fuzzer<B>, c: Fuzzer<C>, d: Fuzzer<D>): Fuzzer<[A, B, C, D]>`

Takes four fuzzers and creates a tuple Fuzzer.

```ts
import { check, Fuzzer, zip4, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<[number, number, number, number]> = zip4(integer(), integer(), integer(), integer());

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'number')).toEqual(true);
  expect(val).toHaveLength(4);

  expect(someFunc(val)).toEqual(true);
});
```

### `zip5<A, B, C, D, E>(a: Fuzzer<A>, b: Fuzzer<B>, c: Fuzzer<C>, d: Fuzzer<D>, e: Fuzzer<E>): Fuzzer<[A, B, C, D, E]>`

Takes five fuzzers and creates a tuple Fuzzer.

```ts
import { check, Fuzzer, zip5, integer } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<[number, number, number, number, number]> = zip5(
  integer(),
  integer(),
  integer(),
  integer(),
  integer(),
);

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'number')).toEqual(true);
  expect(val).toHaveLength(5);

  expect(someFunc(val)).toEqual(true);
});
```

### `frequency<A>(arr: [number, Fuzzer<A>][]): Fuzzer<A>`

Takes a list of tuples (`[number, Fuzzer]`) and returns a Fuzzer
of weighted values.

```ts
import { check, Fuzzer, frequency, posInteger, negInteger } from 'kitimat-jest';
import { someFunc } from './some-func';

/**
 * 90% of generated values will be positive integers, 10% negative integers.
 */
const fuzzer: Fuzzer<number> = frequency([
  [9, posInteger()],
  [1, negInteger()];
])

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `oneOf<A>(arr: Fuzzer<A>[]): Fuzzer<A>`

Similar to `frequency` except all Fuzzers are equally weighted.

```ts
import { check, Fuzzer, oneOf, posInteger, negInteger } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = oneOf([posInteger(), negInteger()]);

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `map<A, B>(fn: (a: A) => B | Promise<B>, a: Fuzzer<A>): Fuzzer<B>`

Takes a mapping function that returns any value and a Fuzzer.
Maps all generated values to create a Fuzzer of a new type.
_\*Also an instance method on Fuzzer._

```ts
import { check, Fuzzer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<number> = string().map(str => str.length);

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('number');

  expect(someFunc(val)).toEqual(true);
});
```

### `flatMap<A, B>(fn: (a: A) => Fuzzer<B> | Promise<Fuzzer<B>>, a: Fuzzer<A>): Fuzzer<B>`

Takes a mapping function that returns a new Fuzzer and a Fuzzer.
Maps all generated values to create a new Fuzzer of a new type.
_\*Also an instance method on Fuzzer._

```ts
import { check, Fuzzer, string, array, constant } from 'kitimat-jest';
import { someFunc } from './some-func';

/**
 * A fuzzer of arrays where the entries are always the same string,
 * but the length of the array is variable.
 */
const fuzzer: Fuzzer<string[]> = string().flatMap(str => {
  return array(constant(str));
});

check('something', [fuzzer], val => {
  expect(Array.isArray(true)).toEqual(true);
  expect(val.every(x => typeof x === 'string')).toEqual(true);

  expect(someFunc(val)).toEqual(true);
});
```

### `filter<A>(fn: (a: A) => boolean | Promise<boolean>, a: Fuzzer<A>): Fuzzer<A>`

Takes a filtering function and a Fuzzer. If a generated value
does not pass the filtering function, another value will be attempted
until one passes. **Be careful** with this because it can cause
your tests to take much, much longer to complete. _\*Also an instance method on Fuzzer._

```ts
import { check, Fuzzer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

/**
 * Do not allow empty strings.
 */
const fuzzer: Fuzzer<string> = string().filter(str => str.length > 0);

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('string');
  expect(val.length).toBeGreaterThan(0);

  expect(someFunc(val)).toEqual(true);
});
```

### `maybe<A>(a: Fuzzer<A>): Fuzzer<A | void>`

Takes a Fuzzer and creates a new Fuzzer where the value is either
the type of the original Fuzzer or `undefined`. _\*Also an instance method on Fuzzer._

```ts
import { check, Fuzzer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<string | void> = string().maybe();

check('something', [fuzzer], val => {
  expect(someFunc(val)).toEqual(true);
});
```

### `noShrink<A>(a: Fuzzer<A>): Fuzzer<A>`

Takes a Fuzzer and prevents it from shrinking. _\*Also an instance method on Fuzzer._

```ts
import { check, Fuzzer, string } from 'kitimat-jest';
import { someFunc } from './some-func';

const fuzzer: Fuzzer<string> = string().noShrink();

check('something', [fuzzer], val => {
  expect(typeof val).toEqual('string');

  expect(someFunc(val)).toEqual(true);
});
```

## Prior Art

Property-based testing is not a new idea. I started writing this
library because I wanted to understand how the concept worked under the hood.
The internal implementation borrows from
[elm-community/elm-test](https://github.com/elm-community/elm-test),
[mgold/elm-random-pcg](https://github.com/mgold/elm-random-pcg),
[elm-community/shrink](https://github.com/elm-community/shrink).
The client API is designed after [leebyron/testcheck-js](https://github.com/leebyron/testcheck-js).

## Known Issues

`expect.assertions` does not work because all generated test cases are
run in a single `it` block.

## Developing

After cloning this project, you can run `make test` to install the
dependencies and run all of the tests.

## Contributing

**_PLEASE_** take into consideration that this is a
personal open source project and nobody is paying me to do this work.
It would be amazing if you could **_FIRST_** open an issue to
discuss your change and proposed implementation. It is a terrible
feeling to have to reject a change over a disagreement; especially,
when the author has clearly put in a lot of effort.

## License

Copyright 2018 (c) Gabe Scholz under MIT License
