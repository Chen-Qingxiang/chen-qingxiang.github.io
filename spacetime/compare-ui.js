(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const dropdown = $('peopleDropdown');
  const toggle = $('peoplePickerToggle');
  const popover = $('peoplePopover');
  const summary = $('selectedPeopleSummary');
  const picks = $('peoplePicks');
  const splitter = $('workspaceSplitter');
  const presets = [...document.querySelectorAll('[data-layout]')];

  function updateSummary() {
    if (!picks || !summary) return;
    const checked = [...picks.querySelectorAll('input[data-person]:checked')];
    const names = checked.map(input => input.closest('.person-pick')?.querySelector('span:nth-of-type(2)')?.textContent?.trim()).filter(Boolean);
    if (!names.length) { summary.textContent = '选择人物'; return; }
    const shown = names.slice(0, 3);
    summary.textContent = shown.join(' · ') + (names.length > 3 ? ` · +${names.length - 3}` : '');
  }

  function setOpen(open) {
    if (!toggle || !popover) return;
    popover.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    dropdown?.classList.toggle('open', open);
    if (open) setTimeout(() => $('peopleSearch')?.focus(), 0);
  }

  toggle?.addEventListener('click', () => setOpen(popover.hidden));
  document.addEventListener('pointerdown', event => {
    if (dropdown && !dropdown.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
  picks?.addEventListener('change', () => setTimeout(updateSummary, 0));
  $('selectAllBtn')?.addEventListener('click', () => setTimeout(updateSummary, 0));
  if (picks) new MutationObserver(updateSummary).observe(picks, { childList: true, subtree: true });
  updateSummary();

  const presetHeights = { map: 178, balanced: 238, timeline: 350 };
  function applyTimelineHeight(px, preset = null) {
    const min = 165;
    const max = Math.min(430, Math.max(220, window.innerHeight * .46));
    const value = Math.max(min, Math.min(max, px));
    root.style.setProperty('--timeline-h', `${Math.round(value)}px`);
    presets.forEach(b => b.classList.toggle('active', Boolean(preset) && b.dataset.layout === preset));
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }

  presets.forEach(button => button.addEventListener('click', () => {
    applyTimelineHeight(presetHeights[button.dataset.layout], button.dataset.layout);
  }));

  let dragging = false;
  function dragTo(clientY) {
    const shell = document.querySelector('.compare-shell');
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const bottomPadding = Math.max(0, window.innerHeight - rect.bottom);
    applyTimelineHeight(window.innerHeight - clientY - bottomPadding - 8, null);
  }

  splitter?.addEventListener('pointerdown', event => {
    if (window.matchMedia('(max-width: 820px)').matches) return;
    dragging = true;
    splitter.setPointerCapture?.(event.pointerId);
    document.body.classList.add('resizing-workspace');
    dragTo(event.clientY);
  });
  splitter?.addEventListener('pointermove', event => { if (dragging) dragTo(event.clientY); });
  splitter?.addEventListener('pointerup', event => {
    dragging = false;
    splitter.releasePointerCapture?.(event.pointerId);
    document.body.classList.remove('resizing-workspace');
  });
  splitter?.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const current = parseFloat(getComputedStyle(root).getPropertyValue('--timeline-h')) || presetHeights.balanced;
    applyTimelineHeight(current + (event.key === 'ArrowUp' ? 24 : -24), null);
  });

  const registry = Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [];
  const capture = window.SPACETIME_LAYER_CAPTURE;

  function currentHistoricalTime() {
    const people = window.SPACETIME_COMPARE_PEOPLE;
    const range = $('masterRange');
    if (!people || !range || !picks) return null;
    const selectedIds = [...picks.querySelectorAll('input[data-person]:checked')].map(x => x.dataset.person).filter(id => people[id]);
    if (!selectedIds.length) return null;
    const starts = selectedIds.map(id => Number(people[id].lifeStart ?? people[id].events?.[0]?.time ?? people[id].events?.[0]?.year));
    const ends = selectedIds.map(id => Number(people[id].lifeEnd ?? people[id].events?.at(-1)?.time ?? people[id].events?.at(-1)?.year));
    const common = document.querySelector('[data-range-mode="common"]')?.classList.contains('active');
    const start = common ? Math.max(...starts) : Math.min(...starts);
    const end = common ? Math.min(...ends) : Math.max(...ends);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    const p = Math.max(0, Math.min(1, Number(range.value) / 10000));
    return start + (end - start) * p;
  }

  function setPersonRoutesVisible(entry, visible) {
    const map = capture?.map;
    if (!map || !entry?.color) return;
    const color = String(entry.color).toLowerCase();
    capture.polylines
      .filter(layer => String(layer?.options?.color || '').toLowerCase() === color)
      .forEach(layer => {
        if (visible) {
          if (!map.hasLayer(layer)) layer.addTo(map);
        } else if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
  }

  function syncLifetimeMapVisibility() {
    const people = window.SPACETIME_COMPARE_PEOPLE;
    const t = currentHistoricalTime();
    if (!people || t == null || !picks) return;
    const checked = new Set([...picks.querySelectorAll('input[data-person]:checked')].map(x => x.dataset.person));
    registry.forEach(entry => {
      const person = people[entry.id];
      if (!person) return;
      const start = Number(person.lifeStart ?? person.events?.[0]?.time ?? person.events?.[0]?.year);
      const end = Number(person.lifeEnd ?? person.events?.at(-1)?.time ?? person.events?.at(-1)?.year);
      const aliveNow = checked.has(entry.id) && Number.isFinite(start) && Number.isFinite(end) && t >= start && t <= end;
      setPersonRoutesVisible(entry, aliveNow);
    });
  }

  let visibilityRaf = 0;
  function scheduleLifetimeVisibilitySync() {
    cancelAnimationFrame(visibilityRaf);
    visibilityRaf = requestAnimationFrame(syncLifetimeMapVisibility);
  }

  $('masterRange')?.addEventListener('input', scheduleLifetimeVisibilitySync);
  picks?.addEventListener('change', () => setTimeout(scheduleLifetimeVisibilitySync, 0));
  const statusTime = $('statusTime');
  if (statusTime) new MutationObserver(scheduleLifetimeVisibilitySync).observe(statusTime, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', scheduleLifetimeVisibilitySync);
  setTimeout(scheduleLifetimeVisibilitySync, 160);

  applyTimelineHeight(presetHeights.balanced, 'balanced');
})();
