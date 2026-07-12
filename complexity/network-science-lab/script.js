"use strict";

const MODEL_NOTES = {
  er: "Erdos-Renyi is a baseline random graph. Each possible edge is placed independently with probability p.",
  ws: "Watts-Strogatz starts from local regular connections and rewires some edges. A small amount of rewiring can create short paths while preserving clustering.",
  ba: "Barabasi-Albert builds a network through growth and preferential attachment. Nodes with many links are more likely to receive new links, producing hubs."
};

const DEFAULT_LAYOUT_SIZE = { width: 820, height: 460 };
const MAX_PATH_NODES = 120;

const state = {
  originalGraph: null,
  currentGraph: null,
  attackGraph: null,
  attackRemoved: 0,
  attackHistory: [],
  diffusionGraph: null,
  diffusionInfected: new Set(),
  diffusionSource: null,
  diffusionStep: 0,
  diffusionHistory: [],
  diffusionTimer: null,
  layoutSeed: "network-lab"
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  updateParameterVisibility();
  generateAndReset();
});

function cacheElements() {
  const ids = [
    "modelSelect",
    "nodeCount",
    "erProbability",
    "wsK",
    "wsBeta",
    "baM",
    "seedInput",
    "randomSeedButton",
    "generateButton",
    "networkCanvas",
    "degreeCanvas",
    "metricsList",
    "modelNote",
    "attackMode",
    "removeOneButton",
    "removeFiveButton",
    "removeTenButton",
    "resetAttackButton",
    "attackCanvas",
    "attackSeriesCanvas",
    "attackStats",
    "infectionProbability",
    "randomSourceButton",
    "stepDiffusionButton",
    "startPauseButton",
    "resetDiffusionButton",
    "diffusionCanvas",
    "diffusionSeriesCanvas",
    "diffusionStats",
    "centralityMode",
    "centralityCanvas",
    "centralityTable"
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });

  elements.modelSelect.addEventListener("change", () => {
    updateParameterVisibility();
    updateModelNote();
  });
  elements.randomSeedButton.addEventListener("click", randomizeSeed);
  elements.generateButton.addEventListener("click", generateAndReset);

  elements.removeOneButton.addEventListener("click", () => removeNodesFromAttack(1));
  elements.removeFiveButton.addEventListener("click", () => removeNodesFromAttack(0.05));
  elements.removeTenButton.addEventListener("click", () => removeNodesFromAttack(0.1));
  elements.resetAttackButton.addEventListener("click", resetAttackSimulation);

  elements.randomSourceButton.addEventListener("click", () => {
    chooseRandomDiffusionSource();
    renderDiffusion();
    renderCentrality();
  });
  elements.stepDiffusionButton.addEventListener("click", () => {
    stopDiffusionTimer();
    stepDiffusion();
  });
  elements.startPauseButton.addEventListener("click", toggleDiffusionTimer);
  elements.resetDiffusionButton.addEventListener("click", resetDiffusionSimulation);
  elements.infectionProbability.addEventListener("change", () => {
    elements.infectionProbability.value = clampNumber(elements.infectionProbability.value, 0, 1, 0.22);
  });

  elements.diffusionCanvas.addEventListener("click", handleDiffusionCanvasClick);
  elements.centralityMode.addEventListener("change", renderCentrality);

  window.addEventListener("resize", debounce(() => {
    renderAll();
  }, 120));
}

function setActiveTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
  renderAll();
}

function updateParameterVisibility() {
  const selected = elements.modelSelect.value;
  document.querySelectorAll("[data-model-param]").forEach((group) => {
    group.classList.toggle("hidden", group.dataset.modelParam !== selected);
  });
}

function randomizeSeed() {
  elements.seedInput.value = `seed-${Math.floor(Math.random() * 1000000)}`;
}

function generateAndReset() {
  const config = readGeneratorConfig();
  const rng = createSeededRandom(config.seed);
  let graph;

  if (config.model === "er") {
    graph = generateER(config.n, config.p, rng);
  } else if (config.model === "ws") {
    graph = generateWS(config.n, config.k, config.beta, rng);
  } else {
    graph = generateBA(config.n, config.m, rng);
  }

  state.layoutSeed = config.seed;
  runForceLayout(graph, getVisibleCanvasSize(elements.networkCanvas), 150, createSeededRandom(`${config.seed}-layout`));
  computeAndAttachCentrality(graph);

  state.originalGraph = graph;
  state.currentGraph = cloneGraph(graph);
  resetAttackSimulation();
  resetDiffusionSimulation();
  updateGeneratorOutputs();
  renderAll();
}

