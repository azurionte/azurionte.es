// /resume/modules/modules.js
// [modules.js] v2.9.0 — tokens + sections + add popover + safe host insertion
console.log('[modules.js] v2.9.0');

import { S } from '../app/state.js';
import { ensureCanvas, isSidebarActive, getRailHolder, getSideMain } from '../layouts/layouts.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* -------------------------- styles (scoped) -------------------------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
    /* tokens (used by skills rendering) */
    :root{
      --star-gap:4px;            /* tight stars, matches single-file */
      --skill-right:120px;       /* right column width (stars/slider) */
    }

    /* sections */
    .section{position:relative; border-radius:14px; padding:12px; background:var(--secBg, #ffffff); box-shadow:0 10px 28px rgba(0,0,0,.10); border:1px solid rgba(0,0,0,.08)}
    [data-dark="1"] .section{ --secBg:#0f1420; border-color:#1f2540; box-shadow:0 10px 28px rgba(0,0,0,.35) }
    .sec-head{display:grid;justify-items:center;margin-bottom:6px}
    .sec-title{font-weight:900}
    .sec-underline{height:4px;border-radius:999px;background:linear-gradient(135deg,var(--accent2),var(--accent));width:120px;margin-top:6px}

    /* cards */
    .card{border-radius:14px;padding:10px;border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03)}
    [data-dark="1"] .card{border-color:#2a3354;background:#0c1222}
    .year-chip{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08)}
    .year-chip i{width:16px;text-align:center}

    /* theme-driven year chip tint (dark text unless too dark) */
    .year-chip{background:var(--chipBg, #fff); color:#111}
    [data-dark="1"] .year-chip{background:rgba(255,255,255,.10); color:#e8edff; border-color:#ffffff28; backdrop-filter:blur(6px)}

    /* skills list (canvas + sidebar) */
    .skills-wrap{display:grid;gap:8px}
    .skill-row{display:grid;grid-template-columns:1fr var(--skill-right,120px);align-items:center;gap:10px}
    .skill-row .name{min-width:0}
    .stars{display:inline-grid;grid-auto-flow:column;gap:var(--star-gap,4px);justify-content:end}
    .star{width:14px;height:14px;display:inline-block;transform:translateY(1px)}
    .meter{width:var(--skill-right,120px)}

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
  // use BACKTICKS (fixes the '||' parser error that happens with quotes)
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
  const host = (toRail && hostRail()) || hostMain();
  const plus = ensurePlusIn(host);
  if (plus) host.insertBefore(node, plus); else host.appendChild(node);
}

function sectionEl(key, title){
  const el = document.createElement('div');
  el.className = 'section';
  el.dataset.section = key;
  el.innerHTML = `
    <div class="sec-head">
      <div class="sec-title">${title}</div>
      <div class="sec-underline"></div>
    </div>
    <div class="sec-body"></div>`;
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
  // opts: { toRail?:boolean }
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
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
  putSection(sec, { toRail: !!opts.toRail });
}

export function renderEdu(items){
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
    grid.appendChild(card);
  });

  body.appendChild(grid);
  putSection(sec);
}

export function renderExp(items){
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
    body.appendChild(card);
  });

  putSection(sec);
}

export function renderBio(text){
  const sec = sectionEl('bio', 'Profile');
  const body = $('.sec-body', sec);
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = (text || '').trim() || 'Add a short summary of your profile, strengths and what you’re great at.';
  body.appendChild(card);
  putSection(sec);
}

/* ----------------------- PLUS MENU (icon-only) ---------------------- */
/** Opens a compact, centered, icon-only add menu above the given “+” dot. */
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
    });
  }

  // position centered above the anchor
  const r = anchor.getBoundingClientRect();
  pop.style.left = `${Math.round(r.left + (r.width/2))}px`;
  pop.style.top  = `${Math.round(r.top  - 12)}px`;
  pop.style.transform = `translate(-50%,-100%)`;
  pop.classList.add('open');
}

/* ---------------------- tint helpers (optional) --------------------- */
export function setYearChipTint(bgCss, darkText=false){
  document.documentElement.style.setProperty('--chipBg', bgCss);
  if (darkText){
    $$('.year-chip').forEach(c=> c.style.color='#111');
  }
}
