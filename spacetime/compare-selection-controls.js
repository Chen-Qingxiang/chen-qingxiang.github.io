(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function inputs() {
    return [...document.querySelectorAll('#peoplePicks input[data-person]')];
  }

  function selectedSet() {
    return window.SPACETIME_COMPARE_SELECTED_SET || null;
  }

  function updateSummary() {
    const summary = $('selectedPeopleSummary');
    const checked = inputs().filter(input => input.checked);
    const button = $('selectAllBtn');
    if (button) button.textContent = checked.length && checked.length === inputs().length ? '取消全选' : '全选';
    if (!summary) return;
    if (!checked.length) {
      summary.textContent = '未选择人物';
      return;
    }
    const names = checked.map(input => input.closest('.person-pick')?.querySelector('span:nth-of-type(2)')?.textContent?.trim()).filter(Boolean);
    summary.textContent = names.slice(0, 3).join(' · ') + (names.length > 3 ? ` · +${names.length - 3}` : '');
  }

  function forceRebuild() {
    const activeMode = document.querySelector('[data-range-mode].active') || document.querySelector('[data-range-mode="union"]');
    activeMode?.click();
  }

  function clearEmptyState() {
    if (inputs().some(input => input.checked)) return;
    const statusList = $('personStatusList');
    const tracks = $('tracksWrap');
    const ruler = $('ruler');
    const legend = $('mapLegend');
    const overlap = $('overlapList');
    if (statusList) statusList.innerHTML = '';
    if (tracks) tracks.innerHTML = '';
    if (ruler) ruler.innerHTML = '';
    if (legend) legend.innerHTML = '';
    if (overlap) overlap.textContent = '请选择人物后查看时空接近。';
  }

  function toggleAll(event) {
    const button = event.target?.closest?.('#selectAllBtn');
    if (!button) return;
    const set = selectedSet();
    const all = inputs();
    if (!set || !all.length) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const currentlyAll = all.every(input => input.checked);
    set.clear();
    if (currentlyAll) {
      all.forEach(input => { input.checked = false; });
    } else {
      all.forEach(input => {
        input.checked = true;
        set.add(input.dataset.person);
      });
    }

    updateSummary();
    forceRebuild();
    setTimeout(() => {
      updateSummary();
      clearEmptyState();
    }, 0);
  }

  document.addEventListener('click', toggleAll, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#peoplePicks input[data-person]')) setTimeout(updateSummary, 0);
  });

  function wait() {
    if (!selectedSet() || !inputs().length) {
      setTimeout(wait, 50);
      return;
    }
    updateSummary();
  }

  wait();
})();