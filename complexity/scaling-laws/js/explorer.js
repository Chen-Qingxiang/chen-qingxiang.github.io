import { colors } from "./data.js";
import { els, readNumber } from "./dom.js";
import { formatBeta, formatNumber } from "./format.js";
import { generatePowerLawData } from "./math.js";
import { drawPlot } from "./plot.js";

export function getExplorerSettings() {
  const beta = readNumber(els.beta, 0.75);
  const y0 = Math.max(0.0001, readNumber(els.y0, 1));
  const mMin = Math.max(1e-9, readNumber(els.mMin, 1));
  let mMax = Math.max(1e-8, readNumber(els.mMax, 1000));
  const points = Math.max(20, Math.min(600, readNumber(els.points, 200)));
  const scale = document.querySelector("input[name='plotScale']:checked")?.value || "linear";

  if (mMax <= mMin) mMax = mMin * 10;
  return { beta, y0, mMin, mMax, points, scale };
}

export function classifyBeta(beta) {
  if (beta < 0.98) return "sublinear";
  if (beta > 1.02) return "superlinear";
  return "linear";
}

export function colorForBeta(beta) {
  if (beta < 0.98) return colors.teal;
  if (beta > 1.02) return colors.red;
  return colors.blue;
}

export function updateFormula(settings) {
  els.betaValue.textContent = formatBeta(settings.beta);
  els.pointsValue.textContent = String(Math.round(settings.points));
  els.currentFormula.innerHTML = `Y = ${formatNumber(settings.y0)} * M<sup>${formatBeta(settings.beta)}</sup>`;

  const className = classifyBeta(settings.beta);
  const doubleMultiplier = Math.pow(2, settings.beta);
  els.exponentMeaning.textContent =
    `Current β is ${formatBeta(settings.beta)}, so this is ${className} scaling. ` +
    `A 2x increase in M multiplies Y by about ${formatNumber(doubleMultiplier)}.`;
}

export function renderPowerLawExplorer() {
  const settings = getExplorerSettings();
  updateFormula(settings);

  const useLogAxes = settings.scale === "loglog";
  const data = generatePowerLawData(
    settings.mMin,
    settings.mMax,
    settings.y0,
    settings.beta,
    settings.points,
    true
  );

  drawPlot(
    els.explorerCanvas,
    [
      {
        name: `β = ${formatBeta(settings.beta)}`,
        color: colorForBeta(settings.beta),
        points: data,
      },
    ],
    {
      xScale: useLogAxes ? "log" : "linear",
      yScale: useLogAxes ? "log" : "linear",
      xLabel: "M (scale)",
      yLabel: "Y",
      includeZeroY: !useLogAxes,
      legend: false,
    }
  );
}
