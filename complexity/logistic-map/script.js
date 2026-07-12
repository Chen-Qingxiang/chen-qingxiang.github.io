"use strict";

const DEFAULTS = {
  r: 3.7,
  x0: 0.2,
  iterations: 200,
  transients: 50,
  epsilon: 0.000001,
  bifRMin: 2.5,
  bifRMax: 4,
  bifSamples: 700,
  bifIterations: 550
};

const controls = {
  rRange: document.getElementById("rRange"),
  rNumber: document.getElementById("rNumber"),
  x0Range: document.getElementById("x0Range"),
  x0Number: document.getElementById("x0Number"),
  iterations: document.getElementById("iterationsInput"),
  transients: document.getElementById("transientInput"),
  epsilon: document.getElementById("epsilonInput"),
  bifRMin: document.getElementById("bifRMin"),
  bifRMax: document.getElementById("bifRMax"),
  bifSamples: document.getElementById("bifSamples"),
  bifIterations: document.getElementById("bifIterations"),
  renderButton: document.getElementById("renderButton"),
  resetButton: document.getElementById("resetButton")
};

const canvases = {
  time: document.getElementById("timeCanvas"),
  cobweb: document.getElementById("cobwebCanvas"),
  bifurcation: document.getElementById("bifurcationCanvas"),
  sensitivity: document.getElementById("sensitivityCanvas")
};

let renderTimer = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readNumber(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function setControlValue(input, value) {
  input.value = String(value);
}

function syncPair(rangeInput, numberInput, min, max) {
  const nextValue = clamp(readNumber(rangeInput, min), min, max);
  setControlValue(rangeInput, nextValue);
  setControlValue(numberInput, nextValue);
}

function getState() {
  const r = clamp(readNumber(controls.rNumber, DEFAULTS.r), 0, 4);
  const x0 = clamp(readNumber(controls.x0Number, DEFAULTS.x0), 0, 1);
  const iterations = Math.round(clamp(readNumber(controls.iterations, DEFAULTS.iterations), 20, 2000));
  const transients = Math.round(clamp(readNumber(controls.transients, DEFAULTS.transients), 0, 1000));
  const epsilon = clamp(readNumber(controls.epsilon, DEFAULTS.epsilon), 0.000000001, 0.1);

  let bifRMin = clamp(readNumber(controls.bifRMin, DEFAULTS.bifRMin), 0, 4);
  let bifRMax = clamp(readNumber(controls.bifRMax, DEFAULTS.bifRMax), 0, 4);
  if (bifRMax <= bifRMin) {
    if (bifRMin >= 4) {
      bifRMin = 3.99;
      bifRMax = 4;
    } else {
      bifRMax = Math.min(4, bifRMin + 0.01);
    }
  }

  return {
    r,
    x0,
    iterations,
    transients,
    epsilon,
    bifRMin,
    bifRMax,
    bifSamples: Math.round(clamp(readNumber(controls.bifSamples, DEFAULTS.bifSamples), 100, 1400)),
    bifIterations: Math.round(clamp(readNumber(controls.bifIterations, DEFAULTS.bifIterations), 100, 2000))
  };
}

function writeState(state) {
  setControlValue(controls.rRange, state.r);
  setControlValue(controls.rNumber, state.r);
  setControlValue(controls.x0Range, state.x0);
  setControlValue(controls.x0Number, state.x0);
  setControlValue(controls.iterations, state.iterations);
  setControlValue(controls.transients, state.transients);
  setControlValue(controls.epsilon, state.epsilon);
  setControlValue(controls.bifRMin, state.bifRMin);
  setControlValue(controls.bifRMax, state.bifRMax);
  setControlValue(controls.bifSamples, state.bifSamples);
  setControlValue(controls.bifIterations, state.bifIterations);
}

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderAll, 35);
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width));
  const height = Math.max(240, Math.round(rect.height));

  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

function plotArea(width, height, options = {}) {
  const left = options.left ?? 58;
  const right = options.right ?? 22;
  const top = options.top ?? 24;
  const bottom = options.bottom ?? 46;

  return {
    left,
    right: width - right,
    top,
    bottom: height - bottom,
    width: width - left - right,
    height: height - top - bottom
  };
}

