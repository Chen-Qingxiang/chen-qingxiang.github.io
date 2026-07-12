export function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(260, Math.floor(canvas.clientWidth));
  const height = Math.max(220, Math.floor(canvas.clientHeight));
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

export function drawEmptyChart(canvas, message) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcfb";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#d7ddd9";
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  ctx.fillStyle = "#5f6f7a";
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, height / 2);
}
