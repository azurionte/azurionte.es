// /resume/modules/modules.js
// [modules.js] v2.7.0 — safe insert; icon-only add menu; renderers for Skills/Edu/Exp/Bio
console.log('[modules.js] v2.7.0');

import { S } from '../app/state.js';
import {
  ensureCanvas,
  getSideMain,
  getRailHolder,
  isSidebarActive,
  ensureAddAnchor,
} from '../layouts/layouts.js';

/* ------------------------------------------------------------------ */
/* Styles (once)                                                      */
/* ------------------------------------------------------------------ */
(function ensureStyle(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
    /* section shell */
    .module{position:relative;border-radius:14px;padding:14px;background:var(--mod-bg,#0c1324);
      border:1px solid var(--mod-br,#1f2540); box-shadow:0 12px 26px rgba(0,0,0,.14)}
    .module .title{display:grid;justify-items:center;gap:6px;margin-bottom:10px;font-weight:900}
    .module .title .u{height:4px;width:120px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent))}
    .mod-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

    /* EDU / EXP cards (light tint, theme-reactive) */
    .k-card{border-radius:12px;padding:10px;background:var(--kbg,#111425);
      border:1px solid var(--kbr,#232a45); box-shadow:inset 0 1px 0 #ffffff12}
    .k-chip{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;font-weight:800;
      background:var(--chip-bg,#141a2e);color:var(--chip-fg,#e8ecff);border:1px solid #ffffff14}

    /* skills */
    .skills-list{display:grid;gap:8px}
    .skill-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:center;gap:10px}
    .skill-name[contenteditable]{outline:none;border-radius:10px;padding:6px 10px;background:transparent;border:1px solid transparent}
    .skill-row.editing{position:relative}
    .skill-row.editing::after{content:'';position:absolute;inset:-4px;border:2px dotted #7c99ff;border-radius:12px;box-shadow:0 0 18px #7c99ff44}
    .skill-floating{position:absolute;top:50%;transform:translateY(-50%);display:grid;gap:6px}
    .skill-floating.left{left:-26px}
    .skill-floating.right{right:-26px}
    .skill-btn{width:20px;height:20px;border-radius:10px;background:#0b1024;border:1px solid #243057;color:#e8ecff;
      display:grid;place-items:center;font-size:12px;cursor:pointer}
    .stars{display:inline-grid;grid-auto-flow:column;gap:6px;justify-content:end}
    .star{width:16px;height:16px;fill:#8892a6;cursor:pointer}
    .star.on{fill:#f59e0b}
    .meter{appearance:none;width:100%;height:6px;border-radius:999px;background:#272f50;outline:none}
    .meter::-webkit-slider-thumb{appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid #0c1324}

    /* add menu (icon-only, horizontal, above +, centered) */
    .add-pop{position:fixed;inset:0;display:none;align-items:center;justify-content:center}
    .add-pop[aria-hidden="false"]{display:flex}
    .add-tray{position:absolute;display:flex;gap:8px;background:#0c1324;border:1px solid #1f2540;padding:8px 10px;
      border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.45)}
    .add-tray .i{width:36px;height:36px;border-radius:10px;border:1px solid #2b3458;background:#0f172f;color:#e8ecff;
      display:grid;place-items:center;cursor:pointer}
    .add-tray .i:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(0,0,0,.35)}
  `;
  document.head.appendChild(st);
})();

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
function hostForMainSections(){
  // Main column (grid or stack), not the rail
  ensureCanvas();            // makes sure stack & #canvasAdd exist
  return getSideMain();      // returns right side for sidebar layout, otherwise #stack
}

function safeInsertInHost(node, { preferBeforeAdd=true } = {}){
  // Robustly place node in the current host, before the big "+" if possible.
  const host = hostForMainSections();
  const { add } = ensureCanvas();   // #canvasAdd
  if (!host) return;

  // Keep the + anchored in the current host.
  ensureAddAnchor(true);

  // If the add isn't a direct child of this host, just append at end.
  // (This prevents NotFoundError when the + is hosted elsewhere.)
  const addIsHere = add && add.parentElement === host;

  try{
    if (preferBeforeAdd && addIsHere){
      host.insertBefore(node, add);
    } else {
      host.appendChild(node);
    }
  }catch(_){
    // Absolute safety: never crash the flow
    host.appendChild(node);
  }
}

function wipeExisting(kind){
  // Remove any existing module of same kind in either main host or rail
  const all = document.querySelectorAll(`.module[data-k="${kind}"]`);
  all.forEach(el => el.remove());
}

function icon(name){ return `<i class="fa-solid ${name}"></i>`; }

/* ------------------------------------------------------------------ */
/* Public: Add menu                                                   */
/* ------------------------------------------------------------------ */
export function openAddMenu(plusBtn){
  let pop = document.getElementById('addPop');
  if (!pop){
    pop = document.createElement('div');
    pop.id = 'addPop'; pop.className = 'add-pop'; pop.setAttribute('aria-hidden','true');
    pop.innerHTML = `<div class="add-tray" id="addTray"></div>`;
    document.body.appendChild(pop);
  }
  const tray = pop.querySelector('#addTray');
  tray.innerHTML = `
    <div class="i" title="Skills"      data-k="skills">${icon('fa-layer-group')}</div>
    <div class="i" title="Education"   data-k="edu">${icon('fa-graduation-cap')}</div>
    <div class="i" title="Work"        data-k="exp">${icon('fa-briefcase')}</div>
    <div class="i" title="Profile/Bio" data-k="bio">${icon('fa-id-card-clip')}</div>
  `;

  // Position it centered above the plus
  const r = plusBtn.getBoundingClientRect();
  const tw = 36*4 + 8*3 + 20; // rough width (buttons + gaps + padding)
  const th = 36 + 20;
  tray.style.left = Math.round(r.left + r.width/2 - tw/2) + 'px';
  tray.style.top  = Math.round(r.top - th - 14) + 'px';

  pop.setAttribute('aria-hidden', 'false');

  const close = (ev)=>{
    if (!pop.contains(ev.target) || ev.target === pop) {
      pop.setAttribute('aria-hidden','true');
      document.removeEventListener('mousedown', close, true);
    }
  };
  document.addEventListener('mousedown', close, true);

  tray.querySelectorAll('.i').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.k;
      if (k === 'skills') renderSkills([{type:'star',label:'Skill',stars:3}], { toRail:false });
      if (k === 'edu')    renderEdu([{kind:'degree',title:'Title',dates:'2018–2022',academy:'Academy'}]);
      if (k === 'exp')    renderExp([{dates:'Jan 2024 – Present',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]);
      if (k === 'bio')    renderBio('Add a short summary of your profile, strengths and what you’re great at.');
      pop.setAttribute('aria-hidden','true');
    };
  });
}

/* ------------------------------------------------------------------ */
/* Renderers used by Wizard + Add menu                                */
/* ------------------------------------------------------------------ */

/* ---- Skills ------------------------------------------------------- */
export function renderSkills(items, opts={}){
  // items: [{ type:'star'|'slider', label, stars|value }]
  const toRail = !!opts.toRail && isSidebarActive() && getRailHolder();
  wipeExisting('skills');

  const box = document.createElement('div');
  box.className = 'module'; box.dataset.k = 'skills';
  box.innerHTML = `
    <div class="title"><div>Skills</div><div class="u"></div></div>
    <div class="skills-list"></div>
  `;

  const list = box.querySelector('.skills-list');

  const rowStar = (label, stars=0)=>{
    const r = document.createElement('div'); r.className = 'skill-row';
    r.innerHTML = `
      <div class="cell">
        <span class="skill-name" contenteditable="true">${label || 'Skill'}</span>
      </div>
      <div class="cell">
        <span class="stars">
          ${[1,2,3,4,5].map(i=>`<svg class="star ${i<=stars?'on':''}" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`).join('')}
        </span>
      </div>`;
    // editing affordance on hover (floating drag / delete placeholders)
    r.onmouseenter = ()=> r.classList.add('editing');
    r.onmouseleave = ()=> r.classList.remove('editing');
    return r;
  };

  const rowMeter = (label, val=60)=>{
    const r = document.createElement('div'); r.className = 'skill-row';
    r.innerHTML = `
      <div class="cell"><span class="skill-name" contenteditable="true">${label || 'Skill'}</span></div>
      <div class="cell"><input type="range" class="meter" min="0" max="100" value="${val}"></div>`;
    r.onmouseenter = ()=> r.classList.add('editing');
    r.onmouseleave = ()=> r.classList.remove('editing');
    return r;
  };

  (items||[]).forEach(it=>{
    if (it.type === 'slider') list.appendChild(rowMeter(it.label, it.value));
    else list.appendChild(rowStar(it.label, it.stars));
  });

  if (toRail){
    // Sidebar rail skills
    const rail = getRailHolder();
    rail && rail.appendChild(box);
  }else{
    safeInsertInHost(box);
  }
}

/* ---- Education ---------------------------------------------------- */
export function renderEdu(items){
  wipeExisting('edu');

  const box = document.createElement('div');
  box.className = 'module'; box.dataset.k = 'edu';
  box.innerHTML = `
    <div class="title"><div>Education</div><div class="u"></div></div>
    <div class="mod-grid-2" id="eduGrid"></div>
  `;

  const grid = box.querySelector('#eduGrid');

  const eduCard = (it)=>{
    const icon = it.kind === 'degree' ? 'fa-graduation-cap' : 'fa-scroll';
    const el = document.createElement('div');
    el.className = 'k-card';
    el.innerHTML = `
      <div class="k-chip">${icon('fa-solid '+icon)} <span contenteditable="true">${it.dates || '2018–2022'}</span></div>
      <div style="height:8px"></div>
      <div contenteditable="true" style="font-weight:800">${it.title || 'Title'}</div>
      <div contenteditable="true" style="opacity:.85">${it.academy || 'Academy'}</div>
    `;
    return el;
  };

  (items||[]).forEach(it=> grid.appendChild(eduCard(it)));
  safeInsertInHost(box);
}

/* ---- Experience --------------------------------------------------- */
export function renderExp(items){
  // items: [{dates, role, org, desc}]
  let holder = document.querySelector('.module[data-k="exp"]');
  if (!holder){
    holder = document.createElement('div');
    holder.className = 'module'; holder.dataset.k = 'exp';
    holder.innerHTML = `
      <div class="title"><div>Work experience</div><div class="u"></div></div>
      <div id="expList" style="display:grid;gap:10px"></div>
    `;
    safeInsertInHost(holder);
  }
  const list = holder.querySelector('#expList');

  const expCard = (d)=>{
    const el = document.createElement('div'); el.className = 'k-card';
    el.innerHTML = `
      <div class="k-chip">${icon('fa-solid fa-bars')} <span contenteditable="true">${d.dates || 'Jan 2024 – Present'}</span></div>
      <div style="height:8px"></div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center">
        <div style="font-weight:800" contenteditable="true">${d.role || 'Job title'}</div>
      </div>
      <div contenteditable="true" style="opacity:.9">${d.org || '@Company'}</div>
      <div contenteditable="true" style="opacity:.9">${d.desc || 'Describe impact, scale and results.'}</div>
    `;
    return el;
  };

  (items||[]).forEach(d=> list.appendChild(expCard(d)));
}

/* ---- Bio ---------------------------------------------------------- */
export function renderBio(text){
  wipeExisting('bio');
  const box = document.createElement('div');
  box.className = 'module'; box.dataset.k = 'bio';
  box.innerHTML = `
    <div class="title"><div>Profile</div><div class="u"></div></div>
    <div contenteditable="true" style="min-height:80px;line-height:1.45">${(text||'').replace(/\n/g,'<br>')}</div>
  `;
  safeInsertInHost(box);
}