function drawAxes(ctx, area, xLabel, yLabel, options = {}) {
  ctx.save();
  ctx.strokeStyle = "#d9e2de";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#5f6f6a";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i += 1) {
    const y = area.bottom - (i / 4) * area.height;
    ctx.beginPath();
    ctx.moveTo(area.left, y);
    ctx.lineTo(area.right, y);
    ctx.stroke();
    ctx.fillText((i / 4).toFixed(2), 12, y);
  }

  const xTicks = options.xTicks ?? 5;
  const xMin = options.xMin ?? 0;
  const xMax = options.xMax ?? 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= xTicks; i += 1) {
    const x = area.left + (i / xTicks) * area.width;
    const value = xMin + (i / xTicks) * (xMax - xMin);
    ctx.beginPath();
    ctx.moveTo(x, area.bottom);
    ctx.lineTo(x, area.bottom + 5);
    ctx.stroke();
    ctx.fillText(formatTick(value), x, area.bottom + 10);
  }

  ctx.strokeStyle = "#8fa09a";
  ctx.beginPath();
  ctx.moveTo(area.left, area.top);
  ctx.lineTo(area.left, area.bottom);
  ctx.lineTo(area.right, area.bottom);
  ctx.stroke();

  ctx.fillStyle = "#2f3d39";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillText(xLabel, area.left + area.width / 2, area.bottom + 30);
  ctx.save();
  ctx.translate(18, area.top + area.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
  ctx.restore();
}

