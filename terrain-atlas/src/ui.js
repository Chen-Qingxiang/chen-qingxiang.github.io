export function isTouchDevice(win=window) {
  return win.matchMedia('(any-pointer: coarse)').matches || win.navigator.maxTouchPoints>0;
}
export function installMapUI(onResize=()=>{}, win=window) {
  const doc=win.document, $=id=>doc.getElementById(id);
  const narrow=win.matchMedia('(max-width:760px)');
  const coarse=win.matchMedia('(any-pointer: coarse)');
  const mobile=()=>narrow.matches || isTouchDevice(win);
  const chinese=()=>doc.documentElement.lang.toLowerCase().startsWith('zh');
  const setLegend=open=>{
    $('legend').classList.toggle('legend-open',open);
    $('legend-toggle').setAttribute('aria-expanded',String(open));
  };
  function setPanel(open) {
    $('panel').classList.toggle('panel-collapsed',!open);
    doc.body.classList.toggle('panel-is-collapsed',!open);
    $('panel-toggle').textContent=open?'−':'+';
    $('panel-toggle').setAttribute('aria-expanded',String(open));
    const label=chinese()?(open?'收起控制面板':'展开控制面板'):(open?'Collapse controls':'Expand controls');
    $('panel-toggle').setAttribute('aria-label',label);
    $('panel-toggle').title=label;
    onResize();
  }
  function updateDevice() {
    doc.body.classList.toggle('mobile-ui',mobile());
    setLegend(false); onResize();
  }
  $('panel-toggle').onclick=()=>setPanel($('panel').classList.contains('panel-collapsed'));
  $('legend-toggle').onclick=()=>setLegend(!$('legend').classList.contains('legend-open'));
  doc.addEventListener('pointerdown',event=>{if(!event.target.closest('#legend,#legend-toggle'))setLegend(false);});
  doc.addEventListener('keydown',event=>{if(event.key==='Escape')setLegend(false);});
  narrow.addEventListener('change',updateDevice);coarse.addEventListener('change',updateDevice);
  const credits=new ResizeObserver(()=>{
    // Reserve the actual wrapped attribution height, including iOS safe-area.
    doc.documentElement.style.setProperty('--credits-height',`${Math.ceil($('credits').getBoundingClientRect().height)}px`);
  });
  credits.observe($('credits'));
  updateDevice();setPanel(!mobile());
  return {mobile,setPanel,setLegend};
}
