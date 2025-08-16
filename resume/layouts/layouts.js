// layouts/layouts.js
// responsible for building header for each layout, FLIP morphing between them,
// and applying contact chips/name into the active header.

import { S } from '../app/state.js';

// --- internal helpers -------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function headerNode() {
  return $('#stack')?.querySelector('[data-header]')?.closest('.node') || null;
}

function injectLayoutCSSOnce() {
  if (document.getElementById('layout-css')) return;
  const css = `
  /* header-only styles injected by layouts.js */
  .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px}
  .avatar input{display:none}
  .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}

  .sidebar-layout{display:grid;grid-template-columns:var(--rail) minmax(0,1fr);gap:16px;min-height:320px}
  .sidebar-layout .rail{background:linear-gradient(135deg,var(--accent2),var(--accent));
    border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;gap:12px;align-items:center;
    min-height:100%; align-self:stretch}
  .sidebar-layout .rail .name{font-weight:900;font-size:26px;text-align:center}
  .sidebar-layout .rail .chips{display:flex;flex-direction:column;gap:8px;width:100%}
  .sidebar-layout .rail .sec-holder{width:100%;padding-top:6px}
  .sidebar-layout [data-zone="main"]{min-height:200px;display:flex;flex-direction:column;gap:16px}

  .topbar{position:relative;border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:16px;min-height:160px}
  .topbar-grid{display:grid;grid-template-columns:60% 40%;align-items:center;gap:18px}
  .topbar .name{font-weight:900;font-size:34px;margin:0;text-align:left}
  .topbar .right{display:flex;justify-content:flex-end}
  .topbar .right .avatar{width:120px;height:120px;border-width:4px}

  .fancy{position:relative;border-radius:14px}
  .fancy .hero{border-radius:14px;padding:18px 14px 26px;min-height:200px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center}
  .fancy .name{font-weight:900;font-size:34px;margin:0;text-align:center}
  .fancy .chip-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:72px;row-gap:10px;margin:8px auto 0;max-width:740px}
  .fancy .avatar-float{position:absolute;left:50%;transform:translateX(-50%);width:140px;height:140px;top:140px;z-index:30}
  .fancy .below{height:88px}

  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{display:flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;border:1px solid rgba(0,0,0,.08);background:#fff;color:#111}
  [data-dark="1"] .chip{background:#0c1324;color:#e6ecff;border-color:#1f2a44}
  body[data-mat="glass"] .chip{background:rgba(255,255,255,.1);border-color:#ffffff28;backdrop-filter:blur(6px)}
  .chip i{width:16px;text-align:center}
  `;
  const tag = document.createElement('style');
  tag.id = 'layout-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

function addChip(icon, text) {
  const div = document.createElement('div');
  div.className = 'chip';
  div.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  return div;
}

// keep avatar uploader local so layouts.js is self-contained
function initAvatars(root) {
  $$('.avatar', root).forEach(w => {
    const input = $('input', w);
    if (!input) return;
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    w.addEventListener('click', () => input.click());
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      const img = new Image();
      img.onload = () => {
        const s = Math.max(canvas.width / img.width, canvas.height / img.height);
        const dw = img.width * s, dh = img.height * s;
        const dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        w.setAttribute('data-empty', '0');
      };
      img.src = URL.createObjectURL(f);
    };
  });
}

