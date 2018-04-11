import * as Random from '../random';
import * as RoseTree from '../rosetree';
import * as Fuzz from '../fuzz';
import * as Iter from '../iterable';
import * as Shrink from '../shrink';
import { Awaitable } from '../types';
import { sample } from './helpers';

const sampleFuzzer = <A>(fuzz: Fuzz.Fuzzer<A>, count?: number, seed?: Random.Seed) =>
  sample(fuzz.generator, count, seed);

const staticSeed = Random.initialSeed(1514568898760);

const serialize = async <A>(depth: number, trees: AsyncIterable<RoseTree.Rose<A>>): Promise<any> => {
  if (depth <= 0) {
    return [];
  }

  const result = [];

  for await (let tree of trees) {
    let root = await RoseTree.root(tree);
    let children = await serialize(depth - 1, RoseTree.children(tree));
    const next = { root, children };
    result.push(next);
  }

  return result;
};

const serializedSample = <A>(fuzzer: Fuzz.Fuzzer<A>, count = 10) => {
  const result = sampleFuzzer(fuzzer, count, staticSeed);
  return serialize(2, result);
};

const testValues = async <A>(fuzzer: Fuzz.Fuzzer<A>, callback: (a: A) => void) => {
  for await (let tree of sampleFuzzer(fuzzer)) {
    callback(await RoseTree.root(tree));

    for await (let kid of RoseTree.children(tree)) {
      callback(await RoseTree.root(kid));
    }
  }
};

const some = async <A>(children: A[], fn: (a: A) => Awaitable<boolean>) => {
  for await (let c of children) {
    if ((await fn(c)) === true) {
      return true;
    }
  }

  return false;
};

test('custom with constant generator', async () => {
  const value = 1000;
  const fuzz = Fuzz.custom(Random.constant(value), Shrink.atLeastInteger(0));
  const result = await serializedSample(fuzz);

  for await (let tree of result) {
    const children = await Iter.toArray(RoseTree.children(tree));

    // all children should be less than the constant value
    children.forEach(child => {
      const root = RoseTree.root(child as any);
      expect(root).toBeLessThan(value);
    });
  }
});

test('boolean', async () => {
  expect(await serializedSample(Fuzz.boolean())).toMatchSnapshot();
});

test('boolean 2', async () => {
  // validate that when a boolean fuzzer is zipped with something else, there
  // will still be children with `true`

  const result = sampleFuzzer(
    Fuzz.zip(Fuzz.boolean(), Fuzz.string({ maxSize: 4 })),
    1,
    Random.initialSeed(1514568898760 + 2),
  );

  for await (let tree of result) {
    // the pre-condition
    if ((await RoseTree.root(tree))[0] !== true) {
      continue;
    }

    const children = await Iter.toArray(RoseTree.children(tree));
    expect(await some(children, async kid => (await RoseTree.root(kid))[0] === true)).toEqual(true);
  }
});

test('boolean structure', async () => {
  const result = sampleFuzzer(Fuzz.boolean(), 10);

  for await (let tree of result) {
    const children = await Iter.toArray<RoseTree.Rose<boolean>>(RoseTree.children(tree));

    if ((await RoseTree.root(tree)) === true) {
      for await (let c of children) {
        expect(await RoseTree.root(c)).toEqual(false);
      }
    } else {
      expect(children).toHaveLength(0);
    }
  }
});

test('integer', async () => {
  const result = await serializedSample(Fuzz.integer({ minSize: 10, maxSize: 20 }));
  expect(result).toMatchSnapshot();
});

test('integer structure', async () => {
  const result = sampleFuzzer(Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }), 10);

  for await (let tree of result) {
    const root: number = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<number>>(RoseTree.children(tree));

    for await (let c of RoseTree.children(tree)) {
      if (root < 0) {
        expect(await RoseTree.root(c)).toBeGreaterThan(root);
      } else {
        expect(await RoseTree.root(c)).toBeLessThan(root);
      }
    }
  }
});

