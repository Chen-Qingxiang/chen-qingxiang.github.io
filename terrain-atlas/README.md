# 山海图 · Terrain Atlas

**把历史放回山川之间。** 一个可以调整山地与海底垂直起伏、叠加城市和行政边界的三维地理研究工具。

- **在线使用：[chen-qingxiang.github.io/terrain-atlas](https://chen-qingxiang.github.io/terrain-atlas/)**
- [项目源码](https://github.com/Chen-Qingxiang/chen-qingxiang.github.io/tree/main/terrain-atlas) · [数据来源与许可](https://chen-qingxiang.github.io/terrain-atlas/sources.html)
- 中文界面；纯静态 HTML / CSS / JavaScript；无需账号、API 密钥或后端。

项目由 [GPlates Topography](https://portal.gplates.org/cesium/?view=topo15) 的地形探索方式启发，独立编写应用与界面。没有复制 GPlates 的应用代码、品牌或配色图片，也不连接其瓦片服务器。本项目不是 GPlates 官方产品，使用的数据集、精度和配色与原工具并不相同。

## V1.1 能做什么

- **真实地形与海底**：按视角加载公开 Terrain Tiles 高程，海底以负高度建模，海水不遮盖海沟和海岭。
- **1–200× 高度夸张**：默认 30×；滑杆与快捷倍率联动。100% = 1×，3000% = 30×，20000% = 200×。水平位置与距离不变。
- **3D / 2D / 2.5D**：地球、平面地图、倾斜地图；鼠标或触摸旋转、平移、缩放、倾斜。
- **六套地形配色**：山海、强地形、地图册、海底增强、纸上山川、灰度研究；山体明暗、色彩不透明度和高程色标。
- **城市定位**：内置 Natural Earth 7,342 个城市 / 聚落的索引，可搜索中文、英文或替代名称；支持直接输入 `经度,纬度`。
- **现代参照图层**：国家陆地边界、省 / 州边界、三级水系、三级地貌名称、经纬网；城市、河流和地貌名称共用避让规则。
- **地形探针**：点击地图查看经纬度与未夸张的近似高程。
- **自己的图层**：浏览器本地导入 GeoJSON 点、线、面；可以隐藏、移除。线和面边缘随地形表面显示。
- **分享当前视图**：链接携带相机与显示设置。显示偏好在当前浏览器保存。
- **区域入口**：中国全境、青藏高原、四川盆地、地中海、大西洋海岭、安第斯山脉。

## 快速开始

1. 打开[网页](https://chen-qingxiang.github.io/terrain-atlas/)，等地形加载。首次下载地图引擎需要网络。
2. 点击「青藏高原」，拖动高度滑杆，对比 1×、10×、30× 的山势。
3. 打开「省 / 州边界」和「水系」，搜索「成都」或 `Chengdu`，把地点放回盆地与山脉中观察。
4. 点击「大西洋海岭」查看海底地形；海拔读数和色标始终显示未夸张的米值。
5. 用「分享视图」复制链接。若导入了自己的文件，接收者仍需单独导入这些文件。

| 操作 | 方式 |
| --- | --- |
| 旋转 / 平移 | 单指或鼠标左键拖拽 |
| 缩放 | 滚轮、双指捏合、右侧 ＋ / − |
| 倾斜 / 环绕 | Ctrl + 拖拽、鼠标中键拖拽、双指同向拖动 |
| 切换俯视 / 倾斜 | 右侧 ◩ |
| 朝北俯视 | 右侧 N |
| 北向锁定 | 右侧 N 锁定；触屏默认开启，桌面默认关闭；偏好保存 |
| 初始视图 | 右侧 ⌂，或按 `0` |
| 搜索 | 搜索框，或按 `/` |
| 定位经纬度 | 如 `116.4,39.9`，经度在前 |

移动端默认显示 154×46 px 的「山海图 +」小浮钮，点击展开原有底部面板。色标只显示小按钮，点击查看，点击地图收起。界面同时检测 coarse pointer / touch 能力和窄屏，手机横屏也保留触屏布局；安全区和实际署名高度用于计算底部留白。

北向锁定通过 Cesium 的相机输入开关阻止自由环绕和双指旋转，不使用逐帧相机纠偏。锁定时可以平移、缩放，**倾斜使用右侧 ◩ 按钮**；解锁后恢复 Ctrl / 中键 / 双指的自由倾斜手势。三维渲染需要启用 WebGL 和浏览器硬件加速。

## 导入研究图层

导入标准 **WGS84 / EPSG:4326** GeoJSON，坐标次序为 `[longitude, latitude]`。支持 Feature、FeatureCollection、Point、MultiPoint、LineString、MultiLineString、Polygon、MultiPolygon 和 GeometryCollection。

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {"name": "我的研究地点"},
      "geometry": {"type": "Point", "coordinates": [116.4, 39.9]}
    }
  ]
}
```

也可下载并修改 [example.geojson](examples/example.geojson)。示例只是演示坐标格式，不是历史事件或遗址数据。

- 点名称读取 `name`、`title` 或 `NAME`；额外属性暂不显示。
- 所有几何贴地显示；第三维高程暂忽略。面只显示边缘，不填充。
- 每个文件最大 10 MB、100,000 个顶点、2,000 个点；同时最多 8 个图层。
- 文件在浏览器本地解析，不上传。**当前版本不保存导入文件，刷新页面后需重新导入。**
- 古地名、古城位置或历史疆域需自行提供有依据的数据；应用不会把现代名称自动解释为历史位置。

## 数据、精度与研究边界

| 内容 | 来源与处理 |
| --- | --- |
| 地形及海底 | [Terrain Tiles / AWS Open Data](https://registry.opendata.aws/terrain-tiles/)，Mapzen / Tilezen 汇集 ETOPO1、GMTED、SRTM 和区域高程数据；按需读取公开 Terrarium PNG |
| 城市 | [Natural Earth v5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2)，1:10m populated places；提取中英文、替代名、坐标和标签等级 |
| 国家边界 | Natural Earth 1:50m admin-0 land boundary lines；不包括完整海岸线或海域主张线 |
| 省 / 州边界 | Natural Earth 1:10m admin-1 lines；全局概览数据，不是县乡级行政底图 |
| 水系 | Natural Earth v5.1.2 `ne_10m_rivers_lake_centerlines` 原始 Shapefile，1,473 个记录；简化后分成 7 个静态 JSON 文件 |
| 地貌名称 | Natural Earth v5.1.2 `ne_10m_geography_regions_polys`，筛选 422 个山脉、高原、盆地、平原、沙漠、河谷等记录，只输出内部标签位置，不输出或绘制区域轮廓 |

`1:10m` / `1:50m` 是 Natural Earth 的 **1:1,000 万 / 1:5,000 万制图比例尺**，不是 10 米 / 50 米空间分辨率。

地形覆盖纬度约 **85.05°S–85.05°N**；极帽没有真实高程。源数据的年代、空间分辨率与垂直基准并不统一，海底与陆地精度也不同。当前最高读取 z12，地形网格为每瓦片 65×65 点；该级别赤道附近几何采样间隔约 153 m，**采样间隔不等于源数据精度**。不能据此声称全球 153 m 分辨率。

解码公式为 `height = R × 256 + G + B / 256 − 32768`。地形在浏览器中重采样，相邻瓦片共用边缘采样；使用一致的像素起点约定，可能相对原始像元中心产生半像元定位偏移。明暗是根据局部坡度合成的西北方向阴影，不是精确时刻的日照模拟；调色与高度夸张仅用于观察。

现代边界及河流为性能进行约 0.015° 容差简化，不适合精细边界研究。城市库是精选聚落，不能检索全部城市、街道和门牌。高程读数是源网格或当前显示网格的近似值，并未进行统一大地水准面改正。

**本工具显示现代地形与现代参照数据，不提供历史疆域时间轴、板块重建、古海岸线或海平面模拟。** 本项目没有复制 GPlates 的完整数据目录或逐像素视觉效果。地图不是测绘、航海或工程决策产品。

## 水系、地貌与配色

水系「精简 / 标准 / 详细」分别允许 `scalerank ≤ 3 / 6 / 12` 的线条，同时按瓦片级别与 `min_zoom` 控制大尺度的支流绘制。地貌三级允许 `scalerank ≤ 3 / 5 / 8` 的名称。河名的显示另受相机尺度、`min_label`、河段屏幕长度和统一文字避让控制；详细模式不会在全国视图铺满名称。标签在停止移动、地形加载完成或设置改变后更新；不在每一帧重新排版。

河流保留 `id`（源 `ne_id`）、`name`、`name_en`、`name_zh`、`scalerank`、`min_zoom`、`min_label`、`featurecla`；地貌保留对应的名称、等级、`MIN_LABEL`（输出为 `min_label`）、类型和 ID。地貌锚点从最大多边形内部生成，是制图标签位置，不是山脉中心或边界测量。

同一 v5.1.2 仓库中的河流 GeoJSON 导出只有 1,455 个记录且缺少中文属性，因此使用原始 `.shp` / `.dbf`，并同时核验 `.prj` / `.cpg`。四份源文件分别记录 SHA-256；没有从其他版本拼接中文名。数据包含塔里木河、孔雀河；**未找到开都河的独立记录**。珠江水系沿用上游的西江等河段名称，不另造「珠江」几何。上游的中文译名和详略并不完全一致；缺失的名称回退到英文。

| 配色 | 适合用途 |
| --- | --- |
| 山海（默认） | 柔和耐看，长时间观察 |
| 强地形 | 高对比绿—黄—橙褐—白，快速识别地形阶梯；兼容旧 `vivid` 分享设置 |
| 地图册 | 浅蓝海洋与传统陆地分层设色，适合叠加名称 |
| 海底增强 | 在 −11000 / −8000 / −6000 / −4000 / −2500 / −1000 / 0 m 之间连续拉开负高程色差，陆地保持克制 |
| 纸上山川 | 纸色与褐色，适合截图展示 |
| 灰度研究 | 保留原有灰色陆地与冷灰海洋 |

所有高程在节点之间连续插值；只有 0 m 的海陆色相可以跳变。明暗下限由原来的 55% 调至 76%，平地亮度约 100%，保留颜色对高程的表达。

## 开发与验证

应用不需要构建，可直接由 GitHub Pages 发布。所有本地路径相对项目目录，适配 `/terrain-atlas/` 子路径。

本地开发使用 Node.js 20.19+ / 22.12+ 和 Python 3（数据脚本及其测试）。Vite 只用作开发时的静态预览，不参与 GitHub Pages 发布，不改变应用的纯静态架构：

```bash
cd terrain-atlas
npm ci
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run dev
```

开发服务器地址由终端输出；可以用 `npm run dev -- --port 4173` 固定端口。生产部署只发布原始静态文件，不需要执行 Vite build。仍可用 `python3 -m http.server 4173` 在本机直接验证纯静态运行。

测试覆盖负高程解码、墨卡托坐标、瓦片接缝、最大层级、设置清洗、城市搜索、GeoJSON 边界条件和数据清单完整性。若本机有 Cesium 1.145.0 的发布包，可额外运行真实 Cesium 地形适配测试：

```bash
CESIUM_CJS_PATH=/path/to/cesium/Build/Cesium/index.cjs npm test
```

新增测试覆盖 200×、旧设置迁移、触屏默认值、三级详细度、标签避让、配色连续性、缓存请求集中完成后的回收、DBF 中文解析和 SHP 多段几何。

**验证边界：本次远程 Chrome 无法初始化 WebGL，原版和新版均受影响。** 已运行真实 Canvas 瓦片基准、四个区域的配色目视检查和四种尺寸的 DOM / CSS 布局检查，但没有取得真实 3D 帧率、GPU 内存、iOS 真机或 200× 三维画面验收结果。完整记录与复现步骤见 [PERFORMANCE.md](PERFORMANCE.md)。

重新生成基础数据：

```bash
python3 scripts/prepare-data.py
```

也可以只重新生成新图层，并缓存固定版本的原始文件：

```bash
python3 scripts/prepare-data.py --datasets rivers landforms --cache-dir /tmp/terrain-atlas-ne-5.1.2
```

脚本固定 Natural Earth v5.1.2；`data/manifest.json` 记录每份源文件、SHA-256、简化容差和输出分片。

| 文件 | 职责 |
| --- | --- |
| `index.html`, `style.css` | 中文工具界面、响应式布局 |
| `src/bootstrap.js` | 加载固定版 Cesium，CDN 回退和启动错误提示 |
| `src/core.js` | 高程解码、配色、坐标转换、搜索、GeoJSON 校验 |
| `src/terrain.js` | 高程缓存、并发控制、3D 地形及阴影配色瓦片 |
| `src/layers.js` | 基础数据加载、贴地线条和经纬网瓦片 |
| `src/app.js` | 相机、图层、统一标签、搜索、分享和文件导入 |
| `src/cartography.js` | 比例尺、详细度、标签锚点、避让与桌面细节策略 |
| `src/navigation.js`, `src/ui.js` | 北向锁定与触屏面板 / 色标 |
| `tests/browser.html`, `tests/layout.html`, `tests/integration.html` | 瓦片基准、配色、独立布局与无 GPU 应用交互检查 |
| `data/` | 经过提取 / 简化的 Natural Earth 静态数据 |
| `sources.html`, `licenses/` | 可见署名、许可证与上游来源 |

## 发布与维护

这是个人主页仓库 `Chen-Qingxiang/chen-qingxiang.github.io` 下的独立项目目录，和其他子网页一样由现有 GitHub Pages 发布；没有另外创建同名仓库，也没有增加后台服务。源码页面进入本目录后即显示本 README。

更新本目录并提交到主页仓库 `main` 后，等待现有 Pages 部署完成。无需更改整个主页的 Jekyll 配置；`index.html` 没有 front matter，因此保持独立页面。

运行时依赖：

- CesiumJS **1.145.0**：优先 jsDelivr，失败时尝试 unpkg；脚本、样式、Workers 和 Assets 使用同一固定版本。
- AWS Terrain Tiles 公共桶：按视角加载；带超时、重试、最多 10 个并发请求和解码缓存。
- 城市与矢量线数据从 GitHub Pages 本站读取。

没有 API token、统计追踪或文件上传。公共 CDN / 瓦片请求会向相应服务暴露常规网络信息和所请求的瓦片坐标；服务可用性不受本项目控制。无法连接地形时会提示，不会把平面假装为已加载的真实地形。这个版本不是离线应用。

## License

原创代码与文档为 [MIT](LICENSE)。CesiumJS 为 Apache-2.0；Natural Earth 为公有领域；Terrain Tiles 的各上游来源保留各自条款。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和[网页署名页](sources.html)。
