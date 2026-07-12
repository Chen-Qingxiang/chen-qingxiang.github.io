import { createRng } from "../rng.js";
import { randomGenome } from "./genome.js";
import { tournamentSelect, crossover, mutate } from "./operators.js";
import { calculateDiversity } from "./diversity.js";
import { evaluatePopulation, summarizePopulation } from "./summary.js";

export function runGA(config, fitnessFn) {
  const rng = createRng(`${config.seed}:ga:${config.problemKey}`);
  let population = new Array(config.populationSize);
  for (let i = 0; i < population.length; i += 1) {
    population[i] = randomGenome(config.genomeLength, rng);
  }

  let evaluated = evaluatePopulation(population, fitnessFn);
  const history = [];

  function record(generation) {
    const summary = summarizePopulation(evaluated);
    history.push({
      generation,
      bestFitness: summary.bestFitness,
      averageFitness: summary.averageFitness,
      worstFitness: summary.worstFitness,
      diversity: calculateDiversity(population),
      bestGenome: summary.bestGenome
    });
  }

  record(0);

  for (let generation = 1; generation <= config.generations; generation += 1) {
    const currentSummary = summarizePopulation(evaluated);
    const nextPopulation = [];

    // Elitism copies the current best genome unchanged into the next generation.
    if (config.elitism) {
      nextPopulation.push(currentSummary.bestGenome.slice());
    }

    while (nextPopulation.length < config.populationSize) {
      const parentA = tournamentSelect(evaluated, config.tournamentSize, rng);
      const parentB = tournamentSelect(evaluated, config.tournamentSize, rng);
      const children = crossover(parentA, parentB, config.crossoverProbability, rng);

      nextPopulation.push(mutate(children[0], config.mutationProbability, rng));
      if (nextPopulation.length < config.populationSize) {
        nextPopulation.push(mutate(children[1], config.mutationProbability, rng));
      }
    }

    population = nextPopulation;
    evaluated = evaluatePopulation(population, fitnessFn);
    record(generation);
  }

  const finalSummary = summarizePopulation(evaluated);
  return {
    history,
    population,
    final: {
      ...finalSummary,
      diversity: calculateDiversity(population),
      generation: config.generations
    }
  };
}
