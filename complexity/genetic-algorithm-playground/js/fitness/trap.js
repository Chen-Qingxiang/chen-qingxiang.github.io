export function trapBlockFitness(ones, blockSize) {
  return ones === blockSize ? blockSize : blockSize - 1 - ones;
}

export function fitnessTrap(genome, blockSize) {
  let total = 0;
  for (let start = 0; start < genome.length; start += blockSize) {
    const currentBlockSize = Math.min(blockSize, genome.length - start);
    let ones = 0;

    for (let j = 0; j < currentBlockSize; j += 1) {
      ones += genome[start + j];
    }

    // Deceptive scoring: all ones is globally best, while all zeros is a strong local trap.
    total += trapBlockFitness(ones, currentBlockSize);
  }
  return total;
}
