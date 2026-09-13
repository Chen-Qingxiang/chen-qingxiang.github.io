(() => {
  'use strict';

  const registry = (Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [])
    .filter(entry => entry.comparable !== false);
  const select = document.getElementById('personSelect');
  const realFetch = window.fetch.bind(window);
  const params = new URLSearchParams(location.search);
  const requested = params.get('person');
  const fallback = registry[0]?.id || 'lubu';
  const currentId = registry.some(entry => entry.id === requested) ? requested : fallback;
  const current = registry.find(entry => entry.id === currentId) || registry[0];
  const loadedScripts = new Set();
  const expandedBundles = [
    './expanded-people-1.js',
    './expanded-people-2.js',
    './expanded-people-3.js',
    './expanded-people-4.js',
    './expanded-people-5.js',
    './expanded-people-6.js'
  ];

  const markerChar = current?.char || current?.label?.slice(0, 1) || '人';
  document.documentElement.style.setProperty('--marker-char', `"${markerChar}"`);
  document.documentElement.style.setProperty('--person-accent', current?.color || '#b62826');

  if (window.L?.map) {
    const originalMap = L.map;
    L.map = function(target, options = {}) {
      const next = target === 'map' ? { ...options, minZoom: 2 } : options;
      return originalMap.call(this, target, next);
    };
  }

  function loadScript(url) {
    if (loadedScripts.has(url)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onload = () => { loadedScripts.add(url); resolve(); };
      script.onerror = () => reject(new Error(`无法载入 ${url}`));
      document.head.appendChild(script);
    });
  }

  async function resolveGlobal(globalName) {
    if (window[globalName]) return window[globalName];
    for (const url of expandedBundles) {
      await loadScript(url);
      if (window[globalName]) return window[globalName];
    }
    return null;
  }

  async function responseForEntry(entry) {
    const loader = entry?.loader || {};
    if (loader.type === 'json') return realFetch(loader.url, { cache: 'no-cache' });

    let raw = null;
    if (loader.type === 'scripts') {
      for (const url of (loader.urls || [])) await loadScript(url);
      raw = window[loader.global];
    } else if (loader.type === 'global') {
      raw = await resolveGlobal(loader.global);
    }

    if (!raw) throw new Error(`${entry?.label || entry?.id || '人物'}：数据未生成`);
    return new Response(JSON.stringify(raw), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  if (select) {
    select.innerHTML = '';

    const peopleGroup = document.createElement('optgroup');
    peopleGroup.label = '人物';
    registry.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = `${entry.label} · ${entry.period || ''}`;
      option.selected = entry.id === currentId;
      peopleGroup.appendChild(option);
    });
    select.appendChild(peopleGroup);

    const specialGroup = document.createElement('optgroup');
    specialGroup.label = '特别案例';
    const swallow = document.createElement('option');
    swallow.value = '__swallow__';
    swallow.textContent = '燕子迁徙 · 多物种 / 多种群';
    specialGroup.appendChild(swallow);
    select.appendChild(specialGroup);

    select.addEventListener('change', () => {
      if (select.value === '__swallow__') {
        location.href = './swallow.html';
        return;
      }
      const url = new URL(location.href);
      url.searchParams.set('person', select.value);
      location.href = url.toString();
    });
  }

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url === './data/lubu.json' || url.endsWith('/spacetime/data/lubu.json')) {
      return responseForEntry(current).catch(error => {
        console.error('Single-person registry loader failed:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      });
    }
    return realFetch(input, init);
  };

  if (!requested && currentId) {
    const url = new URL(location.href);
    url.searchParams.set('person', currentId);
    history.replaceState(null, '', url);
  }
})();
