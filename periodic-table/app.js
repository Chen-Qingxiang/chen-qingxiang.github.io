(() => {
  'use strict';

  const elements = window.ELEMENTS || [];
  const categories = window.CATEGORY_META || {};

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
    ipaButton: document.getElementById('ipaButton'),
    speakChineseButton: document.getElementById('speakChineseButton'),
    speakEnglishButton: document.getElementById('speakEnglishButton'),
    voiceStatus: document.getElementById('voiceStatus'),
    search: document.getElementById('searchInput'),
    random: document.getElementById('randomButton'),
    toggleZh: document.getElementById('toggleZh'),
    toggleEn: document.getElementById('toggleEn'),
    toggleIpa: document.getElementById('toggleIpa')
  };

  const cellsByNumber = new Map();
  let current = elements[0];
  let preferredEnglishVoice = null;
  let preferredChineseVoice = null;
  let ipaVisible = true;

  // Some system TTS engines cannot read the Unicode characters used for the
  // newest Chinese element names. These common characters have the same
  // Mandarin pronunciation and are used only as hidden speech prompts.
  const chineseSpeechFallback = new Map([
    [104, '炉'],  // 𬬻 lú
    [105, '杜'],  // 𬭊 dù
    [106, '喜'],  // 𬭳 xǐ
    [107, '波'],  // 𬭛 bō
    [108, '黑'],  // 𬭶 hēi
    [109, '麦'],  // 鿏 mài
    [110, '达'],  // 𫟼 dá
    [111, '伦'],  // 𬬭 lún
    [112, '哥'],  // 鿔 gē
    [113, '你'],  // 鿭 nǐ
    [114, '夫'],  // 𫓧 fū
    [115, '莫'],  // 镆 mò
    [116, '立'],  // 𫟷 lì
    [117, '田'],  // 鿬 tián
    [118, '奥']   // 鿫 ào
  ]);

  const categoryOrder = ['alkali','alkaline','transition','post','metalloid','nonmetal','halogen','noble','lanthanide','actinide'];

  function renderLegend() {
    categoryOrder.forEach(key => {
      const meta = categories[key];
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-swatch" style="background:var(--${key})"></span><span>${meta.zh} · ${meta.en}</span>`;
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
    cell.className = 'element-cell show-zh';
    cell.dataset.number = String(element.n);
    cell.dataset.category = element.c;
    cell.dataset.search = `${element.n} ${element.s} ${element.zh} ${element.en}`.toLowerCase();
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
      <div class="cell-ipa">${element.ipa}</div>
    `;

    cell.addEventListener('click', () => selectElement(element, cell));

    if (!cellsByNumber.has(element.n)) cellsByNumber.set(element.n, []);
    cellsByNumber.get(element.n).push(cell);
    return cell;
  }

  function createPlaceholder(kind) {
    const isLanthanide = kind === 'lanthanide';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'element-cell show-zh';
    button.dataset.category = kind;
    button.style.gridColumn = '3';
    button.style.gridRow = isLanthanide ? '6' : '7';
    button.setAttribute('aria-label', isLanthanide ? '镧系元素 57 到 71' : '锕系元素 89 到 103');
    button.innerHTML = isLanthanide
      ? `<span class="cell-number">57–71</span><div class="cell-symbol" style="font-size:18px;margin-top:16px">La–Lu</div><div class="cell-zh">镧系</div><div class="cell-en">Lanthanides</div><div class="cell-ipa">57–71</div>`
      : `<span class="cell-number">89–103</span><div class="cell-symbol" style="font-size:18px;margin-top:16px">Ac–Lr</div><div class="cell-zh">锕系</div><div class="cell-en">Actinides</div><div class="cell-ipa">89–103</div>`;
    button.addEventListener('click', () => {
      const target = isLanthanide ? els.lanthanides : els.actinides;
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
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

  function selectElement(element, clickedCell) {
    current = element;
    document.querySelectorAll('.element-cell.is-selected').forEach(cell => cell.classList.remove('is-selected'));
    (cellsByNumber.get(element.n) || []).forEach(cell => cell.classList.add('is-selected'));
    if (clickedCell) clickedCell.classList.add('is-selected');

    const meta = categories[element.c];
    els.focusCard.dataset.category = element.c;
    els.focusNumber.textContent = element.n;
    els.focusCategory.textContent = `${meta.zh} · ${meta.en}`;
    els.focusSymbol.textContent = element.s;
    els.focusZh.textContent = element.zh;
    els.focusEnglish.textContent = element.en;
    els.focusIpa.textContent = element.ipa;
    document.title = `${element.s} · ${element.zh} · ${element.en} | 元素周期表`;
  }

  function applyCellDisplay() {
    document.querySelectorAll('.element-cell').forEach(cell => {
      cell.classList.toggle('show-zh', els.toggleZh.checked);
      cell.classList.toggle('show-en', els.toggleEn.checked);
      cell.classList.toggle('show-ipa', els.toggleIpa.checked);
    });
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function searchMatches(query) {
    const q = normalizeText(query);
    if (!q) return [];
    return elements.filter(element => {
      return String(element.n) === q ||
        element.s.toLowerCase() === q ||
        element.zh.includes(query.trim()) ||
        element.en.toLowerCase().includes(q) ||
        `${element.n} ${element.s} ${element.zh} ${element.en}`.toLowerCase().includes(q);
    });
  }

  function updateSearch() {
    const q = els.search.value.trim();
    const allCells = document.querySelectorAll('.element-cell[data-number]');
    allCells.forEach(cell => cell.classList.remove('is-dimmed', 'is-match'));
    if (!q) return;

    const matches = searchMatches(q);
    const numbers = new Set(matches.map(item => item.n));
    allCells.forEach(cell => {
      const n = Number(cell.dataset.number);
      cell.classList.toggle('is-match', numbers.has(n));
      cell.classList.toggle('is-dimmed', !numbers.has(n));
    });
  }

  function pickVoices() {
    if (!('speechSynthesis' in window)) {
      els.voiceStatus.textContent = '当前浏览器不支持语音合成';
      els.speakEnglishButton.disabled = true;
      els.speakChineseButton.disabled = true;
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang));
    const chineseVoices = voices.filter(v => /^(?:zh|cmn)(?:[-_]|$)/i.test(v.lang));

    const englishPriorities = [
      v => /^en-AU$/i.test(v.lang),
      v => /en-AU/i.test(v.lang),
      v => /^en-GB$/i.test(v.lang),
      v => /en-GB/i.test(v.lang),
      v => /^en-US$/i.test(v.lang),
      v => /en-US/i.test(v.lang)
    ];

    const chinesePriorities = [
      v => /^zh-CN$/i.test(v.lang),
      v => /zh[-_]Hans[-_]?CN/i.test(v.lang),
      v => /zh[-_]CN/i.test(v.lang),
      v => /^cmn-CN$/i.test(v.lang),
      v => /^zh(?:[-_]|$)/i.test(v.lang),
      v => /^cmn(?:[-_]|$)/i.test(v.lang)
    ];

    preferredEnglishVoice = null;
    for (const test of englishPriorities) {
      preferredEnglishVoice = englishVoices.find(test);
      if (preferredEnglishVoice) break;
    }
    if (!preferredEnglishVoice && englishVoices.length) preferredEnglishVoice = englishVoices[0];

    preferredChineseVoice = null;
    for (const test of chinesePriorities) {
      preferredChineseVoice = chineseVoices.find(test);
      if (preferredChineseVoice) break;
    }
    if (!preferredChineseVoice && chineseVoices.length) preferredChineseVoice = chineseVoices[0];

    const zhStatus = preferredChineseVoice
      ? `${preferredChineseVoice.name} · ${preferredChineseVoice.lang}`
      : '系统默认 zh-CN';
    const enStatus = preferredEnglishVoice
      ? `${preferredEnglishVoice.name} · ${preferredEnglishVoice.lang}`
      : '系统默认 en-AU';
    els.voiceStatus.textContent = `中文：${zhStatus} ｜ 英文：${enStatus}`;
  }

  function speak(text, voice, lang, rate) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function speakEnglish() {
    if (!current) return;
    speak(current.en, preferredEnglishVoice, 'en-AU', 0.82);
  }

  function speakChinese() {
    if (!current) return;
    const speechText = chineseSpeechFallback.get(current.n) || current.zh;
    speak(speechText, preferredChineseVoice, 'zh-CN', 0.74);
  }

  function renderMode() {
    const checked = document.querySelector('input[name="mode"]:checked');
    document.body.dataset.mode = checked?.value || 'study';
  }

  renderLegend();
  renderAxes();
  renderTable();
  applyCellDisplay();
  selectElement(elements[0], cellsByNumber.get(1)?.[0]);
  pickVoices();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoices);
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }

  els.speakEnglishButton.addEventListener('click', speakEnglish);
  els.speakChineseButton.addEventListener('click', speakChinese);

  els.ipaButton.addEventListener('click', () => {
    ipaVisible = !ipaVisible;
    els.ipaButton.classList.toggle('ipa-hidden', !ipaVisible);
    els.ipaButton.setAttribute('aria-pressed', String(ipaVisible));
  });

  [els.toggleZh, els.toggleEn, els.toggleIpa].forEach(input => input.addEventListener('change', applyCellDisplay));
  document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', renderMode));

  els.random.addEventListener('click', () => {
    const choice = elements[Math.floor(Math.random() * elements.length)];
    const cell = cellsByNumber.get(choice.n)?.[0];
    selectElement(choice, cell);
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  });

  els.search.addEventListener('input', updateSearch);
  els.search.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const match = searchMatches(els.search.value)[0];
    if (!match) return;
    const cell = cellsByNumber.get(match.n)?.[0];
    selectElement(match, cell);
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  });

  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== els.search) {
      event.preventDefault();
      els.search.focus();
    }
    if ((event.key === 'p' || event.key === 'P') && document.activeElement !== els.search) {
      speakEnglish();
    }
    if ((event.key === 'c' || event.key === 'C') && document.activeElement !== els.search) {
      speakChinese();
    }
  });
})();
