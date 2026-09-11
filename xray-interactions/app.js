import initXraydb, * as xray from 'https://cdn.jsdelivr.net/npm/xraydb-wasm@0.4.1/loader.mjs';

const $ = (id) => document.getElementById(id);

const PRESETS = [
  { label: 'Fe 铁', formula: 'Fe', density: 7.874, elemental: true, edgeElements: ['Fe'] },
  { label: 'Cu 铜', formula: 'Cu', density: 8.96, elemental: true, edgeElements: ['Cu'] },
  { label: 'Au 金', formula: 'Au', density: 19.32, elemental: true, edgeElements: ['Au'] },
  { label: 'W 钨', formula: 'W', density: 19.25, elemental: true, edgeElements: ['W'] },
  { label: 'Al 铝', formula: 'Al', density: 2.699, elemental: true, edgeElements: ['Al'] },
  { label: 'Si 硅', formula: 'Si', density: 2.329, elemental: true, edgeElements: ['Si'] },
  { label: 'Pb 铅', formula: 'Pb', density: 11.34, elemental: true, edgeElements: ['Pb'] },
  { label: 'CsI', formula: 'CsI', density: 4.51, elemental: false, edgeElements: ['Cs', 'I'] },
  { label: 'Water', formula: 'H2O', density: 1.0, elemental: false, edgeElements: ['H', 'O'] }
];

const COLORS = {
  photo: '#cf5d6f',
  coherent: '#6e72c8',
  incoherent: '#2f8b8a',
  total: '#172033'
};

const state = {
  ready: false,
  material: PRESETS[0],
  emin: 20,
  emax: 200,
  energy: 80,
  edges: [],
  data: null
};

function fmt(value, sig = 4) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const a = Math.abs(value);
  if (a >= 1e4 || a < 1e-3) return value.toExponential(sig - 1);
  return Number(value.toPrecision(sig)).toString();
}

