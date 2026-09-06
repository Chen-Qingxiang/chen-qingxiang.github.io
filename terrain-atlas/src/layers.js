import {prepareLines} from './core.js';

export async function loadDataset(manifest, key) {
  const batches = await Promise.all(manifest.datasets[key].files.map(async path => {
    const response = await fetch(new URL(`../${path}`, import.meta.url));
    if (!response.ok) throw new Error(`${key} 数据加载失败 (${response.status})`);
    return response.json();
  }));
  const records = batches.flat();
  return key === 'cities' ? records : prepareLines(records);
}

export class OverlayImageryProvider {
  constructor(C, layers, graticule) {
    this.tilingScheme = new C.GeographicTilingScheme();
    this.rectangle = this.tilingScheme.rectangle;
    this.tileWidth = this.tileHeight = 512;
    this.minimumLevel = 0; this.maximumLevel = 12;
    this.errorEvent = new C.Event();
    this.hasAlphaChannel = true;
    this.layers = layers;
    this.graticule = graticule;
    this.credit = new C.Credit('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> · 现代地理参照', true);
  }
  getTileCredits() { return undefined; }
  pickFeatures() { return undefined; }
  requestImage(x, y, level) {
    const nx = 2**(level+1), ny = 2**level;
    const west = x/nx*360-180, east = (x+1)/nx*360-180;
    const north = 90-y/ny*180, south = 90-(y+1)/ny*180;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const px = lon => (lon-west)/(east-west)*512, py = lat => (north-lat)/(north-south)*512;
    for (const layer of this.layers) {
      ctx.lineWidth = layer.width || 1.5; ctx.strokeStyle = layer.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (layer.dash) ctx.setLineDash(layer.dash); else ctx.setLineDash([]);
      ctx.beginPath();
      for (const {points, bbox} of layer.lines) {
        if (bbox[2]<west || bbox[0]>east || bbox[3]<south || bbox[1]>north) continue;
        let previous;
        for (const p of points) {
          if (!previous || Math.abs(p[0]-previous[0])>180) ctx.moveTo(px(p[0]),py(p[1]));
          else ctx.lineTo(px(p[0]),py(p[1]));
          previous = p;
        }
      }
      ctx.stroke();
    }
    if (this.graticule) {
      const step = level<2 ? 30 : level<4 ? 10 : level<6 ? 5 : level<8 ? 1 : 0.25;
      ctx.strokeStyle = 'rgba(245,244,227,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([3,5]); ctx.beginPath();
      for (let lon=Math.ceil(west/step)*step;lon<east;lon+=step) {ctx.moveTo(px(lon),0);ctx.lineTo(px(lon),512);}
      for (let lat=Math.ceil(south/step)*step;lat<north;lat+=step) {ctx.moveTo(0,py(lat));ctx.lineTo(512,py(lat));}
      ctx.stroke();
    }
    return Promise.resolve(canvas);
  }
}