function readGeneratorConfig() {
  const model = elements.modelSelect.value;
  const n = Math.round(clampNumber(elements.nodeCount.value, 8, 180, 64));
  elements.nodeCount.value = n;

  const p = clampNumber(elements.erProbability.value, 0, 1, 0.06);
  elements.erProbability.value = p;

  let k = Math.round(clampNumber(elements.wsK.value, 2, Math.max(2, n - 1), 6));
  if (k % 2 === 1) {
    k -= 1;
  }
  k = Math.max(2, Math.min(k, n - 1));
  elements.wsK.value = k;

  const beta = clampNumber(elements.wsBeta.value, 0, 1, 0.12);
  elements.wsBeta.value = beta;

  const m = Math.round(clampNumber(elements.baM.value, 1, Math.max(1, Math.min(12, n - 1)), 2));
  elements.baM.value = m;

  return {
    model,
    n,
    p,
    k,
    beta,
    m,
    seed: elements.seedInput.value.trim() || "network-lab"
  };
}

function updateGeneratorOutputs() {
  updateMetricsPanel(state.currentGraph);
  updateModelNote();
  drawDegreeHistogram(elements.degreeCanvas, getDegrees(state.currentGraph));
}

function updateModelNote() {
  elements.modelNote.textContent = MODEL_NOTES[elements.modelSelect.value];
}

function createSeededRandom(seedValue) {
  const seedText = String(seedValue || "network-lab");
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return function random() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateER(n, p, rng) {
  const nodes = createNodes(n);
  const edges = [];

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (rng() < p) {
        edges.push({ source: i, target: j });
      }
    }
  }

  return finalizeGraph(nodes, edges);
}

function generateWS(n, k, beta, rng) {
  const nodes = createNodes(n);
  const edges = [];
  const edgeKeys = new Set();
  const halfK = Math.max(1, Math.floor(k / 2));

  for (let i = 0; i < n; i += 1) {
    for (let d = 1; d <= halfK; d += 1) {
      const target = (i + d) % n;
      addEdge(edges, edgeKeys, i, target);
    }
  }

  for (let i = 0; i < edges.length; i += 1) {
    if (rng() >= beta) {
      continue;
    }

    const oldEdge = edges[i];
    const oldKey = edgeKey(oldEdge.source, oldEdge.target);
    edgeKeys.delete(oldKey);

    let newTarget = oldEdge.target;
    let attempts = 0;
    do {
      newTarget = Math.floor(rng() * n);
      attempts += 1;
    } while (
      attempts < n * 4 &&
      (newTarget === oldEdge.source || edgeKeys.has(edgeKey(oldEdge.source, newTarget)))
    );

    if (newTarget === oldEdge.source || edgeKeys.has(edgeKey(oldEdge.source, newTarget))) {
      edgeKeys.add(oldKey);
      continue;
    }

    oldEdge.target = newTarget;
    edgeKeys.add(edgeKey(oldEdge.source, oldEdge.target));
  }

  return finalizeGraph(nodes, edges);
}

function generateBA(n, m, rng) {
  const nodes = createNodes(n);
  const edges = [];
  const edgeKeys = new Set();
  const seedSize = Math.min(n, Math.max(m + 1, 3));
  const degrees = Array(n).fill(0);

  for (let i = 0; i < seedSize; i += 1) {
    for (let j = i + 1; j < seedSize; j += 1) {
      if (addEdge(edges, edgeKeys, i, j)) {
        degrees[i] += 1;
        degrees[j] += 1;
      }
    }
  }

  for (let node = seedSize; node < n; node += 1) {
    const targets = new Set();

    while (targets.size < Math.min(m, node)) {
      const target = pickPreferentialTarget(degrees, node, rng);
      targets.add(target);
    }

    targets.forEach((target) => {
      if (addEdge(edges, edgeKeys, node, target)) {
        degrees[node] += 1;
        degrees[target] += 1;
      }
    });
  }

  return finalizeGraph(nodes, edges);
}

function pickPreferentialTarget(degrees, limit, rng) {
  const total = degrees.slice(0, limit).reduce((sum, degree) => sum + degree, 0);
  if (total <= 0) {
    return Math.floor(rng() * limit);
  }

  let threshold = rng() * total;
  for (let i = 0; i < limit; i += 1) {
    threshold -= degrees[i];
    if (threshold <= 0) {
      return i;
    }
  }
  return limit - 1;
}