test('integer structure 2', async () => {
  const result = sampleFuzzer(Fuzz.integer({ minSize: 0, maxSize: 1e5 }), 10);

  for await (let tree of result) {
    const root: number = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<number>>(RoseTree.children(tree));

    for await (let c of children) {
      const value = await RoseTree.root(c);

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1e5);
      expect(value).toBeLessThanOrEqual(root);
    }
  }
});

test('float', async () => {
  expect(await serializedSample(Fuzz.float({ minSize: -10.1, maxSize: 10.1 }))).toMatchSnapshot();
});

test('float structure', async () => {
  const result = sampleFuzzer(Fuzz.float({ minSize: -1e5, maxSize: 1e5 }), 10);

  for await (let tree of result) {
    const root: number = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<number>>(RoseTree.children(tree));

    for await (let c of children) {
      const value = await RoseTree.root(c);

      if (root === 0) {
        expect(value).toEqual(0);
      } else if (root < 0) {
        expect(value).toBeGreaterThanOrEqual(root);
      } else {
        expect(value).toBeLessThanOrEqual(root);
      }
    }
  }
});

test('number', async () => {
  const result = sampleFuzzer(Fuzz.number({ minSize: -1e5, maxSize: 1e5 }), 10);

  for await (let tree of result) {
    const root: number = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<number>>(RoseTree.children(tree));

    for await (let c of children) {
      const value = await RoseTree.root(c);

      if (root === 0) {
        expect(value).toEqual(0);
      } else if (root < 0) {
        expect(value).toBeGreaterThanOrEqual(root);
      } else {
        expect(value).toBeLessThanOrEqual(root);
      }
    }
  }
});

test('posInteger', async () => {
  const fuzzer = Fuzz.posInteger();
  await testValues(fuzzer, num => expect(num).toBeGreaterThanOrEqual(0));
});

test('negInteger', async () => {
  const fuzzer = Fuzz.negInteger();
  await testValues(fuzzer, num => expect(num).toBeLessThanOrEqual(0));
});

test('posFloat', async () => {
  const fuzzer = Fuzz.posFloat();
  await testValues(fuzzer, num => expect(num).toBeGreaterThanOrEqual(0));
});

test('negFloat', async () => {
  const fuzzer = Fuzz.negFloat();
  await testValues(fuzzer, num => expect(num).toBeLessThanOrEqual(0));
});

test('posNumber', async () => {
  const fuzzer = Fuzz.posNumber();
  await testValues(fuzzer, num => expect(num).toBeGreaterThanOrEqual(0));
});

test('negNumber', async () => {
  const fuzzer = Fuzz.negNumber();
  await testValues(fuzzer, num => expect(num).toBeLessThanOrEqual(0));
});

test('string', async () => {
  expect(await serializedSample(Fuzz.string({ maxSize: 10 }))).toMatchSnapshot();
});

test('string structure', async () => {
  const result = sampleFuzzer(Fuzz.string({ maxSize: 50 }), 10);

  for await (let tree of result) {
    const root: string = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<string>>(RoseTree.children(tree));

    for await (let c of RoseTree.children(tree)) {
      const value = await RoseTree.root(c);
      expect(value.length).toBeLessThanOrEqual(root.length);
    }

    if (root === '') {
      expect(children).toHaveLength(0);
    } else {
      expect(await some(children, async c => (await RoseTree.root(c)).length < root.length)).toEqual(true);
    }
  }
});

test('asciiString', async () => {
  expect(await serializedSample(Fuzz.asciiString({ maxSize: 10 }))).toMatchSnapshot();
});

test('string structure', async () => {
  const result = sampleFuzzer(Fuzz.asciiString({ maxSize: 50 }), 10);

  for await (let tree of result) {
    const root: string = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<string>>(RoseTree.children(tree));

    for (let c of children) {
      const value = await RoseTree.root(c);
      expect(value.length).toBeLessThanOrEqual(root.length);
    }

    if (root === '') {
      expect(children).toHaveLength(0);
    } else {
      expect(await some(children, async c => (await RoseTree.root(c)).length < root.length)).toEqual(true);
    }
  }
});

