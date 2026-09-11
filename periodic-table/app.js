(() => {
  'use strict';

  const elements = window.ELEMENTS || [];
  const categories = window.CATEGORY_META || {};
  const xrayApi = window.XRAY_PHYSICS || null;

  const els = {
    board: document.getElementById('elementsGrid'),
    groups: document.getElementById('groupLabels'),
    periods: document.getElementById('periodLabels'),
    lanthanides: document.getElementById('lanthanides'),
    actinides: document.getElementById('actinides'),
    legend: document.getElementById('legend'),
    focusCard: document.getElementById('focusCard'),
    focusNumber: document.getElementById('focusNumber'),
    focusCategory: document.getElementById('focusCategory'),
    focusSymbol: document.getElementById('focusSymbol'),
    focusZh: document.getElementById('focusZh'),
    focusEnglish: document.getElementById('focusEnglish'),
    focusIpa: document.getElementById('focusIpa'),
    speakChineseButton: document.getElementById('speakChineseButton'),
    speakEnglishButton: document.getElementById('speakEnglishButton'),
    voiceStatus: document.getElementById('voiceStatus'),
    xrayPanel: document.getElementById('xrayPanel'),
    xraySymbol: document.getElementById('xraySymbol'),
    xrayName: document.getElementById('xrayName'),
    xrayZh: document.getElementById('xrayZh'),
    xrayMeta: document.getElementById('xrayMeta'),
    xrayDbLink: document.getElementById('xrayDbLink'),
    xrayEnergy: document.getElementById('xrayEnergy'),
    xrayEnergyNumber: document.getElementById('xrayEnergyNumber'),
    xrayEnergyText: document.getElementById('xrayEnergyText'),
    xrayTotal: document.getElementById('xrayTotal'),
    xrayLinear: document.getElementById('xrayLinear'),
    xrayHvl: document.getElementById('xrayHvl'),
    xrayHvlUnit: document.getElementById('xrayHvlUnit'),
    xrayDominant: document.getElementById('xrayDominant'),
    xrayProcesses: document.getElementById('xrayProcesses'),
    xrayEdges: document.getElementById('xrayEdges'),
    xrayLines: document.getElementById('xrayLines'),
    xrayPlot: document.getElementById('xrayPlot'),
    xrayChartNote: document.getElementById('xrayChartNote'),
    xrayStatus: document.getElementById('xrayStatus')
  };

  const cellsByNumber = new Map();
  let current = elements[0];
  let preferredEnglishVoice = null;
  let preferredChineseVoice = null;
  let activeChineseAudio = null;
  let xrayEnergy = 60;
  let xrayLoadStarted = false;
  let xrayRenderFrame = null;

  const chineseSpeechFallback = new Map([
    [104, '炉'], [105, '杜'], [106, '喜'], [107, '波'], [108, '黑'],
    [109, '麦'], [110, '达'], [111, '伦'], [112, '哥'], [113, '你'],
    [114, '夫'], [115, '莫'], [116, '立'], [117, '田'], [118, '奥']
  ]);

  const categoryOrder = ['alkali','alkaline','transition','post','metalloid','nonmetal','halogen','noble','lanthanide','actinide'];
  const shellOrder = ['K','L1','L2','L3','M1','M2','M3','M4','M5'];
  const shellLabels = {
    K: 'K', L1: 'L₁', L2: 'L₂', L3: 'L₃',
    M1: 'M₁', M2: 'M₂', M3: 'M₃', M4: 'M₄', M5: 'M₅'
  };
  const majorLines = [
    { key: 'KL3', label: 'Kα₁', transition: 'K–L₃' },
    { key: 'KL2', label: 'Kα₂', transition: 'K–L₂' },
    { key: 'KM3', label: 'Kβ₁', transition: 'K–M₃' },
    { key: 'KM2', label: 'Kβ₃', transition: 'K–M₂' },
    { key: 'L3M5', label: 'Lα₁', transition: 'L₃–M₅' },
    { key: 'L2M4', label: 'Lβ₁', transition: 'L₂–M₄' },
    { key: 'L1M3', label: 'Lβ₃', transition: 'L₁–M₃' },
    { key: 'L2N4', label: 'Lγ₁', transition: 'L₂–N₄' }
  ];
  const processMeta = {
    photo: { label: 'Photoelectric', zh: '光电', className: 'photo' },
    compt: { label: 'Compton', zh: '康普顿', className: 'compt' },
    rayl: { label: 'Rayleigh', zh: '相干', className: 'rayl' }
  };

  function renderLegend() {
    categoryOrder.forEach(key => {
      const meta = categories[key];
      if (!meta) return;
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-swatch" style="background:var(--${key})"></span><span>${meta.zh}</span>`;
      els.legend.appendChild(item);
    });
  }

  function renderAxes() {
    for (let i = 1; i <= 18; i += 1) {
      const node = document.createElement('span');
      node.textContent = i;
      els.groups.appendChild(node);
    }
    for (let i = 1; i <= 7; i += 1) {
      const node = document.createElement('span');
      node.textContent = i;
      els.periods.appendChild(node);
    }
  }

  function createElementCell(element, options = {}) {
    const { compact = false } = options;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'element-cell';
    cell.dataset.number = String(element.n);
    cell.dataset.category = element.c;
    cell.setAttribute('aria-label', `${element.n} ${element.s} ${element.zh} ${element.en} ${element.ipa}`);

    if (!compact && element.g) {
      cell.style.gridColumn = String(element.g);
      cell.style.gridRow = String(element.p);
    }

    cell.innerHTML = `
      <span class="cell-number">${element.n}</span>
      <div class="cell-symbol">${element.s}</div>
      <div class="cell-zh" lang="zh-CN">${element.zh}</div>
      <div class="cell-en" lang="en">${element.en}</div>
    `;

    cell.addEventListener('click', () => selectElement(element));

    if (!cellsByNumber.has(element.n)) cellsByNumber.set(element.n, []);
    cellsByNumber.get(element.n).push(cell);
    return cell;
  }

  function createPlaceholder(kind) {
    const isLanthanide = kind === 'lanthanide';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'element-cell placeholder-cell';
    button.dataset.category = kind;
    button.style.gridColumn = '3';
    button.style.gridRow = isLanthanide ? '6' : '7';
    button.innerHTML = isLanthanide
      ? `<span class="cell-number">57–71</span><div class="cell-symbol">La–Lu</div><div class="cell-zh">镧系</div><div class="cell-en">Lanthanides</div>`
      : `<span class="cell-number">89–103</span><div class="cell-symbol">Ac–Lr</div><div class="cell-zh">锕系</div><div class="cell-en">Actinides</div>`;
    button.addEventListener('click', () => {
      (isLanthanide ? els.lanthanides : els.actinides).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
    });
    return button;
  }

  function renderTable() {
    els.board.appendChild(createPlaceholder('lanthanide'));
    els.board.appendChild(createPlaceholder('actinide'));

    elements.forEach(element => {
      if (element.g) els.board.appendChild(createElementCell(element));
      if (element.c === 'lanthanide') els.lanthanides.appendChild(createElementCell(element, { compact: true }));
      if (element.c === 'actinide') els.actinides.appendChild(createElementCell(element, { compact: true }));
    });
  }

  function selectElement(element) {
    current = element;
    document.querySelectorAll('.element-cell.is-selected').forEach(cell => cell.classList.remove('is-selected'));
    (cellsByNumber.get(element.n) || []).forEach(cell => cell.classList.add('is-selected'));

    const meta = categories[element.c] || { zh: '', en: '' };
    els.focusCard.dataset.category = element.c;
    els.focusNumber.textContent = element.n;
    els.focusCategory.textContent = `${meta.zh} · ${meta.en}`;
    els.focusSymbol.textContent = element.s;
    els.focusZh.textContent = element.zh;
    els.focusEnglish.textContent = element.en;
    els.focusIpa.textContent = element.ipa;
    els.voiceStatus.textContent = '';
    document.title = `${element.s} · ${element.zh} · ${element.en} | 元素周期表`;
    updateXrayHeader(element);
    scheduleXrayRender();
  }

  function pickVoices() {
    if (!('speechSynthesis' in window)) {
      els.voiceStatus.textContent = '当前浏览器不支持系统语音；中文按钮将尝试在线备用语音。';
      els.speakEnglishButton.disabled = true;
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang));
    const chineseVoices = voices.filter(v => /^(?:zh|cmn)(?:[-_]|$)/i.test(v.lang));

    const findFirst = (list, tests) => {
      for (const test of tests) {
        const found = list.find(test);
        if (found) return found;
      }
      return list[0] || null;
    };

    preferredEnglishVoice = findFirst(englishVoices, [
      v => /^en-AU$/i.test(v.lang), v => /en-AU/i.test(v.lang),
      v => /^en-GB$/i.test(v.lang), v => /en-GB/i.test(v.lang),
      v => /^en-US$/i.test(v.lang), v => /en-US/i.test(v.lang)
    ]);

    preferredChineseVoice = findFirst(chineseVoices, [
      v => /^zh-CN$/i.test(v.lang), v => /zh[-_]Hans/i.test(v.lang),
      v => /zh[-_]CN/i.test(v.lang), v => /^cmn-CN$/i.test(v.lang),
      v => /^zh(?:[-_]|$)/i.test(v.lang), v => /^cmn(?:[-_]|$)/i.test(v.lang)
    ]);
  }

  function speakWithSystem(text, voice, lang, rate, onError) {
    if (!('speechSynthesis' in window) || !text) {
      onError?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onerror = () => onError?.();
    window.setTimeout(() => window.speechSynthesis.speak(utterance), 20);
  }

  function playOnlineChinese(text) {
    if (!text) return;
    if (activeChineseAudio) {
      activeChineseAudio.pause();
      activeChineseAudio = null;
    }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    activeChineseAudio = audio;
    audio.play().then(() => {
      els.voiceStatus.textContent = '中文：在线普通话语音';
    }).catch(() => {
      els.voiceStatus.textContent = '中文发音失败：浏览器没有普通话语音，在线备用语音也未能播放。';
    });
  }

  function speakChinese() {
    if (!current) return;
    const text = chineseSpeechFallback.get(current.n) || current.zh;
    els.voiceStatus.textContent = '';
    if (preferredChineseVoice) {
      speakWithSystem(text, preferredChineseVoice, 'zh-CN', 0.76, () => playOnlineChinese(text));
    } else {
      playOnlineChinese(text);
    }
  }

  function speakEnglish() {
    if (!current) return;
    els.voiceStatus.textContent = '';
    speakWithSystem(current.en, preferredEnglishVoice, 'en-AU', 0.82, () => {
      els.voiceStatus.textContent = '英文发音不可用。';
    });
  }

  function updateXrayHeader(element) {
    if (!els.xrayPanel || !element) return;
    els.xraySymbol.textContent = element.s;
    els.xrayName.textContent = element.en;
    els.xrayZh.textContent = element.zh;
    els.xrayDbLink.href = `https://xraydb.xrayabsorption.org/element/${encodeURIComponent(element.s)}`;

    if (xrayApi?.state.ready) {
      const weight = xrayApi.getWeight(element.n);
      const density = xrayApi.getDensity(element.n);
      const parts = [`Z = ${element.n}`];
      if (Number.isFinite(weight) && weight > 0) parts.push(`${formatNumber(weight, 4)} g/mol`);
      if (Number.isFinite(density) && density > 0) parts.push(`ρ = ${formatDensity(density)} g/cm³`);
      els.xrayMeta.textContent = parts.join(' · ');
    } else {
      els.xrayMeta.textContent = `Z = ${element.n}`;
    }
  }

  function formatNumber(value, significant = 4) {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0';
    const abs = Math.abs(value);
    if (abs >= 10000 || abs < 0.001) return value.toExponential(2);
    if (abs >= 100) return value.toFixed(1);
    if (abs >= 10) return value.toFixed(2);
    if (abs >= 1) return value.toFixed(3);
    return Number(value.toPrecision(significant)).toString();
  }

  function formatDensity(value) {
    if (!Number.isFinite(value) || value <= 0) return '—';
    if (value < 0.01) return value.toExponential(3);
    return formatNumber(value, 4);
  }

  function formatEnergy(value) {
    if (!Number.isFinite(value)) return '—';
    if (value >= 100) return value.toFixed(1);
    if (value >= 10) return value.toFixed(2);
    if (value >= 1) return value.toFixed(3);
    return value.toFixed(4);
  }

  function formatHvl(linearMu) {
    if (!Number.isFinite(linearMu) || linearMu <= 0) return { value: '—', unit: 'mm' };
    const cm = Math.LN2 / linearMu;
    if (cm < 0.1) return { value: formatNumber(cm * 10, 4), unit: 'mm' };
    if (cm < 10) return { value: formatNumber(cm, 4), unit: 'cm' };
    return { value: formatNumber(cm / 100, 4), unit: 'm' };
  }

  function setXrayEnergy(value) {
    const next = Math.min(150, Math.max(1, Number(value) || 1));
    xrayEnergy = next;
    els.xrayEnergy.value = String(next);
    els.xrayEnergyNumber.value = next.toFixed(1);
    els.xrayEnergyText.textContent = `${next.toFixed(1)} keV`;
    scheduleXrayRender();
  }

  function scheduleXrayRender() {
    if (!xrayApi?.state.ready || !current) return;
    if (xrayRenderFrame) cancelAnimationFrame(xrayRenderFrame);
    xrayRenderFrame = requestAnimationFrame(() => {
      xrayRenderFrame = null;
      renderXrayPanel(current);
    });
  }

  function renderXrayPanel(element) {
    if (!xrayApi?.state.ready || !element) return;
    updateXrayHeader(element);

    const interactions = xrayApi.interactions(element.n, xrayEnergy);
    const edges = xrayApi.getEdges(element.n);
    const lines = xrayApi.getLines(element.n);

    if (!interactions) {
      renderXrayUnavailable(element);
      return;
    }

    const density = xrayApi.getDensity(element.n);
    const linearMu = Number.isFinite(density) && density > 0 ? interactions.total * density : null;
    const hvl = formatHvl(linearMu);
    els.xrayTotal.textContent = formatNumber(interactions.total, 4);
    els.xrayLinear.textContent = Number.isFinite(linearMu) ? formatNumber(linearMu, 4) : '—';
    els.xrayHvl.textContent = hvl.value;
    els.xrayHvlUnit.textContent = hvl.unit;

    const processEntries = ['photo', 'compt', 'rayl'].map(key => ({
      key,
      value: interactions[key],
      share: interactions.total > 0 ? interactions[key] / interactions.total : 0,
      ...processMeta[key]
    }));
    processEntries.sort((a, b) => b.value - a.value);
    const dominant = processEntries[0];
    els.xrayDominant.textContent = `${dominant.label} · ${dominant.zh}`;

    els.xrayProcesses.innerHTML = processEntries.map(process => `
      <div class="process-row ${process.className}">
        <span class="process-label">${process.label}</span>
        <span class="process-track"><span class="process-fill" style="width:${Math.max(0, Math.min(100, process.share * 100)).toFixed(2)}%"></span></span>
        <span class="process-value">${formatNumber(process.value, 4)} · ${(process.share * 100).toFixed(1)}%</span>
      </div>
    `).join('');

    renderEdges(edges);
    renderLines(lines);
    drawAttenuationPlot(element.n, edges, interactions);

    els.xrayStatus.classList.remove('is-error');
    els.xrayStatus.textContent = 'Cross sections: xraylib · photoelectric + incoherent (Compton) + coherent (Rayleigh).';
  }

  function renderXrayUnavailable(element) {
    els.xrayTotal.textContent = '—';
    els.xrayLinear.textContent = '—';
    els.xrayHvl.textContent = '—';
    els.xrayHvlUnit.textContent = 'mm';
    els.xrayDominant.textContent = '—';
    els.xrayProcesses.innerHTML = '<span class="empty-data">No tabulated attenuation data for this element.</span>';
    renderEdges(xrayApi.getEdges(element.n));
    renderLines(xrayApi.getLines(element.n));
    els.xrayPlot.innerHTML = emptyPlotMessage('No 1–150 keV attenuation table available');
    els.xrayChartNote.textContent = 'Binding energies or line energies may still be available above.';
    els.xrayStatus.classList.remove('is-error');
    els.xrayStatus.textContent = `xraylib attenuation tables do not cover Z = ${element.n}.`;
  }

  function renderEdges(edges) {
    if (!edges) {
      els.xrayEdges.innerHTML = '<span class="empty-data">No tabulated shell energies.</span>';
      return;
    }
    const chips = shellOrder
      .filter(shell => Number.isFinite(edges[shell]) && edges[shell] > 0)
      .map(shell => `<span class="signature-chip"><b>${shellLabels[shell]}</b><span>${formatEnergy(edges[shell])} keV</span></span>`);
    els.xrayEdges.innerHTML = chips.length ? chips.join('') : '<span class="empty-data">No tabulated shell energies.</span>';
  }

  function renderLines(lines) {
    if (!lines) {
      els.xrayLines.innerHTML = '<span class="empty-data">No major characteristic lines.</span>';
      return;
    }
    const chips = majorLines
      .filter(line => Number.isFinite(lines[line.key]) && lines[line.key] > 0)
      .map(line => `<span class="signature-chip"><b>${line.label}</b><span>${formatEnergy(lines[line.key])} keV</span><small>${line.transition}</small></span>`);
    els.xrayLines.innerHTML = chips.length ? chips.join('') : '<span class="empty-data">No major characteristic lines.</span>';
  }

  function emptyPlotMessage(message) {
    return `<text x="460" y="175" text-anchor="middle" class="tick-label">${message}</text>`;
  }

  function drawAttenuationPlot(z, edges, currentInteractions) {
    const width = 920;
    const height = 350;
    const pad = { left: 66, right: 18, top: 24, bottom: 43 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const minE = 1;
    const maxE = 150;

    const energies = [];
    const points = 300;
    for (let i = 0; i < points; i += 1) {
      energies.push(minE + (maxE - minE) * i / (points - 1));
    }
    if (edges) {
      Object.values(edges).forEach(edge => {
        if (!Number.isFinite(edge) || edge <= minE || edge >= maxE) return;
        energies.push(edge * (1 - 1e-6), edge, edge * (1 + 1e-6));
      });
    }
    energies.sort((a, b) => a - b);

    const series = { total: [], photo: [], compt: [], rayl: [] };
    const allPositive = [];
    energies.forEach(energy => {
      const values = xrayApi.interactions(z, energy);
      if (!values) return;
      ['total', 'photo', 'compt', 'rayl'].forEach(key => {
        const value = values[key];
        if (Number.isFinite(value) && value > 0) {
          series[key].push([energy, value]);
          allPositive.push(value);
        }
      });
    });

    if (!allPositive.length) {
      els.xrayPlot.innerHTML = emptyPlotMessage('No attenuation data in this energy range');
      return;
    }

    const rawMin = Math.log10(Math.min(...allPositive));
    const rawMax = Math.log10(Math.max(...allPositive));
    let yMin = Math.floor(rawMin);
    let yMax = Math.ceil(rawMax);
    if (yMax - yMin < 3) {
      const extra = (3 - (yMax - yMin)) / 2;
      yMin = Math.floor(yMin - extra);
      yMax = Math.ceil(yMax + extra);
    }
    const span = Math.max(1, yMax - yMin);

    const xScale = energy => pad.left + (energy - minE) / (maxE - minE) * plotW;
    const yScale = value => pad.top + (yMax - Math.log10(value)) / span * plotH;
    const pathFor = data => data.map((point, index) => `${index ? 'L' : 'M'}${xScale(point[0]).toFixed(2)},${yScale(point[1]).toFixed(2)}`).join(' ');

    const xTicks = [1, 25, 50, 75, 100, 125, 150];
    const yStep = Math.max(1, Math.ceil(span / 6));
    const yTicks = [];
    for (let exp = Math.ceil(yMin / yStep) * yStep; exp <= yMax; exp += yStep) yTicks.push(exp);

    const gridX = xTicks.map(tick => {
      const x = xScale(tick);
      return `<line class="grid" x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + plotH}" />\n<text class="tick-label" x="${x}" y="${height - 20}" text-anchor="middle">${tick}</text>`;
    }).join('');
    const gridY = yTicks.map(exp => {
      const y = pad.top + (yMax - exp) / span * plotH;
      return `<line class="grid" x1="${pad.left}" y1="${y}" x2="${pad.left + plotW}" y2="${y}" />\n<text class="tick-label" x="${pad.left - 9}" y="${y + 3}" text-anchor="end">1e${exp}</text>`;
    }).join('');

    const curveOrder = ['rayl', 'compt', 'photo', 'total'];
    const curves = curveOrder.map(key => `<path class="curve ${key}" d="${pathFor(series[key])}" />`).join('');

    const edgeKeys = ['K', 'L1', 'L2', 'L3'];
    const edgeMarkers = edges ? edgeKeys
      .filter(key => Number.isFinite(edges[key]) && edges[key] >= minE && edges[key] <= maxE)
      .map((key, index) => {
        const x = xScale(edges[key]);
        const y = pad.top + 11 + (index % 4) * 11;
        return `<line class="edge-marker" x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + plotH}" />\n<text class="edge-label" x="${x + 3}" y="${y}">${shellLabels[key]}</text>`;
      }).join('') : '';

    const currentX = xScale(xrayEnergy);
    const currentY = yScale(currentInteractions.total);
    const marker = `<line class="energy-marker" x1="${currentX}" y1="${pad.top}" x2="${currentX}" y2="${pad.top + plotH}" />\n<circle class="energy-dot" cx="${currentX}" cy="${currentY}" r="4.2" />`;

    els.xrayPlot.innerHTML = `
      ${gridX}
      ${gridY}
      <line class="axis" x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" />
      <line class="axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" />
      <text class="axis-label" x="${pad.left + plotW / 2}" y="${height - 4}" text-anchor="middle">Photon energy (keV)</text>
      <text class="axis-label" x="14" y="${pad.top + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${pad.top + plotH / 2})">µ/ρ (cm²/g)</text>
      ${edgeMarkers}
      ${curves}
      ${marker}
    `;
    els.xrayChartNote.textContent = `${xrayEnergy.toFixed(1)} keV · total µ/ρ = ${formatNumber(currentInteractions.total, 4)} cm²/g`;
  }

  function loadXrayData() {
    if (xrayLoadStarted || !xrayApi || !els.xrayPanel) return;
    xrayLoadStarted = true;
    els.xrayStatus.classList.remove('is-error');
    els.xrayStatus.textContent = 'Loading xraylib atomic and attenuation tables…';
    xrayApi.load().then(() => {
      updateXrayHeader(current);
      renderXrayPanel(current);
    }).catch(error => {
      els.xrayStatus.classList.add('is-error');
      els.xrayStatus.textContent = 'X-ray data failed to load. Check the network connection and reload the page.';
      els.xrayEdges.innerHTML = '<span class="empty-data">Data unavailable.</span>';
      els.xrayLines.innerHTML = '<span class="empty-data">Data unavailable.</span>';
      els.xrayPlot.innerHTML = emptyPlotMessage('X-ray data failed to load');
      console.error('X-ray data load failed', error);
    });
  }

  function setupXrayExplorer() {
    if (!els.xrayPanel) return;
    updateXrayHeader(current);
    els.xrayEnergy.addEventListener('input', event => setXrayEnergy(event.target.value));
    els.xrayEnergyNumber.addEventListener('change', event => setXrayEnergy(event.target.value));
    els.xrayEnergyNumber.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        setXrayEnergy(event.currentTarget.value);
        event.currentTarget.blur();
      }
    });
    els.xrayPanel.addEventListener('pointerdown', loadXrayData, { once: true });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          loadXrayData();
        }
      }, { rootMargin: '650px 0px' });
      observer.observe(els.xrayPanel);
    } else {
      loadXrayData();
    }
  }

  renderLegend();
  renderAxes();
  renderTable();
  selectElement(elements[0]);
  pickVoices();
  setupXrayExplorer();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoices);
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }

  els.speakChineseButton.addEventListener('click', speakChinese);
  els.speakEnglishButton.addEventListener('click', speakEnglish);

  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (event.key === 'c' || event.key === 'C') speakChinese();
    if (event.key === 'e' || event.key === 'E') speakEnglish();
  });
})();
