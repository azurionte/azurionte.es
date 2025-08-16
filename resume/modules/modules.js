// Sections (skills, education, experience, bio) + add-menu
import { S, save } from '../app/state.js';
import { getHeaderNode } from '../layouts/layouts.js';

/* ---------- Add menu --------------------------------------------------- */
export function openAddMenu(btn){
  const menu = document.getElementById('addMenu');
  const tray = document.getElementById('addTray');
  const header = getHeaderNode();

  tray.innerHTML = '';
  if (!header){
    tray.innerHTML = `
      <div class="sq" data-add="header-side" title="Sidebar"><i class="fa-solid fa-table-columns"></i></div>
      <div class="sq" data-add="header-fancy" title="Top fancy"><i class="fa-solid fa-sparkles"></i></div>
      <div class="sq" data-add="header-top" title="Top bar"><i class="fa-solid fa-grip-lines"></i></div>`;
  }else{
    if (!S.skills.length) tray.innerHTML += `<div class="sq" data-add="skills" title="Skills"><i class="fa-solid fa-layer-group"></i></div>`;
    if (!S.edu.length)   tray.innerHTML += `<div class="sq" data-add="edu" title="Education"><i class="fa-solid fa-user-graduate"></i></div>`;
    if (!S.exp.length)   tray.innerHTML += `<div class="sq" data-add="exp" title="Experience"><i class="fa-solid fa-briefcase"></i></div>`;
    if (!S.bio)          tray.innerHTML += `<div class="sq" data-add="bio" title="Bio"><i class="fa-solid fa-user"></i></div>`;
  }
  if (!tray.children.length){ menu.classList.remove('open'); return; }

  const r = btn.getBoundingClientRect(); const below = (window.innerHeight - r.bottom) > 160;
  menu.style.left = (r.left+window.scrollX)+'px';
  menu.style.top  = (below ? (r.bottom+10) : (r.top - 10 - (menu.offsetHeight||120)))+'px';
  menu.classList.add('open');

  menu.onclick = (e) => {
    const k = e.target.closest('.sq')?.dataset.add; if(!k) return;
    menu.classList.remove('open');
    if (k==='skills'){ if(!S.skills.length) S.skills=[{type:'star',label:'Skill',value:3},{type:'slider',label:'Skill',value:50}]; renderSkills(); }
    if (k==='edu'){ if(!S.edu.length) S.edu=[{kind:'course',year:'2018–2022',academy:'Academy name',title:'Title'}]; renderEdu(); }
    if (k==='exp'){ if(!S.exp.length) S.exp=[{dates:'Jan 2022',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}]; renderExp(); }
    if (k==='bio'){ S.bio='A short professional summary.'; renderBio(); }
    save();
  };
  document.addEventListener('click',e => { if(menu.classList.contains('open') && !menu.contains(e.target) && e.target!==btn) menu.classList.remove('open'); }, {once:true});
}

/* ---------- Render helpers -------------------------------------------- */
function hostForSidebarSection(){
  return document.querySelector('[data-header] [data-rail-sections]');
}
function stack(){ return document.getElementById('stack'); }
function addWrap(){ return document.getElementById('canvasAdd'); }
function insertNode(node, place='main'){
  if (place==='rail'){ // inside sidebar rail
    const container = hostForSidebarSection();
    const n = document.createElement('div'); n.className='node'; n.appendChild(node.firstElementChild); container.appendChild(n);
  } else {
    stack().insertBefore(node, addWrap());
  }
}

/* ---------- SKILLS ----------------------------------------------------- */
export function renderSkills(){
  // clear
  document.querySelectorAll('[data-section="skills"]').forEach(n => n.closest('.node').remove());
  if(!S.skills.length) return;

  const inRail = S.skillsInSidebar && S.layout==='side';
  const outer = document.createElement('div'); outer.className='node'; outer.dataset.section='skills';
  outer.innerHTML = `
    <div class="sec">
      <div style="text-align:center;font-weight:800;display:flex;align-items:center;gap:10px;justify-content:center">
        <i class="fa-solid fa-layer-group"></i> Skills
      </div>
      <div class="u" style="height:4px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));width:160px;margin:8px auto 12px"></div>
      <div class="tip">Tip: Use ★ or the slider to rate your confidence.</div>
      <div class="grid-skills ${inRail?'':'cols-2'}" data-sgrid></div>
      ${(S.layout==='side')?`<div style="text-align:center;margin-top:8px">
        <button class="mbtn" id="togglePlace">${inRail?'Move to canvas':'Move to sidebar'}</button>
      </div>`:''}
    </div>`;
  const grid = outer.querySelector('[data-sgrid]');

  S.skills.forEach(it=>{
    const row = document.createElement('div'); row.className='skill';
    row.innerHTML = `<div class="label"><span>${it.label||'Skill'}</span></div><div class="right"></div>`;
    const R = row.querySelector('.right');
    if (it.type==='star'){
      const s=document.createElement('div'); s.className='stars';
      for(let i=1;i<=5;i++){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 24 24'); svg.classList.add('star');
        if(i<=(+it.value||0)) svg.classList.add('active');
        svg.innerHTML='<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        svg.onclick=()=>{ it.value=i; s.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active',ix<i)); save(); };
        s.appendChild(svg);
      }
      R.appendChild(s);
    }else{
      const r=document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
      r.oninput=()=>{ it.value=r.value; save(); }; R.appendChild(r);
    }
    grid.appendChild(row);
  });

  if (inRail) insertNode(outer, 'rail'); else insertNode(outer, 'main');

  const t = outer.querySelector('#togglePlace');
  if (t) t.onclick = () => { S.skillsInSidebar = !S.skillsInSidebar; renderSkills(); save(); };
}

