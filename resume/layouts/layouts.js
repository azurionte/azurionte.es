// /resume/layouts/layouts.js
// [layouts.js] v2.2.2
console.log('[layouts.js] v2.2.2');

import { S } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

(function ensureLayoutStyles(){
  if (document.getElementById('layouts-style')) return;
  const st = document.createElement('style');
  st.id = 'layouts-style';
  st.textContent = `
    /* ---- Sidebar header grid ---- */
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
      min-height:1060px;
      position:relative;
    }
    .sidebar-layout .rail .name{font-weight:900;font-size:26px;text-align:center}
    .sidebar-layout .rail .chips{display:flex;flex-direction:column;gap:8px;width:100%}
    .sidebar-layout .rail .sec-holder{width:100%;padding-top:6px}

    /* right column as mini canvas grid */
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
    }

    /* ---- Top bar header ---- */
    .topbar{position:relative;border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px;min-height:160px}
    .topbar-grid{display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px}
    .topbar .name{font-weight:900;font-size:34px;margin:0;text-align:left}
    .topbar .right{display:flex;justify-content:flex-end}

    /* ---- Fancy header ---- */
    .fancy{position:relative;border-radius:14px}
    .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center}
    .fancy .name{font-weight:900;font-size:34px;margin:0;text-align:center}
    .fancy .chip-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:72px;row-gap:10px;margin:8px auto 0;max-width:740px}
    .fancy .avatar-float{position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:140px;z-index:30}
    .fancy .below{height:88px}

    /* ---- avatar shell ---- */
    .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px}
    .avatar input{display:none}
    .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}

    /* ---- chips baseline ---- */
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chip{display:flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08)}
    .chip i{width:16px;text-align:center}
  `;
  document.head.appendChild(st);
})();

/* --------------------------------------------------------------- */
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

/* avatar loading (unchanged) */
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

/* chips + contact (unchanged except export names already present) */
function chip(icon, text){
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  el.style.borderRadius = '999px';
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

/* build + morph (unchanged) */
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

/* place the "+" in the correct host (stack or sidebar main) */
export function ensureAddAnchor(show){
  const add = $('#canvasAdd'); if(!add) return null;
  const stack = stackEl();
  const main = getSideMain();
  const host = isSidebarActive() ? (main || stack) : stack;

  if (host && add.parentElement !== host) host.appendChild(add);
  if(typeof show==='boolean') add.style.display=show?'flex':'none';
  return add;
}
