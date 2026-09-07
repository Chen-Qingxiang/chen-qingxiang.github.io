import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cleanSettings,PALETTES,makeColorTable} from '../src/core.js';
import {terrainScreenSpaceError,mapZoom,labelEligible,riverVisible,placeLabels,prepareRivers,overlaps} from '../src/cartography.js';
import {paintTerrain,ElevationStore} from '../src/terrain.js';
import {ElevationStore as V1Store} from './fixtures/v1-terrain.js';
import {applyNorthLock} from '../src/navigation.js';
import {isTouchDevice} from '../src/ui.js';
import {touchResolutionScale} from '../src/display.js';

test('V1 links migrate; 200×, seven palettes, detail levels and explicit north preferences round-trip',()=>{
 assert.equal(cleanSettings({scale:999}).scale,200);assert.equal(cleanSettings({}).scale,30);
 assert.equal(cleanSettings(null).scale,30);assert.equal(cleanSettings({palette:'vivid'}).palette,'vivid');
 assert.equal(cleanSettings({palette:'topo15'}).palette,'topo15');
 assert.equal(cleanSettings({},true).northLock,true);assert.equal(cleanSettings({northLock:false},true).northLock,false);
 assert.equal(cleanSettings({northLock:true},false).northLock,true);
 const s=cleanSettings({scale:200,riverDetail:2,landformDetail:0,northLock:true,palette:'ocean',rivers:true});
 assert.deepEqual(cleanSettings(JSON.parse(JSON.stringify(s))),s);
 assert.equal(cleanSettings({riverDetail:99,landformDetail:'2'}).riverDetail,1);
 assert.equal(Object.keys(PALETTES).length,7);
});
test('Large desktop SSE changes conservatively; all touch viewport detail remains V1',()=>{
 assert.equal(terrainScreenSpaceError(960,720),2.5);
 assert(terrainScreenSpaceError(1920,1080)>2.5);assert.equal(terrainScreenSpaceError(3840,2160),4.5);
 for(const [w,h] of [[390,844],[844,390],[2732,2048]])assert.equal(terrainScreenSpaceError(w,h,true),2.5);
 assert(isTouchDevice({matchMedia:()=>({matches:false}),navigator:{maxTouchPoints:1}}));
 assert(isTouchDevice({matchMedia:()=>({matches:true}),navigator:{maxTouchPoints:0}}));
 assert.equal(touchResolutionScale({matchMedia:()=>({matches:true}),navigator:{maxTouchPoints:1},devicePixelRatio:3}),1.5);
 assert.equal(touchResolutionScale({matchMedia:()=>({matches:false}),navigator:{maxTouchPoints:0},devicePixelRatio:2}),1);
});
test('All ramps interpolate continuously on land; shade stays mild and alpha stays opaque',()=>{
 for(const name of Object.keys(PALETTES)) {
  const colors=makeColorTable(name),maxStep=name==='topo15'?2:1;
  for(let h=11001;h<20001;h++)for(let c=0;c<3;c++)assert(Math.abs(colors[h*3+c]-colors[(h-1)*3+c])<=maxStep,name);
  const heights=new Float32Array(65536).fill(1800),rgba=new Uint8ClampedArray(65536*4);
  paintTerrain(heights,colors,rgba,true,100,8);
  for(let c=0;c<3;c++)assert(Math.abs(rgba[c]-colors[(1800+11000)*3+c])<=1,name);
  assert.equal(rgba[3],255);assert.equal(rgba.at(-1),255);
 }
 const heights=Float32Array.from({length:65536},(_,i)=>i%256<128?-11000:9000),colors=makeColorTable('school'),rgba=new Uint8ClampedArray(262144);
 paintTerrain(heights,colors,rgba,true,1,12);
 for(let i=0;i<heights.length;i++)for(let c=0;c<3;c++)assert(rgba[i*4+c]>=Math.floor(colors[(heights[i]+11000)*3+c]*.76));
});
test('River geometry detail and name density are separate, monotone scale gates',()=>{
 const line={scalerank:6,min_zoom:5,min_label:6};
 assert(!riverVisible(line,0,8));assert(riverVisible(line,1,8));assert(riverVisible(line,2,8));
 assert(!labelEligible(line,'river',3.8,2));assert(labelEligible(line,'river',6.2,1));
 assert(mapZoom(700000,800)>mapZoom(7800000,800));
});
test('All kinds share collision, exclusion and dedup rules; detail cannot flood text',()=>{
 const candidates=Array.from({length:500},(_,i)=>({id:String(i),kind:['city','river','landform'][i%3],text:'名称'+(i%100),priority:i%8,x:30+i%20*38,y:40+Math.floor(i/20)*30,w:60,h:16}));
 const excluded=[{x:0,y:0,w:180,h:180}];
 const selected=placeLabels(candidates,800,600,excluded);
 assert(selected.length<80);assert(selected.length>5);
 const boxes=selected.map(s=>({x:s.x-s.w/2-5,y:s.y-s.h/2-4,w:s.w+10,h:s.h+8}));
 for(let i=0;i<boxes.length;i++){assert(!overlaps(boxes[i],excluded[0]));for(let j=0;j<i;j++)assert(!overlaps(boxes[i],boxes[j]));}
 assert.equal(new Set(selected.map(s=>s.kind+':'+s.text)).size,selected.length);
});
test('New NE data is bilingual and keeps only useful attributes with verifiable provenance',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../data/manifest.json',import.meta.url),'utf8'));
 const rows=async key=>(await Promise.all(manifest.datasets[key].files.map(p=>readFile(new URL('../'+p,import.meta.url),'utf8').then(JSON.parse)))).flat();
 const rivers=await rows('rivers'),landforms=await rows('landforms');
 assert.equal(rivers.length,1473);assert.equal(landforms.length,422);
 for(const p of [...rivers,...landforms]){assert(Number.isFinite(p.scalerank));assert(Number.isFinite(p.min_label));assert.equal(typeof p.name_zh,'string');assert(!('wikidataid' in p));}
 for(const name of ['长江','黄河','塔里木河','孔雀河'])assert(rivers.some(p=>p.name_zh===name),name);
 for(const name of ['太行山','秦岭','准噶尔盆地','青藏高原','塔里木盆地'])assert(landforms.some(p=>p.name_zh===name),name);
 assert(landforms.every(p=>!('lines' in p)&&!('geometry' in p)));
 assert.equal(manifest.datasets.rivers.sourceFiles.length,4);
 for(const s of manifest.datasets.rivers.sourceFiles){assert.match(s.sha256,/^[a-f0-9]{64}$/);assert(s.url.includes('/v5.1.2/'));}
 const lines=prepareRivers(rivers);assert(lines.length>=rivers.length);
 for(const line of lines)for(const p of line.anchors){assert(Number.isFinite(p.lon)&&Number.isFinite(p.lat));assert(p.lon>=line.bbox[0]-1e-9&&p.lon<=line.bbox[2]+1e-9);}
 const counts=[0,1,2].map(detail=>lines.filter(l=>riverVisible(l,detail,12)).length);
 assert(counts[0]<counts[1]&&counts[1]<counts[2]);
});
test('A real decoded-tile burst reproduces V1 retention; completion pruning stays bounded over repeats',async t=>{
 const old={fetch:global.fetch,createImageBitmap:global.createImageBitmap,document:global.document};t.after(()=>Object.assign(global,old));
 const rgba=new Uint8ClampedArray(262144);for(let i=0;i<rgba.length;i+=4){rgba[i]=128;rgba[i+3]=255;}
 global.fetch=async()=>({ok:true,blob:async()=>({})});global.createImageBitmap=async()=>({width:256,height:256,close(){}});
 global.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:rgba})})})};
 const burst=async(store,offset)=>{await Promise.all(Array.from({length:256},(_,i)=>store.tile(i+offset,0,12)));return store.cache.size;};
 const v1=new V1Store(),current=new ElevationStore();
 assert.equal(await burst(v1,0),256);
 for(let round=0;round<4;round++){assert.equal(await burst(current,round*256),192);assert.equal(current.active,0);assert.equal(current.queue.length,0);}
 assert.equal(current.loaded,1024);
});
test('Real Cesium north-constrained pan, 200× target and fixed-heading tilt remain finite',{skip:!process.env.CESIUM_CJS_PATH},()=>{
 const C=createRequire(import.meta.url)(process.env.CESIUM_CJS_PATH);
 const scene={canvas:{clientWidth:1920,clientHeight:1080},drawingBufferWidth:1920,drawingBufferHeight:1080,mapProjection:new C.GeographicProjection(),ellipsoid:C.Ellipsoid.WGS84,mode:C.SceneMode.SCENE3D,screenSpaceCameraController:{enableTranslate:true,enableZoom:true}};
 const camera=new C.Camera(scene);scene.camera=camera;
 const north=()=>Math.min(Math.abs(camera.heading),Math.abs(camera.heading-2*Math.PI))<1e-6;
 for(const pitch of [-90,-60]){
  camera.setView({destination:C.Cartesian3.fromDegrees(103,34,7800000),orientation:{heading:0,pitch:C.Math.toRadians(pitch),roll:0}});
  applyNorthLock(C,scene,true);
  for(let i=0;i<20;i++){camera.rotateRight(.01);camera.rotateUp(.005);assert(north());}
  assert(scene.screenSpaceCameraController.enableZoom);assert(scene.screenSpaceCameraController.enableRotate);
  const target=C.Cartesian3.fromDegrees(87,31,5000*200);camera.lookAt(target,new C.HeadingPitchRange(0,C.Math.toRadians(-55),2800000));camera.lookAtTransform(C.Matrix4.IDENTITY);
  assert(north());assert(Number.isFinite(camera.positionCartographic.height));assert(camera.pitch<0);
  for(const height of [-11000*200,9000*200]){const p=C.Cartesian3.fromDegrees(90,30,height);assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));}
 }
 scene.mode=C.SceneMode.SCENE2D;applyNorthLock(C,scene,true);assert.equal(scene.screenSpaceCameraController.enableRotate,false);
 applyNorthLock(C,scene,false);assert(scene.screenSpaceCameraController.enableRotate&&scene.screenSpaceCameraController.enableTilt&&scene.screenSpaceCameraController.enableLook);
});