import {isTouchDevice} from './ui.js';

export function touchResolutionScale(win=window) {
  const dpr = Number(win.devicePixelRatio) || 1;
  if (!isTouchDevice(win) || dpr <= 1) return 1;
  // Cesium defaults to a 1× drawing buffer even on Retina displays. A 1.5×
  // cap noticeably sharpens labels and terrain while avoiding the 4–9× pixel
  // cost of rendering at the phone's full 2×/3× devicePixelRatio.
  return Math.min(1.5, dpr);
}

export function installTouchResolution(C, win=window) {
  const scale = touchResolutionScale(win);
  const proto = C?.CesiumWidget?.prototype;
  if (scale <= 1 || !proto || typeof proto.resize !== 'function' || proto.__terrainAtlasTouchResolution) return scale;

  const resize = proto.resize;
  const applied = new WeakSet();
  proto.resize = function (...args) {
    if (!applied.has(this)) {
      this.resolutionScale = scale;
      applied.add(this);
    }
    return resize.apply(this, args);
  };
  Object.defineProperty(proto, '__terrainAtlasTouchResolution', {value: true, configurable: true});
  return scale;
}
