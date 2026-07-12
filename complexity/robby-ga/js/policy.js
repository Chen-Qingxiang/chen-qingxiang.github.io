import {
  ACTION_COUNT,
  ACTION_NAMES,
  CAN,
  EMPTY,
  EAST,
  NORTH,
  PICKUP,
  POLICY_LENGTH,
  RANDOM,
  SOUTH,
  WALL,
  WEST
} from "./constants.js";
import { decodePercept, encodePercept } from "./percept.js";

export function actionName(action) {
  return ACTION_NAMES[action] || "UNKNOWN";
}

export function makeRandomPolicy(rng) {
  const policy = new Uint8Array(POLICY_LENGTH);
  for (let i = 0; i < policy.length; i += 1) {
    policy[i] = rng.int(ACTION_COUNT);
  }
  return policy;
}

export function makeHandCodedPolicy() {
  const policy = new Uint8Array(POLICY_LENGTH);
  for (let index = 0; index < POLICY_LENGTH; index += 1) {
    const [current, north, south, west, east] = decodePercept(index);
    if (current === CAN) {
      policy[index] = PICKUP;
    } else if (north === CAN) {
      policy[index] = NORTH;
    } else if (south === CAN) {
      policy[index] = SOUTH;
    } else if (west === CAN) {
      policy[index] = WEST;
    } else if (east === CAN) {
      policy[index] = EAST;
    } else {
      policy[index] = RANDOM;
    }
  }
  return policy;
}

export function clonePolicy(policy) {
  return new Uint8Array(policy);
}

export function policyActionSummary(policy) {
  const counts = new Array(ACTION_COUNT).fill(0);
  for (let i = 0; i < policy.length; i += 1) {
    counts[policy[i]] += 1;
  }
  return counts;
}

export function inspectPercepts(policy) {
  const examples = [
    ["current cell = CAN", [CAN, EMPTY, EMPTY, EMPTY, EMPTY]],
    ["current empty, north = CAN", [EMPTY, CAN, EMPTY, EMPTY, EMPTY]],
    ["current empty, south = CAN", [EMPTY, EMPTY, CAN, EMPTY, EMPTY]],
    ["current empty, west = CAN", [EMPTY, EMPTY, EMPTY, CAN, EMPTY]],
    ["current empty, east = CAN", [EMPTY, EMPTY, EMPTY, EMPTY, CAN]],
    ["at north wall", [EMPTY, WALL, EMPTY, EMPTY, EMPTY]],
    ["at west wall", [EMPTY, EMPTY, EMPTY, WALL, EMPTY]],
    ["surrounded by empty cells", [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]]
  ];

  return examples.map(([label, values]) => {
    const index = encodePercept(values);
    return {
      label,
      values,
      index,
      action: policy[index]
    };
  });
}
