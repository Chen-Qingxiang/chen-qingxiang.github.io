import { NK_ENUMERATION_LIMIT } from "../constants.js";
import { createRng, randomInt } from "../rng.js";

export function createNKLandscape(length, k, seed) {
  const rng = createRng(`${seed}:nk-landscape`);
  const dependencies = [];
  const tables = [];
  const tableSize = 2 ** (k + 1);

  for (let locus = 0; locus < length; locus += 1) {
    const available = [];
    for (let other = 0; other < length; other += 1) {
      if (other !== locus) {
        available.push(other);
      }
    }

    const selected = [];
    while (selected.length < k) {
      const index = randomInt(rng, available.length);
      selected.push(available.splice(index, 1)[0]);
    }

    // Each local table is indexed by x_i followed by the selected interacting loci.
    const localDependencies = [locus, ...selected];
    const table = new Array(tableSize);
    for (let entry = 0; entry < tableSize; entry += 1) {
      table[entry] = rng();
    }

    dependencies.push(localDependencies);
    tables.push(table);
  }

  return { length, k, dependencies, tables };
}

export function fitnessNK(genome, landscape) {
  let total = 0;

  for (let locus = 0; locus < landscape.length; locus += 1) {
    const deps = landscape.dependencies[locus];
    let tableIndex = 0;

    for (let j = 0; j < deps.length; j += 1) {
      tableIndex = (tableIndex << 1) | genome[deps[j]];
    }

    total += landscape.tables[locus][tableIndex];
  }

  return total / landscape.length;
}

export function enumerateNKOptimum(landscape) {
  if (landscape.length > NK_ENUMERATION_LIMIT) {
    return null;
  }

  const totalGenomes = 2 ** landscape.length;
  let bestFitness = -Infinity;
  let bestGenome = null;

  for (let mask = 0; mask < totalGenomes; mask += 1) {
    const genome = new Array(landscape.length);
    for (let bit = 0; bit < landscape.length; bit += 1) {
      genome[landscape.length - 1 - bit] = (mask >> bit) & 1;
    }

    const fitness = fitnessNK(genome, landscape);
    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestGenome = genome;
    }
  }

  return { value: bestFitness, genome: bestGenome };
}
