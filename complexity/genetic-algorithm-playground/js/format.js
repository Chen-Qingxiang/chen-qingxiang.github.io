export function formatFitness(value, problem = "onemax") {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (problem === "nk") {
    return value.toFixed(4);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatGenome(genome) {
  if (!genome || genome.length === 0) {
    return "-";
  }

  const groups = genome.join("").match(/.{1,8}/g) || [];
  const lines = [];
  for (let i = 0; i < groups.length; i += 6) {
    lines.push(groups.slice(i, i + 6).join(" "));
  }
  return lines.join("\n");
}
