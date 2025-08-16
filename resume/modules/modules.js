// resume/modules/modules.js
// Add (+) menu and section renderers (skills, education, experience)
import { S } from '../app/state.js';
import { morphTo } from '../layouts/layouts.js';

/* ---------- utilities ---------- */
function stackEl(){ return document.getElementById('stack'); }
function addWrap(){ return document.getElementById('canvasAdd'); }
function headerNode(){ return stackEl()?.querySelector('[data-header]')?.closest('.node'); }
function mainHost(){
  // When sidebar layout is active, modules go to the right column (data-zone="main")
  const main = document.querySelector('[data-header] [data-zone="main"]');
  return (S.layout==='side' && main) ? main : stackEl();
}
function railHost(){
  // left rail only exists for sidebar layout
  return document.querySelector('[data-header] .rail [data-rail-sections]');
}
function ensurePlusAtEnd(){
  const host = mainHost();
  if(!host) return;
  const btn = addWrap();
  if(btn && btn.parentElement !== host) host.appendChild(btn);
  if(btn) btn.style.display = (allSectionsPresent() ? 'none' : 'flex');
}
function allSectionsPresent(){
  return !!document.querySelector('[data-section="skills"]')
      && !!document.querySelector('[data-section="edu"]')
      && !!document.querySelector('[data-section="exp"]');
}

/* ---------- public: open add menu ---------- */
export function openAddMenu(anchorEl){
  const menu = document.getElementById('addMenu');
  const tray = document.getElementById('addTray');
  if(!menu || !tray) return;

  // Build options
  tray.innerHTML = '';
  const haveHeader = !!headerNode();

  if(!haveHeader){
    // Offer layouts first-time
    tray.insertAdjacentHTML('beforeend', sq('header-side','fa-table-columns','Sidebar'));
    tray.insertAdjacentHTML('beforeend', sq('header-fancy','fa-sparkles','Top fancy'));
    tray.insertAdjacentHTML('beforeend', sq('header-top','fa-grip-lines','Top bar'));
  }else{
    if(!document.querySelector('[data-section="skills"]'))
      tray.insertAdjacentHTML('beforeend', sq('skills','fa-layer-group','Skills'));
    if(!document.querySelector('[data-section="edu"]'))
      tray.insertAdjacentHTML('beforeend', sq('edu','fa-user-graduate','Education'));
    if(!document.querySelector('[data-section="exp"]'))
      tray.insertAdjacentHTML('beforeend', sq('exp','fa-briefcase','Experience'));
  }

  if(!tray.children.length){
    addWrap().style.display='none';
    return;
  }

  // Position near anchor
  const r = anchorEl.getBoundingClientRect();
  const below = (window.innerHeight - r.bottom) > 160;
  menu.style.left = (r.left + window.scrollX) + 'px';
  menu.style.top  = (below ? (r.bottom + 10) : (r.top - 10 - (menu.offsetHeight||120)) ) + 'px';

  // Wire clicks
  tray.onclick = (e)=>{
    const k = e.target.closest('.sq')?.dataset.add;
    if(!k) return;
    menu.classList.remove('open');

    if(k.startsWith('header')){
      // morph & place plus on the correct host
      morphTo(k);
      setTimeout(() => ensurePlusAtEnd(), 380);
      return;
    }
    if(k==='skills'){
      if(!S.skills.length) S.skills=[{type:'star',label:'Skill',value:3},{type:'slider',label:'Skill',value:50}];
      renderSkills();
    }
    if(k==='edu'){
      if(!S.edu.length) S.edu=[{kind:'course',year:'2018–2022',academy:'Academy name (wraps to two lines if needed)',title:'Title'}];
      renderEdu();
    }
    if(k==='exp'){
      if(!S.exp.length) S.exp=[{dates:'Jan 2022',role:'Job title',org:'@Company',desc:'Describe impact, scale and results.'}];
      renderExp();
    }
    updatePlusMenu();
  };

  // Open + close behavior
  menu.classList.add('open');
  if(!menu.dataset.bound){
    document.addEventListener('click', (e)=>{
      if(menu.classList.contains('open') && !menu.contains(e.target) && e.target!==anchorEl){
        menu.classList.remove('open');
      }
    });
    menu.dataset.bound = '1';
  }
}

function sq(key, fa, title){
  return `<div class="sq" data-add="${key}" title="${title}"><i class="fa-solid ${fa}"></i></div>`;
}

