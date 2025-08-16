// resume/layouts/layouts.js
// v1.4 — headers + morphing + sidebar anchoring + layout-tile UX
// Restores single-file look & feel for headers and fixes Sidebar behavior.
import { S } from '../app/state.js';

console.log('%c[layouts.js] v1.4 loaded', 'color:#8b5cf6');

// ---------- tiny qs helpers ----------
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

// ---------- canvas refs ----------
export function ensureCanvas() {
  const stack = $('#stack');
  const addWrap = $('#canvasAdd'); // wrapper containing the "+" button
  return { stack, addWrap };
}
function stackEl() { return ensureCanvas().stack; }
function addWrapEl() { return ensureCanvas().addWrap; }

// ---------- style injection (headers + tiles) ----------
(function injectLayoutCSS(){
  if (document.getElementById('layouts-css')) return;
  const css = `
  /* headers */
  .topbar{position:relative;border-radius:14px;overflow:visible;
    background:linear-gradient(135deg,var(--accent2),var(--accent));
    padding:16px;min-height:170px}
  .topbar-grid{display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px}
  .topbar .name{font-weight:900;font-size:34px;margin:0;text-align:center}
  .topbar .left .chips{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:10px}
  .topbar .right{display:flex;justify-content:center}
  .topbar .avatar{width:120px;height:120px}
  .fancy{position:relative;border-radius:14px;overflow:visible}
  .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:180px;
    background:linear-gradient(135deg,var(--accent2),var(--accent))}
  .fancy .name{font-weight:900;font-size:34px;margin:0;text-align:center}
  .fancy .chip-grid{display:grid;grid-template-columns:1fr 168px 1fr;gap:10px 18px;margin:10px auto 0;max-width:740px}
  .chip-col{display:flex;flex-direction:column;gap:10px}
  .fancy .avatar-float{position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:0;z-index:30}
  .fancy .below{height:82px}
  .sidebar-layout{display:grid;grid-template-columns:var(--rail) minmax(0,1fr);gap:16px;min-height:320px}
  .sidebar-layout .rail{
    background:linear-gradient(135deg,var(--accent2),var(--accent));
    border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;
    gap:12px;align-items:center;min-height:100%}
  .rail .avatar{width:140px;height:140px;border-width:6px}
  .rail .name{font-weight:900;font-size:26px;text-align:center}
  .rail .chips{display:flex;flex-direction:column;gap:8px;width:100%}
  .rail .sec-holder{width:100%;padding-top:6px}
  .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff}
  .avatar input{display:none}
  .avatar canvas{width:100%;height:100%;display:block}
  .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}
  /* layout tiles (wizard + menu) */
  .mock{flex:1;min-height:130px;background:#0c1324;border:1px solid #1f2540;border-radius:14px;padding:10px;cursor:pointer;position:relative;transition:transform .15s ease, box-shadow .15s ease}
  .mock:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(0,0,0,.35)}
  .mock.sel{outline:2px solid #ffb86c}
  `;
  const tag = document.createElement('style');
  tag.id = 'layouts-css';
  tag.textContent = css;
  document.head.appendChild(tag);
})();

// ---------- avatar cropper (ported) ----------
function initAvatar(wrapper){
  if(!wrapper) return;
  const input = wrapper.querySelector('input');
  let canvas = wrapper.querySelector('canvas');
  if(!canvas){ canvas = document.createElement('canvas'); canvas.width = canvas.height = 140; wrapper.appendChild(canvas); }
  const ctx = canvas.getContext('2d',{willReadFrequently:true});
  const Sx = { img:null, scale:1, minScale:1, x:0, y:0, drag:false, sx:0, sy:0 };

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.beginPath(); ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2,0,Math.PI*2); ctx.clip();
    if(Sx.img){ ctx.imageSmoothingQuality='high'; ctx.drawImage(Sx.img,Sx.x,Sx.y,Sx.img.width*Sx.scale,Sx.img.height*Sx.scale); wrapper.setAttribute('data-empty','0'); }
    ctx.restore();
  }

  const snap = wrapper.getAttribute('data-snapshot');
  if(snap){
    const img = new Image();
    img.onload = () => {
      Sx.img = img;
      const sx=canvas.width/img.width, sy=canvas.height/img.height;
      Sx.minScale = Math.max(sx,sy); Sx.scale = Sx.minScale;
      Sx.x=(canvas.width-img.width*Sx.scale)/2; Sx.y=(canvas.height-img.height*Sx.scale)/2;
      draw();
    };
    img.src = snap;
  }

  wrapper.addEventListener('click',()=> input && input.click());
  input && input.addEventListener('change',()=>{
    const f=input.files?.[0]; if(!f) return;
    const img=new Image();
    img.onload=()=>{
      Sx.img=img;
      const sx=canvas.width/img.width, sy=canvas.height/img.height;
      Sx.minScale=Math.max(sx,sy); Sx.scale=Sx.minScale;
      Sx.x=(canvas.width-img.width*Sx.scale)/2; Sx.y=(canvas.height-img.height*Sx.scale)/2;
      draw();
    };
    const url=URL.createObjectURL(f); img.src=url; setTimeout(()=>URL.revokeObjectURL(url),7000);
  });
  canvas.addEventListener('mousedown',e=>{ Sx.drag=true; Sx.sx=e.clientX; Sx.sy=e.clientY; });
  window.addEventListener('mouseup',()=>{ Sx.drag=false; });
  window.addEventListener('mousemove',e=>{ if(!Sx.drag) return; Sx.x+=e.clientX-Sx.sx; Sx.y+=e.clientY-Sx.sy; Sx.sx=e.clientX; Sx.sy=e.clientY; draw(); });
  canvas.addEventListener('wheel',e=>{
    e.preventDefault(); if(!Sx.img) return;
    const d=e.deltaY<0?1.05:0.95; let ns=Sx.scale*d; if(ns<Sx.minScale) ns=Sx.minScale; if(ns>5) ns=5;
    const r=canvas.getBoundingClientRect(); const mx=e.clientX-r.left, my=e.clientY-r.top;
    const dx=(mx-Sx.x)/Sx.scale, dy=(my-Sx.y)/Sx.scale;
    Sx.x=mx-dx*ns; Sx.y=my-dy*ns; Sx.scale=ns; draw();
  },{passive:false});
}

