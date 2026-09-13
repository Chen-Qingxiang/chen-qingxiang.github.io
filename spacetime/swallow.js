(() => {
  'use strict';

  const routes = [
    {
      name:'甘肃西部 → 东非', sub:'H. r. rustica · 西侧种群', from:'甘肃酒泉—张掖', to:'东非越冬区', distance:'论文均值约 11,829 km',
      summary:'酒泉、张掖一侧的家燕在秋迁中绕到塔克拉玛干沙漠以北，再向西南穿越西亚和阿拉伯半岛，最终抵达东非。论文用光照地理定位器直接追踪到这一迁徙分化，并用基因组与稳定同位素结果交叉验证。',
      tags:['geolocator','东非','塔克拉玛干以北','迁徙分界'],
      source:'Turbek et al. (2022), Evolution 76:722–736, “A migratory divide spanning two continents is associated with genomic and ecological divergence”. 西侧酒泉/张掖个体经塔克拉玛干以北、跨阿拉伯半岛，在东非越冬；非洲路线平均 11,829 ± 1,073 km。',
      p:[[39.73,98.49],[40.14,94.66],[42.95,89.18],[43.24,76.89],[41.30,69.24],[38.57,68.78],[35.69,51.39],[33.31,44.36],[29.37,47.98],[24.71,46.68],[21.49,39.19],[15.50,39.47],[9.03,38.74],[-1.29,36.82],[-5.10,35.70]]
    },
    {
      name:'兰州 → 南印度', sub:'H. r. gutturalis · 东侧种群', from:'甘肃兰州', to:'南印度越冬区', distance:'论文均值约 5,407 km',
      summary:'兰州一侧的家燕没有跟随西部种群绕向非洲，而是向南穿越青藏高原方向并抵达南印度。两条迁徙路线在喀喇昆仑山系附近形成醒目的分叉，是论文最重要的结果之一。',
      tags:['geolocator','南印度','青藏高原','迁徙分界'],
      source:'Turbek et al. (2022), Evolution 76:722–736. 兰州个体向南跨越青藏高原，在南印度越冬；印度路线平均约 5,407 ± 834 km，并比非洲路线更早返回繁殖地。',
      p:[[36.06,103.83],[35.00,101.50],[33.30,99.20],[31.60,96.80],[29.65,91.10],[27.70,85.32],[25.60,83.00],[22.57,88.36],[19.08,82.00],[16.50,79.50],[13.08,80.27],[11.00,77.00]]
    },
    {
      name:'贝加尔湖 → 缅甸北部', sub:'H. r. tytleri · 西伯利亚家燕', from:'贝加尔湖塞连格河三角洲', to:'缅甸北部', distance:'追踪个体约 4,076 km',
      summary:'2025 年发表的追踪研究显示，一只在贝加尔湖繁殖的西伯利亚家燕秋季几乎径直向南，经过蒙古中部与中国中部，抵达缅甸北部。它没有像许多陆生候鸟那样大幅绕开山地。',
      tags:['2025 追踪','西伯利亚','蒙古','缅甸'],
      source:'Anisimova et al. (2025/2026), Journal of Ornithology, “Geolocator tracking and ring recoveries reveal the migration of Siberian Barn Swallows Hirundo rustica tytleri”. 追踪个体 2019-10-26 离开繁殖地，约两天后抵达越冬区，估计 4,076 km。',
      p:[[52.25,106.50],[48.80,105.00],[45.50,104.00],[42.20,103.80],[38.50,103.50],[35.50,103.20],[32.00,102.50],[28.50,101.20],[25.50,99.50],[23.50,97.00]]
    },
    {
      name:'湛江 → 婆罗洲', sub:'华南热带繁殖种群 · 秋迁绕行', from:'广东湛江', to:'婆罗洲越冬区', distance:'秋季更长、更绕',
      summary:'湛江繁殖种群的追踪结果特别适合做动画：秋季迁徙往往绕开南海这一生态屏障，沿中南半岛和马来半岛一侧南下；春季返回时则更倾向直接跨越南海。雄鸟集中在婆罗洲越冬。',
      tags:['2024 研究','婆罗洲','南海屏障','季节不对称'],
      source:'Tian et al. (2024), Avian Research 15:100192, “Migration pattern of a population of Barn Swallows (Hirundo rustica) breeding in East Asian tropical region”. 2021–2023 年部署 92 个 geolocator，成功回收 23 个；研究发现“秋季绕行、春季更直接”。',
      p:[[21.27,110.36],[20.00,108.50],[17.20,106.20],[14.00,105.50],[10.80,104.80],[7.50,103.00],[4.50,102.20],[1.50,103.80],[1.20,109.00],[1.50,114.00]]
    },
    {
      name:'湛江 → 菲律宾', sub:'华南热带繁殖种群 · 个体差异', from:'广东湛江', to:'菲律宾越冬区', distance:'部分雌鸟越冬方向',
      summary:'同一个湛江繁殖种群内部也存在明显个体差异。论文中的雌鸟除婆罗洲外，还出现菲律宾、越南和南海越冬位置。这条线强调迁徙图不应只有一条“标准答案”。',
      tags:['个体差异','菲律宾','雌鸟','geolocator'],
      source:'Tian et al. (2024), Avian Research 15:100192. 雄鸟全部集中于婆罗洲，而雌鸟主要在婆罗洲，也分散到菲律宾、南海和越南。此线为论文结果的区域级示意，并非单只鸟逐点 GPS。',
      p:[[21.27,110.36],[20.30,112.20],[19.20,114.50],[17.80,117.20],[15.80,119.50],[13.50,121.00],[10.50,123.50],[7.00,125.00]]
    }
  ];

  const colors=['#a52724','#285c8f','#6e4d8c','#2b7a62','#c26a1b'];
  const $=id=>document.getElementById(id);
  const map=L.map('map',{minZoom:2,maxZoom:11,preferCanvas:true,worldCopyJump:true}).setView([27,88],3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  map.createPane('terrainPane'); map.getPane('terrainPane').style.zIndex='240'; map.getPane('terrainPane').style.pointerEvents='none';
  const terrain=L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',{pane:'terrainPane',maxNativeZoom:12,maxZoom:19,opacity:.30,className:'terrain-tiles',attribution:'Terrain &copy; Esri, Airbus, USGS, NGA, NASA, CGIAR, et al.'}).addTo(map);

  const layers=[], birds=[]; let selected=0, progress=0, playing=false, speed=1, raf=null, last=0;
  const rad=d=>d*Math.PI/180;
  function dist(a,b){const R=6371,dl=rad(b[0]-a[0]),dn=rad(b[1]-a[1]),la=rad(a[0]),lb=rad(b[0]);const h=Math.sin(dl/2)**2+Math.cos(la)*Math.cos(lb)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
  function pathLen(p){let n=0;for(let i=0;i<p.length-1;i++)n+=dist(p[i],p[i+1]);return n;}
  function at(p,f){if(f<=0)return p[0];if(f>=1)return p[p.length-1];const target=pathLen(p)*f;let w=0;for(let i=0;i<p.length-1;i++){const e=dist(p[i],p[i+1]);if(w+e>=target){const t=(target-w)/e;return [p[i][0]+(p[i+1][0]-p[i][0])*t,p[i][1]+(p[i+1][1]-p[i][1])*t];}w+=e;}return p[p.length-1];}
  function sample(p,n=11){const out=[];for(let i=1;i<n;i++)out.push(at(p,i/n));return out;}
  function birdIcon(i){return L.divIcon({className:'bird-marker',html:`<div style="background:${colors[i]}">⌁</div>`,iconSize:[25,25],iconAnchor:[12,12]});}

  routes.forEach((r,i)=>{
    const c=colors[i];
    layers.push(L.polyline(r.p,{color:'#fffdf7',weight:8,opacity:.75,lineCap:'round',lineJoin:'round'}).addTo(map));
    const line=L.polyline(r.p,{color:c,weight:4,opacity:.9,lineCap:'round',lineJoin:'round'}).addTo(map).bindTooltip(r.name,{sticky:true,className:'migration-label'});
    line.on('click',()=>select(i,false)); layers.push(line);
    sample(r.p).forEach(q=>layers.push(L.circleMarker(q,{radius:2.8,color:'#fffdf7',weight:1,fillColor:c,fillOpacity:.95,interactive:false}).addTo(map)));
    [0,r.p.length-1].forEach((k,j)=>{const m=L.circleMarker(r.p[k],{radius:5,color:'#fffdf7',weight:2,fillColor:c,fillOpacity:1}).addTo(map).bindTooltip(j?r.to:r.from,{direction:'top',className:'migration-label'});m.on('click',()=>select(i,false));layers.push(m);});
    const b=L.marker(r.p[0],{icon:birdIcon(i),zIndexOffset:800+i}).addTo(map);b.on('click',()=>select(i,false));birds.push(b);layers.push(b);
  });

  function boundsFor(all=true){const pts=all?routes.flatMap(r=>r.p):routes[selected].p;return L.latLngBounds(pts);}
  function fit(all=true){map.fitBounds(boundsFor(all),{padding:[45,45],maxZoom:all?4.1:5});}
  function tag(t){const s=document.createElement('span');s.className='event-tag';s.textContent=t;$('routeTags').appendChild(s);}
  function select(i,pan=true){selected=Math.max(0,Math.min(routes.length-1,i));const r=routes[selected];$('routeIndex').textContent=`路线 ${String(selected+1).padStart(2,'0')} / ${String(routes.length).padStart(2,'0')}`;$('routeSub').textContent=r.sub;$('routeTitle').textContent=r.name;$('routePlace').textContent=`${r.from} → ${r.to}`;$('routeSummary').textContent=r.summary;$('routeSource').textContent=r.source;$('routeTags').innerHTML='';r.tags.forEach(tag);$('prevBtn').disabled=selected===0;$('nextBtn').disabled=selected===routes.length-1;[...$('routeList').children].forEach((x,k)=>x.classList.toggle('active',k===selected));if(pan)fit(false);}
  routes.forEach((r,i)=>{const b=document.createElement('button');b.className='route-key';b.textContent=r.name;b.onclick=()=>select(i,true);$('routeList').appendChild(b);});

  function phase(){if(progress<.12)return['9 月','离开繁殖地'];if(progress<.5)return['9–10 月','迁徙途中'];if(progress<.85)return['10–11 月','接近越冬区'];return['冬季','抵达越冬地'];}
  function render(){birds.forEach((b,i)=>b.setLatLng(at(routes[i].p,progress)));$('timelineProgress').style.width=`${progress*100}%`;$('timeRange').value=Math.round(progress*1000);const [t,p]=phase();$('clockTime').textContent=t;$('clockPhase').textContent=p;}
  function play(on){playing=on;$('playBtn').textContent=on?'❚❚':'▶';if(on){if(progress>=1)progress=0;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}else{cancelAnimationFrame(raf);raf=null;}}
  function tick(now){if(!playing)return;const dt=Math.min((now-last)/1000,.1);last=now;progress=Math.min(1,progress+dt*speed/32);render();if(progress>=1){play(false);return;}raf=requestAnimationFrame(tick);}

  $('fitBtn').onclick=()=>fit(true);$('prevBtn').onclick=()=>select(selected-1,true);$('nextBtn').onclick=()=>select(selected+1,true);$('playBtn').onclick=()=>play(!playing);$('timeRange').oninput=e=>{play(false);progress=Number(e.target.value)/1000;render();};
  document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
  $('terrainToggle').onchange=e=>{if(e.target.checked){terrain.addTo(map);$('terrainOpacity').disabled=false;}else{map.removeLayer(terrain);$('terrainOpacity').disabled=true;}};
  $('terrainOpacity').oninput=e=>{const v=Number(e.target.value);terrain.setOpacity(v/100);$('terrainValue').textContent=`${v}%`;};

  $('routeCount').textContent=`${routes.length} 条`;select(0,false);render();setTimeout(()=>fit(true),60);
})();
