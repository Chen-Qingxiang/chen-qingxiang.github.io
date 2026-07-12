export const $ = (id) => document.getElementById(id);

export const els = {
  beta: $("betaInput"),
  betaValue: $("betaValue"),
  y0: $("y0Input"),
  mMin: $("mMinInput"),
  mMax: $("mMaxInput"),
  points: $("pointsInput"),
  pointsValue: $("pointsValue"),
  currentFormula: $("currentFormula"),
  explorerCanvas: $("explorerCanvas"),
  exponentMeaning: $("exponentMeaning"),
  logCanvas: $("logCanvas"),
  logSlopeValue: $("logSlopeValue"),
  showAllometryLinear: $("showAllometryLinear"),
  showAllometrySurface: $("showAllometrySurface"),
  showAllometryMetabolic: $("showAllometryMetabolic"),
  showAnimalMarkers: $("showAnimalMarkers"),
  allometryCanvas: $("allometryCanvas"),
  cityPreset: $("cityPreset"),
  cityBeta: $("cityBetaInput"),
  cityBetaValue: $("cityBetaValue"),
  cityNMin: $("cityNMinInput"),
  cityNMax: $("cityNMaxInput"),
  cityFormula: $("cityFormula"),
  cityCanvas: $("cityCanvas"),
  cityInterpretation: $("cityInterpretation"),
  calcBeta: $("calcBetaInput"),
  calcBetaValue: $("calcBetaValue"),
  scaleFactor: $("scaleFactorInput"),
  calculatorOutput: $("calculatorOutput"),
};

export function readNumber(input, fallback) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : fallback;
}
