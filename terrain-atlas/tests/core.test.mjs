import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeTerrarium,toMercator,fromMercator,tileCoordinate,heightGrid,cleanSettings,parseCoordinates,searchCities,parseGeoJSON,makeColorTable,prepareLines} from '../src/core.js';

test('Terrarium decoding preserves ocean depths, sea level and fractions',()=>{
  assert.equal(decodeTerrarium(128,0,0),0);
  assert.equal(decodeTerrarium(124,24,0),-1000);
  assert.equal(decodeTerrarium(162,144,0),8848);
  assert.equal(decodeTerrarium(128,0,128),0.5);
});
test('Mercator conversions round trip cities and clamp polar coverage',()=>{
  for(const [lon,lat] of [[116.4,39.9],[-3.6,37.2],[0,0],[179.99,-80]]){
    const p=fromMercator(...toMercator(lon,lat));assert(Math.abs(p[0]-lon)<1e-8);assert(Math.abs(p[1]-lat)<1e-8);
  }
  assert(Math.abs(toMercator(0,90)[1])<1e-10);
  const tile=tileCoordinate(180,0,5);assert.equal(tile.x,0);assert.equal(tile.y,16);
  for(const lat of [-90,90]){const t=tileCoordinate(0,lat,0);assert.equal(t.y,0);assert(t.py>=0&&t.py<=255);}
});
test('Adjacent terrain grids have exactly matching shared edges',()=>{
  const tile=(tx,ty)=>Float32Array.from({length:256*256},(_,i)=>(ty*256+Math.floor(i/256))*1000+tx*256+i%256-9000);
  const a=heightGrid([tile(0,0),tile(1,0),tile(0,1),tile(1,1)]);
  const east=heightGrid([tile(1,0),tile(2,0),tile(1,1),tile(2,1)]);
  const south=heightGrid([tile(0,1),tile(1,1),tile(0,2),tile(1,2)]);
  for(let i=0;i<65;i++){assert.equal(a[i*65+64],east[i*65]);assert.equal(a[64*65+i],south[i]);}
  assert.equal(a[0],-9000);
});
test('Untrusted view settings cannot inject keys or invalid numeric values',()=>{
  assert.equal(cleanSettings({scale:Infinity}).scale,30);assert.equal(cleanSettings({scale:-2}).scale,1);
  assert.equal(cleanSettings({scale:200}).scale,200);assert.equal(cleanSettings({palette:'__proto__'}).palette,'atlas');
  assert.equal(cleanSettings({mode:'invalid',cities:'false'}).mode,'3d');
  assert.deepEqual(parseCoordinates('116.4，39.9'),{lon:116.4,lat:39.9});assert.equal(parseCoordinates('181,0'),null);
  assert.equal(parseCoordinates('<script>,1'),null);
});
test('GeoJSON validates coordinates, CRS, supported geometry and limits',()=>{
  const parsed=parseGeoJSON({type:'FeatureCollection',features:[{type:'Feature',properties:{name:'自定义地点'},geometry:{type:'Point',coordinates:[116,39,100]}},{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[0,1],[0,0]]]}}]});
  assert.equal(parsed.points[0].name,'自定义地点');assert.equal(parsed.lines.length,1);assert.equal(parsed.vertices,5);
  assert.throws(()=>parseGeoJSON({type:'Point',coordinates:[181,0]}),/WGS84/);
  assert.throws(()=>parseGeoJSON({type:'Point',coordinates:['116',39]}),/WGS84/);
  assert.throws(()=>parseGeoJSON({type:'FeatureCollection',features:[]}),/没有可显示/);
  assert.throws(()=>parseGeoJSON({type:'Point',coordinates:[1,2],crs:{properties:{name:'EPSG:3857'}}}),/WGS84/);
  assert.throws(()=>parseGeoJSON({type:'MultiPoint',coordinates:Array.from({length:2001},()=>[1,2])}),/2,000/);
  assert.throws(()=>parseGeoJSON({type:'LineString',coordinates:Array.from({length:100001},()=>[1,2])}),/100,000/);
  assert.equal(prepareLines([Array.from({length:100000},(_,i)=>[i/1000,1])])[0].bbox[2],99.999);
});
test('Color ramps cover bathymetry and land with distinct sea-level sides',()=>{
  const table=makeColorTable('atlas');assert.equal(table.length,20001*3);
  assert.notDeepEqual([...table.subarray(10999*3,10999*3+3)],[...table.subarray(11000*3,11000*3+3)]);
});
test('Pinned data is complete and bilingual city lookup returns real coordinates',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../data/manifest.json',import.meta.url),'utf8'));
  let cities;
  for(const [key,d] of Object.entries(manifest.datasets)){
    assert.match(d.sourceSha256,/^[a-f0-9]{64}$/);assert(d.source.includes('/v5.1.2/'));
    const rows=(await Promise.all(d.files.map(path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(JSON.parse)))).flat();
    assert.equal(rows.length,d.count);
    if(key==='cities')cities=rows;
    else if(key==='landforms')for(const p of rows){assert(Number.isFinite(p.lon)&&Math.abs(p.lon)<=180);assert(Number.isFinite(p.lat)&&Math.abs(p.lat)<=90);}
    else for(const line of key==='rivers'?rows.flatMap(r=>r.lines):rows){assert(line.length>=2);for(const [lon,lat] of line)assert(Number.isFinite(lon)&&Math.abs(lon)<=180.001&&Number.isFinite(lat)&&Math.abs(lat)<=90);}
  }
  assert.equal(cities.length,7342);
  for(const query of ['北京','Beijing','成都','Chengdu','Granada'])assert(searchCities(cities,query).length>0,query);
  const beijing=searchCities(cities,'北京')[0];assert(Math.abs(beijing.lon-116.4)<0.5);assert(Math.abs(beijing.lat-39.9)<0.5);
  assert.deepEqual(searchCities(cities,'no-city-with-this-name-98765'),[]);
});
