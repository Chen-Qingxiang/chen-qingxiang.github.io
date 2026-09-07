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
    const timeout = setTimeout(() => {script.remove(); stylesheet.remove(); reject(new Error('地图引擎加载超时'));}, 25000);
    script.onload = () => {clearTimeout(timeout); resolve();};
    script.onerror = () => {clearTimeout(timeout); script.remove(); stylesheet.remove(); reject(new Error('地图引擎下载失败'));};
    document.head.append(script);
  });
}
async function boot() {
  let loaded = false;
  for (const base of bases) {
    try { await loadEngine(base); loaded = Boolean(window.Cesium); if (loaded) break; }
    catch { loadingMessage.textContent = '正在尝试备用地图引擎线路…'; }
  }
  if (!loaded) throw new Error('地图引擎暂时无法连接。请检查网络后重试（需访问 jsDelivr 或 unpkg）。');
  loadingMessage.textContent = '连接地形与城市数据…';
  const [{start}, {installTouchRecovery}] = await Promise.all([import('./app.js'), import('./touch.js')]);
  await start(window.Cesium);
  installTouchRecovery(document.querySelector('#globe canvas'));
}
boot().catch(error => {
  console.error(error);
  document.querySelector('.loading-screen h2').textContent = '地图暂时没有展开';
  loadingMessage.textContent = /WebGL|context|rendering/i.test(error.message) ? '浏览器未能启动 WebGL。请开启硬件加速，或换用支持 WebGL 的浏览器后重试。' : error.message;
  document.querySelector('.loading-track').hidden = true;
  const button = document.createElement('button'); button.textContent = '重新加载'; button.onclick = () => location.reload(); document.getElementById('loading').append(button);
});
