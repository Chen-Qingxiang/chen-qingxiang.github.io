import {PALETTES, cleanSettings, parseCoordinates, searchCities, parseGeoJSON, MAX_LATITUDE} from './core.js';
import {ElevationStore, createTerrainProvider, TerrainImageryProvider} from './terrain.js';
import {loadDataset, OverlayImageryProvider} from './layers.js';
import {terrainScreenSpaceError, mapZoom, labelEligible, riverVisible, placeLabels} from './cartography.js';
import {isTouchDevice, installMapUI} from './ui.js';
import {applyNorthLock} from './navigation.js';

const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'terrain-atlas-v1';
const places = {
  china: {name: '中国全境', lon: 103, lat: 34, range: 7800000, pitch: -90},
  tibet: {name: '青藏高原', lon: 87, lat: 31.3, range: 2800000, pitch: -58},
  sichuan: {name: '四川盆地', lon: 104.7, lat: 30, range: 1450000, pitch: -55},
  mediterranean: {name: '地中海', lon: 19, lat: 37, range: 4700000, pitch: -70},
  atlantic: {name: '大西洋海岭', lon: -29, lat: 20, range: 9500000, pitch: -65},
  andes: {name: '安第斯山脉', lon: -71, lat: -20, range: 5200000, pitch: -62},
};
let toastTimer;
function notify(message, timeout = 4500) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => {$('toast').hidden = true;}, timeout);
}
function initialState() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { /* Preferences are optional. */ }
  let shared = null;
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.has('view')) shared = JSON.parse(p.get('view'));
  } catch { notify('分享链接中的视图无效，已打开默认地图。'); }
  return {settings: cleanSettings(shared?.settings || saved?.settings || {}, isTouchDevice()), camera: shared?.camera || null};
}
function validCamera(camera) {
  if (!camera || !['lon','lat','height','heading','pitch','roll'].every(k => Number.isFinite(camera[k]))) return false;
  return Math.abs(camera.lon)<=180 && Math.abs(camera.lat)<=90 && camera.height>=100 && camera.height<=100000000 && Math.abs(camera.pitch)<=Math.PI/2;
}

