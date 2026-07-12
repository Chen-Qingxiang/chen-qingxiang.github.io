import { els } from "./dom.js";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function readInt(input, fallback, min, max) {
  const value = Number.parseInt(input.value, 10);
  const result = Number.isFinite(value) ? value : fallback;
  return clamp(result, min, max);
}

export function readFloat(input, fallback, min, max) {
  const value = Number.parseFloat(input.value);
  const result = Number.isFinite(value) ? value : fallback;
  return clamp(result, min, max);
}

export function updateControlLabels() {
  els.demoCanProbValue.textContent = readFloat(els.demoCanProbInput, 0.5, 0, 1).toFixed(2);
  els.speedValue.textContent = `${readInt(els.speedInput, 8, 1, 30)} steps/s`;
}

export function randomizeSeed() {
  const randomPart = Math.floor(Math.random() * 1_000_000).toString(36);
  els.seedInput.value = `robby-${randomPart}`;
}
