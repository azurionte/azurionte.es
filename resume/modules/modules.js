// modules/modules.js
import { S } from '../app/state.js';
import { getSideMainHost } from '../layouts/layouts.js';

const $ = (s, r = document) => r.querySelector(s);

// choose where sections render
function getCanvasHost() {
  if (S.layout === 'side') {
    return getSideMainHost() || $('#stack');
  }
  return $('#stack');
}

// ------- SKILLS (keep your existing renderer, just swap host) -------------
export function renderSkills() {
  // remove old
  document.querySelectorAll('[data-section="skills"]').forEach(n => n.closest('.node')?.remove());
  if (!S.skills.length) return;

  const rail = document.querySelector('[data-rail-sections]');
  const host = (S.layout === 'side' && S.skillsInSidebar && rail) ? rail : getCanvasHost();

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.section = 'skills';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-layer-group"></i><div>Skills</div></div>
      <div class="u"></div>
      <div class="tip">Use ★ or the slider to rate your confidence. You can add languages, tools or any ability here.</div>
      <div class="grid-skills ${host===rail ? '' : 'cols-2'}" data-sgrid></div>
      ${(S.layout==='side') ? `<div class="center" style="margin-top:8px">
        <button class="mbtn" id="togglePlace">${S.skillsInSidebar?'Move to canvas':'Move to sidebar'}</button>
      </div>` : '' }
    </div>`;
  const grid = node.querySelector('[data-sgrid]');

  S.skills.forEach(it => {
    const row = document.createElement('div'); row.className='skill';
    row.innerHTML = `<div class="label"><span>${it.label || 'Skill'}</span></div><div class="right"></div>`;
    const R = row.querySelector('.right');
    if (it.type === 'star') {
      const s = document.createElement('div'); s.className='stars';
      for (let i=1;i<=5;i++){
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24'); svg.classList.add('star');
        if (i <= (+it.value||0)) svg.classList.add('active');
        svg.innerHTML = '<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
        svg.onclick = () => { it.value = i; svg.parentElement.querySelectorAll('.star').forEach((e,ix)=>e.classList.toggle('active', ix < i)); };
        s.appendChild(svg);
      }
      R.appendChild(s);
    } else {
      const r = document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50; r.oninput=()=>it.value=r.value; R.appendChild(r);
    }
    grid.appendChild(row);
  });

  // insert
  if (host === $('#stack')) {
    const addWrap = document.querySelector('#canvasAdd');
    host.insertBefore(node, addWrap);
  } else {
    const wrap = document.createElement('div'); wrap.className='node'; wrap.appendChild(node.firstElementChild);
    host.appendChild(wrap);
  }

  const t = node.querySelector('#togglePlace');
  if (t) t.onclick = () => { S.skillsInSidebar = !S.skillsInSidebar; renderSkills(); };
}

// ------- EDUCATION --------------------------------------------------------
export function renderEdu() {
  document.querySelectorAll('[data-section="edu"]').forEach(n => n.closest('.node')?.remove());
  if (!S.edu.length) return;

  const host = getCanvasHost();
  const node = document.createElement('div');
  node.className='node'; node.dataset.section='edu';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-graduation-cap"></i><div>Education</div></div>
      <div class="u"></div>
      <div class="edu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" data-egrid></div>
    </div>`;
  const grid = node.querySelector('[data-egrid]');

  S.edu.forEach(card => {
    const c = document.createElement('div'); c.className='sec';
    const icon = card.kind==='degree' ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>' : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700">${icon}<span>${card.title||'Title'}</span></div>
      <div><span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(card.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px">${card.academy||'Academy name (wraps to two lines if needed)'}</div>`;
    grid.appendChild(c);
  });

  const addWrap = document.querySelector('#canvasAdd');
  host.insertBefore(node, addWrap);
}

// ------- EXPERIENCE -------------------------------------------------------
export function renderExp() {
  document.querySelectorAll('[data-section="exp"]').forEach(n => n.closest('.node')?.remove());
  if (!S.exp.length) return;

  const host = getCanvasHost();
  const node = document.createElement('div');
  node.className='node'; node.dataset.section='exp';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-briefcase"></i><div>Work experience</div></div>
      <div class="u"></div><div class="exp-list" style="display:grid;gap:12px" data-xgrid></div>
    </div>`;
  const grid = node.querySelector('[data-xgrid]');

  S.exp.forEach(x => {
    const c = document.createElement('div'); c.className='sec'; c.style.background='color-mix(in srgb, var(--accent) 12%, #fff)';
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge" style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(x.dates||'Jan 2022').slice(0,16)}</span>
        <div style="font-weight:800;margin-left:6px">${x.role||'Job title'}</div>
      </div>
      <div style="font-weight:700;color:#374151;margin-top:4px">${x.org||'@Company'}</div>
      <div style="margin-top:6px">${x.desc||'Describe impact, scale and results.'}</div>`;
    grid.appendChild(c);
  });

  const addWrap = document.querySelector('#canvasAdd');
  host.insertBefore(node, addWrap);
}

// (optional) simple bio block placeholder
export function renderBio() {
  document.querySelectorAll('[data-section="bio"]').forEach(n => n.closest('.node')?.remove());
  if (!S.bio) return;
  const host = getCanvasHost();
  const node = document.createElement('div');
  node.className='node'; node.dataset.section='bio';
  node.innerHTML = `
    <div class="sec">
      <div class="stitle"><i class="fa-solid fa-user"></i><div>Profile</div></div>
      <div class="u"></div>
      <div>${S.bio}</div>
    </div>`;
  const addWrap = document.querySelector('#canvasAdd');
  host.insertBefore(node, addWrap);
}
