export function calculateDiversity(population) {
  if (population.length < 2 || population[0].length === 0) {
    return 0;
  }

  const length = population[0].length;
  const pairs = (population.length * (population.length - 1)) / 2;
  let differingPairs = 0;

  // Counts per locus avoid the O(population^2 * genomeLength) pairwise loop.
  for (let locus = 0; locus < length; locus += 1) {
    let ones = 0;
    for (let i = 0; i < population.length; i += 1) {
      ones += population[i][locus];
    }
    differingPairs += ones * (population.length - ones);
  }

  return differingPairs / (pairs * length);
}