function createNodes(n) {
  return Array.from({ length: n }, (_, index) => ({
    id: index,
    x: 0,
    y: 0,
    degree: 0,
    pageRank: 0
  }));
}

function finalizeGraph(nodes, edges) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const uniqueEdges = [];
  const seen = new Set();

  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      return;
    }
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      return;
    }
    const key = edgeKey(edge.source, edge.target);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    uniqueEdges.push({ source: edge.source, target: edge.target });
    adjacency.get(edge.source).push(edge.target);
    adjacency.get(edge.target).push(edge.source);
  });

  nodes.forEach((node) => {
    node.degree = adjacency.get(node.id).length;
  });

  return { nodes, edges: uniqueEdges, adjacency, nodeMap };
}

function cloneGraph(graph) {
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    degree: node.degree,
    pageRank: node.pageRank
  }));
  const edges = graph.edges.map((edge) => ({ source: edge.source, target: edge.target }));
  return finalizeGraph(nodes, edges);
}

function addEdge(edges, edgeKeys, source, target) {
  if (source === target) {
    return false;
  }
  const key = edgeKey(source, target);
  if (edgeKeys.has(key)) {
    return false;
  }
  edgeKeys.add(key);
  edges.push({ source, target });
  return true;
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function computeAndAttachCentrality(graph) {
  const pageRanks = computePageRank(graph, 0.85, 50);
  graph.nodes.forEach((node) => {
    node.degree = graph.adjacency.get(node.id).length;
    node.pageRank = pageRanks.get(node.id) || 0;
  });
}

function getDegrees(graph) {
  return graph.nodes.map((node) => graph.adjacency.get(node.id).length);
}

function computeMetrics(graph) {
  const n = graph.nodes.length;
  const edges = graph.edges.length;
  const degrees = getDegrees(graph);
  const averageDegree = n === 0 ? 0 : degrees.reduce((sum, degree) => sum + degree, 0) / n;
  const density = n <= 1 ? 0 : (2 * edges) / (n * (n - 1));
  const clustering = computeAverageClusteringCoefficient(graph);
  const path = computeAveragePathLength(graph);
  const component = computeLargestComponent(graph);
  const degreeSummary = summarizeDegrees(degrees);

  return {
    n,
    edges,
    averageDegree,
    density,
    clustering,
    path,
    largestComponent: component.size,
    largestComponentFraction: n === 0 ? 0 : component.size / n,
    degreeSummary
  };
}

function computeAverageClusteringCoefficient(graph) {
  if (graph.nodes.length === 0) {
    return 0;
  }

  let total = 0;
  const neighborSets = new Map();
  graph.nodes.forEach((node) => {
    neighborSets.set(node.id, new Set(graph.adjacency.get(node.id)));
  });

  graph.nodes.forEach((node) => {
    const neighbors = graph.adjacency.get(node.id);
    const degree = neighbors.length;
    if (degree < 2) {
      return;
    }

    let linksAmongNeighbors = 0;
    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        if (neighborSets.get(neighbors[i]).has(neighbors[j])) {
          linksAmongNeighbors += 1;
        }
      }
    }
    total += (2 * linksAmongNeighbors) / (degree * (degree - 1));
  });

  return total / graph.nodes.length;
}

function computeAveragePathLength(graph) {
  const n = graph.nodes.length;
  if (n === 0) {
    return { value: 0, reachablePairs: 0, possiblePairs: 0, skipped: false };
  }
  if (n > MAX_PATH_NODES) {
    return { value: null, reachablePairs: 0, possiblePairs: (n * (n - 1)) / 2, skipped: true };
  }

  const ids = graph.nodes.map((node) => node.id);
  const indexById = new Map(ids.map((id, index) => [id, index]));
  let totalDistance = 0;
  let reachablePairs = 0;

  ids.forEach((sourceId, sourceIndex) => {
    const distances = bfsDistances(graph, sourceId);
    ids.forEach((targetId, targetIndex) => {
      if (targetIndex <= sourceIndex) {
        return;
      }
      if (distances.has(targetId)) {
        totalDistance += distances.get(targetId);
        reachablePairs += 1;
      }
    });
  });

  return {
    value: reachablePairs === 0 ? 0 : totalDistance / reachablePairs,
    reachablePairs,
    possiblePairs: (n * (n - 1)) / 2,
    skipped: false,
    disconnected: reachablePairs < (n * (n - 1)) / 2
  };
}

function bfsDistances(graph, sourceId) {
  const distances = new Map([[sourceId, 0]]);
  const queue = [sourceId];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    const nextDistance = distances.get(current) + 1;

    graph.adjacency.get(current).forEach((neighbor) => {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, nextDistance);
        queue.push(neighbor);
      }
    });
  }

  return distances;
}