function buildHeader(layout) {
  // remove existing header
  const old = headerNode();
  if (old) old.remove();

  const stack = $('#stack');
  const addWrap = $('#canvasAdd');
  const node = document.createElement('div');
  node.className = 'node';
  node.setAttribute('data-locked', '1');

  if (layout === 'side') {
    node.innerHTML = `
      <div class="sidebar-layout" data-header>
        <div class="rail">
          <label class="avatar" data-empty="1"><input type="file" accept="image/*"></label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main">
          <!-- main content (skills/edu/exp when sidebar) goes here -->
        </div>
      </div>`;
  } else if (layout === 'fancy') {
    node.innerHTML = `
      <div class="fancy" data-header>
        <div class="hero">
          <h1 class="name" contenteditable>YOUR NAME</h1>
          <div class="chip-grid"><div class="chips" data-info-left></div><div class="chips" data-info-right></div></div>
        </div>
        <div class="avatar-float"><label class="avatar" data-empty="1"><input type="file" accept="image/*"></label></div>
        <div class="below"></div>
      </div>`;
  } else {
    node.innerHTML = `
      <div class="topbar" data-header>
        <div class="topbar-grid">
          <div class="left">
            <h1 class="name" contenteditable>YOUR NAME</h1>
            <div class="chips" data-info></div>
          </div>
          <div class="right">
            <label class="avatar" data-empty="1" style="width:120px;height:120px;border-width:4px"><input type="file" accept="image/*"></label>
          </div>
        </div>
      </div>`;
  }

  stack.insertBefore(node, addWrap);
  initAvatars(node);
  S.layout = layout;
  return node;
}

function normalize(kind) {
  if (kind === 'header-side') return 'side';
  if (kind === 'header-fancy') return 'fancy';
  if (kind === 'header-top') return 'top';
  return ['side','fancy','top'].includes(kind) ? kind : 'side';
}

// --- public API ------------------------------------------------------------

export function morphTo(kind) {
  injectLayoutCSSOnce();

  const layout = normalize(kind);
  const old = headerNode();
  const prev = old?.getBoundingClientRect();

  const node = buildHeader(layout);

  // FLIP-ish morph
  if (prev) {
    const nh = node.getBoundingClientRect();
    const dx = prev.left - nh.left, dy = prev.top - nh.top;
    const sx = prev.width / nh.width, sy = prev.height / nh.height;
    node.style.transformOrigin = 'top left';
    node.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
    node.style.opacity = '0.6';
    node.style.transition = 'transform .35s ease, opacity .35s ease';
    requestAnimationFrame(() => {
      node.style.transform = 'translate(0,0) scale(1,1)';
      node.style.opacity = '1';
    });
    setTimeout(() => { node.style.transition = ''; node.style.transform = ''; }, 380);
  }

  // after (re)building header, re-apply current contact into chips/name
  applyContact(S.contact);
  // notify others (editor/modules) to re-place plus or re-render if needed
  document.dispatchEvent(new CustomEvent('layout:changed', {
    detail: {
      layout,
      main: getSideMainHost(),
      rail: $('[data-rail-sections]')
    }
  }));
}

export function applyContact(contact) {
  const h = headerNode(); if (!h) return;
  const root = h.querySelector('[data-header]');
  const isFancy = !!root.querySelector('.chip-grid');

  // name
  const nameEl = root.querySelector('.name');
  if (nameEl) nameEl.textContent = contact?.name || 'YOUR NAME';

  // chips
  const chips = [];
  if (contact?.phone)   chips.push(addChip('fa-solid fa-phone', contact.phone));
  if (contact?.email)   chips.push(addChip('fa-solid fa-envelope', contact.email));
  if (contact?.address) chips.push(addChip('fa-solid fa-location-dot', contact.address));
  if (contact?.linkedin)chips.push(addChip('fa-brands fa-linkedin', `linkedin.com/in/${contact.linkedin}`));

  // clear + place
  const infoBoxes = [...root.querySelectorAll('[data-info],[data-info-left],[data-info-right]')];
  infoBoxes.forEach(b => b.innerHTML = '');

  if (isFancy) {
    const L = root.querySelector('[data-info-left]');
    const R = root.querySelector('[data-info-right]');
    chips.forEach((c, i) => (i % 2 ? R : L).appendChild(c));
  } else {
    const box = root.querySelector('[data-info]');
    chips.forEach(c => box.appendChild(c));
  }
}

// expose where modules should render content when S.layout === 'side'
export function getSideMainHost() {
  return headerNode()?.querySelector('[data-zone="main"]') || null;
}
