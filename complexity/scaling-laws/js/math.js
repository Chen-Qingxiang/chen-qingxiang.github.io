export function powerLaw(x, y0, beta) {
  return y0 * Math.pow(x, beta);
}

export function generatePowerLawData(minX, maxX, y0, beta, nPoints, logSpacing) {
  const points = [];
  const count = Math.max(2, Math.min(1000, Math.round(nPoints) || 200));
  const min = Math.max(Number(minX) || 1, 1e-12);
  let max = Math.max(Number(maxX) || min * 10, 1e-12);

  if (max <= min) {
    max = min * 10;
  }

  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    const x = logSpacing
      ? min * Math.pow(max / min, t)
      : min + (max - min) * t;
    points.push({ x, y: powerLaw(x, y0, beta) });
  }

  return points;
}

export function log10Safe(x) {
  return Number.isFinite(x) && x > 0 ? Math.log10(x) : null;
}

export function transformLinear(value, min, max, start, end) {
  if (max === min) return (start + end) / 2;
  return start + ((value - min) / (max - min)) * (end - start);
}