// ---------- header builders ----------
function node(locked=true){ const n=document.createElement('div'); n.className='node'; if(locked) n.setAttribute('data-locked','1'); return n; }

function buildTopbar(){
  const n=node(true);
  n.innerHTML = `
    <div class="topbar" data-header>
      <div class="topbar-grid">
        <div class="left">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chips" data-info></div>
        </div>
        <div class="right">
          <label class="avatar" data-avatar data-empty="1">
            <canvas width="120" height="120"></canvas><input type="file" accept="image/*">
          </label>
        </div>
      </div>
    </div>`;
  initAvatar(n.querySelector('[data-avatar]'));
  return n;
}
function buildFancy(){
  const n=node(true);
  n.innerHTML = `
    <div class="fancy" data-header>
      <div class="hero">
        <h1 class="name" contenteditable>YOUR NAME</h1>
        <div class="chip-grid">
          <div class="chip-col left" data-info-left></div>
          <div></div>
          <div class="chip-col right" data-info-right></div>
        </div>
      </div>
      <div class="avatar-float">
        <label class="avatar" data-avatar data-empty="1" style="width:140px;height:140px">
          <canvas width="140" height="140"></canvas><input type="file" accept="image/*">
        </label>
      </div>
      <div class="below"></div>
    </div>`;
  initAvatar(n.querySelector('[data-avatar]'));
  return n;
}
function buildSidebar(){
  const n=node(true);
  n.innerHTML = `
    <div class="sidebar-layout" data-header>
      <div class="rail">
        <label class="avatar" data-avatar data-empty="1">
          <canvas width="140" height="140"></canvas><input type="file" accept="image/*">
        </label>
        <div class="name" contenteditable>YOUR NAME</div>
        <div class="chips" data-info></div>
        <div class="sec-holder"></div>
      </div>
      <div data-zone="main"></div>
    </div>`;
  initAvatar(n.querySelector('[data-avatar]'));
  return n;
}

// ---------- helpers exported ----------
export function isSidebarActive(){
  const h = getHeaderNode();
  return !!h && !!h.querySelector('.sidebar-layout');
}
export function getSideMain(){
  return stackEl().querySelector('.sidebar-layout [data-zone="main"]');
}
export function getRailHolder(){
  return stackEl().querySelector('.sidebar-layout .sec-holder');
}
export function getHeaderNode(){
  // return the wrapper .node that contains any header
  const wrap = $(
    '.node:has(.topbar), .node:has(.fancy), .node:has(.sidebar-layout)',
    stackEl()
  );
  return wrap || null;
}
export function ensureAddAnchor(){
  const add = addWrapEl();
  const parent = isSidebarActive() ? (getSideMain() || stackEl()) : stackEl();
  if (add && add.parentElement !== parent) parent.appendChild(add);
  if (add) parent.appendChild(add); // keep at end of that column
}

