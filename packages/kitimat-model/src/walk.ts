import { Random, Iter } from 'kitimat';
import { Line, Graph } from './graph';

type Walk<M, O> = AsyncIterable<Line<M, O, any>>;

const generator = <M, O>(graph: Graph<M, O>): Random.Generator<Walk<M, O>> => async seed => {
  const [seedA, seedB] = await Random.independentSeed(seed);
  const lineGen = Random.oneOf(graph.initialState.lines);

  const scan = Iter.scan(x => {
    const { value, nextSeed } = x;
    const nextGen = Random.oneOf(value.end.lines);
    return nextGen(nextSeed);
  }, lineGen(seedA));

  return {
    value: Iter.map(result => result.value, scan),
    nextSeed: seedB,
  };
};

const perform = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};

const shrink = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};
