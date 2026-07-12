import { CELL_NAMES, POLICY_LENGTH } from "../constants.js";
import { actionName, inspectPercepts, policyActionSummary } from "../policy.js";
import { app } from "./appState.js";
import { els } from "./dom.js";

export function valueName(value) {
  return CELL_NAMES[value] || "?";
}

export function shortPerceptText(values, index) {
  return `#${index} C${values[0]} N${values[1]} S${values[2]} W${values[3]} E${values[4]}`;
}

function selectedInspectorPolicy() {
  const selected = els.policySelector.value;
  if (selected === "best" && app.policies.best) {
    return app.policies.best;
  }
  if (selected === "hand") {
    return app.policies.hand;
  }
  return app.policies.random;
}

export function updatePolicyInspector() {
  const policy = selectedInspectorPolicy();
  if (!policy || policy.length !== POLICY_LENGTH) return;

  const counts = policyActionSummary(policy);
  els.actionSummary.innerHTML = "";
  counts.forEach((count, action) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const label = document.createElement("span");
    label.textContent = actionName(action);

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(count / POLICY_LENGTH) * 100}%`;
    track.appendChild(fill);

    const number = document.createElement("strong");
    number.textContent = String(count);

    row.append(label, track, number);
    els.actionSummary.appendChild(row);
  });

  els.perceptTableBody.innerHTML = "";
  inspectPercepts(policy).forEach((item) => {
    const row = document.createElement("tr");
    const cells = [
      item.label,
      valueName(item.values[0]),
      valueName(item.values[1]),
      valueName(item.values[2]),
      valueName(item.values[3]),
      valueName(item.values[4]),
      String(item.index),
      actionName(item.action)
    ];
    cells.forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    });
    els.perceptTableBody.appendChild(row);
  });
}
