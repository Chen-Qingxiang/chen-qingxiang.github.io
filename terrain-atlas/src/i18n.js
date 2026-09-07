const MESSAGES = {
  en: {
    documentTitle: 'Terrain Atlas · 山海图',
    description: 'Terrain Atlas: an interactive 3D globe with adjustable vertical exaggeration, city search, modern boundaries, rivers, landforms and your own GeoJSON layers.',
    brandTitle: 'Terrain Atlas<span>山海图</span>',
    tagline: 'Put history back among mountains and rivers',
    globeAria: 'Interactive map: drag to rotate, wheel or pinch to zoom, Ctrl + drag to tilt',
    panelAria: 'Map controls',
    searchLabel: 'Search cities or coordinates', searchPlaceholder: 'City / longitude, latitude', searchResults: 'Search results', searchLoading: 'Loading city index…',
    terrainRelief: 'Terrain relief', landSeafloor: 'Land + seafloor', verticalExaggeration: 'Vertical exaggeration', trueScale: 'True scale 1×', scalePresets: 'Vertical exaggeration presets', scaleExplanation: 'Magnifies vertical relief only; horizontal distances are unchanged.',
    terrainColours: 'Terrain colours', paletteGroup: 'Terrain colour schemes', 'palette.atlas': 'Atlas', 'palette.topo15': 'Global Relief', 'palette.vivid': 'Strong relief', 'palette.school': 'School atlas', 'palette.ocean': 'Seafloor', 'palette.earth': 'Paper terrain', 'palette.gray': 'Grayscale',
    hillshade: 'Hillshade', colourOpacity: 'Colour opacity', colourOpacityAria: 'Terrain colour opacity',
    referenceLayers: 'Reference layers', modernGeography: 'Modern geography', cityLabels: 'City labels', countryBoundaries: 'Country boundaries', provinceBoundaries: 'State / province boundaries', rivers: 'Rivers', riverDetail: 'River detail', simple: 'Simple', standard: 'Standard', detailed: 'Detailed', landformNames: 'Landform names', landformDetail: 'Landform detail', graticule: 'Latitude / longitude grid', lineOpacity: 'Line opacity', lineOpacityAria: 'Reference line opacity', importLayers: '＋ Import your layers', importCaption: 'Files are read locally in your browser; useful for overlaying research sites and boundaries.',
    explore: 'Explore', placeChina: 'China', placeTibet: 'Tibetan Plateau', placeSichuan: 'Sichuan Basin', placeMediterranean: 'Mediterranean', placeAtlantic: 'Mid-Atlantic Ridge', placeAndes: 'Andes',
    help: 'Help', dataLicenses: 'Data & licenses ↗', sourceCode: 'Source ↗', viewShare: 'View and share', mapMode: 'Map mode', mode3d: '3D Globe', mode2d: '2D Map', mode25d: '2.5D', shareView: 'Share view ↗', shareTitle: 'Copy a link to the current view',
    navigation: 'Map navigation', northTitle: 'North-up view', northLockTitle: 'Lock north', northLockAria: 'North lock', northLockShort: 'Lock', zoomIn: 'Zoom in', zoomOut: 'Zoom out', tiltTitle: 'Toggle top-down / tilted view', homeTitle: 'Return to the initial view (0)', homeAria: 'Return to initial view',
    selectionAria: 'Selected place', closeSelection: 'Close place details', place: 'Place', coordinatesLabel: 'Coordinates', elevationLabel: 'Surface elevation', relocate: 'Recenter here',
    legendButton: 'Legend', legendButtonAria: 'Show elevation legend', legendAria: 'Elevation legend', trueElevation: 'm · true elevation',
    preparingMap: 'Preparing map…', coordinateHint: 'Drag to rotate · wheel / pinch to zoom · Ctrl + drag to tilt',
    loadingTitle: 'Unfolding the terrain', loadingEngine: 'Loading 3D map engine…', helpTitle: 'Explore Terrain Atlas', closeHelp: 'Close help',
    helpBody: '<p>A globe built from real elevation. Seawater does not hide the seafloor, and both mountains and trenches can be vertically exaggerated.</p><ul><li><strong>Drag</strong> to rotate or pan; use the <strong>wheel / pinch</strong> to zoom.</li><li><strong>Ctrl + drag / middle-button drag / two-finger parallel drag</strong> changes tilt; the ◩ button on the right toggles it directly.</li><li><strong>North lock</strong> keeps panning and zooming north-up; it is enabled by default on touch devices. While locked, use <strong>◩</strong> to tilt; two-finger gestures zoom without changing heading.</li><li>Rivers and landform labels each have three detail levels. Labels are filtered by map scale and collision avoidance, so detailed mode does not display every name at once.</li><li>Press <kbd>/</kbd> to search cities and <kbd>0</kbd> to return home. You can also enter coordinates such as <code>116.4,39.9</code>.</li><li>Click terrain to inspect coordinates and approximate elevation from the current terrain grid. Elevation readings are always unexaggerated metres.</li><li>Import WGS84 GeoJSON to overlay points, lines and polygon edges. Imported files remain only for the current page session.</li></ul><p>Modern terrain, cities and boundaries are reference layers for historical research; they do not represent a particular historical period. This is not a surveying or navigation product. Real elevation coverage ends at about ±85.05°.</p><p>Shared links include the camera and display settings, but not imported files.</p><a data-source-link href="./sources.html" target="_blank" rel="noopener">View data sources, accuracy and licences ↗</a>',
    noScript: 'Terrain Atlas requires JavaScript to display the map.',
    switchToChinese: '切换到中文', switchToEnglish: 'Switch to English',
    invalidShared: 'The shared view is invalid; the default map has been opened.',
    terrainLoading: 'Loading terrain · {n}', terrainPartialFailure: 'Some terrain failed to load', terrainReady: 'Terrain ready', terrainWaiting: 'Waiting for terrain data', terrainTileFailure: 'Some elevation tiles could not be reached; coarser terrain may remain. Move the view to retry.',
    outsideCoverageLocation: 'This location is outside the elevation coverage; only its position can be shown.',
    northLocked: 'North locked; use ◩ to adjust tilt',
    modernCity: 'Modern city', customLayer: 'Custom layer', terrainProbe: 'Terrain probe', reading: 'Reading…', selectedLocation: 'Selected location', coverageOutside: 'Outside elevation coverage', readFailed: 'Unable to read for now', coordinateLocation: 'Coordinate location',
    noSearchResults: 'No match. Try an English or Chinese city name, or enter longitude,latitude. The city index does not include every settlement.', cityIndexNotReady: 'The city index is not ready yet. Please wait, or enter longitude,latitude directly.',
    clickReadElevation: 'Click to read elevation', mapLocation: 'Map location', removeLayer: 'Remove {name}', maxLayers: 'Up to 8 custom layers can be loaded at once.', fileTooLarge: 'Each file must be 10 MB or smaller; simplify the data first.', imported: 'Imported {name}. Keep the original file; it must be imported again after a refresh.',
    shareAfterMorph: 'Wait for the view transition to finish before sharing.', sharedWithLayers: 'View link copied. Imported layer files must be shared separately.', shared: 'Current view link copied.', copyView: 'Copy current view link', renderError: '3D rendering stopped. Reload the page; if the problem persists, check browser hardware acceleration.', contextLost: 'The graphics context was lost. Close other graphics-heavy pages and reload.', manifestFailed: 'Base layer catalogue failed to load', cityCount: '{n} cities · English / 中文 search', cityUnavailable: 'City data is unavailable; coordinates can still be entered directly.',
    datasetFailed: '{key} data failed to load ({status})',
    geoCoord: 'Coordinates must be WGS84 longitude and latitude in decimal degrees.', geoVertices: 'A file can contain at most 100,000 vertices; simplify it first.', geoLine: 'A line or polygon is missing coordinates.', geoCustomPlace: 'Custom place', geoGeometry: 'Only GeoJSON points, lines, polygons and geometry collections are supported.', geoInvalid: 'The file is not valid GeoJSON.', geoWgs84: 'Convert the data to WGS84 (EPSG:4326).', geoFeatures: 'GeoJSON is missing features.', geoEmpty: 'The file contains no displayable geographic features.', geoPoints: 'A file can contain at most 2,000 points.',
    engineRetry: 'Trying a backup map-engine source…', engineConnection: 'The map engine is temporarily unavailable. Check your network connection (jsDelivr or unpkg must be reachable).', connectingTerrain: 'Connecting terrain and city data…', engineTimeout: 'Map engine download timed out', engineDownload: 'Map engine download failed', mapUnavailable: 'The map could not be opened', webglUnavailable: 'The browser could not start WebGL. Enable hardware acceleration or use a browser with WebGL support.', reload: 'Reload'
  },
  zh: {
    documentTitle: '山海图 · Terrain Atlas', description: '山海图 Terrain Atlas：可调地形夸张的三维地球，结合城市搜索、现代行政边界、河流和自己的研究图层。', brandTitle: '山海图<span>Terrain Atlas</span>', tagline: '把历史放回山川之间', globeAria: '交互地图：拖拽旋转，滚轮或双指缩放，按住 Ctrl 拖拽倾斜', panelAria: '地图控制',
    searchLabel: '搜索城市或经纬度', searchPlaceholder: '城市 / 经度,纬度', searchResults: '搜索结果', searchLoading: '正在加载城市索引…', terrainRelief: '地形起伏', landSeafloor: '陆地 + 海底', verticalExaggeration: '高度夸张', trueScale: '真实比例 1×', scalePresets: '高度倍率预设', scaleExplanation: '只放大垂直起伏，不改变水平距离。', terrainColours: '地形配色', paletteGroup: '地形配色',
    'palette.atlas': '山海', 'palette.topo15': '全球地形', 'palette.vivid': '强地形', 'palette.school': '地图册', 'palette.ocean': '海底增强', 'palette.earth': '纸上山川', 'palette.gray': '灰度研究', hillshade: '山体明暗', colourOpacity: '色彩不透明度', colourOpacityAria: '地形色彩不透明度', referenceLayers: '参照图层', modernGeography: '现代地理', cityLabels: '城市地名', countryBoundaries: '国家边界', provinceBoundaries: '省 / 州边界', rivers: '水系', riverDetail: '水系详细度', simple: '精简', standard: '标准', detailed: '详细', landformNames: '地貌名称', landformDetail: '地貌名称详细度', graticule: '经纬网', lineOpacity: '线条不透明度', lineOpacityAria: '参照线条不透明度', importLayers: '＋ 导入自己的图层', importCaption: '文件只在本机读取，适合叠加研究地点与边界。',
    explore: '从这里探索', placeChina: '中国全境', placeTibet: '青藏高原', placeSichuan: '四川盆地', placeMediterranean: '地中海', placeAtlantic: '大西洋海岭', placeAndes: '安第斯山脉', help: '操作帮助', dataLicenses: '数据与许可 ↗', sourceCode: '源码 ↗', viewShare: '视图与分享', mapMode: '地图模式', mode3d: '3D 地球', mode2d: '2D 地图', mode25d: '2.5D', shareView: '分享视图 ↗', shareTitle: '复制当前视图链接', navigation: '地图导航', northTitle: '朝北俯视', northLockTitle: '锁定北向', northLockAria: '北向锁定', northLockShort: '锁定', zoomIn: '放大', zoomOut: '缩小', tiltTitle: '切换俯视 / 倾斜', homeTitle: '回到初始视图（0）', homeAria: '回到初始视图', selectionAria: '选中地点', closeSelection: '关闭地点详情', place: '地点', coordinatesLabel: '经纬度', elevationLabel: '地表高程', relocate: '重新定位到这里', legendButton: '色标', legendButtonAria: '显示高程色标', legendAria: '高程色标', trueElevation: 'm · 未夸张', preparingMap: '正在准备地图…', coordinateHint: '拖拽旋转 · 滚轮 / 双指缩放 · Ctrl + 拖拽倾斜', loadingTitle: '山海之间，正在展开', loadingEngine: '加载三维地图引擎…', helpTitle: '探索山海图', closeHelp: '关闭帮助',
    helpBody: '<p>用真实高程搭建的地球。海水不遮挡海底，山体和海沟都可以放大起伏。</p><ul><li><strong>拖拽</strong>旋转或平移，<strong>滚轮 / 双指捏合</strong>缩放。</li><li><strong>Ctrl + 拖拽 / 鼠标中键拖拽 / 双指同向拖动</strong>调整倾斜；右侧 ◩ 可直接切换。</li><li><strong>北向锁定</strong>让平移、缩放保持朝北；触屏默认开启。在锁定状态使用右侧 <strong>◩</strong> 倾斜，双指手势只缩放，不改变朝向。解锁后恢复自由倾斜 / 环绕。</li><li>水系与地貌各有三级详细度；名称会按地图尺度与文字避让自动显示，详细模式也不会一次显示所有名字。</li><li>按 <kbd>/</kbd> 搜索城市；按 <kbd>0</kbd> 回到初始视图。也可输入 <code>116.4,39.9</code> 定位。</li><li>点击地形查看经纬度和当前地形网格的近似高程。高程读数始终以未夸张的米为单位。</li><li>导入 WGS84 GeoJSON 后，点显示为标记，线和面边缘叠加在地形上。导入文件只在当前页面会话保留；刷新前请保留原文件。</li></ul><p>现代地形、城市和边界仅作为历史研究参照，不代表某一朝代的地貌或疆域。地图不是测绘或导航产品；极区 ±85.05° 以外没有高程数据。</p><p>分享链接包含视角和显示设置，不包含你导入的文件。</p><a data-source-link href="./sources-zh.html" target="_blank" rel="noopener">查看数据来源、精度与许可 ↗</a>', noScript: '山海图需要启用 JavaScript 才能显示地图。', switchToChinese: '切换到中文', switchToEnglish: 'Switch to English', invalidShared: '分享链接中的视图无效，已打开默认地图。', terrainLoading: '地形加载中 · {n}', terrainPartialFailure: '部分地形加载失败', terrainReady: '地形已就绪', terrainWaiting: '等待地形数据', terrainTileFailure: '部分高程瓦片暂时无法连接，当前可能保留较粗地形。移动视图可重试。', outsideCoverageLocation: '此处位于高程覆盖范围之外，只能显示位置。', northLocked: '北向已锁定；使用 ◩ 调整倾斜', modernCity: '现代城市', customLayer: '自定义图层', terrainProbe: '地形探针', reading: '读取中…', selectedLocation: '选中位置', coverageOutside: '高程覆盖之外', readFailed: '暂时无法读取', coordinateLocation: '经纬度定位', noSearchResults: '没有找到。可尝试中英文城市名，或输入经度,纬度。城市库并不覆盖所有城镇。', cityIndexNotReady: '城市索引尚未就绪，请稍等或直接输入经度,纬度。', clickReadElevation: '点击读取高程', mapLocation: '地图上的位置', removeLayer: '移除 {name}', maxLayers: '最多同时加载 8 个自定义图层。', fileTooLarge: '每个文件最大 10 MB，请先简化数据。', imported: '已导入 {name}，刷新后需重新导入原文件。', shareAfterMorph: '视图切换完成后再分享。', sharedWithLayers: '链接已复制；导入的图层文件需要另行分享。', shared: '当前视图链接已复制。', copyView: '复制当前视图链接', renderError: '三维渲染中断，请重新加载页面。若仍有问题，请检查浏览器硬件加速。', contextLost: '图形上下文已丢失。请关闭其他大型图形页面后重新加载。', manifestFailed: '基础图层目录加载失败', cityCount: '{n} 座城市 · 中英文检索', cityUnavailable: '城市数据未就绪；仍可输入经纬度定位。', datasetFailed: '{key} 数据加载失败 ({status})',
    geoCoord: '坐标应为 WGS84 经度、纬度（十进制度）。', geoVertices: '一个文件最多支持 100,000 个顶点，请先简化数据。', geoLine: '线或面缺少坐标。', geoCustomPlace: '自定义地点', geoGeometry: '仅支持 GeoJSON 点、线、面和几何集合。', geoInvalid: '文件不是有效的 GeoJSON。', geoWgs84: '请将数据转换到 WGS84（EPSG:4326）。', geoFeatures: 'GeoJSON 缺少 features。', geoEmpty: '文件里没有可显示的地理要素。', geoPoints: '一个文件最多支持 2,000 个地点。', engineRetry: '正在尝试备用地图引擎线路…', engineConnection: '地图引擎暂时无法连接。请检查网络后重试（需访问 jsDelivr 或 unpkg）。', connectingTerrain: '连接地形与城市数据…', engineTimeout: '地图引擎加载超时', engineDownload: '地图引擎下载失败', mapUnavailable: '地图暂时没有展开', webglUnavailable: '浏览器未能启动 WebGL。请开启硬件加速，或换用支持 WebGL 的浏览器后重试。', reload: '重新加载'
  }
};

