(async () => {
  'use strict';

  const REGISTRY = Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [];
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const PEOPLE = {};
  const META = {};
  const ids = [];
  const selected = new Set();
  const layers = new Map();
  const AUTO_COLORS = ['#b64335','#276a8f','#745188','#3f7a55','#a56a26','#4968a8','#9a4f73','#66733b','#8b5a3c','#347d7a'];

  const state = {
    rangeMode: 'union', start: 0, end: 1, time: 0,
    playing: false, speed: 1, raf: 0, last: 0
  };

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`无法载入 ${url}`));
      document.head.appendChild(s);
    });
  }

  async function loadEntry(entry) {
    const loader = entry.loader || {};
    let raw = null;
    if (loader.type === 'json') {
      const r = await fetch(loader.url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${entry.label || entry.id}: ${r.status}`);
      raw = await r.json();
    } else if (loader.type === 'scripts') {
      if (loader.global) delete window[loader.global];
      for (const url of (loader.urls || [])) await loadScript(url);
      raw = window[loader.global];
      if (!raw) throw new Error(`${entry.label || entry.id}: 全局数据 ${loader.global} 未生成`);
    } else if (loader.type === 'global') {
      raw = window[loader.global];
    }
    if (!raw) throw new Error(`${entry.label || entry.id}: 没有可比较数据`);
    const person = clone(raw);
    person.id = entry.id || person.id;
    person.events = Array.isArray(person.events) ? person.events : [];
    person.events.forEach(e => {
      e.time = Number(e.time ?? e.year);
      e.travelStart = Number(e.travelStart ?? e.time);
      e.travelEnd = Number(e.travelEnd ?? e.time);
    });
    person.lifeStart = Number(entry.lifeStart ?? person.lifeStart ?? person.events[0]?.time);
    person.lifeEnd = Number(entry.lifeEnd ?? person.lifeEnd ?? person.events.at(-1)?.time);
    person.period = entry.period || person.period || '';
    if (!person.events.length || !Number.isFinite(person.lifeStart) || !Number.isFinite(person.lifeEnd)) {
      throw new Error(`${entry.label || entry.id}: 缺少绝对年代或事件`);
    }
    return person;
  }

  for (let i = 0; i < REGISTRY.length; i++) {
    const entry = REGISTRY[i];
    if (entry.comparable === false) continue;
    try {
      const person = await loadEntry(entry);
      PEOPLE[entry.id] = person;
      META[entry.id] = {
        label: entry.label || person.shortName || person.name || entry.id,
        char: entry.char || person.shortName?.slice(0, 1) || person.name?.slice(0, 1) || '?',
        color: entry.color || AUTO_COLORS[i % AUTO_COLORS.length],
        defaultSelected: entry.defaultSelected !== false
      };
      ids.push(entry.id);
      if (entry.defaultSelected !== false) selected.add(entry.id);
    } catch (err) {
      console.warn('Spacetime compare dataset skipped:', entry, err);
    }
  }
  if (!selected.size && ids.length) selected.add(ids[0]);
  window.SPACETIME_COMPARE_PEOPLE = PEOPLE;

  const eventTime = e => Number(e.time ?? e.year);
  const travelStart = e => Number(e.travelStart ?? eventTime(e));
  const travelEnd = e => Number(e.travelEnd ?? eventTime(e));
  const lifeStart = person => Number(person.lifeStart ?? eventTime(person.events[0]));
  const lifeEnd = person => Number(person.lifeEnd ?? eventTime(person.events.at(-1)));
  const coverageStart = person => eventTime(person.events[0]);
  const coverageEnd = person => eventTime(person.events.at(-1));

  const map = L.map('compareMap', { zoomControl: true, preferCanvas: true, minZoom: 2, maxZoom: 11 }).setView([32, 114], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  map.createPane('terrainPane');
  map.getPane('terrainPane').style.zIndex = 240;
  map.getPane('terrainPane').style.pointerEvents = 'none';
  const terrain = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
    pane: 'terrainPane', maxNativeZoom: 12, maxZoom: 19, opacity: .30, className: 'terrain-tiles', attribution: 'Terrain &copy; Esri et al.'
  }).addTo(map);

  function rad(d) { return d * Math.PI / 180; }
  function hav(a, b) {
    const R = 6371, dla = rad(b.lat - a.lat), dlo = rad(b.lng - a.lng), la1 = rad(a.lat), la2 = rad(b.lat);
    const h = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function pathFor(person, i) {
    const E = person.events;
    if (!E[i + 1]) return [{ lat: E[i].lat, lng: E[i].lng }];
    return [
      { lat: E[i].lat, lng: E[i].lng },
      ...((E[i + 1].routeFromPrevious || []).map(x => ({ lat: +x[0], lng: +x[1] }))),
      { lat: E[i + 1].lat, lng: E[i + 1].lng }
    ];
  }
  function pathDistance(path) { return path.slice(1).reduce((sum, x, i) => sum + hav(path[i], x), 0); }
  function pointAt(path, f) {
    if (path.length < 2 || f <= 0) return { ...path[0], edge: 0 };
    if (f >= 1) return { ...path.at(-1), edge: path.length - 2 };
    const total = pathDistance(path), target = total * f;
    if (!total) return { ...path.at(-1), edge: path.length - 2 };
    let walked = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = hav(path[i], path[i + 1]);
      if (walked + d >= target) {
        const q = d ? (target - walked) / d : 1;
        return { lat: path[i].lat + (path[i + 1].lat - path[i].lat) * q, lng: path[i].lng + (path[i + 1].lng - path[i].lng) * q, edge: i };
      }
      walked += d;
    }
    return { ...path.at(-1), edge: path.length - 2 };
  }
  function partialPath(path, f) {
    if (f <= 0) return [path[0]];
    if (f >= 1) return path;
    const p = pointAt(path, f);
    return [...path.slice(0, p.edge + 1), { lat: p.lat, lng: p.lng }];
  }
  function fullPath(person) {
    const E = person.events, out = [{ lat: E[0].lat, lng: E[0].lng }];
    for (let i = 0; i < E.length - 1; i++) out.push(...pathFor(person, i).slice(1));
    return out;
  }
  function appendPath(out, p) { out.push(...(out.length ? p.slice(1) : p)); }

  function stateAtTime(person, t) {
    const E = person.events, ls = lifeStart(person), le = lifeEnd(person), cs = coverageStart(person), ce = coverageEnd(person);
    if (t < ls) return { status: 'before', lat: null, lng: null, eventIndex: -1 };
    if (t > le) return { status: 'after', lat: null, lng: null, eventIndex: E.length - 1 };
    if (t < cs) return { status: 'unknown', lat: null, lng: null, eventIndex: -1 };
    for (let i = 0; i < E.length - 1; i++) {
      const next = E[i + 1], ts = travelStart(next), te = travelEnd(next), nt = eventTime(next);
      if (t < ts) return { status: 'stay', eventIndex: i, lat: E[i].lat, lng: E[i].lng };
      if (te > ts && t < te) {
        const f = clamp((t - ts) / (te - ts), 0, 1), p = pointAt(pathFor(person, i), f);
        return { status: 'travel', eventIndex: i, nextIndex: i + 1, segmentIndex: i, local: f, lat: p.lat, lng: p.lng };
      }
      if (t < nt) return { status: 'stay', eventIndex: i + 1, lat: next.lat, lng: next.lng };
    }
    if (t > ce && t <= le) return { status: 'unknown', lat: null, lng: null, eventIndex: E.length - 1 };
    const last = E.length - 1;
    return { status: 'stay', eventIndex: last, lat: E[last].lat, lng: E[last].lng };
  }

  function travelledPath(person, t) {
    const E = person.events, out = [];
    if (t < coverageStart(person)) return out;
    for (let i = 0; i < E.length - 1; i++) {
      const next = E[i + 1], ts = travelStart(next), te = travelEnd(next), nt = eventTime(next), p = pathFor(person, i);
      if (t >= Math.max(te, nt)) { appendPath(out, p); continue; }
      if (te > ts && t >= ts && t < te) appendPath(out, partialPath(p, (t - ts) / (te - ts)));
      break;
    }
    return out;
  }

  function formatInteger(n, compact = false) {
    const abs = Math.abs(Math.round(n));
    if (compact && abs >= 10000) return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(abs);
    return new Intl.NumberFormat('zh-CN').format(abs);
  }
  function formatAxisYear(t) {
    const y = Math.round(t);
    if (y < 0) return `前${formatInteger(y, true)}`;
    if (y === 0) return '纪元';
    return formatInteger(y, true);
  }
  function formatTime(t) {
    const span = state.end - state.start;
    if (t < 0 || span > 300 || Math.abs(t) >= 10000) {
      const y = Math.round(t);
      if (y < 0) return `公元前 ${formatInteger(y)} 年`;
      if (y === 0) return '公元前 / 公元交界';
      return `${formatInteger(y)} 年`;
    }
    const y = Math.floor(t), frac = clamp(t - y, 0, .999999), month = Math.floor(frac * 12) + 1;
    return `${y} 年 ${month} 月`;
  }
  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    const exp = Math.floor(Math.log10(raw)), base = 10 ** exp, f = raw / base;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nice * base;
  }
  function playbackRate() {
    const span = Math.max(0.001, state.end - state.start);
    return span <= 150 ? 1 : niceStep(span / 60);
  }
  function formatRate(rate) {
    if (rate >= 1) return `${formatInteger(rate, true)} 年/秒`;
    const months = Math.max(1, Math.round(rate * 12));
    return `${months} 个月/秒`;
  }

  function timeToPct(t) { return 100 * clamp((t - state.start) / (state.end - state.start || 1), 0, 1); }
  function pctToTime(p) { return state.start + (state.end - state.start) * p; }

  function commonDomain() {
    const arr = [...selected].map(id => PEOPLE[id]);
    return { start: Math.max(...arr.map(lifeStart)), end: Math.min(...arr.map(lifeEnd)) };
  }
  function updateCommonAvailability() {
    const btn = document.querySelector('[data-range-mode="common"]');
    if (!btn || !selected.size) return;
    const c = commonDomain(), ok = c.end > c.start;
    btn.disabled = !ok;
    btn.title = ok ? '只显示所选对象共同存在的年代' : '所选对象没有共同存在的年代';
    if (!ok && state.rangeMode === 'common') state.rangeMode = 'union';
    document.querySelectorAll('[data-range-mode]').forEach(b => b.classList.toggle('active', b.dataset.rangeMode === state.rangeMode));
  }
  function calculateDomain(preserveTime = true) {
    const arr = [...selected].map(id => PEOPLE[id]);
    if (!arr.length) return;
    const old = state.time;
    updateCommonAvailability();
    if (state.rangeMode === 'common') {
      const c = commonDomain(); state.start = c.start; state.end = c.end;
    } else {
      state.start = Math.min(...arr.map(lifeStart));
      state.end = Math.max(...arr.map(lifeEnd));
    }
    state.time = preserveTime ? clamp(Number.isFinite(old) ? old : state.start, state.start, state.end) : state.start;
    $('clockNote').textContent = `共享历史时钟 · 1× = ${formatRate(playbackRate())}`;
  }

  function markerOffset(index) {
    if (index === 0) return [0, 0];
    const ring = 8, slot = (index - 1) % ring, r = 8 + 4 * Math.floor((index - 1) / ring), a = slot / ring * Math.PI * 2;
    return [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)];
  }

  function ensureLayers() {
    ids.forEach((id, index) => {
      if (layers.has(id)) return;
      const m = META[id], person = PEOPLE[id];
      const future = L.polyline(fullPath(person).map(p => [p.lat, p.lng]), { color: m.color, opacity: .14, weight: 3, dashArray: '5 8', lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const past = L.polyline([], { color: m.color, opacity: .84, weight: 4.5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const [ox, oy] = markerOffset(index);
      const icon = L.divIcon({
        className: 'compare-marker',
        html: `<div class="compare-marker-core" style="--person-color:${m.color};--marker-offset-x:${ox}px;--marker-offset-y:${oy}px">${m.char}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      const marker = L.marker([person.events[0].lat, person.events[0].lng], { icon, zIndexOffset: 800 + index }).addTo(map);
      marker.bindTooltip(m.label, { direction: 'top', offset: [0, -15], className: 'compare-tooltip' });
      layers.set(id, { future, past, marker });
    });
  }

  function updateLayerVisibility() {
    ids.forEach(id => {
      const Ls = layers.get(id), on = selected.has(id);
      [Ls.future, Ls.past, Ls.marker].forEach(layer => {
        if (on) { if (!map.hasLayer(layer)) layer.addTo(map); }
        else if (map.hasLayer(layer)) map.removeLayer(layer);
      });
    });
  }

  function buildPersonPicks() {
    const wrap = $('peoplePicks'); wrap.innerHTML = '';
    ids.forEach(id => {
      const m = META[id], person = PEOPLE[id], label = document.createElement('label');
      label.className = 'person-pick'; label.dataset.label = `${m.label} ${person.period || ''}`; label.style.setProperty('--person-color', m.color);
      label.innerHTML = `<input type="checkbox" data-person="${id}" ${selected.has(id) ? 'checked' : ''}><span class="person-swatch"></span><span>${m.label}</span><small>${person.period || ''}</small>`;
      wrap.appendChild(label);
    });
    wrap.addEventListener('change', e => {
      const input = e.target.closest('[data-person]'); if (!input) return;
      if (input.checked) selected.add(input.dataset.person); else selected.delete(input.dataset.person);
      if (!selected.size) { input.checked = true; selected.add(input.dataset.person); return; }
      rebuild();
    });
    $('peopleSearch')?.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      wrap.querySelectorAll('.person-pick').forEach(label => { label.hidden = q && !label.dataset.label.toLowerCase().includes(q); });
    });
    $('selectAllBtn')?.addEventListener('click', () => {
      ids.forEach(id => selected.add(id));
      wrap.querySelectorAll('[data-person]').forEach(x => x.checked = true);
      rebuild();
    });
  }

  function fitSelected() {
    const pts = [];
    selected.forEach(id => fullPath(PEOPLE[id]).forEach(p => pts.push([p.lat, p.lng])));
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [45, 45], maxZoom: 5.6 });
  }
  function drawLegend() {
    $('mapLegend').innerHTML = '';
    selected.forEach(id => {
      const m = META[id], el = document.createElement('span'); el.className = 'legend-person'; el.style.setProperty('--person-color', m.color);
      el.innerHTML = `<i></i>${m.label}`; $('mapLegend').appendChild(el);
    });
  }
  function drawRuler() {
    const ruler = $('ruler'); ruler.innerHTML = '';
    const span = Math.max(1e-9, state.end - state.start), step = niceStep(span / 8), first = Math.ceil(state.start / step) * step;
    let count = 0;
    for (let y = first; y <= state.end + step * .001 && count < 30; y += step, count++) {
      const tick = document.createElement('div'); tick.className = 'ruler-tick'; tick.style.left = `${timeToPct(y)}%`;
      tick.innerHTML = `<span>${formatAxisYear(y)}</span>`; ruler.appendChild(tick);
    }
  }
  function addBar(track, cls, a, b, title = '') {
    const x0 = Math.max(a, state.start), x1 = Math.min(b, state.end); if (!(x1 > x0)) return;
    const el = document.createElement('div'); el.className = cls; el.style.left = `${timeToPct(x0)}%`; el.style.width = `${Math.max(.12, timeToPct(x1) - timeToPct(x0))}%`; if (title) el.title = title; track.appendChild(el);
  }
  function drawTracks() {
    const wrap = $('tracksWrap'); wrap.innerHTML = '';
    selected.forEach(id => {
      const person = PEOPLE[id], m = META[id], E = person.events;
      const row = document.createElement('div'); row.className = 'track-row'; row.dataset.person = id; row.style.setProperty('--person-color', m.color);
      row.innerHTML = `<div class="track-label"><span class="track-letter">${m.char}</span><span class="track-label-text"><strong>${m.label}</strong><span>${person.period || ''}</span></span></div><div class="track"><div class="life-window"></div><div class="track-now"></div></div><div class="track-status"></div>`;
      const track = row.querySelector('.track'), life = row.querySelector('.life-window');
      const l0 = Math.max(lifeStart(person), state.start), l1 = Math.min(lifeEnd(person), state.end);
      life.style.left = `${timeToPct(l0)}%`; life.style.width = `${Math.max(0, timeToPct(l1) - timeToPct(l0))}%`;
      addBar(track, 'unknown-seg', lifeStart(person), coverageStart(person), '人物已在世，但当前数据尚无可靠位置');
      for (let i = 0; i < E.length - 1; i++) {
        const a = E[i], b = E[i + 1], aT = eventTime(a), ts = travelStart(b), te = travelEnd(b);
        addBar(track, 'stay-seg', aT, ts, a.mapLabel || a.title);
        if (te > ts) addBar(track, 'travel-seg', ts, te, `${a.mapLabel || a.title} → ${b.mapLabel || b.title}`);
      }
      addBar(track, 'unknown-seg', coverageEnd(person), lifeEnd(person), '人物仍在世，但当前数据已无可靠位置');
      E.forEach(e => {
        const t = eventTime(e); if (t < state.start || t > state.end) return;
        const dot = document.createElement('div'); dot.className = 'event-dot'; dot.style.left = `${timeToPct(t)}%`; dot.title = `${e.dateLabel || formatTime(t)} · ${e.title}`; track.appendChild(dot);
      });
      wrap.appendChild(row);
    });
  }

  function statusText(person, st) {
    if (st.status === 'before') return { place: '尚未出生', phase: '' };
    if (st.status === 'after') return { place: '已去世', phase: '' };
    if (st.status === 'unknown') return { place: '位置资料未覆盖', phase: '人物处于生存年代，但当前数据没有足够可靠的地理节点' };
    const E = person.events;
    if (st.status === 'travel') {
      const a = E[st.segmentIndex], b = E[st.nextIndex];
      return { place: '途中', phase: `${a.mapLabel || a.title} → ${b.mapLabel || b.title}${b.travelPrecision ? ` · ${b.travelPrecision}` : ''}` };
    }
    const e = E[st.eventIndex]; return { place: e.mapLabel || e.place || e.title, phase: e.title };
  }
  function renderStatuses(personStates) {
    const list = $('personStatusList'); list.innerHTML = '';
    selected.forEach(id => {
      const person = PEOPLE[id], m = META[id], st = personStates[id], tx = statusText(person, st);
      const card = document.createElement('div'); card.className = `status-card ${['before','after','unknown'].includes(st.status) ? 'offstage' : ''}`; card.style.setProperty('--person-color', m.color);
      const tag = st.status === 'travel' ? '旅行中' : st.status === 'stay' ? '驻留' : st.status === 'unknown' ? '位置未知' : '';
      card.innerHTML = `<div class="status-card-head"><strong>${m.label}</strong><span>${tag}</span></div><div class="status-place">${tx.place}</div><div class="status-phase">${tx.phase}</div>`;
      list.appendChild(card);
    });
  }
  function renderOverlap(personStates) {
    const active = [...selected].filter(id => ['stay', 'travel'].includes(personStates[id].status));
    const hits = [];
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j], sa = personStates[a], sb = personStates[b], d = hav(sa, sb);
      if (d <= 55) hits.push(`<div class="hit"><strong>${META[a].label} × ${META[b].label}</strong><br>${d <= 20 ? '同城/近郊' : '同一区域'} · 约 ${Math.round(d)} km</div>`);
    }
    $('overlapList').innerHTML = hits.length ? hits.join('') : '当前没有检测到所选对象在同一地区。';
  }
  function render() {
    if (!selected.size) return;
    const t = state.time, personStates = {};
    selected.forEach(id => {
      const person = PEOPLE[id], st = stateAtTime(person, t), Ls = layers.get(id); personStates[id] = st;
      Ls.past.setLatLngs(travelledPath(person, t).map(p => [p.lat, p.lng]));
      if (st.lat == null) { if (map.hasLayer(Ls.marker)) map.removeLayer(Ls.marker); }
      else { if (!map.hasLayer(Ls.marker)) Ls.marker.addTo(map); Ls.marker.setLatLng([st.lat, st.lng]); }
    });
    ids.filter(id => !selected.has(id)).forEach(id => { const Ls = layers.get(id); if (map.hasLayer(Ls.marker)) map.removeLayer(Ls.marker); });
    const frac = clamp((t - state.start) / (state.end - state.start || 1), 0, 1);
    $('masterRange').value = Math.round(frac * 10000);
    const ft = formatTime(t); $('clockText').textContent = ft; $('mapTime').textContent = ft; $('statusTime').textContent = ft;
    document.querySelectorAll('.track-row').forEach(row => {
      const id = row.dataset.person, st = personStates[id], tx = statusText(PEOPLE[id], st), now = row.querySelector('.track-now');
      now.style.left = `${frac * 100}%`;
      row.querySelector('.track-status').innerHTML = `<strong>${tx.place}</strong>${tx.phase && tx.place !== tx.phase ? ` · ${tx.phase}` : ''}`;
    });
    renderStatuses(personStates); renderOverlap(personStates);
  }
  function setPlaying(v) {
    state.playing = v; $('playBtn').textContent = v ? '❚❚' : '▶';
    if (v) { if (state.time >= state.end) state.time = state.start; state.last = performance.now(); cancelAnimationFrame(state.raf); state.raf = requestAnimationFrame(tick); }
    else cancelAnimationFrame(state.raf);
  }
  function tick(now) {
    if (!state.playing) return;
    const dt = Math.min((now - state.last) / 1000, .12); state.last = now;
    state.time = clamp(state.time + dt * state.speed * playbackRate(), state.start, state.end); render();
    if (state.time >= state.end) setPlaying(false); else state.raf = requestAnimationFrame(tick);
  }
  function rebuild() {
    setPlaying(false); calculateDomain(true); ensureLayers(); updateLayerVisibility(); drawLegend(); drawRuler(); drawTracks(); render(); fitSelected();
  }

  if (!ids.length) {
    $('peoplePicks').textContent = '没有找到可比较的绝对年代行迹数据。';
    return;
  }
  buildPersonPicks(); ensureLayers(); calculateDomain(false); updateLayerVisibility(); drawLegend(); drawRuler(); drawTracks(); render(); setTimeout(fitSelected, 80);

  document.querySelectorAll('[data-range-mode]').forEach(b => b.addEventListener('click', () => {
    if (b.disabled) return;
    state.rangeMode = b.dataset.rangeMode; document.querySelectorAll('[data-range-mode]').forEach(x => x.classList.toggle('active', x === b)); rebuild();
  }));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
    state.speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('active', x === b));
  }));
  $('masterRange').addEventListener('input', e => { setPlaying(false); state.time = pctToTime(+e.target.value / 10000); render(); });
  $('playBtn').addEventListener('click', () => setPlaying(!state.playing));
  $('fitBtn').addEventListener('click', fitSelected);
  $('terrainToggle').addEventListener('change', e => e.target.checked ? terrain.addTo(map) : map.removeLayer(terrain));
  $('terrainOpacity').addEventListener('input', e => { terrain.setOpacity(+e.target.value / 100); $('terrainValue').textContent = `${e.target.value}%`; });
})();
