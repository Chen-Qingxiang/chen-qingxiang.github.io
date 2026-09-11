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
    speakChineseButton: document.getElementById('speakChineseButton'),
    speakEnglishButton: document.getElementById('speakEnglishButton'),
    voiceStatus: document.getElementById('voiceStatus')
  };

  const cellsByNumber = new Map();
  let current = elements[0];
  let preferredEnglishVoice = null;
  let preferredChineseVoice = null;
  let activeChineseAudio = null;

  const chineseSpeechFallback = new Map([
    [104, '炉'], [105, '杜'], [106, '喜'], [107, '波'], [108, '黑'],
    [109, '麦'], [110, '达'], [111, '伦'], [112, '哥'], [113, '你'],
    [114, '夫'], [115, '莫'], [116, '立'], [117, '田'], [118, '奥']
  ]);

  const categoryOrder = ['alkali','alkaline','transition','post','metalloid','nonmetal','halogen','noble','lanthanide','actinide'];

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

  renderLegend();
  renderAxes();
  renderTable();
  selectElement(elements[0]);
  pickVoices();

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
