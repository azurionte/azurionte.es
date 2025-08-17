// v2.0 — wizard-aware seeds, full-width fixes, rail toggle, canvas growth
import { ensureCanvas, isSidebarActive, getSideMain, getRailHolder, ensureAddAnchor } from '../layouts/layouts.js';
console.log('%c[modules.js] v2.0 loaded', 'color:#22c1c3');

const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));

/* ---------- CSS: full-width + canvas growth ---------- */
(function injectModulesCSS(){
  if (document.getElementById('modules-css')) return;
  const css = `
  /* canvas uses all width and grows */
  #sheet, .page{height:auto !important; min-height:100%}
  #sheet .stack{display:grid;gap:16px;grid-auto-rows:min-content;align-content:start;padding-bottom:120px}
  #sheet .stack .node{width:100%;max-width:none}
  #sheet .stack .node > *{width:100%;max-width:100%}

  /* sidebar main column: children span full width */
  .sidebar-layout{align-items:stretch}
  .sidebar-layout .rail{align-self:stretch}
  .sidebar-layout [data-zone="main"]{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-content:start;min-height:100%}
  .sidebar-layout [data-zone="main"] > .node,
  .sidebar-layout [data-zone="main"] > .section,
  .sidebar-layout [data-zone="main"] > .module,
  .sidebar-layout [data-zone="main"] > #canvasAdd{grid-column:1/-1;width:100%;max-width:none}

  /* sections */
  .section{background:#f7f9ff;border:1px solid #ebf0ff;border-radius:14px;padding:12px;position:relative;width:100%}
  [data-dark="1"] .section{background:#0f1420;border-color:#1f2a44}
  .title-item{margin:-4px -4px 8px -4px;background:#f3f6ff;border-radius:12px;padding:10px 10px 12px;position:relative}
  .title-item .trow{display:flex;justify-content:center;align-items:center;gap:8px;font-weight:800}
  .title-item h2{margin:0;font-size:20px}
  .title-item .u{height:4px;border-radius:999px;margin:8px auto 0;background:linear-gradient(90deg,var(--accent2),var(--accent));width:160px}
  .sec-tools{position:absolute;right:8px;top:8px;display:flex;gap:6px}
  .rm,.handle{background:#0f1420;border:1px solid #1f2540;color:#e6e8ef;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
  .handle{display:inline-grid;place-items:center;width:26px;height:26px;cursor:grab;user-select:none}
  .handle::before{content:"⋮⋮";font-weight:900;line-height:1}

  /* skills */
  .grid-skills{display:grid;gap:12px;min-width:0}
  .grid-skills.cols-1{grid-template-columns:1fr;max-width:520px;margin:0 auto}
  .grid-skills.cols-2{grid-template-columns:1fr 1fr}
  .grid-skills.cols-3{grid-template-columns:1fr 1fr 1fr}
  .skill{display:grid;grid-template-columns:auto minmax(0,1fr) 160px auto;align-items:center;gap:12px;margin:6px 0;min-width:0}
  .skill > span[contenteditable]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:40px}
  .skill .stars{display:inline-flex;gap:6px;justify-content:flex-end;width:160px;margin-left:auto}
  .skill .stars .star{cursor:pointer;width:16px;height:16px;fill:#d1d5db;transition:transform .08s ease}
  .skill .stars .star.active{fill:#f59e0b}
  input[type=range]{-webkit-appearance:none;appearance:none;width:160px;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));justify-self:end;margin-left:auto}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer}
  .ctrl-mini{display:flex;justify-content:center;gap:8px;margin-top:6px}
  .ctrl-mini .mini{background:#0f1420;border:1px solid #1f2540;color:#e6e8ef;border-radius:12px;padding:6px 9px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.35)}

  /* edu */
  .edu-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}
  .edu-card{background:color-mix(in srgb, var(--accent) 12%, #fff);border:1px solid color-mix(in srgb, var(--accent) 22%, #0000);border-radius:14px;padding:12px 14px;position:relative;display:grid;gap:6px;width:100%}
  .edu-tools{position:absolute;right:8px;top:8px;display:flex;gap:6px}
  .edu-line1{display:flex;align-items:center;gap:8px;font-weight:800}
  .edu-title-icon.course{color:var(--accent2)}
  .edu-title-icon.degree{color:var(--accent)}
  .badge{display:inline-block;background:color-mix(in srgb, var(--accent) 18%, #fff);color:color-mix(in srgb, var(--accent) 70%, #000);border:1px solid color-mix(in srgb, var(--accent) 35%, #0000);padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;white-space:nowrap;max-width:96px;overflow:hidden;text-overflow:ellipsis}

  /* exp */
  .exp-list{display:grid;gap:12px;width:100%}
  .exp-card{background:color-mix(in srgb, var(--accent) 12%, #fff);border:1px solid color-mix(in srgb, var(--accent) 22%, #0000);border-radius:14px;padding:12px 14px;display:grid;gap:6px;position:relative;width:100%}
  `;
  const tag = document.createElement('style'); tag.id='modules-css'; tag.textContent=css; document.head.appendChild(tag);
})();

