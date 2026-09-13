(() => {
  'use strict';

  const registry = (Array.isArray(window.SPACETIME_COMPARE_REGISTRY) ? window.SPACETIME_COMPARE_REGISTRY : [])
    .filter(entry => entry.comparable !== false);
  const select = document.getElementById('personSelect');
  const realFetch = window.fetch.bind(window);
  const params = new URLSearchParams(location.search);
  const activeCase = params.get('case');
  const isSwallow = activeCase === 'swallow';
  const isElCid = activeCase === 'elcid';
  const isSpecialCase = isSwallow || isElCid;
  const requested = params.get('person');
  const fallback = registry[0]?.id || 'lubu';
  const currentId = registry.some(entry => entry.id === requested) ? requested : fallback;
  const elCidEntry = {
    id: 'elcid',
    label: '熙德',
    char: '熙',
    color: '#815a35',
    period: '约 1043–1099',
    loader: { type: 'json', url: './data/elcid.json' }
  };
  const current = isElCid ? elCidEntry : (registry.find(entry => entry.id === currentId) || registry[0]);
  const loadedScripts = new Set();
  const expandedBundles = [
    './expanded-people-1.js',
    './expanded-people-2.js',
    './expanded-people-3.js',
    './expanded-people-4.js',
    './expanded-people-5.js',
    './expanded-people-6.js'
  ];

  window.SPACETIME_SINGLE_VIEW = isSwallow ? 'swallow' : 'person';

  function setSingleUrl(kind, value) {
    const url = new URL(location.href);
    url.search = '';
    if (kind === 'case') url.searchParams.set('case', value);
    else url.searchParams.set('person', value);
    location.href = url.toString();
  }

  function mountSwallowView() {
    document.body.classList.add('swallow-view');
    document.title = '燕子迁徙 · 单人模式 · Spacetime Trails';

    const eyebrow = document.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'SPACETIME TRAILS · SINGLE · MIGRATION';
    const name = document.getElementById('personName');
    const period = document.getElementById('personPeriod');
    const subtitle = document.getElementById('personSubtitle');
    if (name) name.textContent = '燕子迁徙 · 视频三线 × 论文校正';
    if (period) period.textContent = '多物种 / 多种群';
    if (subtitle) subtitle.textContent = '复现候鸟宏观三线，并用可核查的 geolocator 研究校正；路线证据等级与日期精度分开标注。';

    const fit = document.getElementById('fitRouteBtn');
    if (fit) {
      fit.id = 'fitBtn';
      fit.textContent = '总览路线';
    }
    const follow = document.getElementById('followBtn');
    if (follow) follow.hidden = true;
    const fileButton = document.querySelector('.file-button');
    if (fileButton) fileButton.hidden = true;

    const terrainOpacity = document.getElementById('terrainOpacity');
    if (terrainOpacity) terrainOpacity.value = '27';
    const terrainValue = document.getElementById('terrainOpacityValue');
    if (terrainValue) {
      terrainValue.id = 'terrainValue';
      terrainValue.textContent = '27%';
    }

    const stats = document.querySelector('.map-stats');
    if (stats) {
      stats.innerHTML = '<div><span class="stat-label">当前层</span><strong id="modeLabel">视频三线</strong></div><div><span class="stat-label">路线</span><strong id="routeCount">3 条</strong></div>';
    }
    const legend = document.querySelector('.map-panel .legend');
    if (legend) {
      legend.id = 'mapNote';
      legend.className = 'map-overlay legend map-mode-note';
      legend.textContent = '粗线表示宏观迁飞通道，不等于单只鸟逐点 GPS。';
    }

    const story = document.querySelector('.story-panel');
    if (story) {
      story.setAttribute('aria-label', '燕子迁徙路线');
      story.innerHTML = `
        <div class="mode-tabs" id="modeTabs">
          <button class="mode-tab active" data-mode="video" type="button">视频三线</button>
          <button class="mode-tab" data-mode="research" type="button">论文追踪</button>
        </div>
        <div class="event-index" id="routeIndex" style="margin-top:14px">路线 01 / 03</div>
        <div class="event-year" id="routeSub">北京雨燕 · Apus apus pekinensis</div>
        <h2 id="routeTitle">北京 → 西南非洲</h2>
        <div class="place-line"><span class="place-dot"></span><span id="routePlace"></span></div>
        <div class="evidence-row"><span class="evidence high" id="evidenceBadge">直接追踪 · 高</span><span class="species-note" id="speciesNote"></span></div>
        <p class="event-summary" id="routeSummary"></p>
        <div class="route-meta" id="routeMeta"></div>
        <div class="event-tags" id="routeTags"></div>
        <div class="route-list" id="routeList"></div>
        <div class="source-block">
          <span id="sourceHeading">依据</span>
          <p id="routeSource"></p>
          <a class="source-link" id="sourceLink" target="_blank" rel="noopener">查看主要来源 ↗</a>
          <div class="paper-note" id="precisionNote"></div>
        </div>
        <div class="event-nav"><button id="prevBtn" type="button">← 上一条</button><button id="nextBtn" type="button">下一条 →</button></div>`;
    }

    const timeline = document.querySelector('.timeline-panel');
    if (timeline) {
      timeline.setAttribute('aria-label', '燕子迁徙时间轴');
      timeline.innerHTML = `
        <div class="playback-row">
          <button class="play-button" id="playBtn" type="button">▶</button>
          <div class="clock"><strong id="clockTime"></strong><span id="clockPhase"></span></div>
          <div class="speed-group" aria-label="播放速度">
            <button type="button" data-speed="0.5">0.5×</button>
            <button type="button" data-speed="1" class="active">1×</button>
            <button type="button" data-speed="2">2×</button>
            <button type="button" data-speed="4">4×</button>
          </div>
          <span class="timeline-precision" id="timelinePrecision"></span>
        </div>
        <div class="timeline-wrap">
          <div class="timeline-track">
            <div class="timeline-progress" id="timelineProgress"></div>
            <div class="timeline-milestones" id="timelineMilestones"></div>
            <input id="timeRange" type="range" min="0" max="1000" value="0" aria-label="燕子迁徙时间轴" />
          </div>
          <div class="timeline-labels"><span id="timelineStart"></span><span id="timelineEnd"></span></div>
        </div>
        <p class="timeline-hint" id="timelineHint"></p>`;
    }
  }

  if (select) {
    select.innerHTML = '';

    const peopleGroup = document.createElement('optgroup');
    peopleGroup.label = '人物';
    registry.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = `${entry.label} · ${entry.period || ''}`;
      option.selected = !isSpecialCase && entry.id === currentId;
      peopleGroup.appendChild(option);
    });
    select.appendChild(peopleGroup);

    const specialGroup = document.createElement('optgroup');
    specialGroup.label = '特别案例';

    const swallow = document.createElement('option');
    swallow.value = '__swallow__';
    swallow.textContent = '燕子迁徙 · 多物种 / 多种群';
    swallow.selected = isSwallow;
    specialGroup.appendChild(swallow);

    const elcid = document.createElement('option');
    elcid.value = '__elcid__';
    elcid.textContent = '熙德 · Rodrigo Díaz de Vivar · 约 1043–1099';
    elcid.selected = isElCid;
    specialGroup.appendChild(elcid);

    select.appendChild(specialGroup);

    select.addEventListener('change', () => {
      if (select.value === '__swallow__') setSingleUrl('case', 'swallow');
      else if (select.value === '__elcid__') setSingleUrl('case', 'elcid');
      else setSingleUrl('person', select.value);
    });
  }

  if (isSwallow) {
    mountSwallowView();
    return;
  }

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

  if (!requested && !isElCid && currentId) {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('person', currentId);
    history.replaceState(null, '', url);
  }
})();
