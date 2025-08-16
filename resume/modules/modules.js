// /resume/modules/modules.js
// Renders Skills, Education, Experience (and stub Bio) + "+" add menu.
// Handles correct host placement for Sidebar vs Top/Fancy layouts.
import { S } from '../app/state.js';
import { ensureCanvas, getHeaderNode } from '../layouts/layouts.js';

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* ---------------- host helpers ---------------- */
function hosts(){
  const { root, page, sheet, stack, addWrap, addMenu, addTray, dotAdd } = ensureCanvas();
  const header = getHeaderNode();
  const rail   = header?.querySelector('[data-rail-sections]') || null; // sidebar left rail
  const main   = header?.querySelector('[data-zone="main"]')    || null; // sidebar right content
  return { root, page, sheet, stack, addWrap, addMenu, addTray, dotAdd, rail, main };
}

// insert before the canvas "+" only when we are inserting into the stack.
// for sidebar main/rail, just append.
function insertInto(hostEl, node){
  const { stack, addWrap } = hosts();
  if(hostEl === stack){
    stack.insertBefore(node, addWrap);
  }else{
    hostEl.appendChild(node);
  }
}

/* ---------------- plus menu & visibility ---------------- */
export function updatePlusMenu(){
  const { addWrap } = hosts();
  if(!addWrap) return;
  const haveSkills = !!document.querySelector('[data-section="skills"]');
  const haveEdu    = !!document.querySelector('[data-section="edu"]');
  const haveExp    = !!document.querySelector('[data-section="exp"]');
  addWrap.style.display = (haveSkills && haveEdu && haveExp) ? 'none' : 'flex';
}

export function openAddMenu(anchor){
  const { addMenu, addTray } = ensureCanvas();
  addTray.innerHTML = '';

  const haveHeader = !!getHeaderNode();
  if(!haveHeader){
    addTray.innerHTML = `
      <div class="sq" data-add="header-side"  title="Sidebar"><i class="fa-solid fa-table-columns"></i></div>
      <div class="sq" data-add="header-fancy" title="Top fancy"><i class="fa-solid fa-sparkles"></i></div>
      <div class="sq" data-add="header-top"   title="Top bar"><i class="fa-solid fa-grip-lines"></i></div>`;
  }else{
    if(!S.skills.length) addTray.innerHTML += `<div class="sq" data-add="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></div>`;
    if(!S.edu.length)    addTray.innerHTML += `<div class="sq" data-add="edu" title="Education"><i class="fa-solid fa-user-graduate"></i></div>`;
    if(!S.exp.length)    addTray.innerHTML += `<div class="sq" data-add="exp" title="Experience"><i class="fa-solid fa-briefcase"></i></div>`;
  }
  if(!addTray.children.length){ addMenu.classList.remove('open'); return; }

  const r = anchor.getBoundingClientRect();
  addMenu.style.left = (r.left + window.scrollX) + 'px';
  addMenu.style.top  = (r.bottom + 10 + window.scrollY) + 'px';
  addMenu.classList.add('open');

  const close = (e)=>{
    if(!addMenu.contains(e.target) && e.target!==anchor){
      addMenu.classList.remove('open');
      document.removeEventListener('click', close, true);
    }
  };
  setTimeout(()=>document.addEventListener('click', close, true),0);

  addTray.onclick = (e)=>{
    const k = e.target.closest('.sq')?.dataset.add; if(!k) return;
    addMenu.classList.remove('open');
    if(k==='skills'){
      if(!S.skills.length) S.skills = [
        {type:'star',   label:'Skill', value:3 },
        {type:'slider', label:'Skill', value:50}
      ];
      renderSkills();
    }
    if(k==='edu'){
      if(!S.edu.length) S.edu = [{kind:'course',year:'2018–2022',academy:'Academy',title:'Course'}];
      renderEdu();
    }
    if(k==='exp'){
      if(!S.exp.length) S.exp = [{dates:'Jan 2022',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}];
      renderExp();
    }
    updatePlusMenu();
  };
}

