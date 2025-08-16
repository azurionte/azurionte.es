// /resume/layouts/layouts.js
// Creates/morphs headers and paints contact chips. Exports the symbols other files import.
import { S } from '../app/state.js';

/* ---------- tiny helpers ---------- */
const $  = (s,r=document)=>r.querySelector(s);
function stackEl(){ return document.getElementById('stack'); }
function addWrap(){ return document.getElementById('canvasAdd'); }
export function getHeaderNode(){ return stackEl()?.querySelector('[data-header]')?.closest('.node') || null; }

/* ---------- avatar loader (kept local) ---------- */
function initAvatars(root){
  root.querySelectorAll('[data-avatar]').forEach(w=>{
    const input=w.querySelector('input');
    const canvas=document.createElement('canvas'); canvas.width=140; canvas.height=140; w.appendChild(canvas);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    w.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>{
      const f=input.files?.[0]; if(!f) return;
      const img=new Image();
      img.onload=()=>{
        const s=Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw=img.width*s, dh=img.height*s;
        const dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.beginPath(); ctx.arc(70,70,70,0,Math.PI*2); ctx.clip();
        ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,dx,dy,dw,dh);
        ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src=URL.createObjectURL(f);
    });
  });
}

/* ---------- contact chips ---------- */
function chipHTML(icon, text){
  return `<div class="chip"><i class="${icon}"></i><span>${text}</span></div>`;
}

export function applyContact(){
  const h = getHeaderNode(); if(!h) return;
  // name
  const nameEl = h.querySelector('.name');
  if(nameEl) nameEl.textContent = S.contact?.name?.trim() || 'YOUR NAME';

  // build chips
  const chips = [];
  if(S.contact?.phone)    chips.push(chipHTML('fa-solid fa-phone',         S.contact.phone));
  if(S.contact?.email)    chips.push(chipHTML('fa-solid fa-envelope',      S.contact.email));
  if(S.contact?.address)  chips.push(chipHTML('fa-solid fa-location-dot',  S.contact.address));
  if(S.contact?.linkedin) chips.push(chipHTML('fa-brands fa-linkedin',     'linkedin.com/in/'+S.contact.linkedin));

  // place chips depending on header
  const left  = h.querySelector('[data-info-left]');
  const right = h.querySelector('[data-info-right]');
  const mono  = h.querySelector('[data-info]');

  if(left && right){
    left.innerHTML=''; right.innerHTML='';
    chips.forEach((c,i)=> (i%2?right:left).insertAdjacentHTML('beforeend', c));
  }else if(mono){
    mono.innerHTML=''; chips.forEach(c=> mono.insertAdjacentHTML('beforeend', c));
  }

  // theme-aware chip look is handled in app.css; nothing inline here.
}

/* ---------- header builders ---------- */
function buildHeader(kind){
  // Remove previous header node (not the whole page)
  const old = getHeaderNode();
  if(old) old.remove();

  const node = document.createElement('div');
  node.className = 'node';
  node.setAttribute('data-locked','1'); // helpers should hide in preview/print

  if(kind==='header-side'){
    node.innerHTML = `
      <div class="sidebar-layout" data-header>
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*"></label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main">
          <!-- the canvas add button will be moved here by modules -->
        </div>
      </div>`;
    S.layout = 'side';
  }
  else if(kind==='header-fancy'){
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
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*"></label>
        </div>
        <div class="below"></div>
      </div>`;
    S.layout = 'fancy';
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
              <input type="file" accept="image/*">
            </label>
          </div>
        </div>
      </div>`;
    S.layout = 'top';
  }

  // Insert before the add button so header is always on top
  stackEl().insertBefore(node, addWrap());
  initAvatars(node);
  applyContact();
}

/* ---------- morph (FLIP-ish) ---------- */
export function morphTo(kind){
  // Remember old header position for FLIP
  const old = getHeaderNode();
  const rect = old ? old.getBoundingClientRect() : null;

  buildHeader(kind);

  // Animate new header from old rect
  if(rect){
    const fresh = getHeaderNode();
    if(fresh){
      const nh = fresh.getBoundingClientRect();
      const dx = rect.left - nh.left;
      const dy = rect.top  - nh.top;
      const sx = rect.width  / (nh.width  || 1);
      const sy = rect.height / (nh.height || 1);
      fresh.style.transformOrigin='top left';
      fresh.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
      fresh.style.opacity = '0.6';
      fresh.style.transition = 'transform .35s ease, opacity .35s ease';
      requestAnimationFrame(()=>{
        fresh.style.transform='translate(0,0) scale(1,1)';
        fresh.style.opacity='1';
      });
      setTimeout(()=>{ fresh.style.transition=''; fresh.style.transform=''; }, 380);
    }
  }

  // Let other modules react (e.g., move the + button to the right column for sidebar)
  document.dispatchEvent(new CustomEvent('layout:changed', { detail:{ layout:S.layout }}));
}
