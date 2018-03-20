if (!Symbol.asyncIterator) {
  (Symbol as any).asyncIterator = Symbol.for('Symbol.asyncIterator');
}

const getIterator = <A>(iter: AsyncIterable<A>): AsyncIterator<A> => iter[Symbol.asyncIterator]();

export const create = <A>(fn: () => AsyncIterator<A>): AsyncIterable<A> => ({
  [Symbol.asyncIterator]: fn,
});

export const toArray = async <A>(iter: AsyncIterable<A>): Promise<A[]> => {
  const result = [];

  for await (let value of iter) {
    result.push(value);
  }

  return result;
};

export const empty = <A>(): AsyncIterable<A> => create<A>(async function*(): AsyncIterator<A> {});

export const from = <A>(arr: (A | Promise<A>)[]): AsyncIterable<A> =>
  create<A>(async function*() {
    yield* arr;
  });

export const of = <A>(a: A | Promise<A>): AsyncIterable<A> =>
  create<A>(async function*(): AsyncIterator<A> {
    yield await a;
  });

export const every = async <A>(fn: (a: A) => boolean | Promise<boolean>, iter: AsyncIterable<A>): Promise<boolean> => {
  for await (let next of iter) {
    if ((await fn(next)) === false) {
      return false;
    }
  }

  return true;
};

export const some = async <A>(fn: (a: A) => boolean | Promise<boolean>, iter: AsyncIterable<A>): Promise<boolean> => {
  for await (let next of iter) {
    if ((await fn(next)) === true) {
      return true;
    }
  }

  return false;
};

export const lazy = <A>(fn: () => AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    yield* fn();
  });

export const map = <A, B>(fn: (a: A) => B | Promise<B>, iter: AsyncIterable<A>): AsyncIterable<B> =>
  create<B>(async function*() {
    for await (let next of iter) {
      yield await fn(next);
    }
  });

export const map2 = <A, B, C>(
  fn: (a: A, b: B) => C | Promise<C>,
  a: AsyncIterable<A>,
  b: AsyncIterable<B>,
): AsyncIterable<C> =>
  create<C>(async function*() {
    const iteratorA = getIterator(a);
    const iteratorB = getIterator(b);

    let resultA: IteratorResult<A>;
    let resultB: IteratorResult<B>;

    do {
      // do this so that they resolve themselves in parallel
      [resultA, resultB] = [await iteratorA.next(), await iteratorB.next()];

      if (resultA.done === false && resultB.done === false) {
        yield await fn(resultA.value, resultB.value);
      }
    } while (resultA.done === false && resultB.done === false);
  });

export const zip = <A, B>(a: AsyncIterable<A>, b: AsyncIterable<B>): AsyncIterable<[A, B]> =>
  map2<A, B, [A, B]>((a_, b_) => [a_, b_], a, b);

export const zip3 = <A, B, C>(
  a: AsyncIterable<A>,
  b: AsyncIterable<B>,
  c: AsyncIterable<C>,
): AsyncIterable<[A, B, C]> => map2<[A, B], C, [A, B, C]>(([a_, b_], c_) => [a_, b_, c_], zip(a, b), c);

export const zip4 = <A, B, C, D>(
  a: AsyncIterable<A>,
  b: AsyncIterable<B>,
  c: AsyncIterable<C>,
  d: AsyncIterable<D>,
): AsyncIterable<[A, B, C, D]> =>
  map2<[A, B], [C, D], [A, B, C, D]>(([a_, b_], [c_, d_]) => [a_, b_, c_, d_], zip(a, b), zip(c, d));

export const filter = <A>(fn: (a: A) => Promise<boolean> | boolean, iter: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    for await (let next of iter) {
      if ((await fn(next)) === true) {
        yield next;
      }
    }
  });

export const scan = <A>(fn: (a: A) => Promise<A> | A, init: A): AsyncIterable<A> =>
  create<A>(async function*() {
    let next = init;
    yield next;

    while (true) {
      next = await fn(next);
      yield next;
    }
  });

export const reduce = async <A, B>(
  fn: (prev: A, next: B) => A | Promise<A>,
  acc: A,
  iter: AsyncIterable<B>,
): Promise<A> => {
  let prev = acc;

  for await (let next of iter) {
    prev = await fn(prev, next);
  }

  return prev;
};

export const take = <A>(i: number, iter: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    let j = 0;

    for await (let next of iter) {
      yield next;

      if (++j >= i) {
        break;
      }
    }
  });

export const drop = <A>(i: number, iter: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    let j = 0;

    for await (let next of iter) {
      if (++j <= i) {
        continue;
      }

      yield next;
    }
  });

export const range = (low: number, high: number): AsyncIterable<number> => {
  if (low > high) {
    return range(high, low);
  }

  return create<number>(async function*() {
    for (let i = low; i < high; i++) {
      yield i;
    }
  });
};

export const cons = <A>(a: A | Promise<A>, xs: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    yield await a;

    for await (let next of xs) {
      yield next;
    }
  });

export const concat = <A>(a: AsyncIterable<A>, b: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    for await (let next of a) {
      yield next;
    }

    for await (let next of b) {
      yield next;
    }
  });

export const concat3 = <A>(a: AsyncIterable<A>, b: AsyncIterable<A>, c: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    yield* concat(concat(a, b), c);
  });

export const concat4 = <A>(
  a: AsyncIterable<A>,
  b: AsyncIterable<A>,
  c: AsyncIterable<A>,
  d: AsyncIterable<A>,
): AsyncIterable<A> =>
  create<A>(async function*() {
    yield* concat(concat3(a, b, c), d);
  });

export const flatMap = <A, B>(fn: (a: A) => AsyncIterable<B>, iter: AsyncIterable<A>): AsyncIterable<B> =>
  create<B>(async function*() {
    for await (let xs of map(fn, iter)) {
      yield* xs;
    }
  });

export const endless = <A>(iter: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    let isEmpty = true;

    while (true) {
      for await (let value of iter) {
        isEmpty = false;
        yield value;
      }

      if (isEmpty) {
        break;
      }
    }
  });

export const always = <A>(a: A): AsyncIterable<A> =>
  create<A>(async function*() {
    while (true) {
      yield a;
    }
  });

export const reverse = <A>(iter: AsyncIterable<A>): AsyncIterable<A> =>
  create<A>(async function*() {
    const cache = [];

    for await (let value of iter) {
      cache.unshift(value);
    }

    yield* cache;
  });

export const cached = <A>(iter: AsyncIterable<A>): AsyncIterable<A> => {
  const cache: A[] = [];
  const iterator = getIterator(iter);
  let done = false;

  return create<A>(async function*() {
    yield* cache;

    if (done === true) {
      return;
    }

    let next: IteratorResult<A>;

    do {
      next = await iterator.next();

      if (next.done === false) {
        const value = next.value;
        cache.push(value);
        yield value;
      }
    } while (next.done === false);

    done = true;
  });
};
