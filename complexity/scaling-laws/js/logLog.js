import { colors } from "./data.js";
import { els } from "./dom.js";
import { formatBeta } from "./format.js";
import { generatePowerLawData } from "./math.js";
import { drawPlot } from "./plot.js";
import { colorForBeta, getExplorerSettings } from "./explorer.js";

export function renderLogLogView() {
  const settings = getExplorerSettings();
  const data = generatePowerLawData(
    settings.mMin,
    settings.mMax,
    settings.y0,
    settings.beta,
    settings.points,
    true
  );

  els.logSlopeValue.textContent = formatBeta(settings.beta);
  drawPlot(
    els.logCanvas,
    [
      {
        name: `power law, β = ${formatBeta(settings.beta)}`,
        color: colorForBeta(settings.beta),
        points: data,
      },
    ],
    {
      xScale: "log",
      yScale: "log",
      xLabel: "log scale for M",
      yLabel: "log scale for Y",
      slopeGuide: { beta: settings.beta, color: colors.red },
      legend: false,
    }
  );
}
