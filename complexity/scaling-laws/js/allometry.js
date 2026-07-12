import { animalMarkers, colors } from "./data.js";
import { els } from "./dom.js";
import { generatePowerLawData, powerLaw } from "./math.js";
import { drawPlot } from "./plot.js";

export function renderAllometryComparison() {
  const series = [];
  const minM = 0.01;
  const maxM = 10000;
  const pointCount = 240;

  if (els.showAllometryLinear.checked) {
    series.push({
      name: "β = 1 linear",
      color: colors.blue,
      points: generatePowerLawData(minM, maxM, 1, 1, pointCount, true),
    });
  }

  if (els.showAllometrySurface.checked) {
    series.push({
      name: "β = 2/3 surface-like",
      color: colors.orange,
      points: generatePowerLawData(minM, maxM, 1, 2 / 3, pointCount, true),
    });
  }

  if (els.showAllometryMetabolic.checked) {
    series.push({
      name: "β = 3/4 metabolic",
      color: colors.teal,
      points: generatePowerLawData(minM, maxM, 1, 0.75, pointCount, true),
    });
  }

  if (els.showAnimalMarkers.checked) {
    series.push({
      name: "illustrative animal masses",
      color: colors.ink,
      line: false,
      markerOnly: true,
      markers: true,
      labels: true,
      radius: 3.6,
      points: animalMarkers.map((item) => ({
        x: item.x,
        y: powerLaw(item.x, 1, 0.75),
        label: item.name,
      })),
    });
  }

  drawPlot(els.allometryCanvas, series, {
    xScale: "log",
    yScale: "log",
    xLabel: "body mass M (kg, illustrative)",
    yLabel: "relative quantity",
    legend: true,
  });
}
