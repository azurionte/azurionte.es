// /resume/modules/modules.js
// Renders Skills, Education, Experience, Bio; controls the + add menu.
import { S } from '../app/state.js';
import { getHeaderNode, morphTo, applyContact } from '../layouts/layouts.js';

/* ---------- shortcuts ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
function stackEl(){ return $('#stack'); }
function addWrap(){ return $('#canvasAdd'); }
function addMenu(){ return $('#addMenu'); }
function addTray(){ return $('#addTray'); }

/* ---------- helpers ---------- */
function sectionNode(key){ return $(`[data-section="${key}"]`)?.closest('.node') || null; }
function removeSection(key){ sectionNode(key)?.remove(); }
function headerKind(){ return S.layout || (getHeaderNode() ? (getHeaderNode().querySelector('.sidebar-layout')?'side': getHeaderNode().querySelector('.fancy')?'fancy':'top') : null); }

/* Keep + button at the right place (right column for sidebar, bottom of stack otherwise) */
function placeAddButton(){
  const h=getHeaderNode();
  if(h && headerKind()==='side'){
    const zone=h.querySelector('[data-zone="main"]');
    if(zone && addWrap() && addWrap().parentElement!==zone){
      zone.appendChild(addWrap());
    }
  }else{
    if(addWrap() && addWrap().parentElement!==stackEl()){
      stackEl().appendChild(addWrap());
    }
  }
  ensurePlusVisible();
}
function ensurePlusVisible(){ if(addWrap()) addWrap().style.display='flex'; }

/* Hide + when all three main sections exist */
export function updatePlusMenu(){
  const haveSkills=!!sectionNode('skills');
  const haveEdu   =!!sectionNode('edu');
  const haveExp   =!!sectionNode('exp');
  if(addWrap()){
    addWrap().style.display = (haveSkills && haveEdu && haveExp) ? 'none' : 'flex';
  }
}

