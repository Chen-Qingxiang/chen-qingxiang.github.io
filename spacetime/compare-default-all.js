(() => {
  'use strict';

  const registry = Array.isArray(window.SPACETIME_COMPARE_REGISTRY)
    ? window.SPACETIME_COMPARE_REGISTRY
    : [];
  registry.forEach(entry => {
    if (entry.comparable !== false) entry.defaultSelected = true;
  });

  // compare.js creates its selected Set synchronously near startup. Capture that
  // one Set so the UI can support a real all/none toggle without duplicating the
  // whole compare engine. Restore the native Set immediately after capture.
  const NativeSet = window.Set;
  let captured = false;
  window.Set = class CapturedCompareSet extends NativeSet {
    constructor(...args) {
      super(...args);
      if (!captured) {
        captured = true;
        window.SPACETIME_COMPARE_SELECTED_SET = this;
        window.Set = NativeSet;
      }
    }
  };
})();