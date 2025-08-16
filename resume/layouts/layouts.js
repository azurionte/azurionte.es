// layouts/layouts.js
// Drop-in: provides quickLayoutSwitch + helpers without touching any other file.

const QS = sel => document.querySelector(sel);
const QSA = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- public helpers ---------- */
export function getStack() {
  // main stack on the page
  return QS('#sheet .stack') || QS('.stack');
}
export function getHeaderNode() {
  const stack = getStack();
  const hdr = stack?.querySelector('[data-header]');
  return hdr ? hdr.closest('.node') : null;
}

/* ---------- data snapshot/restore ---------- */
function snapshotHeader() {
  const hdrNode = getHeaderNode();
  if (!hdrNode) return null;

  const root = hdrNode.querySelector('[data-header]');
  const snap = {
    name: (root.querySelector('.name')?.textContent || 'YOUR NAME').trim(),
    chips: [],
    avatarImage: null
  };

  // copy chips (icon class + text)
  const chipAreas = QSA('[data-info],[data-info-left],[data-info-right]', root);
  chipAreas.forEach(area => {
    QSA('.chip', area).forEach(ch => {
      const i = ch.querySelector('i');
      const icon = i ? Array.from(i.classList).join(' ') : '';
      const text = ch.textContent.trim();
      snap.chips.push({ icon, text });
    });
  });

  // copy avatar canvas, if any
  const oldCanvas = root.querySelector('.avatar canvas');
  if (oldCanvas) {
    const off = document.createElement('canvas');
    off.width = oldCanvas.width;
    off.height = oldCanvas.height;
    off.getContext('2d').drawImage(oldCanvas, 0, 0);
    snap.avatarImage = off;
  }
  return snap;
}

function buildChip({ icon, text }) {
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<i class="${icon || 'fa-solid fa-circle'}"></i><span>${text || ''}</span>`;
  return el;
}

function paintAvatar(canvas, sourceCanvas) {
  if (!canvas || !sourceCanvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);
}

/* ---------- layout DOM builders ---------- */
function tplSidebar() {
  const wrap = document.createElement('div');
  wrap.className = 'node';
  // two-column layout; right column hosts sections in an internal grid (so they never go under the rail)
  wrap.innerHTML = `
    <div class="sidebar-layout" data-header>
      <div class="rail">
        <label class="avatar" data-avatar data-empty="1" style="width:140px;height:140px;border-width:5px">
          <input type="file" accept="image/*">
        </label>
        <div class="name" contenteditable>YOUR NAME</div>
        <div class="chips" data-info></div>
        <div class="sec-holder" data-rail-sections></div>
      </div>
      <div data-main style="display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-content:start"></div>
    </div>`;
  return wrap;
}

function tplFancy() {
  const wrap = document.createElement('div');
  wrap.className = 'node';
  wrap.innerHTML = `
    <div class="fancy" data-header>
      <div class="hero">
        <h1 class="name" contenteditable>YOUR NAME</h1>
        <div class="chip-grid">
          <div class="chips" data-info-left></div>
          <div class="chips" data-info-right></div>
        </div>
      </div>
      <div class="avatar-float">
        <label class="avatar" data-avatar data-empty="1" style="width:140px;height:140px;border-width:5px">
          <input type="file" accept="image/*">
        </label>
      </div>
      <div class="below"></div>
    </div>`;
  return wrap;
}

function tplTopbar() {
  const wrap = document.createElement('div');
  wrap.className = 'node';
  wrap.innerHTML = `
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
  return wrap;
}

