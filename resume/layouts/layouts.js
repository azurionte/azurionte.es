// /resume/layouts/layouts.js
// [layouts.js] v1.3
console.log('[layouts.js] v1.3');

import { S } from '../app/state.js';

/* ---------------- helpers to access DOM ---------------- */
export function getStack(){ return document.getElementById('stack'); }
export function getHeaderNode(){ return document.querySelector('[data-header]')?.closest('.node') || null; }
export function ensureCanvas(){
  const add = document.getElementById('canvasAdd');
  const stack = getStack();
  if (add && stack && add.parentElement !== stack) stack.appendChild(add);
  if (add) add.style.display = 'flex';
}

/* ---------------- chip + contact rendering -------------- */
export function applyContact(){
  const h = document.querySelector('[data-header]');
  if(!h) return;
  const nameEl = h.querySelector('.name');
  if (nameEl) nameEl.textContent = S.contact?.name || 'YOUR NAME';

  const makeChip = (icon, text)=>{
    const el = document.createElement('div');
    el.className = 'chip';
    el.style.cssText = 'display:flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08);background:#fff;color:#111';
    el.innerHTML = `<i class="${icon}" style="width:16px;text-align:center;color:var(--accent)"></i><span>${text}</span>`;
    return el;
  };

  // clear areas
  const bins = h.querySelectorAll('[data-info],[data-info-left],[data-info-right]');
  bins.forEach(b=>b.innerHTML='');

  const chips = [];
  const c = S.contact || {};
  if (c.phone)    chips.push(makeChip('fa-solid fa-phone', c.phone));
  if (c.email)    chips.push(makeChip('fa-solid fa-envelope', c.email));
  if (c.address)  chips.push(makeChip('fa-solid fa-location-dot', c.address));
  if (c.linkedin) chips.push(makeChip('fa-brands fa-linkedin', 'linkedin.com/in/'+c.linkedin));

  if (h.querySelector('[data-info-left]')){
    const L = h.querySelector('[data-info-left]'), R = h.querySelector('[data-info-right]');
    chips.forEach((chip,i)=> (i%2?R:L).appendChild(chip));
  } else {
    const box = h.querySelector('[data-info]');
    chips.forEach(chip=> box.appendChild(chip));
  }
}

/* ---------------- avatar init (simple canvas crop) ------ */
function initAvatars(root){
  root.querySelectorAll('[data-avatar]').forEach(w=>{
    if (w.__inited) return; w.__inited = true;
    const input = w.querySelector('input');
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140; w.appendChild(canvas);
    const ctx = canvas.getContext('2d',{willReadFrequently:true});
    w.addEventListener('click', e=>{ if(e.target===w || e.target===canvas) input.click(); });
    input.addEventListener('change', ()=>{
      const f = input.files?.[0]; if(!f) return; const img=new Image();
      img.onload=()=>{
        const s=Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw=img.width*s, dh=img.height*s;
        const dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save(); ctx.beginPath(); ctx.arc(70,70,70,0,Math.PI*2); ctx.clip();
        ctx.imageSmoothingQuality='high'; ctx.drawImage(img,dx,dy,dw,dh); ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src = URL.createObjectURL(f);
    });
  });
}

/* ---------------- layout morphing ----------------------- */
/**
 * Moves #stack inside the sidebar grid for 'header-side', and moves it back
 * to #sheet for 'header-fancy' / 'header-top'. Preserves all content.
 */
export function morphTo(target){
  const stack = getStack();
  const sheet = document.getElementById('sheet');
  if (!stack || !sheet) return;

  const oldHeaderNode = getHeaderNode();
  const prevRect = oldHeaderNode?.getBoundingClientRect();

  // If switching away from sidebar and #stack is inside it, restore stack to sheet
  const wasSide = oldHeaderNode?.querySelector('.sidebar-layout');
  if (wasSide && (target==='header-top' || target==='header-fancy')){
    // move stack out, before removing old header
    const main = oldHeaderNode.querySelector('[data-zone="main"]');
    if (main && stack.parentElement === main){
      sheet.insertBefore(stack, oldHeaderNode); // stack above header placeholder
    }
  }

  // remove any previous header node
  oldHeaderNode?.remove();

  let node = document.createElement('div');
  node.className = 'node'; node.setAttribute('data-locked','1');

  if (target === 'header-side'){
    node.innerHTML = `
      <div class="sidebar-layout" data-header>
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*" style="display:none"></label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main"></div>
      </div>
    `;
    sheet.insertBefore(node, stack);
    // move the whole stack into the right column (main)
    node.querySelector('[data-zone="main"]').appendChild(stack);
  }
  else if (target === 'header-fancy'){
    node.innerHTML = `
      <div class="fancy" data-header>
        <div class="hero">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chip-grid"><div class="chips" data-info-left></div><div class="chips" data-info-right></div></div>
        </div>
        <div class="avatar-float"><label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*" style="display:none"></label></div>
        <div class="below"></div>
      </div>
    `;
    sheet.insertBefore(node, stack);
  }
  else { // 'header-top'
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
      </div>
    `;
    sheet.insertBefore(node, stack);
  }

  // set state
  S.layout = (target==='header-side') ? 'side' : (target==='header-fancy') ? 'fancy' : 'top';

  // avatar + contact
  initAvatars(node);
  applyContact();

  // simple FLIP-ish morph
  if (prevRect){
    const nh = node.getBoundingClientRect();
    const dx = prevRect.left - nh.left, dy = prevRect.top - nh.top;
    const sx = prevRect.width/nh.width, sy = prevRect.height/nh.height;
    node.style.transformOrigin='top left';
    node.style.transform=`translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    node.style.transition='transform .35s ease, opacity .35s ease';
    node.style.opacity='0.6';
    requestAnimationFrame(()=>{ node.style.transform='translate(0,0) scale(1,1)'; node.style.opacity='1'; });
    setTimeout(()=>{ node.style.transition=''; node.style.transform=''; }, 380);
  }

  // keep plus button visible
  ensureCanvas();
}
