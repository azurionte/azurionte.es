// /resume/layouts/layouts.js
// [layouts.js] v1.5
console.log('[layouts.js] v1.5');

import { S } from '../app/state.js';

/* ---------- DOM helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const stack = () => $('#stack');
const addWrap = () => $('#canvasAdd');

/* ---------- public helpers -------------------------------------------- */
export function getHeaderNode(){
  return stack()?.querySelector('[data-header]')?.closest('.node') || null;
}

/* theme-aware chip container styling (paper/glass + dark/light) */
function styleInfoGroup(box){
  if (!box) return;
  const mat = S.mat || 'paper';
  const dark = !!S.dark;
  // Use CSS color-mix with theme vars so it reacts instantly to --accent changes
  const bgGlass = 'color-mix(in srgb, var(--accent) 18%, #ffffff12)';
  const borderGlass = '1px solid color-mix(in srgb, var(--accent) 38%, #0000)';
  const bgPaperDark = '#0c1324';
  const bgPaperLight = '#ffffff';
  const borderPaperDark = '#1f2a44';
  const borderPaperLight = 'rgba(0,0,0,.08)';
  box.style.borderRadius = '12px';
  box.style.padding = '8px';
  if (mat === 'glass'){
    box.style.background = bgGlass;
    box.style.backdropFilter = 'blur(6px)';
    box.style.border = borderGlass;
    box.style.color = dark ? '#e6ecff' : '#111';
  }else{
    box.style.background = dark ? bgPaperDark : bgPaperLight;
    box.style.border = `1px solid ${dark ? borderPaperDark : borderPaperLight}`;
    box.style.color = dark ? '#e6ecff' : '#111';
  }
}

/* chip element & theming */
function chip(iconCls, text, removable=true){
  const d = document.createElement('div');
  d.className = 'chip';
  d.style.display = 'inline-flex';
  d.style.alignItems = 'center';
  d.style.gap = '8px';
  d.style.borderRadius = '999px';
  d.style.padding = '6px 10px';
  d.style.border = '1px solid rgba(0,0,0,.08)';
  d.style.margin = '4px';
  d.innerHTML = `<i class="${iconCls}" style="width:16px;text-align:center;color:var(--accent)"></i>
    <span contenteditable="true">${text||''}</span>${removable?'<button class="rm" title="Remove" style="margin-left:4px;border:0;background:#0000;color:inherit;cursor:pointer">×</button>':''}`;
  if (removable) d.querySelector('.rm').onclick = ()=> d.remove();
  return d;
}

/* info group with "Add chip" button */
function ensureInfoGroup(container){
  if (!container) return;
  let wrap = container.querySelector('.info-wrap');
  if (!wrap){
    wrap = document.createElement('div');
    wrap.className = 'info-wrap';
    wrap.innerHTML = `
      <div class="chips" style="display:flex;flex-wrap:wrap"></div>
      <div class="add-chip-row" style="margin-top:6px">
        <button class="mbtn" data-add-chip type="button" title="Add chip">+ Add chip</button>
      </div>`;
    container.appendChild(wrap);
    styleInfoGroup(wrap);
    wrap.querySelector('[data-add-chip]').onclick = ()=>{
      const c = chip('fa-solid fa-circle', 'New item');
      wrap.querySelector('.chips').appendChild(c);
    };
  }else{
    styleInfoGroup(wrap);
  }
  return wrap;
}

/* ---------- create headers -------------------------------------------- */
function makeHeader(kind){
  const node = document.createElement('div');
  node.className = 'node';
  node.setAttribute('data-locked','1');

  if (kind === 'header-side'){
    node.innerHTML = `
      <div class="sidebar-layout" data-header style="display:grid;grid-template-columns:var(--rail) minmax(0,1fr);gap:16px;min-height:320px">
        <div class="rail" style="background:linear-gradient(135deg,var(--accent2),var(--accent));border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;gap:12px;align-items:center;min-height:1060px">
          <label class="avatar" data-avatar data-empty="1" style="width:140px;height:140px;border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff"><input type="file" accept="image/*" style="display:none"></label>
          <div class="name" contenteditable style="font-weight:900;font-size:26px;text-align:center">YOUR NAME</div>
          <div class="sec-holder" data-rail-sections style="width:100%;padding-top:6px"></div>
          <div data-info></div>
        </div>
        <div data-zone="main">
          <div class="add-squircle"><div class="add-dot" data-local-plus>+</div></div>
        </div>
      </div>`;
  }

  if (kind === 'header-fancy'){
    node.innerHTML = `
      <div class="fancy" data-header style="position:relative;border-radius:14px">
        <div class="hero" style="border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center">
          <h1 class="name" contenteditable style="font-weight:900;font-size:34px;margin:0;text-align:center">YOUR NAME</h1>
          <div class="chip-grid" style="display:grid;grid-template-columns:1fr 1fr;column-gap:72px;row-gap:10px;margin:8px auto 0;max-width:740px"><div class="chips" data-info-left></div><div class="chips" data-info-right></div></div>
        </div>
        <div class="avatar-float" style="position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:140px;z-index:30">
          <label class="avatar" data-avatar data-empty="1" style="width:140px;height:140px;border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff"><input type="file" accept="image/*" style="display:none"></label>
        </div>
        <div class="below" style="height:88px"></div>
      </div>`;
  }

  if (kind === 'header-top'){
    node.innerHTML = `
      <div class="topbar" data-header style="position:relative;border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px;min-height:160px">
        <div class="topbar-grid" style="display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px">
          <div class="left">
            <h1 class="name" contenteditable style="font-weight:900;font-size:34px;margin:0;text-align:left">YOUR NAME</h1>
            <div data-info></div>
          </div>
          <div class="right" style="display:flex;justify-content:flex-end">
            <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px;border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff"><input type="file" accept="image/*" style="display:none"></label>
          </div>
        </div>
      </div>`;
  }

  initAvatars(node);
  return node;
}

