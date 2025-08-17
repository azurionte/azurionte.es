// /resume/layouts/layouts.js
// [layouts.js] v2.5.0 — canvas hosts + contact chips + rehome on morph
console.log('[layouts.js] v2.5.0');

import { S } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

(function ensureLayoutStyles(){
  if (document.getElementById('layouts-style')) return;
  const st = document.createElement('style');
  st.id = 'layouts-style';
  st.textContent = `
    .page{display:grid;place-items:start;padding:28px}
    #sheet{width:860px;background:#fff;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.25);padding:22px}
    .stack{display:grid;gap:16px;align-content:start}
    .add-squircle{width:172px;height:108px;border:2px dashed #a6b0ff55;border-radius:16px;display:none;align-items:center;justify-content:center;position:relative}
    .add-dot{width:40px;height:40px;border-radius:12px;background:#0b1022;color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    /* Sidebar layout */
    .sidebar-layout{
      display:grid;grid-template-columns: 300px minmax(0,1fr);gap:18px;align-items:start
    }
    .sidebar-layout .rail{
      background:linear-gradient(180deg,var(--accent2),var(--accent));border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;min-height:920px;position:relative
    }
    .sidebar-layout [data-zone="main"]{
      display:grid;grid-template-columns: repeat(12,minmax(0,1fr));gap:16px;align-content:start;min-width:0
    }
    .sidebar-layout [data-zone="main"] > .section,
    .sidebar-layout [data-zone="main"] > #canvasAdd{ grid-column: 1 / -1; width:100%; max-width:none !important }

    /* Header variants */
    .topbar{border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px}
    .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center}

    /* Avatar + chips */
    .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px}
    .avatar input{display:none}
    .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}

    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chip{display:flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08)}
    .chip i{width:16px;text-align:center}
    .chip[contenteditable="true"]{outline:none}
  `;
  document.head.appendChild(st);
})();

/* ========== Canvas bootstrap ========== */
function stackEl(){ return $('#stack'); }

export function ensureCanvas(){
  if (!$('#stack')){
    const root = $('#canvas-root') || document.body;
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = `
      <div id="sheet">
        <div id="stack" class="stack">
          <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
        </div>
      </div>`;
    root.appendChild(page);
  }
  ensureAddAnchor(true);
  return { stack: $('#stack'), addWrap: $('#canvasAdd'), add: $('#canvasAdd') };
}

export function getHeaderNode(){ return $('[data-header]'); }
function getHeaderNodeWrapper(){ return getHeaderNode()?.closest('.node') || null; }

export function isSidebarActive(){
  const head = getHeaderNode();
  return (S.layout === 'side') || !!head?.closest('.sidebar-layout');
}

export function getRailHolder(){
  const head = getHeaderNode();
  if (!head) return null;
  if (head.closest('.sidebar-layout')) return head.querySelector('[data-rail-sections]');
  return null;
}

export function getSideMain(){
  const head = getHeaderNode();
  if (isSidebarActive() && head) return head.querySelector('[data-zone="main"]');
  return stackEl();
}

/* Avatar */
function initAvatars(root){
  $$('[data-avatar]', root).forEach(w=>{
    if (w._inited) return; w._inited = true;
    const input = w.querySelector('input[type=file]');
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently:true });

    w.addEventListener('click', e=>{ if (e.target !== input) input.click(); });
    input.addEventListener('change', ()=>{
      const f = input.files?.[0]; if(!f) return;
      const img = new Image();
      img.onload = ()=>{
        const s = Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw=img.width*s, dh=img.height*s;
        const dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save(); ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
        ctx.clip(); ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,dx,dy,dw,dh);
        ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src = URL.createObjectURL(f);
    });
  });
}

