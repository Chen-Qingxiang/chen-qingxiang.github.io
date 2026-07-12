import { drawEmptyChart } from "../charts/canvas.js";
import { drawLineChart } from "../charts/lineChart.js";
import { formatFitness, formatGenome } from "../format.js";
import { state } from "../state.js";
import { els } from "./dom.js";

export function renderResult(run) {
  const { problem, result, hill } = run;
  const final = result.final;
  const optimumValue = problem.optimum.value;
  const problemKey = problem.key || state.problem;

  els.summaryBest.textContent = formatFitness(final.bestFitness, problemKey);
  els.summaryAverage.textContent = formatFitness(final.averageFitness, problemKey);
  els.summaryDiversity.textContent = final.diversity.toFixed(3);
  els.summaryGenerations.textContent = String(final.generation);

  if (optimumValue == null) {
    els.summarySuccess.textContent = "Global optimum not enumerated";
  } else if (final.bestFitness >= optimumValue - 1e-10) {
    els.summarySuccess.textContent = `Success (${problem.optimum.label})`;
  } else {
    els.summarySuccess.textContent = `Not success (${problem.optimum.label})`;
  }

  els.bestFitness.textContent = `Best fitness: ${formatFitness(final.bestFitness, problemKey)}. ${problem.optimum.label}.`;
  els.bestGenome.textContent = formatGenome(final.bestGenome);

  if (hill) {
    const gap = optimumValue == null ? "" : `, optimum ${formatFitness(optimumValue, problemKey)}`;
    els.hillClimbResult.hidden = false;
    els.hillClimbResult.innerHTML = `
      <h3>Hill Climbing Comparison</h3>
      <p><strong>GA best:</strong> ${formatFitness(final.bestFitness, problemKey)}${gap}</p>
      <p><strong>Hill climber best:</strong> ${formatFitness(hill.bestFitness, problemKey)} from ${hill.restarts} restarts (${hill.evaluations} fitness evaluations).</p>
      <p class="hint">The hill climber uses steepest-ascent single-bit flips, so it often settles in trap local optima.</p>
    `;
  } else {
    els.hillClimbResult.hidden = true;
    els.hillClimbResult.innerHTML = "";
  }

  const fitnessMax = optimumValue == null
    ? Math.max(...result.history.map((point) => point.bestFitness))
    : Math.max(optimumValue, ...result.history.map((point) => point.bestFitness));

  drawLineChart(els.fitnessChart, {
    series: [
      { values: result.history.map((point) => point.bestFitness), color: getCssColor("--best"), label: "Best" },
      { values: result.history.map((point) => point.averageFitness), color: getCssColor("--average"), label: "Average" }
    ],
    minY: 0,
    maxY: fitnessMax,
    xLabel: "generation",
    yFormatter: (value) => formatFitness(value, problemKey)
  });

  drawLineChart(els.diversityChart, {
    series: [
      { values: result.history.map((point) => point.diversity), color: getCssColor("--diversity"), label: "Diversity" }
    ],
    minY: 0,
    maxY: 1,
    xLabel: "generation",
    yFormatter: (value) => value.toFixed(2)
  });
}

export function clearOutput() {
  state.lastResult = null;
  els.summaryBest.textContent = "-";
  els.summaryAverage.textContent = "-";
  els.summaryDiversity.textContent = "-";
  els.summaryGenerations.textContent = "-";
  els.summarySuccess.textContent = "Not run";
  els.bestFitness.textContent = "Run the GA to see the best genome.";
  els.bestGenome.textContent = "-";
  els.hillClimbResult.hidden = true;
  els.hillClimbResult.innerHTML = "";
  drawEmptyChart(els.fitnessChart, "Run the GA to draw fitness history");
  drawEmptyChart(els.diversityChart, "Run the GA to draw diversity history");
}

export function getCssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