/* avatar loader */
function initAvatars(root){
  $$('[data-avatar]',root).forEach(w=>{
    const input=w.querySelector('input'), canvas=document.createElement('canvas');
    canvas.width=140; canvas.height=140; w.appendChild(canvas);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    w.onclick=()=>input.click();
    input.onchange=()=>{ const f=input.files?.[0]; if(!f) return; const img=new Image(); img.onload=()=>{ const s=Math.max(canvas.width/img.width, canvas.height/img.height); const dw=img.width*s, dh=img.height*s; const dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.beginPath(); ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2,0,Math.PI*2); ctx.clip(); ctx.imageSmoothingQuality='high'; ctx.drawImage(img,dx,dy,dw,dh); ctx.restore(); w.setAttribute('data-empty','0'); }; img.src=URL.createObjectURL(f); };
  });
}

/* ---------- morph with FLIP ------------------------------------------- */
export function morphTo(kind){
  const s = stack(); if(!s) return;
  const old = getHeaderNode();
  const prevRect = old?.getBoundingClientRect();
  const node = makeHeader(kind);
  if (old) old.remove();
  s.insertBefore(node, addWrap());
  S.layout = (kind==='header-side')?'side' : (kind==='header-fancy')?'fancy':'top';

  // FLIP-ish
  if(prevRect){
    const nh=node.getBoundingClientRect();
    const dx=prevRect.left-nh.left, dy=prevRect.top-nh.top, sx=prevRect.width/nh.width, sy=prevRect.height/nh.height;
    node.style.transform=`translate(${dx}px,${dy}px) scale(${sx},${sy})`; node.style.transformOrigin='top left'; node.style.transition='transform .35s ease, opacity .35s ease'; node.style.opacity='0.6';
    requestAnimationFrame(()=>{ node.style.transform='translate(0,0) scale(1,1)'; node.style.opacity='1'; });
    setTimeout(()=>{ node.style.transition=''; node.style.transform=''; },380);
  }

  applyContact(); // paint chips/name
}

/* ---------- contact chips render -------------------------------------- */
function addDefaultChips(list){
  if(S.contact.phone) list.appendChild(chip('fa-solid fa-phone', S.contact.phone,false));
  if(S.contact.email) list.appendChild(chip('fa-solid fa-envelope', S.contact.email,false));
  if(S.contact.address) list.appendChild(chip('fa-solid fa-location-dot', S.contact.address,false));
  if(S.contact.linkedin) list.appendChild(chip('fa-brands fa-linkedin', 'linkedin.com/in/'+S.contact.linkedin,false));
  // custom extras
  (S.contact.extra||[]).forEach(t=> list.appendChild(chip(t.icon||'fa-solid fa-circle', t.text||'', true)));
}

export function applyContact(){
  const h = getHeaderNode(); if(!h) return;
  const nameEl = h.querySelector('.name'); if(nameEl) nameEl.textContent=S.contact.name||'YOUR NAME';

  // where to place: consolidated areas support
  const areas=[...h.querySelectorAll('[data-info],[data-info-left],[data-info-right]')];
  if(!areas.length){
    // sidebar stores [data-info] at bottom of rail
    const railInfo = h.querySelector('[data-info]');
    if (railInfo) areas.push(railInfo);
  }

  if (areas.length){
    if (areas.length===1){
      // single area -> use info group wrapper + add button
      const wrap = ensureInfoGroup(areas[0]);
      const list = wrap.querySelector('.chips'); list.innerHTML='';
      addDefaultChips(list);
    }else{
      // fancy split — no add button here; just distribute
      areas.forEach(a=>a.innerHTML='');
      const L = areas[0], R = areas[1];
      const temp = document.createElement('div'); temp.className='chips';
      addDefaultChips(temp);
      const kids = Array.from(temp.children);
      kids.forEach((c,i)=> (i%2?R:L).appendChild(c));
    }
  }
}

/* allow external callers to restyle after theme/mat/dark changes */
export function restyleContactChips(){
  const h = getHeaderNode(); if(!h) return;
  h.querySelectorAll('.info-wrap').forEach(styleInfoGroup);
}

/* listen for theme changes broadcast by wizard/editor */
document.addEventListener('ui:theme-updated', restyleContactChips);