function computeLargestComponent(graph) {
  const visited = new Set();
  let largest = [];

  graph.nodes.forEach((node) => {
    if (visited.has(node.id)) {
      return;
    }

    const component = [];
    const queue = [node.id];
    visited.add(node.id);

    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      component.push(current);
      graph.adjacency.get(current).forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    if (component.length > largest.length) {
      largest = component;
    }
  });

  return { size: largest.length, nodes: largest };
}

function summarizeDegrees(degrees) {
  if (degrees.length === 0) {
    return "none";
  }
  const sorted = [...degrees].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  return `min ${min}, median ${median}, max ${max}`;
}

function computePageRank(graph, damping, iterations) {
  const n = graph.nodes.length;
  const ranks = new Map();
  if (n === 0) {
    return ranks;
  }

  graph.nodes.forEach((node) => ranks.set(node.id, 1 / n));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const nextRanks = new Map();
    const base = (1 - damping) / n;
    graph.nodes.forEach((node) => nextRanks.set(node.id, base));

    let danglingMass = 0;
    graph.nodes.forEach((node) => {
      const neighbors = graph.adjacency.get(node.id);
      const rank = ranks.get(node.id);
      if (neighbors.length === 0) {
        danglingMass += rank;
        return;
      }

      const share = (damping * rank) / neighbors.length;
      neighbors.forEach((neighbor) => {
        nextRanks.set(neighbor, nextRanks.get(neighbor) + share);
      });
    });

    if (danglingMass > 0) {
      const danglingShare = (damping * danglingMass) / n;
      graph.nodes.forEach((node) => {
        nextRanks.set(node.id, nextRanks.get(node.id) + danglingShare);
      });
    }

    ranks.clear();
    nextRanks.forEach((value, key) => ranks.set(key, value));
  }

  return ranks;
}

function updateMetricsPanel(graph) {
  const metrics = computeMetrics(graph);
  const pathLabel = formatPathMetric(metrics.path);
  const values = [
    ["Nodes", metrics.n],
    ["Edges", metrics.edges],
    ["Average degree", formatNumber(metrics.averageDegree, 2)],
    ["Density", formatNumber(metrics.density, 3)],
    ["Avg clustering", formatNumber(metrics.clustering, 3)],
    ["Avg path length", pathLabel],
    ["Largest component", `${metrics.largestComponent} (${formatPercent(metrics.largestComponentFraction)})`],
    ["Degree summary", metrics.degreeSummary]
  ];

  elements.metricsList.innerHTML = values.map(([label, value]) => `
    <div class="metric-item">
      <span class="metric-label">${label}</span>
      <span class="metric-value">${value}</span>
    </div>
  `).join("");
}

function formatPathMetric(path) {
  if (path.skipped) {
    return `skipped for N > ${MAX_PATH_NODES}`;
  }
  const value = formatNumber(path.value, 2);
  if (path.disconnected) {
    return `${value} (reachable pairs only)`;
  }
  return value;
}

function resetAttackSimulation() {
  if (!state.originalGraph) {
    return;
  }

  state.attackGraph = cloneGraph(state.originalGraph);
  computeAndAttachCentrality(state.attackGraph);
  state.attackRemoved = 0;
  state.attackHistory = [getAttackHistoryPoint()];
  renderAttack();
}

function removeNodesFromAttack(amount) {
  if (!state.attackGraph || state.attackGraph.nodes.length === 0) {
    return;
  }

  const currentCount = state.attackGraph.nodes.length;
  const removeCount = amount < 1
    ? Math.max(1, Math.ceil(state.originalGraph.nodes.length * amount))
    : amount;
  const boundedRemoveCount = Math.min(removeCount, currentCount);
  const mode = elements.attackMode.value;
  let idsToRemove;

  if (mode === "targeted") {
    idsToRemove = [...state.attackGraph.nodes]
      .sort((a, b) => {
        const degreeDiff = graphDegree(state.attackGraph, b.id) - graphDegree(state.attackGraph, a.id);
        return degreeDiff !== 0 ? degreeDiff : a.id - b.id;
      })
      .slice(0, boundedRemoveCount)
      .map((node) => node.id);
  } else {
    const rng = createSeededRandom(`${state.layoutSeed}-attack-${state.attackRemoved}-${Date.now()}`);
    idsToRemove = shuffleArray(state.attackGraph.nodes.map((node) => node.id), rng).slice(0, boundedRemoveCount);
  }

  state.attackGraph = removeNodeIds(state.attackGraph, idsToRemove);
  computeAndAttachCentrality(state.attackGraph);
  state.attackRemoved += idsToRemove.length;
  state.attackHistory.push(getAttackHistoryPoint());
  renderAttack();
}

