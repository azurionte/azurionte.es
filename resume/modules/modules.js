// [modules.js] v2.8.0 — sections rendering + horizontal add menu + safe host insertion
console.log('[modules.js] v2.8.0');

import { S } from '../app/state.js';
import { ensureCanvas, ensureAddAnchor, getRailHolder, getSideMain } from '../layouts/layouts.js';

/* ---------- one-time styles ---------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
    .section{background:#f7f8ff;border:1px solid #e4e6ff;border-radius:14px;padding:12px 14px;box-shadow:0 8px 26px rgba(0,0,0,.10)}
    [data-dark="1"] .section{background:#0d1224;border-color:#1f2744}
    .sec-head{display:grid;justify-items:center;margin-bottom:8px}
    .sec-title{font-weight:900}
    .sec-underline{height:4px;width:120px;border-radius:999px;background:linear-gradient(135deg,var(--accent2),var(--accent));margin-top:6px}

    .card{background:#fff;border:1px solid #eceffe;border-radius:12px;padding:10px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
    [data-dark="1"] .card{background:#0f162e;border-color:#1f2744}
    .chip-year{display:inline-flex;align-items:center;gap:8px;background:var(--accentFade);color:#111;border-radius:999px;padding:4px 10px;font-weight:800}
    [data-dark="1"] .chip-year{color:#fff}

    .skills-list{display:grid;gap:8px}
    .skill-row{display:grid; grid-template-columns: 1fr 120px; gap:10px; align-items:center}
    .stars{display:inline-flex;gap:6px}
    .star{width:16px;height:16px;fill:#d1d5db}
    .star.on{fill:#f59e0b}
    .meter{height:6px;border-radius:999px;background:#e7e9ff;position:relative}
    .meter > i{position:absolute;top:-4px;width:12px;height:12px;border-radius:999px;background:var(--accent)}
    [data-dark="1"] .meter{background:#1f2744}

    /* plus menu (horizontal) */
    .add-pop{position:absolute;inset:auto auto 100% 50%;transform:translate(-50%,-10px);display:none}
    .add-pop.on{display:block}
    .add-tray{display:flex;gap:6px;background:#0b1022;border-radius:10px;padding:6px 8px;box-shadow:0 10px 28px rgba(0,0,0,.35)}
    .add-tray button{width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:#fff;display:grid;place-items:center;cursor:pointer}
    .add-tray button:hover{background:#141936}
  `;
  document.head.appendChild(st);
})();

/* ---------- helpers ---------- */
function getAccentFade(){
  // cheap readable chip background depending on theme
  const dark = document.body.getAttribute('data-dark') === '1';
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#7c4dff';
  return dark ? 'rgba(124,77,255,0.25)' : 'rgba(124,77,255,0.15)';
}

/** Choose correct host and keep the "+" with it */
function ensureInHost({ toRail=false } = {}){
  ensureCanvas();
  const host = toRail ? (getRailHolder() || getSideMain()) : getSideMain();
  const add = ensureAddAnchor(true);
  if (host && add && add.parentNode !== host) host.appendChild(add);
  return { host, add };
}

/** Insert safely before "+" if present; else append at end */
function placeInHost(host, addNode, node){
  if (host && addNode && addNode.parentNode === host){
    host.insertBefore(node, addNode);
  } else {
    host.appendChild(node);
  }
}

/* ---------- openAddMenu (horizontal above +) ---------- */
let pop;
export function openAddMenu(anchor){
  if (!pop){
    pop = document.createElement('div');
    pop.className = 'add-pop';
    pop.innerHTML = `<div class="add-tray">
        <button data-k="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></button>
        <button data-k="edu"    title="Education"><i class="fa-solid fa-graduation-cap"></i></button>
        <button data-k="exp"    title="Experience"><i class="fa-solid fa-briefcase"></i></button>
        <button data-k="bio"    title="Profile"><i class="fa-solid fa-user-pen"></i></button>
      </div>`;
    anchor.parentElement.appendChild(pop);
    pop.addEventListener('click', e=>{
      const k = e.target.closest('button')?.dataset.k; if(!k) return;
      if (k==='skills') renderSkills([{type:'star',label:'Skill',stars:3}], { toRail: S.layout==='side' });
      if (k==='edu')    renderEdu([{kind:'degree',title:'',dates:'2018–2022',academy:''}]);
      if (k==='exp')    renderExp([{dates:'Jan 2024 – Present',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]);
      if (k==='bio')    renderBio('Add a short summary of your profile, strengths and what you’re great at.');
      pop.classList.remove('on');
    });
    document.addEventListener('click', (e)=>{ if(!pop.contains(e.target) && e.target!==anchor) pop.classList.remove('on'); });
  }
  pop.classList.toggle('on');
}

/* ---------- section builders ---------- */
function sectionShell(title){
  const s = document.createElement('div');
  s.className = 'section';
  s.innerHTML = `<div class="sec-head"><div class="sec-title">${title}</div><div class="sec-underline"></div></div>`;
  return s;
}

/* Skills */
export function renderSkills(items=[], { toRail=false } = {}){
  const { host, add } = ensureInHost({ toRail });
  if (!host) return;

  const sec = sectionShell('Skills');
  const list = document.createElement('div');
  list.className = 'skills-list';
  sec.appendChild(list);

  items.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'skill-row';
    const title = document.createElement('div');
    title.textContent = it.label || 'Skill';
    const right = document.createElement('div');

    if (it.type === 'star'){
      right.innerHTML = `<svg class="star ${it.stars>=1?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         <svg class="star ${it.stars>=2?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         <svg class="star ${it.stars>=3?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         <svg class="star ${it.stars>=4?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         <svg class="star ${it.stars>=5?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      right.className='stars';
    } else {
      const m = document.createElement('div'); m.className='meter';
      m.innerHTML = `<i style="left:${Math.max(0, Math.min(100, it.value||60))}%"></i>`;
      right.appendChild(m);
    }
    row.appendChild(title); row.appendChild(right);
    list.appendChild(row);
  });

  // theme-dependent chip color
  sec.style.setProperty('--accentFade', getAccentFade());
  placeInHost(host, add, sec);
}

/* Education */
export function renderEdu(list=[]){
  const { host, add } = ensureInHost();
  if (!host) return;

  const sec = sectionShell('Education');
  const grid = document.createElement('div');
  grid.style.display='grid';
  grid.style.gridTemplateColumns='1fr 1fr';
  grid.style.gap='10px';
  sec.appendChild(grid);

  list.forEach(it=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <div style="margin-bottom:6px"><span class="chip-year"><i class="fa-solid ${it.kind==='degree'?'fa-graduation-cap':'fa-scroll'}"></i>${it.dates||'2018–2022'}</span></div>
      <div style="font-weight:800;margin-bottom:4px">${it.title||''}</div>
      <div style="opacity:.8">${it.academy||''}</div>`;
    grid.appendChild(card);
  });

  sec.style.setProperty('--accentFade', getAccentFade());
  placeInHost(host, add, sec);
}

/* Experience */
export function renderExp(list=[]){
  const { host, add } = ensureInHost();
  if (!host) return;

  const sec = sectionShell('Work experience');
  sec.style.setProperty('--accentFade', getAccentFade());

  list.forEach(it=>{
    const card = document.createElement('div');
    card.className='card';
    card.style.marginBottom='10px';
    card.innerHTML = `
      <div style="margin-bottom:6px"><span class="chip-year"><i class="fa-solid fa-list"></i>${it.dates||''}</span></div>
      <div style="display:grid;gap:4px">
        <div style="font-weight:800">${it.role||'Job title'}</div>
        <div style="opacity:.9">${it.org||'@Company'}</div>
        <div style="opacity:.8">${it.desc||''}</div>
      </div>`;
    sec.appendChild(card);
  });

  placeInHost(host, add, sec);
}

/* Bio/Profile */
export function renderBio(text=''){
  const { host, add } = ensureInHost({ toRail:false });
  if (!host) return;

  const sec = sectionShell('Profile');
  const card = document.createElement('div');
  card.className='card';
  card.textContent = text || 'Add a short summary of your profile, strengths and what you’re great at.';
  sec.appendChild(card);
  placeInHost(host, add, sec);
}