/* Chips + contact */
function chip(icon, text){
  const el = document.createElement('div');
  el.className = 'chip';
  el.contentEditable = 'true';         // editable directly
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  return el;
}
function setChips(containers, items){
  containers.forEach(c=>c.innerHTML='');
  if (!items.length) return;
  if (containers.length === 1){
    items.forEach(it => containers[0].appendChild(it));
  } else {
    items.forEach((it,i)=> containers[i%2].appendChild(it));
  }
}
function styleOneChip(el){
  el.style.background=''; el.style.color=''; el.style.border=''; el.style.backdropFilter='';
  const isGlass=(S.mat==='glass'), isDark=!!S.dark;
  if (isGlass){
    el.style.background='rgba(255,255,255,.10)'; el.style.border='1px solid #ffffff28'; el.style.backdropFilter='blur(6px)';
    el.style.color=(['grayBlack','magentaPurple'].includes(S.theme)?'#fff':'#111');
  } else if (isDark){
    el.style.background='#0c1324'; el.style.border='1px solid #1f2a44'; el.style.color='#e6ecff';
  } else {
    el.style.background='#fff'; el.style.border='1px solid rgba(0,0,0,.08)'; el.style.color='#111';
  }
  const ic = el.querySelector('i'); if (ic) ic.style.color='var(--accent)';
}
export function restyleContactChips(scope=document){
  const head=getHeaderNode(); if(!head) return;
  $$('.chip', head).forEach(styleOneChip);
}
export function applyContact(){
  const head=getHeaderNode(); if(!head) return;
  const nm=head.querySelector('.name'); if(nm) nm.textContent=S?.contact?.name||'YOUR NAME';

  const c=S.contact||{}; const items=[];
  if(c.phone)   items.push(chip('fa-solid fa-phone', c.phone));
  if(c.email)   items.push(chip('fa-solid fa-envelope', c.email));
  if(c.address) items.push(chip('fa-solid fa-location-dot', c.address));
  if(c.linkedin)items.push(chip('fa-brands fa-linkedin','linkedin.com/in/'+c.linkedin));

  const holders=[ head.querySelector('[data-info]'),
                  head.querySelector('[data-info-left]'),
                  head.querySelector('[data-info-right]') ].filter(Boolean);
  setChips(holders, items);
  restyleContactChips();
}

/* Build headers + morph */
function buildHeader(kind){
  const node=document.createElement('div');
  node.className='node';
  node.setAttribute('data-locked','1');

  if(kind==='header-side'){
    node.innerHTML=`
      <div class="sidebar-layout" data-header data-hero="side">
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*"></label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main"></div>
      </div>`;
  }
  if(kind==='header-fancy'){
    node.innerHTML=`
      <div class="fancy" data-header>
        <div class="hero">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chip-grid"><div class="chips" data-info-left></div><div class="chips" data-info-right></div></div>
        </div>
        <div class="below"></div>
      </div>`;
  }
  if(kind==='header-top'){
    node.innerHTML=`
      <div class="topbar" data-header>
        <div style="display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center">
          <div>
            <h1 class="name" contenteditable>YOUR NAME</h1>
            <div class="chips" data-info></div>
          </div>
          <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px">
            <input type="file" accept="image/*">
          </label>
        </div>
      </div>`;
  }

  const s=stackEl();
  s.insertBefore(node, $('#canvasAdd'));
  initAvatars(node);

  S.layout=(kind==='header-side')?'side':(kind==='header-fancy')?'fancy':'top';
  if (S.theme) document.body.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-dark', S.dark?'1':'0');
  document.body.setAttribute('data-mat',  S.mat||'paper');

  ensureAddAnchor(true);
  applyContact();
  queueMicrotask(()=> document.dispatchEvent(new CustomEvent('layout:changed', { detail:{ kind:S.layout } })));
  return node;
}

/* ---- Re-home existing sections when layout changes ---- */
function adoptSectionsToCurrentLayout(){
  const main = getSideMain();       // [data-zone="main"] when side; else #stack
  const rail = getRailHolder();     // null unless side layout is active
  const plus = $('#canvasAdd');

  // Move any loose sections into main first
  const loose = Array.from(document.querySelectorAll('.section'))
    .filter(n => !main.contains(n) && (!rail || !rail.contains(n)));
  loose.forEach(n => main.insertBefore(n, plus || null));

  // Skills to rail if that choice was made
  if (rail && (S?.skillsInSidebar)){
    const skills = main.querySelector('.section[data-section="skills"]');
    if (skills) rail.appendChild(skills);
  }

  ensureAddAnchor(true);
}

export function morphTo(kind){
  const oldWrap=getHeaderNodeWrapper();
  const before=oldWrap?.getBoundingClientRect();
  const temp=buildHeader(kind);

  // NEW: immediately re-home any existing sections for the new layout
  adoptSectionsToCurrentLayout();

  const after=temp.getBoundingClientRect();

  if(before){
    const dx=before.left-after.left, dy=before.top-after.top;
    const sx=before.width/after.width, sy=before.height/after.height;
    temp.style.transformOrigin='top left';
    temp.style.transform=`translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    temp.style.opacity='0.6';
    oldWrap.remove();
    requestAnimationFrame(()=>{
      temp.style.transition='transform .35s ease, opacity .35s ease';
      temp.style.transform='translate(0,0) scale(1,1)';
      temp.style.opacity='1';
      setTimeout(()=>{temp.style.transition=''; temp.style.transform='';},380);
    });
  }else{
    ensureAddAnchor(true);
  }
}

/* ---- Add anchor owner (SINGLE SOURCE) ---- */
export function ensureAddAnchor(show){
  const s = isSidebarActive() ? getSideMain() : stackEl();
  const add = $('#canvasAdd');
  if(!s || !add) return null;
  if(add.parentElement!==s) s.appendChild(add);
  if(typeof show==='boolean') add.style.display=show?'flex':'none';
  return add;
}
