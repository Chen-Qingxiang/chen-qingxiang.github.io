(() => {
  'use strict';

  const registry = Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [];
  const entryById = new Map(registry.map(entry => [entry.id, entry]));
  const idByLabel = new Map(registry.map(entry => [entry.label, entry.id]));
  let reordering = false;

  function lifeStart(id) {
    const person = window.SPACETIME_COMPARE_PEOPLE?.[id];
    const entry = entryById.get(id);
    const value = Number(entry?.lifeStart ?? person?.lifeStart ?? person?.events?.[0]?.time ?? person?.events?.[0]?.year);
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }

  function chronologicalIds(ids) {
    return [...ids].sort((a, b) => lifeStart(a) - lifeStart(b) || String(a).localeCompare(String(b)));
  }

  function reorderTracks() {
    const wrap = document.getElementById('tracksWrap');
    if (!wrap) return;
    const rows = [...wrap.querySelectorAll(':scope > .track-row')];
    if (rows.length < 2) return;
    const current = rows.map(row => row.dataset.person);
    const ordered = chronologicalIds(current);
    if (current.every((id, i) => id === ordered[i])) return;
    const byId = new Map(rows.map(row => [row.dataset.person, row]));
    ordered.forEach(id => wrap.appendChild(byId.get(id)));
  }

  function reorderStatuses() {
    const wrap = document.getElementById('personStatusList');
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll(':scope > .status-card')];
    if (cards.length < 2) return;
    const cardId = card => idByLabel.get(card.querySelector('.status-card-head strong')?.textContent?.trim() || '') || '';
    const current = cards.map(cardId);
    const ordered = chronologicalIds(current);
    if (current.every((id, i) => id === ordered[i])) return;
    const queues = new Map();
    cards.forEach(card => {
      const id = cardId(card);
      if (!queues.has(id)) queues.set(id, []);
      queues.get(id).push(card);
    });
    ordered.forEach(id => {
      const card = queues.get(id)?.shift();
      if (card) wrap.appendChild(card);
    });
  }

  function reorderAll() {
    if (reordering) return;
    reordering = true;
    reorderTracks();
    reorderStatuses();
    queueMicrotask(() => { reordering = false; });
  }

  const observer = new MutationObserver(() => queueMicrotask(reorderAll));
  const start = () => {
    const tracks = document.getElementById('tracksWrap');
    const statuses = document.getElementById('personStatusList');
    if (tracks) observer.observe(tracks, { childList: true });
    if (statuses) observer.observe(statuses, { childList: true });
    reorderAll();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
