import { PERCEPT_LENGTH } from "./constants.js";
import { cellView } from "./world.js";

export function perceptValues(world, row, col) {
  return [
    cellView(world, row, col),
    cellView(world, row - 1, col),
    cellView(world, row + 1, col),
    cellView(world, row, col - 1),
    cellView(world, row, col + 1)
  ];
}

export function encodePercept(values) {
  // Policy genes are indexed by five base-3 digits in this exact order:
  // current, north, south, west, east. The first value has place value 1.
  let index = 0;
  let placeValue = 1;
  for (let i = 0; i < PERCEPT_LENGTH; i += 1) {
    index += values[i] * placeValue;
    placeValue *= 3;
  }
  return index;
}

export function decodePercept(index) {
  const values = [];
  let remaining = index;
  for (let i = 0; i < PERCEPT_LENGTH; i += 1) {
    values.push(remaining % 3);
    remaining = Math.floor(remaining / 3);
  }
  return values;
}

export function perceptIndex(world, row, col) {
  return encodePercept(perceptValues(world, row, col));
}
