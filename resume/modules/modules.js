// /resume/modules/modules.js
// [modules.js] v2.5
// - Horizontal icon-only Add menu (dark, centered above the + squircle)
// - openAddMenu export (used by editor.js)
// - renderSkills/ renderEdu/ renderExp/ renderBio exports (used by wizard.js)
// - Skills {toRail:true} places the module in the Sidebar rail
// - Chip tools: quick add + reorder mode for header chips
console.log('[modules.js] v2.5');
import { S } from '../app/state.js';
import {
  getRailHolder,
  getSideMain,
  ensureAddAnchor,
  applyContact,
  restyleContactChips
} from '../layouts/layouts.js';

/* -------------------------------------------------------------------------- */
/*  Minimal styles this file needs                                            */
/* -------------------------------------------------------------------------- */
(function ensureStyles(){
  if (document.getElementById('modules-v320')) return;
  const st = document.createElement('style'); st.id = 'modules-v320';
  st.textContent = `
  /* add menu (icon-only, horizontal) */
  #addMenu{position:fixed;inset:0;display:none;place-items:center;background:transparent;z-index:30000}
  #addMenu.open{display:grid}
  #addMenu .tray{position:absolute;transform:translate(-50%,-14px);display:flex;gap:10px;
    background:#0c1328;border:1px solid #1f2540;border-radius:999px;padding:8px 10px;box-shadow:0 22px 50px rgba(0,0,0,.45)}
  #addMenu .item{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;cursor:pointer;
    color:#e6ecff;border:1px solid #223059}
  #addMenu .item:hover{background:#121a33}
  #addMenu .item i{font-size:16px}

  /* chip toolbar (small row above + in rail) */
  .chip-tools{position:absolute;left:50%;transform:translate(-50%,-8px);display:flex;gap:8px;
    background:#0c1328;border:1px solid #1f2540;border-radius:999px;padding:6px 8px;box-shadow:0 16px 40px rgba(0,0,0,.35)}
  .chip-tools .ct-btn{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;color:#e6ecff;border:1px solid #223059;cursor:pointer}
  .chip-tools .ct-btn:hover{background:#121a33}
  .chip-drag{outline:2px dashed #7c99ff77;border-radius:999px}

  /* skill item edit affordances (float, don't alter layout width) */
  .sk-item{position:relative}
  .sk-item .sk-float{position:absolute;top:-8px;display:flex;gap:8px;align-items:center}
  .sk-item .sk-float .h{left:-22px}
  .sk-item .sk-float .x{right:-22px}
  .sk-stars{display:inline-flex;gap:6px;vertical-align:middle}
  .sk-stars svg{width:12px;height:12px;fill:#8a95b8}
  .sk-stars svg.on{fill:#f5b301}
  .sk-slider{width:90px;vertical-align:middle}

  /* year chips tint (not forced dark) */
  .year-chip{display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;
    border:1px solid #00000014;color:#111;font-weight:800}
  [data-dark="1"] .year-chip{color:#0b1224}
  .edu-card{border-radius:14px;border:1px solid #00000012;padding:10px 12px}
  [data-dark="1"] .edu-card{border-color:#ffffff1e}

  /* small helpers for sections */
  .section{border-radius:14px;background:var(--sec-bg,#fff);border:1px solid var(--sec-br,#0000);padding:12px}
  [data-dark="1"] .section{--sec-bg:#0f1420;--sec-br:#1f2540}
  .section .sec-hd{display:flex;gap:8px;align-items:center;font-weight:900}
  .section .sec-hd i{color:var(--accent)}
  .section .body{margin-top:8px;display:grid;gap:8px}
  `;
  document.head.appendChild(st);
})();

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function hostFor(opts={}) {
  // In Sidebar layout, toRail:true -> left rail; otherwise right/main column
  if (opts.toRail) {
    const rail = getRailHolder();
    if (rail) return rail;
  }
  return getSideMain();
}

function makeSection(kind, title, icon){
  let sec = document.querySelector(`.module[data-kind="${kind}"]`);
  if (!sec){
    sec = document.createElement('div');
    sec.className = 'module section';
    sec.setAttribute('data-kind', kind);
    sec.innerHTML = `<div class="sec-hd"><i class="${icon}"></i><span>${title}</span></div><div class="body"></div>`;
    hostFor().insertBefore(sec, document.getElementById('canvasAdd'));
    ensureAddAnchor(true);
  }
  return sec;
}

function tintChip(el){
  const cs = getComputedStyle(document.documentElement);
  const a1 = cs.getPropertyValue('--accent').trim() || '#8b5cf6';
  const a2 = cs.getPropertyValue('--accent2').trim() || '#d946ef';
  el.style.background = `linear-gradient(135deg, ${a2}22, ${a1}22)`;
  el.style.borderColor = `${a1}55`;
}

