export function drawFitnessChart(canvas, history) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padLeft = 52;
  const padRight = 18;
  const padTop = 22;
  const padBottom = 38;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcf8";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d4ddd4";
  ctx.lineWidth = 1;
  ctx.strokeRect(padLeft, padTop, plotWidth, plotHeight);

  if (!history.best.length) {
    ctx.fillStyle = "#5c6965";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Run training to plot best and average fitness.", padLeft + 18, padTop + 42);
    return;
  }

  const allValues = history.best.concat(history.average);
  let minValue = Math.min(...allValues);
  let maxValue = Math.max(...allValues);
  if (minValue === maxValue) {
    minValue -= 1;
    maxValue += 1;
  }
  const padding = (maxValue - minValue) * 0.08;
  minValue -= padding;
  maxValue += padding;

  function xFor(index) {
    if (history.best.length === 1) return padLeft + plotWidth;
    return padLeft + (index / (history.best.length - 1)) * plotWidth;
  }

  function yFor(value) {
    return padTop + plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;
  }

  ctx.fillStyle = "#5c6965";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(maxValue.toFixed(0), 8, padTop + 4);
  ctx.fillText(minValue.toFixed(0), 8, padTop + plotHeight);
  ctx.fillText(`Generation ${history.best.length}`, padLeft, height - 12);

  function drawLine(values, color) {
    ctx.beginPath();
    for (let i = 0; i < values.length; i += 1) {
      const x = xFor(i);
      const y = yFor(values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  drawLine(history.average, "#356fb3");
  drawLine(history.best, "#267c68");

  ctx.fillStyle = "#267c68";
  ctx.fillRect(width - 170, 18, 14, 4);
  ctx.fillStyle = "#17211f";
  ctx.fillText("best", width - 148, 24);
  ctx.fillStyle = "#356fb3";
  ctx.fillRect(width - 95, 18, 14, 4);
  ctx.fillStyle = "#17211f";
  ctx.fillText("average", width - 73, 24);
}
