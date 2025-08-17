// /resume/modules/modules.js
// [modules.js] v2.7.1 — safe insert, horizontal add menu, themed cards
console.log('[modules.js] v2.7.1');

import { S } from '../app/state.js';
import {
  ensureCanvas,
  getHeaderNode,
  getRailHolder,
  getSideMain,
  restyleContactChips,
} from '../layouts/layouts.js';

/* ------------------------------------------------------------- */
/* Styles injected once                                           */
/* ------------------------------------------------------------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
    /* ---- section shell ---- */
    .section{
      border-radius:14px;
      background:var(--sec-bg, #0f1420);
      border:1px solid var(--sec-bd, #1f2540);
      color:var(--sec-fg, #e6e8ef);
      padding:12px;
      box-shadow:0 14px 36px rgba(0,0,0,.18);
      max-width:100%;
    }
    .section .sec-title{
      display:grid;place-items:center;
      font-weight:900;font-size:18px;margin:2px 0 10px;
      position:relative;
    }
    .section .sec-title .u{
      width:120px;height:4px;border-radius:999px;margin-top:8px;
      background:linear-gradient(135deg, var(--accent2,#8b5cf6), var(--accent,#d946ef));
    }

    /* ---- Skills (compact, won’t overflow rail) ---- */
    .skills{ --row-h:34px }
    .skills .row{
      display:grid; grid-template-columns: 1fr 110px; align-items:center;
      gap:10px; height:var(--row-h); margin:6px 0;
    }
    .skills .label{
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      padding:6px 10px; border-radius:10px;
      background:var(--chip-bg, #0c1328); border:1px solid #1f2540;
    }
    .skills .stars{ display:inline-flex; gap:6px; justify-content:flex-end }
    .skills .star{ width:14px; height:14px; display:inline-block; opacity:.85 }
    .skills .star svg{ width:100%; height:100% }
    .skills .meter{ height:4px; border-radius:999px; background:#273150; position:relative }
    .skills .meter::after{ content:""; position:absolute; left:0; top:0; bottom:0; width:var(--val,60%); border-radius:999px;
      background:linear-gradient(135deg, var(--accent2), var(--accent));
    }

    /* ---- Edu cards 2-up grid ---- */
    .edu .grid{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px }
    .edu .card{
      border-radius:12px; padding:10px;
      background:var(--card-bg); border:1px solid var(--card-bd);
    }
    .edu .year{
      display:inline-grid; grid-auto-flow:column; gap:8px; align-items:center;
      font-weight:800; padding:4px 12px; border-radius:999px; margin-bottom:8px;
      background:var(--year-bg); color:var(--year-fg);
    }
    .edu .t{ font-weight:700; margin-bottom:4px }
    .edu .a{ opacity:.9 }

    /* ---- Experience ---- */
    .exp .card{
      border-radius:12px; padding:12px; margin:10px 0;
      background:var(--card-bg); border:1px solid var(--card-bd);
    }
    .exp .tag{
      display:inline-grid; grid-auto-flow:column; gap:8px; align-items:center;
      font-weight:800; padding:4px 12px; border-radius:999px; margin-bottom:8px;
      background:var(--year-bg); color:var(--year-fg);
    }
    .exp .role{ font-weight:800; }
    .exp .org{ opacity:.9 }
    .exp .desc{ margin-top:6px }

    /* ---- Bio ---- */
    .bio .box{
      border-radius:12px; padding:12px;
      background:var(--card-bg); border:1px solid var(--card-bd);
    }

    /* ---- Horizontal Add menu ---- */
    .add-pop{ position:fixed; inset:auto auto 0 0; z-index:40000; display:none }
    .add-pop .tray{
      display:inline-flex; gap:10px; align-items:center; justify-content:center;
      padding:8px 10px; border-radius:12px; background:#0b0f1d; border:1px solid #1b2240;
      box-shadow:0 30px 120px rgba(0,0,0,.55);
    }
    .add-pop .btn{
      width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
      background:#0f1426; border:1px solid #20294b; color:#f1f4ff; cursor:pointer;
    }
    .add-pop .btn:hover{ transform:translateY(-1px); box-shadow:0 8px 24px rgba(0,0,0,.35) }
  `;
  document.head.appendChild(st);
})();

/* ------------------------------------------------------------- */
/* Utilities                                                      */
/* ------------------------------------------------------------- */

function icon(kind){
  // maps simple keys to FA classes (solid)
  const map = {
    skills: 'fa-layer-group',
    edu:    'fa-graduation-cap',
    course: 'fa-scroll',
    exp:    'fa-briefcase',
    bio:    'fa-user-pen',
    cal:    'fa-calendar',
    dot:    'fa-circle',
  };
  const i = document.createElement('i');
  i.className = `fa-solid ${map[kind]||'fa-circle'}`;
  return i;
}

function themeSwatch(){
  // decide tinted card colors from theme + dark
  const dark = !!S.dark;
  const base = getComputedStyle(document.documentElement);
  const a1 = base.getPropertyValue('--accent2') || '#8b5cf6';
  const a2 = base.getPropertyValue('--accent')  || '#d946ef';
  // card bg from paper/glass + dark
  const cardBg = (S.mat==='glass')
    ? 'rgba(255,255,255,.08)'
    : dark ? '#0d1324' : '#fff';
  const cardBd = (S.mat==='glass')
    ? '#ffffff28'
    : dark ? '#1c2544' : 'rgba(0,0,0,.08)';
  // year chip: take dark side of gradient; compute fg for contrast
  const yearBg = `linear-gradient(135deg, ${a2.trim()}, ${a1.trim()})`;
  const yearFg = dark ? '#111' : '#111';
  return { cardBg, cardBd, yearBg, yearFg };
}

function sectionTitle(text){
  const w = document.createElement('div');
  w.className = 'sec-title';
  w.innerHTML = `<div>${text}</div><div class="u"></div>`;
  return w;
}

/** Find the correct host and safely insert before the "+" if present */
function ensureInHost(hostHint){
  ensureCanvas();
  const stack = document.getElementById('stack');
  const add   = document.getElementById('canvasAdd');
  const main  = getSideMain();      // right column when sidebar layout; else stack
  const rail  = getRailHolder();    // null unless sidebar layout

  let host = stack;
  if (hostHint === 'rail' && rail) host = rail;
  else if (hostHint === 'main' && main) host = main;
  else if (S.layout === 'side' && main) host = main;

  return {
    host,
    insert(node){
      // If "+" lives in this host, insert before it; else append safely.
      if (add && add.parentElement === host){
        host.insertBefore(node, add);
      } else {
        host.appendChild(node);
      }
    }
  };
}

/* ------------------------------------------------------------- */
/* RENDERERS                                                      */
/* ------------------------------------------------------------- */

/** SKILLS
 *  items: [{type:'star'|'slider', label, stars|value}]
 *  opts:  { toRail?: boolean }
 */
export function renderSkills(items=[], opts={}){
  const { host, insert } = ensureInHost(opts?.toRail ? 'rail' : 'main');
  const sec = document.createElement('div');
  sec.className = 'section skills';
  sec.style.setProperty('--sec-bg',  S.dark ? '#0f1420' : '#ffffff');
  sec.style.setProperty('--sec-bd',  S.dark ? '#1f2540' : 'rgba(0,0,0,.08)');
  sec.appendChild(sectionTitle('Skills'));

  const wrap = document.createElement('div');
  items.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'row';
    const lab = document.createElement('div');
    lab.className = 'label'; lab.textContent = it.label || 'Skill';

    const meterWrap = document.createElement('div');
    if(it.type==='star'){
      meterWrap.className = 'stars';
      for(let i=0;i<5;i++){
        const s = document.createElement('span'); s.className = 'star';
        s.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${i < (it.stars||0) ? 'var(--accent)' : '#5a668b'}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
        meterWrap.appendChild(s);
      }
    }else{
      meterWrap.className = 'meter';
      const v = Math.max(0, Math.min(100, Number(it.value||0)));
      meterWrap.style.setProperty('--val', `${v}%`);
    }
    row.appendChild(lab); row.appendChild(meterWrap);
    wrap.appendChild(row);
  });
  sec.appendChild(wrap);

  insert(sec);
  return sec;
}

/** EDUCATION
 *  items: [{kind:'course'|'degree', title, dates, academy}]
 */
export function renderEdu(items=[]){
  const { host, insert } = ensureInHost('main');
  const tint = themeSwatch();

  const sec = document.createElement('div');
  sec.className = 'section edu';
  sec.style.setProperty('--sec-bg',  S.dark ? '#0f1420' : '#ffffff');
  sec.style.setProperty('--sec-bd',  S.dark ? '#1f2540' : 'rgba(0,0,0,.08)');
  sec.appendChild(sectionTitle('Education'));

  const grid = document.createElement('div'); grid.className = 'grid';
  items.forEach(it=>{
    const card = document.createElement('div'); card.className='card';
    card.style.setProperty('--card-bg', tint.cardBg);
    card.style.setProperty('--card-bd', tint.cardBd);
    const year = document.createElement('div'); year.className='year';
    year.style.setProperty('--year-bg', tint.yearBg);
    year.style.background = tint.yearBg;
    year.style.color = tint.yearFg;
    year.appendChild(icon(it.kind==='degree'?'edu':'course'));
    year.insertAdjacentText('beforeend', it.dates || '—');
    const t = document.createElement('div'); t.className='t'; t.textContent = it.title || '';
    const a = document.createElement('div'); a.className='a'; a.textContent = it.academy || '';
    card.appendChild(year); card.appendChild(t); card.appendChild(a);
    grid.appendChild(card);
  });
  sec.appendChild(grid);

  insert(sec);
  return sec;
}

/** EXPERIENCE
 *  items: [{dates, role, org, desc}]
 */
export function renderExp(items=[]){
  const { host, insert } = ensureInHost('main');
  const tint = themeSwatch();

  const sec = document.createElement('div');
  sec.className = 'section exp';
  sec.style.setProperty('--sec-bg',  S.dark ? '#0f1420' : '#ffffff');
  sec.style.setProperty('--sec-bd',  S.dark ? '#1f2540' : 'rgba(0,0,0,.08)');
  sec.appendChild(sectionTitle('Work experience'));

  items.forEach(it=>{
    const c = document.createElement('div'); c.className='card';
    c.style.setProperty('--card-bg', tint.cardBg);
    c.style.setProperty('--card-bd', tint.cardBd);
    const tag = document.createElement('div'); tag.className='tag';
    tag.style.background = tint.yearBg; tag.style.color = tint.yearFg;
    tag.appendChild(icon('cal')); tag.insertAdjacentText('beforeend', it.dates || '—');
    const r = document.createElement('div'); r.className='role'; r.textContent = it.role || 'Job title';
    const o = document.createElement('div'); o.className='org'; o.textContent  = (it.org||'').trim();
    const d = document.createElement('div'); d.className='desc'; d.textContent = (it.desc||'').trim();
    c.appendChild(tag); c.appendChild(r); if(o.textContent) c.appendChild(o); if(d.textContent) c.appendChild(d);
    sec.appendChild(c);
  });

  insert(sec);
  return sec;
}

/** BIO
 *  text: string
 */
export function renderBio(text=''){
  const { host, insert } = ensureInHost('main');
  const tint = themeSwatch();

  const sec = document.createElement('div');
  sec.className = 'section bio';
  sec.style.setProperty('--sec-bg',  S.dark ? '#0f1420' : '#ffffff');
  sec.style.setProperty('--sec-bd',  S.dark ? '#1f2540' : 'rgba(0,0,0,.08)');
  sec.appendChild(sectionTitle('Profile'));

  const box = document.createElement('div'); box.className='box';
  box.style.setProperty('--card-bg', tint.cardBg);
  box.style.setProperty('--card-bd', tint.cardBd);
  box.textContent = text || 'Add a short summary of your profile, strengths and what you’re great at.';
  sec.appendChild(box);

  insert(sec);
  return sec;
}

/* ------------------------------------------------------------- */
/* HORIZONTAL ADD MENUS                                          */
/* ------------------------------------------------------------- */

/** Horizontal + menu used by editor’s big plus button */
export function openAddMenu(anchor){
  ensureCanvas();
  let pop = document.getElementById('addPop');
  if (!pop){
    pop = document.createElement('div'); pop.id = 'addPop'; pop.className='add-pop';
    pop.innerHTML = `<div class="tray"></div>`;
    document.body.appendChild(pop);
  }
  const tray = pop.querySelector('.tray'); tray.innerHTML = '';

  const btn = (k, title, on)=> {
    const b = document.createElement('button'); b.className='btn'; b.title = title;
    b.appendChild(icon(k)); b.onclick = ()=>{ on(); hide(); };
    tray.appendChild(b);
  };

  btn('skills','Skills', ()=> renderSkills([
    {type:'star', label:'Skill', stars:3},
    {type:'slider', label:'Skill', value:60},
  ]));
  btn('edu','Education', ()=> renderEdu([{kind:'degree', title:'', dates:'2018–2022', academy:''}]));
  btn('exp','Experience', ()=> renderExp([{dates:'Jan 2024 – Present', role:'Job title', org:'@Company', desc:'Describe impact, scale and results.'}]));
  btn('bio','Profile', ()=> renderBio(''));

  // position centered above anchor
  const r = anchor.getBoundingClientRect();
  const y = r.top - 52; const x = r.left + r.width/2;
  pop.style.display='block';
  const w = tray.getBoundingClientRect().width;
  pop.style.transform = `translate(${Math.round(x - w/2)}px, ${Math.round(y)}px)`;

  function hide(){ pop.style.display='none'; }
  setTimeout(()=> document.addEventListener('click', onDoc, { once:true }));
  function onDoc(e){ if(!pop.contains(e.target) && e.target!==anchor) hide(); }
}

/** Optional: horizontal menu for rail “Add” (contact chips).
 *  Exported for future use. Not wired here to keep file focused. */
export function openChipMenu(anchor, handlers){
  ensureCanvas();
  let pop = document.getElementById('chipPop');
  if (!pop){
    pop = document.createElement('div'); pop.id='chipPop'; pop.className='add-pop';
    pop.innerHTML = `<div class="tray"></div>`;
    document.body.appendChild(pop);
  }
  const tray = pop.querySelector('.tray'); tray.innerHTML = '';
  const addBtn = (ic, title, cb)=>{ const b=document.createElement('button'); b.className='btn'; b.title=title; b.appendChild(icon(ic)); b.onclick=()=>{ cb?.(); hide(); }; tray.appendChild(b); };
  addBtn('dot','Phone', handlers?.phone);
  addBtn('dot','Email', handlers?.email);
  addBtn('dot','Address', handlers?.address);
  addBtn('dot','LinkedIn', handlers?.linkedin);

  const r = anchor.getBoundingClientRect();
  const y = r.top - 52; const x = r.left + r.width/2;
  pop.style.display='block';
  const w = tray.getBoundingClientRect().width;
  pop.style.transform = `translate(${Math.round(x - w/2)}px, ${Math.round(y)}px)`;
  function hide(){ pop.style.display='none'; }
  setTimeout(()=> document.addEventListener('click', onDoc, { once:true }));
  function onDoc(e){ if(!pop.contains(e.target) && e.target!==anchor) hide(); }
}
