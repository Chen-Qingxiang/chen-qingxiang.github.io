(function () {
  "use strict";

  const NEIGHBORHOODS = ["111", "110", "101", "100", "011", "010", "001", "000"];

  function clampInteger(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function getRuleOutput(rule, left, center, right) {
    const bitIndex = (left << 2) | (center << 1) | right;
    return (rule >> bitIndex) & 1;
  }

  function getRuleBits(rule) {
    return NEIGHBORHOODS.map((pattern) => {
      const bits = pattern.split("").map(Number);
      return getRuleOutput(rule, bits[0], bits[1], bits[2]);
    });
  }

  function createInitialRow(width, mode, density, randomFn = Math.random) {
    const row = new Uint8Array(width);
    if (mode === "random") {
      for (let i = 0; i < width; i += 1) {
        row[i] = randomFn() < density ? 1 : 0;
      }
      return row;
    }

    row[Math.floor(width / 2)] = 1;
    return row;
  }

  function nextRow(row, rule) {
    const width = row.length;
    const next = new Uint8Array(width);
    for (let i = 0; i < width; i += 1) {
      const left = i === 0 ? 0 : row[i - 1];
      const center = row[i];
      const right = i === width - 1 ? 0 : row[i + 1];
      next[i] = getRuleOutput(rule, left, center, right);
    }
    return next;
  }

  function generateAutomaton(rule, width, steps, initialMode, density, randomFn = Math.random) {
    const rows = [];
    let current = createInitialRow(width, initialMode, density, randomFn);
    rows.push(current);

    for (let step = 1; step < steps; step += 1) {
      current = nextRow(current, rule);
      rows.push(current);
    }

    return rows;
  }

  function initApp() {
    const elements = {
      ruleInput: document.getElementById("ruleInput"),
      widthInput: document.getElementById("widthInput"),
      stepsInput: document.getElementById("stepsInput"),
      cellSizeInput: document.getElementById("cellSizeInput"),
      initialConditionInput: document.getElementById("initialConditionInput"),
      densityInput: document.getElementById("densityInput"),
      densityOutput: document.getElementById("densityOutput"),
      renderButton: document.getElementById("renderButton"),
      randomizeButton: document.getElementById("randomizeButton"),
      ruleTable: document.getElementById("ruleTable"),
      ruleBitsText: document.getElementById("ruleBitsText"),
      statusText: document.getElementById("statusText"),
      canvas: document.getElementById("automataCanvas"),
    };

    const context = elements.canvas.getContext("2d", { alpha: false });
    let currentInitialRow = null;
    let lastInitialKey = "";

    function readSettings() {
      const rule = clampInteger(elements.ruleInput.value, 0, 255, 30);
      const width = clampInteger(elements.widthInput.value, 8, 1200, 161);
      const steps = clampInteger(elements.stepsInput.value, 1, 1000, 140);
      const cellSize = clampInteger(elements.cellSizeInput.value, 1, 12, 4);
      const density = clampNumber(elements.densityInput.value, 0, 1, 0.5);
      const initialMode = elements.initialConditionInput.value === "random" ? "random" : "single";

      elements.ruleInput.value = String(rule);
      elements.widthInput.value = String(width);
      elements.stepsInput.value = String(steps);
      elements.cellSizeInput.value = String(cellSize);
      elements.densityInput.value = String(density);
      elements.densityOutput.textContent = `${Math.round(density * 100)}%`;

      return { rule, width, steps, cellSize, density, initialMode };
    }

    function getInitialRow(settings, forceNewRandom) {
      const key = `${settings.width}:${settings.initialMode}:${settings.density}`;
      if (settings.initialMode === "random") {
        if (forceNewRandom || !currentInitialRow || lastInitialKey !== key) {
          currentInitialRow = createInitialRow(
            settings.width,
            "random",
            settings.density,
            Math.random,
          );
          lastInitialKey = key;
        }
        return currentInitialRow.slice();
      }

      currentInitialRow = createInitialRow(settings.width, "single", settings.density, Math.random);
      lastInitialKey = key;
      return currentInitialRow.slice();
    }

    function updateRuleTable(rule) {
      const outputs = getRuleBits(rule);
      elements.ruleBitsText.textContent = `binary ${rule.toString(2).padStart(8, "0")}`;
      elements.ruleTable.replaceChildren(
        ...NEIGHBORHOODS.map((pattern, index) => {
          const item = document.createElement("div");
          item.className = "rule-item";

          const neighborhood = document.createElement("span");
          neighborhood.className = "neighborhood";
          neighborhood.setAttribute("aria-label", `Neighborhood ${pattern}`);

          for (const bit of pattern) {
            const cell = document.createElement("span");
            cell.className = bit === "1" ? "mini-cell is-on" : "mini-cell";
            neighborhood.append(cell);
          }

          const arrow = document.createElement("span");
          arrow.className = "arrow";
          arrow.textContent = "->";

          const result = document.createElement("span");
          result.className = "result-cell";
          result.setAttribute("aria-label", `Output ${outputs[index]}`);
          const resultCell = document.createElement("span");
          resultCell.className = outputs[index] === 1 ? "mini-cell is-on" : "mini-cell";
          result.append(resultCell);

          item.append(neighborhood, arrow, result);
          return item;
        }),
      );
    }

    function drawAutomaton(rows, settings) {
      const cssWidth = settings.width * settings.cellSize;
      const cssHeight = settings.steps * settings.cellSize;
      const pixelRatio = window.devicePixelRatio || 1;

      elements.canvas.width = Math.max(1, Math.floor(cssWidth * pixelRatio));
      elements.canvas.height = Math.max(1, Math.floor(cssHeight * pixelRatio));
      elements.canvas.style.width = `${cssWidth}px`;
      elements.canvas.style.height = `${cssHeight}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.fillStyle = "#060708";
      context.fillRect(0, 0, cssWidth, cssHeight);
      context.fillStyle = "#f5f7f8";

      for (let y = 0; y < rows.length; y += 1) {
        const row = rows[y];
        for (let x = 0; x < row.length; x += 1) {
          if (row[x] === 1) {
            context.fillRect(
              x * settings.cellSize,
              y * settings.cellSize,
              settings.cellSize,
              settings.cellSize,
            );
          }
        }
      }
    }

    function render(forceNewRandom) {
      const settings = readSettings();
      updateRuleTable(settings.rule);

      const initialRow = getInitialRow(settings, forceNewRandom);
      const rows = [initialRow];
      let current = initialRow;
      for (let step = 1; step < settings.steps; step += 1) {
        current = nextRow(current, settings.rule);
        rows.push(current);
      }

      drawAutomaton(rows, settings);
      elements.statusText.classList.remove("is-error");
      elements.statusText.textContent =
        `${settings.width} cells x ${settings.steps} steps`;
    }

    function renderWithErrorBoundary(forceNewRandom) {
      try {
        render(forceNewRandom);
      } catch (error) {
        elements.statusText.classList.add("is-error");
        elements.statusText.textContent = "Render failed. Check the console for details.";
        throw error;
      }
    }

    elements.renderButton.addEventListener("click", () => renderWithErrorBoundary(true));
    elements.randomizeButton.addEventListener("click", () => {
      elements.ruleInput.value = String(Math.floor(Math.random() * 256));
      elements.initialConditionInput.value = "random";
      renderWithErrorBoundary(true);
    });

    for (const button of document.querySelectorAll("[data-rule]")) {
      button.addEventListener("click", () => {
        elements.ruleInput.value = button.dataset.rule;
        renderWithErrorBoundary(false);
      });
    }

    elements.ruleInput.addEventListener("input", () => renderWithErrorBoundary(false));
    elements.widthInput.addEventListener("change", () => renderWithErrorBoundary(true));
    elements.stepsInput.addEventListener("change", () => renderWithErrorBoundary(false));
    elements.cellSizeInput.addEventListener("change", () => renderWithErrorBoundary(false));
    elements.initialConditionInput.addEventListener("change", () => renderWithErrorBoundary(true));
    elements.densityInput.addEventListener("input", () => renderWithErrorBoundary(true));

    renderWithErrorBoundary(false);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initApp);
  }

  if (typeof module !== "undefined") {
    module.exports = {
      NEIGHBORHOODS,
      getRuleOutput,
      getRuleBits,
      createInitialRow,
      nextRow,
      generateAutomaton,
    };
  }
})();
