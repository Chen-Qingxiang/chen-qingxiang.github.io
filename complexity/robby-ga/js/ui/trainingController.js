import { clonePolicy } from "../policy.js";
import { createGAState, runOneGeneration } from "../ga.js";
import { drawFitnessChart } from "../drawing/drawFitnessChart.js";
import { app } from "./appState.js";
import { readFloat, readInt } from "./controls.js";
import { els } from "./dom.js";
import { updateDemo } from "./demoController.js";
import { updatePolicyInspector } from "./policyInspector.js";

export function readGAConfig() {
  const populationSize = readInt(els.populationInput, 100, 10, 500);
  const generations = readInt(els.generationsInput, 100, 1, 1000);
  const mutationProb = readFloat(els.mutationInput, 0.01, 0, 0.2);
  const crossoverProb = readFloat(els.crossoverInput, 0.7, 0, 1);
  const tournamentSize = readInt(els.tournamentInput, 2, 2, Math.max(2, populationSize));
  const trials = readInt(els.trialsInput, 20, 1, 200);
  const steps = readInt(els.episodeStepsInput, 200, 10, 1000);
  const canProb = readFloat(els.trainCanProbInput, 0.5, 0, 1);

  return {
    populationSize,
    generations,
    mutationProb,
    crossoverProb,
    tournamentSize,
    trials,
    steps,
    canProb,
    gridSize: readInt(els.gridSizeInput, 10, 4, 30),
    seed: els.seedInput.value || "robby-1",
    elitism: els.elitismInput.checked
  };
}

export function startTraining() {
  stopTrainingTimer();
  const config = readGAConfig();
  app.training = createGAState(config);
  els.trainButton.disabled = true;
  els.stopButton.disabled = false;
  els.trainingStatus.textContent = "Training";
  updateTrainingStats();
  drawFitnessChart(els.fitnessCanvas, app.training.history);
  runTrainingLoop();
}

export function stopTrainingTimer() {
  if (app.training && app.training.timer) {
    clearTimeout(app.training.timer);
    app.training.timer = null;
  }
}

export function stopTraining() {
  if (!app.training) return;
  app.training.cancelled = true;
  stopTrainingTimer();
  els.trainButton.disabled = false;
  els.stopButton.disabled = true;
  els.trainingStatus.textContent = "Stopped";
}

export function resetTraining() {
  stopTraining();
  app.training = null;
  app.policies.best = null;
  els.policySelector.querySelector('option[value="best"]').disabled = true;
  if (els.policySelector.value === "best") {
    els.policySelector.value = "hand";
  }
  els.generationStat.textContent = `0 / ${readInt(els.generationsInput, 100, 1, 1000)}`;
  els.bestStat.textContent = "-";
  els.averageStat.textContent = "-";
  els.trainingStatus.textContent = "Idle";
  drawFitnessChart(els.fitnessCanvas, { best: [], average: [] });
  updateDemo();
  updatePolicyInspector();
}

export function runTrainingLoop() {
  const state = app.training;
  if (!state || state.cancelled) return;

  const startTime = performance.now();
  do {
    runOneGeneration(state);
    app.policies.best = clonePolicy(state.bestPolicy);
  } while (
    state.generation < state.config.generations &&
    performance.now() - startTime < 28 &&
    !state.cancelled
  );

  els.policySelector.querySelector('option[value="best"]').disabled = false;
  updateTrainingStats();
  drawFitnessChart(els.fitnessCanvas, state.history);
  if (els.policySelector.value === "best") {
    updateDemo();
  }
  updatePolicyInspector();

  if (state.generation < state.config.generations && !state.cancelled) {
    // Yield to the browser between small batches so controls remain responsive.
    state.timer = setTimeout(runTrainingLoop, 0);
  } else {
    els.trainButton.disabled = false;
    els.stopButton.disabled = true;
    els.trainingStatus.textContent = state.cancelled ? "Stopped" : "Done";
  }
}

export function updateTrainingStats() {
  const totalGenerations = app.training ? app.training.config.generations : readInt(els.generationsInput, 100, 1, 1000);
  const generation = app.training ? app.training.generation : 0;
  els.generationStat.textContent = `${generation} / ${totalGenerations}`;

  if (!app.training || app.training.latestBest === null) {
    els.bestStat.textContent = "-";
    els.averageStat.textContent = "-";
    return;
  }

  els.bestStat.textContent = app.training.bestFitness.toFixed(2);
  els.averageStat.textContent = app.training.latestAverage.toFixed(2);
}
