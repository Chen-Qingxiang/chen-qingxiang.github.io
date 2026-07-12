import { buildProblem } from "../fitness/buildProblem.js";
import { runTrapHillClimber } from "../ga/hillClimber.js";
import { runGA } from "../ga/runGA.js";
import { state } from "../state.js";
import { els } from "./dom.js";
import { readProblemConfig } from "./config.js";
import { updateProblemUI } from "./problemUI.js";
import { clearOutput, renderResult } from "./results.js";

function runSelectedGA() {
  const config = readProblemConfig(state.problem);
  const problem = buildProblem(state.problem, config);
  const result = runGA(config, problem.fitnessFn);
  state.lastResult = { config, problem, result };
  renderResult(state.lastResult);
}

function runTrapComparison() {
  state.problem = "trap";
  updateProblemUI();

  const config = readProblemConfig(state.problem);
  const problem = buildProblem(state.problem, config);
  const result = runGA(config, problem.fitnessFn);
  const hill = runTrapHillClimber(config, problem.blockSize);

  state.lastResult = { config, problem, result, hill };
  renderResult(state.lastResult);
}

export function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.problem = tab.dataset.problem;
      updateProblemUI();
      clearOutput();
    });
  });

  els.runButton.addEventListener("click", runSelectedGA);
  els.resetButton.addEventListener("click", clearOutput);
  els.hillClimbButton.addEventListener("click", runTrapComparison);

  els.randomizeSeed.addEventListener("click", () => {
    const random = window.crypto && window.crypto.getRandomValues
      ? window.crypto.getRandomValues(new Uint32Array(1))[0]
      : Math.floor(Math.random() * 2 ** 32);
    els.randomSeed.value = String(random);
    updateProblemUI();
    clearOutput();
  });

  [
    els.genomeLength,
    els.trapBlockSize,
    els.nkK,
    els.randomSeed
  ].forEach((input) => {
    input.addEventListener("input", updateProblemUI);
  });

  window.addEventListener("resize", () => {
    if (state.lastResult) {
      renderResult(state.lastResult);
    } else {
      clearOutput();
    }
  });
}
