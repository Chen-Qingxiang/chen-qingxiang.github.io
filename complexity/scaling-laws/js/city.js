import { cityPresets, colors } from "./data.js";
import { els, readNumber } from "./dom.js";
import { formatBeta } from "./format.js";
import { generatePowerLawData } from "./math.js";
import { drawPlot } from "./plot.js";
import { colorForBeta } from "./explorer.js";

export function renderCityScalingComparison() {
  const beta = readNumber(els.cityBeta, 1.15);
  const nMin = Math.max(1, readNumber(els.cityNMin, 10000));
  let nMax = Math.max(2, readNumber(els.cityNMax, 10000000));
  if (nMax <= nMin) nMax = nMin * 10;

  const data = generatePowerLawData(nMin, nMax, 1, beta, 220, true);
  const series = [
    {
      name: `selected β = ${formatBeta(beta)}`,
      color: colorForBeta(beta),
      points: data,
    },
  ];

  if (Math.abs(beta - 1) > 0.02) {
    series.push({
      name: "linear reference, β = 1",
      color: colors.gray,
      dash: [6, 4],
      points: generatePowerLawData(nMin, nMax, 1, 1, 220, true),
    });
  }

  els.cityBetaValue.textContent = formatBeta(beta);
  els.cityFormula.innerHTML = `Y = 1 * N<sup>${formatBeta(beta)}</sup>`;

  const presetText = cityPresets[els.cityPreset.value]?.text;
  const fallbackText =
    beta < 0.98
      ? "Custom sublinear scaling: Y grows more slowly than system size N."
      : beta > 1.02
        ? "Custom superlinear scaling: Y grows faster than system size N."
        : "Custom near-linear scaling: Y changes roughly in proportion to system size N.";
  els.cityInterpretation.textContent = presetText || fallbackText;

  drawPlot(els.cityCanvas, series, {
    xScale: "log",
    yScale: "log",
    xLabel: "system size N",
    yLabel: "Y (relative)",
    legend: true,
  });
}