export const normalizeLanguage = language => language === 'zh' ? 'zh' : 'en';
export function t(language, key, vars = {}) {
  const lang = normalizeLanguage(language);
  let value = MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) value = String(value).replaceAll(`{${name}}`, String(replacement));
  return value;
}
export function localizedName(point, language = 'en') {
  if (!point) return '';
  return normalizeLanguage(language) === 'zh'
    ? point.name_zh || point.zh || point.name || point.name_en || point.ascii || ''
    : point.name_en || point.name || point.ascii || point.name_zh || point.zh || '';
}
export function initialLanguage(win = window) {
  try {
    const p = new URLSearchParams(win.location.hash.slice(1));
    if (p.has('view')) {
      const shared = JSON.parse(p.get('view'));
      if (['en','zh'].includes(shared?.settings?.language)) return shared.settings.language;
    }
  } catch { /* Fall through to saved preference. */ }
  try {
    const saved = JSON.parse(win.localStorage.getItem('terrain-atlas-v1') || '{}');
    if (['en','zh'].includes(saved?.settings?.language)) return saved.settings.language;
  } catch { /* English remains the public default. */ }
  return 'en';
}
export function applyStaticLanguage(language, root = document) {
  const lang = normalizeLanguage(language);
  root.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  root.title = t(lang, 'documentTitle');
  const meta = root.querySelector('meta[name="description"]'); if (meta) meta.content = t(lang, 'description');
  root.querySelectorAll('[data-i18n]').forEach(el => {el.textContent = t(lang, el.dataset.i18n);});
  root.querySelectorAll('[data-i18n-html]').forEach(el => {el.innerHTML = t(lang, el.dataset.i18nHtml);});
  for (const attr of ['placeholder','title','aria-label']) root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => el.setAttribute(attr, t(lang, el.dataset[`i18n${attr.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')}`])));
  root.querySelectorAll('[data-source-link]').forEach(el => el.setAttribute('href', lang === 'zh' ? './sources-zh.html' : './sources.html'));
  const toggle = root.getElementById('language-toggle');
  if (toggle) {
    toggle.textContent = lang === 'en' ? '中' : 'EN';
    toggle.title = toggle.setAttribute('aria-label', lang === 'en' ? t(lang,'switchToChinese') : t(lang,'switchToEnglish'));
  }
  return lang;
}

const CORE_ERRORS = {
  '坐标应为 WGS84 经度、纬度（十进制度）。': 'geoCoord', '一个文件最多支持 100,000 个顶点，请先简化数据。': 'geoVertices', '线或面缺少坐标。': 'geoLine', '仅支持 GeoJSON 点、线、面和几何集合。': 'geoGeometry', '文件不是有效的 GeoJSON。': 'geoInvalid', '请将数据转换到 WGS84（EPSG:4326）。': 'geoWgs84', 'GeoJSON 缺少 features。': 'geoFeatures', '文件里没有可显示的地理要素。': 'geoEmpty', '一个文件最多支持 2,000 个地点。': 'geoPoints'
};
export function localizeError(message, language) {
  const key = CORE_ERRORS[message];
  if (key) return t(language, key);
  const match = String(message).match(/^(\w+) 数据加载失败 \((\d+)\)$/);
  return match ? t(language, 'datasetFailed', {key: match[1], status: match[2]}) : message;
}