function pct(value) {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function uniqueSorted(values) {
  return [...new Set(values.map(v => Number(v.toFixed(3))))].sort((a, b) => a - b);
}

function makeEnergyGrid() {
  const values = [];
  const n = 420;
  for (let i = 0; i < n; i += 1) {
    values.push((state.emin + (state.emax - state.emin) * i / (n - 1)) * 1000);
  }
  for (const edge of state.edges) {
    if (edge.energy <= state.emin * 1000 || edge.energy >= state.emax * 1000) continue;
    values.push(edge.energy * 0.9995, edge.energy, edge.energy * 1.0005);
  }
  return new Float64Array(uniqueSorted(values));
}

function inferEdgeElements(formula) {
  const tokens = formula.match(/[A-Z][a-z]?/g) || [];
  return [...new Set(tokens)].filter(symbol => {
    try { xray.atomic_number(symbol); return true; } catch { return false; }
  });
}

function isElementFormula(formula) {
  if (!/^[A-Z][a-z]?$/.test(formula)) return false;
  try {
    return xray.symbol(formula) === formula;
  } catch {
    return false;
  }
}

function massCoefficient(material, energies, kind) {
  if (material.elemental) {
    return Array.from(xray.mu_elam(material.formula, energies, kind));
  }
  const linear = Array.from(xray.material_mu(material.formula, material.density, energies, kind));
  return linear.map(v => v / material.density);
}

function loadEdges(material) {
  const edges = [];
  for (const symbol of material.edgeElements || []) {
    try {
      for (const edge of xray.xray_edges(symbol)) {
        const kev = edge.energy / 1000;
        if (kev >= state.emin && kev <= state.emax) {
          edges.push({ ...edge, element: symbol });
        }
      }
    } catch {
      // Keep the explorer usable even if one constituent has no edge table.
    }
  }
  edges.sort((a, b) => a.energy - b.energy);
  state.edges = edges;
}

function computeCurves() {
  loadEdges(state.material);
  const energies = makeEnergyGrid();
  const photo = massCoefficient(state.material, energies, 'photo');
  const coherent = massCoefficient(state.material, energies, 'coherent');
  const incoherent = massCoefficient(state.material, energies, 'incoherent');
  const total = photo.map((v, i) => v + coherent[i] + incoherent[i]);
  const fPhoto = total.map((v, i) => photo[i] / v);
  const fCoherent = total.map((v, i) => coherent[i] / v);
  const fIncoherent = total.map((v, i) => incoherent[i] / v);
  state.data = { energies: Array.from(energies), photo, coherent, incoherent, total, fPhoto, fCoherent, fIncoherent };
}

function atCurrentEnergy() {
  const e = new Float64Array([state.energy * 1000]);
  const photo = massCoefficient(state.material, e, 'photo')[0];
  const coherent = massCoefficient(state.material, e, 'coherent')[0];
  const incoherent = massCoefficient(state.material, e, 'incoherent')[0];
  const total = photo + coherent + incoherent;
  return {
    photo, coherent, incoherent, total,
    fPhoto: photo / total,
    fCoherent: coherent / total,
    fIncoherent: incoherent / total
  };
}

function buildPresets() {
  const wrap = $('presetWrap');
  PRESETS.forEach((preset, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `preset-button${index === 0 ? ' active' : ''}`;
    button.textContent = preset.label;
    button.addEventListener('click', () => selectMaterial(preset, button));
    wrap.appendChild(button);
  });
}

function selectMaterial(material, clickedButton = null) {
  if (!state.ready) return;
  state.material = { ...material };
  $('formulaInput').value = material.formula;
  $('densityInput').value = material.density;
  document.querySelectorAll('.preset-button').forEach(button => button.classList.remove('active'));
  if (clickedButton) clickedButton.classList.add('active');
  try {
    computeCurves();
    $('materialStatus').classList.remove('error');
    $('materialStatus').textContent = `${material.label || material.formula} · ρ ${fmt(material.density)} g/cm³`;
    renderAll();
  } catch (err) {
    showError(err);
  }
}

function applyCustomMaterial() {
  if (!state.ready) return;
  const formula = $('formulaInput').value.trim();
  const density = Number($('densityInput').value);
  if (!formula || !(density > 0)) {
    showError('请输入有效的化学式和正密度。');
    return;
  }
  const material = {
    label: formula,
    formula,
    density,
    elemental: isElementFormula(formula),
    edgeElements: inferEdgeElements(formula)
  };
  document.querySelectorAll('.preset-button').forEach(button => button.classList.remove('active'));
  selectMaterial(material);
}

function showError(error) {
  $('materialStatus').classList.add('error');
  $('materialStatus').textContent = String(error?.message || error);
}

function updateSummary() {
  const v = atCurrentEnergy();
  $('energyReadout').textContent = state.energy.toFixed(0);
  $('photoPct').textContent = pct(v.fPhoto);
  $('coherentPct').textContent = pct(v.fCoherent);
  $('comptonPct').textContent = pct(v.fIncoherent);
  $('photoMu').textContent = `${fmt(v.photo)} cm²/g`;
  $('coherentMu').textContent = `${fmt(v.coherent)} cm²/g`;
  $('comptonMu').textContent = `${fmt(v.incoherent)} cm²/g`;

  const candidates = [
    ['光电吸收占主导', v.fPhoto],
    ['Rayleigh 占主导', v.fCoherent],
    ['Compton 占主导', v.fIncoherent]
  ].sort((a, b) => b[1] - a[1]);
  $('dominantReadout').textContent = `${candidates[0][0]} · ${pct(candidates[0][1])}`;

  const important = state.edges.filter(edge => ['K', 'L1', 'L2', 'L3'].includes(edge.label));
  if (important.length) {
    $('edgeSummary').textContent = `吸收边（当前能区）：${important.map(e => `${e.element} ${e.label} ${fmt(e.energy / 1000, 5)} keV`).join(' · ')}`;
  } else {
    $('edgeSummary').textContent = '20–200 keV 内没有 K/L 吸收边；曲线在此区间内相对平滑。';
  }
}

function svgPath(xs, ys, px, py) {
  let d = '';
  let pen = false;
  for (let i = 0; i < xs.length; i += 1) {
    const y = ys[i];
    if (!Number.isFinite(y) || y <= 0 && py.logScale) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${px(xs[i]).toFixed(2)},${py(y).toFixed(2)}`;
    pen = true;
  }
  return d;
}

function drawEdges(parts, px, top, bottom) {
  for (const edge of state.edges.filter(e => ['K', 'L1', 'L2', 'L3'].includes(e.label))) {
    const x = px(edge.energy);
    parts.push(`<line class="edge-line" x1="${x}" y1="${top}" x2="${x}" y2="${bottom}"/>`);
    parts.push(`<text class="edge-label" x="${x + 3}" y="${top + 10}">${edge.element} ${edge.label} ${(edge.energy / 1000).toFixed(1)}</text>`);
  }
}

function drawFractionPlot() {
  const svg = $('fractionPlot');
  const data = state.data;
  if (!data) return;
  const W = 1180, H = 350, ML = 58, MR = 20, MT = 20, MB = 46;
  const left = state.emin * 1000, right = state.emax * 1000;
  const px = e => ML + (e - left) / (right - left) * (W - ML - MR);
  const py = value => H - MB - value * (H - MT - MB);
  const parts = [];

  for (const p of [0, .25, .5, .75, 1]) {
    const y = py(p);
    parts.push(`<line class="grid" x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}"/>`);
    parts.push(`<text class="tick" x="${ML - 8}" y="${y + 4}" text-anchor="end">${Math.round(p * 100)}%</text>`);
  }
  for (let kev = 20; kev <= 200; kev += 20) {
    const x = px(kev * 1000);
    parts.push(`<line class="grid" x1="${x}" y1="${MT}" x2="${x}" y2="${H - MB}"/>`);
    parts.push(`<text class="tick" x="${x}" y="${H - MB + 17}" text-anchor="middle">${kev}</text>`);
  }

  drawEdges(parts, px, MT, H - MB);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.fPhoto, px, py)}" style="stroke:${COLORS.photo}"/>`);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.fCoherent, px, py)}" style="stroke:${COLORS.coherent}"/>`);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.fIncoherent, px, py)}" style="stroke:${COLORS.incoherent}"/>`);

  const cx = px(state.energy * 1000);
  parts.push(`<line class="cursor" x1="${cx}" y1="${MT}" x2="${cx}" y2="${H - MB}"/>`);
  const current = atCurrentEnergy();
  for (const [fraction, color] of [[current.fPhoto, COLORS.photo], [current.fCoherent, COLORS.coherent], [current.fIncoherent, COLORS.incoherent]]) {
    parts.push(`<circle class="marker" cx="${cx}" cy="${py(fraction)}" r="4.5" fill="${color}"/>`);
  }

  parts.push(`<line class="axis" x1="${ML}" y1="${H - MB}" x2="${W - MR}" y2="${H - MB}"/>`);
  parts.push(`<line class="axis" x1="${ML}" y1="${MT}" x2="${ML}" y2="${H - MB}"/>`);
  parts.push(`<text class="axis-label" x="${(ML + W - MR) / 2}" y="${H - 8}" text-anchor="middle">Photon energy (keV)</text>`);
  parts.push(`<text class="axis-label" transform="translate(15,${(MT + H - MB) / 2}) rotate(-90)" text-anchor="middle">Fraction of attenuation</text>`);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join('');
}

