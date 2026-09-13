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

  applyTimelineHeight(presetHeights.balanced, 'balanced');
})();