/* ---------- public: update + button visibility ---------- */
export function updatePlusMenu(){
  ensurePlusAtEnd();
  // hide + when everything is present
  const btn = addWrap();
  if(btn) btn.style.display = (allSectionsPresent() ? 'none' : 'flex');
}

/* ---------- public: renderers ------------------------------------------ */
export function renderSkills(){
  // remove existing
  document.querySelectorAll('[data-section="skills"]').forEach(n=>n.closest('.node').remove());
  if(!S.skills.length) return;

  const host = (S.skillsInSidebar && S.layout==='side') ? railHost() : mainHost();
  if(!host) return;

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.section = 'skills';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-layer-group"></i><div>Skills</div></div>
      <div class="u"></div>
      <div class="tip">Use ★ or the slider to rate your confidence. You can add languages, tools or any ability here.</div>
      <div class="grid-skills ${ (S.layout==='side' && S.skillsInSidebar)? '' : 'cols-2' }" data-sgrid></div>
      ${ S.layout==='side'
          ? `<div class="center" style="margin-top:8px">
               <button class="mbtn" id="togglePlace">${S.skillsInSidebar?'Move to canvas':'Move to sidebar'}</button>
             </div>`
          : '' }
    </div>
  `;

  const grid = node.querySelector('[data-sgrid]');
  // build rows
  S.skills.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'skill';
    row.innerHTML = `<div class="label"><span>${it.label||'Skill'}</span></div><div class="right"></div>`;
    const R = row.querySelector('.right');

    if(it.type==='star'){
      const stars = document.createElement('div'); stars.className='stars';
      for(let i=1;i<=5;i++){
        const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
        s.setAttribute('viewBox','0 0 24 24'); s.classList.add('star');
        if(i <= (+it.value||0)) s.classList.add('active');
        s.innerHTML = '<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        s.onclick = ()=>{ it.value=i; stars.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active', ix<i)); };
        stars.appendChild(s);
      }
      R.appendChild(stars);
    }else{
      const r = document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
      r.oninput = ()=> it.value = r.value;
      R.appendChild(r);
    }
    grid.appendChild(row);
  });

  // insert into host (respect sidebar main column)
  if(host === stackEl()){
    stackEl().insertBefore(node, addWrap());
  }else{
    const wrap = document.createElement('div'); wrap.className = 'node'; wrap.appendChild(node.firstElementChild);
    host.appendChild(wrap);
  }

  const toggle = node.querySelector('#togglePlace');
  if(toggle){
    toggle.onclick = () => { S.skillsInSidebar = !S.skillsInSidebar; renderSkills(); updatePlusMenu(); };
  }
}

export function renderEdu(){
  document.querySelectorAll('[data-section="edu"]').forEach(n=>n.closest('.node').remove());
  if(!S.edu.length) return;

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.section = 'edu';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-graduation-cap"></i><div>Education</div></div>
      <div class="u"></div>
      <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
    </div>
  `;
  const grid = node.querySelector('[data-egrid]');
  S.edu.forEach(card=>{
    const c = document.createElement('div'); c.className='sec';
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

  stackEl().insertBefore(node, addWrap());
}

export function renderExp(){
  document.querySelectorAll('[data-section="exp"]').forEach(n=>n.closest('.node').remove());
  if(!S.exp.length) return;

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.section = 'exp';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-briefcase"></i><div>Work experience</div></div>
      <div class="u"></div>
      <div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
    </div>
  `;
  const grid = node.querySelector('[data-xgrid]');
  S.exp.forEach(x=>{
    const c = document.createElement('div'); c.className='sec';
    c.style.background = 'color-mix(in srgb, var(--accent) 12%, #fff)';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(x.dates||'Jan 2022').slice(0,16)}</span>
        <div style="font-weight:800;margin-left:6px">${x.role||'Job title'}</div>
      </div>
      <div style="font-weight:700;color:#374151;margin-top:4px">${x.org||'@Company'}</div>
      <div style="margin-top:6px">${x.desc||'Describe impact, scale and results.'}</div>
    `;
    grid.appendChild(c);
  });

  stackEl().insertBefore(node, addWrap());
}

/* ---------- bootstrapping helpers ---------- */
// keep + in the correct column whenever header changes
document.addEventListener('layout:changed', ensurePlusAtEnd);
// fallback: observe DOM replacements
const mo = new MutationObserver(()=>ensurePlusAtEnd());
mo.observe(document.body, { childList:true, subtree:true });

/* expose a couple of internals if other modules need them later */
export const __modules_debug = { headerNode, mainHost, railHost, ensurePlusAtEnd };
