// /resume/layouts/layouts.js
// Creates/morphs the header (layouts), exposes ensureCanvas and contact chip rendering.
import { S } from '../app/state.js';

/* ---------------- utils ---------------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

export function ensureCanvas(){
  const root = document.getElementById('canvas-root');
  if(!root) throw new Error('#canvas-root not found in DOM');

  // If the editor already built the shell, just return refs.
  if($('#stack', root)) {
    return {
      root,
      page:  $('#page', root),
      sheet: $('#sheet', root),
      stack: $('#stack', root),
      addWrap: $('#canvasAdd', root),
      addMenu: $('#addMenu', root),
      addTray: $('#addTray', root),
      dotAdd:  $('#dotAdd',  root)
    };
  }

  // Idempotent: build once if missing (works even without editor.js)
  root.innerHTML = `
    <div class="page" id="page">
      <div id="sheet">
        <div class="stack" id="stack">
          <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
        </div>
      </div>
    </div>
    <div class="pop" id="addMenu"><div class="tray" id="addTray"></div></div>
  `;
  return ensureCanvas();
}

export function getHeaderNode(){
  return $('[data-header]')?.closest('.node') || null;
}

/* -------------- avatar loader -------------- */
function initAvatars(root){
  $$('[data-avatar]',root).forEach(w=>{
    const input=w.querySelector('input');
    const canvas=document.createElement('canvas'); canvas.width=140; canvas.height=140;
    w.appendChild(canvas);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    w.onclick=()=>input.click();
    input.onchange=()=>{
      const f=input.files?.[0]; if(!f) return;
      const img=new Image();
      img.onload=()=>{
        const s=Math.max(canvas.width/img.width, canvas.height/img.height);
        const dw=img.width*s, dh=img.height*s;
        const dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2,0,Math.PI*2);
        ctx.clip();
        ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,dx,dy,dw,dh);
        ctx.restore();
        w.setAttribute('data-empty','0');
      };
      img.src=URL.createObjectURL(f);
    };
  });
}

/* -------------- header builders -------------- */
function buildHeader(kind){
  const node=document.createElement('div');
  node.className='node';
  node.setAttribute('data-locked','1');

  if(kind==='header-side'){
    // Sidebar rail (left) + main content area (right)
    node.innerHTML = `
      <div class="sidebar-layout" data-header>
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
  }
  if(kind==='header-top'){
    node.innerHTML = `
      <div class="topbar" data-header>
        <div class="topbar-grid">
          <div class="left">
            <h1 class="name" contenteditable>YOUR NAME</h1>
            <div class="chips" data-info></div>
          </div>
          <div class="right">
            <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px"><input type="file" accept="image/*"></label>
          </div>
        </div>
      </div>`;
  }
  return node;
}

/* -------------- morph (FLIP-ish) -------------- */
export function morphTo(kind){
  const { stack, addWrap } = ensureCanvas();
  const old = getHeaderNode();
  const prevRect = old?.getBoundingClientRect();

  // build new header
  const fresh = buildHeader(kind);
  if(old) old.remove();

  // Always keep header as the first thing in the stack (above sections/+)
  stack.insertBefore(fresh, addWrap);

  // init avatar pickers
  initAvatars(fresh);

  // record layout in state
  S.layout = (kind==='header-side') ? 'side' : (kind==='header-fancy') ? 'fancy' : 'top';

  // Apply saved contact immediately
  applyContact();

  // FLIP transition
  if(prevRect){
    const nh=fresh.getBoundingClientRect();
    const dx=prevRect.left-nh.left, dy=prevRect.top-nh.top;
    const sx=prevRect.width/nh.width, sy=prevRect.height/nh.height;
    const el=fresh;
    el.style.transform=`translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    el.style.transformOrigin='top left';
    el.style.transition='transform .35s ease, opacity .35s ease';
    el.style.opacity='0.6';
    requestAnimationFrame(()=>{
      el.style.transform='translate(0,0) scale(1,1)';
      el.style.opacity='1';
    });
    setTimeout(()=>{ el.style.transition=''; el.style.transform=''; }, 380);
  }

  // Let others (modules) react to the layout change
  document.dispatchEvent(new CustomEvent('layout:changed', { detail:{ kind:S.layout } }));
}

/* -------------- contact chips -------------- */
function chip(iconCls, text){
  const c=document.createElement('div');
  c.className='chip';
  c.innerHTML=`<i class="${iconCls}"></i><span>${text}</span>`;
  return c;
}
export function applyContact(){
  const h=getHeaderNode(); if(!h) return;

  // name
  const nameEl=h.querySelector('.name');
  if(nameEl) nameEl.textContent = S.contact?.name || 'YOUR NAME';

  // chips list (only filled)
  const items=[];
  if(S.contact?.phone)   items.push(chip('fa-solid fa-phone',   S.contact.phone));
  if(S.contact?.email)   items.push(chip('fa-solid fa-envelope', S.contact.email));
  if(S.contact?.address) items.push(chip('fa-solid fa-location-dot', S.contact.address));
  if(S.contact?.linkedin)items.push(chip('fa-brands fa-linkedin','linkedin.com/in/'+S.contact.linkedin));

  const left  = h.querySelector('[data-info-left]');
  const right = h.querySelector('[data-info-right]');
  const single= h.querySelector('[data-info]');

  if(left && right){
    left.innerHTML=''; right.innerHTML='';
    items.forEach((c,i)=> (i%2?right:left).appendChild(c));
  }else if(single){
    single.innerHTML='';
    items.forEach(c=> single.appendChild(c));
  }
}

/* -------------- sidebar helpers -------------- */
// For sidebar layout, content must go into the right side (data-zone="main").
// Modules listen to 'layout:changed' to relocate the + button appropriately.
// Nothing else is needed here—CSS drives the rail’s full-height look.
