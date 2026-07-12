import assert from "node:assert/strict";
import test from "node:test";

import { createRng } from "../js/rng.js";
import { fitnessOneMax } from "../js/fitness/onemax.js";
import { fitnessTrap } from "../js/fitness/trap.js";
import { createNKLandscape, enumerateNKOptimum, fitnessNK } from "../js/fitness/nk.js";
import { randomGenome } from "../js/ga/genome.js";
import { crossover, mutate } from "../js/ga/operators.js";
import { calculateDiversity } from "../js/ga/diversity.js";
import { runGA } from "../js/ga/runGA.js";

test("fitnessOneMax counts one bits", () => {
  assert.equal(fitnessOneMax([1, 0, 1, 1, 0]), 3);
});

test("fitnessTrap preserves deceptive scoring and partial final blocks", () => {
  assert.equal(fitnessTrap([1, 1, 1, 0, 0], 3), 4);
  assert.equal(fitnessTrap([0, 0, 0, 0, 0], 3), 3);
  assert.equal(fitnessTrap([1, 0, 0, 1, 1], 3), 3);
});

test("createNKLandscape and fitnessNK are deterministic for a seed", () => {
  const a = createNKLandscape(6, 2, "seed");
  const b = createNKLandscape(6, 2, "seed");
  assert.deepEqual(a.dependencies, b.dependencies);
  assert.deepEqual(a.tables, b.tables);
  assert.equal(fitnessNK([1, 0, 1, 0, 1, 0], a), fitnessNK([1, 0, 1, 0, 1, 0], b));
});

test("enumerateNKOptimum returns a valid optimum for small landscapes", () => {
  const landscape = createNKLandscape(4, 1, "small");
  const optimum = enumerateNKOptimum(landscape);
  assert.ok(optimum);
  assert.equal(optimum.genome.length, 4);
  assert.equal(optimum.value, fitnessNK(optimum.genome, landscape));
});

test("randomGenome uses provided RNG and requested length", () => {
  const genome = randomGenome(8, createRng("genome"));
  assert.equal(genome.length, 8);
  assert.ok(genome.every((bit) => bit === 0 || bit === 1));
});

test("crossover and mutate return expected bit strings with deterministic RNGs", () => {
  const [childA, childB] = crossover([1, 1, 1, 1], [0, 0, 0, 0], 1, () => 0);
  assert.deepEqual(childA, [1, 0, 0, 0]);
  assert.deepEqual(childB, [0, 1, 1, 1]);
  assert.deepEqual(mutate([1, 0, 1], 1, () => 0), [0, 1, 0]);
});

test("calculateDiversity matches normalized pairwise Hamming distance", () => {
  assert.equal(calculateDiversity([[0, 0], [1, 1]]), 1);
  assert.equal(calculateDiversity([[0, 0], [0, 0]]), 0);
  assert.equal(calculateDiversity([[0, 0], [0, 1], [1, 1]]), 2 / 3);
});

test("runGA records generation zero through final generation", () => {
  const config = {
    problemKey: "onemax",
    populationSize: 20,
    genomeLength: 8,
    generations: 5,
    crossoverProbability: 0.7,
    mutationProbability: 0.01,
    tournamentSize: 2,
    elitism: true,
    seed: "ga"
  };
  const result = runGA(config, fitnessOneMax);
  assert.equal(result.history.length, config.generations + 1);
  assert.equal(result.history[0].generation, 0);
  assert.equal(result.final.generation, config.generations);
  assert.equal(result.population.length, config.populationSize);
});
