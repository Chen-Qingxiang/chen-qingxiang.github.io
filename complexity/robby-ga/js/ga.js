import { ACTION_COUNT, POLICY_LENGTH } from "./constants.js";
import { makeRng } from "./rng.js";
import { clonePolicy, makeRandomPolicy } from "./policy.js";
import { evaluatePolicy } from "./simulation.js";

export function initializePopulation(size, rng) {
  const population = [];
  for (let i = 0; i < size; i += 1) {
    population.push(makeRandomPolicy(rng));
  }
  return population;
}

export function tournamentSelect(population, fitnesses, tournamentSize, rng) {
  let bestIndex = rng.int(population.length);
  for (let i = 1; i < tournamentSize; i += 1) {
    const candidateIndex = rng.int(population.length);
    if (fitnesses[candidateIndex] > fitnesses[bestIndex]) {
      bestIndex = candidateIndex;
    }
  }
  return population[bestIndex];
}

export function crossoverPolicy(parentA, parentB, pc, rng) {
  const childA = clonePolicy(parentA);
  const childB = clonePolicy(parentB);
  if (rng.next() >= pc) {
    return [childA, childB];
  }

  const point = 1 + rng.int(POLICY_LENGTH - 1);
  for (let i = point; i < POLICY_LENGTH; i += 1) {
    childA[i] = parentB[i];
    childB[i] = parentA[i];
  }
  return [childA, childB];
}

export function mutatePolicy(policy, pm, rng) {
  for (let i = 0; i < policy.length; i += 1) {
    if (rng.next() < pm) {
      policy[i] = rng.int(ACTION_COUNT);
    }
  }
}

export function createGAState(config) {
  const rng = makeRng(config.seed);
  return {
    config,
    rng,
    generation: 0,
    population: initializePopulation(config.populationSize, rng),
    history: {
      best: [],
      average: []
    },
    bestFitness: -Infinity,
    bestPolicy: null,
    latestAverage: null,
    latestBest: null,
    cancelled: false,
    timer: null
  };
}

export function runOneGeneration(state) {
  const fitnesses = new Array(state.population.length);
  let total = 0;
  let bestIndex = 0;
  let bestFitness = -Infinity;

  const evalConfig = {
    gridSize: state.config.gridSize,
    canProb: state.config.canProb,
    steps: state.config.steps,
    trials: state.config.trials
  };

  for (let i = 0; i < state.population.length; i += 1) {
    const fitness = evaluatePolicy(state.population[i], evalConfig, state.rng);
    fitnesses[i] = fitness;
    total += fitness;
    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestIndex = i;
    }
  }

  const average = total / state.population.length;
  state.latestBest = bestFitness;
  state.latestAverage = average;
  state.history.best.push(bestFitness);
  state.history.average.push(average);

  if (bestFitness > state.bestFitness || !state.bestPolicy) {
    state.bestFitness = bestFitness;
    state.bestPolicy = clonePolicy(state.population[bestIndex]);
  }

  const nextPopulation = [];
  if (state.config.elitism) {
    nextPopulation.push(clonePolicy(state.population[bestIndex]));
  }

  while (nextPopulation.length < state.config.populationSize) {
    const parentA = tournamentSelect(state.population, fitnesses, state.config.tournamentSize, state.rng);
    const parentB = tournamentSelect(state.population, fitnesses, state.config.tournamentSize, state.rng);
    const [childA, childB] = crossoverPolicy(parentA, parentB, state.config.crossoverProb, state.rng);
    mutatePolicy(childA, state.config.mutationProb, state.rng);
    mutatePolicy(childB, state.config.mutationProb, state.rng);
    nextPopulation.push(childA);
    if (nextPopulation.length < state.config.populationSize) {
      nextPopulation.push(childB);
    }
  }

  state.population = nextPopulation;
  state.generation += 1;
  return {
    generation: state.generation,
    bestFitness,
    average
  };
}