function drawMuPlot() {
  const svg = $('muPlot');
  const data = state.data;
  if (!data) return;
  const W = 1180, H = 360, ML = 68, MR = 20, MT = 20, MB = 46;
  const left = state.emin * 1000, right = state.emax * 1000;
  const allPositive = [...data.photo, ...data.coherent, ...data.incoherent, ...data.total].filter(v => Number.isFinite(v) && v > 0);
  const rawMin = Math.min(...allPositive), rawMax = Math.max(...allPositive);
  const logMin = Math.floor(Math.log10(rawMin));
  const logMax = Math.ceil(Math.log10(rawMax));
  const px = e => ML + (e - left) / (right - left) * (W - ML - MR);
  const py = value => H - MB - (Math.log10(value) - logMin) / (logMax - logMin || 1) * (H - MT - MB);
  py.logScale = true;
  const parts = [];

  for (let d = logMin; d <= logMax; d += 1) {
    const value = 10 ** d;
    const y = py(value);
    parts.push(`<line class="grid" x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}"/>`);
    parts.push(`<text class="tick" x="${ML - 8}" y="${y + 4}" text-anchor="end">10${superscript(d)}</text>`);
  }
  for (let kev = 20; kev <= 200; kev += 20) {
    const x = px(kev * 1000);
    parts.push(`<line class="grid" x1="${x}" y1="${MT}" x2="${x}" y2="${H - MB}"/>`);
    parts.push(`<text class="tick" x="${x}" y="${H - MB + 17}" text-anchor="middle">${kev}</text>`);
  }

  drawEdges(parts, px, MT, H - MB);
  parts.push(`<path class="trace total" d="${svgPath(data.energies, data.total, px, py)}" style="stroke:${COLORS.total}"/>`);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.photo, px, py)}" style="stroke:${COLORS.photo}"/>`);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.coherent, px, py)}" style="stroke:${COLORS.coherent}"/>`);
  parts.push(`<path class="trace" d="${svgPath(data.energies, data.incoherent, px, py)}" style="stroke:${COLORS.incoherent}"/>`);

  const cx = px(state.energy * 1000);
  parts.push(`<line class="cursor" x1="${cx}" y1="${MT}" x2="${cx}" y2="${H - MB}"/>`);
  const current = atCurrentEnergy();
  for (const [value, color] of [[current.photo, COLORS.photo], [current.coherent, COLORS.coherent], [current.incoherent, COLORS.incoherent]]) {
    parts.push(`<circle class="marker" cx="${cx}" cy="${py(value)}" r="4.5" fill="${color}"/>`);
  }

  parts.push(`<line class="axis" x1="${ML}" y1="${H - MB}" x2="${W - MR}" y2="${H - MB}"/>`);
  parts.push(`<line class="axis" x1="${ML}" y1="${MT}" x2="${ML}" y2="${H - MB}"/>`);
  parts.push(`<text class="axis-label" x="${(ML + W - MR) / 2}" y="${H - 8}" text-anchor="middle">Photon energy (keV)</text>`);
  parts.push(`<text class="axis-label" transform="translate(16,${(MT + H - MB) / 2}) rotate(-90)" text-anchor="middle">μ/ρ (cm²/g)</text>`);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join('');
}

function superscript(n) {
  const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => map[c] || c).join('');
}

function renderAll() {
  updateSummary();
  drawFractionPlot();
  drawMuPlot();
}

function wireControls() {
  $('energySlider').addEventListener('input', event => {
    state.energy = Number(event.target.value);
    renderAll();
  });
  $('applyMaterial').addEventListener('click', applyCustomMaterial);
  $('formulaInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') applyCustomMaterial();
  });
  $('densityInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') applyCustomMaterial();
  });
}

async function boot() {
  buildPresets();
  wireControls();
  try {
    await initXraydb();
    state.ready = true;
    const version = xray.data_version?.() || 'loaded';
    $('materialStatus').textContent = `XrayDB ${version} · browser WASM`;
    computeCurves();
    renderAll();
  } catch (err) {
    showError(`X-ray 数据库加载失败：${err?.message || err}`);
  }
}

boot();
