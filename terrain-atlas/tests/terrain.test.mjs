import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {ElevationStore,createTerrainProvider} from '../src/terrain.js';
import {MAX_LEVEL} from '../src/core.js';

test('Southern edge repeats its last row without wrapping to the north',async()=>{
  const store=new ElevationStore();
  store.tile=async(x,y,z)=>Float32Array.from({length:256*256},(_,i)=>Math.floor(i/256));
  const grid=await store.grid(0,1,1);
  assert.equal(grid[0],0);assert.equal(grid[64*65],255);assert.equal(grid[64*65+64],255);
});
test('Elevation store returns no made-up height outside its coverage',async()=>{
  const store=new ElevationStore();assert.equal(await store.sample(0,89),null);assert.equal(await store.sample(0,-89),null);
});
test('Network queue never exceeds 10 active jobs and drains after failure',async()=>{
  const store=new ElevationStore();let active=0,max=0;
  const results=await Promise.allSettled(Array.from({length:24},(_,i)=>store.schedule(async()=>{
    active++;max=Math.max(active,max);await new Promise(resolve=>setTimeout(resolve,3));active--;if(i===5)throw new Error('expected failure');return i;
  })));
  assert.equal(max,10);assert.equal(store.active,0);assert.equal(store.queue.length,0);assert.equal(results.filter(r=>r.status==='rejected').length,1);
});
test('Real Cesium accepts negative heightmaps and stops requesting at the maximum level',{skip:!process.env.CESIUM_CJS_PATH},async()=>{
  const require=createRequire(import.meta.url),C=require(process.env.CESIUM_CJS_PATH);
  assert.equal(C.VERSION,'1.145.0');
  const provider=createTerrainProvider(C,{grid:async()=>new Float32Array(65*65).fill(-4321)});
  assert(provider.tilingScheme instanceof C.WebMercatorTilingScheme);
  const tile=await provider.requestTileGeometry(0,0,0);
  assert(tile instanceof C.HeightmapTerrainData);
  const rect=provider.tilingScheme.tileXYToRectangle(0,0,0);
  assert.equal(tile.interpolateHeight(rect,0,0),-4321);
  const last=await provider.requestTileGeometry(0,0,MAX_LEVEL);
  assert.equal(last.isChildAvailable(0,0,0,0),false);
  assert.equal(provider.getTileDataAvailable(0,0,MAX_LEVEL+1),false);
  assert(provider.getLevelMaximumGeometricError(1)<provider.getLevelMaximumGeometricError(0));
});
