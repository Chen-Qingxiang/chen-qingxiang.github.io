export function randomGenome(length, rng) {
  const genome = new Array(length);
  for (let i = 0; i < length; i += 1) {
    genome[i] = rng() < 0.5 ? 0 : 1;
  }
  return genome;
}
