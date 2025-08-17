// /resume/modules/modules.js
// [modules.js] v2.4 — sections renderers + anchored add menu + editing chrome
console.log('[modules.js] v2.4');

import { ensureCanvas, getRailHolder, getSideMain, isSidebarActive } from '../layouts/layouts.js';
import { S } from '../app/state.js';

/* ============================================================
   Styles injected once
   ============================================================ */
(function ensureModuleStyles(){
  if (document.getElementById('modules-style')) return;
  const st = document.createElement('style');
  st.id = 'modules-style';
  st.textContent = `
  /* ---- generic chips / badges ---- */
  .badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;font-weight:800;font-size:12px}
  .badge i{font-size:12px}

  /* use theme gradient tips for light tints */
  :root{
    --mz-bg: #0f1420;
    --mz-card: #0e1324;
    --mz-cardB: #121a35;
    --mz-ink: #e8ecff;
    --mz-ink-70: #c9d1ffb3;
    --mz-line: #202a4c;
    --mz-shadow: 0 18px 50px rgba(0,0,0,.35);
  }

  /* ---- generic section ---- */
  .section{position:relative;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid #ffffff14;box-shadow:0 10px 26px rgba(0,0,0,.28);padding:14px}
  [data-mat="paper"] .section{background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 24px rgba(0,0,0,.08)}
  .section .s-head{display:flex;align-items:center;gap:10px;margin:2px 4px 10px}
  .section .s-head i{width:18px;text-align:center;color:var(--accent)}
  .section .s-head .s-title{font-weight:900}
  .section .s-body{display:grid;gap:10px}

  /* ---- skills module ---- */
  .module-skills .s-body{gap:8px}
  .module-skills .sk-row{display:grid;grid-template-columns:2fr 1fr;align-items:center;gap:10px;position:relative}
  .module-skills .sk-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .module-skills .stars{display:inline-flex;gap:6px;justify-content:flex-end}
  .module-skills .star{width:14px;height:14px;fill:#cfd6ff}
  .module-skills .star.on{fill:#f59e0b}
  .module-skills .slider{width:100%}

  /* skills in rail — rating is one third of rail width */
  .sidebar-layout .rail .module-skills .sk-row{grid-template-columns:2fr 1fr}

  /* two columns per row when skills live in the main area with sidebar layout */
  .sidebar-layout [data-zone="main"] .module-skills .s-body{
    display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;
  }
  .sidebar-layout [data-zone="main"] .module-skills .sk-row{grid-template-columns:3fr 1fr}

  /* editing chrome that floats (doesn't consume layout) */
  .sk-row[data-editing="1"]{outline:2px dashed #7aa2ff80; outline-offset:4px; border-radius:10px}
  .sk-row[data-editing="1"] .drag, .sk-row[data-editing="1"] .kill{
    position:absolute;top:-12px;display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#0d1226;border:1px solid #2a345f;color:#cfe1ff;box-shadow:0 6px 16px rgba(0,0,0,.28);
  }
  .sk-row[data-editing="1"] .drag{left:-12px;cursor:grab}
  .sk-row[data-editing="1"] .kill{right:-12px;cursor:pointer}

  /* ---- education cards (match canvas look; auto-tinted) ---- */
  .edu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .edu-card{position:relative;border-radius:12px;padding:12px;border:1px solid var(--edu-line);background:var(--edu-bg);box-shadow:0 10px 24px rgba(0,0,0,.18)}
  .edu-card .top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .edu-card .top .year{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;font-weight:900;background:var(--edu-year-bg);color:var(--edu-year-fg);border:1px solid var(--edu-year-line)}
  .edu-card .title{font-weight:800;margin:6px 0 2px}
  .edu-card .academy{opacity:.85}

  /* tint using theme — not always dark */
  .section[data-edu-tone]{--edu-bg: rgba(255,255,255,.08); --edu-line:#ffffff18; --edu-year-bg: var(--accent2); --edu-year-fg:#111; --edu-year-line:#00000022;}
  [data-dark="1"] .section[data-edu-tone]{--edu-bg:#0e1324; --edu-line:#1c2646; --edu-year-bg: var(--accent); --edu-year-fg:#111; --edu-year-line:#00000022;}
  [data-mat="paper"] .section[data-edu-tone]{--edu-bg:#fff; --edu-line:rgba(0,0,0,.08); --edu-year-bg: var(--accent); --edu-year-fg:#111; --edu-year-line:#00000012;}

  /* if theme is too dark on chip, switch to white text */
  body[data-theme="grayBlack"] .edu-card .top .year,
  body[data-theme="magentaPurple"][data-dark="1"] .edu-card .top .year{color:#fff}

  /* ---- experience cards (same as canvas pink/neutral tint) ---- */
  .exp-grid{display:grid;gap:12px}
  .exp-card{position:relative;border-radius:12px;padding:12px;border:1px solid var(--exp-line);background:var(--exp-bg);box-shadow:0 10px 24px rgba(0,0,0,.18)}
  .exp-card .row{display:flex;align-items:center;gap:10px;margin-bottom:4px}
  .exp-card .when{font-weight:800}
  .exp-card .role{font-weight:900}
  .exp-card .org{opacity:.9}
  .exp-card .desc{opacity:.95;margin-top:4px}
  /* tone vs theme */
  .section[data-exp-tone]{--exp-bg:#ffe6f1; --exp-line:#ffc2da;}
  [data-dark="1"] .section[data-exp-tone]{--exp-bg:#2a1c29; --exp-line:#4b2b43;}
  [data-mat="paper"] .section[data-exp-tone]{--exp-bg:#fff0f6; --exp-line:#ffd0e6;}

  /* ---- anchored add menu ---- */
  .add-menu{position:fixed;z-index:30000;display:grid;gap:8px;padding:10px;background:#0c1223;border:1px solid #28335b;border-radius:12px;box-shadow:0 26px 90px rgba(0,0,0,.55)}
  [data-mat="paper"] .add-menu{background:#fff;border:1px solid rgba(0,0,0,.12)}
  .add-menu .itm{display:flex;gap:8px;align-items:center;cursor:pointer;border-radius:8px;padding:8px 10px}
  .add-menu .itm:hover{background:#19233f}
  [data-mat="paper"] .add-menu .itm:hover{background:#f5f6fb}
  .add-menu .itm i{width:16px;text-align:center;color:var(--accent)}

  /* ---- sparkle + plus twinkle ---- */
  @keyframes twinkle {
    0%{transform:translate(0,0) scale(1); opacity:.2}
    50%{opacity:1}
    100%{transform:translate(var(--dx), var(--dy)) scale(0.6); opacity:0}
  }
  .twinkle-wrap{display:grid;place-items:center;height:92px;border:1px dashed #2b3458;border-radius:12px;position:relative;overflow:hidden}
  .twinkle-wrap .added{font-weight:900;letter-spacing:.3px}
  .twinkle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}
  .twinkle .p{position:absolute;font-weight:900;color:#26d07c;filter:drop-shadow(0 6px 16px rgba(0,0,0,.45))}
  .twinkle .s{position:absolute;color:#ffd166;filter:drop-shadow(0 6px 16px rgba(0,0,0,.45))}
  `;
  document.head.appendChild(st);
})();

