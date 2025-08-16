// /resume/modules/modules.js
// v1.6 — sidebar main-column width fix: insert sections before the + inside [data-zone="main"], no .node wrapper
import { ensureCanvas, isSidebarActive, getSideMain, getRailHolder, ensureAddAnchor } from '../layouts/layouts.js';

console.log('%c[modules.js] v1.6 loaded', 'color:#22c1c3');

const $ = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));

/* ------------ styles (unchanged except width:100% already present) ------------ */
(function injectModulesCSS(){
  if (document.getElementById('modules-css')) return;
  const css = `
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
  .edu-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}
  .edu-card{background:color-mix(in srgb, var(--accent) 12%, #fff);border:1px solid color-mix(in srgb, var(--accent) 22%, #0000);border-radius:14px;padding:12px 14px;position:relative;display:grid;gap:6px;width:100%}
  .edu-tools{position:absolute;right:8px;top:8px;display:flex;gap:6px}
  .edu-line1{display:flex;align-items:center;gap:8px;font-weight:800}
  .edu-title-icon.course{color:var(--accent2)}
  .edu-title-icon.degree{color:var(--accent)}
  .badge{display:inline-block;background:color-mix(in srgb, var(--accent) 18%, #fff);color:color-mix(in srgb, var(--accent) 70%, #000);border:1px solid color-mix(in srgb, var(--accent) 35%, #0000);padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;white-space:nowrap;max-width:96px;overflow:hidden;text-overflow:ellipsis}
  .exp-list{display:grid;gap:12px;width:100%}
  .exp-card{background:color-mix(in srgb, var(--accent) 12%, #fff);border:1px solid color-mix(in srgb, var(--accent) 22%, #0000);border-radius:14px;padding:12px 14px;display:grid;gap:6px;position:relative;width:100%}
  `;
  const tag = document.createElement('style');
  tag.id = 'modules-css';
  tag.textContent = css;
  document.head.appendChild(tag);
})();

/* ------------ DnD (unchanged) ------------ */
function attachDnd(container, itemSel){ /* … unchanged from your v1.5 … */ }

/* ------------ host helpers ------------ */
function contentHost(){
  return isSidebarActive() ? (getSideMain() || ensureCanvas().stack) : ensureCanvas().stack;
}
/* Ensure the + is inside the same host before we insert anything */
function hostAndAdd() {
  const host = contentHost();
  const { add: addWrap } = ensureCanvas();
  if (addWrap && addWrap.parentElement !== host) host.appendChild(addWrap);
  return { host, addWrap };
}

/* ------------ title helper ------------ */
function mkTitle(icon, text, onDelete, withHandle=true){ /* … unchanged … */ }

/* ------------ SKILLS (unchanged behaviour) ------------ */
export function renderSkills(){ /* … identical to your v1.5 … */ }

/* ------------ EDUCATION ------------ */
export function renderEdu(){
  if ($('#stack .edu-grid') && !isSidebarActive()) { ensureAddAnchor(); return; }

  const sec = document.createElement('div'); sec.className='section';
  sec.appendChild(mkTitle('fa-user-graduate','Education', ()=> sec.remove()));
  sec.innerHTML += `
    <div class="edu-grid"></div>
    <div class="ctrl-mini">
      <button class="mini" type="button" data-add-course>+ Add course</button>
      <button class="mini" type="button" data-add-degree>+ Add degree</button>
    </div>`;

  const { host, addWrap } = hostAndAdd();

  if (isSidebarActive()){
    // insert section directly before the "+" inside the sidebar main column
    host.insertBefore(sec, addWrap);
    // hide drag handle in sidebar
    const h = sec.querySelector('.handle'); if (h) h.style.display = 'none';
  } else {
    // canvas mode uses the .node wrapper
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
    host.insertBefore(wrap, addWrap);
  }

  const grid = sec.querySelector('.edu-grid');
  const mkCard = (kind='course')=>{
    const icon = kind==='degree' ? 'fa-graduation-cap degree' : 'fa-scroll course';
    const c = document.createElement('div'); c.className='edu-card'; c.setAttribute('draggable','true');
    c.innerHTML = `
      <div class="edu-tools"><span class="handle" title="Drag"></span><button class="rm" type="button">×</button></div>
      <div class="edu-line1"><i class="fa-solid ${icon} edu-title-icon"></i><span class="editable" contenteditable>Title</span></div>
      <span class="badge" contenteditable>2018–2022</span>
      <span class="editable edu-academy" contenteditable>Academy name (wraps to two lines if needed)</span>`;
    c.querySelector('.rm').onclick = e=>{ e.stopPropagation(); c.remove(); };
    return c;
  };
  sec.querySelector('[data-add-course]').onclick = ()=>{ grid.appendChild(mkCard('course')); attachDnd(grid,'.edu-card'); };
  sec.querySelector('[data-add-degree]').onclick = ()=>{ grid.appendChild(mkCard('degree')); attachDnd(grid,'.edu-card'); };
  attachDnd(grid,'.edu-card');
  ensureAddAnchor();
}

/* ------------ EXPERIENCE ------------ */
export function renderExp(){
  if ($('#stack .exp-list') && !isSidebarActive()) { ensureAddAnchor(); return; }

  const sec = document.createElement('div'); sec.className='section';
  sec.appendChild(mkTitle('fa-briefcase','Work experience', ()=> sec.remove()));
  sec.innerHTML += `
    <div class="exp-list"></div>
    <div class="ctrl-mini"><button class="mini" type="button" data-add-exp>+ Add role</button></div>`;

  const { host, addWrap } = hostAndAdd();

  if (isSidebarActive()){
    host.insertBefore(sec, addWrap);
    const h = sec.querySelector('.handle'); if (h) h.style.display='none';
  } else {
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
    host.insertBefore(wrap, addWrap);
  }

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
  grid.appendChild(mk()); attachDnd(grid,'.exp-card');
  ensureAddAnchor();
}

/* ------------ BIO ------------ */
export function renderBio(){
  if ($('#stack [data-bio]') && !isSidebarActive()) { ensureAddAnchor(); return; }

  const sec = document.createElement('div'); sec.className='section'; sec.setAttribute('data-bio','1');
  sec.appendChild(mkTitle('fa-user','Profile', ()=> sec.remove()));
  const body = document.createElement('div');
  body.contentEditable = 'true';
  body.textContent = 'Add a short summary of your profile, strengths and what you’re looking for.';
  sec.appendChild(body);

  const { host, addWrap } = hostAndAdd();

  if (isSidebarActive()){
    host.insertBefore(sec, addWrap);
    const h = sec.querySelector('.handle'); if (h) h.style.display='none';
  } else {
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(sec);
    host.insertBefore(wrap, addWrap);
  }
  ensureAddAnchor();
}

/* ------------ Add menu (unchanged) ------------ */
export function openAddMenu(anchorBtn){ /* … unchanged from your v1.5 … */ }
