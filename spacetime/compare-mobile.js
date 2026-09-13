(() => {
  'use strict';

  const media = window.matchMedia('(max-width: 720px)');
  const shell = document.querySelector('.compare-shell');
  if (!shell) return;

  let tabs;
  let speedPicker;
  let legendButton;

  function setView(view) {
    shell.classList.toggle('compare-phone-status', view === 'status');
    shell.dataset.mobileView = view;
    if (!tabs) return;
    tabs.querySelectorAll('button[data-mobile-view]').forEach(button => {
      const active = button.dataset.mobileView === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function ensureTabs() {
    if (tabs || !media.matches) return;
    tabs = document.createElement('div');
    tabs.className = 'compare-mobile-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '多人模式手机视图');
    tabs.innerHTML = `
      <button type="button" class="active" data-mobile-view="timeline" role="tab" aria-selected="true">时间轴</button>
      <button type="button" data-mobile-view="status" role="tab" aria-selected="false">人物状态</button>`;
    tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-mobile-view]');
      if (button) setView(button.dataset.mobileView);
    });
    shell.appendChild(tabs);
    setView(shell.dataset.mobileView || 'timeline');
  }

  function ensureSpeedPicker() {
    if (speedPicker || !media.matches) return;
    const bar = document.querySelector('.timeline-section .playback-bar');
    const group = bar?.querySelector('.speed-picks');
    if (!bar || !group) return;

    const buttons = [...group.querySelectorAll('[data-speed]')];
    if (!buttons.length) return;

    speedPicker = document.createElement('label');
    speedPicker.className = 'compare-mobile-speed';
    speedPicker.innerHTML = '<span>速度</span>';

    const select = document.createElement('select');
    select.setAttribute('aria-label', '播放速度');
    buttons.forEach((button, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = button.textContent.trim();
      option.selected = button.classList.contains('active');
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const button = buttons[Number(select.value)];
      button?.click();
    });

    const sync = () => {
      const active = buttons.findIndex(button => button.classList.contains('active'));
      if (active >= 0 && select.value !== String(active)) select.value = String(active);
    };
    buttons.forEach(button => {
      new MutationObserver(sync).observe(button, { attributes: true, attributeFilter: ['class'] });
    });

    speedPicker.appendChild(select);
    bar.appendChild(speedPicker);
    sync();
  }

  function selectedCount() {
    return document.querySelectorAll('#peoplePicks input[data-person]:checked').length;
  }

  function updateLegendButton() {
    if (!legendButton) return;
    const count = selectedCount();
    const open = shell.classList.contains('compare-phone-legend-open');
    legendButton.textContent = `${count} 人 · 图例 ${open ? '▾' : '▴'}`;
    legendButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function ensureLegendToggle() {
    if (legendButton || !media.matches) return;
    const mapWrap = document.querySelector('.map-wrap');
    const legend = document.getElementById('mapLegend');
    if (!mapWrap || !legend) return;

    legendButton = document.createElement('button');
    legendButton.type = 'button';
    legendButton.className = 'mobile-legend-toggle';
    legendButton.setAttribute('aria-controls', 'mapLegend');
    legendButton.addEventListener('click', () => {
      shell.classList.toggle('compare-phone-legend-open');
      updateLegendButton();
    });
    mapWrap.appendChild(legendButton);
    updateLegendButton();

    const picks = document.getElementById('peoplePicks');
    if (picks) {
      picks.addEventListener('change', () => queueMicrotask(updateLegendButton));
      new MutationObserver(updateLegendButton).observe(picks, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['checked']
      });
    }
  }

  function enablePhoneUi() {
    if (!media.matches) return;
    document.documentElement.classList.add('compare-phone');
    ensureTabs();
    ensureSpeedPicker();
    ensureLegendToggle();
  }

  function disablePhoneUi() {
    if (media.matches) return;
    document.documentElement.classList.remove('compare-phone');
    shell.classList.remove('compare-phone-status', 'compare-phone-legend-open');
  }

  function syncMode() {
    if (media.matches) enablePhoneUi();
    else disablePhoneUi();
  }

  syncMode();
  media.addEventListener?.('change', syncMode);

  const timeline = document.querySelector('.timeline-section');
  if (timeline) {
    new MutationObserver(() => {
      if (media.matches) ensureSpeedPicker();
    }).observe(timeline, { childList: true, subtree: true });
  }
})();
