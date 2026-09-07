import {start} from '../src/app.js';
const C=window.Cesium;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const tick=()=>new Promise(r=>setTimeout(r,300));
let viewer;
class FixtureViewer {
 constructor(id){
  viewer=this;
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=800;canvas.style.cssText='width:100%;height:100%';document.getElementById(id).append(canvas);
  const scene=this.scene={canvas,drawingBufferWidth:1000,drawingBufferHeight:800,mapProjection:new C.GeographicProjection(),ellipsoid:C.Ellipsoid.WGS84,mode:C.SceneMode.SCENE3D,
   globe:new C.Globe(),fog:{},screenSpaceCameraController:{enableTranslate:true,enableZoom:true},morphComplete:new C.Event(),renderError:new C.Event(),requestRender(){},pick(){return undefined;}};
  this.camera=scene.camera=new C.Camera(scene);
  scene.globe.pick=ray=>{const hit=C.IntersectionTests.rayEllipsoid(ray,C.Ellipsoid.WGS84);return hit?C.Ray.getPoint(ray,hit.start):undefined;};
  this.camera.flyTo=options=>{this.camera.setView(options);this.camera.moveEnd.raiseEvent();};
  this.camera.flyToBoundingSphere=(sphere,options)=>{this.camera.lookAt(sphere.center,options.offset);this.camera.lookAtTransform(C.Matrix4.IDENTITY);this.camera.moveEnd.raiseEvent();};
  for(const [name,mode] of [['morphTo3D',C.SceneMode.SCENE3D],['morphTo2D',C.SceneMode.SCENE2D],['morphToColumbusView',C.SceneMode.COLUMBUS_VIEW]])scene[name]=()=>{scene.mode=mode;scene.morphComplete.raiseEvent();};
  this.entities=new C.EntityCollection();this.imageryLayers=new C.ImageryLayerCollection();this.clock={currentTime:C.JulianDate.now()};
  this.screenSpaceEventHandler=new C.ScreenSpaceEventHandler(canvas);
 }
 resize(){}
}
const transforms={worldToWindowCoordinates(scene,position){
 const matrix=C.Matrix4.multiply(scene.camera.frustum.projectionMatrix,scene.camera.viewMatrix,new C.Matrix4());
 const p=C.Matrix4.multiplyByVector(matrix,new C.Cartesian4(position.x,position.y,position.z,1),new C.Cartesian4());
 if(p.w<=0)return undefined;
 return new C.Cartesian2((p.x/p.w+1)/2*scene.canvas.clientWidth,(1-p.y/p.w)/2*scene.canvas.clientHeight);
}};
document.getElementById('run').onclick=async()=>{
 const old=localStorage.getItem('terrain-atlas-v1'),checks=[];let report;
 try{
  const text=await fetch('../index.html').then(r=>r.text());const doc=new DOMParser().parseFromString(text,'text/html');doc.querySelectorAll('script').forEach(s=>s.remove());
  const base=document.createElement('base');base.href=new URL('../',location.href).href;document.head.prepend(base);
  const css=document.createElement('link');css.rel='stylesheet';css.href='./style.css';document.head.append(css);document.body.replaceChildren(...doc.body.childNodes);
  report=document.createElement('pre');report.id='integration-results';report.style.cssText='position:fixed;z-index:100;right:85px;top:75px;max-height:65vh;max-width:65vw;overflow:auto;padding:16px;background:#fff;color:#183238;white-space:pre-wrap';document.body.append(report);
  localStorage.setItem('terrain-atlas-v1',JSON.stringify({settings:{scale:30,palette:'atlas',rivers:true,landforms:true}}));
  await start({...C,Viewer:FixtureViewer,SceneTransforms:transforms});await tick();checks.push('Application boot and all pinned datasets loaded');
  const $=id=>document.getElementById(id),click=selector=>document.querySelector(selector).click();
  assert(document.documentElement.lang==='en','English is not the default');assert($('search-hint').textContent.includes('7,342'),'City index did not load');assert(viewer.entities.values.length>0,'No labels');
  $('language-toggle').click();assert(document.documentElement.lang==='zh-CN','Chinese switch');assert(JSON.parse(localStorage.getItem('terrain-atlas-v1')).settings.language==='zh','Chinese preference');assert($('search-hint').textContent.includes('座城市'),'Chinese dynamic text');
  $('language-toggle').click();assert(document.documentElement.lang==='en','English switch back');checks.push('English default and live English / Chinese switch');
  click('[data-scale="200"]');assert(viewer.scene.verticalExaggeration===200&&$('scale-percent').textContent==='20000%','200× UI');checks.push('200× slider/output/Cesium setting');
  for(const key of ['riverDetail','landformDetail'])for(let i=0;i<3;i++){click(`[data-detail="${key}"][data-level="${i}"]`);assert(JSON.parse(localStorage.getItem('terrain-atlas-v1')).settings[key]===i,key);}
  checks.push('All six detail buttons update persisted settings');
  for(const palette of ['atlas','topo15','vivid','school','ocean','earth','gray']){click(`[data-palette="${palette}"]`);assert(viewer.imageryLayers.length<=2,'Leaked imagery layers');assert($('legend-name').textContent===document.querySelector(`[data-palette="${palette}"]`).textContent,'Legend name mismatch');}
  $('relief').click();$('relief').click();assert(viewer.imageryLayers.length<=2,'Hillshade layer retention');checks.push('Seven palettes, legend names and hillshade replacement');
  if($('north-lock').getAttribute('aria-pressed')!=='true')$('north-lock').click();
  assert(!viewer.scene.screenSpaceCameraController.enableTilt,'North lock route');$('tilt').click();assert(viewer.camera.pitch<0,'Tilt unavailable');
  const heading=viewer.camera.heading;assert(Math.min(Math.abs(heading),Math.abs(heading-2*Math.PI))<1e-5,'Heading after tilt');checks.push('North lock and north-facing ◩ tilt');
  for(const key of ['countries','rivers','landforms','cities'])if($(key).checked)$(key).click();await tick();assert(viewer.imageryLayers.length===1,'Empty overlay retained');assert(viewer.entities.values.length===0,'Hidden labels retained');checks.push('No empty overlay; disabled labels removed');
  const file=new File([JSON.stringify({type:'Feature',properties:{name:'Test point'},geometry:{type:'Point',coordinates:[116.4,39.9]}})],'integration.geojson',{type:'application/geo+json'});
  await $('import-file').onchange({target:{files:[file],value:''}});assert($('custom-layers').textContent.includes('integration.geojson'),'Import');
  $('custom-layers').querySelector('button').click();assert(!$('custom-layers').textContent.includes('integration.geojson'),'Remove import');checks.push('WGS84 GeoJSON import/remove');
  const originalPrompt=window.prompt;let shared='';window.prompt=(label,value)=>{shared=value;return null;};
  const descriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard');Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Test fallback');}},configurable:true});
  try{await $('share').onclick();}finally{window.prompt=originalPrompt;if(descriptor)Object.defineProperty(navigator,'clipboard',descriptor);else delete navigator.clipboard;}
  const view=JSON.parse(new URLSearchParams(new URL(shared).hash.slice(1)).get('view'));assert(view.settings.scale===200&&view.settings.northLock&&view.settings.language==='en','Share settings');checks.push('Share view includes 200×, language and north lock');
  report.textContent='PASS — no-GPU application integration check\n'+checks.join('\n');
 }catch(error){if(report)report.textContent='FAIL\n'+checks.join('\n')+'\n'+error.stack;else console.error(error);}
 finally{if(old===null)localStorage.removeItem('terrain-atlas-v1');else localStorage.setItem('terrain-atlas-v1',old);}
};
