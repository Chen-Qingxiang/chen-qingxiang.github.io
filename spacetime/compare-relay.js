(() => {
  'use strict';
  const RELAY = new Set(['lishimin','wuzetian','lilongji','hanyu','dumu','likeyong','licunxu','zhaokuangyin','wangyucheng','fanzhongyan','sudongpo']);
  document.addEventListener('click', event => {
    const btn = event.target.closest('#relayBtn');
    if (!btn) return;
    const inputs = [...document.querySelectorAll('#peoplePicks input[data-person]')];
    if (!inputs.length) return;
    const union = document.querySelector('[data-range-mode="union"]');
    if (union && !union.classList.contains('active')) union.click();
    inputs.filter(input => RELAY.has(input.dataset.person) && !input.checked).forEach(input => {
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    inputs.filter(input => !RELAY.has(input.dataset.person) && input.checked).forEach(input => {
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
})();
