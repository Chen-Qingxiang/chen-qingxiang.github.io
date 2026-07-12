export function fitnessOneMax(genome) {
  let score = 0;
  for (let i = 0; i < genome.length; i += 1) {
    score += genome[i];
  }
  return score;
}
