// import { Fuzzer } from 'kitimat';

// // - having probabilistic actions is a good idea
// // -

// // root
// //   - defines initial model/
// //     ("structural model" while the actions/states/steps combined together are the "behavioral model")
// //   - initial state (e.g. loggedout)
// //   - oracle (the entity which is carrying out actions)
// //   - list of states
// //   - setup
// // states
// //   - name
// //   - description
// //   - model validations (with model and oracle as args?)
// //   - list of valid actions/steps
// //   - list of sub states
// // actions
// //   - name
// //   - description
// //   - action
// // steps
// //   - name
// //   - description
// //   - condition on which it will can used
// //   - argument fuzzers for action
// //   - action to take to get to the next state
// //   - next state name
// //   - model transition (reducer?)

// export type MakeActionDescription<M, D> = (model: M, data: D) => string;
// export type Application<M, O, D, R> = (model: M, oracle: O, data: D) => Promise<R>;

// class Step<M, O, D, R> {
//   constructor(
//     private name: string,
//     private description: string,
//     private fuzzer: Fuzzer<D>,
//     private isValid: (model: M) => boolean,
//     private application: Application<M, O, D, R>,
//     private nextModel: (model: M, result: R, data: D) => M,
//     private nextState: string,
//   ) {}

//   // TODO: in order to have this work, we need to change RANDOM so that it
//   // returns a Promise, so that RoseTree can return a Promise, so that Fuzzers
//   // can return a Promise.
//   public apply(model: M, oracle: O): Fuzzer<R> {
//     return this.fuzzer.map(data => this.application(model, oracle, data));
//   }
// }

// class State<M, O> {
//   constructor(
//     private name: string,
//     private description: (model: M) => string,
//     private validate: (model: M, oracle: O) => Promise<boolean> | boolean,
//     // here we should validate that each step matches either a substate or parent state
//     private steps: Step<M, O, any, any>[],
//     private children: { [name: string]: State<M, O> },
//   ) {}
// }
