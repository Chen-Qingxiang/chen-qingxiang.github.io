import {clamp, prepareLines} from './core.js';

export const DETAIL_RANKS = Object.freeze({river: [3,6,12], landform: [3,5,8]});
export function terrainScreenSpaceError(width, height, touch=false) {
  // Keep the V1 detail on touch devices and modest desktop canvases. Large
  // desktops trade at most 2 px of geometric screen error for fewer tiles.
  return touch ? 2.5 : clamp(2.5*Math.sqrt(width*height/(1280*800)),2.5,4.5);
}
export function mapZoom(height, viewportHeight, fovy=Math.PI/3, latitude=0) {
  const metresPerPixel=2*Math.max(2000,height)*Math.tan(fovy/2)/Math.max(1,viewportHeight);
  return clamp(Math.log2(40075016.686*Math.max(.2,Math.cos(latitude))/256/metresPerPixel),0,15);
}
export function labelEligible(point, kind, zoom, detail) {
  const maxRank=kind==='river'?Math.floor(zoom):Math.floor(zoom+1);
  return point.scalerank<=Math.min(DETAIL_RANKS[kind][detail],maxRank)
    && point.min_label<=zoom+(kind==='river'?.6:.9);
}
export function riverVisible(line, detail, tileLevel) {
  return line.scalerank<=DETAIL_RANKS.river[detail] && line.min_zoom<=tileLevel+2;
}
export function overlaps(a,b) {
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}
export function placeLabels(candidates, width, height, excluded=[]) {
  const boxes=[...excluded], result=[], names=new Set(), counts={city:0,river:0,landform:0};
  const factor=clamp(width*height/(1100*800),.45,1.4);
  const limits={city:Math.round(42*factor),river:Math.round(15*factor),landform:Math.round(22*factor)};
  // Interleave important natural names and city names, then use one shared
  // collision set, so adding a layer cannot put text over another label.
  for (const item of [...candidates].sort((a,b)=>a.priority-b.priority || a.id.localeCompare(b.id))) {
    const key=item.kind+':'+item.text, box={x:item.x-item.w/2-5,y:item.y-item.h/2-4,w:item.w+10,h:item.h+8};
    if (counts[item.kind]>=limits[item.kind] || names.has(key) || box.x<4 || box.y<4 || box.x+box.w>width-4 || box.y+box.h>height-4 || boxes.some(b=>overlaps(box,b))) continue;
    boxes.push(box); names.add(key); counts[item.kind]++; result.push(item);
  }
  return result;
}
export function lineAnchors(points) {
  const lengths=[0];
  for(let i=1;i<points.length;i++) {
    const [a,b]=[points[i-1],points[i]],dx=(b[0]-a[0])*Math.cos((a[1]+b[1])*Math.PI/360);
    lengths.push(lengths[i-1]+Math.hypot(dx,b[1]-a[1]));
  }
  return [.5,.25,.75].map(fraction=>{
    const target=lengths.at(-1)*fraction;
    let i=1;while(i<lengths.length-1 && lengths[i]<target)i++;
    const a=points[i-1],b=points[i],t=(target-lengths[i-1])/(lengths[i]-lengths[i-1]||1);
    return {lon:a[0]+(b[0]-a[0])*t,lat:a[1]+(b[1]-a[1])*t};
  });
}
export function prepareRivers(records) {
  return records.flatMap(record=>prepareLines(record.lines).map((line,index)=>({
    ...line,id:record.id+'-'+index,name:record.name,name_zh:record.name_zh,name_en:record.name_en,
    scalerank:record.scalerank,min_zoom:record.min_zoom,min_label:record.min_label,
    anchors:lineAnchors(line.points),
  })));
}