// ---------- data apply (name + chips) ----------
export function applyContact(){
  const header = getHeaderNode();
  if(!header) return;
  const nameEl = header.querySelector('.name');
  if(nameEl) nameEl.textContent = S.contact?.name || 'YOUR NAME';

  // build chips from S.contact
  const chips = [];
  const mk = (icon, text) => {
    const d = document.createElement('div');
    d.className = 'chip';
    d.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    return d;
  };
  if (S.contact?.phone)   chips.push(mk('fa-solid fa-phone', S.contact.phone));
  if (S.contact?.email)   chips.push(mk('fa-solid fa-envelope', S.contact.email));
  if (S.contact?.address) chips.push(mk('fa-solid fa-location-dot', S.contact.address));
  if (S.contact?.linkedin)chips.push(mk('fa-brands fa-linkedin', 'linkedin.com/in/'+S.contact.linkedin));

  const fancyL = header.querySelector('[data-info-left]');
  const fancyR = header.querySelector('[data-info-right]');
  const oneBox = header.querySelector('[data-info]');

  if (fancyL && fancyR){
    fancyL.innerHTML = ''; fancyR.innerHTML = '';
    chips.forEach((c,i)=> (i%2 ? fancyR : fancyL).appendChild(c));
  } else if (oneBox){
    oneBox.innerHTML = '';
    chips.forEach(c => oneBox.appendChild(c));
  }
}

// ---------- morphing with data preservation ----------
export function morphTo(kind){
  const stack = stackEl();
  const add = addWrapEl();
  const oldWrap = getHeaderNode();

  // snapshot current header content
  let idx = 0, name='', chipsHTML='', leftHTML='', rightHTML='', snap='';
  let mainNodes = [], railSkills = null;

  if(oldWrap){
    idx = Array.from(stack.children).indexOf(oldWrap);
    const nm = oldWrap.querySelector('.name'); name = nm ? nm.textContent : '';

    if (oldWrap.querySelector('.fancy')){
      leftHTML  = (oldWrap.querySelector('[data-info-left]')  || {}).innerHTML || '';
      rightHTML = (oldWrap.querySelector('[data-info-right]') || {}).innerHTML || '';
    }
    if (oldWrap.querySelector('.topbar')){
      chipsHTML = (oldWrap.querySelector('[data-info]') || {}).innerHTML || '';
    }
    if (oldWrap.querySelector('.sidebar-layout')){
      chipsHTML = (oldWrap.querySelector('.rail [data-info]') || {}).innerHTML || '';
      mainNodes = $$('[data-zone="main"] > .node', oldWrap);
      railSkills = oldWrap.querySelector('.rail .section')?.outerHTML || null;
    }

    const cv = oldWrap.querySelector('[data-avatar] canvas');
    try{
      snap = cv ? cv.toDataURL('image/png') : (oldWrap.querySelector('[data-avatar]')?.getAttribute('data-snapshot') || '');
    }catch(_){ /* tainted canvas */ }

    oldWrap.remove();
  }

  // build new header
  let host = null;
  if (kind === 'header-top')   host = buildTopbar();
  if (kind === 'header-fancy') host = buildFancy();
  if (kind === 'header-side')  host = buildSidebar();

  if (name) host.querySelector('.name').textContent = name;
  if (snap){
    const a = host.querySelector('[data-avatar]');
    a.setAttribute('data-snapshot', snap);
    initAvatar(a);
  }

  if (host.querySelector('.fancy')){
    const L = host.querySelector('[data-info-left]');
    const R = host.querySelector('[data-info-right]');
    const tmp = document.createElement('div');
    tmp.innerHTML = (leftHTML||'')+(rightHTML||'')+(chipsHTML||'');
    $$('.chip', tmp).forEach((el,i)=> (i%2 ? R : L).appendChild(el));
  }
  if (host.querySelector('.topbar') && chipsHTML){
    host.querySelector('[data-info]').innerHTML = chipsHTML;
  }
  if (host.querySelector('.sidebar-layout') && chipsHTML){
    host.querySelector('.rail [data-info]').innerHTML = chipsHTML;
  }

  // insert with FLIP-ish effect
  const anchor = stack.children[idx] || add;
  stack.insertBefore(host, anchor);

  if (kind === 'header-side'){
    // move any existing content nodes into the right column
    const main = getSideMain();
    // 1) nodes that came from a previous sidebar header
    if (mainNodes.length) mainNodes.forEach(n => main.appendChild(n));
    // 2) nodes in stack (except locked/header/add)
    $$('.node:not([data-locked])', stack).forEach(n => { if(n !== host) main.appendChild(n); });
    // re-inject previous rail skills if they existed
    if (railSkills){
      const holder = getRailHolder(); holder.innerHTML = railSkills;
      // disable dragging whole rail section handle if any
      const handle = holder.querySelector('.sec-tools .handle');
      if (handle) handle.style.display = 'none';
    }
  }

  ensureAddAnchor();
}

// ---------- make layout tiles interactive everywhere ----------
document.addEventListener('click', (e) => {
  const tile = e.target.closest('.mock[data-layout]');
  if(!tile) return;
  const box = tile.parentElement;
  box.querySelectorAll('.mock').forEach(x => x.classList.remove('sel'));
  tile.classList.add('sel');
  morphTo(tile.dataset.layout);
});

