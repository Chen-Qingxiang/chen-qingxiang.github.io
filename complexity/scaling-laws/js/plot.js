import { colors } from "./data.js";
import { formatBeta, formatNumber } from "./format.js";
import { log10Safe, transformLinear } from "./math.js";

function getCanvasContext(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.round(rect.width || canvas.clientWidth || 640));
  const height = Math.max(260, Math.round(rect.height || canvas.clientHeight || 320));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function isValidPoint(point, xScale, yScale) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  if (xScale === "log" && point.x <= 0) return false;
  if (yScale === "log" && point.y <= 0) return false;
  return true;
}

function scaledValue(value, scale) {
  return scale === "log" ? log10Safe(value) : value;
}

function transformLogLog(value, minLog, maxLog, start, end) {
  const logged = log10Safe(value);
  if (logged === null) return null;
  return transformLinear(logged, minLog, maxLog, start, end);
}

function buildDomain(values, scale, explicitMin, explicitMax, includeZero, padRatio) {
  let minRaw = Number.isFinite(explicitMin) ? explicitMin : Math.min(...values);
  let maxRaw = Number.isFinite(explicitMax) ? explicitMax : Math.max(...values);

  if (scale === "log") {
    const positive = values.filter((value) => value > 0);
    if (minRaw <= 0 || !Number.isFinite(minRaw)) minRaw = Math.min(...positive);
    if (maxRaw <= 0 || !Number.isFinite(maxRaw)) maxRaw = Math.max(...positive);
  }

  if (includeZero && scale === "linear" && minRaw > 0) {
    minRaw = 0;
  }

  let min = scaledValue(minRaw, scale);
  let max = scaledValue(maxRaw, scale);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }

  if (min === max) {
    const delta = Math.abs(min || 1) * 0.1;
    min -= delta;
    max += delta;
  }

  const pad = (max - min) * padRatio;
  return { min: min - pad, max: max + pad };
}

function niceStep(rawStep) {
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);
  let niceFraction = 1;

  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * Math.pow(10, exponent);
}

function makeLinearTicks(min, max, count) {
  const step = niceStep((max - min) / Math.max(1, count - 1));
  const first = Math.ceil(min / step) * step;
  const ticks = [];

  for (let value = first; value <= max + step * 0.5; value += step) {
    if (value >= min - step * 0.5) {
      ticks.push({ value, label: formatNumber(value) });
    }
    if (ticks.length > 8) break;
  }

  return ticks;
}

function makeLogTicks(minLog, maxLog) {
  const ticks = [];
  const start = Math.ceil(minLog);
  const end = Math.floor(maxLog);

  for (let exponent = start; exponent <= end; exponent += 1) {
    ticks.push({ value: exponent, label: formatNumber(Math.pow(10, exponent)) });
  }

  if (ticks.length >= 3) return ticks;

  const step = niceStep((maxLog - minLog) / 4);
  const first = Math.ceil(minLog / step) * step;
  for (let value = first; value <= maxLog + step * 0.5; value += step) {
    ticks.push({ value, label: formatNumber(Math.pow(10, value)) });
    if (ticks.length > 6) break;
  }

  return ticks;
}

function makeTicks(domain, scale, count) {
  return scale === "log"
    ? makeLogTicks(domain.min, domain.max)
    : makeLinearTicks(domain.min, domain.max, count);
}

