(() => {
  'use strict';

  const BILI_SERIES = 'https://www.bilibili.com/video/BV1W34y1K7he/';
  const VIDEO_CORRIDOR_SOURCE = 'https://paper.people.com.cn/zgnyb/html/2024-08/19/content_26076768.htm';

  const videoRoutes = [
    {
      id:'swift', name:'路线一｜北京 → 西南非洲', sub:'北京雨燕 · Apus apus pekinensis', speciesNote:'注意：雨燕科，不是燕科家燕',
      from:'北京繁殖地', to:'西南非洲越冬区', evidence:'high', evidenceText:'直接追踪 · 高', precision:'精确到研究均值/范围',
      summary:'这条是“三线”里证据最硬的一条。25 只北京雨燕的完整年度 geolocator 轨迹显示，它们先向西北经过蒙古高原/中亚，再转向西亚、红海进入非洲，最终到西南非洲越冬。视频式路线可以保留，但物种必须写清楚：它不是家燕。',
      meta:'秋迁均值约 14,733 km；秋迁总历时 111 ± 13 天。',
      tags:['25 只完整年度轨迹','geolocator','跨洲迁徙','秋春往返'],
      source:'Zhao et al. (2022), Movement Ecology 10:29。表 1 给出北京出发、越冬区到达、春迁出发与返京的均值和范围。',
      sourceUrl:'https://movementecologyjournal.biomedcentral.com/articles/10.1186/s40462-022-00329-2',
      note:'路线控制点用于表达论文轨迹的区域级形状；不是把论文中的每只鸟逐时定位点复制到网页。日期来自论文表格，属于样本均值。',
      p:[[39.90,116.40],[42.20,111.20],[44.00,101.00],[43.30,88.00],[43.20,76.90],[40.20,68.80],[35.70,51.40],[29.50,48.00],[24.20,42.50],[20.00,38.80],[14.00,38.00],[8.80,37.00],[1.00,35.50],[-7.00,32.00],[-15.00,28.00],[-22.00,23.00],[-24.50,18.00]],
      steps:[
        {p:0, f:0, date:'7月17日 ±6天', phase:'离开北京（范围 7月3–25日）'},
        {p:.12, f:.43, date:'8月中旬', phase:'进入红海—东北非洲一带（论文路线过程）'},
        {p:.22, f:.61, date:'9月上旬', phase:'向非洲中部继续南迁'},
        {p:.405, f:1, date:'11月5日 ±11天', phase:'抵达越冬区（范围 10月16–11月24日）'},
        {p:.77, f:1, date:'2月13日 ±12天', phase:'离开越冬区北返'},
        {p:1, f:0, date:'4月18日 ±9天', phase:'返回北京（范围 4月7日–5月14日）'}
      ]
    },
    {
      id:'central', name:'路线二｜中部通道 → 东南亚 / 澳洲', sub:'“中部燕子” · 视频/迁飞通道级复现', speciesNote:'不是单一种群的逐鸟追踪线',
      from:'内蒙古中东部 / 华北西部', to:'东南亚，部分资料延伸至澳洲', evidence:'medium', evidenceText:'迁飞通道 · 中', precision:'仅季节级，不伪造日期',
      summary:'这条路线的骨架与中国候鸟“中部迁徙区”高度一致：沿太行—吕梁方向南下，跨秦岭、大巴山进入四川盆地，再到云贵高原与东南亚。科普资料把部分“燕子”继续画到马来西亚乃至澳洲，但这不能等同于一只家燕的 geolocator 轨迹。',
      meta:'宏观通道资料可支持“从中部向西南/南方迁飞”，但不能支持每个折点和统一起飞日。',
      tags:['视频三线','中部迁徙区','吕梁山','秦岭','云贵高原'],
      source:'“草莓看历史”2023-09-15～17 连续三部燕子迁徙视频明确以“我国候鸟三条路线”为主题；中国候鸟迁徙资料也长期采用西/中/东三大迁徙区框架。这里按该科普框架复现，不冒充单鸟定位。',
      sourceUrl:VIDEO_CORRIDOR_SOURCE,
      note:'时间线只写“秋季—约两个月迁徙—越冬季”，因为通道级资料没有一个适用于所有个体的精确出发/抵达日期。',
      p:[[44.00,112.00],[40.80,111.60],[38.80,111.00],[36.50,110.20],[34.30,108.80],[32.60,106.50],[30.70,104.10],[28.20,103.40],[25.10,102.70],[21.00,101.20],[16.50,100.80],[11.00,101.50],[5.00,103.00],[-3.00,110.00],[-12.00,123.00],[-18.00,130.00]],
      steps:[
        {p:0, f:0, date:'秋季', phase:'进入南迁季；通道资料无统一起飞日'},
        {p:.5, f:.62, date:'秋季迁徙途中', phase:'跨越中部山地—西南中国—中南半岛'},
        {p:1, f:1, date:'约两个月后 / 越冬季', phase:'抵达东南亚；“澳洲”属于通道级延伸表述'}
      ]
    },
    {
      id:'east', name:'路线三｜东北沿海 → 台湾 → 东南亚', sub:'“东北燕子” · 视频/东部迁飞通道级复现', speciesNote:'与盘锦家燕实测路线并不相同',
      from:'中国东北', to:'台湾—华南—中南半岛—印尼', evidence:'medium', evidenceText:'迁飞通道 · 中', precision:'仅季节级，不伪造日期',
      summary:'这是你在视频里看到而上一版漏掉的东北线：沿中国东部海岸南下，闽北附近跨向台湾，再折回闽粤—海南—北部湾，经越南、泰国和马来西亚到印度尼西亚。它与中国“东部候鸟迁徙区”的宏观方向相符，但不能代表辽宁盘锦家燕的直接追踪结果。',
      meta:'东部迁飞通道确实连接东北、华东/华南、东南亚乃至澳大利西亚；具体物种和种群会在其中选择不同路线。',
      tags:['视频三线','东北','东部迁徙区','台湾','东南亚'],
      source:'科普“三线”资料描述东北地区鸟类沿海岸南迁，可抵华南、东南亚或澳大利西亚；“秋燕去翩翩”给出闽北—台湾—闽粤—海南—越南—马来西亚—印尼的具体科普路线。',
      sourceUrl:VIDEO_CORRIDOR_SOURCE,
      note:'这里忠实保留视频式宏观路线；切到“论文追踪”后可看到辽宁盘锦家燕的 geolocator 研究给出了不同的内陆西南路线。',
      p:[[45.70,126.60],[42.00,123.50],[39.10,121.80],[36.00,120.30],[32.00,121.00],[27.20,120.20],[25.10,121.40],[22.70,120.30],[24.00,117.50],[21.30,110.30],[19.20,109.70],[20.60,107.00],[16.10,108.20],[12.00,105.50],[7.50,101.00],[3.00,101.50],[-2.00,105.00],[-6.20,106.80]],
      steps:[
        {p:0, f:0, date:'秋季', phase:'东北繁殖区进入南迁季；无统一精确起飞日'},
        {p:.48, f:.58, date:'秋季迁徙途中', phase:'沿东部沿海—台湾—华南方向迁飞'},
        {p:1, f:1, date:'约两个月后 / 越冬季', phase:'进入东南亚越冬区（科普通道级）'}
      ]
    }
  ];

  const researchRoutes = [
    {
      id:'panjin', name:'辽宁盘锦 → 云南 → 泰国', sub:'家燕 · Hirundo rustica · 东北繁殖种群', speciesNote:'2020–2022 光敏定位研究（公开报道）',
      from:'辽宁盘锦辽河口', to:'中南半岛，以泰国周边为主', evidence:'high', evidenceText:'直接追踪 · 高', precision:'路线直接追踪；日期仅能到季节/范围',
      summary:'这是对“东北沿海线”最重要的研究校正。盘锦家燕并不是沿海一路去台湾和印尼；光敏定位结果显示，它们总体向西南穿过中国内陆，途经云南，最终进入中南半岛，越冬地多数集中在泰国周边。',
      meta:'繁殖研究显示盘锦家燕主要在 5–8 月繁殖；公开报道尚未给出这批 geolocator 个体统一的精确离巢和抵达日期。',
      tags:['辽宁盘锦','光敏定位仪','云南','泰国','东北家燕'],
      source:'中国环境科学研究院刘宇团队自 2016 年起研究中国家燕迁徙；2020–2022 年盘锦光敏定位研究的公开报道明确给出“东北→西南内陆→云南→泰国周边”的路线。',
      sourceUrl:'https://epaper.scdaily.cn/shtml/scrb/20260403/1075404.html',
      note:'东北家燕一般在秋季离开；东北地区报道给出的离迁窗口约为 9 月末到 10 月（个别可更晚），但这不是盘锦追踪样本的精确均值，因此页面不写成某一天。',
      p:[[41.02,121.70],[39.80,118.50],[38.20,115.50],[36.50,112.50],[34.20,109.00],[31.50,105.00],[28.50,103.00],[25.20,101.50],[22.20,100.20],[19.50,99.00],[16.00,100.00],[13.70,100.50]],
      steps:[
        {p:0, f:0, date:'9月末–10月（东北家燕常见离迁窗口）', phase:'离开东北繁殖区；盘锦样本精确均值未公开'},
        {p:.38, f:.55, date:'秋季', phase:'向西南穿过中国内陆，途经云南'},
        {p:.58, f:1, date:'冬季', phase:'泰国周边 / 中南半岛越冬'},
        {p:.82, f:.58, date:'春季', phase:'北返；公开报道未给出精确返程日'},
        {p:1, f:0, date:'5–8月繁殖季', phase:'回到盘锦繁殖区'}
      ]
    },
    {
      id:'gansu-africa', name:'酒泉 / 张掖 → 东非', sub:'家燕 · H. r. rustica 倾向种群', speciesNote:'13只完整迁徙轨迹研究的一部分',
      from:'甘肃酒泉—张掖', to:'东非越冬区', evidence:'high', evidenceText:'直接追踪 · 高', precision:'出发/返抵精确；越冬抵达日未统一报告',
      summary:'甘肃杂交带西侧种群向西北绕过塔克拉玛干北缘，再经中亚和阿拉伯半岛去东非；与仅相隔数百公里、却去南印度的兰州种群形成显著迁徙分界。',
      meta:'迁徙距离均值 11,829 ± 1,073 km；繁殖地离开时间 9月6日 ±6天；次年返抵繁殖地 5月8日 ±6天。',
      tags:['Evolution 2022','geolocator','东非','迁徙分界'],
      source:'Turbek et al. (2022), Evolution 76:722–736。研究结合 light-level geolocator、全基因组和稳定同位素。',
      sourceUrl:'https://academic.oup.com/evolut/article/76/4/722/6728453',
      note:'论文明确给出离开繁殖地与次年返回日期，但没有给出一个统一的“抵达东非日期”；因此动画的秋迁中间速度只作视觉插值。',
      p:[[39.73,98.49],[40.20,94.70],[42.90,89.20],[43.20,76.90],[41.30,69.20],[38.60,68.80],[35.70,51.40],[33.30,44.40],[29.40,48.00],[24.70,46.70],[21.50,39.20],[15.50,39.50],[9.00,38.70],[-1.30,36.80],[-5.10,35.70]],
      steps:[
        {p:0, f:0, date:'9月6日 ±6天', phase:'离开甘肃繁殖地'},
        {p:.36, f:1, date:'秋季（抵达日未统一报告）', phase:'完成向东非的秋迁'},
        {p:.72, f:1, date:'冬季', phase:'东非越冬'},
        {p:1, f:0, date:'5月8日 ±6天', phase:'返回甘肃繁殖地'}
      ]
    },
    {
      id:'gansu-india', name:'兰州 → 南印度', sub:'家燕 · H. r. gutturalis 倾向种群', speciesNote:'与东非路线同一研究',
      from:'甘肃兰州', to:'南印度越冬区', evidence:'high', evidenceText:'直接追踪 · 高', precision:'出发/返抵精确；越冬抵达日未统一报告',
      summary:'杂交带东侧兰州种群没有绕往非洲，而是向南跨越青藏高原方向，在南印度越冬。喀喇昆仑一带形成醒目的迁徙分界。',
      meta:'迁徙距离均值 5,407 ± 834 km；离开繁殖地 9月5日 ±10天；次年返抵兰州 4月9日 ±6天。',
      tags:['Evolution 2022','南印度','青藏高原','迁徙分界'],
      source:'Turbek et al. (2022), Evolution 76:722–736。',
      sourceUrl:'https://academic.oup.com/evolut/article/76/4/722/6728453',
      note:'同上：论文给出离开与返回日期，但没有统一秋季抵达越冬区日期；中间时间不做伪精确。',
      p:[[36.06,103.83],[35.00,101.50],[33.30,99.20],[31.60,96.80],[29.65,91.10],[27.70,85.32],[25.60,83.00],[22.57,88.36],[19.08,82.00],[16.50,79.50],[13.08,80.27],[11.00,77.00]],
      steps:[
        {p:0, f:0, date:'9月5日 ±10天', phase:'离开兰州繁殖地'},
        {p:.32, f:1, date:'秋季（抵达日未统一报告）', phase:'抵达南印度越冬区'},
        {p:.70, f:1, date:'冬季', phase:'南印度越冬'},
        {p:1, f:0, date:'4月9日 ±6天', phase:'返回兰州繁殖地'}
      ]
    },
    {
      id:'zhanjiang-borneo', name:'湛江 → 婆罗洲', sub:'家燕 · 华南热带繁殖种群', speciesNote:'2021–2023 geolocator；雄鸟全部在婆罗洲越冬',
      from:'广东湛江', to:'婆罗洲及周边越冬区', evidence:'high', evidenceText:'直接追踪 · 高', precision:'2021–2022样本均值精确到日期',
      summary:'湛江繁殖种群很特别：秋季更倾向绕开南海，经中南半岛/马来半岛方向南下；春季返程则更直接跨海。论文因此称其为“秋季间接、春季直接”。',
      meta:'2021样本平均 7月24日离开湛江，8月23日抵越冬区；次年 2月14日离开越冬区，3月12日返回湛江。',
      tags:['Avian Research 2024','婆罗洲','南海屏障','秋绕春直'],
      source:'Tian et al. (2024), Avian Research 15:100192。2021–2023 共部署92个 geolocator，成功回收23个。日期表基于2021–2022迁徙样本。',
      sourceUrl:'https://www.j-avianres.com/cn/article/doi/10.1016/j.avrs.2024.100192',
      note:'日期为样本均值并带较大标准差；页面显示均值，不代表每只鸟都在同一天迁徙。',
      p:[[21.27,110.36],[20.00,108.50],[17.20,106.20],[14.00,105.50],[10.80,104.80],[7.50,103.00],[4.50,102.20],[1.50,103.80],[1.20,109.00],[1.50,114.00]],
      steps:[
        {p:0, f:0, date:'7月24日 ±15天', phase:'离开湛江'},
        {p:.13, f:1, date:'8月23日 ±26天', phase:'抵达东南亚越冬区'},
        {p:.87, f:1, date:'2月14日 ±19天', phase:'离开越冬区北返'},
        {p:1, f:0, date:'3月12日 ±20天', phase:'返回湛江'}
      ]
    },
    {
      id:'zhanjiang-ph', name:'湛江 → 菲律宾 / 南海', sub:'家燕 · 华南热带繁殖种群 · 雌鸟差异', speciesNote:'同一研究中的个体差异',
      from:'广东湛江', to:'菲律宾 / 南海 / 越南等', evidence:'high', evidenceText:'直接追踪 · 高', precision:'种群时间同上；个体终点不同',
      summary:'同一个湛江繁殖种群并不存在唯一“标准越冬点”。雄鸟都集中在婆罗洲，而雌鸟除了婆罗洲，也有个体去菲律宾、南海和越南。这个案例特别适合提醒我们：迁徙图应该允许“分叉”。',
      meta:'时间参数沿用该湛江种群2021–2022样本均值；此线只突出菲律宾方向的分支。',
      tags:['个体差异','菲律宾','雌鸟','分叉路线'],
      source:'Tian et al. (2024), Avian Research 15:100192。',
      sourceUrl:'https://www.j-avianres.com/cn/article/doi/10.1016/j.avrs.2024.100192',
      note:'菲律宾线是论文中越冬区分布的一种分支，不表示所有雌鸟走同一条逐点轨迹。',
      p:[[21.27,110.36],[20.30,112.20],[19.20,114.50],[17.80,117.20],[15.80,119.50],[13.50,121.00],[10.50,123.50],[7.00,125.00]],
      steps:[
        {p:0, f:0, date:'7月24日 ±15天（种群均值）', phase:'离开湛江'},
        {p:.13, f:1, date:'8月23日 ±26天（种群均值）', phase:'抵达越冬区域'},
        {p:.87, f:1, date:'2月14日 ±19天', phase:'离开越冬区域'},
        {p:1, f:0, date:'3月12日 ±20天', phase:'返回湛江'}
      ]
    },
    {
      id:'baikal', name:'贝加尔湖 → 缅甸北部', sub:'西伯利亚家燕 · H. r. tytleri', speciesNote:'1只 geolocator + 历史环志回收',
      from:'贝加尔湖塞连格河三角洲', to:'缅甸北部', evidence:'high', evidenceText:'直接追踪 · 高（n=1）', precision:'单只个体日期较精确',
      summary:'一只西伯利亚家燕从贝加尔湖附近几乎直线南下，经蒙古中部和中国中部到缅甸北部；此外历史环志回收也把这一亚种与泰国、马来西亚联系起来。',
      meta:'模型估计 2019年10月26日离开，10月28日到达缅甸北部；至少停留到2月10日。5月24日开始北返，6月5日回到繁殖地。',
      tags:['Journal of Ornithology','西伯利亚','缅甸','n=1'],
      source:'Anisimova et al. (2025/2026), Journal of Ornithology。直接 geolocator 个体只有1只，因此路线很有价值，但不能视为整个亚种所有个体的唯一标准。',
      sourceUrl:'https://link.springer.com/article/10.1007/s10336-025-02306-z',
      note:'论文强调这是模型估计；两天完成4076 km的结果也受 light-level geolocation 时空分辨率影响，应理解为估计迁徙时段而非GPS逐秒轨迹。',
      p:[[52.25,106.50],[48.80,105.00],[45.50,104.00],[42.20,103.80],[38.50,103.50],[35.50,103.20],[32.00,102.50],[28.50,101.20],[25.50,99.50],[23.50,97.00]],
      steps:[
        {p:0, f:0, date:'2019年10月26日', phase:'离开贝加尔湖繁殖地'},
        {p:.01, f:1, date:'10月28日', phase:'模型估计抵达缅甸北部'},
        {p:.48, f:1, date:'至少至2月10日', phase:'仍在越冬区'},
        {p:.94, f:1, date:'5月24日', phase:'开始向北迁徙'},
        {p:1, f:0, date:'6月5日', phase:'返回繁殖地'}
      ]
    }
  ];

  const modes = { video: videoRoutes, research: researchRoutes };
  const modeInfo = {
    video:{label:'视频三线', note:'宏观三线：忠实保留视频/科普的空间叙事；证据等级单独标注。'},
    research:{label:'论文追踪', note:'直接追踪种群：路线更有实证约束；仍区分“原始定位”与网页控制点。'}
  };
  const colors=['#a52724','#285c8f','#2b7a62','#7b4f91','#c16a1b','#526b2b'];
  const $=id=>document.getElementById(id);
  let mode='video', selected=0, progress=0, playing=false, speed=1, raf=null, last=0;
  let routeLayers=[], bird=null;

  const map=L.map('map',{minZoom:2,maxZoom:11,preferCanvas:true,worldCopyJump:true}).setView([25,95],3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  map.createPane('terrainPane'); map.getPane('terrainPane').style.zIndex='240'; map.getPane('terrainPane').style.pointerEvents='none';
  const terrain=L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',{pane:'terrainPane',maxNativeZoom:12,maxZoom:19,opacity:.27,className:'terrain-tiles',attribution:'Terrain &copy; Esri, Airbus, USGS, NGA, NASA, CGIAR, et al.'}).addTo(map);

  const rad=d=>d*Math.PI/180;
  function dist(a,b){const R=6371,dl=rad(b[0]-a[0]),dn=rad(b[1]-a[1]),la=rad(a[0]),lb=rad(b[0]);const h=Math.sin(dl/2)**2+Math.cos(la)*Math.cos(lb)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
  function pathLen(p){let n=0;for(let i=0;i<p.length-1;i++)n+=dist(p[i],p[i+1]);return n;}
  function at(p,f){if(f<=0)return p[0];if(f>=1)return p[p.length-1];const target=pathLen(p)*f;let w=0;for(let i=0;i<p.length-1;i++){const e=dist(p[i],p[i+1]);if(w+e>=target){const t=e?((target-w)/e):1;return [p[i][0]+(p[i+1][0]-p[i][0])*t,p[i][1]+(p[i+1][1]-p[i][1])*t];}w+=e;}return p[p.length-1];}
  function sample(p,n=14){const out=[];for(let i=1;i<n;i++)out.push(at(p,i/n));return out;}
  function currentRoutes(){return modes[mode];}
  function currentRoute(){return currentRoutes()[selected];}
  function clearRouteLayers(){routeLayers.forEach(l=>map.removeLayer(l));routeLayers=[];bird=null;}
  function birdIcon(color){return L.divIcon({className:'bird-marker',html:`<div style="background:${color}">⌁</div>`,iconSize:[27,27],iconAnchor:[13,13]});}

  function drawMode(){
    clearRouteLayers();
    const rs=currentRoutes();
    rs.forEach((r,i)=>{
      const c=colors[i%colors.length], active=i===selected;
      const halo=L.polyline(r.p,{color:'#fffdf7',weight:active?9:7,opacity:active?.85:.55,lineCap:'round',lineJoin:'round'}).addTo(map);
      const line=L.polyline(r.p,{color:c,weight:active?5:3,opacity:active?1:.48,lineCap:'round',lineJoin:'round'}).addTo(map).bindTooltip(r.name,{sticky:true,className:'migration-label'});
      line.on('click',()=>select(i,true)); routeLayers.push(halo,line);
      sample(r.p,Math.max(9,Math.round(pathLen(r.p)/900))).forEach(q=>routeLayers.push(L.circleMarker(q,{radius:active?2.8:2.1,color:'#fffdf7',weight:1,fillColor:c,fillOpacity:active?.95:.55,interactive:false}).addTo(map)));
      [0,r.p.length-1].forEach((k,j)=>{const m=L.circleMarker(r.p[k],{radius:active?5:4,color:'#fffdf7',weight:2,fillColor:c,fillOpacity:active?1:.65}).addTo(map).bindTooltip(j?r.to:r.from,{direction:'top',className:'migration-label'});m.on('click',()=>select(i,true));routeLayers.push(m);});
    });
    const r=currentRoute(), c=colors[selected%colors.length];
    bird=L.marker(at(r.p,routeFraction(progress)),{icon:birdIcon(c),zIndexOffset:900}).addTo(map); routeLayers.push(bird);
  }

  function fit(all=true){const rs=all?currentRoutes():[currentRoute()];const pts=rs.flatMap(r=>r.p);map.fitBounds(L.latLngBounds(pts),{padding:[45,45],maxZoom:all?4.1:5.2});}
  function tag(t){const s=document.createElement('span');s.className='event-tag';s.textContent=t;$('routeTags').appendChild(s);}
  function stateAt(p){const s=currentRoute().steps;let i=0;while(i<s.length-2 && p>=s[i+1].p)i++;const a=s[i], b=s[Math.min(i+1,s.length-1)];const local=b.p===a.p?0:Math.max(0,Math.min(1,(p-a.p)/(b.p-a.p)));return {a,b,local,index:i};}
  function routeFraction(p){const {a,b,local}=stateAt(p);return a.f+(b.f-a.f)*local;}

  function renderMilestones(){
    $('timelineMilestones').innerHTML='';
    currentRoute().steps.forEach((s,i)=>{const d=document.createElement('span');d.className='milestone';d.style.left=`${s.p*100}%`;d.title=`${s.date} · ${s.phase}`;d.dataset.index=i;$('timelineMilestones').appendChild(d);});
  }
  function buildRouteList(){
    $('routeList').innerHTML='';currentRoutes().forEach((r,i)=>{const b=document.createElement('button');b.className='route-key';b.textContent=r.name.replace(/^路线.｜/,'');b.onclick=()=>select(i,true);$('routeList').appendChild(b);});
  }
  function select(i,pan=false){
    selected=Math.max(0,Math.min(currentRoutes().length-1,i)); progress=0; play(false);
    const r=currentRoute(), rs=currentRoutes();
    $('routeIndex').textContent=`路线 ${String(selected+1).padStart(2,'0')} / ${String(rs.length).padStart(2,'0')}`;
    $('routeSub').textContent=r.sub;$('routeTitle').textContent=r.name;$('routePlace').textContent=`${r.from} → ${r.to}`;$('routeSummary').textContent=r.summary;$('routeMeta').innerHTML=`<strong>时间/尺度：</strong>${r.meta}`;
    $('evidenceBadge').className=`evidence ${r.evidence}`;$('evidenceBadge').textContent=r.evidenceText;$('speciesNote').textContent=r.speciesNote;
    $('routeTags').innerHTML='';r.tags.forEach(tag);$('routeSource').textContent=r.source;$('sourceLink').href=r.sourceUrl;$('precisionNote').textContent=r.note;
    $('timelinePrecision').textContent=r.precision;$('timelineStart').textContent=r.steps[0].date;$('timelineEnd').textContent=r.steps[r.steps.length-1].date;
    $('timelineHint').textContent=r.note;
    $('prevBtn').disabled=selected===0;$('nextBtn').disabled=selected===rs.length-1;
    [...$('routeList').children].forEach((x,k)=>x.classList.toggle('active',k===selected));
    renderMilestones(); drawMode(); render(); if(pan)fit(false);
  }
  function setMode(next){
    mode=next;selected=0;progress=0;play(false);
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    $('modeLabel').textContent=modeInfo[mode].label;$('mapNote').textContent=modeInfo[mode].note;$('routeCount').textContent=`${currentRoutes().length} 条`;
    buildRouteList();select(0,false);setTimeout(()=>fit(true),30);
  }

  function render(){
    const r=currentRoute(), st=stateAt(progress), f=routeFraction(progress);
    if(bird)bird.setLatLng(at(r.p,f));
    $('timelineProgress').style.width=`${progress*100}%`;$('timeRange').value=Math.round(progress*1000);
    const show = st.local < .55 ? st.a : st.b;
    $('clockTime').textContent=show.date;$('clockPhase').textContent=show.phase;
    [...$('timelineMilestones').children].forEach((x,i)=>x.classList.toggle('active',i=== (st.local<.55?st.index:Math.min(st.index+1,r.steps.length-1))));
  }
  function play(on){playing=on;$('playBtn').textContent=on?'❚❚':'▶';if(on){if(progress>=1)progress=0;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}else{cancelAnimationFrame(raf);raf=null;}}
  function tick(now){if(!playing)return;const dt=Math.min((now-last)/1000,.1);last=now;progress=Math.min(1,progress+dt*speed/34);render();if(progress>=1){play(false);return;}raf=requestAnimationFrame(tick);}

  $('fitBtn').onclick=()=>fit(true);$('prevBtn').onclick=()=>select(selected-1,true);$('nextBtn').onclick=()=>select(selected+1,true);$('playBtn').onclick=()=>play(!playing);$('timeRange').oninput=e=>{play(false);progress=Number(e.target.value)/1000;render();};
  document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  $('terrainToggle').onchange=e=>{if(e.target.checked){terrain.addTo(map);$('terrainOpacity').disabled=false;}else{map.removeLayer(terrain);$('terrainOpacity').disabled=true;}};
  $('terrainOpacity').oninput=e=>{const v=Number(e.target.value);terrain.setOpacity(v/100);$('terrainValue').textContent=`${v}%`;};

  buildRouteList();setMode('video');
})();
