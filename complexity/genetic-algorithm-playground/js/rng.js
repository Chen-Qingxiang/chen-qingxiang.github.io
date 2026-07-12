export function hashSeed(seedText) {
  let hash = 2166136261;
  const text = String(seedText);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seedText) {
  let stateValue = hashSeed(seedText) || 1;
  return function nextRandom() {
    stateValue += 0x6d2b79f5;
    let t = stateValue;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng, maxExclusive) {
  return Math.floor(rng() * maxExclusive);
}
