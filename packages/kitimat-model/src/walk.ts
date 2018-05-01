import { Random, Iter, Awaitable, RoseTree } from 'kitimat';
import { Branch, Graph, State } from './graph';
import { freeze } from './utils';

export type Computation<M, O> = {
  state: State<M, O>;
  model: M;
  apply(oracle: O): Awaitable<any>;
};

export type Walk<M, O> = Computation<M, O>[];

export type Props<M, O> = {
  initialState: State<M, O>;
  initialModel: M;
  minSize: number;
  maxSize: number;
};

/**
 * TODO:
 * - should throw if you are unable to use any branch because `preValidate` returns false for all of them
 * - warn if model and nextModel have the same object reference
 */

export const generator = <M, O>(props: Props<M, O>): Random.Generator<Walk<M, O>> => async seed => {
  const { initialState, initialModel, minSize, maxSize } = props;
  const [seedA, seedB] = await Random.independentSeed(seed);

  freeze(initialModel);

  const initialResult: Random.Result<Computation<M, O>> = {
    value: {
      state: initialState,
      model: initialModel,
      apply: (oracle: O) => initialState.validate(initialModel, oracle),
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
    const root = await RoseTree.root(tree);
    const data = freeze(root);

    /**
     * determine what the next model is supposed to be.
     * this has no effect on the outcome because the data
     * and model are both frozen
     */
    const nextModel = freeze(branch.action.nextModel(model, data));

    /**
     * By wrapping these in a function, the result of this generator is
     * deterministic even though the actions that the oracle performs
     * are not. It's possible to cache the iterator and apply these actions
     * against successive oracles.
     */
    const apply = async (oracle: O) => {
      // apply the action to the oracle
      await branch.action.apply(model, oracle, data);
      // validate the result of the action
      await branch.action.postValidate(model, nextModel, oracle, data);
      // validate the next model in state
      await branch.nextState.validate(nextModel, oracle);
    };

    return {
      value: {
        state: branch.nextState,
        model: nextModel,
        apply,
      },
      nextSeed: nextSeedC,
    };
  }, initialResult);

  // this is kind of gross
  const { value: len, nextSeed: seedC } = await Random.integer(minSize, maxSize)(seedB);
  const result = await Iter.toArray(Iter.take(len, Iter.map(comp => comp.value, walk)));

  return {
    value: result,
    nextSeed: seedC,
  };
};

export const perform = async <M, O>(oracle: O, walk: Walk<M, O>) => {};

export const shrink = async <M, O>(walk: Walk<M, O>) => {};
