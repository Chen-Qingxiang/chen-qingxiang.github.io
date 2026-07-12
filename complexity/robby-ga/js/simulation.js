import { ACTION_COUNT, CAN, EAST, EMPTY, NORTH, PICKUP, RANDOM, SOUTH, WALL, WEST } from "./constants.js";
import { makeWorld, worldIndex, cellView } from "./world.js";
import { perceptIndex } from "./percept.js";

export function stepRobby(world, row, col, action, rng) {
  const requestedAction = action;
  let actualAction = action;
  if (actualAction === RANDOM) {
    actualAction = rng.int(ACTION_COUNT - 1);
  }

  let nextRow = row;
  let nextCol = col;
  let reward = 0;

  if (actualAction === PICKUP) {
    const index = worldIndex(world, row, col);
    if (world.cells[index] === CAN) {
      world.cells[index] = EMPTY;
      reward = 10;
    } else {
      reward = -1;
    }
  } else if (actualAction === NORTH || actualAction === SOUTH || actualAction === EAST || actualAction === WEST) {
    if (actualAction === NORTH) nextRow -= 1;
    if (actualAction === SOUTH) nextRow += 1;
    if (actualAction === EAST) nextCol += 1;
    if (actualAction === WEST) nextCol -= 1;

    if (cellView(world, nextRow, nextCol) === WALL) {
      nextRow = row;
      nextCol = col;
      reward = -5;
    }
  }

  return {
    row: nextRow,
    col: nextCol,
    reward,
    requestedAction,
    actualAction
  };
}

export function runEpisode(policy, config, rng) {
  const world = makeWorld(config.gridSize, config.canProb, rng);
  let row = 0;
  let col = 0;
  let score = 0;

  for (let step = 0; step < config.steps; step += 1) {
    const index = perceptIndex(world, row, col);
    const result = stepRobby(world, row, col, policy[index], rng);
    row = result.row;
    col = result.col;
    score += result.reward;
  }

  return score;
}

export function evaluatePolicy(policy, config, rng) {
  let total = 0;
  for (let trial = 0; trial < config.trials; trial += 1) {
    total += runEpisode(policy, config, rng);
  }
  return total / config.trials;
}
