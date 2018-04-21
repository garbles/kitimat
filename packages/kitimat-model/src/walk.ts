import { Random, Iter, Awaitable } from 'kitimat';
import * as clone from './clone';
import { Branch, Graph, State } from './graph';

type Computation<M, O> = {
  state: State<M, O>;
  model: M;
  apply(oracle: O): Promise<any>;
};

type Walk<M, O> = AsyncIterable<Computation<M, O>>;

/**
 * TODO:
 * - should throw if you are unable to use any branch because `preValidate` returns false for all of them
 * - compute data with a fuzzer. how do I fold this in?
 * - warn if model and nextModel have the same object reference
 */

const generator = <M, O>(initialState: State<M, O>, initialModel: M): Random.Generator<Walk<M, O>> => async seed => {
  const [seedA, seedB] = await Random.independentSeed(seed);

  const initialResult: Random.Result<Computation<M, O>> = {
    value: {
      state: initialState,
      model: clone.data(initialModel),
      apply: async () => true,
    },
    nextSeed: seedA,
  };

  const walk = Iter.scan(async result => {
    const { value, nextSeed: nextSeedA } = result;
    let { state, model } = value;

    // select branch
    const brIter = Iter.from(state.branches);
    const brValid = Iter.filter(br => br.action.preValidate(model), brIter);
    const brArr = await Iter.toArray(brValid);
    const brGen = Random.oneOf<Branch<M, O, any>>(brArr);
    const { value: branch, nextSeed: nextSeedB } = await brGen(nextSeedA);

    const apply = async (oracle: O) => {
      // validate model in state
      await state.validate(model, oracle);
      // apply the action
      await branch.action.apply(model, oracle, undefined);
      // validate the result of the action
      await branch.action.postValidate(model, oracle);
    };

    const nextState = branch.end;
    const nextModel = branch.action.nextModel(model, undefined);

    return {
      value: {
        state: nextState,
        model: clone.data(nextModel),
        apply,
      },
      nextSeed: nextSeedB,
    };
  }, initialResult);

  return {
    value: Iter.map(comp => comp.value, walk),
    nextSeed: seedB,
  };
};

const perform = async <M, O>(oracle: O, walk: Walk<M, O>) => {};

const shrink = async <M, O>(walk: Walk<M, O>) => {};