/* ---------- DnD ---------- */
function attachDnd(container, itemSel){
  if(!container || container._dndAttached) return;
  container._dndAttached = true;
  let dragEl=null, ph=null;

  container.addEventListener('dragstart', (e)=>{
    const it = e.target.closest(itemSel); if(!it) return;
    if(!e.target.closest('.handle')){ e.preventDefault(); return; }
    dragEl = it; e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain',''); }catch(_){}
    ph = document.createElement('div'); ph.style.height = it.offsetHeight+'px'; ph.className='drop-ph';
    setTimeout(()=>{ it.style.opacity='0.35'; },0);
  });
  container.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; ph && ph.remove(); dragEl=null; ph=null; } });
  container.addEventListener('dragover', (e)=>{
    if(!dragEl) return; e.preventDefault();
    const after = getAfter(container, e.clientY);
    if(after==null) container.appendChild(ph); else container.insertBefore(ph, after);
  });
  container.addEventListener('drop', (e)=>{
    e.preventDefault();
    if(!dragEl||!ph) return;
    container.insertBefore(dragEl, ph);
    ph.remove(); dragEl.style.opacity='';
  });
  function getAfter(cont, y){
    const els = $$(itemSel+':not(.drop-ph)', cont).filter(el => el!==dragEl);
    return els.reduce((closest,child)=>{
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if(offset<0 && offset>closest.offset) return {offset, element:child};
      return closest;
    },{offset:-Infinity}).element;
  }
}

/* ---------- where to insert ---------- */
function contentHost(){
  return isSidebarActive() ? (getSideMain() || ensureCanvas().stack) : ensureCanvas().stack;
}
function hostAndAdd(){
  const host = contentHost();
  const { add } = ensureCanvas();
  if (add && add.parentElement !== host) host.appendChild(add);
  return { host, add };
}
function insertBeforeSafe(host, node, anchor){
  if (anchor && anchor.parentElement === host) host.insertBefore(node, anchor);
  else host.appendChild(node);
}

/* ---------- Title ---------- */
function mkTitle(icon, text, onDelete, withHandle=true){
  const t = document.createElement('div');
  t.className = 'title-item';
  t.innerHTML = `<div class="trow">${icon?`<i class="fa-solid ${icon}"></i>`:''}<h2>${text}</h2></div><div class="u"></div>`;
  const tools = document.createElement('div'); tools.className = 'sec-tools';
  if(withHandle){ const h=document.createElement('button'); h.className='handle'; h.title='Drag section'; tools.appendChild(h); }
  const del=document.createElement('button'); del.className='rm'; del.type='button'; del.textContent='×'; del.title='Delete section';
  del.onclick = ()=>{ if(confirm(`Delete "${text}" section?`)){ t.parentElement?.parentElement?.remove(); ensureAddAnchor(); }};
  tools.appendChild(del); t.appendChild(tools);
  return t;
}

