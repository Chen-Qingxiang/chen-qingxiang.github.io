export const MAX_LATITUDE = 85.0511287798066;
export const TILE_SIZE = 256;
export const MAX_LEVEL = 12;
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export const decodeTerrarium = (r, g, b) => r * 256 + g + b / 256 - 32768;
export const toMercator = (lon, lat) => [
  (lon + 180) / 360,
  (1 - Math.asinh(Math.tan(clamp(lat, -MAX_LATITUDE, MAX_LATITUDE) * Math.PI / 180)) / Math.PI) / 2,
];
export const fromMercator = (x, y) => [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI];
export function tileCoordinate(lon, lat, level) {
  const n = 2 ** level;
  const [mx, my] = toMercator(lon === 180 ? -180 : lon, lat);
  const x = clamp(Math.floor(mx * n), 0, n - 1);
  const y = clamp(Math.floor(my * n), 0, n - 1);
  return {x, y, px: clamp((mx * n - x) * 256, 0, 255), py: clamp((my * n - y) * 256, 0, 255)};
}

export const PALETTES = {
  atlas: {name: '山海', stops: [
    [-11000, '#081c35'], [-6000, '#154566'], [-3500, '#307789'], [-500, '#76afb3'], [-1, '#b4d2cb'],
    [0, '#b8c29b'], [250, '#a2b285'], [1000, '#8c9a69'], [2200, '#b3a071'], [4000, '#c7b899'], [6500, '#ded7c8'], [9000, '#ffffff']]},
  topo15: {name: 'Topo15', stops: [
    [-11000, '#0a0079'], [-10000, '#240099'], [-8000, '#000ecb'], [-6000, '#0d48e7'], [-5000, '#1277f4'],
    [-4000, '#16a0fc'], [-3000, '#2cbaff'], [-2000, '#43c9ff'], [-1000, '#64dfff'], [-1, '#b9e8ff'],
    [0, '#30b24c'], [100, '#a0de89'], [200, '#d2e19f'], [500, '#fcd7ad'], [1000, '#f1c780'],
    [1500, '#e2b34c'], [2000, '#cfa424'], [3000, '#a48e18'], [4000, '#9d790c'], [5000, '#9b6311'],
    [6000, '#b27b7b'], [7000, '#c3b5b5'], [8000, '#d7d7d7'], [9000, '#e5e5e5']]},
  vivid: {name: '强地形', stops: [
    [-11000, '#030a39'], [-7000, '#08276c'], [-4000, '#075aab'], [-1500, '#159cbd'], [-1, '#8fe0df'],
    [0, '#3c9b46'], [250, '#76b646'], [900, '#c5ca48'], [1800, '#edc65a'], [3000, '#d48b3c'], [4500, '#9f5c34'], [6000, '#c2aea0'], [7500, '#e6e5df'], [9000, '#ffffff']]},
  school: {name: '地图册', stops: [
    [-11000, '#78abc9'], [-6000, '#93c5dd'], [-2000, '#bbdfea'], [-1, '#d8eef0'],
    [0, '#80b969'], [200, '#a7c876'], [800, '#d9d990'], [1600, '#ecda9c'], [2800, '#d5b17a'], [4200, '#b58a60'], [6000, '#d3c7b3'], [8000, '#f5f2e8'], [9000, '#ffffff']]},
  ocean: {name: '海底增强', stops: [
    [-11000, '#090e32'], [-8000, '#24205c'], [-6000, '#23477f'], [-4000, '#277b9d'], [-2500, '#38a9b6'], [-1000, '#83d2ca'], [-1, '#d1efdc'],
    [0, '#d1d0bc'], [1500, '#c5bea5'], [3500, '#b7ac98'], [6500, '#d7d1c4'], [9000, '#f4f1e7']]},
  earth: {name: '纸上山川', stops: [
    [-11000, '#475661'], [-5000, '#7b9298'], [-1, '#d7e3dd'], [0, '#e4dabd'],
    [1000, '#d1bf96'], [3000, '#b79b73'], [5500, '#9f8268'], [9000, '#f6f0e4']]},
  gray: {name: '灰度研究', stops: [[-11000, '#253c4a'], [-1, '#b5cad1'], [0, '#c3c4be'], [2500, '#a4a59e'], [9000, '#f8f8f5']]},
};
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
export function makeColorTable(name) {
  const stops = (PALETTES[name] || PALETTES.atlas).stops.map(([h, c]) => [h, rgb(c)]);
  const colors = new Uint8ClampedArray(20001 * 3);
  let k = 0;
  for (let h = -11000; h <= 9000; h++) {
    while (k < stops.length - 2 && h > stops[k + 1][0]) k++;
    const a = stops[k], b = stops[k + 1], t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    for (let j = 0; j < 3; j++) colors[(h + 11000) * 3 + j] = a[1][j] * (1 - t) + b[1][j] * t;
  }
  return colors;
}
export function heightGrid(tiles, size = 65) {
  // Use the same east/south sample as the neighboring tile's west/north sample.
  // Sampling pixel origins consistently avoids independently clamped seams.
  const result = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = Math.round(x * 256 / (size - 1)), py = Math.round(y * 256 / (size - 1));
    const tile = tiles[(py === 256 ? 2 : 0) + (px === 256 ? 1 : 0)];
    result[y * size + x] = tile[(py % 256) * 256 + px % 256];
  }
  return result;
}

