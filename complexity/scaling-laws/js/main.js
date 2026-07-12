import { renderAllometryComparison } from "./allometry.js";
import { updateDoublingCalculator } from "./calculator.js";
import { renderCityScalingComparison } from "./city.js";
import { cityPresets } from "./data.js";
import { els } from "./dom.js";
import { renderPowerLawExplorer } from "./explorer.js";
import { renderLogLogView } from "./logLog.js";

function renderAll() {
  renderPowerLawExplorer();
  renderLogLogView();
  renderAllometryComparison();
  renderCityScalingComparison();
  updateDoublingCalculator();
}

function scheduleRender() {
  if (scheduleRender.frame) cancelAnimationFrame(scheduleRender.frame);
  scheduleRender.frame = requestAnimationFrame(renderAll);
}

function bindEvents() {
  [els.beta, els.y0, els.mMin, els.mMax, els.points].forEach((input) => {
    input.addEventListener("input", scheduleRender);
  });

  document.querySelectorAll("input[name='plotScale']").forEach((input) => {
    input.addEventListener("change", scheduleRender);
  });

  document.querySelectorAll("[data-explorer-beta]").forEach((button) => {
    button.addEventListener("click", () => {
      els.beta.value = button.dataset.explorerBeta;
      scheduleRender();
    });
  });

  [
    els.showAllometryLinear,
    els.showAllometrySurface,
    els.showAllometryMetabolic,
    els.showAnimalMarkers,
  ].forEach((input) => input.addEventListener("change", renderAllometryComparison));

  els.cityPreset.addEventListener("change", () => {
    const preset = cityPresets[els.cityPreset.value];
    if (preset) {
      els.cityBeta.value = String(preset.beta);
    }
    renderCityScalingComparison();
  });

  [els.cityBeta, els.cityNMin, els.cityNMax].forEach((input) => {
    input.addEventListener("input", () => {
      if (input === els.cityBeta) {
        const matchedPreset = Object.entries(cityPresets).find(([, preset]) => {
          return Math.abs(preset.beta - Number(els.cityBeta.value)) < 0.001;
        });
        els.cityPreset.value = matchedPreset ? matchedPreset[0] : "custom";
      }
      renderCityScalingComparison();
    });
  });

  [els.calcBeta, els.scaleFactor].forEach((input) => {
    input.addEventListener("input", updateDoublingCalculator);
  });

  window.addEventListener("resize", scheduleRender);
}

bindEvents();
renderAll();
