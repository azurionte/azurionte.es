// /resume/layouts/layouts.js
// [layouts.js] v2.3.1 — full-width/height canvas + sidebar chip tools + safe morph
console.log('[layouts.js] v2.3.1');

import { S } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* --------------------------------------------------------------- */
/* styles                                                          */
/* --------------------------------------------------------------- */
(function ensureLayoutStyles(){
  if (document.getElementById('layouts-style')) return;
  const st = document.createElement('style');
  st.id = 'layouts-style';
  st.textContent = `
    /* Page + sheet expand and never crop content */
    .page{min-height:100vh; padding:18px}
    #sheet{width:100%; max-width:1120px; margin:0 auto}
    #stack{
      display:grid;
      grid-template-columns:minmax(0,1fr);
      gap:16px;
      padding-bottom:160px;       /* room for "+" anchor */
      min-height:60vh;
      align-content:start;
    }
    #stack .node,
    #stack .section,
    #stack .module,
    #stack #canvasAdd{
      width:100%;
      max-width:none !important;
      box-sizing:border-box;
    }

    /* Sidebar header grid */
    .sidebar-layout{
      display:grid;
      grid-template-columns: var(--rail) minmax(0,1fr);
      gap:16px;
      min-height:320px;
      align-items:start;
    }
    .sidebar-layout .rail{
      background:linear-gradient(135deg,var(--accent2),var(--accent));
      border-radius:14px;
      padding:18px 14px;
      display:flex;flex-direction:column;gap:12px;align-items:center;
      min-height:100%;
      align-self:stretch;
      position:relative;
    }
    .sidebar-layout .rail .name{font-weight:900;font-size:26px;text-align:center}
    .sidebar-layout .rail .chips{display:flex;flex-direction:column;gap:8px;width:100%}
    .sidebar-layout .rail .sec-holder{width:100%;padding-top:6px}

    /* Right column behaves as mini canvas */
    .sidebar-layout [data-zone="main"]{
      display:grid;
      grid-template-columns: repeat(12, minmax(0,1fr));
      gap:16px;
      align-content:start;
      min-height:100%;
      min-width:0;
    }
    .sidebar-layout [data-zone="main"] > .node,
    .sidebar-layout [data-zone="main"] > .section,
    .sidebar-layout [data-zone="main"] > .module,
    .sidebar-layout [data-zone="main"] > #canvasAdd{
      grid-column: 1 / -1;
      width:100%;
      max-width:none !important;
      box-sizing:border-box;
    }

    /* Top bar */
    .topbar{position:relative;border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px;min-height:160px}
    .topbar-grid{display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px}
    .topbar .name{font-weight:900;font-size:34px;margin:0;text-align:left}
    .topbar .right{display:flex;justify-content:flex-end}

    /* Fancy */
    .fancy{position:relative;border-radius:14px}
    .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center}
    .fancy .name{font-weight:900;font-size:34px;margin:0;text-align:center}
    .fancy .chip-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:72px;row-gap:10px;margin:8px auto 0;max-width:740px}
    .fancy .avatar-float{position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:140px;z-index:30}
    .fancy .below{height:88px}

    /* Avatar */
    .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px}
    .avatar input{display:none}
    .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}

    /* Chips baseline + edit affordances */
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chip{display:flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08); position:relative}
    .chip i{width:16px;text-align:center}
    .chip .handle{display:none; position:absolute; left:-18px; top:50%; transform:translateY(-50%); font-weight:900; cursor:grab}
    .chip .x{display:none; position:absolute; right:-12px; top:-10px; width:20px; height:20px; border-radius:50%; background:#111; color:#fff; font-weight:900; line-height:18px; text-align:center; cursor:pointer}

    .chip-tools{display:flex;gap:6px; margin-top:6px}
    .chip-tools .btn{appearance:none;border:1px solid #2b324b;border-radius:10px;padding:6px 9px;background:#12182a;color:#e6e8ef;cursor:pointer}

    .chips.edit .chip{padding-left:18px}
    .chips.edit .chip .handle,
    .chips.edit .chip .x{display:block}
  `;
  document.head.appendChild(st);
})();

/* --------------------------------------------------------------- */
/* helpers                                                         */
/* --------------------------------------------------------------- */
function stackEl(){ return $('#stack'); }

/** Create canvas if missing and expose both stack and addWrap */
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
  ensureAddAnchor();
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
  if (isSidebarActive() && head){
    return head.querySelector('[data-zone="main"]');
  }
  return $('#stack');
}

