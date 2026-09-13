(() => {
  'use strict';

  const PEOPLE = window.COMPARE_PEOPLE || {};
  const META = {
    sudongpo: { color: '#b64335', label: '苏东坡', char: '苏', offset: [-8, -3] },
    wanganshi: { color: '#276a8f', label: '王安石', char: '王', offset: [8, -3] },
    simaguang: { color: '#745188', label: '司马光', char: '司', offset: [0, 8] }
  };

  const ids = ['sudongpo', 'wanganshi', 'simaguang'].filter(id => PEOPLE[id]);
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eventTime = e => Number(e.time ?? e.year);
  const travelStart = e => Number(e.travelStart ?? eventTime(e));
  const travelEnd = e => Number(e.travelEnd ?? eventTime(e));
  const selected = new Set(ids);
  const layers = new Map();

  const state = {
    rangeMode: 'union',
    start: 0,
    end: 1,
    time: 0,
    playing: false,
    speed: 1,
    raf: 0,
    last: 0
  };

  const map = L.map('compareMap', { zoomControl: true, preferCanvas: true, minZoom: 3, maxZoom: 11 }).setView([32, 114], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
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
    return [{ lat: E[i].lat, lng: E[i].lng }, ...((E[i + 1].routeFromPrevious || []).map(x => ({ lat: +x[0], lng: +x[1] }))), { lat: E[i + 1].lat, lng: E[i + 1].lng }];
  }
  function pathDistance(path) { return path.slice(1).reduce((sum, x, i) => sum + hav(path[i], x), 0); }
  function pointAt(path, f) {
    if (path.length < 2 || f <= 0) return { ...path[0], edge: 0 };
    if (f >= 1) return { ...path[path.length - 1], edge: path.length - 2 };
    const total = pathDistance(path), target = total * f;
    if (!total) return { ...path[path.length - 1], edge: path.length - 2 };
    let walked = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = hav(path[i], path[i + 1]);
      if (walked + d >= target) {
        const q = d ? (target - walked) / d : 1;
        return { lat: path[i].lat + (path[i + 1].lat - path[i].lat) * q, lng: path[i].lng + (path[i + 1].lng - path[i].lng) * q, edge: i };
      }
      walked += d;
    }
    return { ...path[path.length - 1], edge: path.length - 2 };
  }
  function partialPath(path, f) {
    if (f <= 0) return [path[0]];
    if (f >= 1) return path;
    const p = pointAt(path, f);
    return [...path.slice(0, p.edge + 1), { lat: p.lat, lng: p.lng }];
  }
  function fullPath(person) {
    const E = person.events;
    const out = [{ lat: E[0].lat, lng: E[0].lng }];
    for (let i = 0; i < E.length - 1; i++) out.push(...pathFor(person, i).slice(1));
    return out;
  }
  function appendPath(out, p) { out.push(...(out.length ? p.slice(1) : p)); }

  function lifeStart(person) { return eventTime(person.events[0]); }
  function lifeEnd(person) { return eventTime(person.events[person.events.length - 1]); }

  function stateAtTime(person, t) {
    const E = person.events;
    const start = lifeStart(person), end = lifeEnd(person);
    if (t < start) return { status: 'before', lat: null, lng: null, eventIndex: -1 };
    if (t > end) return { status: 'after', lat: null, lng: null, eventIndex: E.length - 1 };
    for (let i = 0; i < E.length - 1; i++) {
      const next = E[i + 1], ts = travelStart(next), te = travelEnd(next), nt = eventTime(next);
      if (t < ts) return { status: 'stay', eventIndex: i, lat: E[i].lat, lng: E[i].lng };
      if (te > ts && t < te) {
        const f = clamp((t - ts) / (te - ts), 0, 1), p = pointAt(pathFor(person, i), f);
        return { status: 'travel', eventIndex: i, nextIndex: i + 1, segmentIndex: i, local: f, lat: p.lat, lng: p.lng };
      }
      if (t < nt) return { status: 'stay', eventIndex: i + 1, lat: next.lat, lng: next.lng };
    }
    const last = E.length - 1;
    return { status: 'stay', eventIndex: last, lat: E[last].lat, lng: E[last].lng };
  }

  function travelledPath(person, t) {
    const E = person.events, out = [];
    if (t < lifeStart(person)) return out;
    for (let i = 0; i < E.length - 1; i++) {
      const next = E[i + 1], ts = travelStart(next), te = travelEnd(next), nt = eventTime(next), p = pathFor(person, i);
      if (t >= Math.max(te, nt)) {
        appendPath(out, p);
        continue;
      }
      if (te > ts && t >= ts && t < te) {
        appendPath(out, partialPath(p, (t - ts) / (te - ts)));
      }
      break;
    }
    return out;
  }

  function timeToPct(t) { return 100 * clamp((t - state.start) / (state.end - state.start || 1), 0, 1); }
  function pctToTime(p) { return state.start + (state.end - state.start) * p; }
  function formatTime(t) {
    const y = Math.floor(t), frac = clamp(t - y, 0, .999999), month = Math.floor(frac * 12) + 1;
    return `${y} 年 ${month} 月`;
  }

  function buildPersonPicks() {
    $('peoplePicks').innerHTML = '';
    ids.forEach(id => {
      const m = META[id], label = document.createElement('label');
      label.className = 'person-pick';
      label.style.setProperty('--person-color', m.color);
      label.innerHTML = `<input type="checkbox" data-person="${id}" checked><span class="person-swatch"></span><span>${m.label}</span>`;
      $('peoplePicks').appendChild(label);
    });
    $('peoplePicks').addEventListener('change', e => {
      const input = e.target.closest('[data-person]');
      if (!input) return;
      if (input.checked) selected.add(input.dataset.person); else selected.delete(input.dataset.person);
      if (!selected.size) { input.checked = true; selected.add(input.dataset.person); return; }
      rebuild();
    });
  }

  function calculateDomain(preserveTime = true) {
    const arr = [...selected].map(id => PEOPLE[id]);
    const old = state.time;
    if (state.rangeMode === 'common') {
      state.start = Math.max(...arr.map(lifeStart));
      state.end = Math.min(...arr.map(lifeEnd));
      if (state.end <= state.start) {
        state.rangeMode = 'union';
        document.querySelectorAll('[data-range-mode]').forEach(b => b.classList.toggle('active', b.dataset.rangeMode === 'union'));
        state.start = Math.min(...arr.map(lifeStart));
        state.end = Math.max(...arr.map(lifeEnd));
      }
    } else {
      state.start = Math.min(...arr.map(lifeStart));
      state.end = Math.max(...arr.map(lifeEnd));
    }
    state.time = preserveTime ? clamp(old || state.start, state.start, state.end) : state.start;
  }

  function ensureLayers() {
    ids.forEach(id => {
      if (layers.has(id)) return;
      const m = META[id], person = PEOPLE[id];
      const future = L.polyline(fullPath(person).map(p => [p.lat, p.lng]), { color: m.color, opacity: .16, weight: 3, dashArray: '5 8', lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const past = L.polyline([], { color: m.color, opacity: .82, weight: 4.5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const [ox, oy] = m.offset;
      const icon = L.divIcon({
        className: 'compare-marker',
        html: `<div class="compare-marker-core" style="--person-color:${m.color};--marker-offset-x:${ox}px;--marker-offset-y:${oy}px">${m.char}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      const marker = L.marker([person.events[0].lat, person.events[0].lng], { icon, zIndexOffset: 800 }).addTo(map);
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

  function fitSelected() {
    const pts = [];
    selected.forEach(id => fullPath(PEOPLE[id]).forEach(p => pts.push([p.lat, p.lng])));
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [45, 45], maxZoom: 5.6 });
  }

  function drawLegend() {
    $('mapLegend').innerHTML = '';
    selected.forEach(id => {
      const m = META[id], el = document.createElement('span');
      el.className = 'legend-person'; el.style.setProperty('--person-color', m.color);
      el.innerHTML = `<i></i>${m.label}`;
      $('mapLegend').appendChild(el);
    });
  }

  function drawRuler() {
    const ruler = $('ruler'); ruler.innerHTML = '';
    const span = state.end - state.start;
    let step = span > 70 ? 10 : span > 35 ? 5 : span > 18 ? 2 : 1;
    const first = Math.ceil(state.start / step) * step;
    for (let y = first; y <= state.end + .001; y += step) {
      const tick = document.createElement('div');
      tick.className = 'ruler-tick'; tick.style.left = `${timeToPct(y)}%`;
      tick.innerHTML = `<span>${Math.round(y)}</span>`; ruler.appendChild(tick);
    }
  }

  function drawTracks() {
    const wrap = $('tracksWrap'); wrap.innerHTML = '';
    selected.forEach(id => {
      const person = PEOPLE[id], m = META[id], E = person.events;
      const row = document.createElement('div');
      row.className = 'track-row'; row.dataset.person = id; row.style.setProperty('--person-color', m.color);
      row.innerHTML = `<div class="track-label"><span class="track-letter">${m.char}</span><span class="track-label-text"><strong>${m.label}</strong><span>${person.period || ''}</span></span></div><div class="track"><div class="life-window"></div><div class="track-now"></div></div><div class="track-status"></div>`;
      const track = row.querySelector('.track'), life = row.querySelector('.life-window');
      const l0 = Math.max(lifeStart(person), state.start), l1 = Math.min(lifeEnd(person), state.end);
      life.style.left = `${timeToPct(l0)}%`; life.style.width = `${Math.max(0, timeToPct(l1) - timeToPct(l0))}%`;
      for (let i = 0; i < E.length - 1; i++) {
        const a = E[i], b = E[i + 1], aT = eventTime(a), bT = eventTime(b), ts = travelStart(b), te = travelEnd(b);
        const stayA = Math.max(aT, state.start), stayB = Math.min(ts, state.end);
        if (stayB > stayA) {
          const el = document.createElement('div'); el.className = 'stay-seg'; el.style.left = `${timeToPct(stayA)}%`; el.style.width = `${timeToPct(stayB) - timeToPct(stayA)}%`; track.appendChild(el);
        }
        const trA = Math.max(ts, state.start), trB = Math.min(Math.max(te, ts), state.end);
        if (te > ts && trB > trA) {
          const el = document.createElement('div'); el.className = 'travel-seg'; el.style.left = `${timeToPct(trA)}%`; el.style.width = `${Math.max(.15, timeToPct(trB) - timeToPct(trA))}%`; el.title = `${a.mapLabel || a.title} → ${b.mapLabel || b.title}`; track.appendChild(el);
        }
        if (te <= ts && bT > aT && bT >= state.start && bT <= state.end) {
          // Unknown-duration move: event dot only, no invented travel bar.
        }
      }
      E.forEach(e => {
        const t = eventTime(e); if (t < state.start || t > state.end) return;
        const dot = document.createElement('div'); dot.className = 'event-dot'; dot.style.left = `${timeToPct(t)}%`; dot.title = `${e.dateLabel || Math.round(t)} · ${e.title}`; track.appendChild(dot);
      });
      wrap.appendChild(row);
    });
  }

  function statusText(person, st) {
    if (st.status === 'before') return { place: '尚未出生', phase: '' };
    if (st.status === 'after') return { place: '已去世', phase: '' };
    const E = person.events;
    if (st.status === 'travel') {
      const a = E[st.segmentIndex], b = E[st.nextIndex];
      return { place: '途中', phase: `${a.mapLabel || a.title} → ${b.mapLabel || b.title}${b.travelPrecision ? ` · ${b.travelPrecision}` : ''}` };
    }
    const e = E[st.eventIndex];
    return { place: e.mapLabel || e.place || e.title, phase: e.title };
  }

  function renderStatuses(personStates) {
    const list = $('personStatusList'); list.innerHTML = '';
    selected.forEach(id => {
      const person = PEOPLE[id], m = META[id], st = personStates[id], tx = statusText(person, st);
      const card = document.createElement('div'); card.className = `status-card ${(st.status === 'before' || st.status === 'after') ? 'offstage' : ''}`; card.style.setProperty('--person-color', m.color);
      card.innerHTML = `<div class="status-card-head"><strong>${m.label}</strong><span>${st.status === 'travel' ? '旅行中' : st.status === 'stay' ? '驻留' : ''}</span></div><div class="status-place">${tx.place}</div><div class="status-phase">${tx.phase}</div>`;
      list.appendChild(card);
    });
  }

  function renderOverlap(personStates) {
    const active = [...selected].filter(id => ['stay', 'travel'].includes(personStates[id].status));
    const hits = [];
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j], sa = personStates[a], sb = personStates[b];
      const d = hav(sa, sb);
      if (d <= 55) {
        const kind = d <= 20 ? '同城/近郊' : '同一区域';
        hits.push(`<div class="hit"><strong>${META[a].label} × ${META[b].label}</strong><br>${kind} · 约 ${Math.round(d)} km</div>`);
      }
    }
    $('overlapList').innerHTML = hits.length ? hits.join('') : '当前没有检测到人物在同一地区。';
  }

  function render() {
    const t = state.time, personStates = {};
    selected.forEach(id => {
      const person = PEOPLE[id], st = stateAtTime(person, t), Ls = layers.get(id); personStates[id] = st;
      Ls.past.setLatLngs(travelledPath(person, t).map(p => [p.lat, p.lng]));
      if (st.lat == null) {
        if (map.hasLayer(Ls.marker)) map.removeLayer(Ls.marker);
      } else {
        if (!map.hasLayer(Ls.marker)) Ls.marker.addTo(map);
        Ls.marker.setLatLng([st.lat, st.lng]);
      }
    });
    ids.filter(id => !selected.has(id)).forEach(id => {
      const Ls = layers.get(id); if (map.hasLayer(Ls.marker)) map.removeLayer(Ls.marker);
    });

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

  function rebuild() {
    setPlaying(false);
    calculateDomain(true); ensureLayers(); updateLayerVisibility(); drawLegend(); drawRuler(); drawTracks(); render(); fitSelected();
  }

  function setPlaying(v) {
    state.playing = v; $('playBtn').textContent = v ? '❚❚' : '▶';
    if (v) { if (state.time >= state.end) state.time = state.start; state.last = performance.now(); cancelAnimationFrame(state.raf); state.raf = requestAnimationFrame(tick); }
    else cancelAnimationFrame(state.raf);
  }
  function tick(now) {
    if (!state.playing) return;
    const dt = Math.min((now - state.last) / 1000, .12); state.last = now;
    state.time = clamp(state.time + dt * state.speed, state.start, state.end); render();
    if (state.time >= state.end) setPlaying(false); else state.raf = requestAnimationFrame(tick);
  }

  buildPersonPicks(); ensureLayers(); calculateDomain(false); updateLayerVisibility(); drawLegend(); drawRuler(); drawTracks(); render(); setTimeout(fitSelected, 80);

  document.querySelectorAll('[data-range-mode]').forEach(b => b.addEventListener('click', () => {
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