export async function start(C) {
  const initial = initialState(), settings = initial.settings;
  let viewer, baseLayer, overlayLayer, manifest;
  let cityData = [], selected = null, selectionId = 0, searchTimer, refreshTimer, labelTimer;
  const datasets = new Map(), loadingData = new Map(), customLayers = [];
  const labelEntities = new Map();
  let customId = 0;
  let lastFailure = 0;
  const store = new ElevationStore(({active, loaded, failures}) => {
    $('load-dot').className = `status-dot ${active ? 'busy' : failures ? 'error' : ''}`;
    $('load-status').textContent = active ? `地形加载中 · ${active}` : failures ? '部分地形加载失败' : loaded ? '地形已就绪' : '等待地形数据';
    if (failures > lastFailure) {lastFailure = failures; notify('部分高程瓦片暂时无法连接，当前可能保留较粗地形。移动视图可重试。', 6500);}
    if (viewer) viewer.scene.requestRender();
  });
  const terrainProvider = createTerrainProvider(C, store);
  viewer = new C.Viewer('globe', {
    terrainProvider, baseLayer: false, animation: false, timeline: false, baseLayerPicker: false,
    geocoder: false, homeButton: false, infoBox: false, selectionIndicator: false, navigationHelpButton: false,
    fullscreenButton: false, sceneModePicker: false, skyBox: false, skyAtmosphere: false,
    creditContainer: $('credits'), requestRenderMode: true, maximumRenderTimeChange: Infinity,
    contextOptions: {webgl: {alpha: false}},
  });
  const scene = viewer.scene, camera = viewer.camera;
  scene.backgroundColor = C.Color.fromCssColorString('#102832');
  scene.globe.baseColor = C.Color.fromCssColorString('#b7c0b3');
  scene.globe.enableLighting = false;
  scene.globe.showWaterEffect = false;
  scene.globe.depthTestAgainstTerrain = true;
  scene.globe.maximumScreenSpaceError = terrainScreenSpaceError(scene.canvas.clientWidth,scene.canvas.clientHeight,isTouchDevice());
  scene.globe.tileCacheSize = 180;
  scene.globe.showGroundAtmosphere = false;
  scene.fog.enabled = false;
  scene.verticalExaggeration = settings.scale;
  scene.verticalExaggerationRelativeHeight = 0;
  scene.screenSpaceCameraController.minimumZoomDistance = 2000;
  scene.screenSpaceCameraController.maximumZoomDistance = 45000000;
  viewer.screenSpaceEventHandler.removeInputAction(C.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2;
  const save = () => {
    try {localStorage.setItem(STORAGE_KEY, JSON.stringify({settings}));} catch { /* Private browsing may disallow storage. */ }
  };
  const requestRender = () => scene.requestRender();
  function closeSearch() {$('search-results').hidden = true;}
  const ui=installMapUI(()=>{viewer.resize();requestRender();});
  const setPanel=ui.setPanel;
  const resizeDetail=()=>{
    scene.globe.maximumScreenSpaceError=terrainScreenSpaceError(scene.canvas.clientWidth,scene.canvas.clientHeight,isTouchDevice());
    clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshCities,180);requestRender();
  };
  new ResizeObserver(resizeDetail).observe(scene.canvas);

  function updateLegend() {
    const stops = PALETTES[settings.palette].stops;
    $('legend-name').textContent=PALETTES[settings.palette].name;
    for(const button of all('[data-palette]')) {
      const colors=PALETTES[button.dataset.palette].stops;
      button.querySelector('.swatch').style.background=`linear-gradient(100deg,${colors.map(([h,c])=>`${c} ${(h+11000)/200}%`).join(',')})`;
    }
    $('legend-ramp').style.background = `linear-gradient(to right, ${stops.map(([h,c]) => `${c} ${(h+11000)/200}%`).join(',')})`;
  }
  function replaceBase() {
    const next = new C.ImageryLayer(new TerrainImageryProvider(C, store, settings), {alpha: settings.colorOpacity/100});
    viewer.imageryLayers.add(next, 0);
    if (baseLayer) viewer.imageryLayers.remove(baseLayer, true);
    baseLayer = next; updateLegend(); requestRender();
  }
  function replaceOverlays() {
    const layers = [];
    if (settings.rivers && datasets.has('rivers')) layers.push({lines: datasets.get('rivers'), riverDetail:settings.riverDetail, color: '#277a9a', width: 2.2});
    if (settings.provinces && datasets.has('provinces')) layers.push({lines: datasets.get('provinces'), color: '#e9e1c4', width: 1.4, dash: [5,3]});
    if (settings.countries && datasets.has('countries')) layers.push({lines: datasets.get('countries'), color: '#384e40', width: 2.4});
    customLayers.filter(l => l.show).forEach(l => layers.push({lines: l.lines, color: l.color, width: 3}));
    if (!layers.length && !settings.grid) {
      if (overlayLayer) viewer.imageryLayers.remove(overlayLayer,true);
      overlayLayer=null;requestRender();return;
    }
    const next = new C.ImageryLayer(new OverlayImageryProvider(C, layers, settings.grid), {alpha: settings.opacity/100});
    viewer.imageryLayers.add(next);
    if (overlayLayer) viewer.imageryLayers.remove(overlayLayer, true);
    overlayLayer = next; requestRender();
  }
  async function ensureDataset(key) {
    if (datasets.has(key)) return datasets.get(key);
    if (!loadingData.has(key)) loadingData.set(key, loadDataset(manifest, key).then(data => {
      datasets.set(key, data); loadingData.delete(key); return data;
    }).catch(error => {loadingData.delete(key); throw error;}));
    return loadingData.get(key);
  }
  function updateScale() {
    scene.verticalExaggeration = settings.scale;
    $('scale').value = settings.scale;
    $('scale').style.setProperty('--fill', `${(settings.scale-1)/199*100}%`);
    $('scale-value').replaceChildren(document.createTextNode(String(settings.scale)), Object.assign(document.createElement('span'), {textContent: '×'}));
    $('scale-percent').textContent = `${settings.scale*100}%`;
    all('[data-scale]').forEach(b => {const active = Number(b.dataset.scale) === settings.scale; b.classList.toggle('active', active); b.setAttribute('aria-pressed',String(active));});
    save(); requestRender();
    clearTimeout(labelTimer); labelTimer = setTimeout(refreshCities, 250);
  }
  $('scale').oninput = event => {settings.scale = Number(event.target.value); updateScale();};
  all('[data-scale]').forEach(button => button.onclick = () => {settings.scale = Number(button.dataset.scale); updateScale();});
  all('[data-palette]').forEach(button => button.onclick = () => {
    settings.palette = button.dataset.palette;
    all('[data-palette]').forEach(b => {const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    replaceBase(); save();
  });
  for (const key of ['relief','cities','countries','provinces','rivers','landforms','grid']) {
    $(key).checked = settings[key];
    if (['countries','provinces','rivers','landforms'].includes(key)) $(key).disabled = true;
    $(key).onchange = async event => {
      settings[key] = event.target.checked; save();
      if (key === 'relief') return replaceBase();
      if (key === 'cities') return refreshCities();
      if (['countries','provinces','rivers','landforms'].includes(key) && settings[key] && !datasets.has(key)) {
        event.target.disabled = true;
        try {await ensureDataset(key);}
        catch (error) {settings[key]=false;event.target.checked=false;save();notify(error.message);}
        finally {event.target.disabled=false;}
      }
      replaceOverlays();refreshCities();
    };
  }
  for (const key of ['riverDetail','landformDetail']) {
    const sync=()=>all(`[data-detail="${key}"]`).forEach(b=>{
      const active=Number(b.dataset.level)===settings[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
    });
    sync();
    all(`[data-detail="${key}"]`).forEach(b=>b.onclick=()=>{
      settings[key]=Number(b.dataset.level);sync();save();
      if(key==='riverDetail')replaceOverlays();refreshCities();
    });
  }
  for (const [id, key, display] of [['opacity','opacity','opacity-value'],['color-opacity','colorOpacity','color-opacity-value']]) {
    $(id).value = settings[key]; $(id).style.setProperty('--fill',`${settings[key]}%`); $(display).textContent=`${settings[key]}%`;
    $(id).oninput = event => {
      settings[key]=Number(event.target.value); $(id).style.setProperty('--fill',`${settings[key]}%`); $(display).textContent=`${settings[key]}%`;
      if (key==='opacity' && overlayLayer) overlayLayer.alpha=settings[key]/100;
      if (key==='colorOpacity' && baseLayer) baseLayer.alpha=settings[key]/100;
      save();requestRender();
    };
  }

  function home() {
    camera.flyTo({destination:C.Cartesian3.fromDegrees(103,26,18500000),orientation:{heading:0,pitch:-Math.PI/2,roll:0},duration});
  }
  function flyToPoint(point, range = 900000, pitch = -55) {
    if (Math.abs(point.lat)>MAX_LATITUDE) notify('此处位于高程覆盖范围之外，只能显示位置。');
    if (settings.mode==='2d') {
      camera.flyTo({destination:C.Cartesian3.fromDegrees(point.lon,point.lat,range*1.4),duration});
    } else {
      const height = Math.max(0, (point.elevation || 0)*settings.scale);
      camera.flyToBoundingSphere(new C.BoundingSphere(C.Cartesian3.fromDegrees(point.lon,point.lat,height),1000), {
        offset:new C.HeadingPitchRange(0,C.Math.toRadians(pitch),range),duration,
      });
    }
  }
  all('[data-place]').forEach(button => button.onclick = () => {
    const p = places[button.dataset.place]; flyToPoint(p,p.range,p.pitch); closeSearch();
    if (ui.mobile()) setPanel(false);
  });
  function changeMode(mode, immediate=false) {
    settings.mode=mode;
    all('[data-mode]').forEach(b => {const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const time=immediate?0:duration;
    if (mode==='3d') scene.morphTo3D(time);
    else if (mode==='2d') scene.morphTo2D(time);
    else scene.morphToColumbusView(time);
    $('tilt').disabled=mode==='2d';
    save(); requestRender();
  }
  all('[data-mode]').forEach(button => button.onclick = () => changeMode(button.dataset.mode));
  $('home').onclick=home;
  $('zoom-in').onclick=() => {camera.zoomIn(Math.max(2000,camera.positionCartographic.height*0.3));requestRender();};
  $('zoom-out').onclick=() => {camera.zoomOut(Math.max(2000,camera.positionCartographic.height*0.4));requestRender();};
  function lookAtCenter(pitch, north=false) {
    if (settings.mode==='2d') {camera.setView({orientation:{heading:0,pitch:-Math.PI/2,roll:0}});requestRender();return;}
    const center = scene.globe.pick(camera.getPickRay(new C.Cartesian2(scene.canvas.clientWidth/2,scene.canvas.clientHeight/2)),scene);
    if (!center) return home();
    const range = C.Cartesian3.distance(camera.positionWC,center);
    camera.flyToBoundingSphere(new C.BoundingSphere(center,1),{offset:new C.HeadingPitchRange(north||settings.northLock?0:camera.heading,pitch,range),duration});
  }
  $('north').onclick=() => lookAtCenter(-Math.PI/2,true);
  function syncNorthLock() {
    applyNorthLock(C,scene,settings.northLock);
    $('north-lock').classList.toggle('active',settings.northLock);
    $('north-lock').setAttribute('aria-pressed',String(settings.northLock));
    $('north-lock').title=settings.northLock?'北向已锁定；使用 ◩ 调整倾斜':'锁定北向';
  }
  $('north-lock').onclick=()=>{
    settings.northLock=!settings.northLock;syncNorthLock();save();
    if(settings.northLock)lookAtCenter(camera.pitch,true);
  };
  scene.morphComplete.addEventListener(syncNorthLock);
  $('tilt').onclick=() => lookAtCenter(camera.pitch < -1.2 ? -Math.PI/3 : -Math.PI/2);

  function entityForPoint(point, id, color='#f5f0d8', selectedPoint=false) {
    return viewer.entities.add({id,name:point.zh||point.name,position:C.Cartesian3.fromDegrees(point.lon,point.lat),
      point:{pixelSize:selectedPoint?10:5,color:C.Color.fromCssColorString(color),outlineColor:C.Color.fromCssColorString('#1a3436'),outlineWidth:selectedPoint?2:1,
        heightReference:C.HeightReference.CLAMP_TO_GROUND},
      label:{text:point.zh||point.name,font:`${selectedPoint?16:14}px sans-serif`,style:C.LabelStyle.FILL_AND_OUTLINE,
        fillColor:C.Color.fromCssColorString(color),outlineColor:C.Color.fromCssColorString('#183238'),outlineWidth:3,
        pixelOffset:new C.Cartesian2(8,-5),horizontalOrigin:C.HorizontalOrigin.LEFT,verticalOrigin:C.VerticalOrigin.BOTTOM,
        heightReference:C.HeightReference.CLAMP_TO_GROUND},
      properties:{atlasPoint:point},
    });
  }
  const measure=document.createElement('canvas').getContext('2d');
  function refreshCities() {
    if (scene.mode===C.SceneMode.MORPHING) return;
    const width=scene.canvas.clientWidth,height=scene.canvas.clientHeight;
    const rect=camera.computeViewRectangle(scene.globe.ellipsoid);
    const cameraHeight=camera.positionCartographic.height;
    const zoom=mapZoom(cameraHeight,height,camera.frustum.fovy||Math.PI/3,camera.positionCartographic.latitude);
    const occluder=new C.EllipsoidalOccluder(scene.globe.ellipsoid,camera.positionWC),candidates=[];
    function add(point,kind,id,priority) {
      const text=point.name_zh||point.zh||point.name_en||point.name;
      if(!text||Math.abs(point.lat)>MAX_LATITUDE)return;
      const cart=C.Cartographic.fromDegrees(point.lon,point.lat);
      if(rect&&!C.Rectangle.contains(rect,cart))return;
      // getHeight returns the rendered surface (including exaggeration). Avoid
      // projecting every label at sea level on a 200× mountain.
      const surface=scene.globe.getHeight(cart)||0;
      const pos=C.Cartesian3.fromDegrees(point.lon,point.lat,surface);
      if(scene.mode===C.SceneMode.SCENE3D&&!occluder.isPointVisible(pos))return;
      const screen=C.SceneTransforms.worldToWindowCoordinates(scene,pos);if(!screen)return;
      const font=kind==='landform'?'500 14px sans-serif':kind==='river'?'13px sans-serif':'14px sans-serif';
      measure.font=font;
      candidates.push({point,kind,id,text,priority,font,x:screen.x,y:screen.y-(kind==='city'?12:0),w:measure.measureText(text).width,h:16});
    }
    if(settings.cities) {
      const rank=cameraHeight>10000000?2:cameraHeight>4000000?4:cameraHeight>1200000?7:10;
      for(const point of cityData)if(point.rank<=rank)add(point,'city',`city-${point.id}`,point.rank+1);
    }
    if(settings.landforms)for(const point of datasets.get('landforms')||[])
      if(labelEligible(point,'landform',zoom,settings.landformDetail))add(point,'landform',`landform-${point.id}`,point.scalerank-.3);
    if(settings.rivers)for(const line of datasets.get('rivers')||[]) {
      if(!labelEligible(line,'river',zoom,settings.riverDetail)||!riverVisible(line,settings.riverDetail,Math.floor(zoom)))continue;
      const span=Math.hypot((line.bbox[2]-line.bbox[0])*Math.cos(camera.positionCartographic.latitude),line.bbox[3]-line.bbox[1]);
      if(span*256*2**zoom/360<75)continue;
      line.anchors.forEach((point,index)=>add({...line,...point},'river',`river-${line.id}-${index}`,line.scalerank+index*.1));
    }
    const canvasRect=scene.canvas.getBoundingClientRect(),excluded=[];
    for(const el of all('#panel,.map-toolbar,.navigation,#legend,#legend-toggle,#selection,#credits')) {
      if(el.hidden||!el.getClientRects().length)continue;
      const r=el.getBoundingClientRect();excluded.push({x:r.left-canvasRect.left,y:r.top-canvasRect.top,w:r.width,h:r.height});
    }
    const wanted=new Set();
    for(const item of placeLabels(candidates,width,height,excluded)) {
      wanted.add(item.id);if(labelEntities.has(item.id))continue;
      const natural=item.kind!=='city',color=item.kind==='river'?'#205f7c':natural?'#514830':'#f5f0d8';
      const entity=viewer.entities.add({id:item.id,name:item.text,position:C.Cartesian3.fromDegrees(item.point.lon,item.point.lat),
        ...(natural?{}:{point:{pixelSize:4,color:C.Color.fromCssColorString(color),heightReference:C.HeightReference.CLAMP_TO_GROUND},properties:{atlasPoint:item.point}}),
        label:{text:item.text,font:item.font,style:C.LabelStyle.FILL_AND_OUTLINE,fillColor:C.Color.fromCssColorString(color),
          outlineColor:C.Color.fromCssColorString(natural?'#f5f1df':'#183238'),outlineWidth:natural?3:2,
          horizontalOrigin:C.HorizontalOrigin.CENTER,verticalOrigin:C.VerticalOrigin.CENTER,
          pixelOffset:new C.Cartesian2(0,natural?0:-12),heightReference:C.HeightReference.CLAMP_TO_GROUND},
      });
      labelEntities.set(item.id,entity);
    }
    for(const [id,entity] of labelEntities)if(!wanted.has(id)){viewer.entities.remove(entity);labelEntities.delete(id);}
    requestRender();
  }
  let cameraMoving=false;
  camera.moveStart.addEventListener(()=>{cameraMoving=true;});
  camera.moveEnd.addEventListener(()=>{cameraMoving=false;clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshCities,180);});
  scene.morphComplete.addEventListener(refreshCities);
  let lastTilesPending=0;
  scene.globe.tileLoadProgressEvent.addEventListener(pending=>{
    if(lastTilesPending && !pending){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshCities,180);}
    lastTilesPending=pending;
  });

  let selectionEntity;
  async function selectPoint(point, fly=true, sampledHeight=null) {
    if (Math.abs(point.lat)>MAX_LATITUDE) sampledHeight=null;
    selected={...point}; const token=++selectionId;
    $('selection').hidden=false; $('selection-name').textContent=point.zh||point.name||'地图上的位置';
    $('selection-type').textContent=point.country?'现代城市':point.custom?'自定义图层':'地形探针';
    $('selection-region').textContent=[point.country,point.region].filter(Boolean).join(' · ');
    $('selection-coords').textContent=`${point.lon.toFixed(4)}, ${point.lat.toFixed(4)}`;
    $('selection-height').textContent=Number.isFinite(sampledHeight)?`≈ ${Math.round(sampledHeight).toLocaleString()} m`:'读取中…';
    if (selectionEntity) viewer.entities.remove(selectionEntity);
    selectionEntity=entityForPoint({...point,name:point.zh||point.name||'选中位置'},'selection','#f2ce78',true);
    closeSearch();
    if (ui.mobile()) setPanel(false);
    if (fly) flyToPoint(point);
    requestRender();
    try {
      const elevation=sampledHeight===null?await store.sample(point.lon,point.lat):sampledHeight;
      if (token!==selectionId) return;
      selected.elevation=elevation;
      $('selection-height').textContent=elevation===null?'高程覆盖之外':`≈ ${Math.round(elevation).toLocaleString()} m`;
    } catch {if (token===selectionId) $('selection-height').textContent='暂时无法读取';}
  }
  $('selection-close').onclick=() => {selectionId++;selected=null;$('selection').hidden=true;if(selectionEntity){viewer.entities.remove(selectionEntity);selectionEntity=null;}requestRender();};
  $('selection-fly').onclick=() => {if(selected)flyToPoint(selected);};
  let currentResults=[];
  function renderSearch() {
    const query=$('search').value.trim(), container=$('search-results');container.replaceChildren();
    if (!query) return closeSearch();
    const coords=parseCoordinates(query);
    currentResults=coords?[{...coords,name:'经纬度定位'}]:searchCities(cityData,query);
    container.hidden=false;
    if (!currentResults.length) {
      const p=document.createElement('p');p.className='search-empty';p.textContent=cityData.length?'没有找到。可尝试英文城市名，或输入经度,纬度。城市库并不覆盖所有城镇。':'城市索引尚未就绪，请稍等或直接输入经度,纬度。';container.append(p);return;
    }
    for (const point of currentResults) {
      const button=document.createElement('button');button.className='search-result';
      const title=document.createElement('strong');title.textContent=point.zh||point.name;
      const subtitle=document.createElement('span');subtitle.textContent=coords?`${point.lon.toFixed(4)}, ${point.lat.toFixed(4)}`:[point.zh?point.name:'',point.country,point.region].filter(Boolean).join(' · ');
      button.append(title,subtitle);button.onclick=() => selectPoint(point);container.append(button);
    }
  }
  $('search').oninput=() => {clearTimeout(searchTimer);searchTimer=setTimeout(renderSearch,140);};
  $('search').onfocus=renderSearch;
  $('search').onkeydown=event => {
    if (event.key==='Enter') {clearTimeout(searchTimer);renderSearch();if(currentResults[0])selectPoint(currentResults[0]);}
    if (event.key==='ArrowDown') {$('search-results').querySelector('button')?.focus();event.preventDefault();}
    if (event.key==='Escape') closeSearch();
  };
  $('search-results').onkeydown=event => {
    const buttons=[...$('search-results').querySelectorAll('button')];const i=buttons.indexOf(document.activeElement);
    if (event.key==='ArrowDown') {buttons[(i+1)%buttons.length]?.focus();event.preventDefault();}
    if (event.key==='ArrowUp') {if(i<=0)$('search').focus();else buttons[i-1]?.focus();event.preventDefault();}
  };
  document.addEventListener('pointerdown',event => {if(!event.target.closest('.search-wrap'))closeSearch();});

  const handler=new C.ScreenSpaceEventHandler(scene.canvas);
  const pickedTerrain=position => {
    const ray=camera.getPickRay(position);if(!ray)return null;
    const cartesian=scene.globe.pick(ray,scene);if(!cartesian)return null;
    const cart=C.Cartographic.fromCartesian(cartesian);
    return {lon:C.Math.toDegrees(cart.longitude),lat:C.Math.toDegrees(cart.latitude),elevation:cart.height/settings.scale};
  };
  let lastMove=0;
  handler.setInputAction(event => {
    if(cameraMoving||performance.now()-lastMove<80)return;lastMove=performance.now();
    const point=pickedTerrain(event.endPosition);if(!point)return;
    const heightText=Math.abs(point.lat)>MAX_LATITUDE?'高程覆盖之外':settings.mode==='2d'?'点击读取高程':`≈ ${Math.round(point.elevation).toLocaleString()} m`;
    $('coordinates').textContent=`${point.lon.toFixed(3)}° ${point.lat.toFixed(3)}° · ${heightText}`;
  },C.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(event => {
    const picked=scene.pick(event.position);const entity=picked?.id;
    const point=entity?.properties?.atlasPoint?.getValue(viewer.clock.currentTime);
    if(point)return selectPoint(point,false);
    const p=pickedTerrain(event.position);if(p)selectPoint({...p,name:'地图上的位置'},false,settings.mode==='2d'?null:p.elevation);
  },C.ScreenSpaceEventType.LEFT_CLICK);

  function renderCustomLayers() {
    const container=$('custom-layers');container.replaceChildren();
    for(const layer of customLayers){
      const row=document.createElement('div');row.className='custom-layer';
      const input=document.createElement('input');input.type='checkbox';input.checked=layer.show;input.id=`custom-${layer.id}`;
      const label=document.createElement('label');label.htmlFor=input.id;label.textContent=layer.name;label.title=layer.name;
      input.onchange=()=>{layer.show=input.checked;layer.entities.forEach(e=>{e.show=layer.show;});replaceOverlays();};
      const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label',`移除 ${layer.name}`);
      remove.onclick=()=>{layer.entities.forEach(e=>viewer.entities.remove(e));customLayers.splice(customLayers.indexOf(layer),1);renderCustomLayers();replaceOverlays();};
      row.append(input,label,remove);container.append(row);
    }
  }
  $('import-button').onclick=()=> $('import-file').click();
  $('import-file').onchange=async event=>{
    const files=[...event.target.files];event.target.value='';
    for(const file of files){
      try{
        if(customLayers.length>=8)throw new Error('最多同时加载 8 个自定义图层。');
        if(file.size>10*1024*1024)throw new Error('每个文件最大 10 MB，请先简化数据。');
        const parsed=parseGeoJSON(JSON.parse(await file.text()));
        const id=++customId,color=['#f2ce78','#e79a76','#b9e0c9','#dac0ec'][id%4];
        const layer={...parsed,id,name:file.name,show:true,color,entities:[]};
        parsed.points.forEach((p,i)=>layer.entities.push(entityForPoint({...p,custom:true},`custom-${id}-${i}`,color)));
        customLayers.push(layer);renderCustomLayers();replaceOverlays();
        const first=parsed.points[0]||(parsed.lines[0]?{lon:parsed.lines[0].points[0][0],lat:parsed.lines[0].points[0][1]}:null);
        if(first)flyToPoint(first,1600000,-65);
        notify(`已导入 ${file.name}，刷新后需重新导入原文件。`,6000);
      }catch(error){notify(`${file.name}：${error.message}`,7000);}
    }
  };
  $('share').onclick=async()=>{
    if(scene.mode===C.SceneMode.MORPHING)return notify('视图切换完成后再分享。');
    const pos=camera.positionCartographic;
    const state={settings,camera:{lon:C.Math.toDegrees(pos.longitude),lat:C.Math.toDegrees(pos.latitude),height:pos.height,heading:camera.heading,pitch:camera.pitch,roll:camera.roll}};
    const url=new URL(location.href);url.hash=new URLSearchParams({view:JSON.stringify(state)}).toString();
    try{await navigator.clipboard.writeText(url.href);notify(customLayers.length?'链接已复制；导入的图层文件需要另行分享。':'当前视图链接已复制。');}
    catch{window.prompt('复制当前视图链接',url.href);}
  };
  $('help-open').onclick=()=>$('help').showModal();$('help-close').onclick=()=>$('help').close();
  $('help').onclick=event=>{if(event.target===$('help')){const rect=$('help').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('help').close();}};
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea,select')||$('help').open)return;
    if(event.key==='/'){event.preventDefault();setPanel(true);$('search').focus();}
    if(event.key==='0')home();
    if(event.key==='+'||event.key==='=')$('zoom-in').click();
    if(event.key==='-')$('zoom-out').click();
    if(event.key==='Escape'){closeSearch();$('selection-close').click();}
  });
  scene.renderError.addEventListener((scene,error)=>{console.error(error);notify('三维渲染中断，请重新加载页面。若仍有问题，请检查浏览器硬件加速。',15000);});
  scene.canvas.addEventListener('webglcontextlost',()=>notify('图形上下文已丢失。请关闭其他大型图形页面后重新加载。',15000));

  replaceBase();updateScale();
  all('[data-palette]').forEach(b=>{const active=b.dataset.palette===settings.palette;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  if(settings.mode!=='3d')changeMode(settings.mode,true);
  if(validCamera(initial.camera)) {
    const p=initial.camera;camera.setView({destination:C.Cartesian3.fromDegrees(p.lon,p.lat,p.height),orientation:{heading:settings.northLock?0:p.heading,pitch:p.pitch,roll:settings.northLock?0:p.roll}});
  } else camera.setView({destination:C.Cartesian3.fromDegrees(103,26,18500000),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});
  syncNorthLock();
  $('loading').hidden=true;
  try {
    const response=await fetch(new URL('../data/manifest.json',import.meta.url));if(!response.ok)throw new Error('基础图层目录加载失败');manifest=await response.json();
    await Promise.all([
      ensureDataset('cities').then(data=>{cityData=data;$('search-hint').textContent=`${data.length.toLocaleString()} 座城市 · 中英文检索`;refreshCities();if($('search').value)renderSearch();}),
      ...['countries','provinces','rivers','landforms'].filter(k=>settings[k]).map(async key=>{await ensureDataset(key);replaceOverlays();refreshCities();}),
    ]);
  }catch(error){notify(error.message,7000);$('search-hint').textContent='城市数据未就绪；仍可输入经纬度定位。';}
  if (manifest) ['countries','provinces','rivers','landforms'].forEach(key => {$(key).disabled=false;});
  replaceOverlays();requestRender();
}
