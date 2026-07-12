import { createRng } from "../rng.js";
import { fitnessTrap } from "../fitness/trap.js";
import { randomGenome } from "./genome.js";

export function runTrapHillClimber(config, blockSize) {
  const rng = createRng(`${config.seed}:hill-climb:${blockSize}`);
  const restarts = Math.min(config.populationSize, 80);
  let bestGenome = null;
  let bestFitness = -Infinity;
  let evaluations = 0;

  for (let restart = 0; restart < restarts; restart += 1) {
    let genome = randomGenome(config.genomeLength, rng);
    let fitness = fitnessTrap(genome, blockSize);
    evaluations += 1;
    let improved = true;

    while (improved) {
      improved = false;
      let neighborBest = genome;
      let neighborBestFitness = fitness;

      for (let bit = 0; bit < genome.length; bit += 1) {
        const neighbor = genome.slice();
        neighbor[bit] = neighbor[bit] === 1 ? 0 : 1;
        const neighborFitness = fitnessTrap(neighbor, blockSize);
        evaluations += 1;

        if (neighborFitness > neighborBestFitness) {
          neighborBest = neighbor;
          neighborBestFitness = neighborFitness;
        }
      }

      if (neighborBestFitness > fitness) {
        genome = neighborBest;
        fitness = neighborBestFitness;
        improved = true;
      }
    }

    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestGenome = genome.slice();
    }
  }

  return {
    restarts,
    evaluations,
    bestGenome,
    bestFitness
  };
}
