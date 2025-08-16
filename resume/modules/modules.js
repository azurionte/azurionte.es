// /resume/modules/modules.js
// Sections + Add menu + re-placement logic for sidebar layout
// v1.0
console.log('[modules.js] v1.0');

import { S } from '../app/state.js';
import { ensureCanvas, getHeaderNode } from '../layouts/layouts.js';

/* ------------------------------ host helpers ----------------------------- */
function hostForContent(){
  const header = getHeaderNode();
  if (S.layout === 'side' && header) {
    return header.querySelector('[data-zone="main"]');
  }
  return ensureCanvas().stack;
}
function hostForSidebarRail(){
  return getHeaderNode()?.querySelector('[data-rail-sections]') || null;
}
function clearSection(key){
  document.querySelectorAll(`[data-section="${key}"]`).forEach(el=>{
    const n = el.closest('.node');
    (n && n.parentNode) ? n.remove() : el.remove();
  });
}

/* --------------------------------- SKILLS -------------------------------- */
export function renderSkills(){
  clearSection('skills');
  if (!S.skills || !S.skills.length) return;

  // if user wants skills in the sidebar (and we *are* on sidebar)
  const rail = (S.layout==='side' && S.skillsInSidebar) ? hostForSidebarRail() : null;
  const host = rail || hostForContent();

  if (!host) return;

  const outer = document.createElement('div');
  outer.className = 'node';
  outer.dataset.section = 'skills';
  outer.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-layer-group"></i><div>Skills</div></div>
      <div class="u"></div>
      <div class="tip">Use ★ or the slider to rate your confidence. You can add languages, tools or any ability here.</div>
      <div class="grid-skills ${rail? '' : 'cols-2'}" data-sgrid></div>
      ${(S.layout==='side') ? '<div class="center" style="margin-top:8px"><button class="mbtn" id="togglePlace">'+(S.skillsInSidebar?'Move to canvas':'Move to sidebar')+'</button></div>' : ''}
    </div>
  `;
  const grid = outer.querySelector('[data-sgrid]');

  S.skills.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'skill';
    row.innerHTML = `<div class="label"><span>${it.label||'Skill'}</span></div><div class="right"></div>`;
    const R = row.querySelector('.right');

    if (it.type==='star'){
      const s = document.createElement('div'); s.className='stars';
      for (let i=1;i<=5;i++){
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24'); svg.classList.add('star');
        if (i <= (+it.value||0)) svg.classList.add('active');
        svg.innerHTML = '<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        svg.onclick=()=>{ it.value=i; s.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active',ix<i)); };
        s.appendChild(svg);
      }
      R.appendChild(s);
    }else{
      const r=document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
      r.oninput=()=> it.value=r.value; R.appendChild(r);
    }
    grid.appendChild(row);
  });

  host.appendChild(outer);

  const t = outer.querySelector('#togglePlace');
  if (t) t.onclick = ()=>{ S.skillsInSidebar = !S.skillsInSidebar; renderSkills(); updatePlusMenu(); };
}

/* --------------------------------- EDU ----------------------------------- */
export function renderEdu(){
  clearSection('edu');
  if (!S.edu || !S.edu.length) return;

  const host = hostForContent();
  const outer = document.createElement('div');
  outer.className='node';
  outer.dataset.section='edu';
  outer.innerHTML=`
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-graduation-cap"></i><div>Education</div></div>
      <div class="u"></div>
      <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
    </div>
  `;
  const grid = outer.querySelector('[data-egrid]');
  S.edu.forEach(card=>{
    const c=document.createElement('div'); c.className='sec';
    const icon = card.kind==='degree'
      ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>'
      : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700">${icon}<span>${card.title||'Title'}</span></div>
      <div><span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(card.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px">${card.academy||'Academy name (wraps to two lines if needed)'}</div>
    `;
    grid.appendChild(c);
  });
  host.appendChild(outer);
}

