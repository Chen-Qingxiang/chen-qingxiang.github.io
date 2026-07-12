const elementDefaults = {
  betaInput: { value: "0.75" },
  y0Input: { value: "1" },
  mMinInput: { value: "1" },
  mMaxInput: { value: "1000" },
  pointsInput: { value: "200" },
  showAllometryLinear: { checked: true },
  showAllometrySurface: { checked: true },
  showAllometryMetabolic: { checked: true },
  showAnimalMarkers: { checked: true },
  cityPreset: { value: "output" },
  cityBetaInput: { value: "1.15" },
  cityNMinInput: { value: "10000" },
  cityNMaxInput: { value: "10000000" },
  calcBetaInput: { value: "0.75" },
  scaleFactorInput: { value: "2" },
};

const canvasContext = {
  arc() {},
  beginPath() {},
  clearRect() {},
  closePath() {},
  fill() {},
  fillRect() {},
  fillText() {},
  lineTo() {},
  moveTo() {},
  quadraticCurveTo() {},
  restore() {},
  rotate() {},
  save() {},
  setLineDash() {},
  setTransform() {},
  stroke() {},
  translate() {},
};

function makeElement(id) {
  return {
    id,
    value: elementDefaults[id]?.value ?? "",
    checked: elementDefaults[id]?.checked ?? false,
    textContent: "",
    innerHTML: "",
    dataset: {},
    clientWidth: 640,
    clientHeight: 320,
    addEventListener() {},
    getBoundingClientRect() {
      return { width: 640, height: 320 };
    },
    getContext() {
      return canvasContext;
    },
  };
}

const elements = new Map();
globalThis.document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  querySelector(selector) {
    if (selector === "input[name='plotScale']:checked") return { value: "linear" };
    return null;
  },
  querySelectorAll() {
    return [];
  },
};

globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (callback) => callback();
globalThis.cancelAnimationFrame = () => {};

await import("../js/main.js");
