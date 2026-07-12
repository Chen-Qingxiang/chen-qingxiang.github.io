export function evaluatePopulation(population, fitnessFn) {
  return population.map((genome) => ({
    genome,
    fitness: fitnessFn(genome)
  }));
}

export function summarizePopulation(evaluated) {
  let best = evaluated[0];
  let worst = evaluated[0];
  let total = 0;

  for (let i = 0; i < evaluated.length; i += 1) {
    const item = evaluated[i];
    total += item.fitness;
    if (item.fitness > best.fitness) {
      best = item;
    }
    if (item.fitness < worst.fitness) {
      worst = item;
    }
  }

  return {
    bestGenome: best.genome.slice(),
    bestFitness: best.fitness,
    averageFitness: total / evaluated.length,
    worstFitness: worst.fitness
  };
}