/* ---------- open add menu ---------- */
export function openAddMenu(anchorBtn){
  placeAddButton();

  const tray = addTray();
  tray.innerHTML = '';
  const haveHeader = !!getHeaderNode();

  if(!haveHeader){
    tray.innerHTML = `
      <div class="sq" data-add="header-side"  title="Sidebar"><i class="fa-solid fa-table-columns"></i></div>
      <div class="sq" data-add="header-fancy" title="Top fancy"><i class="fa-solid fa-sparkles"></i></div>
      <div class="sq" data-add="header-top"   title="Top bar"><i class="fa-solid fa-grip-lines"></i></div>`;
  }else{
    if(!sectionNode('skills')) tray.insertAdjacentHTML('beforeend', `<div class="sq" data-add="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></div>`);
    if(!sectionNode('bio'))    tray.insertAdjacentHTML('beforeend', `<div class="sq" data-add="bio"    title="Bio"><i class="fa-solid fa-user"></i></div>`);
    if(!sectionNode('edu'))    tray.insertAdjacentHTML('beforeend', `<div class="sq" data-add="edu"    title="Education"><i class="fa-solid fa-user-graduate"></i></div>`);
    if(!sectionNode('exp'))    tray.insertAdjacentHTML('beforeend', `<div class="sq" data-add="exp"    title="Experience"><i class="fa-solid fa-briefcase"></i></div>`);
  }

  if(!tray.children.length){ addMenu().classList.remove('open'); updatePlusMenu(); return; }

  // position the popover near the button
  const r = anchorBtn.getBoundingClientRect();
  const below = (window.innerHeight - r.bottom) > 160;
  addMenu().style.left = (r.left + window.scrollX) + 'px';
  addMenu().style.top  = (below ? (r.bottom+10) : (r.top-10-(addMenu().offsetHeight||120))) + 'px';
  addMenu().classList.add('open');

  // click handling
  const onClick = (e)=>{
    const k = e.target.closest('.sq')?.dataset.add; if(!k) return;
    addMenu().classList.remove('open');
    if(k.startsWith('header-')){ morphTo(k); applyContact(); placeAddButton(); updatePlusMenu(); return; }
    if(k==='skills'){ if(!S.skills?.length) S.skills=[{type:'star',label:'Skill',value:3},{type:'slider',label:'Skill',value:50}]; renderSkills(); }
    if(k==='bio'){ renderBio(); }
    if(k==='edu'){ if(!S.edu?.length) S.edu=[{kind:'course',year:'2018–2022',academy:'Academy name (wraps two lines)',title:'Title'}]; renderEdu(); }
    if(k==='exp'){ if(!S.exp?.length) S.exp=[{dates:'Jan 2022',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]; renderExp(); }
    updatePlusMenu();
    addMenu().removeEventListener('click', onClick);
  };
  addMenu().addEventListener('click', onClick, { once:false });

  // close when clicking elsewhere
  const off = (e)=>{ if(!addMenu().contains(e.target) && e.target!==anchorBtn){ addMenu().classList.remove('open'); document.removeEventListener('click',off); } };
  setTimeout(()=>document.addEventListener('click',off),0);
}

/* ---------- Skills ---------- */
export function renderSkills(){
  removeSection('skills');
  if(!S.skills || !S.skills.length) return;

  const inSidebar = (S.skillsInSidebar && headerKind()==='side');
  // host: rail for sidebar, else main stack
  const host = inSidebar
    ? (getHeaderNode()?.querySelector('[data-rail-sections]'))
    : stackEl();

  if(!host) return;

  const sec = document.createElement('div');
  sec.className='node';
  sec.dataset.section='skills';
  sec.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-layer-group"></i><div>Skills</div></div>
      <div class="u"></div>
      <div class="tip">Use ★ or the slider to rate your confidence. Add languages, tools, abilities—anything.</div>
      <div class="grid-skills ${inSidebar?'':'cols-2'}" data-sgrid></div>
      ${headerKind()==='side' ? `<div class="center" style="margin-top:8px"><button class="mbtn" id="togglePlace">${inSidebar?'Move to canvas':'Move to sidebar'}</button></div>` : ``}
    </div>`;

  const grid = sec.querySelector('[data-sgrid]');

  S.skills.forEach(it=>{
    const row = document.createElement('div'); row.className='skill';
    row.innerHTML = `<div class="label"><span>${it.label||'Skill'}</span></div><div class="right"></div>`;
    const R = row.querySelector('.right');
    if(it.type==='star'){
      const s=document.createElement('div'); s.className='stars';
      for(let i=1;i<=5;i++){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24'); svg.classList.add('star');
        if(i<=(+it.value||0)) svg.classList.add('active');
        svg.innerHTML='<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        svg.onclick=()=>{ it.value=i; s.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active',ix<i)); };
        s.appendChild(svg);
      }
      R.appendChild(s);
    }else{
      const r=document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
      r.oninput=()=> it.value=r.value;
      R.appendChild(r);
    }
    grid.appendChild(row);
  });

  if(inSidebar){
    const node=document.createElement('div'); node.className='node'; node.appendChild(sec.firstElementChild);
    host.appendChild(node);
  }else{
    stackEl().insertBefore(sec, addWrap());
  }

  const t = $('#togglePlace', sec);
  if(t) t.onclick=()=>{ S.skillsInSidebar = !S.skillsInSidebar; renderSkills(); updatePlusMenu(); };

  updatePlusMenu();
}

/* ---------- Bio (summary paragraph) ---------- */
export function renderBio(text){
  if(typeof text==='string') S.bio = text;
  removeSection('bio');
  const content = (S.bio && S.bio.trim()) ? S.bio.trim() : 'Write a short profile summary here.';
  const sec = document.createElement('div'); sec.className='node'; sec.dataset.section='bio';
  sec.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-user"></i><div>Profile</div></div>
      <div class="u"></div>
      <div contenteditable class="bioarea">${content}</div>
    </div>`;
  sec.querySelector('.bioarea').addEventListener('input', e=>{ S.bio = e.currentTarget.textContent; });
  stackEl().insertBefore(sec, addWrap());
  updatePlusMenu();
}

/* ---------- Education ---------- */
export function renderEdu(){
  removeSection('edu');
  if(!S.edu || !S.edu.length) return;
  const outer=document.createElement('div'); outer.className='node'; outer.dataset.section='edu';
  outer.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-graduation-cap"></i><div>Education</div></div>
      <div class="u"></div>
      <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
    </div>`;
  const grid = $('[data-egrid]', outer);

  S.edu.forEach(card=>{
    const icon = card.kind==='degree'
      ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>'
      : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
    const c=document.createElement('div'); c.className='sec';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700">${icon}<span>${card.title||'Title'}</span></div>
      <div><span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(card.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px">${card.academy||'Academy name (wraps to two lines if needed)'}</div>`;
    grid.appendChild(c);
  });

  stackEl().insertBefore(outer, addWrap());
  updatePlusMenu();
}

/* ---------- Experience ---------- */
export function renderExp(){
  removeSection('exp');
  if(!S.exp || !S.exp.length) return;
  const outer=document.createElement('div'); outer.className='node'; outer.dataset.section='exp';
  outer.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-briefcase"></i><div>Work experience</div></div>
      <div class="u"></div>
      <div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
    </div>`;
  const grid = $('[data-xgrid]', outer);

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

  stackEl().insertBefore(outer, addWrap());
  updatePlusMenu();
}

/* ---------- react to layout change ---------- */
document.addEventListener('layout:changed', ()=>{
  placeAddButton();
  // if skills were set to sidebar before switching away, keep them in canvas
  if(headerKind()!=='side' && S.skillsInSidebar){
    S.skillsInSidebar = false;
    renderSkills();
  }
  updatePlusMenu();
});

/* initial placement for + button in case header already exists */
placeAddButton();
updatePlusMenu();