/* ---------------- SKILLS ---------------- */
export function renderSkills(){
  // remove previous wherever they are
  $$/('[data-section="skills"]').forEach(n=>n.remove());
  if(!S.skills.length){ updatePlusMenu(); return; }

  const { stack, rail, main } = hosts();
  const inSidebar = (S.layout==='side' && S.skillsInSidebar && rail);
  const host = inSidebar ? rail : (S.layout==='side' && main ? main : stack);

  const wrap = document.createElement('div');
  wrap.className = 'node';
  wrap.dataset.section = 'skills';
  wrap.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-layer-group"></i><div>Skills</div></div>
      <div class="u"></div>
      <div class="tip">Use ★ or the slider to rate your confidence. Add languages, tools or any ability.</div>
      <div class="grid-skills ${inSidebar?'':'cols-2'}" data-sgrid></div>
      ${S.layout==='side' ? `<div class="center" style="margin-top:8px">
        <button class="mbtn" id="togglePlace">${inSidebar?'Move to canvas':'Move to sidebar'}</button>
      </div>`:''}
    </div>`;

  const grid = $('[data-sgrid]', wrap);
  S.skills.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'skill';
    row.innerHTML = `<div class="label"><span>${it.label||'Skill'}</span></div><div class="right"></div>`;
    const R = $('.right', row);

    if(it.type==='star'){
      const s=document.createElement('div'); s.className='stars';
      for(let i=1;i<=5;i++){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24');
        svg.classList.add('star');
        if(i<=(+it.value||0)) svg.classList.add('active');
        svg.innerHTML='<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        svg.onclick=()=>{ it.value=i; s.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active',ix<i)); };
        s.appendChild(svg);
      }
      R.appendChild(s);
    }else{
      const r=document.createElement('input');
      r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
      r.oninput=()=>it.value=r.value;
      R.appendChild(r);
    }

    grid.appendChild(row);
  });

  insertInto(host, wrap);

  const t = $('#togglePlace', wrap);
  if(t) t.onclick = ()=>{ S.skillsInSidebar = !inSidebar; renderSkills(); };
  updatePlusMenu();
}

/* ---------------- EDUCATION ---------------- */
export function renderEdu(){
  // remove previous wherever they are
  $$/('[data-section="edu"]').forEach(n=> n.remove());
  if(!S.edu.length){ updatePlusMenu(); return; }

  const { stack, main } = hosts();
  const host = (S.layout==='side' && main) ? main : stack;

  const wrap = document.createElement('div');
  wrap.className='node';
  wrap.dataset.section='edu';
  wrap.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-graduation-cap"></i><div>Education</div></div>
      <div class="u"></div>
      <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
    </div>`;

  const grid = $('[data-egrid]', wrap);

  S.edu.forEach(card=>{
    const c=document.createElement('div'); c.className='sec';
    const icon = card.kind==='degree'
      ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>'
      : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700">${icon}<span>${card.title||'Title'}</span></div>
      <div><span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(card.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px">${card.academy||'Academy name (wraps to two lines if needed)'}</div>`;
    grid.appendChild(c);
  });

  insertInto(host, wrap);
  updatePlusMenu();
}

/* ---------------- EXPERIENCE ---------------- */
export function renderExp(){
  // remove previous wherever they are
  $$/('[data-section="exp"]').forEach(n=> n.remove());
  if(!S.exp.length){ updatePlusMenu(); return; }

  const { stack, main } = hosts();
  const host = (S.layout==='side' && main) ? main : stack;

  const wrap = document.createElement('div');
  wrap.className='node';
  wrap.dataset.section='exp';
  wrap.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-briefcase"></i><div>Work experience</div></div>
      <div class="u"></div>
      <div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
    </div>`;

  const grid = $('[data-xgrid]', wrap);

  S.exp.forEach(x=>{
    const c=document.createElement('div'); c.className='sec';
    c.style.background='color-mix(in srgb, var(--accent) 12%, #fff)';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(x.dates||'Jan 2022').slice(0,16)}</span>
        <div style="font-weight:800;margin-left:6px">${x.role||'Job title'}</div>
      </div>
      <div style="font-weight:700;color:#374151;margin-top:4px">${x.org||'@Company'}</div>
      <div style="margin-top:6px">${x.desc||'Describe impact, scale and results.'}</div>`;
    grid.appendChild(c);
  });

  insertInto(host, wrap);
  updatePlusMenu();
}

/* ---------------- BIO (stub, exported for API stability) ---------------- */
export function renderBio(){
  // Implement when ready. Kept as a no-op so imports don't break.
}

/* ---------------- re-render on layout morph ---------------- */
document.addEventListener('layout:changed', ()=>{
  if(S.skills.length) renderSkills();
  if(S.edu.length)    renderEdu();
  if(S.exp.length)    renderExp();
  updatePlusMenu();
});
