// /resume/layouts/layouts.js
// [layouts.js] v2.0
console.log('[layouts.js] v2.0');

import { S } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function stackEl(){ return $('#stack'); }

/* --------------------------- Canvas shell --------------------------- */
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
  return { stack: $('#stack'), add: $('#canvasAdd') };
}

/* ---------------------------- Header find --------------------------- */
export function getHeaderNode(){ return $('[data-header]'); }
function getHeaderNodeWrapper(){ return getHeaderNode()?.closest('.node') || null; }

/* Explicit sidebar state for other modules */
export function isSidebarActive(){
  const head = getHeaderNode();
  return (S.layout === 'side') || !!head?.closest('.sidebar-layout');
}

/* Where to put sidebar sections (left rail) */
export function getRailHolder(){
  const head = getHeaderNode();
  if (!head) return null;
  if (head.closest('.sidebar-layout')) return head.querySelector('[data-rail-sections]');
  return null;
}

/* Where to put main content when sidebar layout is active */
export function getSideMain(){
  const head = getHeaderNode();
  if (isSidebarActive() && head){
    return head.querySelector('[data-zone="main"]');
  }
  // Fallback: in non-sidebar layouts modules live on the main stack
  return $('#stack');
}

/* ---------------------------- Avatar load --------------------------- */
function initAvatars(root){
  $$('[data-avatar]', root).forEach(w=>{
    const input = w.querySelector('input[type=file]');
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently:true });

    w.addEventListener('click', e=>{ if (e.target !== input) input.click(); });
    input.addEventListener('change', ()=>{
      const f = input.files?.[0]; if (!f) return;
      const img = new Image();
      img.onload = ()=>{
        const s = Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw = img.width*s, dh = img.height*s;
        const dx = (canvas.width-dw)/2, dy = (canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save(); ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
        ctx.clip(); ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src = URL.createObjectURL(f);
    });
  });
}

/* ------------------------------ Chips ------------------------------- */
function chip(icon, text){
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  el.style.borderRadius = '999px';
  return el;
}

function setChips(containerList, items){
  containerList.forEach(c => c.innerHTML = '');
  if (!items.length) return;
  if (containerList.length === 1){
    items.forEach(it => containerList[0].appendChild(it));
  } else {
    items.forEach((it,i)=> containerList[i%2].appendChild(it));
  }
}

/* theme-aware chip surface (paper/glass + dark) */
function styleOneChip(el){
  // reset
  el.style.background = '';
  el.style.color = '';
  el.style.border = '';
  el.style.backdropFilter = '';

  const isGlass = (S.mat === 'glass');
  const isDark  = !!S.dark;

  if (isGlass){
    el.style.background = 'rgba(255,255,255,.10)';
    el.style.border = '1px solid #ffffff28';
    el.style.backdropFilter = 'blur(6px)';
    el.style.color = (['grayBlack','magentaPurple'].includes(S.theme) ? '#fff' : '#111');
  } else if (isDark){
    el.style.background = '#0c1324';
    el.style.border = '1px solid #1f2a44';
    el.style.color = '#e6ecff';
  } else {
    el.style.background = '#fff';
    el.style.border = '1px solid rgba(0,0,0,.08)';
    el.style.color = '#111';
  }
  const ic = el.querySelector('i');
  if (ic) ic.style.color = 'var(--accent)';
}

/* Exported so wizard/theme step can re-tint chips after changes */
export function restyleContactChips(scope=document){
  const head = getHeaderNode();
  if (!head) return;
  $$('.chip', head).forEach(styleOneChip);
}

/* --------------------------- Contact apply -------------------------- */
export function applyContact(){
  const head = getHeaderNode(); if (!head) return;

  const nameEl = head.querySelector('.name');
  if (nameEl) nameEl.textContent = S?.contact?.name || 'YOUR NAME';

  const c = S.contact || {};
  const items = [];
  if (c.phone)    items.push(chip('fa-solid fa-phone',        c.phone));
  if (c.email)    items.push(chip('fa-solid fa-envelope',     c.email));
  if (c.address)  items.push(chip('fa-solid fa-location-dot', c.address));
  if (c.linkedin) items.push(chip('fa-brands fa-linkedin',    'linkedin.com/in/' + c.linkedin));

  const holders = [
    head.querySelector('[data-info]'),
    head.querySelector('[data-info-left]'),
    head.querySelector('[data-info-right]')
  ].filter(Boolean);

  setChips(holders, items);
  restyleContactChips();
}

/* --------------------------- Header builders ------------------------ */
function buildHeader(kind){
  const node = document.createElement('div');
  node.className = 'node';
  node.setAttribute('data-locked','1');

  if (kind === 'header-side'){
    node.innerHTML = `
      <div class="sidebar-layout" data-header>
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

  if (kind === 'header-fancy'){
    node.innerHTML = `
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
            <input type="file" accept="image/*" style="display:none">
          </label>
        </div>
        <div class="below"></div>
      </div>`;
  }

  if (kind === 'header-top'){
    node.innerHTML = `
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

  const s = stackEl();
  s.insertBefore(node, $('#canvasAdd'));
  initAvatars(node);

  S.layout = (kind==='header-side') ? 'side' : (kind==='header-fancy') ? 'fancy' : 'top';
  if (S.theme) document.body.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-dark', S.dark ? '1':'0');
  document.body.setAttribute('data-mat',  S.mat  || 'paper');

  ensureAddAnchor(true);
  applyContact();
  return node;
}

/* ------------------------------ Morphing ---------------------------- */
export function morphTo(kind){
  const oldWrapper = getHeaderNodeWrapper();
  const before = oldWrapper?.getBoundingClientRect();

  const temp = buildHeader(kind);
  const after = temp.getBoundingClientRect();

  if (before){
    const dx = before.left - after.left;
    const dy = before.top  - after.top;
    const sx = before.width  / after.width;
    const sy = before.height / after.height;

    temp.style.transformOrigin = 'top left';
    temp.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    temp.style.opacity = '0.6';

    oldWrapper.remove();

    requestAnimationFrame(()=>{
      temp.style.transition = 'transform .35s ease, opacity .35s ease';
      temp.style.transform  = 'translate(0,0) scale(1,1)';
      temp.style.opacity    = '1';
      setTimeout(()=>{ temp.style.transition=''; temp.style.transform=''; }, 380);
    });
  } else {
    ensureAddAnchor(true);
  }
}

/* ---------------------------- Add anchor ---------------------------- */
export function ensureAddAnchor(show){
  const s = stackEl();
  const add = $('#canvasAdd');
  if (!s || !add) return null;
  if (add.parentElement !== s) s.appendChild(add);
  if (typeof show === 'boolean') add.style.display = show ? 'flex' : 'none';
  return add;
}