/* ---------- EDUCATION -------------------------------------------------- */
export function renderEdu(){
  document.querySelectorAll('[data-section="edu"]').forEach(n => n.closest('.node').remove());
  if(!S.edu.length) return;
  const outer=document.createElement('div'); outer.className='node'; outer.dataset.section='edu';
  outer.innerHTML=`<div class="sec">
    <div style="text-align:center;font-weight:800;display:flex;align-items:center;gap:10px;justify-content:center"><i class="fa-solid fa-graduation-cap"></i> Education</div>
    <div class="u" style="height:4px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));width:160px;margin:8px auto 12px"></div>
    <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
  </div>`;
  const grid=outer.querySelector('[data-egrid]');
  S.edu.forEach(card=>{
    const c=document.createElement('div'); c.className='sec';
    const icon = card.kind==='degree' ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>' : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
    c.innerHTML=`<div style="display:flex;align-items:center;gap:8px;font-weight:700">${icon}<span>${card.title||'Title'}</span></div>
      <div><span style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(card.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px">${card.academy||'Academy name (wraps to two lines if needed)'}</div>`;
    grid.appendChild(c);
  });
  insertNode(outer,'main');
}

/* ---------- EXPERIENCE ------------------------------------------------- */
export function renderExp(){
  document.querySelectorAll('[data-section="exp"]').forEach(n => n.closest('.node').remove());
  if(!S.exp.length) return;
  const outer=document.createElement('div'); outer.className='node'; outer.dataset.section='exp';
  outer.innerHTML=`<div class="sec">
    <div style="text-align:center;font-weight:800;display:flex;align-items:center;gap:10px;justify-content:center"><i class="fa-solid fa-briefcase"></i> Work experience</div>
    <div class="u" style="height:4px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));width:160px;margin:8px auto 12px"></div>
    <div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
  </div>`;
  const grid=outer.querySelector('[data-xgrid]');
  S.exp.forEach(x=>{
    const c=document.createElement('div'); c.className='sec'; c.style.background='color-mix(in srgb, var(--accent) 12%, #fff)';
    c.innerHTML=`<div style="display:flex;align-items:center;gap:8px">
      <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(x.dates||'Jan 2022').slice(0,16)}</span>
      <div style="font-weight:800;margin-left:6px">${x.role||'Job title'}</div></div>
      <div style="font-weight:700;color:#374151;margin-top:4px">${x.org||'@Company'}</div>
      <div style="margin-top:6px">${x.desc||'Describe impact, scale and results.'}</div>`;
    grid.appendChild(c);
  });
  insertNode(outer,'main');
}

/* ---------- BIO -------------------------------------------------------- */
export function renderBio(){
  document.querySelectorAll('[data-section="bio"]').forEach(n => n.closest('.node').remove());
  if(!S.bio) return;
  const outer=document.createElement('div'); outer.className='node'; outer.dataset.section='bio';
  outer.innerHTML=`<div class="sec">
    <div style="text-align:center;font-weight:800;display:flex;align-items:center;gap:10px;justify-content:center"><i class="fa-solid fa-user"></i> Profile</div>
    <div class="u" style="height:4px;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));width:160px;margin:8px auto 12px"></div>
    <div>${S.bio}</div>
  </div>`;
  insertNode(outer, S.layout==='side' ? 'rail' : 'main');
}

/* ---------- Chips for header (called by layouts) ---------------------- */
export function applyChips(host){
  // nothing extra here (styles in layout), but we keep function as API
}
