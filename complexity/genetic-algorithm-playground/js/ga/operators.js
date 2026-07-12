import { randomInt } from "../rng.js";

export function tournamentSelect(evaluated, tournamentSize, rng) {
  let winner = evaluated[randomInt(rng, evaluated.length)];

  // Tournament selection raises selection pressure as the tournament gets larger.
  for (let i = 1; i < tournamentSize; i += 1) {
    const challenger = evaluated[randomInt(rng, evaluated.length)];
    if (challenger.fitness > winner.fitness) {
      winner = challenger;
    }
  }

  return winner.genome;
}

export function crossover(parentA, parentB, probability, rng) {
  const length = parentA.length;

  // One-point crossover is applied once per parent pair.
  if (length > 1 && rng() < probability) {
    const point = 1 + randomInt(rng, length - 1);
    return [
      parentA.slice(0, point).concat(parentB.slice(point)),
      parentB.slice(0, point).concat(parentA.slice(point))
    ];
  }

  return [parentA.slice(), parentB.slice()];
}

export function mutate(genome, probability, rng) {
  // Bit-flip mutation is applied independently to every bit.
  for (let i = 0; i < genome.length; i += 1) {
    if (rng() < probability) {
      genome[i] = genome[i] === 1 ? 0 : 1;
    }
  }
  return genome;
}
