import { Random, Iter } from 'kitimat';
import { Line, Graph } from './graph';

type Walk<M, O> = AsyncIterable<Line<M, O, any>>;

const generator = <M, O>(graph: Graph<M, O>): Random.Generator<Walk<M, O>> => async seed => {
  const [tempSeed, returnableSeed] = await Random.independentSeed(seed);
  const lineGen = Random.oneOf<Line<M, O, any>>(graph.initialState.lines);
  const lineProm = lineGen(tempSeed);

  const scan = Iter.scan<Random.Result<Line<M, O, any>>>(x => {
    const { value, nextSeed } = x;
    const nextGen = Random.oneOf<Line<M, O, any>>(value.end.lines);
    return nextGen(nextSeed);
  }, lineProm);

  return {
    value: Iter.map<Random.Result<Line<M, O, any>>, Line<M, O, any>>(result => result.value, scan),
    nextSeed: returnableSeed,
  };
};

const perform = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};

const shrink = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};
