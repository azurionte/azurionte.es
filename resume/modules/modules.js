// /resume/modules/modules.js
// [modules.js] v2.6 — sections, horizontal add menu, rail-aware Skills, themed chips/cards
console.log('[modules.js] v2.6');

import { S } from '../app/state.js';
import { ensureAddAnchor, getHeaderNode, getRailHolder, getSideMain, isSidebarActive } from '../layouts/layouts.js';

/* --- styles ------------------------------------------------------------- */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style'); st.id = 'modules-style';
  st.textContent = `
    /* host & growth */
    #sheet{width:100%}
    .stack{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-content:start}
    .stack > .node, .stack > .section, .stack > .module, .stack > #canvasAdd{grid-column:1/-1;min-width:0}

    /* section basics */
    .section{position:relative;border-radius:14px;padding:12px 12px 14px;background:var(--sec-bg,#fff);box-shadow:0 8px 28px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.06);border:1px solid rgba(0,0,0,.06)}
    [data-dark="1"] .section{--sec-bg:#0e1220;border-color:#1b213a;box-shadow:0 8px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)}
    .section .title{display:grid;justify-items:center;gap:6px;margin-bottom:8px}
    .section .title h3{margin:0;font-weight:900}
    .section .title .underline{height:4px;width:120px;border-radius:999px;background:linear-gradient(135deg,var(--accent2),var(--accent))}
    .section .body{display:grid;gap:10px}

    /* add menu (horizontal, icon-only) */
    .add-pop{position:absolute;inset:auto auto calc(100% + 8px) 50%;transform:translateX(-50%);background:#0f1424;color:#e6e8ff;border:1px solid #1f2540;border-radius:12px;padding:8px 10px;display:none;z-index:12000;box-shadow:0 12px 40px rgba(0,0,0,.48)}
    .add-pop.open{display:flex}
    .add-pop .i{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;margin:0 4px;cursor:pointer;border:1px solid #1f2540;transition:transform .12s ease}
    .add-pop .i:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.35)}
    .add-pop .i i{color:#fff}

    /* cards (edu/exp) share structure */
    .card{position:relative;border-radius:16px;padding:10px;background:var(--card-bg);border:1px solid var(--card-bd);box-shadow:0 8px 24px var(--card-shadow)}
    :root{--card-bg:#ffffff;--card-bd:rgba(0,0,0,.06);--card-shadow:rgba(0,0,0,.10)}
    [data-dark="1"] :root{--card-bg:#0c1224;--card-bd:#1b2340;--card-shadow:rgba(0,0,0,.35)}
    .tint-edu{background:color-mix(in oklab, var(--card-bg) 82%, var(--accent) 18%)}
    .tint-exp{background:color-mix(in oklab, var(--card-bg) 86%, var(--accent2) 14%)}
    .card .row{display:grid;gap:6px}
    .chip-year{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;font-weight:800;line-height:1;border:1px solid #0000}
    /* year chip uses darker end of gradient; flip text if too dark */
    .chip-year{background:color-mix(in oklab, var(--accent) 78%, var(--accent2) 22%); color:#101215}
    [data-dark="1"] .chip-year{color:#fff}
    .chip-year i{opacity:.95}

    /* experience layout */
    .exp-head{display:flex;align-items:center;gap:8px}
    .exp-head .job{font-weight:800}
    .muted{opacity:.75}

    /* skills — shared section list */
    .skills-list{display:grid;gap:8px}
    .skill-row{position:relative;display:grid;grid-template-columns: 1fr auto;align-items:center;gap:10px;padding:6px 8px;border-radius:10px}
    .skill-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* stars/slider visuals */
    .stars{display:inline-grid;grid-auto-flow:column;gap:6px}
    .star{width:16px;height:16px;display:inline-block;mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>') center/contain no-repeat;background:#cbd5e1}
    .star.on{background:#f59e0b}
    .sld{appearance:none;width:120px;height:4px;border-radius:999px;background:#2a3152;outline:none}
    .sld::-webkit-slider-thumb{appearance:none;width:14px;height:14px;border-radius:999px;background:var(--accent);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}

    /* SKILLS in RAIL (sidebar) — 2/3 label, 1/3 control; tiny overlay handles that float */
    .rail .skills-list .skill-row{grid-template-columns: 2fr 1fr;background:transparent}
    .rail .stars .star{width:12px;height:12px}
    .rail .sld{width:90px}

    /* inline edit affordances (don’t affect layout) */
    .floating-handle, .floating-del{
      position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;display:grid;place-items:center;border-radius:8px;background:#0f1424;color:#e6e8ff;border:1px solid #1f2540;z-index:5
    }
    .floating-handle{left:-28px}
    .floating-del{right:-28px}
    .edit-outline{outline:2px dotted color-mix(in oklab, var(--accent) 60%, transparent); outline-offset:6px; border-radius:12px}

    /* grid helpers inside main column (skills can be 2 cols on canvas) */
    .skills-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

    /* utilities */
    .mut-btn{appearance:none;border:none;background:#0f1424;color:#e6e8ff;border:1px solid #1f2540;border-radius:10px;padding:6px 10px;cursor:pointer}
    .mut-btn:hover{filter:brightness(1.1)}
  `;
  document.head.appendChild(st);
})();

