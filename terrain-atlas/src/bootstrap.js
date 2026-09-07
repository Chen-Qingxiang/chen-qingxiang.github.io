import {applyStaticLanguage, initialLanguage, t} from './i18n.js';

const language = applyStaticLanguage(initialLanguage());
const bases = [
  'https://cdn.jsdelivr.net/npm/cesium@1.145.0/Build/Cesium/',
  'https://unpkg.com/cesium@1.145.0/Build/Cesium/',
];
const loadingMessage = document.getElementById('loading-message');
async function loadEngine(base) {
  window.CESIUM_BASE_URL = base;
  const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = `${base}Widgets/widgets.css`;
  document.head.append(stylesheet);
  await new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = `${base}Cesium.js`; script.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => {script.remove(); stylesheet.remove(); reject(new Error(t(language,'engineTimeout')));}, 25000);
    script.onload = () => {clearTimeout(timeout); resolve();};
    script.onerror = () => {clearTimeout(timeout); script.remove(); stylesheet.remove(); reject(new Error(t(language,'engineDownload')));};
    document.head.append(script);
  });
}
async function boot() {
  let loaded = false;
  for (const base of bases) {
    try { await loadEngine(base); loaded = Boolean(window.Cesium); if (loaded) break; }
    catch { loadingMessage.textContent = t(language,'engineRetry'); }
  }
  if (!loaded) throw new Error(t(language,'engineConnection'));
  loadingMessage.textContent = t(language,'connectingTerrain');
  const [{start}, {installTouchRecovery}, {installTouchResolution}] = await Promise.all([
    import('./app.js'), import('./touch.js'), import('./display.js'),
  ]);
  installTouchResolution(window.Cesium);
  await start(window.Cesium);
  installTouchRecovery(document.querySelector('#globe canvas'));
}
boot().catch(error => {
  console.error(error);
  document.querySelector('.loading-screen h2').textContent = t(language,'mapUnavailable');
  loadingMessage.textContent = /WebGL|context|rendering/i.test(error.message) ? t(language,'webglUnavailable') : error.message;
  document.querySelector('.loading-track').hidden = true;
  const button = document.createElement('button'); button.textContent = t(language,'reload'); button.onclick = () => location.reload(); document.getElementById('loading').append(button);
});
