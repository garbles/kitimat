import * as Iter from './iterable';

export interface Rose<A> {
  root: Promise<A>;
  children: AsyncIterable<Rose<A>>;
}

export const root = <A>(a: Rose<A>): Promise<A> => {
  return a.root;
};

export const children = <A>(a: Rose<A>): AsyncIterable<Rose<A>> => {
  return a.children;
};

export const rose = <A>(root: A | Promise<A>, children: AsyncIterable<Rose<A>>): Rose<A> => {
  return {
    root: Promise.resolve().then(() => root),
    children,
  };
};

export const singleton = <A>(root: A | Promise<A>): Rose<A> => rose(root, Iter.empty());

export const map = <A, B>(fn: (a: A) => B | Promise<B>, a: Rose<A>): Rose<B> => {
  return {
    get root() {
      return root(a).then(fn);
    },
    children: Iter.cached<Rose<B>>(
      Iter.create<Rose<B>>(async function*() {
        yield* Iter.map(a_ => map(fn, a_), children(a));
      }),
    ),
  };
};

export const map2 = <A, B, C>(fn: (a: A, b: B) => C | Promise<C>, a: Rose<A>, b: Rose<B>): Rose<C> => {
  return {
    get root() {
      return Promise.all([root(a), root(b)]).then(([a_, b_]) => fn(a_, b_));
    },
    children: Iter.cached<Rose<C>>(
      Iter.create<Rose<C>>(async function*() {
        const aChildren = children(a);
        const bChildren = children(b);
        yield* Iter.map2((a_, b_) => map2(fn, a_, b_), aChildren, bChildren);
      }),
    ),
  };
};

export const filter = async <A>(fn: (a: A) => boolean | Promise<boolean>, a: Rose<A>): Promise<Rose<A> | void> => {
  if (await fn(await root(a))) {
    return {
      root: root(a),
      children: Iter.cached<Rose<A>>(
        Iter.create<Rose<A>>(async function*() {
          yield* Iter.filter(async a_ => Boolean(await filter(fn, a_)), children(a));
        }),
      ),
    };
  }
};

export const zip = <A, B>(a: Rose<A>, b: Rose<B>): Rose<[A, B]> => {
  return {
    get root() {
      return Promise.all([root(a), root(b)]);
    },
    children: Iter.cached<Rose<[A, B]>>(
      Iter.create<Rose<[A, B]>>(async function*() {
        const childrenA = Iter.cached(children(a));
        const childrenB = Iter.cached(children(b));

        const aVariable = Iter.map<Rose<A>, Rose<[A, B]>>(a_ => zip(a_, b), childrenA);
        const bVariable = Iter.map<Rose<B>, Rose<[A, B]>>(b_ => zip(a, b_), childrenB);
        const abVariable = Iter.map2((a_, b_) => zip(a_, b_), childrenA, childrenB);

        yield* Iter.concat3(abVariable, aVariable, bVariable);
      }),
    ),
  };
};

export const flatten = <A>(a: Rose<Rose<A>>): Rose<A> => {
  return {
    get root() {
      return root(a).then(root);
    },
    children: Iter.cached<Rose<A>>(
      Iter.create<Rose<A>>(async function*() {
        yield* Iter.map(kid => flatten(kid), children(a));
      }),
    ),
  };
};

export const flatMap = <A, B>(fn: (a: A) => Rose<B>, a: Rose<A>): Rose<B> => flatten(map(fn, a));

export const deepCache = <A>(a: Rose<A>): Rose<A> => {
  return {
    root: root(a),
    children: Iter.cached<Rose<A>>(Iter.map(kid => deepCache(kid), children(a))),
  };
};
