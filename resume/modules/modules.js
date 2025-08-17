// /resume/modules/modules.js
// [modules.js] v2.8.1 — stable host targeting, horizontal add menu, safe renders
console.log('[modules.js] v2.8.1');

import { S } from '../app/state.js';

/* ------------------------------ styles ------------------------------ */
(function ensureStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
  /* section shell */
  .section{position:relative;border-radius:14px;border:1px solid var(--card-bor,#ececec22);background:var(--card-bg,#0b0f1c);padding:12px 12px;box-shadow:0 18px 44px rgba(0,0,0,.14)}
  .section[data-skin="paper"]{--card-bg:#fff;--card-bor:#00000014}
  .section[data-skin="glass"]{backdrop-filter:blur(8px);--card-bg:rgba(255,255,255,.10);--card-bor:#ffffff28}
  .section .head{display:grid;justify-items:center;gap:6px;margin-bottom:8px}
  .section .head .title{font-weight:900}
  .section .underline{height:4px;width:120px;border-radius:999px;background:linear-gradient(135deg,var(--accent2),var(--accent))}
  .pill-year{display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;font-weight:800}
  .pill-year i{opacity:.9}
  /* skills in sidebar */
  [data-rail-sections] .skills-row{display:grid;grid-template-columns:2fr 1fr;gap:10px;align-items:center}
  [data-rail-sections] .skills-row .meter{height:6px;border-radius:999px;background:rgba(0,0,0,.15);position:relative}
  [data-rail-sections] .skills-row .meter > span{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent))}
  /* stars */
  .stars{display:inline-flex;gap:6px}
  .stars .star{width:14px;height:14px;fill:#d1d5db}
  .stars .star.on{fill:#f59e0b}
  /* edu/exp cards in main */
  .edu-card,.exp-card{border:1px solid var(--card-bor,#ececec22);border-radius:14px;padding:10px;display:grid;gap:6px}
  .edu-card .line,.exp-card .line{height:6px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));width:120px;margin:4px 0}
  .edu-card .year,.exp-card .year{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:var(--chip,#111);color:var(--chipText,#fff);font-weight:900;box-shadow:inset 0 0 0 2px #00000022}
  /* add menu */
  .add-pop{position:absolute;inset:auto auto auto auto;z-index:30000;transform:translate(-50%,-10px)}
  .add-pop .bar{display:inline-flex;gap:10px;background:#0b0f1c;border:1px solid #1f2540;border-radius:999px;padding:8px 10px;box-shadow:0 18px 44px rgba(0,0,0,.4)}
  .add-pop .bar button{width:30px;height:30px;border-radius:8px;border:1px solid #2b324b;background:#0e1426;color:#eaf1ff;display:grid;place-items:center}
  `;
  document.head.appendChild(st);
})();

/* ------------------------------ helpers ------------------------------ */
function isSidebarLayout(){
  const head = document.querySelector('[data-header]');
  return (S.layout === 'side') || !!head?.closest('.sidebar-layout');
}
function railHolder(){
  return document.querySelector('[data-header] [data-rail-sections]') || null;
}
function mainHost(){
  return document.querySelector('[data-header] [data-zone="main"]') || document.getElementById('stack');
}
function addWrap(){ return document.getElementById('canvasAdd'); }

/** Ensure we target the right host and keep the + button at the end. */
function ensureInHost(targetHost){
  const host = targetHost || mainHost();
  const plus = addWrap();
  if (!host) return { host: null, before: null };

  // Make sure the + lives in that host
  if (plus && plus.parentElement !== host) host.appendChild(plus);

  // We will try to insert before the plus; if it's not a child, just append
  const before = (plus && plus.parentElement === host) ? plus : null;
  return { host, before };
}

function sectionShell(title){
  const el = document.createElement('div');
  el.className = 'section';
  el.dataset.skin = S.mat || 'paper';
  el.innerHTML = `
    <div class="head">
      <div class="title">${title}</div>
      <div class="underline"></div>
    </div>`;
  return el;
}

function svgStar(on=false){
  return `<svg class="star ${on?'on':''}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>`;
}
function icon(name){
  const map = {
    skills: 'fa-layer-group',
    edu: 'fa-graduation-cap',
    exp: 'fa-briefcase',
    bio: 'fa-user-pen'
  };
  return `<i class="fa-solid ${map[name]||'fa-circle'}"></i>`;
}

/* ------------------------------ Add Menu ------------------------------ */
export function openAddMenu(anchor){
  // remove any open menu
  document.querySelectorAll('.add-pop').forEach(x=>x.remove());
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'add-pop';
  pop.style.left = (r.left + r.width/2) + 'px';
  pop.style.top  = (r.top) + 'px';
  pop.innerHTML = `
    <div class="bar">
      <button title="Skills" data-k="skills">${icon('skills')}</button>
      <button title="Education" data-k="edu">${icon('edu')}</button>
      <button title="Experience" data-k="exp">${icon('exp')}</button>
      <button title="Bio" data-k="bio">${icon('bio')}</button>
    </div>`;
  document.body.appendChild(pop);

  pop.querySelectorAll('button').forEach(b=>{
    b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'skills') renderSkills([{type:'slider',label:'Skill',value:65}], { toRail:true });
      if (k === 'edu')    renderEdu([{kind:'degree',title:'',dates:'2018–2022',academy:''}]);
      if (k === 'exp')    renderExp([{dates:'Jan 2024 – Present',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]);
      if (k === 'bio')    renderBio('Add a short summary of your profile, strengths and what you\'re great at.');
      pop.remove();
    };
  });

  // click-away
  const away = (e)=>{ if(!pop.contains(e.target) && e.target!==anchor){ pop.remove(); document.removeEventListener('mousedown',away); } };
  document.addEventListener('mousedown', away);
}

/* ------------------------------ Renders ------------------------------ */
export function renderSkills(items, opts={}){
  const toRail = !!opts.toRail && isSidebarLayout() && railHolder();
  const { host } = ensureInHost(toRail ? railHolder() : mainHost());
  if (!host) return;

  // section
  const sec = sectionShell('Skills');
  sec.dataset.mod = 'skills';

  const body = document.createElement('div');
  body.style.display = 'grid';
  body.style.gap = '10px';

  items.forEach(it=>{
    const row = document.createElement('div');
    if (toRail){
      row.className = 'skills-row';
      row.innerHTML = `
        <div class="label" contenteditable>${it.label || 'Skill'}</div>
        <div class="meter"><span style="width:${(it.value ?? it.stars*20 || 60)}%"></span></div>`;
    } else {
      // main body version (one column; keep simple)
      row.style.display = 'grid'; row.style.gridTemplateColumns='1fr auto'; row.style.alignItems='center'; row.style.gap='10px';
      row.innerHTML = `
        <div class="label" contenteditable>${it.label || 'Skill'}</div>
        <div class="stars">
          ${[1,2,3,4,5].map(i=> svgStar((it.stars||0) >= i)).join('')}
        </div>`;
    }
    body.appendChild(row);
  });

  sec.appendChild(body);
  const { before } = ensureInHost(toRail ? railHolder() : mainHost());
  const plus = addWrap();
  if (before) host.insertBefore(sec, before); else host.appendChild(sec);
  if (plus) plus.style.display = 'flex';
}

export function renderEdu(items){
  const { host } = ensureInHost(mainHost());
  if (!host) return;
  const sec = sectionShell('Education'); sec.dataset.mod='edu';

  const wrap = document.createElement('div');
  wrap.style.display='grid';
  wrap.style.gridTemplateColumns='1fr 1fr';
  wrap.style.gap='10px';

  items.forEach(it=>{
    const card = document.createElement('div');
    card.className='edu-card';
    const chipBg = getComputedStyle(document.documentElement).getPropertyValue('--accent2') || '#6c63ff';
    card.style.setProperty('--chip', chipBg.trim());
    card.style.setProperty('--chipText', '#fff');
    card.innerHTML = `
      <div class="year">${icon('edu')}<span>${it.dates || '2018–2022'}</span></div>
      <div contenteditable class="t" placeholder="Title">${it.title||''}</div>
      <div class="line"></div>
      <div contenteditable class="a" placeholder="Academy">${it.academy||''}</div>`;
    wrap.appendChild(card);
  });

  sec.appendChild(wrap);
  const { before } = ensureInHost(mainHost());
  const plus = addWrap();
  if (before) host.insertBefore(sec, before); else host.appendChild(sec);
  if (plus) plus.style.display = 'flex';
}

export function renderExp(items){
  const { host } = ensureInHost(mainHost());
  if (!host) return;
  const sec = sectionShell('Work experience'); sec.dataset.mod='exp';

  const wrap = document.createElement('div');
  wrap.style.display='grid';
  wrap.style.gap='12px';

  items.forEach(it=>{
    const card = document.createElement('div');
    card.className='exp-card';
    const chipBg = getComputedStyle(document.documentElement).getPropertyValue('--accent2') || '#6c63ff';
    card.style.setProperty('--chip', chipBg.trim());
    card.style.setProperty('--chipText', '#fff');
    card.innerHTML = `
      <div class="year"><i class="fa-solid fa-bars-staggered"></i><span>${it.dates || 'Jan 2024 – Present'}</span></div>
      <div class="line"></div>
      <div contenteditable class="role">${it.role || 'Job title'}</div>
      <div contenteditable class="org">${it.org || '@Company'}</div>
      <div contenteditable class="desc">${it.desc || 'Describe impact, scale and results.'}</div>`;
    wrap.appendChild(card);
  });

  sec.appendChild(wrap);
  const { before } = ensureInHost(mainHost());
  const plus = addWrap();
  if (before) host.insertBefore(sec, before); else host.appendChild(sec);
  if (plus) plus.style.display = 'flex';
}

export function renderBio(text=''){
  const { host } = ensureInHost(mainHost());
  if (!host) return;
  const sec = sectionShell('Profile'); sec.dataset.mod='bio';

  const p = document.createElement('div');
  p.setAttribute('contenteditable','true');
  p.textContent = text || 'Add a short summary of your profile, strengths and what you’re great at.';
  sec.appendChild(p);

  const { before } = ensureInHost(mainHost());
  const plus = addWrap();
  if (before) host.insertBefore(sec, before); else host.appendChild(sec);
  if (plus) plus.style.display = 'flex';
}
