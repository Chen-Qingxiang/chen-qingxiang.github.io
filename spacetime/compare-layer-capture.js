(() => {
  'use strict';
  if (!window.L || !L.map || !L.polyline) return;

  // Public capture remains for compatibility with compare-ui, but route
  // visibility is now managed here in the same render cycle as setLatLngs.
  // Keep the public polyline list empty so the older observer guard becomes a no-op.
  const capture = { map: null, polylines: [] };
  const records = new Map();
  const originalMap = L.map;
  const originalPolyline = L.polyline;
  let syncQueued = false;

  L.map = function (...args) {
    const map = originalMap.apply(this, args);
    capture.map = map;
    return map;
  };

  function recordForColor(color) {
    const key = String(color || '').toLowerCase();
    if (!records.has(key)) records.set(key, { color: key, future: null, past: null });
    return records.get(key);
  }

  function selectedIds() {
    return new Set(
      [...document.querySelectorAll('#peoplePicks input[data-person]:checked')]
        .map(input => input.dataset.person)
    );
  }

  function historicalTime() {
    const people = window.SPACETIME_COMPARE_PEOPLE;
    const range = document.getElementById('masterRange');
    if (!people || !range) return null;
    const ids = [...selectedIds()].filter(id => people[id]);
    if (!ids.length) return null;

    const starts = ids.map(id => Number(people[id].lifeStart ?? people[id].events?.[0]?.time ?? people[id].events?.[0]?.year));
    const ends = ids.map(id => Number(people[id].lifeEnd ?? people[id].events?.at(-1)?.time ?? people[id].events?.at(-1)?.year));
    const common = document.querySelector('[data-range-mode="common"]')?.classList.contains('active');
    const start = common ? Math.max(...starts) : Math.min(...starts);
    const end = common ? Math.min(...ends) : Math.max(...ends);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    const p = Math.max(0, Math.min(1, Number(range.value) / 10000));
    return start + (end - start) * p;
  }

  function registryEntryForColor(color) {
    const key = String(color || '').toLowerCase();
    const registry = Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [];
    return registry.find(entry => String(entry.color || '').toLowerCase() === key) || null;
  }

  function setLayerOnMap(layer, visible) {
    const map = capture.map;
    if (!map || !layer) return;
    if (visible) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  }

  function syncVisibilityNow() {
    syncQueued = false;
    const map = capture.map;
    const people = window.SPACETIME_COMPARE_PEOPLE;
    const t = historicalTime();
    if (!map || !people || t == null) return;
    const checked = selectedIds();

    records.forEach(record => {
      const entry = registryEntryForColor(record.color);
      const person = entry && people[entry.id];
      if (!entry || !person) return;
      const start = Number(person.lifeStart ?? person.events?.[0]?.time ?? person.events?.[0]?.year);
      const end = Number(person.lifeEnd ?? person.events?.at(-1)?.time ?? person.events?.at(-1)?.year);
      const alive = checked.has(entry.id) && Number.isFinite(start) && Number.isFinite(end) && t >= start && t <= end;
      setLayerOnMap(record.future, alive);
      setLayerOnMap(record.past, alive);
    });
  }

  function queueVisibilitySync() {
    if (syncQueued) return;
    syncQueued = true;
    // compare.js updates route geometry first and the shared range value later in
    // the same synchronous render(). A microtask runs after render() finishes but
    // before paint, so the route and marker reach the screen in the same frame.
    queueMicrotask(syncVisibilityNow);
  }

  L.polyline = function (...args) {
    const layer = originalPolyline.apply(this, args);
    const color = String(layer?.options?.color || '').toLowerCase();
    if (!color) return layer;

    const record = recordForColor(color);
    if (!record.future) record.future = layer;
    else if (!record.past) record.past = layer;

    const originalSetLatLngs = layer.setLatLngs;
    layer.setLatLngs = function (...setArgs) {
      const result = originalSetLatLngs.apply(this, setArgs);
      queueVisibilitySync();
      return result;
    };

    return layer;
  };

  document.addEventListener('input', event => {
    if (event.target?.id === 'masterRange') queueVisibilitySync();
  });
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#peoplePicks input[data-person]')) queueVisibilitySync();
  });

  window.SPACETIME_LAYER_CAPTURE = capture;
  window.SPACETIME_ROUTE_SYNC = { sync: queueVisibilitySync };
})();
