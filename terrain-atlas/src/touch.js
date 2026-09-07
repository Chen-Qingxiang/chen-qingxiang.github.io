export function installTouchRecovery(canvas, win=window) {
  if (!canvas || typeof win.PointerEvent !== 'function') return () => {};
  const active = new Map();
  const doc = win.document;
  const remember = event => ({
    pointerId: event.pointerId,
    pointerType: 'touch',
    isPrimary: Boolean(event.isPrimary),
    clientX: Number(event.clientX) || 0,
    clientY: Number(event.clientY) || 0,
  });
  const dispatchCancel = state => {
    try {
      canvas.dispatchEvent(new win.PointerEvent('pointercancel', {
        pointerId: state.pointerId, pointerType: 'touch', isPrimary: state.isPrimary,
        clientX: state.clientX, clientY: state.clientY, bubbles: true, cancelable: true,
      }));
    } catch { /* Recovery is best-effort on older touch engines. */ }
  };
  const cancel = pointerId => {
    const state = active.get(pointerId);
    if (!state) return;
    active.delete(pointerId);
    dispatchCancel(state);
  };
  const cancelAll = () => [...active.keys()].forEach(cancel);
  const pointerDown = event => {
    if (event.pointerType !== 'touch') return;
    // A new primary touch means the browser considers the previous gesture over.
    // If our bookkeeping still contains touches, Cesium may have missed their end.
    if (event.isPrimary && active.size) cancelAll();
    active.set(event.pointerId, remember(event));
  };
  const pointerMove = event => {
    if (event.pointerType === 'touch' && active.has(event.pointerId)) active.set(event.pointerId, remember(event));
  };
  const pointerEnd = event => {
    if (event.pointerType === 'touch') active.delete(event.pointerId);
  };
  const lostCapture = event => {
    if (active.has(event.pointerId)) cancel(event.pointerId);
  };
  const strayEnd = event => {
    if (event.pointerType === 'touch' && active.has(event.pointerId) && event.target !== canvas) cancel(event.pointerId);
  };
  const hidden = () => { if (doc.visibilityState === 'hidden') cancelAll(); };

  canvas.addEventListener('pointerdown', pointerDown, true);
  canvas.addEventListener('pointermove', pointerMove, true);
  canvas.addEventListener('pointerup', pointerEnd, true);
  canvas.addEventListener('pointercancel', pointerEnd, true);
  canvas.addEventListener('lostpointercapture', lostCapture);
  doc.addEventListener('pointerup', strayEnd, true);
  doc.addEventListener('pointercancel', strayEnd, true);
  doc.addEventListener('visibilitychange', hidden);
  win.addEventListener('blur', cancelAll);
  win.addEventListener('pagehide', cancelAll);

  return () => {
    canvas.removeEventListener('pointerdown', pointerDown, true);
    canvas.removeEventListener('pointermove', pointerMove, true);
    canvas.removeEventListener('pointerup', pointerEnd, true);
    canvas.removeEventListener('pointercancel', pointerEnd, true);
    canvas.removeEventListener('lostpointercapture', lostCapture);
    doc.removeEventListener('pointerup', strayEnd, true);
    doc.removeEventListener('pointercancel', strayEnd, true);
    doc.removeEventListener('visibilitychange', hidden);
    win.removeEventListener('blur', cancelAll);
    win.removeEventListener('pagehide', cancelAll);
    active.clear();
  };
}
