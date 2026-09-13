(() => {
  'use strict';

  // Swallow/migration is not a human life course and should not show age.
  if (window.SPACETIME_SINGLE_VIEW === 'swallow') return;

  const $ = id => document.getElementById(id);
  let data = null;
  let birthYear = null;
  let birthApprox = false;
  let raf = 0;

  function historicalYearDiff(year, birth) {
    if (!Number.isFinite(year) || !Number.isFinite(birth)) return null;
    // Historical BCE/CE chronology has no year zero. Within the same era,
    // simple subtraction is correct for elapsed-year age.
    const diff = birth < 0 && year > 0 ? year - birth - 1 : year - birth;
    return Math.max(0, diff);
  }

  function parseBirthFromPeriod(period) {
    const text = String(period || '');
    const match = text.match(/(前)?\s*(\d{1,4})/);
    if (!match) return null;
    const n = Number(match[2]);
    return match[1] ? -n : n;
  }

  function deriveBirth(d) {
    const explicit = Number(d?.birthYear ?? d?.lifeStart);
    if (Number.isFinite(explicit)) return explicit;
    return parseBirthFromPeriod(d?.period);
  }

  function formatAge(year) {
    const age = historicalYearDiff(Number(year), birthYear);
    if (age == null) return '';
    const rounded = Math.max(0, Math.floor(age + 1e-7));
    return `${birthApprox ? '约' : ''}${rounded}岁`;
  }

  function formatHistoricalYear(year) {
    const y = Math.round(Number(year));
    if (!Number.isFinite(y)) return '—';
    return y < 0 ? `前${Math.abs(y)} 年` : `${y} 年`;
  }

  function eventIndex() {
    const text = $('eventIndex')?.textContent || '';
    const match = text.match(/(\d+)/);
    if (!match) return 0;
    return Math.max(0, Math.min((data?.events?.length || 1) - 1, Number(match[1]) - 1));
  }

  function currentTimelineYear() {
    if (!data?.events?.length) return null;
    const range = $('timeRange');
    const start = Number(data.events[0].year ?? data.events[0].time);
    const endEvent = data.events[data.events.length - 1];
    const end = Number(endEvent.year ?? endEvent.time);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const min = Number(range?.min ?? 0);
    const max = Number(range?.max ?? 1000);
    const value = Number(range?.value ?? min);
    const p = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
    return start + (end - start) * p;
  }

  function setTextIfChanged(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function renderAges() {
    raf = 0;
    if (!data || !Number.isFinite(birthYear)) return;

    const events = data.events || [];
    if (!events.length) return;

    const idx = eventIndex();
    const event = events[idx] || events[0];
    const eventYear = Number(event.year ?? event.time);
    const eventBase = event.dateLabel || formatHistoricalYear(eventYear);
    const eventAge = formatAge(eventYear);
    setTextIfChanged($('eventYear'), eventAge ? `${eventBase} · ${eventAge}` : eventBase);

    const y = currentTimelineYear();
    if (Number.isFinite(y)) {
      const age = formatAge(y);
      setTextIfChanged($('clockYear'), age ? `${formatHistoricalYear(y)} · ${age}` : formatHistoricalYear(y));
    }

    const startEvent = events[0];
    const endEvent = events[events.length - 1];
    const startY = Number(startEvent.year ?? startEvent.time);
    const endY = Number(endEvent.year ?? endEvent.time);
    const startAge = formatAge(startY);
    const endAge = formatAge(endY);
    setTextIfChanged($('startYear'), `${formatHistoricalYear(startY)}${startAge ? ` · ${startAge}` : ''}`);
    setTextIfChanged($('endYear'), `${formatHistoricalYear(endY)}${endAge ? ` · ${endAge}` : ''}`);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(renderAges);
  }

  async function loadCurrentData() {
    try {
      // single-person-router intercepts this URL and returns whichever person/case
      // is active, including El Cid. This keeps age logic independent of data source.
      const response = await fetch('./data/lubu.json', { cache: 'no-cache' });
      const d = await response.json();
      if (!d || !Array.isArray(d.events)) return;
      data = d;
      birthYear = deriveBirth(d);
      birthApprox = /约/.test(String(d.period || '')) || d.birthApprox === true;
      schedule();
    } catch (error) {
      console.warn('Single-mode age labels unavailable:', error);
    }
  }

  const range = $('timeRange');
  range?.addEventListener('input', schedule);
  range?.addEventListener('change', schedule);

  ['eventIndex', 'eventYear', 'clockYear', 'startYear', 'endYear'].forEach(id => {
    const el = $(id);
    if (!el) return;
    new MutationObserver(schedule).observe(el, { childList: true, characterData: true, subtree: true });
  });

  loadCurrentData();
})();
