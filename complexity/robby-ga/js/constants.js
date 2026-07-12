export const EMPTY = 0;
export const CAN = 1;
export const WALL = 2;

export const NORTH = 0;
export const SOUTH = 1;
export const EAST = 2;
export const WEST = 3;
export const STAY = 4;
export const PICKUP = 5;
export const RANDOM = 6;

export const CELL_NAMES = ["EMPTY", "CAN", "WALL"];
export const ACTION_NAMES = ["NORTH", "SOUTH", "EAST", "WEST", "STAY", "PICKUP", "RANDOM"];
export const ACTION_COUNT = ACTION_NAMES.length;
export const PERCEPT_LENGTH = 5;
export const POLICY_LENGTH = 3 ** PERCEPT_LENGTH;
export const DEFAULT_EPISODE_STEPS = 200;