export const DEFAULTS = Object.freeze({scale: 30, palette: 'atlas', language: 'en', relief: true, countries: true,
  provinces: false, rivers: false, riverDetail: 1, landforms: true, landformDetail: 1, northLock: false, grid: false, cities: true, opacity: 85, colorOpacity: 100, mode: '3d'});
export function cleanSettings(raw = {}, touch = false) {
  if (!raw || typeof raw !== 'object') raw = {};
  const s = {...DEFAULTS, northLock: touch};
  for (const key of ['relief', 'countries', 'provinces', 'rivers', 'grid', 'cities', 'landforms', 'northLock']) if (typeof raw[key] === 'boolean') s[key] = raw[key];
  for (const [key, low, high] of [['scale', 1, 200], ['opacity', 0, 100], ['colorOpacity', 0, 100]]) {
    if (Number.isFinite(Number(raw[key])) && raw[key] !== null && raw[key] !== '') s[key] = clamp(Number(raw[key]), low, high);
  }
  for (const key of ['riverDetail','landformDetail']) if ([0,1,2].includes(raw[key])) s[key] = raw[key];
  if (Object.hasOwn(PALETTES, raw.palette)) s.palette = raw.palette;
  if (['en','zh'].includes(raw.language)) s.language = raw.language;
  if (['3d', '2d', '2.5d'].includes(raw.mode)) s.mode = raw.mode;
  return s;
}
export function parseCoordinates(text) {
  const match = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lon = Number(match[1]), lat = Number(match[2]);
  return Math.abs(lon) <= 180 && Math.abs(lat) <= 90 ? {lon, lat} : null;
}
export function normalize(text) {
  return String(text || '').normalize('NFKD').replace(/[\u0300-\u036f\s'’·-]/g, '').toLowerCase();
}
export function searchCities(cities, query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  return cities.map(city => {
    const names = [city.name, city.zh, city.ascii, city.alt].map(normalize);
    const score = names.includes(q) ? 0 : names.some(n => n.startsWith(q)) ? 1 : names.some(n => n.includes(q)) ? 2 : 9;
    return {city, score};
  }).filter(r => r.score < 9).sort((a, b) => a.score - b.score || a.city.rank - b.city.rank).slice(0, limit).map(r => r.city);
}

export function prepareLines(lines) {
  return lines.filter(line => line.length > 1).map(points => {
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [lon, lat] of points) {
      bbox[0] = Math.min(bbox[0], lon); bbox[1] = Math.min(bbox[1], lat);
      bbox[2] = Math.max(bbox[2], lon); bbox[3] = Math.max(bbox[3], lat);
    }
    return {points, bbox};
  });
}
export function parseGeoJSON(input) {
  const lines = [], points = [];
  let vertices = 0;
  const position = p => {
    if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) throw new Error('坐标应为 WGS84 经度、纬度（十进制度）。');
    if (++vertices > 100000) throw new Error('一个文件最多支持 100,000 个顶点，请先简化数据。');
    return p.slice(0, 2);
  };
  const line = ps => { if (!Array.isArray(ps) || ps.length < 2) throw new Error('线或面缺少坐标。'); lines.push(ps.map(position)); };
  const geometry = (g, props = {}) => {
    if (g == null) return;
    const name = String(props.name || props.title || props.NAME || '自定义地点').slice(0, 100);
    switch (g.type) {
      case 'Point': {const [lon, lat] = position(g.coordinates); points.push({lon, lat, name, rank: 0}); break;}
      case 'MultiPoint': for (const p of g.coordinates) geometry({type: 'Point', coordinates: p}, props); break;
      case 'LineString': line(g.coordinates); break;
      case 'MultiLineString': case 'Polygon': g.coordinates.forEach(line); break;
      case 'MultiPolygon': g.coordinates.forEach(p => p.forEach(line)); break;
      case 'GeometryCollection': g.geometries.forEach(g => geometry(g, props)); break;
      default: throw new Error('仅支持 GeoJSON 点、线、面和几何集合。');
    }
  };
  if (!input || typeof input !== 'object') throw new Error('文件不是有效的 GeoJSON。');
  if (input.crs && input.crs.properties?.name && !/(4326|CRS84)$/i.test(input.crs.properties.name)) throw new Error('请将数据转换到 WGS84（EPSG:4326）。');
  if (input.type === 'FeatureCollection') {
    if (!Array.isArray(input.features)) throw new Error('GeoJSON 缺少 features。');
    input.features.forEach(f => geometry(f.geometry, f.properties || {}));
  } else if (input.type === 'Feature') geometry(input.geometry, input.properties || {});
  else geometry(input);
  if (!lines.length && !points.length) throw new Error('文件里没有可显示的地理要素。');
  if (points.length > 2000) throw new Error('一个文件最多支持 2,000 个地点。');
  return {lines: prepareLines(lines), points, vertices};
}