/* --------------------------------- EXP ----------------------------------- */
export function renderExp(){
  clearSection('exp');
  if (!S.exp || !S.exp.length) return;

  const host = hostForContent();
  const outer=document.createElement('div');
  outer.className='node';
  outer.dataset.section='exp';
  outer.innerHTML=`
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-briefcase"></i><div>Work experience</div></div>
      <div class="u"></div>
      <div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
    </div>
  `;
  const grid=outer.querySelector('[data-xgrid]');
  S.exp.forEach(x=>{
    const c=document.createElement('div'); c.className='sec';
    c.style.background='color-mix(in srgb, var(--accent) 12%, #fff)';
    c.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(x.dates||'Jan 2022').slice(0,16)}</span>
        <div style="font-weight:800;margin-left:6px">${x.role||'Job title'}</div>
      </div>
      <div style="font-weight:700;color:#374151;margin-top:4px">${x.org||'@Company'}</div>
      <div style="margin-top:6px">${x.desc||'Describe impact, scale and results.'}</div>
    `;
    grid.appendChild(c);
  });
  host.appendChild(outer);
}

/* ---------------------------------- BIO ---------------------------------- */
export function renderBio(){
  clearSection('bio');
  if (!S.bio || !S.bio.trim()) return;

  const host = hostForContent();
  const outer = document.createElement('div');
  outer.className='node';
  outer.dataset.section='bio';
  outer.innerHTML=`
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-id-card-clip"></i><div>Profile</div></div>
      <div class="u"></div>
      <div style="white-space:pre-wrap">${S.bio}</div>
    </div>
  `;
  host.appendChild(outer);
}

/* ------------------------------- ADD MENU ------------------------------- */
export function openAddMenu(btn){
  const { addMenu, addTray } = ensureCanvas();
  addTray.innerHTML = '';
  const header = getHeaderNode();

  if (!header){
    addTray.innerHTML = `
      <div class="sq" data-add="header-side"  title="Sidebar"><i class="fa-solid fa-table-columns"></i></div>
      <div class="sq" data-add="header-fancy" title="Top fancy"><i class="fa-solid fa-sparkles"></i></div>
      <div class="sq" data-add="header-top"   title="Top bar"><i class="fa-solid fa-grip-lines"></i></div>`;
  }else{
    if (!S.skills?.length) addTray.innerHTML += `<div class="sq" data-add="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></div>`;
    if (!S.edu?.length)   addTray.innerHTML += `<div class="sq" data-add="edu"    title="Education"><i class="fa-solid fa-user-graduate"></i></div>`;
    if (!S.exp?.length)   addTray.innerHTML += `<div class="sq" data-add="exp"    title="Experience"><i class="fa-solid fa-briefcase"></i></div>`;
    if (!S.bio?.length)   addTray.innerHTML += `<div class="sq" data-add="bio"    title="Bio"><i class="fa-solid fa-id-card-clip"></i></div>`;
  }
  if (!addTray.children.length){ addMenu.classList.remove('open'); return; }

  // position near button
  const r = btn.getBoundingClientRect();
  const below = (window.innerHeight - r.bottom) > 160;
  addMenu.style.left = (r.left + window.scrollX) + 'px';
  addMenu.style.top  = (below ? (r.bottom+10) : (r.top - 10 - (addMenu.offsetHeight||120))) + 'px';
  addMenu.classList.add('open');

  const close = (e)=>{ if (!addMenu.contains(e.target) && e.target!==btn){ addMenu.classList.remove('open'); document.removeEventListener('click',close); } };
  setTimeout(()=> document.addEventListener('click',close), 0);

  addTray.onclick = (e)=>{
    const k = e.target.closest('.sq')?.dataset.add; if(!k) return;
    addMenu.classList.remove('open');

    if (k==='skills' && !S.skills?.length){ S.skills=[{type:'star',label:'Skill',value:3},{type:'slider',label:'Skill',value:50}]; renderSkills(); }
    if (k==='edu'    && !S.edu?.length)  { S.edu=[{kind:'course',year:'2018–2022',academy:'Academy name (wraps to two lines if needed)',title:'Title'}]; renderEdu(); }
    if (k==='exp'    && !S.exp?.length)  { S.exp=[{dates:'Jan 2022',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]; renderExp(); }
    if (k==='bio'    && !S.bio)          { S.bio='Short professional summary…'; renderBio(); }
  };
}

/* --------------------------- util for the “+” --------------------------- */
export function updatePlusMenu(){
  const haveSkills = !!document.querySelector('[data-section="skills"]');
  const haveEdu    = !!document.querySelector('[data-section="edu"]');
  const haveExp    = !!document.querySelector('[data-section="exp"]');

  const { addWrap } = ensureCanvas();
  addWrap.style.display = (haveSkills && haveEdu && haveExp) ? 'none' : 'flex';
}

/* --------- when layout changes, re-place sections automatically --------- */
document.addEventListener('layout:changed', ()=>{
  renderSkills(); renderEdu(); renderExp(); renderBio(); updatePlusMenu();
});