/* --- tiny helpers ------------------------------------------------------- */
function h(tag, attrs={}, children=[]){
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') el.className = v;
    else if (k==='style') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  });
  (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
    if (typeof c === 'string') el.appendChild(document.createTextNode(c)); else el.appendChild(c);
  });
  return el;
}

function host({ preferRail=false }={}){
  const rail = getRailHolder?.();
  if (preferRail && rail) { rail.classList.add('rail'); return rail; }
  return getSideMain?.() || document.getElementById('stack');
}

function sectionShell(icon, title){
  const sec = h('div', { class:'section' }, [
    h('div', { class:'title' }, [
      h('h3',{}, [h('span',{ style:{display:'inline-flex',alignItems:'center',gap:'8px'}},[
        h('i',{ class:`fa-solid ${icon}` }), ' ', title
      ])]),
      h('div',{ class:'underline'})
    ]),
    h('div',{ class:'body'})
  ]);
  return sec;
}

function ensureInHost(node, opts){ host(opts).insertBefore(node, ensureAddAnchor?.() || null); }

function chipYear(text, icon){
  return h('span', { class:'chip-year' }, [ h('i',{ class:`fa-solid ${icon}` }), text ]);
}

/* --- Add Menu (horizontal icons) --------------------------------------- */
let addMenuEl=null, addTrayEl=null;
function ensureAddMenuDom(){
  if (addMenuEl) return;
  addMenuEl = document.getElementById('addMenu') || h('div',{ id:'addMenu', class:'add-pop' });
  addTrayEl = document.getElementById('addTray') || h('div',{ id:'addTray', style:{display:'flex',alignItems:'center'}});
  if (!addMenuEl.parentElement){
    addMenuEl.appendChild(addTrayEl);
    document.body.appendChild(addMenuEl);
  }
}
export function openAddMenu(anchor){
  ensureAddMenuDom();
  addTrayEl.innerHTML = '';
  const items = [
    { k:'skills', icon:'fa-layer-group', title:'Skills' },
    { k:'edu',    icon:'fa-graduation-cap', title:'Education' },
    { k:'exp',    icon:'fa-briefcase', title:'Work' },
    { k:'bio',    icon:'fa-id-card-clip', title:'Profile' },
  ];
  items.forEach(it=>{
    const btn = h('button',{ class:'i', title:it.title, onclick:()=>{ addMenuEl.classList.remove('open'); addMenuEl.style.display='none'; addByKey(it.k); } },[
      h('i',{ class:`fa-solid ${it.icon}` })
    ]);
    addTrayEl.appendChild(btn);
  });

  const r = anchor.getBoundingClientRect();
  addMenuEl.style.left = (r.left + r.width/2) + 'px';
  addMenuEl.style.top  = (r.top - 10) + 'px';
  addMenuEl.style.display = 'flex';
  requestAnimationFrame(()=> addMenuEl.classList.add('open'));
  const off = (ev)=>{ if(!addMenuEl.contains(ev.target) && ev.target!==anchor){ addMenuEl.classList.remove('open'); addMenuEl.style.display='none'; document.removeEventListener('mousedown',off,true);} };
  document.addEventListener('mousedown',off,true);
}
function addByKey(k){
  if (k==='skills') renderSkills([{type:'star',label:'Skill',stars:3},{type:'slider',label:'Skill',value:60}], { toRail:false, twoCol:true, forceNew:true });
  if (k==='edu')    renderEdu([{kind:'degree',title:'Title',dates:'2018–2022',academy:'Academy'}]);
  if (k==='exp')    renderExp([{dates:'Jan 2024 – Present', role:'Job title', org:'@Company', desc:'Describe impact, scale and results.'}]);
  if (k==='bio')    renderBio('Add a short summary of your profile, strengths and what you’re great at.');
}