function svgStar(on=false){
  return `<svg viewBox="0 0 24 24" ${on?'class="on"':''}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
}

/* -------------------------------------------------------------------------- */
/*  RENDERERS (used by wizard + add menu)                                     */
/* -------------------------------------------------------------------------- */

export function renderSkills(items=[], opts={}){
  const sec = makeSection('skills','Skills','fa-solid fa-layer-group');
  const body = sec.querySelector('.body');
  body.innerHTML = '';

  items.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'sk-item';
    const name = document.createElement('span');
    name.textContent = it.label || 'Skill';
    name.style.display='inline-block';
    name.style.width='66%';

    let right;
    if (it.type === 'star'){
      right = document.createElement('span');
      right.className = 'sk-stars';
      right.innerHTML = [1,2,3,4,5].map(i => svgStar(i<=(+it.stars||0))).join('');
    } else {
      right = document.createElement('input');
      right.type='range'; right.min=0; right.max=100;
      right.value = +it.value||60; right.className='sk-slider';
    }

    const wrap = document.createElement('div');
    wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='space-between';
    wrap.appendChild(name); wrap.appendChild(right);
    row.appendChild(wrap);

    // floating edit affordances (don't consume layout width)
    const fl = document.createElement('div');
    fl.className='sk-float';
    fl.style.position='absolute'; fl.style.left='-22px'; fl.style.right='-22px'; fl.style.top='-8px'; fl.style.display='flex'; fl.style.justifyContent='space-between';
    fl.innerHTML = `
      <span class="h" title="Drag" style="cursor:grab"><i class="fa-solid fa-grip-vertical"></i></span>
      <span class="x" title="Delete" style="cursor:pointer"><i class="fa-solid fa-xmark"></i></span>`;
    fl.querySelector('.x').onclick = ()=> row.remove();
    row.appendChild(fl);

    body.appendChild(row);
  });

  // if requested to rail and we're not in rail yet, move it
  if (opts.toRail){
    const rail = hostFor({toRail:true});
    if (rail && sec.parentElement!==rail){
      rail.insertBefore(sec, rail.querySelector(':scope > *') || null);
      ensureAddAnchor(true);
    }
  }

  return sec;
}

export function renderEdu(items=[]){
  const sec = makeSection('education','Education','fa-solid fa-graduation-cap');
  const body = sec.querySelector('.body');
  body.innerHTML = '';

  items.forEach(it=>{
    const card = document.createElement('div');
    card.className='edu-card';
    const chip = document.createElement('span');
    chip.className='year-chip';
    chip.innerHTML = `<i class="fa-solid ${it.kind==='degree'?'fa-graduation-cap':'fa-scroll'}"></i> ${it.dates||'2018–2022'}`;
    tintChip(chip);

    const t = document.createElement('div');
    t.style.marginTop='8px';
    t.innerHTML = `
      <div style="font-weight:800">${it.title||''}</div>
      <div style="opacity:.8">${it.academy||''}</div>
    `;

    card.appendChild(chip);
    card.appendChild(t);
    body.appendChild(card);
  });

  return sec;
}

export function renderExp(items=[]){
  const sec = makeSection('experience','Work experience','fa-solid fa-briefcase');
  const body = sec.querySelector('.body');
  items.forEach(it=>{
    const card = document.createElement('div');
    card.className='edu-card';
    const chip = document.createElement('span');
    chip.className='year-chip';
    chip.innerHTML = `<i class="fa-solid fa-bars-staggered"></i> ${it.dates||''}`;
    tintChip(chip);

    const t = document.createElement('div');
    t.style.marginTop='8px';
    t.innerHTML = `
      <div style="font-weight:800">${it.role||'Job title'}</div>
      <div style="opacity:.85">@${(it.org||'Company').replace(/^@/,'')}</div>
      <div style="margin-top:4px">${it.desc||''}</div>
    `;
    card.appendChild(chip);
    card.appendChild(t);
    body.appendChild(card);
  });
  return sec;
}

export function renderBio(text=''){
  const sec = makeSection('bio','Profile','fa-solid fa-user');
  sec.querySelector('.body').innerHTML = `<div>${text||''}</div>`;
  return sec;
}

/* -------------------------------------------------------------------------- */
/*  ADD MENU (icon-only horizontal, dark)                                     */
/* -------------------------------------------------------------------------- */

export function openAddMenu(anchorEl){
  const pop = document.getElementById('addMenu');
  const tray = document.getElementById('addTray');
  if(!pop || !tray) return;

  // build items (icon-only)
  tray.innerHTML = [
    {k:'skills',  ic:'fa-layer-group', tip:'Skills'},
    {k:'education', ic:'fa-graduation-cap', tip:'Education'},
    {k:'experience',ic:'fa-briefcase', tip:'Work'},
    {k:'bio', ic:'fa-user', tip:'Bio'},
  ].map(it=>`<div class="item" data-k="${it.k}" title="${it.tip}"><i class="fa-solid ${it.ic}"></i></div>`).join('');

  // position centered above the anchor (plus squircle)
  const r = anchorEl.getBoundingClientRect();
  tray.style.left = (r.left + r.width/2) + 'px';
  tray.style.top  = (r.top) + 'px';

  // open
  pop.classList.add('open');

  // close on outside
  const close = (ev)=>{ if (!tray.contains(ev.target)) { pop.classList.remove('open'); document.removeEventListener('mousedown', close, true); }};
  document.addEventListener('mousedown', close, true);

  tray.onclick = (e)=>{
    const k = e.target.closest('.item')?.dataset.k;
    if(!k) return;
    pop.classList.remove('open');

    if (k==='skills')      renderSkills([{type:'star',label:'Skill',stars:3},{type:'slider',label:'Skill',value:60}], { toRail:false });
    else if (k==='education') renderEdu([{kind:'course',title:'',dates:'2018–2022',academy:''}]);
    else if (k==='experience') renderExp([{dates:'Jan 2024 – Present',role:'Job title',org:'Company',desc:'Describe impact, scale and results.'}]);
    else if (k==='bio')       renderBio('Add a short summary of your profile, strengths and what you’re great at.');
  };
}

/* -------------------------------------------------------------------------- */
/*  CHIP TOOLS (above the + in rail; reorder + add basic chips)               */
/* -------------------------------------------------------------------------- */

(function mountChipTools(){
  const head = document.querySelector('[data-header]');
  if (!head) return;

  // place a tiny toolbar above the rail "+" area (only in sidebar layout)
  const rail = getRailHolder();
  if (!rail) return;

  // ensure the + anchor exists and is positioned by layouts
  const add = ensureAddAnchor(true);
  if (!add || add._chipTools) return;

  const bar = document.createElement('div');
  bar.className = 'chip-tools';
  bar.innerHTML = `
    <div class="ct-btn" title="Add phone"><i class="fa-solid fa-phone"></i></div>
    <div class="ct-btn" title="Add email"><i class="fa-solid fa-envelope"></i></div>
    <div class="ct-btn" title="Add location"><i class="fa-solid fa-location-dot"></i></div>
    <div class="ct-btn" title="Add LinkedIn"><i class="fa-brands fa-linkedin"></i></div>
    <div class="ct-btn" id="ctRe" title="Reorder"><i class="fa-solid fa-up-down-left-right"></i></div>
  `;
  add.appendChild(bar);
  add._chipTools = true;

  // add handlers (basic insert at end)
  const c = S.contact || (S.contact={});
  const ensure = ()=>{ applyContact(); restyleContactChips(); };

  bar.children[0].onclick = ()=>{ c.phone   = c.phone   || '000 000 000'; ensure(); };
  bar.children[1].onclick = ()=>{ c.email   = c.email   || 'user@email.com'; ensure(); };
  bar.children[2].onclick = ()=>{ c.address = c.address || 'City, Country'; ensure(); };
  bar.children[3].onclick = ()=>{ c.linkedin= c.linkedin|| 'username'; ensure(); };

  // reorder mode (drag chips within header chips containers)
  let on = false;
  bar.querySelector('#ctRe').onclick = ()=>{
    on = !on;
    const holders = head.querySelectorAll('.chips');
    holders.forEach(h=>{
      h.querySelectorAll('.chip').forEach(ch=>{
        ch.setAttribute('draggable', on?'true':'false');
        ch.classList.toggle('chip-drag', on);
      });
      if (on && !h._drag){
        h._drag = true;
        let dragEl=null;
        h.addEventListener('dragstart', e=>{ const it=e.target.closest('.chip'); if(!it) return; dragEl=it; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain','');}catch(_){}})
        h.addEventListener('dragover', e=>{
          if(!dragEl) return; e.preventDefault();
          const after = Array.from(h.querySelectorAll('.chip')).filter(x=>x!==dragEl)
            .reduce((c,ch)=>{const b=ch.getBoundingClientRect(); const off=e.clientX-b.left-b.width/2; return off<0 && off>c.o?{o:off,el:ch}:c;},{o:-1e9}).el;
          if(!after) h.appendChild(dragEl); else h.insertBefore(dragEl, after);
        });
        h.addEventListener('dragend', ()=> dragEl=null);
      }
    });
  };
})();
