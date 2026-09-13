(() => {
  'use strict';

  const src = window.SPACETIME_SINGLE_VIEW === 'swallow' ? './swallow.js' : './app.js';
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onerror = () => console.error(`无法载入单人模式脚本：${src}`);
  document.body.appendChild(script);
})();
