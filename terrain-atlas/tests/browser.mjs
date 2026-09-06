import {ElevationStore as V1Store, TerrainImageryProvider as V1Terrain} from './fixtures/v1-terrain.js';
import {OverlayImageryProvider as V1Overlay} from './fixtures/v1-layers.js';
import {ElevationStore, TerrainImageryProvider} from '../src/terrain.js';
import {OverlayImageryProvider, loadDataset} from '../src/layers.js';
import {PALETTES} from '../src/core.js';
const C=window.Cesium, output=document.getElementById('results');
const store=new ElevationStore();
const views={china:[4,11,5],tibet:[6,46,25],mediterranean:[5,16,11],pacific:[5,5,15]};
const tileList=([z,x,y])=>Array.from({length:6},(_,i)=>[x+i%3,y+Math.floor(i/3),z]);
const stats=values=>{const s=values.toSorted((a,b)=>a-b);return {medianMs:+s[Math.floor(s.length/2)].toFixed(3),p95Ms:+s[Math.floor(s.length*.95)].toFixed(3),totalMs:+s.reduce((a,b)=>a+b,0).toFixed(1),calls:s.length};};
const pause=()=>new Promise(r=>setTimeout(r,0));
async function bench(provider,tiles){
 for(let i=0;i<5;i++)await provider.requestImage(...tiles[i%tiles.length]);
 const times=[];
 for(let repeat=0;repeat<8;repeat++)for(const tile of tiles){const t=performance.now();await provider.requestImage(...tile);times.push(performance.now()-t);await pause();}
 return stats(times);
}
document.getElementById('benchmark').onclick=async()=>{
 try{
 output.textContent='正在加载真实高程样本…';
 const tiles=Object.values(views).map(v=>tileList(v)[0]);const heights=new Map();
 for(const tile of tiles)heights.set(tile.join('/'),await store.tile(...tile));
 const warmStore={tile:async(...tile)=>heights.get(tile.join('/'))};
 const report={date:new Date().toISOString(),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight,devicePixelRatio],note:'Network excluded; actual 256×256 Canvas allocation, paint and putImageData included; not WebGL frame time',terrain:{},overlay:{}};
 for(const [version,Provider] of [['v1',V1Terrain],['current',TerrainImageryProvider]])for(const relief of [true,false]){
  report.terrain[`${version}-shade-${relief}`]=await bench(new Provider(C,warmStore,{palette:'atlas',relief}),tiles);
  output.textContent=JSON.stringify(report,null,2);
 }
 const manifest=await fetch('../data/manifest.json').then(r=>r.json());
 const countries=await loadDataset(manifest,'countries'),provinces=await loadDataset(manifest,'provinces');
 for(const [name,lines] of [['empty',[]],['countries',countries],['provinces',provinces]])for(const [version,Provider] of [['v1',V1Overlay],['current',OverlayImageryProvider]]){
  report.overlay[`${version}-${name}`]=await bench(new Provider(C,[{lines,color:'#384e40',width:2.4}],false),[[6,2,2],[12,5,3],[23,10,4],[46,20,5]]);
 }
 output.textContent=JSON.stringify(report,null,2);
 }catch(error){output.textContent+='\n'+error.stack;}
};
document.getElementById('gallery-button').onclick=async()=>{
 const region=document.getElementById('region').value,tiles=tileList(views[region]),gallery=document.getElementById('gallery');gallery.replaceChildren();output.textContent='正在生成真实高程配色样本…';
 try{for(const [palette,{name}] of Object.entries(PALETTES)){
  const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');canvas.width=768;canvas.height=512;caption.textContent=name+' · '+region;
  const provider=new TerrainImageryProvider(C,store,{palette,relief:true}),ctx=canvas.getContext('2d');
  for(let i=0;i<tiles.length;i++)ctx.drawImage(await provider.requestImage(...tiles[i]),i%3*256,Math.floor(i/3)*256);
  figure.append(canvas,caption);gallery.append(figure);
 }output.textContent='完成。二维配色样本；未进行透视或 3D 地形渲染。';}catch(error){output.textContent+='\n'+error.stack;}
};