function formatTick(value) {
  if (Math.abs(value) >= 100) {
    return String(Math.round(value));
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function drawPolyline(ctx, points, color, width = 2) {
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function xToPlot(area, value, min, max) {
  return area.left + ((value - min) / (max - min)) * area.width;
}

function yToPlot(area, value, min = 0, max = 1) {
  return area.bottom - ((value - min) / (max - min)) * area.height;
}

// Logistic update: x_{t+1} = r x_t (1 - x_t).
function logisticStep(x, r) {
  return r * x * (1 - x);
}

// Time series generation: repeatedly apply the logistic update from x0.
function generateTimeSeries(r, x0, iterations) {
  const values = [clamp(x0, 0, 1)];
  let x = values[0];

  for (let t = 0; t < iterations; t += 1) {
    x = clamp(logisticStep(x, r), 0, 1);
    values.push(x);
  }

  return values;
}

function drawTimeSeries(state) {
  const { ctx, width, height } = prepareCanvas(canvases.time);
  const area = plotArea(width, height);
  const values = generateTimeSeries(state.r, state.x0, state.iterations);

  drawAxes(ctx, area, "iteration t", "x_t", { xMin: 0, xMax: state.iterations, xTicks: 5 });

  const points = values.map((value, index) => ({
    x: xToPlot(area, index, 0, state.iterations),
    y: yToPlot(area, value)
  }));

  drawPolyline(ctx, points, "#0d7c66", 2);
  drawTransientMarker(ctx, area, state.transients, state.iterations);
  drawPlotTitle(ctx, `r = ${state.r.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")}, x0 = ${state.x0}`, area);
}

function drawTransientMarker(ctx, area, transients, iterations) {
  if (transients <= 0 || transients >= iterations) {
    return;
  }

  const x = xToPlot(area, transients, 0, iterations);
  ctx.save();
  ctx.strokeStyle = "rgba(201, 107, 50, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x, area.top);
  ctx.lineTo(x, area.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#9a4d23";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("transient", x + 6, area.top + 14);
  ctx.restore();
}

function drawPlotTitle(ctx, text, area) {
  ctx.save();
  ctx.fillStyle = "#2f3d39";
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(text, area.right, area.top - 16);
  ctx.restore();
}

function drawCobweb(state) {
  const { ctx, width, height } = prepareCanvas(canvases.cobweb);
  const size = Math.min(width, height);
  const gutter = size < 480 ? 46 : 58;
  const area = {
    left: gutter,
    right: width - 24,
    top: 24,
    bottom: height - gutter,
    width: width - gutter - 24,
    height: height - gutter - 24
  };

  drawAxes(ctx, area, "x_t", "x_{t+1}", { xMin: 0, xMax: 1, xTicks: 4 });
  drawDiagonal(ctx, area);
  drawLogisticCurve(ctx, area, state.r);
  drawCobwebPath(ctx, area, state.r, state.x0, Math.min(state.iterations, 120));
  drawCobwebLegend(ctx, area);
}

function drawDiagonal(ctx, area) {
  ctx.save();
  ctx.strokeStyle = "#285a9f";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(xToPlot(area, 0, 0, 1), yToPlot(area, 0));
  ctx.lineTo(xToPlot(area, 1, 0, 1), yToPlot(area, 1));
  ctx.stroke();
  ctx.restore();
}

function drawLogisticCurve(ctx, area, r) {
  const points = [];
  for (let i = 0; i <= 320; i += 1) {
    const x = i / 320;
    points.push({
      x: xToPlot(area, x, 0, 1),
      y: yToPlot(area, logisticStep(x, r))
    });
  }
  drawPolyline(ctx, points, "#0d7c66", 2.2);
}

function drawCobwebPath(ctx, area, r, x0, steps) {
  let x = clamp(x0, 0, 1);
  const path = [{ x: xToPlot(area, x, 0, 1), y: yToPlot(area, 0) }];

  // Cobweb iteration: go vertically to f(x), then horizontally to y = x.
  for (let i = 0; i < steps; i += 1) {
    const next = clamp(logisticStep(x, r), 0, 1);
    path.push({ x: xToPlot(area, x, 0, 1), y: yToPlot(area, next) });
    path.push({ x: xToPlot(area, next, 0, 1), y: yToPlot(area, next) });
    x = next;
  }

  drawPolyline(ctx, path, "rgba(201, 107, 50, 0.82)", 1.35);

  ctx.save();
  ctx.fillStyle = "#c96b32";
  const first = path[0];
  ctx.beginPath();
  ctx.arc(first.x, first.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCobwebLegend(ctx, area) {
  const entries = [
    ["#0d7c66", "y = r x (1 - x)"],
    ["#285a9f", "y = x"],
    ["#c96b32", "iteration path"]
  ];

  ctx.save();
  ctx.font = "12px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  entries.forEach((entry, index) => {
    const x = area.left + 8;
    const y = area.top + 14 + index * 20;
    ctx.strokeStyle = entry[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 22, y);
    ctx.stroke();
    ctx.fillStyle = "#2f3d39";
    ctx.fillText(entry[1], x + 30, y);
  });
  ctx.restore();
}

function drawBifurcation(state) {
  const { ctx, width, height } = prepareCanvas(canvases.bifurcation);
  const area = plotArea(width, height, { left: 58, right: 22, top: 24, bottom: 48 });

  drawAxes(ctx, area, "r", "long-run x", {
    xMin: state.bifRMin,
    xMax: state.bifRMax,
    xTicks: 6
  });

  // Bifurcation diagram sampling: for each r, discard transients and plot later values.
  ctx.save();
  ctx.fillStyle = "rgba(13, 124, 102, 0.42)";

  const samples = state.bifSamples;
  const transientCount = Math.min(state.transients, state.bifIterations - 1);
  for (let i = 0; i < samples; i += 1) {
    const r = state.bifRMin + (i / (samples - 1)) * (state.bifRMax - state.bifRMin);
    let x = 0.5;

    for (let t = 0; t < state.bifIterations; t += 1) {
      x = clamp(logisticStep(x, r), 0, 1);
      if (t >= transientCount) {
        const px = xToPlot(area, r, state.bifRMin, state.bifRMax);
        const py = yToPlot(area, x);
        ctx.fillRect(px, py, 0.85, 0.85);
      }
    }
  }

  ctx.restore();
  drawCurrentRMarker(ctx, area, state.r, state.bifRMin, state.bifRMax);
}

function drawCurrentRMarker(ctx, area, r, min, max) {
  if (r < min || r > max) {
    return;
  }

  const x = xToPlot(area, r, min, max);
  ctx.save();
  ctx.strokeStyle = "rgba(201, 107, 50, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, area.top);
  ctx.lineTo(x, area.bottom);
  ctx.stroke();
  ctx.fillStyle = "#9a4d23";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("current r", Math.min(x + 6, area.right - 70), area.top + 14);
  ctx.restore();
}

function drawSensitivity(state) {
  const { ctx, width, height } = prepareCanvas(canvases.sensitivity);
  const area = plotArea(width, height);
  const x0A = state.x0;
  const x0B = clamp(state.x0 + state.epsilon, 0, 1);

  // Sensitivity comparison: evolve two nearby initial values under the same r.
  const first = generateTimeSeries(state.r, x0A, state.iterations);
  const second = generateTimeSeries(state.r, x0B, state.iterations);

  drawAxes(ctx, area, "iteration t", "x_t", { xMin: 0, xMax: state.iterations, xTicks: 5 });
  drawPolyline(
    ctx,
    first.map((value, index) => ({
      x: xToPlot(area, index, 0, state.iterations),
      y: yToPlot(area, value)
    })),
    "#0d7c66",
    1.9
  );
  drawPolyline(
    ctx,
    second.map((value, index) => ({
      x: xToPlot(area, index, 0, state.iterations),
      y: yToPlot(area, value)
    })),
    "#c96b32",
    1.45
  );

  drawSensitivityInset(ctx, area, first, second);
  drawSensitivityLegend(ctx, area, x0A, x0B);
}

function drawSensitivityInset(ctx, area, first, second) {
  const insetWidth = Math.min(260, area.width * 0.38);
  const insetHeight = Math.min(120, area.height * 0.38);
  const inset = {
    left: area.right - insetWidth - 12,
    right: area.right - 12,
    top: area.top + 12,
    bottom: area.top + 12 + insetHeight,
    width: insetWidth,
    height: insetHeight
  };

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeStyle = "#d8e0dd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundedRectPath(ctx, inset.left, inset.top, inset.width, inset.height, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2f3d39";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.fillText("|difference|", inset.left + 10, inset.top + 15);

  const maxDiff = Math.max(
    0.0000001,
    ...first.map((value, index) => Math.abs(value - second[index]))
  );
  const points = first.map((value, index) => ({
    x: inset.left + 10 + (index / (first.length - 1)) * (inset.width - 20),
    y: inset.bottom - 14 - (Math.abs(value - second[index]) / maxDiff) * (inset.height - 36)
  }));

  drawPolyline(ctx, points, "#285a9f", 1.5);
  ctx.fillStyle = "#60706c";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`max ${maxDiff.toExponential(1)}`, inset.right - 8, inset.bottom - 8);
  ctx.restore();
}

function drawSensitivityLegend(ctx, area, x0A, x0B) {
  const entries = [
    ["#0d7c66", `x0 = ${x0A}`],
    ["#c96b32", `x0 + epsilon = ${x0B.toPrecision(7)}`]
  ];

  ctx.save();
  ctx.font = "12px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  entries.forEach((entry, index) => {
    const x = area.left + 8;
    const y = area.top + 14 + index * 20;
    ctx.strokeStyle = entry[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 22, y);
    ctx.stroke();
    ctx.fillStyle = "#2f3d39";
    ctx.fillText(entry[1], x + 30, y);
  });
  ctx.restore();
}

function renderAll() {
  const state = getState();
  writeState(state);
  drawTimeSeries(state);
  drawCobweb(state);
  drawBifurcation(state);
  drawSensitivity(state);
}

function resetControls() {
  writeState(DEFAULTS);
  renderAll();
}

function attachEvents() {
  controls.rRange.addEventListener("input", () => {
    syncPair(controls.rRange, controls.rNumber, 0, 4);
    scheduleRender();
  });
  controls.rNumber.addEventListener("input", () => {
    const value = clamp(readNumber(controls.rNumber, DEFAULTS.r), 0, 4);
    setControlValue(controls.rRange, value);
    scheduleRender();
  });

  controls.x0Range.addEventListener("input", () => {
    syncPair(controls.x0Range, controls.x0Number, 0, 1);
    scheduleRender();
  });
  controls.x0Number.addEventListener("input", () => {
    const value = clamp(readNumber(controls.x0Number, DEFAULTS.x0), 0, 1);
    setControlValue(controls.x0Range, value);
    scheduleRender();
  });

  [
    controls.iterations,
    controls.transients,
    controls.epsilon,
    controls.bifRMin,
    controls.bifRMax,
    controls.bifSamples,
    controls.bifIterations
  ].forEach((input) => {
    input.addEventListener("input", scheduleRender);
  });

  document.querySelectorAll("[data-r]").forEach((button) => {
    button.addEventListener("click", () => {
      const r = Number(button.dataset.r);
      setControlValue(controls.rRange, r);
      setControlValue(controls.rNumber, r);
      renderAll();
    });
  });

  controls.renderButton.addEventListener("click", renderAll);
  controls.resetButton.addEventListener("click", resetControls);
  window.addEventListener("resize", scheduleRender);
}

attachEvents();
renderAll();