function drawAxes(ctx, plot, xTicks, yTicks, options) {
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.fillStyle = colors.gray;
  ctx.lineWidth = 1;
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";

  yTicks.forEach((tick) => {
    const y = transformLinear(tick.value, options.yDomain.min, options.yDomain.max, plot.bottom, plot.top);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(tick.label, plot.left - 9, y);
  });

  xTicks.forEach((tick) => {
    const x = transformLinear(tick.value, options.xDomain.min, options.xDomain.max, plot.left, plot.right);
    ctx.beginPath();
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(tick.label, x, plot.bottom + 20);
  });

  ctx.strokeStyle = "#9aa5b3";
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, plot.bottom);
  ctx.lineTo(plot.right, plot.bottom);
  ctx.stroke();

  ctx.fillStyle = colors.ink;
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(options.xLabel, (plot.left + plot.right) / 2, plot.bottom + 42);

  ctx.save();
  ctx.translate(18, (plot.top + plot.bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(options.yLabel, 0, 0);
  ctx.restore();
  ctx.restore();
}

function drawSlopeGuide(ctx, plot, xDomain, yDomain, guide) {
  const beta = guide.beta;
  const xRange = xDomain.max - xDomain.min;
  const yRange = yDomain.max - yDomain.min;
  const sx1 = xDomain.min + xRange * 0.14;
  const sx2 = xDomain.min + xRange * 0.36;
  let sy1 = yDomain.min + yRange * 0.18;
  let sy2 = sy1 + beta * (sx2 - sx1);

  if (sy2 > yDomain.max - yRange * 0.08) {
    sy2 = yDomain.max - yRange * 0.08;
    sy1 = sy2 - beta * (sx2 - sx1);
  }

  const x1 = transformLinear(sx1, xDomain.min, xDomain.max, plot.left, plot.right);
  const x2 = transformLinear(sx2, xDomain.min, xDomain.max, plot.left, plot.right);
  const y1 = transformLinear(sy1, yDomain.min, yDomain.max, plot.bottom, plot.top);
  const y2 = transformLinear(sy2, yDomain.min, yDomain.max, plot.bottom, plot.top);

  ctx.save();
  ctx.strokeStyle = guide.color || colors.red;
  ctx.fillStyle = guide.color || colors.red;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`slope = β = ${formatBeta(beta)}`, x2 + 8, y2);
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLegend(ctx, plot, series) {
  const items = series.filter((item) => item.name);
  if (!items.length) return;

  const lineHeight = 18;
  const width = Math.min(230, plot.right - plot.left - 20);
  const height = items.length * lineHeight + 12;
  const x = plot.right - width - 8;
  const y = plot.top + 8;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, height, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  items.forEach((item, index) => {
    const itemY = y + 10 + index * lineHeight;
    ctx.strokeStyle = item.color || colors.teal;
    ctx.fillStyle = item.color || colors.teal;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(item.dash || []);
    ctx.beginPath();
    ctx.moveTo(x + 10, itemY);
    ctx.lineTo(x + 30, itemY);
    ctx.stroke();
    ctx.setLineDash([]);
    if (item.markerOnly) {
      ctx.beginPath();
      ctx.arc(x + 20, itemY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = colors.ink;
    ctx.fillText(item.name, x + 38, itemY);
  });

  ctx.restore();
}

export function drawPlot(canvas, dataSeries, options = {}) {
  const { ctx, width, height } = getCanvasContext(canvas);
  const xScale = options.xScale || "linear";
  const yScale = options.yScale || "linear";
  const plot = {
    left: 62,
    right: width - 22,
    top: 24,
    bottom: height - 54,
  };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcff";
  ctx.fillRect(0, 0, width, height);

  const series = dataSeries.filter((item) => item && item.visible !== false);
  const validPoints = series
    .flatMap((item) => item.points || [])
    .filter((point) => isValidPoint(point, xScale, yScale));

  if (!validPoints.length) {
    ctx.fillStyle = colors.gray;
    ctx.font = "15px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No positive values to plot.", width / 2, height / 2);
    return;
  }

  const xValues = validPoints.map((point) => point.x);
  const yValues = validPoints.map((point) => point.y);
  const xDomain = buildDomain(xValues, xScale, options.xMin, options.xMax, false, 0.02);
  const yDomain = buildDomain(yValues, yScale, options.yMin, options.yMax, options.includeZeroY, 0.06);
  const xTicks = makeTicks(xDomain, xScale, 5);
  const yTicks = makeTicks(yDomain, yScale, 5);

  drawAxes(ctx, plot, xTicks, yTicks, {
    xDomain,
    yDomain,
    xLabel: options.xLabel || "x",
    yLabel: options.yLabel || "y",
  });

  const toX = (value) => {
    if (xScale === "log") {
      return transformLogLog(value, xDomain.min, xDomain.max, plot.left, plot.right);
    }
    return transformLinear(value, xDomain.min, xDomain.max, plot.left, plot.right);
  };

  const toY = (value) => {
    if (yScale === "log") {
      return transformLogLog(value, yDomain.min, yDomain.max, plot.bottom, plot.top);
    }
    return transformLinear(value, yDomain.min, yDomain.max, plot.bottom, plot.top);
  };

  if (options.slopeGuide) {
    drawSlopeGuide(ctx, plot, xDomain, yDomain, options.slopeGuide);
  }

  series.forEach((item) => {
    const points = (item.points || []).filter((point) => isValidPoint(point, xScale, yScale));
    if (!points.length) return;

    ctx.save();
    ctx.strokeStyle = item.color || colors.teal;
    ctx.fillStyle = item.color || colors.teal;
    ctx.lineWidth = item.lineWidth || 2.5;
    ctx.setLineDash(item.dash || []);

    if (item.line !== false) {
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = toX(point.x);
        const y = toY(point.y);
        if (x === null || y === null) return;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    if (item.markers || item.markerOnly) {
      points.forEach((point) => {
        const x = toX(point.x);
        const y = toY(point.y);
        if (x === null || y === null) return;

        ctx.beginPath();
        ctx.arc(x, y, item.radius || 4, 0, Math.PI * 2);
        ctx.fill();

        if (item.labels && point.label) {
          ctx.fillStyle = colors.ink;
          ctx.font = "11px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(point.label, x + 6, y - 7);
          ctx.fillStyle = item.color || colors.teal;
        }
      });
    }

    ctx.restore();
  });

  if (options.legend !== false && series.length > 1) {
    drawLegend(ctx, plot, series);
  }
}
