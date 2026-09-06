import {MAX_LEVEL, MAX_LATITUDE, clamp, decodeTerrarium, heightGrid, makeColorTable, tileCoordinate, fromMercator} from '../../src/core.js';

const TILE_URL = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium';
const creditHTML = 'Terrain Tiles · <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Mapzen / AWS</a> · <a href="./sources.html#terrain" target="_blank" rel="noopener">数据来源与许可</a>';

export class ElevationStore {
  constructor(onStatus = () => {}) {
    this.cache = new Map();
    this.active = 0;
    this.queue = [];
    this.onStatus = onStatus;
    this.loaded = 0;
    this.failures = 0;
  }
  async schedule(task) {
    if (this.active >= 10) await new Promise(resolve => this.queue.push(resolve));
    else this.active++;
    try { return await task(); }
    finally {
      const next = this.queue.shift();
      if (next) next(); else this.active--;
      this.onStatus({active: this.active + this.queue.length, loaded: this.loaded, failures: this.failures});
    }
  }
  tile(x, y, level) {
    const n = 2 ** level;
    x = ((x % n) + n) % n;
    y = clamp(y, 0, n - 1);
    const key = `${level}/${x}/${y}`;
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      this.cache.delete(key); this.cache.set(key, entry);
      return entry.promise;
    }
    const entry = {done: false};
    entry.promise = this.schedule(async () => {
      this.onStatus({active: this.active + this.queue.length, loaded: this.loaded, failures: this.failures});
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(`${TILE_URL}/${key}.png`, {signal: AbortSignal.timeout(20000)});
          if (!response.ok) throw new Error(`高程瓦片 HTTP ${response.status}`);
          const blob = await response.blob();
          const bitmap = await createImageBitmap(blob, {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
          if (bitmap.width !== 256 || bitmap.height !== 256) { bitmap.close(); throw new Error('高程瓦片尺寸异常'); }
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
          const ctx = canvas.getContext('2d', {willReadFrequently: true});
          ctx.drawImage(bitmap, 0, 0); bitmap.close();
          const rgba = ctx.getImageData(0, 0, 256, 256).data, heights = new Float32Array(256 * 256);
          for (let i = 0; i < heights.length; i++) heights[i] = decodeTerrarium(rgba[i*4], rgba[i*4+1], rgba[i*4+2]);
          this.loaded++; entry.done = true;
          return heights;
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
      this.failures++; this.cache.delete(key);
      throw lastError;
    });
    this.cache.set(key, entry);
    if (this.cache.size > 192) {
      for (const [oldKey, oldEntry] of this.cache) {
        if (this.cache.size <= 192) break;
        if (oldEntry.done) this.cache.delete(oldKey);
      }
    }
    return entry.promise;
  }
  async grid(x, y, level) {
    const tiles = await Promise.all([this.tile(x, y, level), this.tile(x+1, y, level), this.tile(x, y+1, level), this.tile(x+1, y+1, level)]);
    // South edge of Mercator coverage repeats the last row, never jumps north.
    if (y === 2 ** level - 1) {
      tiles[2] = tiles[2].slice(); tiles[3] = tiles[3].slice();
      tiles[2].set(tiles[0].subarray(255*256), 0);
      tiles[3].set(tiles[1].subarray(255*256), 0);
    }
    return heightGrid(tiles);
  }
  async sample(lon, lat, level = 9) {
    if (Math.abs(lat) > MAX_LATITUDE) return null;
    const {x, y, px, py} = tileCoordinate(lon, lat, level);
    const tile = await this.tile(x, y, level);
    const ix = Math.floor(px), iy = Math.floor(py), tx = px-ix, ty = py-iy;
    const h = (x, y) => tile[Math.min(y,255)*256 + Math.min(x,255)];
    return h(ix,iy)*(1-tx)*(1-ty)+h(ix+1,iy)*tx*(1-ty)+h(ix,iy+1)*(1-tx)*ty+h(ix+1,iy+1)*tx*ty;
  }
}

export function createTerrainProvider(C, store) {
  const provider = new C.CustomHeightmapTerrainProvider({
    width: 65, height: 65, tilingScheme: new C.WebMercatorTilingScheme(),
    credit: new C.Credit(creditHTML, true), callback: (x, y, level) => store.grid(x, y, level),
  });
  provider.requestTileGeometry = (x, y, level) => store.grid(x, y, level).then(buffer => new C.HeightmapTerrainData({
    buffer, width: 65, height: 65, childTileMask: level < MAX_LEVEL ? 15 : 0,
  }));
  provider.getTileDataAvailable = (x, y, level) => level <= MAX_LEVEL;
  return provider;
}

export class TerrainImageryProvider {
  constructor(C, store, settings) {
    this.tilingScheme = new C.WebMercatorTilingScheme();
    this.rectangle = this.tilingScheme.rectangle;
    this.tileWidth = this.tileHeight = 256;
    this.minimumLevel = 0; this.maximumLevel = MAX_LEVEL;
    this.errorEvent = new C.Event();
    this.credit = new C.Credit(creditHTML, true);
    this.hasAlphaChannel = false;
    this.store = store;
    this.colors = makeColorTable(settings.palette);
    this.relief = settings.relief;
  }
  getTileCredits() { return undefined; }
  pickFeatures() { return undefined; }
  async requestImage(x, y, level) {
    const heights = await this.store.tile(x, y, level);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(256,256), rgba = pixels.data;
    const centerLat = fromMercator(0, (y + 0.5) / 2**level)[1] * Math.PI / 180;
    const resolution = 40075016.686 * Math.cos(centerLat) / (256 * 2**level);
    const strength = clamp(6 - level * 0.32, 1.4, 6);
    for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) {
      const i = py*256 + px, c = (clamp(Math.round(heights[i]), -11000, 9000) + 11000)*3;
      let shade = 1;
      if (this.relief) {
        const dx = (heights[py*256+Math.min(255,px+1)]-heights[py*256+Math.max(0,px-1)]) / (resolution*(px===0||px===255?1:2));
        const dy = (heights[Math.min(255,py+1)*256+px]-heights[Math.max(0,py-1)*256+px]) / (resolution*(py===0||py===255?1:2));
        const nx = -dx*strength, ny = -dy*strength;
        const light = (nx*-0.5 + ny*-0.5 + 0.7071) / Math.sqrt(nx*nx+ny*ny+1);
        shade = clamp(0.55 + Math.max(0,light)*0.64, 0.55, 1.16);
      }
      for (let j=0;j<3;j++) rgba[i*4+j] = this.colors[c+j]*shade;
      rgba[i*4+3] = 255;
    }
    ctx.putImageData(pixels,0,0);
    return canvas;
  }
}