function removeNodeIds(graph, idsToRemove) {
  const removalSet = new Set(idsToRemove);
  const nodes = graph.nodes
    .filter((node) => !removalSet.has(node.id))
    .map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      degree: node.degree,
      pageRank: node.pageRank
    }));
  const edges = graph.edges.filter((edge) => !removalSet.has(edge.source) && !removalSet.has(edge.target));
  return finalizeGraph(nodes, edges);
}

function getAttackHistoryPoint() {
  const metrics = computeMetrics(state.attackGraph);
  const originalCount = Math.max(1, state.originalGraph.nodes.length);
  return {
    removedFraction: state.attackRemoved / originalCount,
    largestFraction: metrics.largestComponentFraction,
    remainingNodes: metrics.n,
    remainingEdges: metrics.edges,
    largestComponent: metrics.largestComponent
  };
}

function renderAttack() {
  if (!state.attackGraph) {
    return;
  }

  const latest = state.attackHistory[state.attackHistory.length - 1] || getAttackHistoryPoint();
  drawNetwork(elements.attackCanvas, state.attackGraph, {
    colorMode: "degree",
    title: "Remaining network"
  });
  drawLineSeries(elements.attackSeriesCanvas, state.attackHistory, {
    xKey: "removedFraction",
    yKey: "largestFraction",
    yLabel: "largest component",
    color: "#207f75"
  });
  elements.attackStats.innerHTML = `
    <strong>Removed:</strong> ${formatPercent(latest.removedFraction)}<br>
    <strong>Remaining nodes:</strong> ${latest.remainingNodes}<br>
    <strong>Remaining edges:</strong> ${latest.remainingEdges}<br>
    <strong>Largest component:</strong> ${latest.largestComponent} (${formatPercent(latest.largestFraction)})
  `;
}

function resetDiffusionSimulation() {
  stopDiffusionTimer();
  if (!state.originalGraph) {
    return;
  }

  state.diffusionGraph = cloneGraph(state.originalGraph);
  computeAndAttachCentrality(state.diffusionGraph);
  state.diffusionInfected = new Set();
  state.diffusionSource = null;
  state.diffusionStep = 0;
  chooseRandomDiffusionSource();
  state.diffusionHistory = [getDiffusionHistoryPoint()];
  elements.startPauseButton.textContent = "Start";
  renderDiffusion();
  renderCentrality();
}

function chooseRandomDiffusionSource() {
  if (!state.diffusionGraph || state.diffusionGraph.nodes.length === 0) {
    return;
  }

  const rng = createSeededRandom(`${state.layoutSeed}-source-${Date.now()}`);
  const node = state.diffusionGraph.nodes[Math.floor(rng() * state.diffusionGraph.nodes.length)];
  setDiffusionSource(node.id);
}

function setDiffusionSource(nodeId) {
  state.diffusionSource = nodeId;
  state.diffusionInfected = new Set([nodeId]);
  state.diffusionStep = 0;
  state.diffusionHistory = [getDiffusionHistoryPoint()];
}

function stepDiffusion() {
  if (!state.diffusionGraph || state.diffusionGraph.nodes.length === 0) {
    return;
  }

  const infectionProb = clampNumber(elements.infectionProbability.value, 0, 1, 0.22);
  const rng = createSeededRandom(`${state.layoutSeed}-diffusion-${state.diffusionStep}-${Date.now()}`);
  const newlyInfected = new Set();

  state.diffusionInfected.forEach((nodeId) => {
    state.diffusionGraph.adjacency.get(nodeId).forEach((neighbor) => {
      if (!state.diffusionInfected.has(neighbor) && rng() < infectionProb) {
        newlyInfected.add(neighbor);
      }
    });
  });

  newlyInfected.forEach((nodeId) => state.diffusionInfected.add(nodeId));
  state.diffusionStep += 1;
  state.diffusionHistory.push(getDiffusionHistoryPoint());

  if (state.diffusionInfected.size === state.diffusionGraph.nodes.length) {
    stopDiffusionTimer();
  }

  renderDiffusion();
  if (elements.centralityMode.value === "infected") {
    renderCentrality();
  }
}

