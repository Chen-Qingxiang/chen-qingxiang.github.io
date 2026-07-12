import assert from "node:assert/strict";
import { test } from "node:test";

import { CAN, EAST, EMPTY, NORTH, PICKUP, POLICY_LENGTH, RANDOM, SOUTH, WALL, WEST } from "../js/constants.js";
import { crossoverPolicy, mutatePolicy } from "../js/ga.js";
import { makeHandCodedPolicy } from "../js/policy.js";
import { decodePercept, encodePercept } from "../js/percept.js";
import { makeRng } from "../js/rng.js";
import { stepRobby } from "../js/simulation.js";
import { makeWorld, worldIndex } from "../js/world.js";

test("percept encoding preserves current, north, south, west, east base-3 order", () => {
  const values = [CAN, WALL, EMPTY, CAN, WALL];
  assert.equal(encodePercept(values), 1 + 2 * 3 + 0 * 9 + 1 * 27 + 2 * 81);
  assert.deepEqual(decodePercept(encodePercept(values)), values);
});

test("makeWorld creates a deterministic square world", () => {
  const worldA = makeWorld(4, 0.5, makeRng("world-test"));
  const worldB = makeWorld(4, 0.5, makeRng("world-test"));
  assert.equal(worldA.size, 4);
  assert.equal(worldA.cells.length, 16);
  assert.deepEqual([...worldA.cells], [...worldB.cells]);
});

test("stepRobby preserves pickup, empty pickup, movement, and wall rewards", () => {
  const world = makeWorld(2, 0, makeRng("step-test"));
  world.cells[worldIndex(world, 0, 0)] = CAN;
  const rng = makeRng("actions");

  assert.deepEqual(stepRobby(world, 0, 0, PICKUP, rng), {
    row: 0,
    col: 0,
    reward: 10,
    requestedAction: PICKUP,
    actualAction: PICKUP
  });
  assert.equal(world.cells[worldIndex(world, 0, 0)], EMPTY);
  assert.equal(stepRobby(world, 0, 0, PICKUP, rng).reward, -1);
  assert.equal(stepRobby(world, 0, 0, NORTH, rng).reward, -5);
  assert.deepEqual(stepRobby(world, 0, 0, EAST, rng), {
    row: 0,
    col: 1,
    reward: 0,
    requestedAction: EAST,
    actualAction: EAST
  });
});

test("hand-coded policy prioritizes pickup, neighboring cans, then random", () => {
  const policy = makeHandCodedPolicy();
  assert.equal(policy.length, POLICY_LENGTH);
  assert.equal(policy[encodePercept([CAN, EMPTY, EMPTY, EMPTY, EMPTY])], PICKUP);
  assert.equal(policy[encodePercept([EMPTY, CAN, EMPTY, EMPTY, EMPTY])], NORTH);
  assert.equal(policy[encodePercept([EMPTY, EMPTY, CAN, EMPTY, EMPTY])], SOUTH);
  assert.equal(policy[encodePercept([EMPTY, EMPTY, EMPTY, CAN, EMPTY])], WEST);
  assert.equal(policy[encodePercept([EMPTY, EMPTY, EMPTY, EMPTY, CAN])], EAST);
  assert.equal(policy[encodePercept([EMPTY, WALL, WALL, WALL, WALL])], RANDOM);
});

test("crossover and mutation keep policy length and action bounds", () => {
  const parentA = new Uint8Array(POLICY_LENGTH).fill(NORTH);
  const parentB = new Uint8Array(POLICY_LENGTH).fill(PICKUP);
  const [childA, childB] = crossoverPolicy(parentA, parentB, 1, makeRng("crossover"));
  assert.equal(childA.length, POLICY_LENGTH);
  assert.equal(childB.length, POLICY_LENGTH);
  assert(childA.includes(PICKUP));
  assert(childB.includes(NORTH));

  mutatePolicy(childA, 1, makeRng("mutation"));
  assert.equal(childA.length, POLICY_LENGTH);
  for (const action of childA) {
    assert(action >= 0 && action <= RANDOM);
  }
});
