export const colors = {
  teal: "#0f766e",
  blue: "#2563eb",
  orange: "#d97706",
  red: "#dc2626",
  violet: "#7c3aed",
  gray: "#475569",
  ink: "#17202a",
  grid: "#d8dde7",
};

export const animalMarkers = [
  { name: "mouse", x: 0.02 },
  { name: "rat", x: 0.3 },
  { name: "rabbit", x: 2 },
  { name: "cat", x: 4 },
  { name: "human", x: 70 },
  { name: "horse", x: 500 },
  { name: "elephant", x: 5000 },
];

export const cityPresets = {
  infrastructure: {
    beta: 0.85,
    text: "Infrastructure-like sublinear scaling: larger systems need proportionally less per unit.",
  },
  linear: {
    beta: 1,
    text: "Linear scaling: total Y changes in proportion to system size N.",
  },
  output: {
    beta: 1.15,
    text: "Superlinear socioeconomic-style scaling: larger systems produce proportionally more per unit.",
  },
};
