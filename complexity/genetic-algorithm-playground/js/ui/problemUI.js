import { MAX_NK_K, NK_ENUMERATION_LIMIT } from "../constants.js";
import { createNKLandscape } from "../fitness/nk.js";
import { state } from "../state.js";
import { els } from "./dom.js";
import { readCommonConfig, readInt, readNKConfig, readTrapConfig } from "./config.js";

const explanations = {
  onemax: [
    "<strong>OneMax</strong>: fitness(x) = sum of bits.",
    "The known global optimum is the all-ones genome, with fitness equal to L.",
    "This is a smooth benchmark because each 1 bit independently improves fitness."
  ],
  trap: [
    "<strong>Deceptive Trap Function</strong>: split the genome into blocks of K bits.",
    "For each block, u is the number of 1 bits. If u == K, block fitness is K; otherwise it is K - 1 - u.",
    "The all-zero block is a local trap with high fitness, but the true optimum is the all-one block."
  ],
  nk: [
    "<strong>NK Landscape</strong>: each locus contributes a random local fitness value based on itself and K other loci.",
    "Overall fitness is the average of N local contributions.",
    "K controls epistasis. K = 0 is mostly independent; larger K makes the landscape more rugged."
  ]
};

export function updateProblemUI() {
  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.problem === state.problem;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  els.trapControls.hidden = state.problem !== "trap";
  els.nkControls.hidden = state.problem !== "nk";
  els.hillClimbButton.hidden = state.problem !== "trap";
  els.problemExplanation.innerHTML = explanations[state.problem]
    .map((line) => `<p>${line}</p>`)
    .join("");

  updateTrapDetails();
  updateNKDetails();
}

export function updateTrapDetails() {
  const length = readInt(els.genomeLength, 40, 4, 200);
  const { trapBlockSize: blockSize } = readTrapConfig(length);
  const fullBlocks = Math.floor(length / blockSize);
  const remainder = length % blockSize;

  if (remainder === 0) {
    els.trapLengthHint.textContent = `Genome length ${length} splits into ${fullBlocks} full blocks of K = ${blockSize}.`;
  } else {
    els.trapLengthHint.textContent = `Genome length ${length} creates ${fullBlocks} full blocks plus a final partial block of size ${remainder}; the partial block uses the same rule with K = ${remainder}.`;
  }

  const headerCells = [];
  const valueCells = [];
  for (let ones = 0; ones <= blockSize; ones += 1) {
    headerCells.push(`<th scope="col">${ones}</th>`);
    valueCells.push(`<td>${ones === blockSize ? blockSize : blockSize - 1 - ones}</td>`);
  }

  els.trapTable.innerHTML = `
    <thead>
      <tr><th scope="row">u</th>${headerCells.join("")}</tr>
    </thead>
    <tbody>
      <tr><th scope="row">block fitness</th>${valueCells.join("")}</tr>
    </tbody>
  `;
}

export function updateNKDetails() {
  const config = readCommonConfig();
  const { nkK: k } = readNKConfig(config.genomeLength);
  const landscape = createNKLandscape(config.genomeLength, k, config.seed);
  const shown = Math.min(5, config.genomeLength);

  els.nkHint.textContent = `N = ${config.genomeLength}, K = ${k}. This demo caps K at ${MAX_NK_K} so lookup tables stay responsive. True global optimum is enumerated only when N <= ${NK_ENUMERATION_LIMIT}.`;
  els.nkDependencies.innerHTML = "";

  for (let i = 0; i < shown; i += 1) {
    const item = document.createElement("div");
    item.textContent = `locus ${i} depends on [${landscape.dependencies[i].join(", ")}]`;
    els.nkDependencies.appendChild(item);
  }
}
