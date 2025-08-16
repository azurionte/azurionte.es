// /resume/layouts/layouts.js

// ------- utilities -------
function $(sel, root = document) { return root.querySelector(sel); }

function getStack() {
  return document.querySelector('#stack') || document.querySelector('.stack');
}
export function getHeaderNode() {
  const stack = getStack();
  return stack?.querySelector('[data-header]')?.closest('.node') || null;
}

// Tiny helper to create a chip
function makeChip(icon, text) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  return chip;
}

// ------- public: applyContact(S) -------
// Writes name + contact chips into whichever header is currently mounted.
export function applyContact(S) {
  const header = getHeaderNode();
  if (!header || !S) return;

  // name
  const nameEl = header.querySelector('.name');
  if (nameEl) nameEl.textContent = (S.contact?.name || 'YOUR NAME');

  // chips (only for filled fields)
  const c = S.contact || {};
  const chips = [];
  if (c.phone)    chips.push(makeChip('fa-solid fa-phone', c.phone));
  if (c.email)    chips.push(makeChip('fa-solid fa-envelope', c.email));
  if (c.address)  chips.push(makeChip('fa-solid fa-location-dot', c.address));
  if (c.linkedin) chips.push(makeChip('fa-brands fa-linkedin', `linkedin.com/in/${c.linkedin}`));

  const single = header.querySelector('[data-info]');
  const left   = header.querySelector('[data-info-left]');
  const right  = header.querySelector('[data-info-right]');

  [single, left, right].forEach(box => { if (box) box.innerHTML = ''; });

  if (left && right) {
    chips.forEach((chip, i) => (i % 2 ? right : left).appendChild(chip));
  } else if (single) {
    chips.forEach(chip => single.appendChild(chip));
  }

  // Let app theme pass recolor chips if present (no duplication)
  if (window.applyChipThemeAll) window.applyChipThemeAll();
}

// ------- internal: header templates -------
function headerHTML(kind) {
  if (kind === 'header-side') {
    return `
      <div class="sidebar-layout" data-header>
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*"></label>
          <div class="name" contenteditable>YOUR NAME</div>
          <div class="chips" data-info></div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main">
          <div class="add-squircle"><div class="add-dot" data-local-plus>+</div></div>
        </div>
      </div>
    `;
  }
  if (kind === 'header-fancy') {
    return `
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
      </div>
    `;
  }
  // header-top
  return `
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
    </div>
  `;
}

// ------- public: morphTo(kind, S) -------
// Replaces the header, animates the change, and re-applies contact data.
// Accepts kind: 'header-side' | 'header-fancy' | 'header-top'
export function morphTo(kind, S) {
  const stack = getStack();
  const old = getHeaderNode();
  const addWrap = $('#canvasAdd') || $('#canvas-add') || $('.add-squircle');

  // Save old rect for FLIP
  const prevRect = old?.getBoundingClientRect();

  if (old) old.remove();

  // Build new header node
  const node = document.createElement('div');
  node.className = 'node';
  node.setAttribute('data-locked', '1');
  node.innerHTML = headerHTML(kind);

  // Insert before plus button to keep header at the top
  stack.insertBefore(node, addWrap || null);

  // Initialize avatar only if the app exposed a single implementation
  if (window.initAvatars) window.initAvatars(node);

  // Re-apply contact data so name/chips persist across layouts
  applyContact(S);

  // Re-tint chips after layout swap (theme/glass/dark)
  if (window.applyChipThemeAll) window.applyChipThemeAll();

  // FLIP-ish morph animation
  if (prevRect) {
    const nh = node.getBoundingClientRect();
    const dx = prevRect.left - nh.left;
    const dy = prevRect.top - nh.top;
    const sx = prevRect.width / nh.width;
    const sy = prevRect.height / nh.height;
    node.style.transformOrigin = 'top left';
    node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    node.style.opacity = '0.6';
    node.style.transition = 'transform .35s ease, opacity .35s ease';
    requestAnimationFrame(() => {
      node.style.transform = 'translate(0,0) scale(1,1)';
      node.style.opacity = '1';
    });
    setTimeout(() => { node.style.transition = ''; node.style.transform = ''; }, 380);
  }
}

// Backward-compat names (so old imports don’t break)
export { morphTo as quickLayoutSwitch };
export { applyContact as saveContact };
