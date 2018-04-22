import { Random, Iter, Awaitable, RoseTree } from 'kitimat';
import { Branch, Graph, State } from './graph';
import { freeze } from './utils';

type Computation<M, O> = {
  state: State<M, O>;
  model: M;
  apply(oracle: O): Promise<any>;
};

type Walk<M, O> = AsyncIterable<Computation<M, O>>;

/**
 * TODO:
 * - should throw if you are unable to use any branch because `preValidate` returns false for all of them
 * - warn if model and nextModel have the same object reference
 */

const generator = <M, O>(initialState: State<M, O>, initialModel: M): Random.Generator<Walk<M, O>> => async seed => {
  const [seedA, seedB] = await Random.independentSeed(seed);

  const initialResult: Random.Result<Computation<M, O>> = {
    value: {
      state: initialState,
      model: freeze(initialModel),
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

    // this could probably be better, but the Fuzzers/RoseTrees are lazy
    const { value: tree, nextSeed: nextSeedC } = await branch.action.fuzzer.generator(nextSeedB);
    const data = freeze(await RoseTree.root(tree));

    /**
     * determine what the next model is supposed to be.
     * this has no effect on the outcome because the data
     * and model are both frozen
     */
    const nextModel = freeze(branch.action.nextModel(model, data));

    /**
     * By wrapping these in a function, the result of this generator is
     * deterministic even though the actions that the oracle performs
     * are not.
     */
    const apply = async (oracle: O) => {
      // validate model in state
      await state.validate(model, oracle);
      // apply the action to the oracle
      await branch.action.apply(model, oracle, data);
      // validate the result of the action
      await branch.action.postValidate(nextModel, oracle);
    };

    return {
      value: {
        state: branch.end,
        model: nextModel,
        apply,
      },
      nextSeed: nextSeedC,
    };
  }, initialResult);

  return {
    value: Iter.map(comp => comp.value, walk),
    nextSeed: seedB,
  };
};

const perform = async <M, O>(oracle: O, walk: Walk<M, O>) => {};

const shrink = async <M, O>(walk: Walk<M, O>) => {};
