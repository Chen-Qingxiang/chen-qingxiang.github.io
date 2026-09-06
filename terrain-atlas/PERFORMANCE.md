# V1.1 性能与验证记录

## 可以确认的结果

测试浏览器为远程 Chrome 151，CSS viewport 1363×936、DPR 1。原版与新版都遇到 `The browser supports WebGL, but initialization failed`。因此本次**没有真实 3D 拖动 FPS、GPU 时间 / 内存、全屏画质对照或 iOS 真机验收结果**。下述实测只覆盖 Canvas CPU、解码缓存、应用逻辑及布局，不以数学推算冒充渲染实测。

`tests/browser.html` 直接调用原版（基线提交 `ec4db7edc3bab7097351d27b28a7285a60e87f41`）和新版 imagery provider。使用中国、青藏高原、地中海、东太平洋各一张真实 Terrain Tiles 样本，先完成网络和高程解码；每个 provider 预热 5 次，再执行 32 次 256×256 Canvas 生成。包含 Canvas / ImageData 分配、配色、明暗、putImageData，不包含网络等待。两者都使用不变的默认「山海」色表。

| 每瓦片耗时 | V1 中位 / P95 | V1.1 中位 / P95 |
| --- | --- | --- |
| 配色 + 明暗 | 1.6 / 1.9 ms | 1.1 / 1.4 ms |
| 仅配色 | 0.8 / 1.0 ms | 0.5 / 0.7 ms |
| 省 / 州界（512×512） | 0.3 / 0.8 ms | 0.3 / 0.7 ms |

默认国家边界耗时通常低于 0.1 ms，中位数接近浏览器计时精度，不应解读微小差异。解码后的配色 / 明暗 CPU 中位耗时减少约 31%；无明暗减少约 38%。**这不是整页 FPS 提升百分比。** 原始记录：`tests/fixtures/baseline-browser.json`、`tests/fixtures/optimized-browser.json`。短测量会受机器负载、JIT 与垃圾回收影响。

## 卡顿定位的范围

- 已实测逐像素着色属于可减少的主线程工作；当前默认边界和省界的 CPU 绘制比它小，没有证据支持重写 overlay 或引入 Worker。
- Cesium 1.145.0 的地形 SSE 计算包含绘图缓冲区高度。V1 固定 `maximumScreenSpaceError=2.5`，扩大视口会推动更多地形细分，同时增加纹理、地形网格、绘制和像素填充成本。这与使用者报告的大窗口明显更慢一致，**但本环境无法实测各项 GPU / terrain tile 成本占比，不能宣称已经最终确认唯一主因**。
- V1 解码缓存只在插入请求时回收已完成项。256 个不同瓦片集中请求并结束后，能复现 256 项仍留在缓存，超过预期 192 项。
- 完成解码时也执行回收后，连续四轮共 1,024 个瓦片请求，每轮结束均保持 192 项，队列和活动请求归零。每个 Float32 高程 tile 为 256 KiB，192 项对应约 48 MiB 高程数组，不包含 GPU 纹理、Cesium 网格和其他对象。
- 这证实一个缓存上限缺口，不是长期内存泄漏的完整诊断。请求中的 promise 不会被中途删除，因此加载突发期间 Map 仍可能暂时超过 192；完成后回落。没有取得浏览器长期 heap / GPU 采样，不能声称整页无泄漏。

## 本轮采用的最小调整

1. 将无明暗路径移出逐像素分支，直接写 RGB；明暗路径把行索引和比例系数移到循环外，取消每像素三通道内层循环。没有 Worker、OffscreenCanvas 或异步流水线重写。
2. 桌面按实际地图 Canvas 面积适度放宽 SSE：`clamp(2.5 × sqrt(width × height / (1280 × 800)), 2.5, 4.5)`。例如 1920×1080 全屏 Canvas 约 3.56；小窗口仍 2.5，触屏无论横竖屏仍为 2.5。最大允许屏幕误差只增加 2 px；实际质量与拖动效果仍待硬件浏览器确认。没有更改 Cesium 分辨率比例或 iOS 的地形细节策略。
3. 解码完成时执行已有 LRU 回收。网络并发仍为 10；Cesium terrain cache 仍为 180，最高高程层级仍 z12。
4. 没有线图层且未开经纬网时，不保留空透明 imagery layer；相机运动期间暂停鼠标悬停高程探针的拾取。
5. 河流、城市、地貌名称仅在相机停止、地形加载完成或设置变化后重新排版，共享同一个碰撞集合，数量按屏幕面积限制。名称实体复用并清除不再需要的项。

## 配色与布局检查

已在真实 Chrome Canvas 查看中国、青藏高原、地中海、东太平洋四组高程马赛克，每组比较全部六套配色。强地形的绿 / 黄 / 橙褐阶梯明显，地图册海洋更浅、适合文字叠加，海底增强在东太平洋显示更明显的深度色差。山海、纸上山川、灰度保留各自用途。检查为二维高程着色样本，不是 3D 截图。

布局检查使用 `tests/layout.html` 加载真实页面 HTML / CSS 和 `src/ui.js`，iframe 保持指定 CSS viewport；触屏输入条件模拟为 `maxTouchPoints=1`。不是 iOS 设备模拟，也不模拟真实刘海安全区。

| CSS viewport | 结果 |
| --- | --- |
| 1920×1080 | 桌面面板、完整色标、署名可见，无页面横向溢出 |
| 960×720 | 桌面面板可滚动、完整色标保留、署名可见，无页面横向溢出 |
| 390×844，触屏条件 | 默认 154×46 px 收起浮钮；完整色标隐藏；44 px 色标按钮可展开，点地图可收起；面板不盖署名 |
| 844×390，触屏条件 | 仍使用移动 UI；地图操作按钮横排；面板收起为 46 px 浮钮，展开高度受限且可滚动；不盖署名 |

`env(safe-area-inset-*)` 与署名 `ResizeObserver` 已接入，实际 iOS 刘海 / Home indicator 布局及双指操作仍待真机检查。

## 复现与剩余验收

自动检查：19 项 JavaScript 测试通过（包含真实 Cesium 1.145.0 相机和地形数据类），4 项 Python 数据解析测试通过。`tests/integration.html` 在 Chrome 中运行真实应用启动与事件处理，使用无 GPU 的 Viewer 测试替身：200× 输出、全部详细度与配色、明暗切换后 imagery layer 数量、北向锁定与 ◩ 倾斜、关闭标签后的实体清理、WGS84 GeoJSON 导入 / 移除、分享视图序列化全部通过。这覆盖应用接线，不代表 WebGL 渲染或触摸手势验收。

```bash
npm ci
npm run check
CESIUM_CJS_PATH=/path/to/cesium/Build/CesiumUnminified/index.cjs npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run dev -- --port 4173
```

访问 `/tests/browser.html` 运行 CPU 对照和四区域配色；访问 `/tests/layout.html` 检查布局；访问 `/tests/integration.html` 检查无 GPU 的应用交互。基线 provider 保留原计算实现，仅修改模块相对导入和开发服务器 URL 注解。

在可运行 WebGL 的桌面 Chrome，还需要用同一视角、倍率、窗口大小和加载稳定状态，记录大 / 小窗口的 Performance trace、terrain 可见及缓存 tile 数、帧间隔和内存趋势；再对比 hillshade 开关。应检查中国全境、青藏高原、200×、所有详细度、North Lock 和导入 / 分享，并在真实 iPhone 横竖屏重复手势与安全区验收。没有这些结果，就不把 V1.1 的 CPU 优化写成「已彻底解决全屏拖动卡顿」。