test('array', async () => {
  expect(
    await serializedSample(Fuzz.array(Fuzz.integer({ minSize: 10, maxSize: 20 }), { maxSize: 10 })),
  ).toMatchSnapshot();
});

test('array structure', async () => {
  const result = sampleFuzzer(Fuzz.array(Fuzz.integer({ minSize: 10, maxSize: 20 }), { maxSize: 40 }), 10);

  for await (let tree of result) {
    const root: number[] = await RoseTree.root(tree);
    const children = await Iter.toArray<RoseTree.Rose<number[]>>(RoseTree.children(tree));

    for await (let c of RoseTree.children(tree)) {
      const value = await RoseTree.root(c);
      expect(value.length).toBeLessThanOrEqual(root.length);
    }
  }
});

test('object structure', async () => {
  const result = await Iter.toArray(
    sampleFuzzer(
      Fuzz.object<{ a: number; b: string }>({
        a: Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }),
        b: Fuzz.string({ maxSize: 12 }),
      }),
    ),
  );

  const tree = result[0];

  const root = await RoseTree.root(tree as any);
  const children = RoseTree.children(tree as any);

  for await (let kid of children) {
    const next = await RoseTree.root(kid);
    expect(next).not.toEqual(root);
  }
});

test('zip', async () => {
  const fuzzer = Fuzz.zip(Fuzz.string({ maxSize: 10 }), Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }));

  testValues(fuzzer, ([a, b]) => {
    expect(typeof a).toEqual('string');
    expect(typeof b).toEqual('number');
  });
});

test('zip3', async () => {
  const fuzzer = Fuzz.zip3(
    Fuzz.string({ maxSize: 40 }),
    Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }),
    Fuzz.object({ a: Fuzz.string({ maxSize: 10 }) }),
  );

  testValues(fuzzer, ([a, b, c]) => {
    expect(typeof a).toEqual('string');
    expect(typeof b).toEqual('number');
    expect(typeof c.a).toEqual('string');
    expect(Object.keys(c)).toEqual(['a']);
  });
});

test('zip4', async () => {
  const fuzzer = Fuzz.zip4(
    Fuzz.string({ maxSize: 40 }),
    Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }),
    Fuzz.object({ a: Fuzz.string({ maxSize: 10 }) }),
    Fuzz.array(Fuzz.integer({ minSize: 0, maxSize: 10 }), { maxSize: 5 }),
  );

  testValues(fuzzer, ([a, b, c, d]) => {
    expect(typeof a).toEqual('string');
    expect(typeof b).toEqual('number');
    expect(typeof c.a).toEqual('string');
    expect(Object.keys(c)).toEqual(['a']);
    expect(Array.isArray(d)).toEqual(true);

    d.forEach(val => {
      expect(typeof val).toEqual('number');
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(10);
    });
  });
});

test('zip5', async () => {
  const fuzzer = Fuzz.zip5(
    Fuzz.string({ maxSize: 40 }),
    Fuzz.integer({ minSize: -1e5, maxSize: 1e5 }),
    Fuzz.object({ a: Fuzz.string({ maxSize: 10 }) }),
    Fuzz.array(Fuzz.integer({ minSize: 0, maxSize: 10 }), { maxSize: 5 }),
    Fuzz.constant('!!!!'),
  );

  testValues(fuzzer, ([a, b, c, d, e]) => {
    expect(typeof a).toEqual('string');
    expect(typeof b).toEqual('number');
    expect(typeof c.a).toEqual('string');
    expect(Object.keys(c)).toEqual(['a']);
    expect(Array.isArray(d)).toEqual(true);

    d.forEach(val => {
      expect(typeof val).toEqual('number');
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(10);
    });

    expect(e).toEqual('!!!!');
  });
});