/* ============================================================
   Helpers
   ============================================================ */
const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));

function ensureSection(kind, title, icon){
  const root = (isSidebarActive() && kind==='skills' && S?.skillsToRail!==false) ? (getRailHolder() || getSideMain()) : getSideMain();
  let box = root.querySelector(`[data-module="${kind}"]`);
  if (!box){
    box = document.createElement('div');
    box.className = `section module-${kind}`;
    box.setAttribute('data-module', kind);
    if (kind==='education') box.setAttribute('data-edu-tone','');
    if (kind==='experience') box.setAttribute('data-exp-tone','');
    box.innerHTML = `
      <div class="s-head"><i class="${icon}"></i><div class="s-title">${title}</div></div>
      <div class="s-body"></div>`;
    // for sidebar layout, sections in main should span full width (layout code already handles)
    const addNode = $('#canvasAdd') || ensureCanvas().add;
    const parent = addNode?.parentElement || root;
    parent.insertBefore(box, addNode || null);
  }
  return box.querySelector('.s-body');
}

function makeStars(n){
  const wrap = document.createElement('span');
  wrap.className = 'stars';
  for(let i=1;i<=5;i++){
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox','0 0 24 24'); s.classList.add('star'); if (i<=n) s.classList.add('on');
    s.innerHTML = `<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21Z"/>`;
    wrap.appendChild(s);
  }
  return wrap;
}

function sparkleAdded(container){
  // Container gets a fancy twinkle for ~1s
  container.innerHTML = `
    <div class="twinkle-wrap">
      <div class="added">Added</div>
      <div class="twinkle"></div>
    </div>`;
  const tw = container.querySelector('.twinkle');
  const count = 14;
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    const isPlus = Math.random() > .5;
    el.className = isPlus ? 'p' : 's';
    el.textContent = isPlus ? '+' : '✶';
    const ang = Math.random()*Math.PI*2;
    const rad = 40 + Math.random()*80;
    const dx = Math.cos(ang)*rad, dy=Math.sin(ang)*rad;
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);
    el.style.left = '0px'; el.style.top = '0px';
    el.style.animation = `twinkle ${600+Math.random()*500}ms ease-out ${Math.random()*200}ms forwards`;
    tw.appendChild(el);
  }
  setTimeout(()=> container.innerHTML = '', 1200);
}

/* ============================================================
   Public: openAddMenu (anchored above big dotted plus)
   ============================================================ */
