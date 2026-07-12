export function trimZeros(text) {
  return text.replace(/\.?0+$/, "");
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "n/a";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1_000_000 || abs < 0.001) return value.toExponential(2);
  if (abs >= 1000) return Math.round(value).toLocaleString("en-US");
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return trimZeros(value.toFixed(1));
  if (abs >= 1) return trimZeros(value.toFixed(2));
  return trimZeros(value.toFixed(3));
}

export function formatBeta(value) {
  return trimZeros(Number(value).toFixed(2));
}
