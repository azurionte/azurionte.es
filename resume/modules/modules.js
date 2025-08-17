// /resume/modules/modules.js
// [modules.js] v2.2 — skills (no overflow + edit overlays + 2 columns), edu/exp theme tint, animated "Added"
console.log('[modules.js] v2.2');

import { S } from '../app/state.js';
import { getRailHolder, getSideMain, darkChipStyle, themeColors } from '../layouts/layouts.js';

/* ---------- styles for modules ---------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
    .module{background:#f7f7fb;border:1px solid #e5e7f0;border-radius:14px;padding:12px 12px 10px}
    [data-dark="1"] .module{background:#0f1320;border-color:#1a223d}
    .mod-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    .mod-head .ttl{font-weight:900}
    .mod-body{display:block}

    /* SKILLS */
    .skills{padding:0}
    .skills .intro{opacity:.8;font-size:.92em;margin:4px 2px 8px}
    .skills-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .skills-grid.single{grid-template-columns:1fr}
    .s-row{position:relative;display:grid;grid-template-columns:2fr 1fr;align-items:center;gap:8px;padding:4px 6px;border-radius:10px}
    .s-row .name{min-width:0}
    .s-row .name input{width:100%;background:transparent;border:0;outline:none;padding:6px 10px;border-radius:10px}
    [data-dark="1"] .s-row .name input{color:#e8edff}
    .s-row .meter{min-width:0;display:flex;justify-content:flex-end;align-items:center;gap:8px}
    .meter .stars{display:inline-flex;gap:6px}
    .meter .stars svg{width:12px;height:12px;fill:#c6cad6}
    .meter .stars .on{fill:#f59e0b}
    .meter input[type=range]{width:100%;max-width:120px}
    /* edit overlay that doesn't shift layout */
    .s-row[data-edit="1"]{outline:1px dashed rgba(124,153,255,.7); outline-offset:3px; box-shadow:0 0 0 3px rgba(124,153,255,.05) inset}
    .s-row .ctrl{position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:8px;background:#0f1529;border:1px solid #2b3458;display:grid;place-items:center;color:#cfe1ff;cursor:pointer}
    .s-row .ctrl-h{left:-28px}
    .s-row .ctrl-x{right:-28px}
    .s-row .ctrl:hover{outline:2px solid #7c99ff55}

    /* EDUCATION + EXPERIENCE CARDS */
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .card{border-radius:14px;padding:12px;border:1px solid var(--card-border,#e5e7f0);background:var(--card-bg,#fff)}
    [data-dark="1"] .card{--card-border:#1f2949;--card-bg:#0e1324}
    .card .line1{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .year-badge{display:inline-block;border-radius:999px;padding:4px 10px;font-weight:800;border:1px solid transparent}
    .year-badge.dark{background:var(--yb-bg);color:var(--yb-fg);border-color:var(--yb-br)}

    .exp-card .line2{display:grid;gap:4px}
  `;
  document.head.appendChild(st);
})();

/* ---------- helpers ---------- */
function stars(n=0){
  const wrap = document.createElement('span'); wrap.className='stars';
  for(let i=1;i<=5;i++){
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox','0 0 24 24');
    s.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
    if (i<=n) s.classList.add('on');
    wrap.appendChild(s);
  }
  return wrap;
}
function pickContainer({toRail}={}){
  if (toRail && getRailHolder()) return getRailHolder();
  return getSideMain();
}
function setYearChip(el){
  const { bg, text, border } = darkChipStyle();
  el.style.setProperty('--yb-bg', bg);
  el.style.setProperty('--yb-fg', text);
  el.style.setProperty('--yb-br', border);
  el.classList.add('dark');
}
function tintCard(node){
  // light tint using theme accent
  const { a } = themeColors();
  node.style.setProperty('--card-bg', 'rgba(0,0,0,0)'); // keep base
  node.style.background = `linear-gradient(180deg, ${a}14, transparent)`;
  node.style.setProperty('--card-border', `${a}33`);
}

/* ---------- public renders ---------- */
export function renderSkills(items, { toRail=false }={}){
  const host = pickContainer({toRail});
  const mod = document.createElement('div');
  mod.className = 'module skills';
  mod.innerHTML = `
    <div class="mod-head"><i class="fa-solid fa-layer-group"></i><div class="ttl">Skills</div></div>
    <div class="mod-body">
      <div class="intro">Use ★ or the slider to rate your confidence. You can add languages, tools or any ability here.</div>
      <div class="skills-grid"></div>
    </div>`;
  const grid = mod.querySelector('.skills-grid');

  // 2 columns per row
  items.forEach((it, idx)=>{
    const row = document.createElement('div'); row.className = 's-row'; row.dataset.edit='1';
    row.innerHTML = `
      <div class="ctrl ctrl-h" title="Drag">⋮⋮</div>
      <div class="ctrl ctrl-x" title="Delete">×</div>
      <div class="name"><input value="${it.label || 'Skill'}"></div>
      <div class="meter"></div>`;
    const m = row.querySelector('.meter');
    if (it.type==='slider'){
      const r = document.createElement('input'); r.type='range'; r.min='0'; r.max='100'; r.value = it.value ?? 60;
      m.appendChild(r);
    }else{
      m.appendChild(stars(it.stars ?? 0));
    }
    row.querySelector('.ctrl-x').onclick = ()=> row.remove();
    grid.appendChild(row);
  });

  // ensure grid is 2 columns in rail but can collapse
  if (getRailHolder() && host===getRailHolder()){ /* keep 2 columns by default */ } else { grid.classList.add('single'); }

  host.insertBefore(mod, host.querySelector('#canvasAdd') || null);
}

export function renderEdu(list){
  const host = pickContainer({toRail:false});
  const mod = document.createElement('div');
  mod.className = 'module edu';
  mod.innerHTML = `<div class="mod-head"><i class="fa-solid fa-graduation-cap"></i><div class="ttl">Education</div></div><div class="mod-body"><div class="cards"></div></div>`;
  const cards = mod.querySelector('.cards');

  list.forEach(d=>{
    const c = document.createElement('div'); c.className='card edu-card';
    c.innerHTML = `
      <div class="line1">
        <i class="fa-solid ${d.kind==='degree' ? 'fa-graduation-cap' : 'fa-scroll'}"></i>
        <span class="year-badge">${d.dates || '—'}</span>
      </div>
      <div class="line2"><div><strong>${d.title||''}</strong></div><div>${d.academy||''}</div></div>`;
    // theme tint + dark-chip
    tintCard(c);
    setYearChip(c.querySelector('.year-badge'));
    cards.appendChild(c);
  });

  host.insertBefore(mod, host.querySelector('#canvasAdd') || null);
}

export function renderExp(list){
  const host = pickContainer({toRail:false});
  const mod = document.createElement('div');
  mod.className = 'module exp';
  mod.innerHTML = `<div class="mod-head"><i class="fa-solid fa-briefcase"></i><div class="ttl">Work experience</div></div><div class="mod-body"><div class="cards single"></div></div>`;
  const cards = mod.querySelector('.cards'); cards.style.gridTemplateColumns = '1fr';

  list.forEach(d=>{
    const c = document.createElement('div'); c.className='card exp-card';
    c.innerHTML = `
      <div class="line1">
        <i class="fa-solid fa-grip-vertical" style="opacity:.6"></i>
        <span class="year-badge">${d.dates || '—'}</span>
        <strong style="margin-left:8px">${d.role || 'Job title'}</strong>
      </div>
      <div class="line2">
        <div style="opacity:.9"><strong>@${(d.org||'Company').replace(/^@/,'')}</strong></div>
        <div style="opacity:.9">${d.desc || 'Describe impact, scale and results.'}</div>
      </div>`;
    tintCard(c);
    setYearChip(c.querySelector('.year-badge'));
    cards.appendChild(c);
  });

  host.insertBefore(mod, host.querySelector('#canvasAdd') || null);
}

export function renderBio(text){
  const host = pickContainer({toRail:false});
  const mod = document.createElement('div');
  mod.className = 'module bio';
  mod.innerHTML = `<div class="mod-head"><i class="fa-solid fa-user"></i><div class="ttl">Profile</div></div><div class="mod-body">${(text||'').replace(/\n/g,'<br>')}</div>`;
  host.insertBefore(mod, host.querySelector('#canvasAdd') || null);
}
