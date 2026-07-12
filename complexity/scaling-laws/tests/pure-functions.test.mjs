import assert from "node:assert/strict";
import { formatBeta, formatNumber } from "../js/format.js";
import { generatePowerLawData, powerLaw } from "../js/math.js";

assert.equal(powerLaw(4, 2, 0.5), 4);
assert.equal(powerLaw(10, 3, 2), 300);

const linearData = generatePowerLawData(1, 4, 2, 1, 4, false);
assert.deepEqual(linearData.map(({ x }) => x), [1, 2, 3, 4]);
assert.deepEqual(linearData.map(({ y }) => y), [2, 4, 6, 8]);

const logData = generatePowerLawData(1, 100, 1, 1, 3, true);
assert.equal(logData.length, 3);
assert.ok(Math.abs(logData[1].x - 10) < 1e-10);

assert.equal(formatBeta(0.666), "0.67");
assert.equal(formatBeta(1), "1");
assert.equal(formatNumber(0), "0");
assert.equal(formatNumber(12.3), "12.3");
assert.equal(formatNumber(1234.4), "1,234");
assert.equal(formatNumber(Number.POSITIVE_INFINITY), "n/a");
