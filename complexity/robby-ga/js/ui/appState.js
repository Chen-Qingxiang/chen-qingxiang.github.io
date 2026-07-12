import { DEFAULT_EPISODE_STEPS } from "../constants.js";
import { makeRng } from "../rng.js";
import { makeHandCodedPolicy, makeRandomPolicy } from "../policy.js";

export const app = {
  policies: {
    random: makeRandomPolicy(makeRng("initial-random-policy")),
    hand: makeHandCodedPolicy(),
    best: null
  },
  demo: {
    world: null,
    initialCells: null,
    row: 0,
    col: 0,
    score: 0,
    step: 0,
    maxSteps: DEFAULT_EPISODE_STEPS,
    rng: makeRng("demo-actions"),
    running: false,
    timer: null
  },
  training: null
};
