import { Random, Iter, Awaitable } from 'kitimat';
import { Branch, Graph, State } from './graph';

type Computation<M, O> = Random.Result<{
  state: State<M, O>;
  model: M;
}>;

type Walk<M, O> = AsyncIterable<Computation<M, O>>;

const generator = <M, O>(graph: Graph<M, O>): Random.Generator<Walk<M, O>> => async seed => {
  const [seedA, seedB] = await Random.independentSeed(seed);
  const oracle = graph.oracle;

  const initialResult: Computation<M, O> = {
    value: {
      state: graph.initialState,
      model: graph.initialModel,
    },
    nextSeed: seedA,
  };

  const walk = Iter.scan(async x => {
    const { value, nextSeed: nextSeedA } = x;
    const { state, model } = value;

    // validate model in state
    await state.validate(model, oracle);

    // select branch
    // TODO: this should throw if you end up unable to perform any branch
    const brIter = Iter.from(state.branches);
    const brValid = Iter.filter(br => br.action.preValidate(model, oracle), brIter);
    const brArr = await Iter.toArray(brValid);
    const brGen = Random.oneOf<Branch<M, O, any>>(brArr);

    const { value: branch, nextSeed: nextSeedB } = await brGen(nextSeedA);

    // apply the action
    await branch.action.apply(model, oracle, undefined);

    // validate the result of the action
    await branch.action.postValidate(model, oracle);

    const nextState = branch.end;
    const nextModel = branch.action.nextModel(model, undefined);

    return {
      value: {
        state: nextState,
        model: nextModel,
      },
      nextSeed: nextSeedB,
    };
  }, initialResult);

  return {
    value: walk,
    nextSeed: seedB,
  };
};

const perform = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};

const shrink = <M, O>(graph: Graph<M, O>, walk: Walk<M, O>) => {};
