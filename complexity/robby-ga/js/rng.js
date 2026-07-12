export function hashSeed(seedText) {
  let hash = 2166136261;
  const text = String(seedText || "robby");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function makeRng(seedText) {
  let state = hashSeed(seedText);
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(max) {
      return Math.floor(this.next() * max);
    }
  };
}
