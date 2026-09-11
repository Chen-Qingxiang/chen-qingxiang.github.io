(() => {
  'use strict';

  const ROOT = 'https://raw.githubusercontent.com/tschoonj/xraylib/master/data/';
  const URLS = {
    edges: `${ROOT}fluor_lines/BindingEnergies.dat`,
    lines: `${ROOT}fluor_lines/fluor_lines.dat`,
    photo: `${ROOT}CS_Photo.dat`,
    rayl: `${ROOT}CS_Rayl.dat`,
    compt: `${ROOT}CS_Compt.dat`,
    weights: `${ROOT}atomicweight.dat`,
    densities: `${ROOT}densities.dat`
  };

  const state = {
    ready: false,
    failed: false,
    error: null,
    loading: null,
    edges: new Map(),
    lines: new Map(),
    cross: { photo: new Map(), rayl: new Map(), compt: new Map() },
    weights: new Map(),
    densities: new Map()
  };

  async function fetchText(url) {
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.text();
  }

  function parseKeyValueTable(text) {
    const out = new Map();
    text.split(/\r?\n/).forEach(line => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      const parts = clean.split(/\s+/);
      if (parts.length < 2) return;
      const z = Number(parts[0]);
      const value = Number(parts[1]);
      if (Number.isFinite(z) && Number.isFinite(value)) out.set(z, value);
    });
    return out;
  }

  function parseBindingEnergies(text) {
    const out = new Map();
    let shells = [];
    text.split(/\r?\n/).forEach(line => {
      const clean = line.trim();
      if (!clean) return;
      if (clean.startsWith('#L')) {
        const parts = clean.replace(/^#L\s*/, '').split(/\s+/);
        shells = parts.slice(1);
        return;
      }
      if (clean.startsWith('#')) return;
      const parts = clean.split(/\s+/).map(Number);
      const z = parts[0];
      if (!Number.isFinite(z)) return;
      const values = {};
      shells.forEach((shell, index) => {
        const value = parts[index + 1];
        if (Number.isFinite(value) && value > 0) values[shell] = value;
      });
      out.set(z, values);
    });
    return out;
  }

  function parseFluorLines(text) {
    const out = new Map();
    text.split(/\r?\n/).forEach(line => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      const match = clean.match(/^(\d+)\s+(\S+)\s+([+-]?[\d.]+(?:[Ee][+-]?\d+)?)$/);
      if (!match) return;
      const z = Number(match[1]);
      const transition = match[2];
      const energyEV = Number(match[3]);
      if (!Number.isFinite(z) || !Number.isFinite(energyEV)) return;
      if (!out.has(z)) out.set(z, {});
      out.get(z)[transition] = energyEV / 1000;
    });
    return out;
  }

  function parseCrossSection(text) {
    const tokens = text.trim().split(/\s+/);
    const out = new Map();
    let cursor = 0;
    let z = 1;
    while (cursor < tokens.length) {
      const n = Number(tokens[cursor++]);
      if (!Number.isInteger(n) || n <= 0 || cursor + n * 3 > tokens.length) break;
      const x = new Float64Array(n);
      const y = new Float64Array(n);
      const y2 = new Float64Array(n);
      for (let i = 0; i < n; i += 1) {
        x[i] = Number(tokens[cursor++]);
        y[i] = Number(tokens[cursor++]);
        y2[i] = Number(tokens[cursor++]);
      }
      out.set(z, { x, y, y2 });
      z += 1;
    }
    return out;
  }

  function spline(table, lnEnergy) {
    if (!table || !table.x.length) return null;
    const { x, y, y2 } = table;
    const n = x.length;
    if (lnEnergy < x[0] || lnEnergy - x[n - 1] > 1e-7) return null;
    if (lnEnergy === x[n - 1]) return y[n - 1];

    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (hi + lo) >> 1;
      if (x[mid] > lnEnergy) hi = mid;
      else lo = mid;
    }

    const h = x[hi] - x[lo];
    if (h === 0) return (y[lo] + y[hi]) / 2;
    const a = (x[hi] - lnEnergy) / h;
    const b = (lnEnergy - x[lo]) / h;
    return a * y[lo] + b * y[hi]
      + (((a * a * a - a) * y2[lo]) + ((b * b * b - b) * y2[hi])) * h * h / 6;
  }

  function crossSection(kind, z, energyKeV) {
    const table = state.cross[kind]?.get(z);
    if (!table || !(energyKeV > 0)) return null;
    const lnSigma = spline(table, Math.log(energyKeV * 1000));
    return Number.isFinite(lnSigma) ? Math.exp(lnSigma) : null;
  }

  function interactions(z, energyKeV) {
    const photo = crossSection('photo', z, energyKeV);
    const rayl = crossSection('rayl', z, energyKeV);
    const compt = crossSection('compt', z, energyKeV);
    if (![photo, rayl, compt].every(Number.isFinite)) return null;
    const total = photo + rayl + compt;
    return { photo, rayl, compt, total };
  }

  function load() {
    if (state.loading) return state.loading;
    state.loading = Promise.all([
      fetchText(URLS.edges), fetchText(URLS.lines), fetchText(URLS.photo),
      fetchText(URLS.rayl), fetchText(URLS.compt), fetchText(URLS.weights),
      fetchText(URLS.densities)
    ]).then(([edges, lines, photo, rayl, compt, weights, densities]) => {
      state.edges = parseBindingEnergies(edges);
      state.lines = parseFluorLines(lines);
      state.cross.photo = parseCrossSection(photo);
      state.cross.rayl = parseCrossSection(rayl);
      state.cross.compt = parseCrossSection(compt);
      state.weights = parseKeyValueTable(weights);
      state.densities = parseKeyValueTable(densities);
      state.ready = true;
      return state;
    }).catch(error => {
      state.failed = true;
      state.error = error;
      throw error;
    });
    return state.loading;
  }

  window.XRAY_PHYSICS = {
    load,
    state,
    getEdges: z => state.edges.get(z) || null,
    getLines: z => state.lines.get(z) || null,
    getWeight: z => state.weights.get(z) ?? null,
    getDensity: z => state.densities.get(z) ?? null,
    crossSection,
    interactions,
    sources: URLS
  };
})();