test('map', async () => {
  const fuzzA = Fuzz.string({ maxSize: 40 });
  const fuzzB = fuzzA.map(str => str.length);

  const resultA: string[] = (await serializedSample(fuzzA)).map(RoseTree.root);
  const resultB: number[] = (await serializedSample(fuzzB)).map(RoseTree.root);

  expect(resultA.every(o => typeof o === 'string')).toEqual(true);
  expect(resultB.every(o => typeof o === 'number')).toEqual(true);
});

test('map2', async () => {
  const fuzzA = Fuzz.string({ maxSize: 40 });
  const fuzzB = Fuzz.constant('!');
  const fuzzC = Fuzz.map2((a, b) => '!' + b + a, fuzzA, fuzzB);

  const result = await serializedSample(fuzzC);

  result.map(RoseTree.root).forEach((root: string) => {
    expect(root.length).toBeGreaterThanOrEqual(2);
    expect(root.slice(0, 2)).toEqual('!!');
  });

  expect(result).toMatchSnapshot();
});

test('filter', async () => {
  const fuzz = Fuzz.integer().filter(num => num > 5);

  await testValues(fuzz, num => {
    expect(num).toBeGreaterThan(5);
  });
});

test('maybe', async () => {
  const fuzz = Fuzz.string({ maxSize: 40 }).maybe();
  const result = await serializedSample(fuzz);

  // from static seed, this is the one with an undefined root.
  const str = result[0];
  const undef = result[6];

  // validate assumption
  expect(typeof RoseTree.root(str)).toEqual('string');
  expect(RoseTree.root(undef)).toEqual(undefined);

  const strChildren = await Iter.toArray(RoseTree.children(str));
  const undefChildren = await Iter.toArray(RoseTree.children(undef));

  expect(strChildren.every((c: RoseTree.Rose<any>) => typeof RoseTree.root(c) === 'string')).toEqual(true);
  expect(undefChildren.every((c: RoseTree.Rose<any>) => RoseTree.root(c) === undefined)).toEqual(true);
});

test('noShrink', async () => {
  const fuzzA = Fuzz.string({ maxSize: 20 }).noShrink();
  const fuzzB = Fuzz.integer({ minSize: 10, maxSize: 50 });
  const fuzz = Fuzz.zip(fuzzA, fuzzB);
  const trees = sampleFuzzer(fuzz);

  const someHaveChildren = await Iter.some(async tree => {
    const arr = await Iter.toArray(RoseTree.children(tree as any));
    return arr.length > 0;
  }, trees);

  const everyHasChildrenOrStartsWithMinInteger = await Iter.every(async tree => {
    const arr = await Iter.toArray(RoseTree.children(tree as any));
    return arr.length > 0 || (await RoseTree.root(tree))[1] === 10;
  }, trees);

  expect(someHaveChildren && everyHasChildrenOrStartsWithMinInteger).toEqual(true);

  for await (let tree of trees) {
    const [stringA, numberA] = await RoseTree.root(tree);

    for await (let child of RoseTree.children(tree)) {
      const [stringB, numberB] = await RoseTree.root(child);

      expect(stringA).toEqual(stringB);
      expect(numberA).toBeGreaterThan(numberB);
    }
  }
});

test('oneOf', async () => {
  const oneOrTwo = Fuzz.oneOf([Fuzz.constant(1), Fuzz.constant(2)]);
  const trees = sampleFuzzer(oneOrTwo);

  let found1 = false;
  let found2 = false;

  for await (let tree of trees) {
    const root = await RoseTree.root(tree);

    found1 = root === 1 ? true : found1;
    found2 = root === 2 ? true : found2;

    expect([1, 2]).toContain(root);
  }

  expect(found1).toEqual(true);
  expect(found2).toEqual(true);
});

test('flatMap', async () => {
  const fuzz = Fuzz.posInteger({ maxSize: 5 }).flatMap(maxSize => Fuzz.string({ maxSize }));
  await testValues(fuzz, str => expect(typeof str).toEqual('string'));
});
