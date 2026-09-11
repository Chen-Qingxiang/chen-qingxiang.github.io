import initXraydb, * as xray from 'https://cdn.jsdelivr.net/npm/xraydb-wasm@0.4.1/loader.mjs';

const $ = id => document.getElementById(id);
const QUICK = ['Fe','Cu','Mo','I','Cs','W','Au','Pb','U'];
const EDGE_ORDER = ['K','L1','L2','L3','M1','M2','M3','M4','M5'];
const EDGE_COLORS = {
  K:'#d85870', L1:'#6c72c9', L2:'#4f8fcd', L3:'#38a3a5',
  M1:'#d29b3a', M2:'#c67a46', M3:'#b56d8b', M4:'#8f75b9', M5:'#6976a8'
};
const state = { ready:false, z:26, symbol:'Fe', edgesByZ:new Map(), selectedEdges:[], lines:[] };

function fmt(v, sig=5){
  if(!Number.isFinite(v)) return '—';
  if(v===0) return '0';
  const a=Math.abs(v);
  if(a>=1e4 || a<1e-3) return v.toExponential(sig-1);
  return Number(v.toPrecision(sig)).toString();
}
function kev(eV){ return eV/1000; }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function boot(){
  try{
    await initXraydb();
    buildQuickPicks();
    buildEdgeDatabase();
    buildLegend();
    wireControls();
    state.ready=true;
    selectElement('Fe');
    $('status').textContent = `XrayDB ${xray.data_version?.() ?? ''}`.trim();
  }catch(err){
    $('status').classList.add('error');
    $('status').textContent = `加载失败：${err?.message || err}`;
  }
}

function buildQuickPicks(){
  const wrap=$('quickPicks');
  for(const sym of QUICK){
    const b=document.createElement('button'); b.type='button'; b.textContent=sym; b.dataset.symbol=sym;
    b.addEventListener('click',()=>selectElement(sym)); wrap.appendChild(b);
  }
}

function buildEdgeDatabase(){
  for(let z=1; z<=118; z++){
    try{
      const sym=xray.symbol(String(z));
      const edges=xray.xray_edges(sym)
        .filter(e=>EDGE_ORDER.includes(e.label))
        .map(e=>({z,symbol:sym,label:e.label,energy:e.energy,fluorescence_yield:e.fluorescence_yield,jump_ratio:e.jump_ratio}));
      state.edgesByZ.set(z,edges);
    }catch{ state.edgesByZ.set(z,[]); }
  }
}

function buildLegend(){
  const target=$('edgeLegend');
  target.innerHTML=EDGE_ORDER.map(label=>`<span data-edge="${label}"><i style="background:${EDGE_COLORS[label]}"></i>${label}</span>`).join('');
}

function wireControls(){
  $('applyElement').addEventListener('click',()=>selectElement($('elementInput').value));
  $('elementInput').addEventListener('keydown',e=>{ if(e.key==='Enter') selectElement(e.currentTarget.value); });
  $('showM').addEventListener('change',renderEdgeMap);
  $('logY').addEventListener('change',renderEdgeMap);
  $('lineMax').addEventListener('change',()=>{ renderLinePlot(); renderLineList(); });
}

function resolveElement(raw){
  const value=String(raw ?? '').trim();
  if(!value) throw new Error('请输入元素符号、原子序数或英文名。');
  try{ return xray.atomic_number(value); }catch{}
  const cap=value.length<=3 ? value.charAt(0).toUpperCase()+value.slice(1).toLowerCase() : value;
  return xray.atomic_number(cap);
}

function selectElement(raw){
  if(!state.ready) return;
  try{
    const z=resolveElement(raw);
    const info=xray.element(String(z));
    state.z=z; state.symbol=info.symbol;
    state.selectedEdges=(state.edgesByZ.get(z)||[]).slice().sort((a,b)=>b.energy-a.energy);
    try{ state.lines=Array.from(xray.xray_lines(info.symbol, undefined, undefined)); }catch{ state.lines=[]; }
    $('elementInput').value=info.symbol;
    $('zReadout').textContent=`Z = ${z}`;
    $('symbolReadout').textContent=info.symbol;
    $('nameReadout').textContent=info.name;
    document.querySelectorAll('.quick-picks button').forEach(b=>b.classList.toggle('active',b.dataset.symbol===info.symbol));
    updateSummary(); renderEdgeTable(); renderEdgeMap(); renderShellDiagram(); renderLinePlot(); renderLineList();
    history.replaceState(null,'',`#${info.symbol}`);
    $('status').classList.remove('error');
  }catch(err){
    $('status').classList.add('error'); $('status').textContent=String(err?.message||err);
  }
}