/* ===================== SKILLS ===================== */
function starRow(label='Skill', active=0){
  const d=document.createElement('div'); d.className='skill'; d.setAttribute('draggable','true'); d.dataset.type='star';
  d.innerHTML = `
    <span class="handle" title="Drag"></span>
    <span contenteditable>${label}</span>
    <span class="stars">${[1,2,3,4,5].map(i=>`<svg class="star" data-i="${i}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`).join('')}</span>
    <button class="rm" title="Remove" type="button">×</button>`;
  d.querySelectorAll('.star').forEach((s,ix)=>{ if(ix<active) s.classList.add('active'); s.onclick = e=>{ const n=+e.currentTarget.dataset.i; d.querySelectorAll('.star').forEach((el,i)=> el.classList.toggle('active', i<n)); }; });
  d.querySelector('.rm').onclick = (e)=>{ e.stopPropagation(); d.remove(); };
  return d;
}
function sliderRow(label='Skill', val=60){
  const d=document.createElement('div'); d.className='skill'; d.setAttribute('draggable','true'); d.dataset.type='slider';
  d.innerHTML = `
    <span class="handle" title="Drag"></span>
    <span contenteditable>${label}</span>
    <input type="range" min="0" max="100" value="${val}">
    <button class="rm" title="Remove" type="button">×</button>`;
  d.querySelector('.rm').onclick = (e)=>{ e.stopPropagation(); d.remove(); };
  return d;
}
function groupSkills(grid){
  const rows = $$('.skill', grid);
  const stars = rows.filter(r=>r.dataset.type==='star');
  const sliders = rows.filter(r=>r.dataset.type!=='star');
  rows.forEach(r=>r.remove());
  [...stars, ...sliders].forEach(r=> grid.appendChild(r));
}
function sizeSkillsGrid(grid){
  const n = grid.querySelectorAll('.skill').length;
  grid.classList.remove('cols-1','cols-2','cols-3');
  const inRail = !!grid.closest('.rail');
  const inMain = !!grid.closest('.sidebar-layout [data-zone="main"]');
  if(inRail) grid.classList.add('cols-1');
  else if(inMain) grid.classList.add(n>=2?'cols-2':'cols-1');
  else grid.classList.add(n>=3?'cols-3':n===2?'cols-2':'cols-1');
  attachDnd(grid,'.skill');
}

/** Seed may be passed from wizard; opts.toRail forces placement in rail (when available). */
export function renderSkills(seed=null, opts={}){
  // if Skills already exists, just append seeds (if any)
  let sec = $('#stack .section .grid-skills')?.closest('.section');
  const exists = !!sec;

  if (!sec){
    sec = document.createElement('div'); sec.className='section';
    sec.appendChild(mkTitle('fa-layer-group','Skills', ()=> sec.remove()));
    sec.innerHTML += `
      <div class="help">Use ★ or the slider to rate your confidence. You can add languages, tools or any ability here.</div>
      <div class="grid-skills cols-1"></div>
      <div class="ctrl-mini">
        <button class="mini" type="button" data-add-star>+ ★</button>
        <button class="mini" type="button" data-add-slider>+ <i class="fa-solid fa-sliders"></i></button>
        ${isSidebarActive()? `<button class="mini" type="button" data-move-out>Move to canvas</button>` : `<button class="mini" type="button" data-move-in>Move to sidebar</button>`}
      </div>`;
    const { host, add } = hostAndAdd();
    if ((opts.toRail && isSidebarActive()) || (!opts.toRail && isSidebarActive() && !exists)){
      const rail = getRailHolder();
      insertBeforeSafe(rail || host, sec, add);
      const h = sec.querySelector('.handle'); if (h) h.style.display='none';
    } else {
      const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
      insertBeforeSafe(host, wrap, add);
    }

    const grid = sec.querySelector('.grid-skills');
    sec.querySelector('[data-add-star]').onclick   = ()=>{ grid.appendChild(starRow()); groupSkills(grid); sizeSkillsGrid(grid); };
    sec.querySelector('[data-add-slider]').onclick = ()=>{ grid.appendChild(sliderRow()); groupSkills(grid); sizeSkillsGrid(grid); };

    const moveIn  = sec.querySelector('[data-move-in]');
    const moveOut = sec.querySelector('[data-move-out]');
    moveIn && (moveIn.onclick = ()=>{ const rail=getRailHolder(); if(!rail) return; rail.appendChild(sec); const h=sec.querySelector('.handle'); if(h) h.style.display='none'; ensureAddAnchor(); });
    moveOut && (moveOut.onclick = ()=>{ const wrap=document.createElement('div'); wrap.className='node'; wrap.appendChild(sec); const {host,add}=hostAndAdd(); insertBeforeSafe(host, wrap, add); const h=sec.querySelector('.handle'); if(h) h.style.removeProperty('display'); ensureAddAnchor(); });
  }

  if (seed && seed.length){
    const grid = sec.querySelector('.grid-skills');
    seed.forEach(it=>{
      if (it.type==='star') grid.appendChild(starRow(it.label||'Skill', it.stars||0));
      else grid.appendChild(sliderRow(it.label||'Skill', it.value||60));
    });
    groupSkills(grid); sizeSkillsGrid(grid);
  }
  ensureAddAnchor();
}

/* ===================== EDUCATION ===================== */
export function renderEdu(seed=null){
  let sec = $('#stack .edu-grid')?.closest('.section');
  if (!sec){
    sec = document.createElement('div'); sec.className='section';
    sec.appendChild(mkTitle('fa-user-graduate','Education', ()=> sec.remove()));
    sec.innerHTML += `
      <div class="edu-grid"></div>
      <div class="ctrl-mini">
        <button class="mini" type="button" data-add-course>+ Add course</button>
        <button class="mini" type="button" data-add-degree>+ Add degree</button>
      </div>`;
    const { host, add } = hostAndAdd();
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
    insertBeforeSafe(host, wrap, add);

    const grid = sec.querySelector('.edu-grid');
    const mkCard = (kind='course', data={})=>{
      const icon = kind==='degree' ? 'fa-graduation-cap degree' : 'fa-scroll course';
      const c = document.createElement('div'); c.className='edu-card'; c.setAttribute('draggable','true');
      c.innerHTML = `
        <div class="edu-tools"><span class="handle" title="Drag"></span><button class="rm" type="button">×</button></div>
        <div class="edu-line1"><i class="fa-solid ${icon} edu-title-icon"></i><span class="editable" contenteditable>${data.title||'Title'}</span></div>
        <span class="badge" contenteditable>${data.dates||'2018–2022'}</span>
        <span class="editable edu-academy" contenteditable>${data.academy||'Academy name (wraps to two lines if needed)'}</span>`;
      c.querySelector('.rm').onclick = e=>{ e.stopPropagation(); c.remove(); };
      return c;
    };
    sec.querySelector('[data-add-course]').onclick = ()=>{ grid.appendChild(mkCard('course')); attachDnd(grid,'.edu-card'); };
    sec.querySelector('[data-add-degree]').onclick = ()=>{ grid.appendChild(mkCard('degree')); attachDnd(grid,'.edu-card'); };
    attachDnd(grid,'.edu-card');
  }

  if (seed && seed.length){
    const grid = sec.querySelector('.edu-grid');
    const mk = (it)=> {
      const icon = it.kind==='degree' ? 'fa-graduation-cap degree' : 'fa-scroll course';
      const c = document.createElement('div'); c.className='edu-card'; c.setAttribute('draggable','true');
      c.innerHTML = `
        <div class="edu-tools"><span class="handle" title="Drag"></span><button class="rm" type="button">×</button></div>
        <div class="edu-line1"><i class="fa-solid ${icon} edu-title-icon"></i><span class="editable" contenteditable>${it.title||'Title'}</span></div>
        <span class="badge" contenteditable>${it.dates||'2018–2022'}</span>
        <span class="editable edu-academy" contenteditable>${it.academy||''}</span>`;
      c.querySelector('.rm').onclick = e=>{ e.stopPropagation(); c.remove(); };
      return c;
    };
    seed.forEach(it=> grid.appendChild(mk(it)));
    attachDnd(grid,'.edu-card');
  }
  ensureAddAnchor();
}

/* ===================== EXPERIENCE ===================== */
export function renderExp(seed=null){
  let sec = $('#stack .exp-list')?.closest('.section');
  if (!sec){
    sec = document.createElement('div'); sec.className='section';
    sec.appendChild(mkTitle('fa-briefcase','Work experience', ()=> sec.remove()));
    sec.innerHTML += `<div class="exp-list"></div><div class="ctrl-mini"><button class="mini" type="button" data-add-exp>+ Add role</button></div>`;
    const { host, add } = hostAndAdd();
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
    insertBeforeSafe(host, wrap, add);

    const grid = sec.querySelector('.exp-list');
    const mk = (dates='Jan 2022',role='Job title',org='@Company',desc='Describe impact, scale and results.')=>{
      const c = document.createElement('div'); c.className='exp-card'; c.setAttribute('draggable','true');
      c.innerHTML = `
        <div class="exp-tools"><span class="handle" title="Drag"></span><button class="rm" type="button">×</button></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="badge" contenteditable>${dates.slice(0,32)}</span>
          <div style="font-weight:800" contenteditable>${role}</div>
        </div>
        <div style="font-weight:700;color:#374151" contenteditable>${org}</div>
        <div contenteditable>${desc}</div>`;
      c.querySelector('.rm').onclick = e=>{ e.stopPropagation(); c.remove(); };
      return c;
    };
    sec.querySelector('[data-add-exp]').onclick = ()=>{ grid.appendChild(mk()); attachDnd(grid,'.exp-card'); };
    attachDnd(grid,'.exp-card');
  }

  if (seed && seed.length){
    const grid = sec.querySelector('.exp-list');
    seed.forEach(d=>{
      const c = document.createElement('div'); c.className='exp-card'; c.setAttribute('draggable','true');
      c.innerHTML = `
        <div class="exp-tools"><span class="handle" title="Drag"></span><button class="rm" type="button">×</button></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="badge" contenteditable>${(d.dates||'').slice(0,32)}</span>
          <div style="font-weight:800" contenteditable>${d.role||'Job title'}</div>
        </div>
        <div style="font-weight:700;color:#374151" contenteditable>${d.org||'@Company'}</div>
        <div contenteditable>${d.desc||''}</div>`;
      c.querySelector('.rm').onclick = e=>{ e.stopPropagation(); c.remove(); };
      grid.appendChild(c);
    });
    attachDnd(grid,'.exp-card');
  }
  ensureAddAnchor();
}

/* ===================== BIO ===================== */
export function renderBio(text=''){
  if ($('#stack [data-bio]')) { ensureAddAnchor(); return; }
  const wrap = document.createElement('div'); wrap.className='node';
  const sec = document.createElement('div'); sec.className='section'; sec.setAttribute('data-bio','1');
  sec.appendChild(mkTitle('fa-user','Profile', ()=> wrap.remove()));
  const body = document.createElement('div'); body.contentEditable='true'; body.textContent = text || 'Add a short summary of your profile, strengths and what you’re looking for.';
  sec.appendChild(body); wrap.appendChild(sec);
  contentHost().insertBefore(wrap, ensureCanvas().add);
  ensureAddAnchor();
}

/* ---------- + menu ---------- */
export function openAddMenu(anchorBtn){
  const { add } = ensureCanvas();
  const menu = $('#addMenu'); const tray = $('#addTray'); if(!menu || !tray) return;
  tray.innerHTML = '';
  const already = { skills: !!$('.grid-skills'), edu: !!$('.edu-grid'), exp: !!$('.exp-list'), bio: !!('[data-bio]') };
  const addSq = (k, icon, title) => { if(already[k]) return; const b=document.createElement('div'); b.className='sq'; b.dataset.add=k; b.title=title; b.innerHTML = `<i class="fa-solid ${icon}"></i>`; tray.appendChild(b); };
  addSq('skills','fa-layer-group','Skills'); addSq('edu','fa-user-graduate','Education'); addSq('exp','fa-briefcase','Experience'); addSq('bio','fa-user','Bio');
  if(!tray.children.length){ add && (add.style.display='none'); return; }
  const r = anchorBtn.getBoundingClientRect(); menu.style.left = (r.left + window.scrollX) + 'px'; menu.style.top  = (r.top + window.scrollY - (menu.offsetHeight||120) - 12) + 'px'; menu.classList.add('open');
  const close = (ev)=>{ if(!menu.contains(ev.target) && ev.target!==anchorBtn){ menu.classList.remove('open'); document.removeEventListener('click', close); } };
  setTimeout(()=> document.addEventListener('click', close), 0);
  tray.onclick = (e)=>{ const k = e.target.closest('.sq')?.dataset.add; if(!k) return; menu.classList.remove('open'); if(k==='skills') renderSkills(); if(k==='edu') renderEdu(); if(k==='exp') renderExp(); if(k==='bio') renderBio(); ensureAddAnchor(); };
}
