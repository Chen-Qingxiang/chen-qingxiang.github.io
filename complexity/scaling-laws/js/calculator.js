import { els, readNumber } from "./dom.js";
import { formatBeta, formatNumber } from "./format.js";

export function updateDoublingCalculator() {
  const beta = readNumber(els.calcBeta, 0.75);
  const scaleFactor = Math.max(0.0001, readNumber(els.scaleFactor, 2));
  const multiplier = Math.pow(scaleFactor, beta);

  els.calcBetaValue.textContent = formatBeta(beta);
  els.calculatorOutput.textContent =
    `${formatNumber(scaleFactor)}^${formatBeta(beta)} = ${formatNumber(multiplier)}`;
}
