import { MAX_NK_K } from "../constants.js";
import { els } from "./dom.js";

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

export function readInt(input, fallback, min, max) {
  const value = Math.round(clampNumber(input.value, min, max, fallback));
  input.value = String(value);
  return value;
}

export function readFloat(input, fallback, min, max) {
  const value = clampNumber(input.value, min, max, fallback);
  input.value = String(value);
  return value;
}

export function readCommonConfig() {
  const populationSize = readInt(els.populationSize, 100, 10, 1000);
  const genomeLength = readInt(els.genomeLength, 40, 4, 200);
  const generations = readInt(els.generations, 150, 1, 1000);
  const crossoverProbability = readFloat(els.crossoverProbability, 0.7, 0, 1);
  const mutationProbability = readFloat(els.mutationProbability, 0.01, 0, 1);
  const tournamentSize = readInt(els.tournamentSize, 2, 1, populationSize);
  const seed = els.randomSeed.value.trim() || "0";

  return {
    populationSize,
    genomeLength,
    generations,
    crossoverProbability,
    mutationProbability,
    tournamentSize,
    elitism: els.elitism.checked,
    seed
  };
}

export function readTrapConfig(genomeLength) {
  return {
    trapBlockSize: readInt(els.trapBlockSize, 5, 2, Math.min(20, genomeLength))
  };
}

export function readNKConfig(genomeLength) {
  const kMax = Math.min(MAX_NK_K, genomeLength - 1);
  els.nkK.max = String(kMax);
  return {
    nkK: readInt(els.nkK, 2, 0, kMax)
  };
}

export function readProblemConfig(problemKey) {
  const common = readCommonConfig();
  const trap = problemKey === "trap" ? readTrapConfig(common.genomeLength) : {};
  const nk = problemKey === "nk" ? readNKConfig(common.genomeLength) : {};

  return {
    ...common,
    ...trap,
    ...nk,
    problemKey
  };
}