export function openAddMenu(anchor){
  const old = document.querySelector('.add-menu'); old?.remove();

  const r = anchor.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'add-menu';
  menu.innerHTML = `
    <div class="itm" data-k="exp"><i class="fa-solid fa-briefcase"></i><span>Add experience</span></div>
    <div class="itm" data-k="edu-course"><i class="fa-solid fa-scroll"></i><span>Add course</span></div>
    <div class="itm" data-k="edu-degree"><i class="fa-solid fa-graduation-cap"></i><span>Add degree</span></div>
    <div class="itm" data-k="skills"><i class="fa-solid fa-layer-group"></i><span>Add skills</span></div>
    <div class="itm" data-k="bio"><i class="fa-solid fa-user-pen"></i><span>Add bio</span></div>`;
  document.body.appendChild(menu);

  // center above the + squircle
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  const cx = r.left + r.width/2;
  const top = Math.max(12, r.top - mh - 12);
  menu.style.left = `${Math.max(12, cx - mw/2)}px`;
  menu.style.top  = `${top}px`;

  const close = (e)=>{
    if (!menu.contains(e.target) && e.target!==anchor){ menu.remove(); document.removeEventListener('mousedown', close); }
  };
  document.addEventListener('mousedown', close);

  // wire items
  menu.addEventListener('click', (e)=>{
    const it = e.target.closest('.itm'); if(!it) return;
    const k = it.dataset.k;
    if (k==='exp') renderExp([{ dates:'Jan 2024 – Present', role:'Job title', org:'@Company', desc:'Describe impact, scale and results.' }]);
    if (k==='edu-course') renderEdu([{ kind:'course', title:'Course', dates:'2018–2022', academy:'Academy' }]);
    if (k==='edu-degree') renderEdu([{ kind:'degree', title:'Degree', dates:'2018–2022', academy:'Academy' }]);
    if (k==='skills') renderSkills([{type:'star',label:'Skill',stars:3},{type:'slider',label:'Skill',value:60}], { toRail:true });
    if (k==='bio') renderBio('Add a short summary of your profile, strengths and what you’re looking for.');
    menu.remove();
  });
}

/* ============================================================
   Public: Skills
   ============================================================ */
export function renderSkills(items, opts={}){
  // remember rail choice for later calls
  if (typeof opts.toRail === 'boolean') S.skillsToRail = !!opts.toRail;

  const body = ensureSection('skills','Skills','fa-solid fa-layer-group');
  body.classList.add('sk-body');

  // create rows
  items.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'sk-row';
    row.setAttribute('data-editing','1'); // editing chrome by default while building

    const label = document.createElement('div');
    label.className = 'sk-label';
    label.textContent = it.label || 'Skill';

    const right = document.createElement('div');
    if (it.type === 'star'){
      right.appendChild(makeStars(it.stars||0));
    } else {
      const input = document.createElement('input');
      input.type='range'; input.min='0'; input.max='100'; input.value = String(it.value ?? 60);
      input.className='slider';
      right.appendChild(input);
    }

    // floating chrome (doesn't affect layout)
    const drag = document.createElement('div'); drag.className='drag'; drag.innerHTML='⋮⋮';
    const kill = document.createElement('div'); kill.className='kill'; kill.textContent='×';
    kill.onclick = ()=> row.remove();

    row.append(label, right, drag, kill);
    body.appendChild(row);
  });
}

/* ============================================================
   Public: Education
   ============================================================ */
export function renderEdu(items){
  const body = ensureSection('education','Education','fa-solid fa-graduation-cap');

  // ensure grid container
  let grid = body.querySelector('.edu-grid');
  if(!grid){ grid = document.createElement('div'); grid.className='edu-grid'; body.appendChild(grid); }

  items.forEach(it=>{
    const card = document.createElement('div');
    card.className='edu-card';
    card.innerHTML = `
      <div class="top">
        <i class="fa-solid ${it.kind==='degree'?'fa-graduation-cap':'fa-scroll'}"></i>
        <div class="year">${it.dates || '2018–2022'}</div>
      </div>
      <div class="title">${it.title || (it.kind==='degree'?'Degree':'Course')}</div>
      <div class="academy">${it.academy || 'Academy'}</div>`;
    grid.appendChild(card);
  });
}

/* ============================================================
   Public: Experience (+ sparkle handoff when adding from wizard)
   ============================================================ */
export function renderExp(items){
  const body = ensureSection('experience','Work experience','fa-solid fa-briefcase');
  body.classList.add('exp-grid');

  if (items && items.__sparkleTarget){ // internal hook
    sparkleAdded(items.__sparkleTarget);
  }

  items.forEach(d=>{
    const c = document.createElement('div');
    c.className = 'exp-card';
    c.innerHTML = `
      <div class="row">
        <div class="when badge"><i class="fa-solid fa-bars"></i>${d.dates || 'Jan 2024 – Present'}</div>
        <div class="role">${d.role || 'Job title'}</div>
      </div>
      <div class="org">${d.org || '@Company'}</div>
      <div class="desc">${d.desc || 'Describe impact, scale and results.'}</div>`;
    body.appendChild(c);
  });
}

/* ============================================================
   Public: Bio
   ============================================================ */
export function renderBio(text){
  const body = ensureSection('bio','Profile','fa-solid fa-id-badge');
  body.innerHTML = `<div style="white-space:pre-wrap">${text || ''}</div>`;
}
