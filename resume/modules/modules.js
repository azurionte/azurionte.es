// /resume/modules/modules.js
// [modules.js] v2.9.0 — sections + add popover + safe host insertion + remember rail choice
console.log('[modules.js] v2.9.2');

import { S, save } from '../app/state.js';
import { ensureCanvas, isSidebarActive, getRailHolder, getSideMain } from '../layouts/layouts.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* -------------------------- styles (scoped) -------------------------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
  /* sections */
  .section{position:relative; border-radius:14px; padding:12px; background:var(--secBg); box-shadow:0 10px 28px rgba(0,0,0,.10); border:1px solid var(--cardBorder)}
  [data-dark="1"] .section{ --secBg:var(--card,#0f1420); border-color:var(--cardBorder,#1f2540); box-shadow:0 10px 28px rgba(0,0,0,.35) }
    .sec-head{display:grid;justify-items:center;margin-bottom:6px}
    .sec-title{font-weight:900}
    .sec-underline{height:4px;border-radius:999px;background:linear-gradient(135deg,var(--accent2),var(--accent));width:120px;margin-top:6px}

    /* cards */
  .card{border-radius:14px;padding:10px;border:1px solid var(--cardBorder);background:var(--cardBg)}
  [data-dark="1"] .card{border-color:var(--cardBorder);background:#0c1222}
    .year-chip{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08)}
    .year-chip i{width:16px;text-align:center}

    /* theme-driven year chip tint (dark text unless too dark) */
  .year-chip{background:var(--chipBg); color:var(--ink-d)}
    [data-dark="1"] .year-chip{background:rgba(255,255,255,.10); color:#e8edff; border-color:#ffffff28; backdrop-filter:blur(6px)}

    /* skills list (canvas + sidebar) */
    .skills-wrap{display:grid;gap:8px}
    .skill-row{display:grid;grid-template-columns:1fr 120px;align-items:center;gap:10px}
    .skill-row .name{min-width:0}
    .stars{display:inline-grid;grid-auto-flow:column;gap:6px;justify-content:end}
    .star{width:14px;height:14px;display:inline-block;transform:translateY(1px)}
    .meter{width:120px}

    /* add menu (icon-only, centered above the plus) */
    .add-pop{position:absolute;z-index:20050;display:none}
    .add-pop.open{display:block}
    .add-pop .bar{display:inline-flex;gap:6px;padding:6px 8px;border-radius:10px;background:#0b0f1d;border:1px solid #1f2540;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    .add-pop .bar button{width:28px;height:28px;border-radius:8px;border:1px solid #2a3354;background:#12182a;color:#e8ecff;display:grid;place-items:center}
    .add-pop .bar button:hover{transform:translateY(-1px)}
  `;
  document.head.appendChild(st);
})();

/* ----------------------------- helpers ------------------------------ */
function icon(name){
  const map = {
    skills: 'fa-layer-group',
    edu:    'fa-graduation-cap',
    exp:    'fa-briefcase',
    bio:    'fa-user-pen'
  };
  // use BACKTICKS
  return `<i class="fa-solid ${map[name] || 'fa-circle'}"></i>`;
}

// place “+” at the end of whichever host we’re using, then insert before it
function ensurePlusIn(host){
  ensureCanvas();
  const plus = $('#canvasAdd');
  if (!plus) return null;
  if (plus.parentElement !== host) host.appendChild(plus);
  return plus;
}

function hostMain(){
  // sidebar layout -> right column grid; otherwise the page stack
  return getSideMain() || ensureCanvas().stack;
}
function hostRail(){
  return getRailHolder();
}

function putSection(node, { toRail=false } = {}){
  // Prevent inserting duplicate sections (one of each type only)
  try{
    const key = node.dataset && node.dataset.section;
    if (key && document.querySelector('.section[data-section="'+key+'"]')) return;
  }catch(_){}

  const host = (toRail && hostRail()) || hostMain();
  // clear any inline width styles that may have been copied from mocks so grid can size sections
  try {
    node.style.width = '';
    node.style.maxWidth = '';
    // also clear widths on children (cards/sec inner) to avoid intrinsic sizing
    node.querySelectorAll && node.querySelectorAll('[style]').forEach(el=>{ el.style.width=''; el.style.maxWidth=''; });
  } catch(_){}

  // older code used a .node wrapper that spans the grid; recreate that structure so
  // grid rules (and styles from your previous working version) apply correctly.
  let wrapper = node;
  if (!node.classList.contains('node')){
    wrapper = document.createElement('div');
    wrapper.className = 'node';
    if (node.dataset && node.dataset.section) wrapper.dataset.section = node.dataset.section;
    wrapper.appendChild(node);
  }

  const plus = ensurePlusIn(host);
  if (plus) host.insertBefore(wrapper, plus); else host.appendChild(wrapper);
  // Refresh the plus visibility after adding a section
  try{ refreshPlusVisibility(); }catch(e){}
}

function sectionEl(key, title){
  const el = document.createElement('div');
  el.className = 'section';
  el.dataset.section = key;
  el.innerHTML = `
    <div class="sec-head">
      <div class="sec-title">${title}</div>
      <button class="sec-remove" title="Remove section" style="margin-left:8px;border-radius:8px;padding:4px 8px;">×</button>
      <div class="sec-underline"></div>
    </div>
    <div class="sec-body"></div>`;
  // wire remove handler
  el.querySelector('.sec-remove').addEventListener('click', e=>{
    const s = el.dataset.section;
    // remove from DOM (wrapper) — find closest .node and remove
    const wrapper = el.closest('.node') || el;
    wrapper.remove();
    // update persisted state if applicable
    try{
      if (s === 'skills') S.skills = [];
      if (s === 'edu') S.edu = [];
      if (s === 'exp') S.exp = [];
      if (s === 'bio') S.bio = '';
      save();
    }catch(_){}
    try{ refreshPlusVisibility(); }catch(_){}
  });
  return el;
}

function svgStar(on){
  return `
    <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6"
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`;
}

/* ---------------------------- RENDERERS ----------------------------- */
export function renderSkills(list, opts = {}){
  // remember the rail choice so a later morph can re-home correctly
  try { S.skillsInSidebar = !!opts.toRail; } catch {}

  // avoid duplicates
  if (document.querySelector('.section[data-section="skills"]')) return;

  const sec = sectionEl('skills', 'Skills');
  const body = $('.sec-body', sec);
  const wrap = document.createElement('div');
  wrap.className = 'skills-wrap';
  list.forEach(it => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="name">${it.label || 'Skill'}</div>
      <div class="val">${it.type === 'star'
        ? `<div class="stars">${[1,2,3,4,5].map(i => svgStar((it.stars||0) >= i)).join('')}</div>`
        : `<input class="meter" type="range" min="0" max="100" value="${it.value ?? 60}" disabled>`}
      </div>`;
    const remove = document.createElement('button'); remove.textContent='×'; remove.title='Remove skill';
    remove.style.cssText='margin-left:8px;border-radius:8px;padding:4px 8px;';
    remove.addEventListener('click', ()=>{
      row.remove();
      try{ S.skills = (S.skills||[]).filter(x=> x.label !== it.label); save(); }catch(_){}
      try{ refreshPlusVisibility(); }catch(_){}
    });
    row.appendChild(remove);
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
  putSection(sec, { toRail: !!opts.toRail });
}

export function renderEdu(items){
  // avoid duplicates
  if (document.querySelector('.section[data-section="edu"]')) return;
  const sec = sectionEl('edu', 'Education');
  const body = $('.sec-body', sec);
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="year-chip">${icon('edu')}<span>${it.dates || '2018–2022'}</span></div>
      <div style="height:8px"></div>
      <div style="font-weight:800">${it.title || ''}</div>
      <div>${it.academy || ''}</div>`;
    // add remove control
    const remove = document.createElement('button'); remove.textContent='×'; remove.title='Remove';
    remove.style.cssText = 'position:absolute;right:12px;top:12px;border-radius:8px;padding:4px 8px;';
    remove.addEventListener('click', ()=>{
      card.remove();
      // update S.edu to remove the corresponding item (best-effort by title)
      try{ S.edu = (S.edu||[]).filter(x=> x.title !== it.title); save(); }catch(_){}
      try{ refreshPlusVisibility(); }catch(_){}
    });
    card.style.position='relative'; card.appendChild(remove);
    grid.appendChild(card);
  });

  body.appendChild(grid);
  putSection(sec);
}

export function renderExp(items){
  // avoid duplicates
  if (document.querySelector('.section[data-section="exp"]')) return;
  const sec = sectionEl('exp', 'Work experience');
  const body = $('.sec-body', sec);

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '10px';
    card.innerHTML = `
      <div class="year-chip"><i class="fa-solid fa-bars"></i><span>${it.dates || 'Jan 2024 – Present'}</span></div>
      <div style="height:8px"></div>
      <div style="font-weight:800">${it.role || 'Job title'}</div>
      <div style="opacity:.9">@${(it.org||'Company').replace(/^@/, '')}</div>
      <div style="height:8px"></div>
      <div>${it.desc || 'Describe impact, scale and results.'}</div>`;
    const remove = document.createElement('button'); remove.textContent='×'; remove.title='Remove';
    remove.style.cssText = 'position:absolute;right:12px;top:12px;border-radius:8px;padding:4px 8px;';
    remove.addEventListener('click', ()=>{
      card.remove();
      try{ S.exp = (S.exp||[]).filter(x=> x.role !== it.role); save(); }catch(_){}
      try{ refreshPlusVisibility(); }catch(_){}
    });
    card.style.position='relative'; card.appendChild(remove);
    body.appendChild(card);
  });

  putSection(sec);
}

export function renderBio(text){
  // avoid duplicates
  if (document.querySelector('.section[data-section="bio"]')) return;
  const sec = sectionEl('bio', 'Profile');
  const body = $('.sec-body', sec);
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = (text || '').trim() || 'Add a short summary of your profile, strengths and what you’re great at.';
  body.appendChild(card);
  putSection(sec);
}

/* ----------------------- PLUS MENU (icon-only) ---------------------- */
export function openAddMenu(anchor){
  // create pop once
  let pop = $('#addPop');
  if (!pop){
    pop = document.createElement('div');
    pop.id = 'addPop';
    pop.className = 'add-pop';
    pop.innerHTML = `
      <div class="bar">
        <button data-k="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></button>
        <button data-k="edu"   title="Education"><i class="fa-solid fa-graduation-cap"></i></button>
        <button data-k="exp"   title="Experience"><i class="fa-solid fa-briefcase"></i></button>
        <button data-k="bio"   title="Profile"><i class="fa-solid fa-user-pen"></i></button>
      </div>`;
    document.body.appendChild(pop);

    // dismiss
    document.addEventListener('click', e => {
      if (!pop.classList.contains('open')) return;
      if (!pop.contains(e.target) && e.target !== anchor) pop.classList.remove('open');
    });

    // actions
    pop.addEventListener('click', e=>{
      const k = e.target.closest('button')?.dataset.k; if(!k) return;
      if (k === 'skills') renderSkills([{type:'star',label:'Skill',stars:3},{type:'slider',label:'Skill',value:60}]);
      if (k === 'edu')    renderEdu([{kind:'course',title:'Title',dates:'2018–2022',academy:'Academy'}]);
      if (k === 'exp')    renderExp([{dates:'Jan 2024 – Present',role:'Job title',org:'Company',desc:'Describe impact, scale and results.'}]);
      if (k === 'bio')    renderBio('');
      pop.classList.remove('open');
      try{ refreshPlusVisibility(); }catch(e){}
    });
  }

  // position centered above the anchor
  const r = anchor.getBoundingClientRect();
  const bar = $('.bar', pop);
  pop.style.left = `${Math.round(r.left + (r.width/2))}px`;
  pop.style.top  = `${Math.round(r.top  - 12)}px`;
  pop.style.transform = `translate(-50%,-100%)`;

  // hide buttons for sections that already exist and determine missing options
  const all = ['skills','edu','exp','bio'];
  const host = getSideMain() || ensureCanvas().stack;
  const missing = all.filter(k => !host.querySelector('.section[data-section="'+k+'"]'));
  bar.querySelectorAll('button').forEach(b=>{
    const k = b.dataset.k;
    if (!k) return;
    b.style.display = (missing.indexOf(k)===-1) ? 'none' : 'inline-block';
  });

  // if no missing options, hide the plus anchor and don't open the menu
  const plus = document.getElementById('canvasAdd') || ensureCanvas().add;
  if (missing.length===0){ if(plus) plus.style.display='none'; return; }
  if (plus) plus.style.display='flex';
  pop.classList.add('open');
}

// Refresh plus visibility: hide the canvas add button if all sections exist, show otherwise
function refreshPlusVisibility(){
  const all = ['skills','edu','exp','bio'];
  const host = getSideMain() || ensureCanvas().stack;
  const plus = document.getElementById('canvasAdd') || ensureCanvas().add;
  if (!plus) return;
  const missing = all.filter(k => !host.querySelector('.section[data-section="'+k+'"]'));
  plus.style.display = (missing.length===0) ? 'none' : 'flex';
}

// initial visibility update
try{ refreshPlusVisibility(); }catch(e){}

/* ---------------------- tint helpers (optional) --------------------- */
export function setYearChipTint(bgCss, darkText=false){
  document.documentElement.style.setProperty('--chipBg', bgCss);
  if (darkText){
    $$('.year-chip').forEach(c=> c.style.color='#111');
  }
}
