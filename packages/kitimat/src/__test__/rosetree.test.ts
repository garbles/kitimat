import * as RoseTree from '../rosetree';
import * as Iter from '../iterable';

const singleton = RoseTree.singleton(5);

const withChildren = {
  root: Promise.resolve(5),
  children: Iter.from([RoseTree.singleton(3), RoseTree.singleton(10)]),
};

const serializeChildren = async <A>(tree: RoseTree.Rose<A>): Promise<any> => {
  const children = [];

  for await (let kid of RoseTree.children(tree)) {
    children.push(await serializeChildren(kid));
  }

  return {
    root: RoseTree.root(tree),
    children,
  };
};

test('singleton', async () => {
  expect(await serializeChildren(RoseTree.singleton(5))).toMatchSnapshot();
});

test('root', () => {
  expect(RoseTree.root(singleton)).toMatchSnapshot();
});

test('map', async () => {
  expect(await serializeChildren(RoseTree.map(a => a + 1, withChildren))).toMatchSnapshot();
});

test('map2', async () => {
  const t = RoseTree.rose(
    10,
    Iter.from([
      RoseTree.rose(-1, Iter.from([RoseTree.singleton(12), RoseTree.singleton(400), RoseTree.singleton(88)])),
      RoseTree.rose(
        13,
        Iter.from([
          RoseTree.singleton(12),
          RoseTree.singleton(4),
          RoseTree.singleton(3),
          RoseTree.singleton(100),
          RoseTree.singleton(-1),
        ]),
      ),
      RoseTree.rose(0, Iter.from([RoseTree.singleton(0), RoseTree.singleton(18), RoseTree.singleton(65)])),
    ]),
  );

  expect(await serializeChildren(RoseTree.map2((x, y) => x + y, t, t))).toMatchSnapshot();
});

test('zip', async () => {
  const t = RoseTree.rose(
    10,
    Iter.from([
      RoseTree.rose(-1, Iter.from([RoseTree.singleton(12), RoseTree.singleton(400), RoseTree.singleton(88)])),
      RoseTree.rose(
        13,
        Iter.from([
          RoseTree.singleton(12),
          RoseTree.singleton(4),
          RoseTree.singleton(3),
          RoseTree.singleton(100),
          RoseTree.singleton(-1),
        ]),
      ),
      RoseTree.rose(0, Iter.from([RoseTree.singleton(0), RoseTree.singleton(18), RoseTree.singleton(65)])),
    ]),
  );

  expect(await serializeChildren(RoseTree.zip(t, t))).toMatchSnapshot();
  expect(await serializeChildren(RoseTree.zip(withChildren, withChildren))).toMatchSnapshot();
});
