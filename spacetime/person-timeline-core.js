(() => {
  'use strict';

  const D = window.SPACETIME_PERSON;
  const E = D.events;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eventTime = e => Number(e.time ?? e.year);
  const travelStart = e => Number(e.travelStart ?? eventTime(e));
  const travelEnd = e => Number(e.travelEnd ?? eventTime(e));
  const START = eventTime(E[0]);
  const END = eventTime(E[E.length - 1]);

  const S = { p: 0, play: false, speed: 1, follow: true, active: -1, raf: 0, last: 0, dots: [], markers: [] };

  $('personName').textContent = D.name || '人物行迹';
  $('personPeriod').textContent = D.period || '';
  $('personSubtitle').textContent = D.subtitle || '';
  document.title = `${D.name || '人物行迹'} · Spacetime Trails`;
  if ($('timelineHintText')) $('timelineHintText').textContent = D.timelineHint;
  $('startYear').textContent = Math.floor(START);
  $('endYear').textContent = Math.floor(END);

  const map = L.map('map', { zoomControl: true, preferCanvas: true, minZoom: 3, maxZoom: 11 }).setView([32, 113], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  map.createPane('terrainPane');
  map.getPane('terrainPane').style.zIndex = 240;
  map.getPane('terrainPane').style.pointerEvents = 'none';
  const terrain = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
    pane: 'terrainPane', maxNativeZoom: 12, maxZoom: 19, opacity: .34, className: 'terrain-tiles', attribution: 'Terrain &copy; Esri et al.'
  }).addTo(map);

  const future = L.polyline([], { color: '#777268', opacity: .42, weight: 3, dashArray: '7 9', lineCap: 'round', lineJoin: 'round' }).addTo(map);
  const past = L.polyline([], { color: '#b62826', opacity: .94, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
  const current = L.polyline([], { color: '#e44a43', opacity: 1, weight: 6, lineCap: 'round', lineJoin: 'round' }).addTo(map);

  const markerChar = (D.shortName || D.name || '人').trim().slice(0, 1);
  const icon = L.divIcon({ className: 'person-marker', html: `<div class="person-core" style="--marker-char:'${markerChar}'"></div>`, iconSize: [28, 28], iconAnchor: [14, 26] });
  const person = L.marker([E[0].lat, E[0].lng], { icon, zIndexOffset: 900 }).addTo(map);

  const rad = d => d * Math.PI / 180;
  const hav = (a, b) => {
    const R = 6371, dla = rad(b.lat - a.lat), dlo = rad(b.lng - a.lng), la1 = rad(a.lat), la2 = rad(b.lat);
    const h = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const path = i => {
    if (!E[i + 1]) return [{ lat: E[i].lat, lng: E[i].lng }];
    return [{ lat: E[i].lat, lng: E[i].lng }, ...((E[i + 1].routeFromPrevious || []).map(x => ({ lat: +x[0], lng: +x[1] }))), { lat: E[i + 1].lat, lng: E[i + 1].lng }];
  };
  const pathDistance = p => p.slice(1).reduce((sum, x, i) => sum + hav(p[i], x), 0);
  const pointAt = (p, f) => {
    if (f <= 0 || p.length < 2) return { ...p[0], edge: 0, edgeFraction: 0 };
    if (f >= 1) return { ...p[p.length - 1], edge: p.length - 2, edgeFraction: 1 };
    const target = pathDistance(p) * f;
    let walked = 0;
    for (let i = 0; i < p.length - 1; i++) {
      const d = hav(p[i], p[i + 1]);
      if (walked + d >= target) {
        const q = d ? (target - walked) / d : 1;
        return { lat: p[i].lat + (p[i + 1].lat - p[i].lat) * q, lng: p[i].lng + (p[i + 1].lng - p[i].lng) * q, edge: i, edgeFraction: q };
      }
      walked += d;
    }
    return { ...p[p.length - 1], edge: p.length - 2, edgeFraction: 1 };
  };
  const splitPath = (p, f) => {
    const x = pointAt(p, f), c = { lat: x.lat, lng: x.lng };
    return { before: [...p.slice(0, x.edge + 1), c], after: [c, ...p.slice(x.edge + 1)] };
  };
  const appendPath = (out, p) => out.push(...(out.length ? p.slice(1) : p));
  const full = () => {
    const r = [{ lat: E[0].lat, lng: E[0].lng }];
    for (let i = 0; i < E.length - 1; i++) r.push(...path(i).slice(1));
    return r;
  };

  const timeFromProgress = p => START + (END - START) * p;
  const progressFromTime = t => clamp((t - START) / (END - START), 0, 1);
  const timelinePos = i => progressFromTime(eventTime(E[i]));

  function formatTimelineTime(t) {
    const y = Math.floor(t);
    const frac = clamp(t - y, 0, .999999);
    const month = Math.min(12, Math.floor(frac * 12) + 1);
    return `${y} 年 ${month} 月`;
  }

  function latestEventIndex(t) {
    let n = 0;
    E.forEach((e, i) => { if (eventTime(e) <= t + 1e-9) n = i; });
    return n;
  }

  function stateAtTime(t) {
    if (t <= START) return { status: 'stay', eventIndex: 0, lat: E[0].lat, lng: E[0].lng };
    for (let i = 0; i < E.length - 1; i++) {
      const next = E[i + 1];
      const ts = travelStart(next), te = travelEnd(next);
      if (t < ts) return { status: 'stay', eventIndex: i, lat: E[i].lat, lng: E[i].lng };
      if (te > ts && t < te) {
        const f = clamp((t - ts) / (te - ts), 0, 1);
        const x = pointAt(path(i), f);
        return { status: 'travel', eventIndex: i, segmentIndex: i, local: f, lat: x.lat, lng: x.lng, nextIndex: i + 1 };
      }
      if (t < eventTime(next)) return { status: 'stay', eventIndex: i + 1, lat: next.lat, lng: next.lng };
    }
    const last = E.length - 1;
    return { status: 'stay', eventIndex: last, lat: E[last].lat, lng: E[last].lng };
  }

  function panel(i) {
    const e = E[i];
    S.active = i;
    $('eventIndex').textContent = `${String(i + 1).padStart(2, '0')} / ${E.length}`;
    $('eventYear').textContent = e.dateLabel || e.year;
    $('eventTitle').textContent = e.title;
    $('eventPlace').textContent = e.place;
    $('eventSummary').textContent = e.summary;
    $('eventSource').textContent = e.source;
    $('eventTags').innerHTML = '';
    (e.tags || []).forEach(t => { const s = document.createElement('span'); s.className = 'event-tag'; s.textContent = t; $('eventTags').appendChild(s); });
    $('prevEventBtn').disabled = i === 0;
    $('nextEventBtn').disabled = i === E.length - 1;
  }

  function drawMarkers() {
    E.forEach((e, i) => {
      const ic = L.divIcon({ className: 'custom-event-marker', html: '<div class="marker-core"></div>', iconSize: [15, 15], iconAnchor: [7, 7] });
      const m = L.marker([e.lat, e.lng], { icon: ic, zIndexOffset: 100 + i }).addTo(map).bindTooltip(e.mapLabel || e.title, { direction: 'top', offset: [0, -8], className: 'event-label' });
      m.on('click', () => jump(i, true));
      S.markers.push(m);
    });
  }

  function drawTimeline() {
    $('timelineEvents').innerHTML = '';
    E.forEach((e, i) => {
      const b = document.createElement('button');
      b.className = 'timeline-event';
      b.style.left = `${timelinePos(i) * 100}%`;
      b.title = `${e.dateLabel || e.year} · ${e.title}`;
      b.onclick = () => jump(i, true);
      $('timelineEvents').appendChild(b);
    });
  }

  function drawDots() {
    const spacing = D.routeDotSpacingKm || 70;
    for (let i = 0; i < E.length - 1; i++) {
      const p = path(i), d = pathDistance(p), next = E[i + 1];
      if (d < spacing * .75) continue;
      const ts = travelStart(next), te = travelEnd(next);
      for (let km = spacing; km < d - spacing * .2; km += spacing) {
        const f = km / d, x = pointAt(p, f);
        const m = L.circleMarker([x.lat, x.lng], { radius: 2.5, weight: 1, color: '#f2e9dd', fillColor: '#b62826', fillOpacity: .9, interactive: false }).addTo(map);
        m.routeTime = te > ts ? ts + (te - ts) * f : eventTime(next);
        S.dots.push(m);
      }
    }
  }

  function completedPathBeforeSegment(segmentIndex) {
    const out = [];
    for (let i = 0; i < segmentIndex; i++) appendPath(out, path(i));
    return out;
  }

  function render() {
    const t = timeFromProgress(S.p);
    const st = stateAtTime(t);
    const latest = latestEventIndex(t);

    let pastPts = [], currentPts = [], futurePts = [];
    if (st.status === 'travel') {
      pastPts = completedPathBeforeSegment(st.segmentIndex);
      const sp = splitPath(path(st.segmentIndex), st.local);
      currentPts = sp.before;
      futurePts = sp.after;
      for (let i = st.segmentIndex + 1; i < E.length - 1; i++) appendPath(futurePts, path(i));
    } else {
      const completedSegments = Math.min(st.eventIndex, E.length - 1);
      for (let i = 0; i < completedSegments; i++) appendPath(pastPts, path(i));
      for (let i = completedSegments; i < E.length - 1; i++) appendPath(futurePts, path(i));
    }

    past.setLatLngs(pastPts.map(z => [z.lat, z.lng]));
    current.setLatLngs(currentPts.map(z => [z.lat, z.lng]));
    future.setLatLngs(S.p >= 1 ? [] : futurePts.map(z => [z.lat, z.lng]));
    person.setLatLng([st.lat, st.lng]);

    if (latest !== S.active) panel(latest);
    $('timelineProgress').style.width = `${S.p * 100}%`;
    $('timeRange').value = Math.round(S.p * 1000);
    $('clockYear').textContent = formatTimelineTime(t);
    if (st.status === 'travel') {
      const next = E[st.nextIndex];
      const precision = next.travelPrecision ? ` · ${next.travelPrecision}` : '';
      $('clockPhase').textContent = `途中：${E[st.segmentIndex].mapLabel || E[st.segmentIndex].title} → ${next.mapLabel || next.title}${precision}`;
      $('currentPlace').textContent = '途中';
    } else {
      $('clockPhase').textContent = E[st.eventIndex].title;
      $('currentPlace').textContent = E[st.eventIndex].mapLabel || E[st.eventIndex].title;
    }

    let distance = 0;
    if (st.status === 'travel') {
      for (let i = 0; i < st.segmentIndex; i++) distance += pathDistance(path(i));
      distance += pathDistance(path(st.segmentIndex)) * st.local;
    } else {
      for (let i = 0; i < st.eventIndex; i++) distance += pathDistance(path(i));
    }
    $('distanceText').textContent = `${Math.round(distance).toLocaleString('zh-CN')} km`;

    S.dots.forEach(m => {
      const passed = m.routeTime <= t + 1e-9;
      m.setStyle({ fillColor: passed ? '#b62826' : '#8b887f', fillOpacity: passed ? .96 : .38, opacity: passed ? .9 : .35 });
    });
    S.markers.forEach((m, n) => {
      const el = m.getElement();
      if (el) { el.classList.toggle('passed', eventTime(E[n]) <= t + 1e-9); el.classList.toggle('active', n === latest); }
    });
    [...$('timelineEvents').children].forEach((n, k) => { n.classList.toggle('passed', timelinePos(k) <= S.p + 1e-9); n.classList.toggle('active', k === latest); });

    if (S.follow && S.play && map.distance(map.getCenter(), [st.lat, st.lng]) > 280000) map.panTo([st.lat, st.lng], { animate: true, duration: .6 });
  }

  function jump(i, pan) {
    S.p = timelinePos(i);
    panel(i);
    render();
    if (pan) map.flyTo([E[i].lat, E[i].lng], Math.max(map.getZoom(), 5), { duration: .7 });
  }

  function setPlaying(v) {
    S.play = v;
    $('playBtn').textContent = v ? '❚❚' : '▶';
    if (v) {
      if (S.p >= 1) S.p = 0;
      S.last = performance.now();
      cancelAnimationFrame(S.raf);
      S.raf = requestAnimationFrame(tick);
    } else cancelAnimationFrame(S.raf);
  }

  function tick(now) {
    if (!S.play) return;
    const dt = Math.min((now - S.last) / 1000, .1);
    S.last = now;
    const baseDuration = END - START;
    S.p = clamp(S.p + dt * S.speed / baseDuration, 0, 1);
    render();
    if (S.p >= 1) setPlaying(false); else S.raf = requestAnimationFrame(tick);
  }

  $('playBtn').onclick = () => setPlaying(!S.play);
  $('timeRange').oninput = e => { setPlaying(false); S.p = +e.target.value / 1000; render(); };
  $('prevEventBtn').onclick = () => jump(Math.max(0, S.active - 1), true);
  $('nextEventBtn').onclick = () => jump(Math.min(E.length - 1, S.active + 1), true);
  $('fitRouteBtn').onclick = () => map.fitBounds(L.latLngBounds(full().map(x => [x.lat, x.lng])), { padding: [45, 45], maxZoom: 5.5 });
  $('followBtn').onclick = () => { S.follow = !S.follow; $('followBtn').textContent = `跟随：${S.follow ? '开' : '关'}`; };
  $('terrainToggle').onchange = e => e.target.checked ? terrain.addTo(map) : map.removeLayer(terrain);
  $('terrainOpacity').oninput = e => { terrain.setOpacity(+e.target.value / 100); $('terrainOpacityValue').textContent = e.target.value + '%'; };
  document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { S.speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('active', x === b)); });

  drawMarkers();
  drawTimeline();
  drawDots();
  panel(0);
  render();
  setTimeout(() => $('fitRouteBtn').click(), 80);
})();