function updateSummary(){
  const byLabel=Object.fromEntries(state.selectedEdges.map(e=>[e.label,e]));
  const parts=[];
  for(const label of ['K','L1','L2','L3']) if(byLabel[label]) parts.push(`${label} ${fmt(kev(byLabel[label].energy),5)} keV`);
  $('edgeSummary').textContent=parts.length ? parts.join(' · ') : '没有可用的 K/L edge 数据。';
}

function renderEdgeTable(){
  if(!state.selectedEdges.length){ $('edgeTable').innerHTML='<p class="muted">No tabulated edges.</p>'; return; }
  const rows=state.selectedEdges.map(e=>`<tr><td><b>${e.label}</b></td><td>${fmt(kev(e.energy),6)}</td><td>${fmt(e.fluorescence_yield,4)}</td><td>${fmt(e.jump_ratio,4)}</td></tr>`).join('');
  $('edgeTable').innerHTML=`<table class="edge-table"><thead><tr><th>Edge</th><th>keV</th><th>Fluor. yield</th><th>Jump ratio</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderEdgeMap(){
  const svg=$('edgeMap'), W=1320,H=500,ML=62,MR=24,MT=18,MB=48;
  const showM=$('showM').checked, logY=$('logY').checked;
  const labels=showM?EDGE_ORDER:EDGE_ORDER.filter(x=>!x.startsWith('M'));
  const points=[];
  for(const [z,edges] of state.edgesByZ){ for(const e of edges) if(labels.includes(e.label)){ const k=kev(e.energy); if(k>0.02 && k<350) points.push({...e,kev:k}); } }
  const ymin=0.05,ymax=300;
  const px=z=>ML+(z-1)/(118-1)*(W-ML-MR);
  const py=e=>{
    const t=logY ? (Math.log10(e)-Math.log10(ymin))/(Math.log10(ymax)-Math.log10(ymin)) : (e-ymin)/(ymax-ymin);
    return H-MB-t*(H-MT-MB);
  };
  const out=[];
  const xticks=[1,10,20,30,40,50,60,70,80,90,100,110,118];
  for(const z of xticks){ const x=px(z); out.push(`<line class="grid" x1="${x}" y1="${MT}" x2="${x}" y2="${H-MB}"/><text class="tick" x="${x}" y="${H-MB+18}" text-anchor="middle">${z}</text>`); }
  const yticks=logY?[0.1,0.2,0.5,1,2,5,10,20,50,100,200]:[0,50,100,150,200,250,300];
  for(const e of yticks){ if(e<ymin||e>ymax) continue; const y=py(e); out.push(`<line class="grid" x1="${ML}" y1="${y}" x2="${W-MR}" y2="${y}"/><text class="tick" x="${ML-8}" y="${y+4}" text-anchor="end">${e}</text>`); }
  out.push(`<line class="axis" x1="${ML}" y1="${H-MB}" x2="${W-MR}" y2="${H-MB}"/><line class="axis" x1="${ML}" y1="${MT}" x2="${ML}" y2="${H-MB}"/>`);
  out.push(`<text class="axis-label" x="${(ML+W-MR)/2}" y="${H-8}" text-anchor="middle">Atomic number Z</text><text class="axis-label" transform="translate(15,${(MT+H-MB)/2}) rotate(-90)" text-anchor="middle">Binding / edge energy (keV)</text>`);
  const sx=px(state.z); out.push(`<line class="selected-z-line" x1="${sx}" y1="${MT}" x2="${sx}" y2="${H-MB}"/>`);
  for(const p of points){ const r=p.z===state.z?4.2:2.1; const opacity=p.z===state.z?1:.58; out.push(`<circle class="edge-point" data-z="${p.z}" cx="${px(p.z)}" cy="${py(p.kev)}" r="${r}" fill="${EDGE_COLORS[p.label]}" opacity="${opacity}"><title>${p.symbol} ${p.label}: ${fmt(p.kev,6)} keV</title></circle>`); }
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.innerHTML=out.join('');
  svg.querySelectorAll('.edge-point').forEach(node=>node.addEventListener('click',()=>selectElement(Number(node.dataset.z))));
  document.querySelectorAll('#edgeLegend [data-edge^="M"]').forEach(n=>n.style.display=showM?'inline-flex':'none');
}

function renderShellDiagram(){
  const svg=$('shellDiagram'), W=760,H=430,ML=95,MR=95,MT=42,MB=42;
  const edges=state.selectedEdges.filter(e=>EDGE_ORDER.includes(e.label));
  if(!edges.length){ svg.innerHTML=''; return; }
  const maxE=Math.max(...edges.map(e=>e.energy)), minE=Math.max(20,Math.min(...edges.map(e=>e.energy)));
  const ly=e=>MT+42+((Math.log10(e)-Math.log10(minE))/(Math.log10(maxE)-Math.log10(minE)||1))*(H-MT-MB-58);
  const out=[`<line class="vacuum-line" x1="${ML}" y1="${MT}" x2="${W-MR}" y2="${MT}"/><text class="tick" x="${ML}" y="${MT-8}">vacuum · 0 eV</text>`];
  for(const e of edges){
    const y=ly(e.energy), color=EDGE_COLORS[e.label]||'#667085';
    out.push(`<line class="shell-level" x1="${ML+30}" y1="${y}" x2="${W-MR-20}" y2="${y}" stroke="${color}"/>`);
    out.push(`<text class="shell-label" x="${ML}" y="${y+4}" fill="${color}">${e.label}</text>`);
    out.push(`<text class="shell-energy" x="${W-MR+2}" y="${y+4}">${fmt(kev(e.energy),6)} keV</text>`);
  }
  out.push(`<text class="axis-label" x="${W/2}" y="${H-9}" text-anchor="middle">deeper shell ↓ larger binding energy</text>`);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.innerHTML=out.join('');
}

function lineGroupColor(level){ if(level==='K') return '#c14d64'; if(level?.startsWith('L')) return '#4f8fcd'; if(level?.startsWith('M')) return '#c4873e'; return '#59647a'; }
function filteredLines(){
  const max=Number($('lineMax').value)||200;
  return state.lines.filter(l=>l.energy>0 && kev(l.energy)<=max).sort((a,b)=>a.energy-b.energy);
}

function renderLinePlot(){
  const svg=$('linePlot'), lines=filteredLines(), W=1280,H=330,ML=62,MR=24,MT=18,MB=48;
  const max=Number($('lineMax').value)||200;
  const px=e=>ML+e/max*(W-ML-MR);
  const groups=[...new Set(lines.map(l=>l.initial_level||'?'))].sort((a,b)=>EDGE_ORDER.indexOf(a)-EDGE_ORDER.indexOf(b));
  const lanes=new Map(groups.map((g,i)=>[g,MT+28+i*((H-MT-MB-36)/Math.max(1,groups.length-1))]));
  const maxByGroup=new Map();
  for(const g of groups) maxByGroup.set(g,Math.max(...lines.filter(l=>(l.initial_level||'?')===g).map(l=>l.intensity||0),1));
  const out=[];
  for(const e of [0,20,40,60,80,100,120,140,160,180,200]){ if(e>max) continue; const x=px(e); out.push(`<line class="grid" x1="${x}" y1="${MT}" x2="${x}" y2="${H-MB}"/><text class="tick" x="${x}" y="${H-MB+18}" text-anchor="middle">${e}</text>`); }
  for(const g of groups){ const y=lanes.get(g); out.push(`<line class="grid" x1="${ML}" y1="${y}" x2="${W-MR}" y2="${y}"/><text class="tick" x="${ML-8}" y="${y+4}" text-anchor="end">${esc(g)}</text>`); }
  const labelCandidates=[];
  for(const l of lines){
    const g=l.initial_level||'?', y=lanes.get(g), rel=(l.intensity||0)/(maxByGroup.get(g)||1), h=10+34*Math.sqrt(Math.max(0,rel)), x=px(kev(l.energy));
    const major=rel>.55; out.push(`<line class="emission-stick${major?' major':''}" x1="${x}" y1="${y}" x2="${x}" y2="${y-h}" stroke="${lineGroupColor(g)}"><title>${l.label}: ${fmt(kev(l.energy),6)} keV · ${g}</title></line>`);
    if(major) labelCandidates.push({x,y:y-h-4,label:l.label});
  }
  for(const l of labelCandidates.slice(0,20)) out.push(`<text class="line-label" x="${l.x+3}" y="${l.y}" transform="rotate(-55 ${l.x+3} ${l.y})">${esc(l.label)}</text>`);
  out.push(`<line class="axis" x1="${ML}" y1="${H-MB}" x2="${W-MR}" y2="${H-MB}"/><text class="axis-label" x="${(ML+W-MR)/2}" y="${H-8}" text-anchor="middle">Photon energy (keV)</text>`);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.innerHTML=out.join('');
}

function renderLineList(){
  const lines=filteredLines();
  const grouped=new Map();
  for(const l of lines){ const g=l.initial_level||'?'; if(!grouped.has(g)) grouped.set(g,[]); grouped.get(g).push(l); }
  const picks=[];
  for(const [g,arr] of grouped){ arr.sort((a,b)=>(b.intensity||0)-(a.intensity||0)); for(const l of arr.slice(0,5)) picks.push({...l,group:g}); }
  picks.sort((a,b)=>a.energy-b.energy);
  $('lineList').innerHTML=picks.map(l=>`<span class="line-chip"><b>${esc(l.label)}</b> ${fmt(kev(l.energy),6)} keV · ${esc(l.group)}</span>`).join('') || '<span class="muted">No lines in this energy window.</span>';
}

window.addEventListener('hashchange',()=>{ const h=decodeURIComponent(location.hash.slice(1)); if(h && state.ready) selectElement(h); });
boot();
