/* Scope-limited PWA: public assets only. Never cache files picked by users. */
const VERSION = "2026-11-09-a";
const SHELL = "complexity-pwa-shell-" + VERSION;
const ROOT = new URL(self.registration.scope);
const CORE = ["cellular-automata/index.html","cellular-automata/script.js","cellular-automata/style.css","game-of-life/index.html","game-of-life/script.js","game-of-life/style.css","genetic-algorithm-playground/index.html","genetic-algorithm-playground/js/charts/canvas.js","genetic-algorithm-playground/js/charts/lineChart.js","genetic-algorithm-playground/js/constants.js","genetic-algorithm-playground/js/fitness/buildProblem.js","genetic-algorithm-playground/js/fitness/nk.js","genetic-algorithm-playground/js/fitness/onemax.js","genetic-algorithm-playground/js/fitness/trap.js","genetic-algorithm-playground/js/format.js","genetic-algorithm-playground/js/ga/diversity.js","genetic-algorithm-playground/js/ga/genome.js","genetic-algorithm-playground/js/ga/hillClimber.js","genetic-algorithm-playground/js/ga/operators.js","genetic-algorithm-playground/js/ga/runGA.js","genetic-algorithm-playground/js/ga/summary.js","genetic-algorithm-playground/js/main.js","genetic-algorithm-playground/js/rng.js","genetic-algorithm-playground/js/state.js","genetic-algorithm-playground/js/ui/config.js","genetic-algorithm-playground/js/ui/dom.js","genetic-algorithm-playground/js/ui/events.js","genetic-algorithm-playground/js/ui/problemUI.js","genetic-algorithm-playground/js/ui/results.js","genetic-algorithm-playground/style.css","genetic-algorithm-playground/test/pure-functions.test.js","index.html","information-entropy/index.html","information-entropy/script.js","information-entropy/style.css","logistic-map/index.html","logistic-map/script.js","logistic-map/style.css","network-science-lab/index.html","network-science-lab/script.js","network-science-lab/style.css","robby-ga/index.html","robby-ga/js/constants.js","robby-ga/js/drawing/drawFitnessChart.js","robby-ga/js/drawing/drawWorld.js","robby-ga/js/ga.js","robby-ga/js/main.js","robby-ga/js/percept.js","robby-ga/js/policy.js","robby-ga/js/rng.js","robby-ga/js/selfChecks.js","robby-ga/js/simulation.js","robby-ga/js/ui/appState.js","robby-ga/js/ui/controls.js","robby-ga/js/ui/demoController.js","robby-ga/js/ui/dom.js","robby-ga/js/ui/policyInspector.js","robby-ga/js/ui/trainingController.js","robby-ga/js/world.js","robby-ga/style.css","scaling-laws/index.html","scaling-laws/js/allometry.js","scaling-laws/js/calculator.js","scaling-laws/js/city.js","scaling-laws/js/data.js","scaling-laws/js/dom.js","scaling-laws/js/explorer.js","scaling-laws/js/format.js","scaling-laws/js/logLog.js","scaling-laws/js/main.js","scaling-laws/js/math.js","scaling-laws/js/plot.js","scaling-laws/style.css","shape-of-high-dimensions/assets/index-D-1eedHa.js","shape-of-high-dimensions/assets/index-bRvcwjuD.css","shape-of-high-dimensions/index.html","pwa-register.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","icons/icon.svg"];
const CORE_URLS = CORE.map(p => new URL(p,ROOT).href);
const CORE_SET = new Set(CORE_URLS);
const HOME = new URL('index.html',ROOT).href;

async function networkFirst(request, cacheName, key=request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && (response.type==='basic' || response.type==='cors')) await cache.put(key,response.clone());
    return response;
  } catch(e) {
    const cached = await cache.match(key);
    if (cached) return cached;
    throw e;
  }
}
self.addEventListener('install',event => event.waitUntil((async () => {
  await (await caches.open(SHELL)).addAll(CORE_URLS);
  
  await self.skipWaiting();
})()));
self.addEventListener('activate',event => event.waitUntil((async () => {
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('complexity-pwa-shell-')&&k!==SHELL).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event => {
  const request=event.request;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  
  if(url.origin!==ROOT.origin || !url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==='navigate') {
    if (true) {
      const key = new URL(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname,url.origin).href;
      event.respondWith(networkFirst(request,SHELL,key));
    }
    return;
  }
  const canonical = new URL(url.href);canonical.search='';canonical.hash='';
  if(CORE_SET.has(canonical.href)){event.respondWith(networkFirst(request,SHELL,canonical.href));return;}
  const rel=url.pathname.slice(ROOT.pathname.length);
  if(/^shape-of-high-dimensions\/assets\/.*\.(?:woff2?|ttf)$/i.test(rel)) event.respondWith(networkFirst(request,"complexity-pwa-fonts-v1"));
});
