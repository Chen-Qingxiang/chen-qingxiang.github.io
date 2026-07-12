import { CAN } from "../constants.js";
import { worldIndex } from "../world.js";

export function drawWorld(canvas, world, robbyPosition) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const size = world.size;
  const cell = Math.min(width, height) / size;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f9fbf7";
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const x = col * cell;
      const y = row * cell;
      ctx.fillStyle = world.cells[worldIndex(world, row, col)] === CAN ? "#fff7df" : "#fbfcf8";
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = "#d4ddd4";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cell, cell);

      if (world.cells[worldIndex(world, row, col)] === CAN) {
        ctx.beginPath();
        ctx.arc(x + cell * 0.5, y + cell * 0.52, Math.max(3, cell * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = "#c78322";
        ctx.fill();
        ctx.strokeStyle = "#8f5a18";
        ctx.stroke();
      }
    }
  }

  const neighbors = [
    [robbyPosition.row, robbyPosition.col],
    [robbyPosition.row - 1, robbyPosition.col],
    [robbyPosition.row + 1, robbyPosition.col],
    [robbyPosition.row, robbyPosition.col - 1],
    [robbyPosition.row, robbyPosition.col + 1]
  ];
  ctx.lineWidth = Math.max(2, cell * 0.05);
  ctx.strokeStyle = "#79a99b";
  for (const [row, col] of neighbors) {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      ctx.strokeRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
    }
  }

  const rx = robbyPosition.col * cell;
  const ry = robbyPosition.row * cell;
  const radius = cell * 0.31;
  ctx.beginPath();
  ctx.arc(rx + cell * 0.5, ry + cell * 0.5, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#356fb3";
  ctx.fill();
  ctx.strokeStyle = "#173b68";
  ctx.lineWidth = Math.max(2, cell * 0.04);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(rx + cell * 0.4, ry + cell * 0.44, Math.max(2, cell * 0.045), 0, Math.PI * 2);
  ctx.arc(rx + cell * 0.6, ry + cell * 0.44, Math.max(2, cell * 0.045), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = Math.max(2, cell * 0.035);
  ctx.beginPath();
  ctx.moveTo(rx + cell * 0.38, ry + cell * 0.62);
  ctx.lineTo(rx + cell * 0.62, ry + cell * 0.62);
  ctx.stroke();
}