/* ---------- internal helpers ---------- */
function initAvatarPicker(root) {
  QSA('[data-avatar]', root).forEach(w => {
    const input = w.querySelector('input');
    const canvas = document.createElement('canvas');
    canvas.width = 140; canvas.height = 140;
    w.appendChild(canvas);

    w.onclick = (e) => {
      // don’t trigger when clicking the file input itself
      if (e.target !== input) input.click();
    };
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => {
        const s = Math.max(canvas.width / img.width, canvas.height / img.height);
        const dw = img.width * s, dh = img.height * s;
        const dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

function applySnapshot(root, snap) {
  if (!snap) return;

  // name
  const nameEl = root.querySelector('.name');
  if (nameEl) nameEl.textContent = snap.name || 'YOUR NAME';

  // chips — distribute left/right if fancy, otherwise single area
  const left = root.querySelector('[data-info-left]');
  const right = root.querySelector('[data-info-right]');
  const single = root.querySelector('[data-info]');

  if (left && right) {
    // alternate
    snap.chips.forEach((c, i) => {
      (i % 2 ? right : left).appendChild(buildChip(c));
    });
  } else if (single) {
    snap.chips.forEach(c => single.appendChild(buildChip(c)));
  }

  // avatar
  const cv = root.querySelector('.avatar canvas');
  if (cv && snap.avatarImage) paintAvatar(cv, snap.avatarImage);
  initAvatarPicker(root);
}

/* Move (or restore) content sections so sidebar layout houses them in the right column */
function hoistSectionsIntoMain(newHeaderNode) {
  const main = newHeaderNode.querySelector('[data-main]');
  if (!main) return;

  const stack = getStack();
  // Everything after header that is a "section node" gets moved into the sidebar main grid
  const siblings = [];
  let cur = newHeaderNode.nextElementSibling;
  while (cur) {
    if (cur.matches('.node') && cur.querySelector('[data-section]')) siblings.push(cur);
    cur = cur.nextElementSibling;
  }
  siblings.forEach(n => main.appendChild(n));
}

function restoreSectionsBackToStack(oldHeaderNode) {
  // When leaving sidebar, put sections back right after the soon-to-be old header’s position
  const stack = getStack();
  const main = oldHeaderNode?.querySelector('[data-main]');
  if (!main) return;

  const anchor = oldHeaderNode; // insert after this
  const items = QSA('.node', main);
  items.forEach(n => stack.insertBefore(n, anchor.nextSibling));
}

/* ---------- core: render + morph ---------- */
function renderLayout(key, prevHeaderRect) {
  const stack = getStack();
  if (!stack) return;

  const snap = snapshotHeader();             // grab existing data (if any)
  const oldHeaderNode = getHeaderNode();     // for section restoration

  // if we are leaving sidebar, first restore nodes to the main stack
  if (oldHeaderNode && oldHeaderNode.querySelector('[data-main]')) {
    restoreSectionsBackToStack(oldHeaderNode);
  }

  // remove old header
  if (oldHeaderNode) oldHeaderNode.remove();

  // create new header
  let fresh;
  if (key === 'header-side') fresh = tplSidebar();
  else if (key === 'header-top') fresh = tplTopbar();
  else fresh = tplFancy(); // 'header-fancy'

  // insert at the top of the stack
  stack.insertBefore(fresh, stack.firstChild);

  // fill with previous data
  applySnapshot(fresh, snap);

  // If this is sidebar, swallow the content nodes into the right column
  if (fresh.querySelector('[data-main]')) {
    hoistSectionsIntoMain(fresh);
  }

  // morph animation (FLIP-ish) using previous header rect if provided
  if (prevHeaderRect) {
    const nh = fresh.getBoundingClientRect();
    const dx = prevHeaderRect.left - nh.left;
    const dy = prevHeaderRect.top - nh.top;
    const sx = prevHeaderRect.width / nh.width;
    const sy = prevHeaderRect.height / nh.height;
    const target = fresh; // animate the outer node

    target.style.transformOrigin = 'top left';
    target.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    target.style.opacity = '0.6';
    target.style.transition = 'transform .35s ease, opacity .35s ease';

    requestAnimationFrame(() => {
      target.style.transform = 'translate(0,0) scale(1,1)';
      target.style.opacity = '1';
    });
    setTimeout(() => {
      target.style.transition = '';
      target.style.transform = '';
    }, 380);
  }
}

/* ---------- PUBLIC API ---------- */
export function quickLayoutSwitch(key) {
  // key: 'header-side' | 'header-fancy' | 'header-top'
  const oldRect = getHeaderNode()?.getBoundingClientRect();
  renderLayout(key, oldRect);
}

// A tiny helper some callers may want for initial mount:
export function ensureLayout(keyIfNone = 'header-fancy') {
  if (!getHeaderNode()) quickLayoutSwitch(keyIfNone);
}

export { quickLayoutSwitch as morphTo };