function toggleDiffusionTimer() {
  if (state.diffusionTimer) {
    stopDiffusionTimer();
    return;
  }

  elements.startPauseButton.textContent = "Pause";
  state.diffusionTimer = window.setInterval(stepDiffusion, 520);
}

function stopDiffusionTimer() {
  if (state.diffusionTimer) {
    window.clearInterval(state.diffusionTimer);
    state.diffusionTimer = null;
  }
  if (elements.startPauseButton) {
    elements.startPauseButton.textContent = "Start";
  }
}

function getDiffusionHistoryPoint() {
  const total = Math.max(1, state.diffusionGraph ? state.diffusionGraph.nodes.length : 1);
  return {
    step: state.diffusionStep,
    infectedFraction: state.diffusionInfected.size / total,
    infectedCount: state.diffusionInfected.size
  };
}

function renderDiffusion() {
  if (!state.diffusionGraph) {
    return;
  }

  drawNetwork(elements.diffusionCanvas, state.diffusionGraph, {
    colorMode: "infected",
    infectedSet: state.diffusionInfected,
    sourceId: state.diffusionSource,
    title: "SI diffusion"
  });
  drawLineSeries(elements.diffusionSeriesCanvas, state.diffusionHistory, {
    xKey: "step",
    yKey: "infectedFraction",
    yLabel: "infected",
    color: "#d44f45"
  });
  elements.diffusionStats.innerHTML = `
    <strong>Step:</strong> ${state.diffusionStep}<br>
    <strong>Infected:</strong> ${state.diffusionInfected.size} / ${state.diffusionGraph.nodes.length}<br>
    <strong>Source node:</strong> ${state.diffusionSource}
  `;
}

function handleDiffusionCanvasClick(event) {
  if (!state.diffusionGraph) {
    return;
  }

  const rect = elements.diffusionCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const nearest = findNearestNode(state.diffusionGraph, x, y, 18);

  if (nearest) {
    stopDiffusionTimer();
    setDiffusionSource(nearest.id);
    renderDiffusion();
    renderCentrality();
  }
}

function findNearestNode(graph, x, y, maxDistance) {
  let nearest = null;
  let bestDistance = maxDistance;

  graph.nodes.forEach((node) => {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance <= bestDistance) {
      nearest = node;
      bestDistance = distance;
    }
  });

  return nearest;
}

function renderCentrality() {
  if (!state.currentGraph) {
    return;
  }

  const mode = elements.centralityMode.value;
  drawNetwork(elements.centralityCanvas, state.currentGraph, {
    colorMode: mode,
    infectedSet: state.diffusionInfected,
    sourceId: state.diffusionSource,
    title: "Centrality view"
  });
  renderCentralityTable(state.currentGraph, mode);
}

