// /resume/layouts/layouts.js
// [layouts.js] v2.5.0 — canvas hosts + contact chips + rehome on morph
console.log('[layouts.js] v2.5.8');

import { S, save } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

(function ensureLayoutStyles(){
  if (document.getElementById('layouts-style')) return;
  const st = document.createElement('style');
  st.id = 'layouts-style';
  st.textContent = `
  .page{display:grid;place-items:start;padding:28px}
  /* The visual card is the #sheet; .page should be a transparent container */
  #sheet{width:var(--page-w);max-width:100%;background:#fff;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.25);padding:22px;margin:0 auto}
  /* dark mode for the sheet */
  body[data-dark="1"] #sheet{ background:#0d1220; color:var(--ink); box-shadow:0 18px 60px rgba(0,0,0,.45) }
    .stack{display:grid;gap:16px;align-content:start}
    .add-squircle{width:172px;height:108px;border:2px dashed #a6b0ff55;border-radius:16px;display:none;align-items:center;justify-content:center;position:relative}
    .add-dot{width:40px;height:40px;border-radius:12px;background:#0b1022;color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    /* Sidebar layout */
    .sidebar-layout{
      display:grid;grid-template-columns: var(--rail) minmax(0,1fr);gap:18px;align-items:start
      width:100%;
    }
    .sidebar-layout .rail{
      background:linear-gradient(180deg,var(--accent2),var(--accent));border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;min-height:920px;position:relative
    }
    .sidebar-layout [data-zone="main"]{
  display:grid;grid-template-columns: repeat(12,minmax(0,1fr));gap:16px;align-content:start;min-width:0;
  justify-items:stretch; align-items:start; /* ensure children stretch to full column width */
    }
    .sidebar-layout [data-zone="main"] > .section,
    .sidebar-layout [data-zone="main"] > #canvasAdd{ grid-column: 1 / -1; width:100%; max-width:none !important }

    /* Force section children to stretch across the main column and avoid intrinsic-width shrinking */
+
    .sidebar-layout [data-zone="main"] > .section{ display:block; justify-self:stretch; min-width:0 }

    /* Header variants */
    .topbar{border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px}
    .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center}

    /* Avatar + chips */
    .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px}
    .avatar input{display:none}
    .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}

  .chips{display:flex;flex-wrap:wrap;gap:12px}
  .chip{display:flex;align-items:center;gap:10px;border-radius:999px;padding:8px 12px;border:1px solid rgba(0,0,0,.08);margin-bottom:6px}
    .chip i{width:16px;text-align:center}
    .chip[contenteditable="true"]{outline:none}
    /* constrain chip widths inside sidebar rail and truncate if needed */
    .chips{max-width:calc(var(--rail,300px) - 36px)}
    .chip span{display:inline-block;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chip[data-wrap="1"] span{white-space:normal;max-width:260px}
  /* scope text color to the sheet (canvas) only */
  #sheet{ color: #111 }
  body[data-dark="1"] #sheet{ color: #fff }

  /* chip add pop (pill) */
  #chipAddPop{position:absolute;z-index:20060;display:none}
  #chipAddPop.open{display:block}
  #chipAddPop .pill{display:inline-flex;gap:8px;padding:8px;border-radius:999px;background:var(--chipPopBg,#071827);box-shadow:0 10px 30px rgba(2,10,18,.6)}
  #chipAddPop .sq-btn{width:36px;height:36px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,.08);display:grid;place-items:center;color:#fff;cursor:pointer}
  #chipAddPop .sq-btn.hidden{display:none}

  /* style the header name and place the add button statically below the name */
  .sidebar-layout .rail{ position:relative }
  .sidebar-layout .rail .name{ text-align:center; font-weight:800; font-size:18px; margin:8px 0; padding:2px 6px; color:inherit }
  .sidebar-layout .rail .name[contenteditable]{ outline:none; border:none; background:transparent }
  .sidebar-layout .rail .name:focus{ outline:none; box-shadow:none }
  /* name block anchors the add button so it's always centered under the name */
  .sidebar-layout .rail .name-block{ position:relative; width:100%; display:block; text-align:center }
  /* place the add button in-flow after the chips so it naturally sits below the latest chip
    while remaining centered across the full rail width */
  .sidebar-layout .rail .chips{ width:100%; display:flex; flex-wrap:wrap; gap:8px }
  .sidebar-layout .rail #chipAddBtn{ display:block; margin:8px auto 6px; width:44px; height:44px; border-radius:12px; background:#0b1022 !important; color:#fff !important; border:0; box-shadow:0 8px 20px rgba(11,16,34,.28); font-weight:800 }
  .sidebar-layout .rail #chipAddBtn:hover{ filter:brightness(1.03) }
  /* prevent the browser "editing" container from showing an ugly border/outline */
  .sidebar-layout .rail .name[contenteditable]{ caret-color: #fff; }
  .sidebar-layout .rail .name[contenteditable]:focus{ outline:none !important; box-shadow:none !important; border:none !important }
  .sidebar-layout .rail .name::selection{ background: rgba(255,255,255,0.12); color: #fff }
  /* Removed duplicated/conflicting rule that used #0b7285 */

  /* small floating chip remove */
  .chip{position:relative}
  .chip .chip-rm{position:absolute;right:-8px;top:-8px;width:20px;height:20px;border-radius:999px;padding:0;border:0;font-size:12px;background:#fff;color:#111;box-shadow:0 6px 14px rgba(0,0,0,.12);cursor:pointer}

  /* section delete (prominent red) and header controls */
  .sec-head{position:relative}
  .sec-remove{position:absolute;right:12px;top:12px;background:#ff4d4f;color:#fff;border:0;width:28px;height:28px;padding:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;font-size:12px}
  .sec-head .ctrl-circle.move-rail{position:absolute;right:56px;top:10px}

  /* card controls and smaller ctrl-circles floating near the edge */
  .card-controls{position:absolute;right:8px;top:8px;display:flex;gap:6px}
  .card-controls .ctrl-circle{width:28px;height:28px;border-radius:999px;font-size:12px}
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
  // ensure observer is running to sanitize late style changes
  try{ startLayoutObserver(); }catch(e){}
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

// Sanitize .node wrappers inside the main zone by removing inline width styles
export function sanitizeMainNodes(){
  try{
    const main = getSideMain(); if(!main) return;
    Array.from(main.querySelectorAll('.node')).forEach(n=>{
      try{ n.style.width=''; n.style.maxWidth=''; n.style.minWidth=''; n.style.removeProperty('width'); n.style.removeProperty('max-width'); }catch(e){}
      // also clear inline width on immediate children (like .section or .card)
      Array.from(n.querySelectorAll('[style]')).forEach(c=>{ try{ c.style.width=''; c.style.maxWidth=''; c.style.minWidth=''; }catch(e){} });
    });
    // Diagnostic: after sanitizing, log any .node that remains narrower than the main container
    try{
      const mainRect = main.getBoundingClientRect();
      Array.from(main.querySelectorAll('.node')).forEach(n=>{
        try{
          const r = n.getBoundingClientRect();
          if (r.width < Math.max(0, mainRect.width - 8)){
            const cs = window.getComputedStyle(n);
            console.group('[layout-diagnostic] Narrow .node detected');
            console.log('node:', n);
            console.log('node rect:', r);
            console.log('main rect:', mainRect);
            console.log('computed width:', cs.width, 'display:', cs.display, 'box-sizing:', cs.boxSizing);
            console.log('inline style:', n.getAttribute('style'));
            // list ancestors up to main
            let a = n.parentElement; const list=[];
            while(a && a!==document.body){ list.push({el:a, rect:a.getBoundingClientRect(), style:a.getAttribute('style'), cs:window.getComputedStyle(a)}); if(a===main) break; a=a.parentElement; }
            console.log('ancestor chain:', list);
            console.log('stack trace:', new Error().stack);
            console.groupEnd();
          }
        }catch(e){}
      });
    }catch(e){}
  }catch(e){}
}

// Start a MutationObserver that watches for nodes being added or style attribute changes
// and sanitizes .node wrappers inside the active main zone. This catches late inline
// widths set by other code (drag placeholders, copy from mocks, etc.).
let __layoutObserver = null;
function startLayoutObserver(){
  if(__layoutObserver) return;
  const cb = (mutations)=>{
    let saw=false;
    for(const m of mutations){
      if(m.type==='childList' && m.addedNodes.length){
        for(const n of m.addedNodes){ if(n.nodeType===1 && (n.classList.contains('node') || n.querySelector && n.querySelector('.node'))) saw=true; }
      }
      if(m.type==='attributes' && m.attributeName==='style'){
        const t=m.target; if(t && (t.classList && (t.classList.contains('node') || t.classList.contains('section') || t.classList.contains('card')))) saw=true;
      }
    }
    if(saw){
      // debounce/defensive: run sanitize on next microtask
      Promise.resolve().then(()=>{ try{ sanitizeMainNodes(); }catch(e){} });
    }
  };
  __layoutObserver = new MutationObserver(cb);
  __layoutObserver.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['style'] });
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
  el.innerHTML = `<i class="${icon}"></i><span>${text}</span><button class="chip-rm" title="Remove" style="margin-left:8px;border-radius:8px;padding:2px 6px">×</button>`;
  // remove handler (best-effort: clears matching contact value)
  el.querySelector('.chip-rm').addEventListener('click', ()=>{
    try{
      const txt = el.textContent.trim();
      if (S && S.contact){
        ['phone','email','address','linkedin'].forEach(k=>{ if (S.contact[k] && txt.includes(S.contact[k])) S.contact[k]=''; });
        save();
      }
  el.remove();
  restyleContactChips();
  try{ applyContact(); }catch(e){}
    }catch(e){}
  });
  // persist edits when the chip loses focus
  el.addEventListener('focusout', ()=>{
    try{
      const k = el.dataset.key;
      if (!k) return;
      const text = el.querySelector('span')?.textContent?.trim() || el.textContent.trim();
      if (!S.contact) S.contact = {};
      // for linkedin, strip any leading /in/ or domain
      if (k === 'linkedin'){
        const v = text.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//,'').replace(/^\/in\//,'').trim();
        S.contact[k] = v;
      } else {
        S.contact[k] = text;
      }
      save();
    }catch(e){}
  });
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

// chip add menu: opens a small pop with icons to add phone/email/address/linkedin
function openChipMenu(anchor){
  let pop = document.getElementById('chipAddPop');
  if (!pop){
    pop = document.createElement('div'); pop.id='chipAddPop'; pop.className='pop';
    const html = `<div class="pill">`+
      `<button class="sq-btn" data-k="phone" title="Phone"><i class='fa-solid fa-phone' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="email" title="Email"><i class='fa-solid fa-envelope' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="address" title="Address"><i class='fa-solid fa-location-dot' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="linkedin" title="LinkedIn"><i class='fa-brands fa-linkedin' style='color:#fff'></i></button>`+
    `</div>`;
    pop.innerHTML = html;
    document.body.appendChild(pop);
    pop.addEventListener('click', e=>{
      const btn = e.target.closest('button'); const k = btn?.dataset.k; if(!k) return;
      S.contact = S.contact || {};
      // only add if not already present
      if (S.contact[k] && S.contact[k].trim()) { pop.classList.remove('open'); return; }
  // store only the linkedin handle and render as "/in/handle" when displayed
  const placeholder = (k==='linkedin') ? 'your-handle' : (k==='phone'?'+1 555 555 5555': (k==='email'?'you@domain.com':'Your address'));
      S.contact[k] = placeholder;
      save();
      applyContact();
      // focus the new chip after a tick
      Promise.resolve().then(()=>{
        const head=getHeaderNode(); if(!head) return;
        const chips = head.querySelectorAll('.chip');
        const last = chips[chips.length-1]; if(last){ last.focus(); last.setAttribute('contenteditable','true'); }
      });
      pop.classList.remove('open');
    });
  }
  // hide used ones
  const used = Object.keys(S.contact||{}).filter(k=> !!S.contact[k]);
  pop.querySelectorAll('.sq-btn').forEach(b=>{ const k=b.dataset.k; if(used.indexOf(k)!==-1) b.classList.add('hidden'); else b.classList.remove('hidden'); });
  const r = anchor.getBoundingClientRect();
  pop.style.left = `${Math.round(r.left + (r.width/2))}px`;
  pop.style.top  = `${Math.round(r.top  - 12)}px`;
  pop.style.transform = `translate(-50%,-100%)`;
  pop.classList.add('open');
}
export function applyContact(){
  const head=getHeaderNode(); if(!head) return;
  const nm=head.querySelector('.name'); if(nm) nm.textContent=S?.contact?.name||'YOUR NAME';

  const c=S.contact||{}; const items=[];
  if(c.phone){ const el=chip('fa-solid fa-phone', c.phone); el.dataset.key='phone'; el.title=c.phone; items.push(el); }
  if(c.email){ const el=chip('fa-solid fa-envelope', c.email); el.dataset.key='email'; el.title=c.email; items.push(el); }
  if(c.address){ const el=chip('fa-solid fa-location-dot', c.address); el.dataset.key='address'; el.dataset.wrap='1'; el.title=c.address; items.push(el); }
  if(c.linkedin){ const el=chip('fa-brands fa-linkedin','/in/'+c.linkedin); el.dataset.key='linkedin'; el.dataset.wrap='1'; el.title='/in/'+c.linkedin; items.push(el); }

  const holders=[ head.querySelector('[data-info]'),
                  head.querySelector('[data-info-left]'),
                  head.querySelector('[data-info-right]') ].filter(Boolean);
  setChips(holders, items);
  restyleContactChips();
  // show/hide the add button: hide when all supported contact slots are used
  try{
    const allKeys = ['phone','email','address','linkedin'];
    const used = allKeys.filter(k=> !!(S.contact && S.contact[k] && S.contact[k].trim()));
    const btn = head.querySelector('#chipAddBtn');
    if (btn) btn.style.display = (used.length === allKeys.length) ? 'none' : 'block';
  }catch(e){}
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
          <div class="name-block">
            <h2 class="name" contenteditable>YOUR NAME</h2>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;">
            <div class="chips" data-info></div>
            <button id="chipAddBtn" title="Add contact" class="add-dot">+</button>
          </div>
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
  // wire chip add btn
  try{
    const btn = node.querySelector('#chipAddBtn');
    if (btn){
      btn.addEventListener('click', ()=> openChipMenu(btn));
    }
  }catch(e){}

  S.layout=(kind==='header-side')?'side':(kind==='header-fancy')?'fancy':'top';
  // reflect current layout on body so global styles can react (e.g. sheet width)
  document.body.setAttribute('data-layout', S.layout);
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

  // Move any loose .node wrappers (which contain .section) into main first.
  // This keeps the wrapper as the grid child so our CSS rules apply.
  const looseWrappers = Array.from(document.querySelectorAll('.node'))
    .filter(w => w.querySelector && w.querySelector('.section'))
    .filter(w => !main.contains(w) && (!rail || !rail.contains(w)));
  looseWrappers.forEach(w => main.insertBefore(w, plus || null));

  // Skills to rail if that choice was made
  if (rail && (S?.skillsInSidebar)){
    // Prefer the wrapper (node[data-section="skills"]) if present, otherwise fall back
    const skillsWrapper = main.querySelector('.node[data-section="skills"]') || main.querySelector('.section[data-section="skills"]')?.closest('.node');
    if (skillsWrapper) rail.appendChild(skillsWrapper);
  }

  ensureAddAnchor(true);
}

export function morphTo(kind){
  const oldWrap=getHeaderNodeWrapper();
  const before=oldWrap?.getBoundingClientRect();
  const temp=buildHeader(kind);

  // NEW: immediately re-home any existing sections for the new layout
  adoptSectionsToCurrentLayout();
  // sanitize wrappers after re-home
  sanitizeMainNodes();

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
  // Re-home any existing section wrappers into the current main zone and sanitize
  try{ adoptSectionsToCurrentLayout(); sanitizeMainNodes(); }catch(e){ /* best-effort */ }
  return add;
}
