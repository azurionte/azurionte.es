// /resume/layouts/layouts.js
// Header creation + safe morphing + canvas helpers.

import { S } from '../app/state.js';

/* ---------------- canvas helpers ---------------- */
export function ensureCanvas(){
  const root  = document.getElementById('canvas-root');
  const page  = root.querySelector('.page');
  const sheet = page.querySelector('#sheet');
  const stack = sheet.querySelector('#stack');

  // ensure global "+" on the canvas
  let addWrap = stack.querySelector('#canvasAdd');
  if(!addWrap){
    addWrap = document.createElement('div');
    addWrap.id = 'canvasAdd';
    addWrap.className = 'add-squircle';
    addWrap.innerHTML = '<div class="add-dot" id="dotAdd">+</div>';
    stack.appendChild(addWrap);
  }

  // ensure floating add menu exists
  let addMenu = document.getElementById('addMenu');
  if(!addMenu){
    addMenu = document.createElement('div');
    addMenu.id = 'addMenu';
    addMenu.className = 'pop';
    addMenu.innerHTML = '<div class="tray" id="addTray"></div>';
    root.appendChild(addMenu);
  }
  const addTray = addMenu.querySelector('#addTray');
  const dotAdd  = addWrap.querySelector('#dotAdd');

  return { root,page,sheet,stack,addWrap,addMenu,addTray,dotAdd };
}

export const getHeaderNode = () =>
  document.querySelector('[data-header]')?.closest('.node') || null;

/* ---------------- header markup ---------------- */
function headerHTML(kind){
  if(kind==='header-side'){
    return `
      <div class="sidebar-layout" data-header>
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1">
            <input type="file" accept="image/*">
          </label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main"></div>
      </div>`;
  }
  if(kind==='header-fancy'){
    return `
      <div class="fancy" data-header>
        <div class="hero">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chip-grid">
            <div class="chips" data-info-left></div>
            <div class="chips" data-info-right></div>
          </div>
        </div>
        <div class="avatar-float">
          <label class="avatar" data-avatar data-empty="1">
            <input type="file" accept="image/*">
          </label>
        </div>
        <div class="below"></div>
      </div>`;
  }
  // header-top
  return `
    <div class="topbar" data-header>
      <div class="topbar-grid">
        <div class="left">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chips" data-info></div>
        </div>
        <div class="right">
          <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px">
            <input type="file" accept="image/*">
          </label>
        </div>
      </div>
    </div>`;
}

/* ---------------- avatar init ---------------- */
function initAvatars(root){
  root.querySelectorAll('[data-avatar]').forEach(w=>{
    const input = w.querySelector('input');
    if(w.querySelector('canvas')) return; // don’t duplicate

    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently:true });

    w.addEventListener('click', ()=> input.click());
    input.onchange = ()=>{
      const f = input.files?.[0]; if(!f) return;
      const img = new Image();
      img.onload = ()=>{
        const s  = Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw = img.width*s, dh = img.height*s;
        const dx = (canvas.width-dw)/2, dy = (canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
        ctx.clip();
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src = URL.createObjectURL(f);
    };
  });
}

/* ---------------- public API ---------------- */
export function morphTo(kind){
  const { stack, addWrap } = ensureCanvas();
  const old = getHeaderNode();
  const prevRect = old?.getBoundingClientRect();

  if(old) old.remove();

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.locked = '1';
  node.innerHTML = headerHTML(kind);

  // SAFE INSERT: if addWrap is not inside stack, just append.
  if(addWrap && addWrap.parentNode === stack){
    stack.insertBefore(node, addWrap);
  }else{
    stack.appendChild(node);
  }

  // update state, initialize avatars, carry over contact
  S.layout = (kind==='header-side') ? 'side' : (kind==='header-fancy' ? 'fancy' : 'top');
  initAvatars(node);
  applyContact();

  // Morph animation (FLIP) if we had a previous header
  if(prevRect){
    const nh = node.getBoundingClientRect();
    const dx = prevRect.left - nh.left;
    const dy = prevRect.top  - nh.top;
    const sx = prevRect.width  / nh.width;
    const sy = prevRect.height / nh.height;
    node.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    node.style.transformOrigin = 'top left';
    node.style.transition = 'transform .35s ease, opacity .35s ease';
    node.style.opacity = '0.6';
    requestAnimationFrame(()=>{
      node.style.transform = 'translate(0,0) scale(1,1)';
      node.style.opacity   = '1';
    });
    setTimeout(()=>{ node.style.transition=''; node.style.transform=''; }, 380);
  }

  // Let modules re-place themselves (skills/edu/exp)
  document.dispatchEvent(new CustomEvent('layout:changed', { detail:{ layout:S.layout } }));
}

export function applyContact(){
  const header = getHeaderNode(); if(!header) return;
  const nameEl = header.querySelector('.name');
  if(nameEl) nameEl.textContent = S.contact?.name || 'YOUR NAME';

  const chips = [];
  const addChip = (icon,text)=>{
    const el = document.createElement('div');
    el.className = 'chip';
    el.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    return el;
  };
  const c = S.contact || {};
  if(c.phone)    chips.push(addChip('fa-solid fa-phone', c.phone));
  if(c.email)    chips.push(addChip('fa-solid fa-envelope', c.email));
  if(c.address)  chips.push(addChip('fa-solid fa-location-dot', c.address));
  if(c.linkedin) chips.push(addChip('fa-brands fa-linkedin', 'linkedin.com/in/'+c.linkedin));

  const areaSingle = header.querySelector('[data-info]');
  const L = header.querySelector('[data-info-left]');
  const R = header.querySelector('[data-info-right]');

  if(L && R){
    L.innerHTML=''; R.innerHTML='';
    chips.forEach((chip,i)=> (i%2?R:L).appendChild(chip));
  }else if(areaSingle){
    areaSingle.innerHTML='';
    chips.forEach(chip=> areaSingle.appendChild(chip));
  }
}
