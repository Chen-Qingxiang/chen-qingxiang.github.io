(() => {
  'use strict';

  const els = {
    personName: document.getElementById('personName'),
    personPeriod: document.getElementById('personPeriod'),
    personSubtitle: document.getElementById('personSubtitle'),
    currentPlace: document.getElementById('currentPlace'),
    distanceText: document.getElementById('distanceText'),
    eventIndex: document.getElementById('eventIndex'),
    eventYear: document.getElementById('eventYear'),
    eventTitle: document.getElementById('eventTitle'),
    eventPlace: document.getElementById('eventPlace'),
    eventSummary: document.getElementById('eventSummary'),
    eventTags: document.getElementById('eventTags'),
    eventSource: document.getElementById('eventSource'),
    prevEventBtn: document.getElementById('prevEventBtn'),
    nextEventBtn: document.getElementById('nextEventBtn'),
    playBtn: document.getElementById('playBtn'),
    clockYear: document.getElementById('clockYear'),
    clockPhase: document.getElementById('clockPhase'),
    timeRange: document.getElementById('timeRange'),
    timelineProgress: document.getElementById('timelineProgress'),
    timelineEvents: document.getElementById('timelineEvents'),
    startYear: document.getElementById('startYear'),
    endYear: document.getElementById('endYear'),
    fitRouteBtn: document.getElementById('fitRouteBtn'),
    followBtn: document.getElementById('followBtn'),
    fileInput: document.getElementById('fileInput'),
    speedButtons: [...document.querySelectorAll('[data-speed]')]
  };

  const state = {
    data: null,
    progress: 0,
    playing: false,
    speed: 1,
    follow: true,
    raf: null,
    lastFrame: 0,
    activeIndex: 0,
    markerNodes: [],
    leafletMarkers: []
  };

  const map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
    minZoom: 4,
    maxZoom: 11
  }).setView([35.5, 112], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const futureLine = L.polyline([], {
    color: '#777268',
    opacity: 0.42,
    weight: 3,
    dashArray: '7 9',
    lineCap: 'round'
  }).addTo(map);

  const pastLine = L.polyline([], {
    color: '#b62826',
    opacity: 0.94,
    weight: 5,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  const currentSegment = L.polyline([], {
    color: '#e44a43',
    opacity: 1,
    weight: 6,
    lineCap: 'round'
  }).addTo(map);

  const personIcon = L.divIcon({
    className: 'person-marker',
    html: '<div class="person-core"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 26]
  });
  const personMarker = L.marker([40.657, 109.84], { icon: personIcon, zIndexOffset: 900 }).addTo(map);

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function toRad(d) { return d * Math.PI / 180; }

  function haversine(a, b) {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const la1 = toRad(a.lat);
    const la2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function timelinePositionForEvent(index) {
    const events = state.data.events;
    const start = events[0].year;
    const end = events[events.length - 1].year;
    if (end === start) return 0;
    return (events[index].year - start) / (end - start);
  }

  function progressToSegment(progress) {
    const events = state.data.events;
    if (events.length < 2) return { index: 0, local: 0 };
    const start = events[0].year;
    const end = events[events.length - 1].year;
    const y = lerp(start, end, progress);
    let i = 0;
    while (i < events.length - 2 && y >= events[i + 1].year) i++;
    const a = events[i].year;
    const b = events[i + 1].year;
    const local = b === a ? 1 : clamp((y - a) / (b - a), 0, 1);
    return { index: i, local, year: y };
  }

  function currentEventIndex(progress) {
    const events = state.data.events;
    const start = events[0].year;
    const end = events[events.length - 1].year;
    const y = lerp(start, end, progress);
    let idx = 0;
    for (let i = 0; i < events.length; i++) {
      if (events[i].year <= y + 0.0001) idx = i;
    }
    return idx;
  }

  function renderPersonMeta() {
    const d = state.data;
    els.personName.textContent = d.name || d.shortName || '人物行迹';
    els.personPeriod.textContent = d.period || '';
    els.personSubtitle.textContent = d.subtitle || '';
    document.title = `${d.name || '时空行迹'} · Spacetime Trails`;
    els.startYear.textContent = d.events[0].year;
    els.endYear.textContent = d.events[d.events.length - 1].year;
  }

  function clearMarkers() {
    state.leafletMarkers.forEach(marker => map.removeLayer(marker));
    state.leafletMarkers = [];
    state.markerNodes = [];
  }

  function renderMapMarkers() {
    clearMarkers();
    state.data.events.forEach((event, index) => {
      const icon = L.divIcon({
        className: 'custom-event-marker',
        html: '<div class="marker-core"></div>',
        iconSize: [15, 15],
        iconAnchor: [7, 7]
      });
      const marker = L.marker([event.lat, event.lng], { icon, zIndexOffset: 100 + index })
        .addTo(map)
        .bindTooltip(event.title, { direction: 'top', offset: [0, -8], className: 'event-label' });
      marker.on('click', () => jumpToEvent(index, true));
      state.leafletMarkers.push(marker);
    });
    requestAnimationFrame(() => {
      state.markerNodes = state.leafletMarkers.map(marker => marker.getElement()).filter(Boolean);
      updateMarkerStates();
    });
  }

  function renderTimelineEvents() {
    els.timelineEvents.innerHTML = '';
    state.data.events.forEach((event, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'timeline-event';
      button.style.left = `${timelinePositionForEvent(index) * 100}%`;
      button.title = `${event.dateLabel || event.year} · ${event.title}`;
      button.setAttribute('aria-label', `跳到 ${event.title}`);
      button.addEventListener('click', () => jumpToEvent(index, true));
      els.timelineEvents.appendChild(button);
    });
  }

  function routeBounds() {
    return L.latLngBounds(state.data.events.map(e => [e.lat, e.lng]));
  }

  function fitRoute() {
    map.fitBounds(routeBounds(), { padding: [50, 50], maxZoom: 6.5 });
  }

  function cumulativeDistance(progress) {
    const events = state.data.events;
    const seg = progressToSegment(progress);
    let total = 0;
    for (let i = 0; i < seg.index; i++) total += haversine(events[i], events[i + 1]);
    if (events[seg.index + 1]) total += haversine(events[seg.index], events[seg.index + 1]) * seg.local;
    return total;
  }

  function currentPosition(progress) {
    const events = state.data.events;
    if (progress >= 1 || events.length === 1) {
      const e = events[events.length - 1];
      return { lat: e.lat, lng: e.lng, index: events.length - 1, local: 1 };
    }
    const seg = progressToSegment(progress);
    const a = events[seg.index];
    const b = events[seg.index + 1];
    return { lat: lerp(a.lat, b.lat, seg.local), lng: lerp(a.lng, b.lng, seg.local), index: seg.index, local: seg.local };
  }

  function updateLinesAndPerson() {
    const events = state.data.events;
    const p = currentPosition(state.progress);
    const past = events.slice(0, p.index + 1).map(e => [e.lat, e.lng]);
    if (p.local > 0 && p.index < events.length - 1) past.push([p.lat, p.lng]);
    if (state.progress >= 1) {
      pastLine.setLatLngs(events.map(e => [e.lat, e.lng]));
      currentSegment.setLatLngs([]);
      futureLine.setLatLngs([]);
    } else {
      pastLine.setLatLngs(past);
      currentSegment.setLatLngs([[events[p.index].lat, events[p.index].lng], [p.lat, p.lng]]);
      futureLine.setLatLngs([[p.lat, p.lng], ...events.slice(p.index + 1).map(e => [e.lat, e.lng])]);
    }
    personMarker.setLatLng([p.lat, p.lng]);
    if (state.follow && state.playing) {
      const center = map.getCenter();
      if (map.distance(center, [p.lat, p.lng]) > 220000) {
        map.panTo([p.lat, p.lng], { animate: true, duration: 0.7 });
      }
    }
  }

  function updateEventPanel(index) {
    const events = state.data.events;
    const event = events[index];
    state.activeIndex = index;
    els.eventIndex.textContent = `${String(index + 1).padStart(2, '0')} / ${String(events.length).padStart(2, '0')}`;
    els.eventYear.textContent = event.dateLabel || String(event.year);
    els.eventTitle.textContent = event.title;
    els.eventPlace.textContent = event.place || event.title;
    els.eventSummary.textContent = event.summary || '';
    els.eventSource.textContent = event.source || state.data.note || '暂无来源说明。';
    els.eventTags.innerHTML = '';
    (event.tags || []).forEach(tag => {
      const span = document.createElement('span');
      span.className = 'event-tag';
      span.textContent = tag;
      els.eventTags.appendChild(span);
    });
    els.prevEventBtn.disabled = index === 0;
    els.nextEventBtn.disabled = index === events.length - 1;
  }

  function updateMarkerStates() {
    const active = currentEventIndex(state.progress);
    state.markerNodes.forEach((node, i) => {
      node.classList.toggle('passed', i <= active);
      node.classList.toggle('active', i === active);
    });
    [...els.timelineEvents.children].forEach((node, i) => {
      node.classList.toggle('passed', timelinePositionForEvent(i) <= state.progress + .0001);
      node.classList.toggle('active', i === active);
    });
  }

  function updateClock() {
    const seg = progressToSegment(state.progress);
    const idx = currentEventIndex(state.progress);
    const event = state.data.events[idx];
    els.clockYear.textContent = event.dateLabel || `${Math.round(seg.year)} 年`;
    els.clockPhase.textContent = event.title;
    els.currentPlace.textContent = event.title;
    els.distanceText.textContent = `${Math.round(cumulativeDistance(state.progress)).toLocaleString('zh-CN')} km`;
  }

  function render() {
    const pct = state.progress * 100;
    els.timelineProgress.style.width = `${pct}%`;
    els.timeRange.value = String(Math.round(state.progress * 1000));
    const idx = currentEventIndex(state.progress);
    if (idx !== state.activeIndex) updateEventPanel(idx);
    updateLinesAndPerson();
    updateMarkerStates();
    updateClock();
  }

  function jumpToEvent(index, pan) {
    const progress = timelinePositionForEvent(index);
    state.progress = clamp(progress, 0, 1);
    updateEventPanel(index);
    render();
    if (pan) {
      const e = state.data.events[index];
      map.flyTo([e.lat, e.lng], Math.max(map.getZoom(), 6), { duration: 0.8 });
    }
  }

  function setPlaying(playing) {
    state.playing = playing;
    els.playBtn.textContent = playing ? '❚❚' : '▶';
    els.playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    if (playing) {
      if (state.progress >= 1) state.progress = 0;
      state.lastFrame = performance.now();
      cancelAnimationFrame(state.raf);
      state.raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }
  }

  function tick(now) {
    if (!state.playing) return;
    const dt = Math.min((now - state.lastFrame) / 1000, 0.1);
    state.lastFrame = now;
    const baseDuration = 38;
    state.progress = clamp(state.progress + dt * state.speed / baseDuration, 0, 1);
    render();
    if (state.progress >= 1) {
      setPlaying(false);
      return;
    }
    state.raf = requestAnimationFrame(tick);
  }

  function validateData(data) {
    if (!data || !Array.isArray(data.events) || data.events.length < 2) throw new Error('JSON 至少需要两个 events。');
    data.events.forEach((e, i) => {
      ['year', 'lat', 'lng', 'title'].forEach(k => {
        if (e[k] === undefined || e[k] === null || e[k] === '') throw new Error(`第 ${i + 1} 个事件缺少 ${k}。`);
      });
      e.year = Number(e.year); e.lat = Number(e.lat); e.lng = Number(e.lng);
      if (![e.year, e.lat, e.lng].every(Number.isFinite)) throw new Error(`第 ${i + 1} 个事件的年份或坐标无效。`);
    });
    data.events.sort((a, b) => a.year - b.year);
    return data;
  }

  function loadData(data) {
    setPlaying(false);
    state.data = validateData(data);
    state.progress = 0;
    state.activeIndex = -1;
    renderPersonMeta();
    renderMapMarkers();
    renderTimelineEvents();
    updateEventPanel(0);
    render();
    setTimeout(() => { map.invalidateSize(); fitRoute(); }, 40);
  }

  els.playBtn.addEventListener('click', () => setPlaying(!state.playing));
  els.timeRange.addEventListener('input', event => {
    setPlaying(false);
    state.progress = clamp(Number(event.target.value) / 1000, 0, 1);
    render();
  });
  els.timeRange.addEventListener('change', () => {
    if (!state.follow) return;
    const p = currentPosition(state.progress);
    map.panTo([p.lat, p.lng], { animate: true, duration: 0.35 });
  });
  els.prevEventBtn.addEventListener('click', () => jumpToEvent(Math.max(0, state.activeIndex - 1), true));
  els.nextEventBtn.addEventListener('click', () => jumpToEvent(Math.min(state.data.events.length - 1, state.activeIndex + 1), true));
  els.fitRouteBtn.addEventListener('click', fitRoute);
  els.followBtn.addEventListener('click', () => {
    state.follow = !state.follow;
    els.followBtn.textContent = `跟随：${state.follow ? '开' : '关'}`;
    els.followBtn.setAttribute('aria-pressed', String(state.follow));
  });
  els.speedButtons.forEach(button => button.addEventListener('click', () => {
    state.speed = Number(button.dataset.speed);
    els.speedButtons.forEach(b => b.classList.toggle('active', b === button));
  }));
  els.fileInput.addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      loadData(data);
    } catch (error) {
      alert(`无法载入数据：${error.message}`);
    } finally {
      event.target.value = '';
    }
  });

  fetch('./data/lubu.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(loadData)
    .catch(error => {
      console.error(error);
      els.eventTitle.textContent = '数据载入失败';
      els.eventSummary.textContent = '请刷新页面重试，或使用右上角“载入 JSON”载入本地人物数据。';
    });
})();
