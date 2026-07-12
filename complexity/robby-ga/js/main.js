import { drawFitnessChart } from "./drawing/drawFitnessChart.js";
import { runSelfChecks } from "./selfChecks.js";
import { randomizeSeed, updateControlLabels } from "./ui/controls.js";
import { els } from "./ui/dom.js";
import {
  generateDemoWorld,
  pauseDemo,
  resetEpisode,
  startDemo,
  stepDemo,
  updateDemo
} from "./ui/demoController.js";
import { updatePolicyInspector } from "./ui/policyInspector.js";
import {
  resetTraining,
  startTraining,
  stopTraining,
  updateTrainingStats
} from "./ui/trainingController.js";

function bindEvents() {
  els.newWorldButton.addEventListener("click", () => {
    generateDemoWorld();
    updatePolicyInspector();
  });
  els.resetEpisodeButton.addEventListener("click", () => {
    resetEpisode(true);
    updatePolicyInspector();
  });
  els.stepButton.addEventListener("click", () => {
    stepDemo();
    updatePolicyInspector();
  });
  els.runPauseButton.addEventListener("click", () => {
    if (els.runPauseButton.textContent === "Pause") pauseDemo();
    else startDemo();
  });

  els.policySelector.addEventListener("change", () => {
    updateDemo();
    updatePolicyInspector();
  });

  els.demoCanProbInput.addEventListener("input", updateControlLabels);
  els.speedInput.addEventListener("input", updateControlLabels);
  els.gridSizeInput.addEventListener("change", () => {
    generateDemoWorld();
    updatePolicyInspector();
  });
  els.demoCanProbInput.addEventListener("change", () => {
    generateDemoWorld();
    updatePolicyInspector();
  });

  els.trainButton.addEventListener("click", startTraining);
  els.stopButton.addEventListener("click", stopTraining);
  els.resetTrainingButton.addEventListener("click", resetTraining);
  els.randomSeedButton.addEventListener("click", randomizeSeed);
  els.generationsInput.addEventListener("change", updateTrainingStats);
}

runSelfChecks();
bindEvents();
updateControlLabels();
generateDemoWorld();
drawFitnessChart(els.fitnessCanvas, { best: [], average: [] });
updatePolicyInspector();