/* --------------------------------------------------------------- */
/* avatar loading                                                  */
/* --------------------------------------------------------------- */
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

/* --------------------------------------------------------------- */
/* chips + contact                                                 */
/* --------------------------------------------------------------- */
function chip(icon, text){
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span><span class="handle">⋮⋮</span><span class="x">×</span>`;
  el.style.borderRadius = '999px';
  el.setAttribute('draggable','true');
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

function enableChipToolbar(){
  const head=getHeaderNode(); if(!head) return;
  const holders=[ head.querySelector('[data-info]'),
                  head.querySelector('[data-info-left]'),
                  head.querySelector('[data-info-right]') ].filter(Boolean);
  if(!holders.length) return;

  // toolbar only once per first holder
  let tools = head.querySelector('.chip-tools');
  if(!tools){
    tools = document.createElement('div');
    tools.className='chip-tools';
    tools.innerHTML = `
      <button class="btn" data-k="edit"><i class="fa-solid fa-up-down-left-right"></i> Reorder</button>
      <button class="btn" data-k="add"><i class="fa-solid fa-plus"></i> Add</button>
    `;
    holders[0].insertAdjacentElement('afterend', tools);

    tools.querySelector('[data-k="edit"]').onclick = ()=>{
      holders.forEach(h=> h.classList.toggle('edit'));
    };
    tools.querySelector('[data-k="add"]').onclick = ()=>{
      const txt = prompt('Label (e.g., portfolio.com/me):'); if(!txt) return;
      const icon = prompt('FontAwesome class (e.g., fa-solid fa-link):','fa-solid fa-link') || 'fa-solid fa-link';
      const el = chip(icon, txt);
      holders[0].appendChild(el); hookChipDnD(holders[0]);
      holders.forEach(h=> styleOneChip(el));
    };
  }

  holders.forEach(h=>{
    h.addEventListener('click', e=>{
      const x = e.target.closest('.x'); if(x){ x.parentElement.remove(); }
    });
    hookChipDnD(h);
  });
}
function hookChipDnD(container){
  if(container._chipDnD) return; container._chipDnD = true;
  let dragEl=null;
  container.addEventListener('dragstart', e=>{
    const it=e.target.closest('.chip'); if(!it) return;
    if(!container.classList.contains('edit')){ e.preventDefault(); return; }
    dragEl=it; e.dataTransfer.effectAllowed='move';
    try{ e.dataTransfer.setData('text/plain',''); }catch(_){}
    setTimeout(()=> it.style.opacity='.35',0);
  });
  container.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; dragEl=null; }});
  container.addEventListener('dragover', e=>{
    if(!dragEl) return; e.preventDefault();
    const els = $$('.chip', container).filter(x=>x!==dragEl);
    const after = els.reduce((c,ch)=>{ const b=ch.getBoundingClientRect(); const off=e.clientY - (b.top+b.height/2); return (off<0 && off>c.o)?{o:off,el:ch}:c; },{o:-1e9}).el;
    if(!after) container.appendChild(dragEl); else container.insertBefore(dragEl, after);
  });
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
  enableChipToolbar();
}

/* --------------------------------------------------------------- */
/* build headers + morph                                           */
/* --------------------------------------------------------------- */
function buildHeader(kind){
  const node=document.createElement('div');
  node.className='node';
  node.setAttribute('data-locked','1');

  if(kind==='header-side'){
    node.innerHTML=`
      <div class="sidebar-layout" data-header data-hero="side">
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1">
            <input type="file" accept="image/*" style="display:none">
          </label>
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
        <div class="avatar-float"><label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*" style="display:none"></label></div>
        <div class="below"></div>
      </div>`;
  }
  if(kind==='header-top'){
    node.innerHTML=`
      <div class="topbar" data-header>
        <div class="topbar-grid">
          <div class="left">
            <h1 class="name" contenteditable>YOUR NAME</h1>
            <div class="chips" data-info></div>
          </div>
          <div class="right">
            <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px">
              <input type="file" accept="image/*" style="display:none">
            </label>
          </div>
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

export function morphTo(kind){
  const oldWrap=getHeaderNodeWrapper();
  const before=oldWrap?.getBoundingClientRect();
  const temp=buildHeader(kind);
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

/* --------------------------------------------------------------- */
export function ensureAddAnchor(show){
  const s=stackEl(), add=$('#canvasAdd');
  if(!s || !add) return null;
  if(add.parentElement!==s) s.appendChild(add);
  if(typeof show==='boolean') add.style.display=show?'flex':'none';
  return add;
}
