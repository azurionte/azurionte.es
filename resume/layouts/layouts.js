// Layout creation + FLIP morph + contact/avatar propagation
import { S, save } from '../app/state.js';
import { applyChips } from '../modules/modules.js';

export function ensureCanvas(){
  const root = document.getElementById('canvas-root');
  if (!root.querySelector('#stack')) {
    root.innerHTML = `
      <div class="page" id="page"><div id="sheet">
        <div class="stack" id="stack">
          <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
        </div>
      </div></div>`;
  }
}

export function getHeaderNode(){
  const s = document.getElementById('stack');
  return s.querySelector('[data-header]')?.closest('.node') || null;
}

export function morphTo(kind){ // kind: 'header-side'|'header-fancy'|'header-top'
  const old = getHeaderNode();
  const oldRect = old?.getBoundingClientRect();

  if (old) old.remove();

  const stack = document.getElementById('stack');
  const host = document.createElement('div'); host.className='node'; host.setAttribute('data-locked','1');
  host.innerHTML = (kind==='header-side')
    ? sideMarkup()
    : (kind==='header-fancy')
      ? fancyMarkup()
      : topMarkup();
  stack.insertBefore(host, document.getElementById('canvasAdd'));

  // fixed position hero for top layouts
  if (kind!=='header-side') {
    const page = document.getElementById('page');
    host.style.position='sticky';
    host.style.top='8px';
    host.style.zIndex='5';
  }

  S.layout = (kind==='header-side')?'side':(kind==='header-fancy')?'fancy':'top';
  wireAvatar(host);
  applyContact(host);
  applyChips(host);
  save();

  // FLIP animation
  if (oldRect){
    const nh = host.getBoundingClientRect();
    const dx = oldRect.left - nh.left, dy = oldRect.top - nh.top;
    const sx = oldRect.width/nh.width, sy = oldRect.height/nh.height;
    host.style.transform=`translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    host.style.transformOrigin='top left';
    host.style.transition='transform .35s ease, opacity .35s ease';
    host.style.opacity='0.6';
    requestAnimationFrame(()=>{ host.style.transform='translate(0,0) scale(1,1)'; host.style.opacity='1'; });
    setTimeout(()=>{ host.style.transition=''; host.style.transform=''; },380);
  }
}

function sideMarkup(){
  return `<div class="sidebar-layout" data-header>
    <div class="rail" style="background:linear-gradient(135deg,var(--accent2),var(--accent));border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;gap:12px;align-items:center;min-height:1060px">
      ${avatarHTML()}
      <div class="name" contenteditable>YOUR NAME</div>
      <div class="chips" data-info></div>
      <div data-rail-sections></div>
    </div>
    <div data-zone="main"><div style="height:12px"></div></div>
  </div>`;
}
function fancyMarkup(){
  return `<div class="fancy" data-header>
    <div class="hero" style="border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center">
      <h1 class="name" contenteditable>YOUR NAME</h1>
      <div class="chip-grid" style="display:grid;grid-template-columns:1fr 1fr;column-gap:72px;row-gap:10px;margin:8px auto 0;max-width:740px">
        <div class="chips" data-info-left></div><div class="chips" data-info-right></div>
      </div>
    </div>
    <div class="avatar-float" style="position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:140px;z-index:30">
      ${avatarHTML()}
    </div>
    <div style="height:88px"></div>
  </div>`;
}
function topMarkup(){
  return `<div class="topbar" data-header style="border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px;min-height:160px">
    <div class="topbar-grid" style="display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px">
      <div>
        <h1 class="name" contenteditable>YOUR NAME</h1>
        <div class="chips" data-info></div>
      </div>
      <div style="display:flex;justify-content:flex-end">${avatarHTML(120)}</div>
    </div>
  </div>`;
}

function avatarHTML(size=140){
  const b =  size===120 ? 4 : 5;
  return `<label class="avatar" data-avatar data-empty="${S.avatar?'0':'1'}" style="width:${size}px;height:${size}px;border:${b}px solid #fff;display:block;overflow:hidden;border-radius:999px;background:#d1d5db;box-shadow:0 8px 20px rgba(0,0,0,.18);position:relative;cursor:pointer">
    <input type="file" accept="image/*" style="display:none">
  </label>`;
}

function wireAvatar(root){
  const w = root.querySelector('[data-avatar]'); if(!w) return;
  const input = w.querySelector('input');
  const canvas = document.createElement('canvas');
  const size = parseInt(getComputedStyle(w).width);
  canvas.width = canvas.height = size;
  w.appendChild(canvas);

  const drawFromURL = (url) => {
    const img = new Image(); img.crossOrigin='anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d',{willReadFrequently:true});
      const s = Math.max(canvas.width/img.width, canvas.height/img.height);
      const dw=img.width*s, dh=img.height*s, dx=(canvas.width-dw)/2, dy=(canvas.height-dh)/2;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save(); ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.clip();
      ctx.imageSmoothingQuality='high'; ctx.drawImage(img,dx,dy,dw,dh); ctx.restore();
      S.avatar = canvas.toDataURL('image/png'); // persist
    };
    img.src = url;
  };

  if (S.avatar) drawFromURL(S.avatar);

  w.onclick = () => input.click();
  input.onchange = () => {
    const f = input.files?.[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    drawFromURL(url);
  };
}

export function applyContact(host){
  const nameEl = host.querySelector('.name');
  nameEl.textContent = S.contact.name || 'YOUR NAME';

  const buildChip = (icon, text) =>
    `<div class="chip" style="${chipStyle()}"><i class="${icon}" style="color:var(--accent)"></i><span>${text}</span></div>`;

  const list = [];
  if (S.contact.phone) list.push(buildChip('fa-solid fa-phone', S.contact.phone));
  if (S.contact.email) list.push(buildChip('fa-solid fa-envelope', S.contact.email));
  if (S.contact.address) list.push(buildChip('fa-solid fa-location-dot', S.contact.address));
  if (S.contact.linkedin) list.push(buildChip('fa-brands fa-linkedin', 'linkedin.com/in/'+S.contact.linkedin));

  const L = host.querySelector('[data-info-left]');
  const R = host.querySelector('[data-info-right]');
  const single = host.querySelector('[data-info]');

  if (L && R){
    L.innerHTML=''; R.innerHTML='';
    list.forEach((c,i)=> (i%2 ? R : L).insertAdjacentHTML('beforeend', c));
  }else if (single){
    single.innerHTML = list.join('');
  }
}
function chipStyle(){
  // paper/glass + dark-aware
  if (S.material==='glass'){
    const lightThemes = ['coral','sea','city','magentaPink','blueGreen'];
    const text = lightThemes.includes(S.theme) ? '#111' : '#fff';
    return `background:rgba(255,255,255,.10);backdrop-filter:blur(6px);border:1px solid #ffffff28;color:${text};padding:6px 10px;border-radius:999px;margin:4px;display:inline-flex;gap:8px;align-items:center`;
  }
  if (S.dark){
    return `background:#0c1324;border:1px solid #1f2a44;color:#e6ecff;padding:6px 10px;border-radius:999px;margin:4px;display:inline-flex;gap:8px;align-items:center`;
  }
  return `background:#fff;border:1px solid rgba(0,0,0,.08);color:#111;padding:6px 10px;border-radius:999px;margin:4px;display:inline-flex;gap:8px;align-items:center`;
}
