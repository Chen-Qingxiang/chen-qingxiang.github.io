import { encodePercept, perceptIndex, perceptValues } from "../percept.js";
import { actionName } from "../policy.js";
import { makeRng } from "../rng.js";
import { stepRobby } from "../simulation.js";
import { makeWorld } from "../world.js";
import { drawWorld } from "../drawing/drawWorld.js";
import { app } from "./appState.js";
import { readFloat, readInt } from "./controls.js";
import { els } from "./dom.js";
import { shortPerceptText } from "./policyInspector.js";

export function selectedPolicy() {
  const selected = els.policySelector.value;
  if (selected === "best" && app.policies.best) {
    return app.policies.best;
  }
  if (selected === "hand") {
    return app.policies.hand;
  }
  return app.policies.random;
}

export function generateDemoWorld() {
  pauseDemo();
  const size = readInt(els.gridSizeInput, 10, 4, 30);
  const canProb = readFloat(els.demoCanProbInput, 0.5, 0, 1);
  const seed = `${els.seedInput.value || "demo"}-${Date.now()}-${Math.random()}`;
  const rng = makeRng(seed);
  app.demo.world = makeWorld(size, canProb, rng);
  app.demo.initialCells = new Uint8Array(app.demo.world.cells);
  app.demo.rng = makeRng(`${seed}-actions`);
  resetEpisode(false);
}

export function resetEpisode(keepWorld) {
  pauseDemo();
  if (!keepWorld || !app.demo.world) {
    if (!app.demo.world) {
      generateDemoWorld();
      return;
    }
  }
  if (app.demo.initialCells) {
    app.demo.world.cells = new Uint8Array(app.demo.initialCells);
  }
  app.demo.row = 0;
  app.demo.col = 0;
  app.demo.score = 0;
  app.demo.step = 0;
  updateDemo();
}

export function stepDemo() {
  if (app.demo.step >= app.demo.maxSteps) {
    pauseDemo();
    return;
  }

  const policy = selectedPolicy();
  const index = perceptIndex(app.demo.world, app.demo.row, app.demo.col);
  const result = stepRobby(app.demo.world, app.demo.row, app.demo.col, policy[index], app.demo.rng);
  app.demo.row = result.row;
  app.demo.col = result.col;
  app.demo.score += result.reward;
  app.demo.step += 1;
  updateDemo();

  if (app.demo.step >= app.demo.maxSteps) {
    pauseDemo();
  }
}

export function updateDemo() {
  if (!app.demo.world) return;

  const values = perceptValues(app.demo.world, app.demo.row, app.demo.col);
  const index = encodePercept(values);
  const policy = selectedPolicy();
  const policyAction = policy[index];

  els.demoScore.textContent = String(app.demo.score);
  els.demoStep.textContent = `${app.demo.step} / ${app.demo.maxSteps}`;
  els.demoPercept.textContent = shortPerceptText(values, index);
  els.demoAction.textContent = actionName(policyAction);

  drawWorld(els.worldCanvas, app.demo.world, { row: app.demo.row, col: app.demo.col });
}

export function startDemo() {
  if (app.demo.running) return;
  app.demo.running = true;
  els.runPauseButton.textContent = "Pause";
  scheduleDemoTick();
}

export function pauseDemo() {
  app.demo.running = false;
  if (app.demo.timer) {
    clearTimeout(app.demo.timer);
    app.demo.timer = null;
  }
  if (els.runPauseButton) {
    els.runPauseButton.textContent = "Run";
  }
}

export function scheduleDemoTick() {
  if (!app.demo.running) return;
  const speed = readInt(els.speedInput, 8, 1, 30);
  app.demo.timer = setTimeout(() => {
    stepDemo();
    scheduleDemoTick();
  }, 1000 / speed);
}
