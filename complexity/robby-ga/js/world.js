import { CAN, EMPTY, WALL } from "./constants.js";

export function makeWorld(size, canProb, rng) {
  const cells = new Uint8Array(size * size);
  for (let i = 0; i < cells.length; i += 1) {
    cells[i] = rng.next() < canProb ? CAN : EMPTY;
  }
  return { size, cells };
}

export function worldIndex(world, row, col) {
  return row * world.size + col;
}

export function cellView(world, row, col) {
  if (row < 0 || row >= world.size || col < 0 || col >= world.size) {
    return WALL;
  }
  return world.cells[worldIndex(world, row, col)];
}
