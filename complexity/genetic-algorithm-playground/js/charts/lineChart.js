import { setupCanvas } from "./canvas.js";

export function drawLineChart(canvas, options) {
  const { ctx, width, height } = setupCanvas(canvas);
  const margin = { top: 18, right: 18, bottom: 34, left: 52 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const minY = options.minY;
  let maxY = options.maxY;

  if (!Number.isFinite(maxY) || maxY <= minY) {
    maxY = minY + 1;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcfb";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d7ddd9";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const gridLines = 4;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#5f6f7a";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= gridLines; i += 1) {
    const ratio = i / gridLines;
    const y = margin.top + plotHeight * ratio;
    const value = maxY - (maxY - minY) * ratio;

    ctx.strokeStyle = i === gridLines ? "#aebbb5" : "#e4e8e5";
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();

    ctx.fillText(options.yFormatter(value), margin.left - 8, y);
  }

  const longest = Math.max(...options.series.map((item) => item.values.length));
  const maxX = Math.max(1, longest - 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("0", margin.left, height - margin.bottom + 10);
  ctx.fillText(String(maxX), width - margin.right, height - margin.bottom + 10);
  ctx.fillText(options.xLabel, margin.left + plotWidth / 2, height - margin.bottom + 10);

  ctx.strokeStyle = "#aebbb5";
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  options.series.forEach((series) => {
    if (series.values.length === 0) {
      return;
    }

    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    series.values.forEach((value, index) => {
      const x = margin.left + (index / maxX) * plotWidth;
      const y = margin.top + ((maxY - value) / (maxY - minY)) * plotHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    const finalIndex = series.values.length - 1;
    const finalValue = series.values[finalIndex];
    const finalX = margin.left + (finalIndex / maxX) * plotWidth;
    const finalY = margin.top + ((maxY - finalValue) / (maxY - minY)) * plotHeight;
    ctx.fillStyle = series.color;
    ctx.beginPath();
    ctx.arc(finalX, finalY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
