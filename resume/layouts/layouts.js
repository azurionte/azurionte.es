// /resume/layouts/layouts.js
// [layouts.js] v1.6
console.log('[layouts.js] v1.6');

import { S } from '../app/state.js';

/* ------------------------------------------------------------------ */
/* tiny helpers                                                        */
/* ------------------------------------------------------------------ */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function stackEl(){
  // By default we use the global #stack that editor builds.
  // If you later want to route to a layout-specific stack, do it here.
  return $('#stack');
}

/* ------------------------------------------------------------------ */
/* public: ensureCanvas                                                */
/* ------------------------------------------------------------------ */
export function ensureCanvas(){
  // Editor normally builds the page + stack. This is a safety net so calls
  // from app.js don’t blow up if editor hasn’t run yet.
  if (!$('#stack')){
    const root = $('#canvas-root') || document.body;
    const wrap = document.createElement('div');
    wrap.className = 'page';
    wrap.innerHTML = `
      <div id="sheet">
        <div id="stack" class="stack">
          <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
        </div>
      </div>`;
    root.appendChild(wrap);
  }
  // Always keep the + anchor at the end
  ensureAddAnchor();
  return { stack: $('#stack'), add: $('#canvasAdd') };
}

/* ------------------------------------------------------------------ */
/* header detection                                                    */
/* ------------------------------------------------------------------ */
export function getHeaderNode(){
  // Return the inner element marked as data-header (easier for wizard).
  return $('[data-header]');
}
function getHeaderNodeWrapper(){
  // The .node wrapper that contains the header.
  return $('[data-header]')?.closest('.node') || null;
}

/* ------------------------------------------------------------------ */
/* avatar loader (re-usable)                                           */
/* ------------------------------------------------------------------ */
function initAvatars(root){
  $$('[data-avatar]', root).forEach(w=>{
    const input = w.querySelector('input[type=file]');
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);

    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    w.addEventListener('click', e=>{
      // avoid clicking when user clicks the hidden input directly
      if (e.target !== input) input.click();
    });

    input.addEventListener('change', ()=>{
      const f = input.files?.[0]; if (!f) return;
      const img = new Image();
      img.onload = ()=>{
        const s = Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw = img.width*s, dh = img.height*s;
        const dx = (canvas.width-dw)/2, dy=(canvas.height-dh)/2;
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
    });
  });
}

/* ------------------------------------------------------------------ */
/* chip helpers                                                        */
/* ------------------------------------------------------------------ */
function chip(icon, text){
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  // Theme-aware tinting (very light touch; your app.css handles most)
  el.style.borderRadius = '999px';
  return el;
}
function setChips(containerList, items){
  containerList.forEach(c => c.innerHTML = '');
  if (!items.length) return;
  if (containerList.length === 1){
    items.forEach(it => containerList[0].appendChild(it));
  } else if (containerList.length >= 2){
    // Alternate left/right if we have two columns
    items.forEach((it, i) => containerList[i % 2].appendChild(it));
  }
}

/* ------------------------------------------------------------------ */
/* public: applyContact                                                */
/* ------------------------------------------------------------------ */
export function applyContact(){
  const head = getHeaderNode();
  if (!head) return;

  // name
  const nameEl = head.querySelector('.name');
  if (nameEl) nameEl.textContent = S?.contact?.name || 'YOUR NAME';

  // chips
  const chips = [];
  const c = S.contact || {};
  if (c.phone)    chips.push(chip('fa-solid fa-phone',        c.phone));
  if (c.email)    chips.push(chip('fa-solid fa-envelope',     c.email));
  if (c.address)  chips.push(chip('fa-solid fa-location-dot', c.address));
  if (c.linkedin) chips.push(chip('fa-brands fa-linkedin',    'linkedin.com/in/' + c.linkedin));

  const holders = [
    head.querySelector('[data-info]'),
    head.querySelector('[data-info-left]'),
    head.querySelector('[data-info-right]')
  ].filter(Boolean);

  setChips(holders, chips);
}

/* ------------------------------------------------------------------ */
/* header builders                                                     */
/* ------------------------------------------------------------------ */
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
        <div data-zone="main">
          <!-- You can place a local + here if you want -->
        </div>
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

  // Insert before the + anchor
  const s = stackEl();
  s.insertBefore(node, $('#canvasAdd'));

  // Init avatar uploaders
  initAvatars(node);

  // Persist layout flag
  S.layout = (kind==='header-side') ? 'side' : (kind==='header-fancy') ? 'fancy' : 'top';

  // Apply current theme flags to body (so header looks right)
  if (S.theme) document.body.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-dark', S.dark ? '1':'0');
  document.body.setAttribute('data-mat',  S.mat  || 'paper');

  // Make sure the add anchor remains at the end
  ensureAddAnchor(true);

  // Fill contact chips if we have data
  applyContact();

  return node;
}

/* ------------------------------------------------------------------ */
/* public: morphTo (FLIP-ish)                                          */
/* ------------------------------------------------------------------ */
export function morphTo(kind){
  const s = stackEl();
  const oldWrapper = getHeaderNodeWrapper();
  const before = oldWrapper?.getBoundingClientRect();

  // Create new header node first (hidden) to get a target box
  const temp = buildHeader(kind);
  const after = temp.getBoundingClientRect();

  // If we had an old one, animate FLIP and remove it
  if (before){
    // Position new at the old one's geometry first
    const dx = before.left - after.left;
    const dy = before.top  - after.top;
    const sx = before.width  / after.width;
    const sy = before.height / after.height;

    temp.style.transformOrigin = 'top left';
    temp.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    temp.style.opacity = '0.6';

    // Remove old after we inserted the new (so flow is correct)
    oldWrapper.remove();

    // Let the browser paint, then transition to identity
    requestAnimationFrame(()=>{
      temp.style.transition = 'transform .35s ease, opacity .35s ease';
      temp.style.transform  = 'translate(0,0) scale(1,1)';
      temp.style.opacity    = '1';
      // cleanup transition styles
      setTimeout(()=>{ temp.style.transition=''; temp.style.transform=''; }, 380);
    });
  } else {
    // No previous header, just ensure + anchor sits last
    s.insertBefore(temp, $('#canvasAdd'));
    ensureAddAnchor(true);
  }
}

/* ------------------------------------------------------------------ */
/* public: ensureAddAnchor                                             */
/* ------------------------------------------------------------------ */
export function ensureAddAnchor(show){
  const s   = stackEl();
  const add = $('#canvasAdd');
  if (!s || !add) return null;
  if (add.parentElement !== s) s.appendChild(add);
  if (typeof show === 'boolean') add.style.display = show ? 'flex' : 'none';
  return add;
}
