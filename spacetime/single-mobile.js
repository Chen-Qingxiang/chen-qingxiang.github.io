(() => {
  'use strict';

  const media = window.matchMedia('(max-width: 720px)');

  function setupSpeedPicker() {
    const row = document.querySelector('.timeline-panel .playback-row');
    const group = row?.querySelector('.speed-group');
    if (!row || !group || row.querySelector('.mobile-speed-picker')) return;

    const buttons = [...group.querySelectorAll('[data-speed]')];
    if (!buttons.length) return;

    const label = document.createElement('label');
    label.className = 'mobile-speed-picker';
    label.innerHTML = '<span>速度</span>';

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
      if (button) button.click();
    });

    const sync = () => {
      const active = buttons.findIndex(button => button.classList.contains('active'));
      if (active >= 0 && select.value !== String(active)) select.value = String(active);
    };

    const observer = new MutationObserver(sync);
    buttons.forEach(button => observer.observe(button, { attributes: true, attributeFilter: ['class'] }));

    label.appendChild(select);
    row.appendChild(label);
    sync();
  }

  function markMobile() {
    document.documentElement.classList.toggle('single-phone', media.matches);
    if (media.matches) setupSpeedPicker();
  }

  markMobile();
  media.addEventListener?.('change', markMobile);

  // The special-case router can replace the timeline before its player script executes.
  const timeline = document.querySelector('.timeline-panel');
  if (timeline) {
    new MutationObserver(() => {
      if (media.matches) setupSpeedPicker();
    }).observe(timeline, { childList: true, subtree: true });
  }
})();