/* --- SKILLS -------------------------------------------------------------- */
export function renderSkills(items=[], opts={}){
  const { toRail=false, twoCol=false, forceNew=false } = opts;
  // Find an existing Skills section (rail or canvas), unless forcing new
  let targetHost = host({ preferRail: toRail && isSidebarActive?.() });
  const existing = !forceNew && [...targetHost.querySelectorAll('.section[data-type="skills"]')][0];

  const sec = existing || sectionShell('fa-layer-group','Skills');
  sec.dataset.type='skills';
  const body = sec.querySelector('.body'); body.innerHTML='';

  // GRID: on canvas we may show 2 columns
  if (!toRail && twoCol) body.classList.add('skills-grid-2'); else body.classList.remove('skills-grid-2');

  const list = h('div',{ class:'skills-list' });
  items.forEach(it=>{
    const row = h('div',{ class:'skill-row'},[
      h('div',{ class:'skill-label', contenteditable:'plaintext-only' }, it.label||'Skill'),
      it.type==='star'
        ? h('div', { class:'stars', 'data-kind':'star' }, Array.from({length:5}).map((_,i)=>h('span',{ class:'star'+(i<(it.stars||0)?' on':''), onclick:(e)=>{ const n=i+1; [...e.currentTarget.parentElement.children].forEach((s,j)=>s.classList.toggle('on', j<n)); } })))
        : h('input',{ class:'sld', type:'range', min:'0', max:'100', value: String(it.value ?? 60) })
    ]);

    // editing affordances (float)
    row.classList.add('edit-outline');
    const drag = h('div',{ class:'floating-handle'}, [h('i',{ class:'fa-solid fa-grip-vertical' })]);
    const del  = h('div',{ class:'floating-del', onclick:()=>row.remove() }, [h('i',{ class:'fa-solid fa-xmark' })]);
    row.appendChild(drag); row.appendChild(del);
    list.appendChild(row);
  });

  body.appendChild(list);

  // Put/keep the section in correct host
  if (!existing) ensureInHost(sec, { preferRail: toRail && isSidebarActive?.() });
  // Ensure rail class on parent if in sidebar
  if (toRail && sec.closest('[data-rail-sections]')) sec.closest('[data-rail-sections]').classList.add('rail');
}

/* --- EDUCATION ----------------------------------------------------------- */
export function renderEdu(items=[]){
  // Always add to main/canvas side
  const sec = sectionShell('fa-graduation-cap','Education'); sec.dataset.type='edu';
  const body = sec.querySelector('.body');

  const grid = h('div',{ style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}});
  items.forEach(it=>{
    const card = h('div',{ class:'card tint-edu'},[
      h('div',{ class:'row' },[
        chipYear(it.dates||'2018–2022','fa-book'),
        h('div',{ class:'muted' }, it.academy||'Academy'),
        h('div',{}, it.title||'Title')
      ])
    ]);
    grid.appendChild(card);
  });
  body.appendChild(grid);
  ensureInHost(sec);
}

/* --- EXPERIENCE ---------------------------------------------------------- */
export function renderExp(items=[]){
  const sec = sectionShell('fa-briefcase','Work experience'); sec.dataset.type='exp';
  const body = sec.querySelector('.body');

  items.forEach(it=>{
    const card = h('div',{ class:'card tint-exp'},[
      h('div',{ class:'row' },[
        h('div',{ class:'exp-head'},[
          chipYear(it.dates||'Jan 2024 – Present','fa-bars'),
          h('div',{ class:'job'}, it.role||'Job title')
        ]),
        h('div',{ class:'muted'}, it.org||'@Company'),
        h('div',{}, it.desc || 'Describe impact, scale and results.')
      ])
    ]);
    body.appendChild(card);
  });

  ensureInHost(sec);
}

/* --- BIO ----------------------------------------------------------------- */
export function renderBio(text=''){
  const sec = sectionShell('fa-id-card-clip','Profile'); sec.dataset.type='bio';
  sec.querySelector('.body').appendChild(
    h('div',{}, text || 'Add a short summary of your profile, strengths and what you’re great at.')
  );
  ensureInHost(sec);
}

/* --- make sure canvas grows & add button stays last --------------------- */
(function ensureGrowth(){
  // Make page grow with content even when sidebar is long
  const page = document.getElementById('page') || document.querySelector('.page');
  if (page) page.style.minHeight = 'auto';
  const add = ensureAddAnchor?.(); if (add) add.style.display='flex';
})();
