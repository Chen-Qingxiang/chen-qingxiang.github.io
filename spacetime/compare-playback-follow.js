(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const FIXED_SPEEDS = new Map([
    ['0.5×', 0.5],
    ['1×', 1],
    ['2×', 2],
    ['4×', 4]
  ]);
  const registry = Array.isArray(window.SPACETIME_COMPARE_REGISTRY)
    ? window.SPACETIME_COMPARE_REGISTRY
    : [];
  const labelToId = new Map(registry.map(entry => [entry.label, entry.id]));
  let lastTrackTarget = null;
  let lastStatusTarget = null;
  let normalizeTimer = 0;
  let followRaf = 0;

  function people() {
    return window.SPACETIME_COMPARE_PEOPLE || null;
  }

  function lifeStart(person) {
    return Number(person?.lifeStart ?? person?.events?.[0]?.time ?? person?.events?.[0]?.year);
  }

  function lifeEnd(person) {
    const last = person?.events?.at?.(-1);
    return Number(person?.lifeEnd ?? last?.time ?? last?.year);
  }

  function selectedIds() {
    const P = people();
    if (!P) return [];
    return [...document.querySelectorAll('#peoplePicks input[data-person]:checked')]
      .map(input => input.dataset.person)
      .filter(id => P[id]);
  }

  function sortedSelectedIds() {
    const P = people();
    return selectedIds().sort((a, b) => {
      const d = lifeStart(P[a]) - lifeStart(P[b]);
      return d || lifeEnd(P[a]) - lifeEnd(P[b]) || a.localeCompare(b);
    });
  }

  function domain() {
    const P = people();
    const ids = selectedIds();
    if (!P || !ids.length) return null;
    const starts = ids.map(id => lifeStart(P[id])).filter(Number.isFinite);
    const ends = ids.map(id => lifeEnd(P[id])).filter(Number.isFinite);
    if (!starts.length || !ends.length) return null;
    const common = document.querySelector('[data-range-mode="common"]')?.classList.contains('active');
    const start = common ? Math.max(...starts) : Math.min(...starts);
    const end = common ? Math.min(...ends) : Math.max(...ends);
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? { start, end } : null;
  }

  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    const exp = Math.floor(Math.log10(raw));
    const base = 10 ** exp;
    const f = raw / base;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * base;
  }

  function coreAutoRate() {
    const d = domain();
    if (!d) return 1;
    const span = Math.max(0.001, d.end - d.start);
    return span <= 150 ? 1 : niceStep(span / 60);
  }

  function desiredSpeedForButton(button) {
    if (button.dataset.fixedSpeed) return Number(button.dataset.fixedSpeed);
    const text = button.textContent.trim();
    return FIXED_SPEEDS.get(text) ?? Number(button.dataset.speed) ?? 1;
  }

  function normalizeSpeedButtons(reapply = true) {
    const rate = coreAutoRate();
    const buttons = [...document.querySelectorAll('[data-speed]')];
    if (!buttons.length) return;

    buttons.forEach(button => {
      const desired = desiredSpeedForButton(button);
      button.dataset.fixedSpeed = String(desired);
      button.dataset.speed = String(desired / rate);
      button.title = `${desired}× = ${desired === 0.5 ? '6 个月' : desired + ' 年'}/秒`;
    });

    const note = $('clockNote');
    if (note) note.textContent = '共享历史时钟 · 1× = 1 年/秒';

    if (reapply) {
      const active = buttons.find(button => button.classList.contains('active'));
      if (active) active.click();
    }
  }

  function scheduleNormalizeSpeed() {
    clearTimeout(normalizeTimer);
    normalizeTimer = setTimeout(() => normalizeSpeedButtons(true), 0);
  }

  function currentHistoricalTime() {
    const d = domain();
    const range = $('masterRange');
    if (!d || !range) return null;
    const p = Math.max(0, Math.min(1, Number(range.value) / 10000));
    return d.start + (d.end - d.start) * p;
  }

  function followTargetId() {
    const P = people();
    const ids = sortedSelectedIds();
    const t = currentHistoricalTime();
    if (!P || !ids.length || t == null) return null;

    const alive = ids.filter(id => t >= lifeStart(P[id]) && t <= lifeEnd(P[id]));
    if (alive.length) return alive.at(-1);

    const future = ids.find(id => lifeStart(P[id]) > t);
    return future || ids.at(-1);
  }

  function annotateAndSortStatusCards() {
    const list = $('personStatusList');
    const P = people();
    if (!list || !P) return;

    [...list.querySelectorAll('.status-card')].forEach(card => {
      if (card.dataset.person) return;
      const label = card.querySelector('.status-card-head strong')?.textContent?.trim();
      const id = labelToId.get(label);
      if (id) card.dataset.person = id;
    });

    const cards = [...list.querySelectorAll('.status-card[data-person]')];
    const sorted = cards.slice().sort((a, b) => {
      const pa = P[a.dataset.person], pb = P[b.dataset.person];
      return lifeStart(pa) - lifeStart(pb) || lifeEnd(pa) - lifeEnd(pb);
    });
    if (sorted.some((card, i) => card !== cards[i])) sorted.forEach(card => list.appendChild(card));
  }

  function sortTrackRows() {
    const wrap = $('tracksWrap');
    const P = people();
    if (!wrap || !P) return;
    const rows = [...wrap.querySelectorAll('.track-row[data-person]')];
    const sorted = rows.slice().sort((a, b) => {
      const pa = P[a.dataset.person], pb = P[b.dataset.person];
      return lifeStart(pa) - lifeStart(pb) || lifeEnd(pa) - lifeEnd(pb);
    });
    if (sorted.some((row, i) => row !== rows[i])) sorted.forEach(row => wrap.appendChild(row));
  }

  function scrollChildIntoContainer(container, child, smooth = true) {
    if (!container || !child || container.scrollHeight <= container.clientHeight + 2) return;
    const top = child.offsetTop;
    const bottom = top + child.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    const margin = Math.min(42, container.clientHeight * 0.18);

    if (top >= visibleTop + margin && bottom <= visibleBottom - margin) return;

    const target = Math.max(
      0,
      Math.min(
        container.scrollHeight - container.clientHeight,
        top - (container.clientHeight - child.offsetHeight) * 0.42
      )
    );
    container.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
  }

  function syncFollow() {
    followRaf = 0;
    annotateAndSortStatusCards();
    sortTrackRows();

    const target = followTargetId();
    if (!target) return;

    const tracks = $('tracksWrap');
    const row = tracks?.querySelector(`.track-row[data-person="${CSS.escape(target)}"]`);
    if (row && target !== lastTrackTarget) {
      scrollChildIntoContainer(tracks, row, true);
      lastTrackTarget = target;
    }

    const statuses = $('personStatusList');
    const card = statuses?.querySelector(`.status-card[data-person="${CSS.escape(target)}"]`);
    if (card && target !== lastStatusTarget) {
      scrollChildIntoContainer(statuses, card, true);
      lastStatusTarget = target;
    }
  }

  function scheduleFollow(reset = false) {
    if (reset) {
      lastTrackTarget = null;
      lastStatusTarget = null;
    }
    if (followRaf) return;
    followRaf = requestAnimationFrame(syncFollow);
  }

  function initObservers() {
    const note = $('clockNote');
    if (note) {
      new MutationObserver(() => {
        if (note.textContent !== '共享历史时钟 · 1× = 1 年/秒') {
          note.textContent = '共享历史时钟 · 1× = 1 年/秒';
        }
      }).observe(note, { childList: true, characterData: true, subtree: true });
    }

    const statuses = $('personStatusList');
    if (statuses) {
      new MutationObserver(() => scheduleFollow(false))
        .observe(statuses, { childList: true, subtree: false });
    }

    const tracks = $('tracksWrap');
    if (tracks) {
      new MutationObserver(() => scheduleFollow(true))
        .observe(tracks, { childList: true, subtree: false });
    }

    const statusTime = $('statusTime');
    if (statusTime) {
      new MutationObserver(() => scheduleFollow(false))
        .observe(statusTime, { childList: true, characterData: true, subtree: true });
    }
  }

  document.addEventListener('change', event => {
    if (event.target?.matches?.('#peoplePicks input[data-person]')) {
      scheduleNormalizeSpeed();
      scheduleFollow(true);
    }
  });

  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-range-mode]') || event.target?.closest?.('#selectAllBtn')) {
      setTimeout(() => {
        scheduleNormalizeSpeed();
        scheduleFollow(true);
      }, 0);
    }
  });

  $('masterRange')?.addEventListener('input', () => scheduleFollow(false));

  function waitForCore() {
    if (!people() || !document.querySelector('#peoplePicks input[data-person]')) {
      setTimeout(waitForCore, 60);
      return;
    }
    initObservers();
    normalizeSpeedButtons(true);
    sortTrackRows();
    annotateAndSortStatusCards();
    scheduleFollow(true);
  }

  waitForCore();
})();