function renderCentralityTable(graph, mode) {
  const sorted = [...graph.nodes]
    .sort((a, b) => {
      if (mode === "degree") {
        const degreeDiff = b.degree - a.degree;
        return degreeDiff !== 0 ? degreeDiff : b.pageRank - a.pageRank;
      }
      if (mode === "infected") {
        const infectedDiff = Number(state.diffusionInfected.has(b.id)) - Number(state.diffusionInfected.has(a.id));
        if (infectedDiff !== 0) {
          return infectedDiff;
        }
      }
      const pageRankDiff = b.pageRank - a.pageRank;
      return Math.abs(pageRankDiff) > 1e-12 ? pageRankDiff : b.degree - a.degree;
    })
    .slice(0, 10);

  elements.centralityTable.innerHTML = sorted.map((node, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${node.id}</td>
      <td>${node.degree}</td>
      <td>${node.pageRank.toFixed(4)}</td>
    </tr>
  `).join("");
}

function renderAll() {
  if (!state.currentGraph) {
    return;
  }

  drawNetwork(elements.networkCanvas, state.currentGraph, {
    colorMode: "degree",
    title: "Generated network"
  });
  drawDegreeHistogram(elements.degreeCanvas, getDegrees(state.currentGraph));
  renderAttack();
  renderDiffusion();
  renderCentrality();
}

function runForceLayout(graph, size, iterations, rng) {
  const width = size.width || DEFAULT_LAYOUT_SIZE.width;
  const height = size.height || DEFAULT_LAYOUT_SIZE.height;
  const margin = 28;
  const n = graph.nodes.length;
  const radius = Math.max(80, Math.min(width, height) * 0.38);
  const centerX = width / 2;
  const centerY = height / 2;

  graph.nodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, n);
    const jitter = 10 * (rng() - 0.5);
    node.x = centerX + Math.cos(angle) * (radius + jitter);
    node.y = centerY + Math.sin(angle) * (radius + jitter);
  });

  const limitedIterations = n > 120 ? Math.min(iterations, 80) : iterations;
  const idealLength = Math.max(34, Math.min(86, Math.sqrt((width * height) / Math.max(1, n)) * 0.85));
  const repulsion = idealLength * idealLength * 0.85;
  const spring = 0.018;

  for (let step = 0; step < limitedIterations; step += 1) {
    const fx = Array(n).fill(0);
    const fy = Array(n).fill(0);
    const indexById = new Map(graph.nodes.map((node, index) => [node.id, index]));

    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const a = graph.nodes[i];
        const b = graph.nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distance = Math.hypot(dx, dy);
        if (distance < 0.01) {
          dx = rng() - 0.5;
          dy = rng() - 0.5;
          distance = Math.hypot(dx, dy);
        }

        const force = repulsion / (distance * distance);
        const nx = dx / distance;
        const ny = dy / distance;
        fx[i] += nx * force;
        fy[i] += ny * force;
        fx[j] -= nx * force;
        fy[j] -= ny * force;
      }
    }

    graph.edges.forEach((edge) => {
      const sourceIndex = indexById.get(edge.source);
      const targetIndex = indexById.get(edge.target);
      if (sourceIndex === undefined || targetIndex === undefined) {
        return;
      }
      const source = graph.nodes[sourceIndex];
      const target = graph.nodes[targetIndex];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(0.01, Math.hypot(dx, dy));
      const force = (distance - idealLength) * spring;
      const nx = dx / distance;
      const ny = dy / distance;
      fx[sourceIndex] += nx * force;
      fy[sourceIndex] += ny * force;
      fx[targetIndex] -= nx * force;
      fy[targetIndex] -= ny * force;
    });

    const cooling = 0.92 - (0.55 * step) / Math.max(1, limitedIterations);
    graph.nodes.forEach((node, index) => {
      fx[index] += (centerX - node.x) * 0.003;
      fy[index] += (centerY - node.y) * 0.003;
      node.x = clamp(node.x + clamp(fx[index], -8, 8) * cooling, margin, width - margin);
      node.y = clamp(node.y + clamp(fy[index], -8, 8) * cooling, margin, height - margin);
    });
  }
}

function drawNetwork(canvas, graph, options) {
  const { ctx, width, height } = setupCanvas(canvas);
  const degrees = getDegrees(graph);
  const maxDegree = Math.max(1, ...degrees);
  const maxPageRank = Math.max(1e-9, ...graph.nodes.map((node) => node.pageRank || 0));
  const edgeAlpha = graph.edges.length > 220 ? 0.16 : graph.edges.length > 120 ? 0.24 : 0.34;

  ctx.clearRect(0, 0, width, height);
  drawCanvasBackground(ctx, width, height, options.title);

  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(77, 93, 84, ${edgeAlpha})`;
  graph.edges.forEach((edge) => {
    const source = graph.nodeMap.get(edge.source);
    const target = graph.nodeMap.get(edge.target);
    if (!source || !target) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  });

  graph.nodes.forEach((node) => {
    const degree = graphDegree(graph, node.id);
    const pageRank = node.pageRank || 0;
    const infected = options.infectedSet && options.infectedSet.has(node.id);
    const score = options.colorMode === "pagerank"
      ? pageRank / maxPageRank
      : degree / maxDegree;
    const radius = getNodeRadius(options.colorMode, degree, maxDegree, pageRank, maxPageRank, infected);
    const color = getNodeColor(options.colorMode, score, infected, node.id === options.sourceId);

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = node.id === options.sourceId ? 3 : 1.5;
    ctx.strokeStyle = node.id === options.sourceId ? "#111816" : "#ffffff";
    ctx.stroke();
  });
}

function drawCanvasBackground(ctx, width, height, title) {
  ctx.fillStyle = "#fbfdfb";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(32, 127, 117, 0.08)";
  ctx.lineWidth = 1;
  const gridSize = 42;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (title) {
    ctx.fillStyle = "rgba(31, 38, 35, 0.62)";
    ctx.font = "700 13px Arial, Helvetica, sans-serif";
    ctx.fillText(title, 14, 22);
  }
}

function getNodeRadius(mode, degree, maxDegree, pageRank, maxPageRank, infected) {
  if (mode === "infected") {
    return infected ? 8 : 5;
  }
  if (mode === "pagerank") {
    return 4 + 9 * Math.sqrt(pageRank / maxPageRank);
  }
  return 4 + 8 * Math.sqrt(degree / maxDegree);
}

function getNodeColor(mode, score, infected, isSource) {
  if (isSource) {
    return "#f0b643";
  }
  if (mode === "infected") {
    return infected ? "#d44f45" : "#7f9087";
  }
  if (mode === "pagerank") {
    return interpolateColor([38, 126, 166], [216, 121, 46], clamp(score, 0, 1));
  }
  return interpolateColor([63, 132, 196], [23, 111, 93], clamp(score, 0, 1));
}

function interpolateColor(start, end, t) {
  const rgb = start.map((channel, index) => Math.round(channel + (end[index] - channel) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function drawDegreeHistogram(canvas, degrees) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdfb";
  ctx.fillRect(0, 0, width, height);

  if (!degrees.length) {
    drawEmptyPlot(ctx, width, height, "No degree data");
    return;
  }

  const histogram = computeDegreeHistogram(degrees);
  const entries = [...histogram.entries()].sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(1, ...entries.map((entry) => entry[1]));
  const padding = { left: 42, right: 18, top: 18, bottom: 34 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barGap = 3;
  const barWidth = Math.max(4, (plotWidth - barGap * (entries.length - 1)) / entries.length);

  drawAxes(ctx, padding, width, height, "degree", "count");

  entries.forEach(([degree, count], index) => {
    const x = padding.left + index * (barWidth + barGap);
    const barHeight = (count / maxCount) * plotHeight;
    const y = padding.top + plotHeight - barHeight;
    ctx.fillStyle = degree === Math.max(...degrees) ? "#d8792e" : "#207f75";
    ctx.fillRect(x, y, barWidth, barHeight);

    if (entries.length <= 18) {
      ctx.fillStyle = "#5f6e67";
      ctx.font = "11px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(degree), x + barWidth / 2, height - 12);
    }
  });

  ctx.textAlign = "left";
}

function computeDegreeHistogram(degrees) {
  const histogram = new Map();
  degrees.forEach((degree) => {
    histogram.set(degree, (histogram.get(degree) || 0) + 1);
  });
  return histogram;
}

function drawLineSeries(canvas, values, config) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdfb";
  ctx.fillRect(0, 0, width, height);

  if (!values || values.length === 0) {
    drawEmptyPlot(ctx, width, height, "No simulation data");
    return;
  }

  const padding = { left: 42, right: 18, top: 18, bottom: 34 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxX = Math.max(1, ...values.map((point) => point[config.xKey]));

  drawAxes(ctx, padding, width, height, config.xKey, config.yLabel);

  ctx.strokeStyle = config.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  values.forEach((point, index) => {
    const x = padding.left + (point[config.xKey] / maxX) * plotWidth;
    const y = padding.top + plotHeight - clamp(point[config.yKey], 0, 1) * plotHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  values.forEach((point) => {
    const x = padding.left + (point[config.xKey] / maxX) * plotWidth;
    const y = padding.top + plotHeight - clamp(point[config.yKey], 0, 1) * plotHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();
  });
}

function drawAxes(ctx, padding, width, height, xLabel, yLabel) {
  const x0 = padding.left;
  const y0 = height - padding.bottom;
  const x1 = width - padding.right;
  const y1 = padding.top;

  ctx.strokeStyle = "#9aaaa1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y1);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.stroke();

  ctx.fillStyle = "#5f6e67";
  ctx.font = "11px Arial, Helvetica, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(yLabel, x0 - 7, y1 + 8);
  ctx.textAlign = "right";
  ctx.fillText(xLabel, x1, height - 9);
  ctx.textAlign = "left";
}

function drawEmptyPlot(ctx, width, height, label) {
  ctx.fillStyle = "#6b7771";
  ctx.font = "13px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, width / 2, height / 2);
  ctx.textAlign = "left";
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, rect.width || canvas.parentElement.clientWidth || DEFAULT_LAYOUT_SIZE.width);
  const height = Math.max(180, rect.height || canvas.parentElement.clientHeight || DEFAULT_LAYOUT_SIZE.height);
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.round(width * dpr);
  const targetHeight = Math.round(height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function getVisibleCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width || DEFAULT_LAYOUT_SIZE.width,
    height: rect.height || DEFAULT_LAYOUT_SIZE.height
  };
}

function graphDegree(graph, nodeId) {
  const neighbors = graph.adjacency.get(nodeId);
  return neighbors ? neighbors.length : 0;
}

function shuffleArray(items, rng) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return clamp(number, min, max);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function debounce(callback, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}
