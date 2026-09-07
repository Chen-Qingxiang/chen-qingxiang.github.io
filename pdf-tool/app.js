(() => {
  'use strict';

  const { PDFDocument } = window.PDFLib;

  const A4 = { width: 595.28, height: 841.89 };
  const state = {
    extract: { file: null, pageCount: 0, previewUrl: null },
    merge: [],
    layout: { file: null, pageCount: 0, previewUrl: null },
  };

  const $ = (id) => document.getElementById(id);

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

  function setStatus(id, message = '', kind = '') {
    const el = $(id);
    el.textContent = message;
    el.className = `status${kind ? ` is-${kind}` : ''}`;
  }

  function friendlyError(error) {
    const message = String(error?.message || error || '未知错误');
    if (/encrypt/i.test(message)) return '这个 PDF 似乎带有密码或加密保护，目前无法处理。';
    if (/invalid|parse|header|object/i.test(message)) return '无法读取这个 PDF。文件可能损坏，或使用了暂不支持的 PDF 结构。';
    return `处理失败：${message}`;
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
    if (!raw) throw new Error('请输入至少一个页码。');

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
      if (!match) throw new Error(`无法识别“${token}”。请使用例如 1, 4-7, 12 的格式。`);

      const start = Number(match[1]);
      const end = Number(match[2]);
      const step = start <= end ? 1 : -1;
      for (let page = start; ; page += step) {
        pages.push(page);
        if (page === end) break;
      }
    }

    const invalid = pages.find((page) => page < 1 || page > maxPage);
    if (invalid !== undefined) throw new Error(`页码 ${invalid} 超出范围；当前 PDF 共 ${maxPage} 页。`);
    return pages;
  }

  function setButtonBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.dataset.busy = busy ? 'true' : 'false';
    button.textContent = busy ? busyText : normalText;
  }

  // Tabs
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('.panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === `panel-${tab}`));
    });
  });

  // Extract pages
  $('extract-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    state.extract.file = null;
    state.extract.pageCount = 0;
    $('extract-run').disabled = true;
    setStatus('extract-status');

    if (!file) return;

    try {
      setStatus('extract-status', '正在读取 PDF…');
      const pageCount = await getPageCount(file);
      state.extract.file = file;
      state.extract.pageCount = pageCount;
      state.extract.previewUrl = createPreviewUrl(file, state.extract.previewUrl);

      $('extract-meta').hidden = false;
      $('extract-meta').textContent = `${file.name} · ${pageCount} 页 · ${formatBytes(file.size)}`;
      $('extract-preview').hidden = false;
      $('extract-preview').href = state.extract.previewUrl;
      $('extract-pages').placeholder = pageCount >= 52 ? '3, 17-18, 52' : `1-${Math.min(pageCount, 5)}`;
      $('extract-run').disabled = false;
      setStatus('extract-status', '已就绪。', 'ok');
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
      setButtonBusy(button, true, '正在生成…', '导出选中页面');
      setStatus('extract-status', `正在抽取 ${pages.length} 页…`);

      const sourceBytes = await state.extract.file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
      const outputDoc = await PDFDocument.create();
      const copiedPages = await outputDoc.copyPages(sourceDoc, pages.map((page) => page - 1));
      copiedPages.forEach((page) => outputDoc.addPage(page));

      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, `${baseName(state.extract.file.name)}_pages.pdf`);
      setStatus('extract-status', `完成：已导出 ${pages.length} 页。`, 'ok');
    } catch (error) {
      setStatus('extract-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, '正在生成…', '导出选中页面');
      button.disabled = !state.extract.file;
    }
  });

  // Merge PDFs
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
      meta.textContent = `${item.pageCount} 页 · ${formatBytes(item.file.size)}`;
      info.append(title, meta);

      const controls = document.createElement('div');
      controls.className = 'file-controls';
      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'icon-button';
      up.dataset.action = 'up';
      up.textContent = '↑';
      up.title = '上移';
      up.disabled = index === 0;
      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'icon-button';
      down.dataset.action = 'down';
      down.textContent = '↓';
      down.title = '下移';
      down.disabled = index === state.merge.length - 1;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-button danger';
      remove.dataset.action = 'remove';
      remove.textContent = '×';
      remove.title = '移除';
      controls.append(up, down, remove);

      row.append(order, info, controls);
      list.append(row);
    });

    $('merge-run').disabled = state.merge.length < 2;
    $('merge-clear').disabled = state.merge.length === 0;

    if (state.merge.length === 1) setStatus('merge-status', '再添加至少一个 PDF 即可合并。');
    if (state.merge.length === 0) setStatus('merge-status');
  }

  $('merge-files').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setStatus('merge-status', `正在读取 ${files.length} 个文件…`);
    for (const file of files) {
      try {
        const pageCount = await getPageCount(file);
        state.merge.push({
          id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          file,
          pageCount,
        });
      } catch (error) {
        setStatus('merge-status', `${file.name}：${friendlyError(error)}`, 'error');
      }
    }
    renderMergeList();
    if (state.merge.length >= 2) {
      const totalPages = state.merge.reduce((sum, item) => sum + item.pageCount, 0);
      setStatus('merge-status', `已就绪：${state.merge.length} 个文件，共 ${totalPages} 页。`, 'ok');
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
      setButtonBusy(button, true, '正在合并…', '合并并导出');
      $('merge-clear').disabled = true;
      setStatus('merge-status', '正在按当前顺序合并 PDF…');

      const outputDoc = await PDFDocument.create();
      for (let i = 0; i < state.merge.length; i += 1) {
        const item = state.merge[i];
        setStatus('merge-status', `正在处理 ${i + 1}/${state.merge.length}：${item.file.name}`);
        const sourceBytes = await item.file.arrayBuffer();
        const sourceDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
        const indices = Array.from({ length: sourceDoc.getPageCount() }, (_, pageIndex) => pageIndex);
        const copiedPages = await outputDoc.copyPages(sourceDoc, indices);
        copiedPages.forEach((page) => outputDoc.addPage(page));
      }

      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, 'merged.pdf');
      const totalPages = state.merge.reduce((sum, item) => sum + item.pageCount, 0);
      setStatus('merge-status', `完成：${state.merge.length} 个文件已合并，共 ${totalPages} 页。`, 'ok');
    } catch (error) {
      setStatus('merge-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, '正在合并…', '合并并导出');
      button.disabled = state.merge.length < 2;
      $('merge-clear').disabled = state.merge.length === 0;
    }
  });

  // Crop and layout
  $('layout-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    state.layout.file = null;
    state.layout.pageCount = 0;
    $('layout-run').disabled = true;
    setStatus('layout-status');

    if (!file) return;

    try {
      setStatus('layout-status', '正在读取 PDF…');
      const pageCount = await getPageCount(file);
      state.layout.file = file;
      state.layout.pageCount = pageCount;
      state.layout.previewUrl = createPreviewUrl(file, state.layout.previewUrl);

      $('layout-meta').hidden = false;
      $('layout-meta').textContent = `${file.name} · ${pageCount} 页 · ${formatBytes(file.size)}`;
      $('layout-preview').hidden = false;
      $('layout-preview').href = state.layout.previewUrl;
      $('layout-page-a').max = pageCount;
      $('layout-page-b').max = pageCount;
      $('layout-page-a').value = '1';
      $('layout-page-b').value = String(Math.min(2, pageCount));
      $('layout-run').disabled = false;
      setStatus('layout-status', '已就绪。', 'ok');
    } catch (error) {
      $('layout-meta').hidden = true;
      $('layout-preview').hidden = true;
      setStatus('layout-status', friendlyError(error), 'error');
    }
  });

  function validateSourcePage(value, maxPage, label) {
    const page = Number(value);
    if (!Number.isInteger(page) || page < 1 || page > maxPage) {
      throw new Error(`${label}页码必须在 1–${maxPage} 之间。`);
    }
    return page - 1;
  }

  function getCropBox(page, crop) {
    const { width, height } = page.getSize();
    switch (crop) {
      case 'top':
        return { left: 0, right: width, bottom: height / 2, top: height };
      case 'bottom':
        return { left: 0, right: width, bottom: 0, top: height / 2 };
      case 'left':
        return { left: 0, right: width / 2, bottom: 0, top: height };
      case 'right':
        return { left: width / 2, right: width, bottom: 0, top: height };
      default:
        return { left: 0, right: width, bottom: 0, top: height };
    }
  }

  function fitIntoSlot(contentWidth, contentHeight, slot) {
    const scale = Math.min(slot.width / contentWidth, slot.height / contentHeight);
    const width = contentWidth * scale;
    const height = contentHeight * scale;
    return {
      x: slot.x + (slot.width - width) / 2,
      y: slot.y + (slot.height - height) / 2,
      width,
      height,
    };
  }

  function createSlots(pageWidth, pageHeight, margin, mode) {
    const gap = Math.max(12, margin / 2);
    const innerWidth = pageWidth - margin * 2;
    const innerHeight = pageHeight - margin * 2;

    if (mode === 'horizontal') {
      const width = (innerWidth - gap) / 2;
      return [
        { x: margin, y: margin, width, height: innerHeight },
        { x: margin + width + gap, y: margin, width, height: innerHeight },
      ];
    }

    const height = (innerHeight - gap) / 2;
    return [
      { x: margin, y: margin + height + gap, width: innerWidth, height },
      { x: margin, y: margin, width: innerWidth, height },
    ];
  }

  $('layout-run').addEventListener('click', async () => {
    const button = $('layout-run');
    if (!state.layout.file || button.dataset.busy === 'true') return;

    try {
      const pageAIndex = validateSourcePage($('layout-page-a').value, state.layout.pageCount, '区域 A ');
      const pageBIndex = validateSourcePage($('layout-page-b').value, state.layout.pageCount, '区域 B ');
      const cropA = $('layout-crop-a').value;
      const cropB = $('layout-crop-b').value;
      const mode = $('layout-mode').value;
      const orientation = $('layout-orientation').value;
      const margin = Number($('layout-margin').value);

      setButtonBusy(button, true, '正在拼版…', '生成单页 PDF');
      setStatus('layout-status', '正在裁切并生成新的 A4 页面…');

      const sourceBytes = await state.layout.file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
      const sourcePages = sourceDoc.getPages();
      const sourceA = sourcePages[pageAIndex];
      const sourceB = sourcePages[pageBIndex];
      const boxA = getCropBox(sourceA, cropA);
      const boxB = getCropBox(sourceB, cropB);

      const outputDoc = await PDFDocument.create();
      const pageWidth = orientation === 'landscape' ? A4.height : A4.width;
      const pageHeight = orientation === 'landscape' ? A4.width : A4.height;
      const outputPage = outputDoc.addPage([pageWidth, pageHeight]);
      const slots = createSlots(pageWidth, pageHeight, margin, mode);

      const embeddedA = await outputDoc.embedPage(sourceA, boxA);
      const embeddedB = await outputDoc.embedPage(sourceB, boxB);
      const fittedA = fitIntoSlot(boxA.right - boxA.left, boxA.top - boxA.bottom, slots[0]);
      const fittedB = fitIntoSlot(boxB.right - boxB.left, boxB.top - boxB.bottom, slots[1]);

      outputPage.drawPage(embeddedA, fittedA);
      outputPage.drawPage(embeddedB, fittedB);

      const outputBytes = await outputDoc.save({ useObjectStreams: true });
      downloadPdf(outputBytes, `${baseName(state.layout.file.name)}_layout.pdf`);
      setStatus('layout-status', '完成：两个裁切区域已拼成 1 页 A4 PDF。', 'ok');
    } catch (error) {
      setStatus('layout-status', friendlyError(error), 'error');
    } finally {
      setButtonBusy(button, false, '正在拼版…', '生成单页 PDF');
      button.disabled = !state.layout.file;
    }
  });

  window.addEventListener('beforeunload', () => {
    if (state.extract.previewUrl) URL.revokeObjectURL(state.extract.previewUrl);
    if (state.layout.previewUrl) URL.revokeObjectURL(state.layout.previewUrl);
  });
})();
