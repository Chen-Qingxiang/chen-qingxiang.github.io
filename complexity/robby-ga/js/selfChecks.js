import { CAN, EMPTY, NORTH, PICKUP, POLICY_LENGTH } from "./constants.js";
import { makeHandCodedPolicy } from "./policy.js";
import { encodePercept, perceptIndex, decodePercept } from "./percept.js";
import { makeRng } from "./rng.js";
import { stepRobby } from "./simulation.js";
import { makeWorld, worldIndex } from "./world.js";

export function runSelfChecks() {
  const rng = makeRng("self-check");
  const world = makeWorld(10, 0, rng);
  world.cells[worldIndex(world, 0, 0)] = CAN;
  const index = perceptIndex(world, 0, 0);
  if (index < 0 || index >= POLICY_LENGTH) {
    throw new Error("Percept index out of range");
  }
  if (makeHandCodedPolicy().length !== POLICY_LENGTH) {
    throw new Error("Policy length must be 243");
  }
  const pickup = stepRobby(world, 0, 0, PICKUP, rng);
  if (pickup.reward !== 10 || world.cells[worldIndex(world, 0, 0)] !== EMPTY) {
    throw new Error("Successful pickup failed");
  }
  const emptyPickup = stepRobby(world, 0, 0, PICKUP, rng);
  if (emptyPickup.reward !== -1) {
    throw new Error("Empty pickup reward failed");
  }
  const wallHit = stepRobby(world, 0, 0, NORTH, rng);
  if (wallHit.reward !== -5 || wallHit.row !== 0 || wallHit.col !== 0) {
    throw new Error("Wall collision failed");
  }
  const values = [1, 2, 0, 1, 2];
  if (decodePercept(encodePercept(values)).join(",") !== values.join(",")) {
    throw new Error("Percept encode/decode round trip failed");
  }
}
