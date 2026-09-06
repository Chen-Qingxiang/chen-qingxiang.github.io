import {installMapUI} from '../src/ui.js';
const frame=document.getElementById('layout-frame'),report=document.getElementById('report');
let ui;
for(const button of document.querySelectorAll('[data-size]'))button.onclick=async()=>{
 const [width,height,touch]=button.dataset.size.split(',');
 const source=await fetch('../index.html').then(r=>r.text());
 const doc=new DOMParser().parseFromString(source,'text/html');
 doc.querySelectorAll('script').forEach(s=>s.remove());doc.getElementById('loading').remove();
 const base=doc.createElement('base');base.href=new URL('../',location.href).href;doc.head.prepend(base);
 doc.getElementById('globe').textContent='界面验证 · 此处不渲染地图';doc.getElementById('globe').style.cssText='color:#a7bab1;padding:120px 20px';
 doc.getElementById('credits').innerHTML='CesiumJS · Terrain Tiles · <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen / AWS</a> · <a href="./sources.html#terrain">数据来源与许可</a> · <a href="https://www.naturalearthdata.com/">Natural Earth</a> · 现代地理参照';
 frame.style.width=width+'px';frame.style.height=height+'px';
 // Scale only the presentation of large layout fixtures; iframe CSS viewport
 // retains its actual size. This is not a browser/device emulation claim.
 const scale=Math.min(1,(innerWidth-32)/Number(width));frame.style.transform=`scale(${scale})`;document.getElementById('stage').style.height=Number(height)*scale+'px';
 frame.onload=()=>{
  Object.defineProperty(frame.contentWindow.navigator,'maxTouchPoints',{value:touch==='true'?1:0,configurable:true});
  ui=installMapUI(()=>{},frame.contentWindow);
  report.textContent=JSON.stringify({viewport:[Number(width),Number(height)],simulatedTouch:touch==='true',mobile:ui.mobile(),scale},null,2);
 };
 frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
};
document.getElementById('check').onclick=()=>{
 if(!ui)return;
 const win=frame.contentWindow,doc=win.document;
 const rect=id=>{const e=doc.getElementById(id),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:win.getComputedStyle(e).display!=='none'};};
 const panel=rect('panel'),credits=rect('credits'),legend=rect('legend'),chip=rect('legend-toggle');
 report.textContent=JSON.stringify({viewport:[win.innerWidth,win.innerHeight],mobile:ui.mobile(),collapsed:doc.getElementById('panel').classList.contains('panel-collapsed'),panel,credits,legend,chip,panelAboveCredits:panel.y+panel.h<=credits.y,horizontalOverflow:doc.documentElement.scrollWidth>win.innerWidth},null,2);
};
