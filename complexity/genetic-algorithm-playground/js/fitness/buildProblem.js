import { fitnessOneMax } from "./onemax.js";
import { fitnessTrap } from "./trap.js";
import { createNKLandscape, enumerateNKOptimum, fitnessNK } from "./nk.js";
import { formatFitness } from "../format.js";

export function buildProblem(problemKey, config) {
  if (problemKey === "onemax") {
    return {
      key: problemKey,
      name: "OneMax",
      fitnessFn: fitnessOneMax,
      optimum: { value: config.genomeLength, label: `Global optimum fitness = ${config.genomeLength}` }
    };
  }

  if (problemKey === "trap") {
    return {
      key: problemKey,
      name: "Deceptive Trap Function",
      blockSize: config.trapBlockSize,
      fitnessFn: (genome) => fitnessTrap(genome, config.trapBlockSize),
      optimum: { value: config.genomeLength, label: `Global optimum fitness = ${config.genomeLength}` }
    };
  }

  const landscape = createNKLandscape(config.genomeLength, config.nkK, config.seed);
  const optimum = enumerateNKOptimum(landscape);

  return {
    key: problemKey,
    name: "NK Landscape",
    landscape,
    fitnessFn: (genome) => fitnessNK(genome, landscape),
    optimum: optimum
      ? { value: optimum.value, genome: optimum.genome, label: `Enumerated optimum fitness = ${formatFitness(optimum.value, "nk")}` }
      : { value: null, label: "Global optimum not enumerated for N > 16" }
  };
}
