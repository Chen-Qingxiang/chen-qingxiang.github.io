(() => {
  'use strict';

  const { PDFDocument } = window.PDFLib;

  const state = {
    language: 'en',
    extract: { file: null, pageCount: 0, previewUrl: null },
    merge: [],
    layout: {
      fileA: null,
      fileB: null,
      pageCountA: 0,
      pageCountB: 0,
      previewUrlA: null,
      previewUrlB: null,
    },
  };

  const translations = {
    en: {
      'page.title': 'PDF Local · Browser-only PDF toolkit',
      'page.description': 'A browser-only local PDF toolkit for extracting pages, merging PDFs, and combining two-sided ID scans.',
      'hero.lede': 'Extract pages, merge PDFs, and combine two-sided ID scans. Your PDF files are processed only in this browser and are never uploaded.',
      'privacy.aria': 'Privacy information',
      'privacy.short': 'Files never leave your device',
      'language.switch': '简体中文',
      'language.aria': 'Switch to Simplified Chinese',
      'tabs.aria': 'PDF tools',
      'tabs.extract': 'Extract pages',
      'tabs.merge': 'Merge PDFs',
      'tabs.layout': 'Combine ID scans',
      'extract.title': 'Extract selected pages',
      'extract.description': 'Take only the pages you need from a long PDF while preserving the original PDF content.',
      'extract.choose': 'Choose a PDF',
      'extract.example': 'For example: extract pages 3, 17–18 and 52 from a 100-page document',
      'extract.preview': 'Preview source PDF locally in a new tab ↗',
      'extract.pagesLabel': 'Pages to extract',
      'extract.pagesHelp': 'Use commas and ranges, for example <code>1, 4-7, 12</code>. Output order follows your input.',
      'extract.run': 'Export selected pages',
      'extract.busy': 'Generating…',
      'extract.reading': 'Reading PDF…',
      'extract.ready': 'Ready.',
      'extract.extracting': 'Extracting {count} page(s)…',
      'extract.done': 'Done: exported {count} page(s).',
      'extract.empty': 'Enter at least one page number.',
      'extract.badToken': 'Could not understand “{token}”. Use a format such as 1, 4-7, 12.',
      'extract.outOfRange': 'Page {page} is out of range; this PDF has {count} page(s).',
      'merge.title': 'Merge multiple PDFs',
      'merge.description': 'Add several files, adjust their order, and export them as one PDF.',
      'merge.choose': 'Choose multiple PDFs',
      'merge.note': "You can add more files in several batches; files remain only in this page's memory",
      'merge.run': 'Merge and export',
      'merge.clear': 'Clear',
      'merge.needMore': 'Add at least one more PDF to merge.',
      'merge.reading': 'Reading {count} file(s)…',
      'merge.ready': 'Ready: {files} file(s), {pages} page(s) total.',
      'merge.busy': 'Merging…',
      'merge.merging': 'Merging PDFs in the current order…',
      'merge.processing': 'Processing {current}/{total}: {name}',
      'merge.done': 'Done: merged {files} file(s), {pages} page(s) total.',
      'merge.up': 'Move up',
      'merge.down': 'Move down',
      'merge.remove': 'Remove',
      'layout.title': 'Combine two-sided ID scans',
      'layout.description': 'For the common two-scan workflow: take the upper half of the front scan and the lower half of the back scan, then combine them into one page.',
      'layout.frontLegend': 'Front scan',
      'layout.frontChoose': 'Choose front-side PDF',
      'layout.frontNote': 'The ID front is in the upper half of the scan; only the upper half of page 1 is used',
      'layout.frontPreview': 'Preview front scan locally ↗',
      'layout.backLegend': 'Back scan',
      'layout.backChoose': 'Choose back-side PDF',
      'layout.backNote': 'The ID back is in the lower half of the scan; only the lower half of page 1 is used',
      'layout.backPreview': 'Preview back scan locally ↗',
      'layout.ruleLabel': 'Combine rule:',
      'layout.rule': ' The output keeps the page size of the front scan. Its upper half comes from the front PDF and its lower half from the back PDF. With scans from the same scanner, the ID size and position are largely preserved.',
      'layout.run': 'Combine into one PDF page',
      'layout.busy': 'Combining…',
      'layout.needOther': 'Choose the other scan PDF to continue.',
      'layout.ready': 'Both scans are ready{frontExtra}{backExtra}.',
      'layout.frontExtra': '; front PDF has {count} pages, only page 1 will be used',
      'layout.backExtra': '; back PDF has {count} pages, only page 1 will be used',
      'layout.readingFront': 'Reading front-side PDF…',
      'layout.readingBack': 'Reading back-side PDF…',
      'layout.processing': 'Taking the upper half of the front scan and the lower half of the back scan…',
      'layout.done': 'Done: the front upper half and back lower half were combined into one PDF page.',
      'privacy.title': 'Privacy and implementation',
      'privacy.body': 'This tool has no file-upload endpoint, backend service, account system, or analytics. PDFs are read by your browser and processed in memory with a pinned version of <code>pdf-lib</code>. Generated files are downloaded directly by the browser.',
      'privacy.dependency': 'Note: the page loads <code>pdf-lib 1.17.1</code> from jsDelivr when opened, so an internet connection is needed for the library. Your selected PDF files are not sent to jsDelivr or this site’s server.',
      'error.unknown': 'Unknown error',
      'error.encrypted': 'This PDF appears to be password-protected or encrypted and cannot currently be processed.',
      'error.invalid': 'Could not read this PDF. The file may be damaged or use an unsupported PDF structure.',
      'error.failed': 'Processing failed: {message}',
      'meta.pages': '{count} page(s)',
    },
    zh: {
      'page.title': 'PDF Local · 本地 PDF 工具',
      'page.description': '完全在浏览器本地处理的 PDF 小工具：抽取页面、合并 PDF、证件扫描拼页。',
      'hero.lede': '抽页、合并、证件扫描拼页。PDF 文件只在当前浏览器中读取和处理，不上传到服务器。',
      'privacy.aria': '隐私说明',
      'privacy.short': '文件不离开你的设备',
      'language.switch': 'English',
      'language.aria': '切换到英文',
      'tabs.aria': 'PDF 工具',
      'tabs.extract': '抽取页面',
      'tabs.merge': '合并 PDF',
      'tabs.layout': '证件拼页',
      'extract.title': '抽取指定页面',
      'extract.description': '从长 PDF 中只取你需要的几页，保持原始 PDF 内容，不转图片。',
      'extract.choose': '选择一个 PDF',
      'extract.example': '例如：100 页文档中抽出第 3、17–18、52 页',
      'extract.preview': '在新标签页本地预览源 PDF ↗',
      'extract.pagesLabel': '要抽取的页面',
      'extract.pagesHelp': '支持逗号和范围，例如 <code>1, 4-7, 12</code>。顺序按输入保留。',
      'extract.run': '导出选中页面',
      'extract.busy': '正在生成…',
      'extract.reading': '正在读取 PDF…',
      'extract.ready': '已就绪。',
      'extract.extracting': '正在抽取 {count} 页…',
      'extract.done': '完成：已导出 {count} 页。',
      'extract.empty': '请输入至少一个页码。',
      'extract.badToken': '无法识别“{token}”。请使用例如 1, 4-7, 12 的格式。',
      'extract.outOfRange': '页码 {page} 超出范围；当前 PDF 共 {count} 页。',
      'merge.title': '合并多个 PDF',
      'merge.description': '添加多个文件，调整顺序后合并为一个 PDF。',
      'merge.choose': '选择多个 PDF',
      'merge.note': '可以分几次继续添加；文件只保存在当前页面内存中',
      'merge.run': '合并并导出',
      'merge.clear': '清空',
      'merge.needMore': '再添加至少一个 PDF 即可合并。',
      'merge.reading': '正在读取 {count} 个文件…',
      'merge.ready': '已就绪：{files} 个文件，共 {pages} 页。',
      'merge.busy': '正在合并…',
      'merge.merging': '正在按当前顺序合并 PDF…',
      'merge.processing': '正在处理 {current}/{total}：{name}',
      'merge.done': '完成：{files} 个文件已合并，共 {pages} 页。',
      'merge.up': '上移',
      'merge.down': '下移',
      'merge.remove': '移除',
      'layout.title': '证件扫描拼成一页',
      'layout.description': '专门对应双面证件的两次扫描：第一份取上半张 A4，第二份取下半张 A4，再原位合成一页。',
      'layout.frontLegend': '正面扫描',
      'layout.frontChoose': '选择正面 PDF',
      'layout.frontNote': '证件正面位于扫描页上半部分；只取第 1 页的上半区',
      'layout.frontPreview': '本地预览正面 PDF ↗',
      'layout.backLegend': '反面扫描',
      'layout.backChoose': '选择反面 PDF',
      'layout.backNote': '证件反面位于扫描页下半部分；只取第 1 页的下半区',
      'layout.backPreview': '本地预览反面 PDF ↗',
      'layout.ruleLabel': '合成规则：',
      'layout.rule': '输出页保持第一份扫描 PDF 的页面尺寸。上半页来自正面 PDF，下半页来自反面 PDF；如果两份扫描都来自同一台扫描仪，证件的大小和位置会基本原样保留。',
      'layout.run': '合成一页 PDF',
      'layout.busy': '正在合成…',
      'layout.needOther': '再选择另一份扫描 PDF 即可合成。',
      'layout.ready': '两份扫描已就绪{frontExtra}{backExtra}。',
      'layout.frontExtra': '；正面 PDF 有 {count} 页，仅使用第 1 页',
      'layout.backExtra': '；反面 PDF 有 {count} 页，仅使用第 1 页',
      'layout.readingFront': '正在读取正面 PDF…',
      'layout.readingBack': '正在读取反面 PDF…',
      'layout.processing': '正在取正面上半页和反面下半页…',
      'layout.done': '完成：正面上半页 + 反面下半页已合成为 1 页 PDF。',
      'privacy.title': '隐私与实现',
      'privacy.body': '本工具没有文件上传接口、后台服务、账户系统或分析统计。PDF 内容由浏览器读取，使用固定版本的 <code>pdf-lib</code> 在本机内存中处理，生成结果后由浏览器直接下载。',
      'privacy.dependency': '注意：页面首次打开会从 jsDelivr 加载 <code>pdf-lib 1.17.1</code> 程序文件，因此需要网络连接；你的 PDF 文件不会发送给 jsDelivr 或本工具的服务器。',
      'error.unknown': '未知错误',
      'error.encrypted': '这个 PDF 似乎带有密码或加密保护，目前无法处理。',
      'error.invalid': '无法读取这个 PDF。文件可能损坏，或使用了暂不支持的 PDF 结构。',
      'error.failed': '处理失败：{message}',
      'meta.pages': '{count} 页',
    },
  };

  const $ = (id) => document.getElementById(id);

  function t(key, vars = {}) {
    let text = translations[state.language][key] ?? translations.en[key] ?? key;
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
    return text;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
  }

  function baseName(name) {
    return (name || 'document').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
  }

  function fileMeta(file, pageCount) {
    return `${file.name} · ${t('meta.pages', { count: pageCount })} · ${formatBytes(file.size)}`;
  }

  function setStatus(id, message = '', kind = '') {
    const el = $(id);
    el.textContent = message;
    el.className = `status${kind ? ` is-${kind}` : ''}`;
  }

  function friendlyError(error) {
    const message = String(error?.message || error || t('error.unknown'));
    if (/encrypt/i.test(message)) return t('error.encrypted');
    if (/invalid|parse|header|object/i.test(message)) return t('error.invalid');
    return t('error.failed', { message });
  }

  function applyLanguage(language) {
    state.language = language === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
    document.title = t('page.title');
    $('meta-description').setAttribute('content', t('page.description'));

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    $('language-toggle').setAttribute('aria-label', t('language.aria'));

    if (state.extract.file) {
      $('extract-meta').textContent = fileMeta(state.extract.file, state.extract.pageCount);
      setStatus('extract-status', t('extract.ready'), 'ok');
    }
    renderMergeList();
    if (state.merge.length >= 2) {
      const totalPages = state.merge.reduce((sum, item) => sum + item.pageCount, 0);
      setStatus('merge-status', t('merge.ready', { files: state.merge.length, pages: totalPages }), 'ok');
    }
    if (state.layout.fileA) $('layout-meta-a').textContent = fileMeta(state.layout.fileA, state.layout.pageCountA);
    if (state.layout.fileB) $('layout-meta-b').textContent = fileMeta(state.layout.fileB, state.layout.pageCountB);
    updateLayoutReadyStatus();
  }

  async function getPageCount(file) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    return doc.getPageCount();
  }

  function createPreviewUrl(file, previousUrl) {
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    return URL.createObjectURL(file);
  }

  function downloadPdf(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  function parsePageSpec(value, maxPage) {
    const raw = value.trim();
    if (!raw) throw new Error(t('extract.empty'));

    const tokens = raw
      .replace(/[，；;]/g, ',')
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const pages = [];
    for (const token of tokens) {
      if (/^\d+$/.test(token)) {
        pages.push(Number(token));
        continue;
      }

      const match = token.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
      if (!match) throw new Error(t('extract.badToken', { token }));

      const start = Number(match[1]);
      const end = Number(match[2]);
      const step = start <= end ? 1 : -1;
      for (let page = start; ; page += step) {
        pages.push(page);
        if (page === end) break;
      }
    }

    const invalid = pages.find((page) => page < 1 || page > maxPage);
    if (invalid !== undefined) throw new Error(t('extract.outOfRange', { page: invalid, count: maxPage }));
    return pages;
  }

  function setButtonBusy(button, busy, busyKey, normalKey) {
    button.disabled = busy;
    button.dataset.busy = busy ? 'true' : 'false';
    button.textContent = t(busy ? busyKey : normalKey);
  }

  $('language-toggle').addEventListener('click', () => {
    applyLanguage(state.language === 'en' ? 'zh' : 'en');
  });

  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('.panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === `panel-${tab}`));
    });
  });

  $('extract-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    state.extract.file = null;
    state.extract.pageCount = 0;
    $('extract-run').disabled = true;
    setStatus('extract-status');
    if (!file) return;

    try {
      setStatus('extract-status', t('extract.reading'));
      const pageCount = await getPageCount(file);
      state.extract.file = file;
      state.extract.pageCount = pageCount;
      state.extract.previewUrl = createPreviewUrl(file, state.extract.previewUrl);
      $('extract-meta').hidden = false;
      $('extract-meta').textContent = fileMeta(file, pageCount);
      $('extract-preview').hidden = false;
      $('extract-preview').href = state.extract.previewUrl;
      $('extract-pages').placeholder = pageCount >= 52 ? '3, 17-18, 52' : `1-${Math.min(pageCount, 5)}`;
      $('extract-run').disabled = false;
      setStatus('extract-status', t('extract.ready'), 'ok');
    } catch (error) {
      $('extract-meta').hidden = true;
      $('extract-preview').hidden = true;
      setStatus('extract-status', friendlyError(error), 'error');
    }
  });

  $('extract-run').addEventListener('click', async () => {
    const button = $('extract-run');
    if (!state.extract.file || button.dataset.busy === 'true') return;

    try {
      const pages = parsePageSpec($('extract-pages').value, state.extract.pageCount);
      setButtonBusy(button, true, 'extract.busy', 'extract.run');
      setStatus('extract-status', t('extract.extracting', { count: pages.length }));
      const sourceBytes = await state.extract.file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
      const outputDoc = await PDFDocument.create();
      const copiedPages = await outputDoc.copyPages(sourceDoc, pages.map((page) => page - 1));
      copiedPages.forEach((page) => outputDoc.addPage(page));
      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, `${baseName(state.extract.file.name)}_pages.pdf`);
      setStatus('extract-status', t('extract.done', { count: pages.length }), 'ok');
    } catch (error) {
      setStatus('extract-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, 'extract.busy', 'extract.run');
      button.disabled = !state.extract.file;
    }
  });

  function renderMergeList() {
    const list = $('merge-list');
    list.replaceChildren();

    state.merge.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.dataset.id = item.id;

      const order = document.createElement('span');
      order.className = 'file-order';
      order.textContent = String(index + 1).padStart(2, '0');

      const info = document.createElement('div');
      info.className = 'file-info';
      const title = document.createElement('strong');
      title.textContent = item.file.name;
      const meta = document.createElement('small');
      meta.textContent = `${t('meta.pages', { count: item.pageCount })} · ${formatBytes(item.file.size)}`;
      info.append(title, meta);

      const controls = document.createElement('div');
      controls.className = 'file-controls';
      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'icon-button';
      up.dataset.action = 'up';
      up.textContent = '↑';
      up.title = t('merge.up');
      up.disabled = index === 0;
      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'icon-button';
      down.dataset.action = 'down';
      down.textContent = '↓';
      down.title = t('merge.down');
      down.disabled = index === state.merge.length - 1;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-button danger';
      remove.dataset.action = 'remove';
      remove.textContent = '×';
      remove.title = t('merge.remove');
      controls.append(up, down, remove);
      row.append(order, info, controls);
      list.append(row);
    });

    $('merge-run').disabled = state.merge.length < 2;
    $('merge-clear').disabled = state.merge.length === 0;
    if (state.merge.length === 1) setStatus('merge-status', t('merge.needMore'));
    if (state.merge.length === 0) setStatus('merge-status');
  }

  $('merge-files').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setStatus('merge-status', t('merge.reading', { count: files.length }));
    let lastError = '';
    for (const file of files) {
      try {
        const pageCount = await getPageCount(file);
        state.merge.push({
          id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          file,
          pageCount,
        });
      } catch (error) {
        lastError = `${file.name}: ${friendlyError(error)}`;
      }
    }
    renderMergeList();
    if (lastError) {
      setStatus('merge-status', lastError, 'error');
    } else if (state.merge.length >= 2) {
      const totalPages = state.merge.reduce((sum, item) => sum + item.pageCount, 0);
      setStatus('merge-status', t('merge.ready', { files: state.merge.length, pages: totalPages }), 'ok');
    }
  });

  $('merge-list').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const row = event.target.closest('.file-row');
    if (!button || !row) return;
    const index = state.merge.findIndex((item) => item.id === row.dataset.id);
    if (index < 0) return;

    if (button.dataset.action === 'up' && index > 0) {
      [state.merge[index - 1], state.merge[index]] = [state.merge[index], state.merge[index - 1]];
    } else if (button.dataset.action === 'down' && index < state.merge.length - 1) {
      [state.merge[index + 1], state.merge[index]] = [state.merge[index], state.merge[index + 1]];
    } else if (button.dataset.action === 'remove') {
      state.merge.splice(index, 1);
    }
    renderMergeList();
  });

  $('merge-clear').addEventListener('click', () => {
    state.merge = [];
    renderMergeList();
  });

  $('merge-run').addEventListener('click', async () => {
    const button = $('merge-run');
    if (state.merge.length < 2 || button.dataset.busy === 'true') return;

    try {
      setButtonBusy(button, true, 'merge.busy', 'merge.run');
      $('merge-clear').disabled = true;
      setStatus('merge-status', t('merge.merging'));
      const outputDoc = await PDFDocument.create();
      for (let i = 0; i < state.merge.length; i += 1) {
        const item = state.merge[i];
        setStatus('merge-status', t('merge.processing', { current: i + 1, total: state.merge.length, name: item.file.name }));
        const sourceBytes = await item.file.arrayBuffer();
        const sourceDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
        const indices = Array.from({ length: sourceDoc.getPageCount() }, (_, pageIndex) => pageIndex);
        const copiedPages = await outputDoc.copyPages(sourceDoc, indices);
        copiedPages.forEach((page) => outputDoc.addPage(page));
      }
      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, 'merged.pdf');
      const totalPages = state.merge.reduce((sum, item) => sum + item.pageCount, 0);
      setStatus('merge-status', t('merge.done', { files: state.merge.length, pages: totalPages }), 'ok');
    } catch (error) {
      setStatus('merge-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, 'merge.busy', 'merge.run');
      button.disabled = state.merge.length < 2;
      $('merge-clear').disabled = state.merge.length === 0;
    }
  });

  function updateLayoutReadyStatus() {
    const ready = Boolean(state.layout.fileA && state.layout.fileB);
    $('layout-run').disabled = !ready;
    if (ready) {
      const frontExtra = state.layout.pageCountA > 1 ? t('layout.frontExtra', { count: state.layout.pageCountA }) : '';
      const backExtra = state.layout.pageCountB > 1 ? t('layout.backExtra', { count: state.layout.pageCountB }) : '';
      setStatus('layout-status', t('layout.ready', { frontExtra, backExtra }), 'ok');
    } else if (state.layout.fileA || state.layout.fileB) {
      setStatus('layout-status', t('layout.needOther'));
    } else {
      setStatus('layout-status');
    }
  }

  async function handleLayoutFile(side, file) {
    const isA = side === 'A';
    const fileKey = isA ? 'fileA' : 'fileB';
    const countKey = isA ? 'pageCountA' : 'pageCountB';
    const urlKey = isA ? 'previewUrlA' : 'previewUrlB';
    const metaId = isA ? 'layout-meta-a' : 'layout-meta-b';
    const previewId = isA ? 'layout-preview-a' : 'layout-preview-b';

    state.layout[fileKey] = null;
    state.layout[countKey] = 0;
    $(metaId).hidden = true;
    $(previewId).hidden = true;
    updateLayoutReadyStatus();
    if (!file) return;

    try {
      setStatus('layout-status', t(isA ? 'layout.readingFront' : 'layout.readingBack'));
      const pageCount = await getPageCount(file);
      state.layout[fileKey] = file;
      state.layout[countKey] = pageCount;
      state.layout[urlKey] = createPreviewUrl(file, state.layout[urlKey]);
      $(metaId).hidden = false;
      $(metaId).textContent = fileMeta(file, pageCount);
      $(previewId).hidden = false;
      $(previewId).href = state.layout[urlKey];
      updateLayoutReadyStatus();
    } catch (error) {
      setStatus('layout-status', friendlyError(error), 'error');
    }
  }

  $('layout-file-a').addEventListener('change', (event) => handleLayoutFile('A', event.target.files?.[0]));
  $('layout-file-b').addEventListener('change', (event) => handleLayoutFile('B', event.target.files?.[0]));

  function fitBox(sourceWidth, sourceHeight, target) {
    const scale = Math.min(target.width / sourceWidth, target.height / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return {
      x: target.x + (target.width - width) / 2,
      y: target.y + (target.height - height) / 2,
      width,
      height,
    };
  }

  $('layout-run').addEventListener('click', async () => {
    const button = $('layout-run');
    if (!state.layout.fileA || !state.layout.fileB || button.dataset.busy === 'true') return;

    try {
      setButtonBusy(button, true, 'layout.busy', 'layout.run');
      setStatus('layout-status', t('layout.processing'));
      const [bytesA, bytesB] = await Promise.all([
        state.layout.fileA.arrayBuffer(),
        state.layout.fileB.arrayBuffer(),
      ]);
      const [docA, docB] = await Promise.all([
        PDFDocument.load(bytesA, { updateMetadata: false }),
        PDFDocument.load(bytesB, { updateMetadata: false }),
      ]);
      const pageA = docA.getPages()[0];
      const pageB = docB.getPages()[0];
      const sizeA = pageA.getSize();
      const sizeB = pageB.getSize();
      const topBox = { left: 0, right: sizeA.width, bottom: sizeA.height / 2, top: sizeA.height };
      const bottomBox = { left: 0, right: sizeB.width, bottom: 0, top: sizeB.height / 2 };
      const outputDoc = await PDFDocument.create();
      const outputPage = outputDoc.addPage([sizeA.width, sizeA.height]);
      const embeddedTop = await outputDoc.embedPage(pageA, topBox);
      const embeddedBottom = await outputDoc.embedPage(pageB, bottomBox);
      const topTarget = { x: 0, y: sizeA.height / 2, width: sizeA.width, height: sizeA.height / 2 };
      const bottomTarget = { x: 0, y: 0, width: sizeA.width, height: sizeA.height / 2 };
      outputPage.drawPage(embeddedTop, fitBox(sizeA.width, sizeA.height / 2, topTarget));
      outputPage.drawPage(embeddedBottom, fitBox(sizeB.width, sizeB.height / 2, bottomTarget));
      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, `${baseName(state.layout.fileA.name)}_combined.pdf`);
      setStatus('layout-status', t('layout.done'), 'ok');
    } catch (error) {
      setStatus('layout-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, 'layout.busy', 'layout.run');
      button.disabled = !(state.layout.fileA && state.layout.fileB);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (state.extract.previewUrl) URL.revokeObjectURL(state.extract.previewUrl);
    if (state.layout.previewUrlA) URL.revokeObjectURL(state.layout.previewUrlA);
    if (state.layout.previewUrlB) URL.revokeObjectURL(state.layout.previewUrlB);
  });

  applyLanguage('en');
})();