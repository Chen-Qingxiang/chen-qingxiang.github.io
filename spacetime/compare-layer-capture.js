(() => {
  'use strict';
  if (!window.L || !L.map || !L.polyline) return;

  const capture = { map: null, polylines: [] };
  const originalMap = L.map;
  const originalPolyline = L.polyline;

  L.map = function (...args) {
    const map = originalMap.apply(this, args);
    capture.map = map;
    return map;
  };

  L.polyline = function (...args) {
    const layer = originalPolyline.apply(this, args);
    capture.polylines.push(layer);
    return layer;
  };

  window.SPACETIME_LAYER_CAPTURE = capture;
})();
