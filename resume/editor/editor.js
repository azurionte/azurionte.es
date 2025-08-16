// resume/editor/editor.js
// Builds top bar, theme menu, preview/print and the canvas shell
import { S, save } from '../app/state.js';
import { morphTo } from '../layouts/layouts.js';
import { openAddMenu } from '../modules/modules.js';

export function mountEditor({ onThemePick, onDarkToggle, onMaterialPick, onCustomGradient }){
  const top = document.getElementById('topbar-root');
  top.innerHTML = `
    <div class="nav">
      <span class="brand">Easy Resume</span>
      <div class="menu">
        <div class="dropdown" id="ddFile">
          <button class="mbtn">File ▾</button>
          <div class="dropdown-menu">
            <button id="btnSave"><i class="fa-solid fa-floppy-disk"></i> Save project</button>
            <button id="btnLoad"><i class="fa-solid fa-folder-open"></i> Load project</button>
            <button id="btnScratch"><i class="fa-solid fa-eraser"></i> Start from scratch</button>
          </div>
        </div>

        <div class="dropdown" id="ddLayout">
          <button class="mbtn">Layout options ▾</button>
          <div class="dropdown-menu" style="width:340px">
            <div id="layoutQuick" style="display:grid;gap:10px">
              ${mock('header-side','Sidebar')}
              ${mock('header-fancy','Top fancy')}
              ${mock('header-top','Top bar')}
            </div>
          </div>
        </div>

        <div class="dropdown" id="ddTheme">
          <button class="mbtn">Theme ▾</button>
          <div class="dropdown-menu theme-pop">
            <div class="theme-row">
              ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
                .map(k => `<div class="swatch" data-k="${k}"></div>`).join('')}
            </div>
            <div class="k-row"><span>Dark mode</span><div id="darkToggle" class="switch ${S.dark?'on':''}"></div></div>
            <div class="k-row"><span>Material</span>
              <button class="mbtn" data-mat="paper">Paper</button>
              <button class="mbtn" data-mat="glass">Glass</button>
            </div>
            <div style="border-top:1px solid #23283b;margin:10px 0"></div>
            <div class="k-row"><span>Custom gradient</span>
              <input type="color" id="c1" value="#8b5cf6">
              <input type="color" id="c2" value="#d946ef">
              <button class="mbtn" id="applyGrad">Apply</button>
            </div>
          </div>
        </div>

        <button id="btnPrint" class="mbtn"><i class="fa-solid fa-download"></i> Download</button>
        <button id="btnPreview" class="mbtn">Preview</button>
      </div>
    </div>
  `;

  // dropdown wiring
  const dds = [...top.querySelectorAll('.dropdown')];
  dds.forEach(dd => dd.querySelector('button').onclick = () => dd.classList.toggle('open'));
  document.addEventListener('click', e => dds.forEach(dd => { if(!dd.contains(e.target)) dd.classList.remove('open'); }));

  // file actions
  top.querySelector('#btnSave').onclick = () => {
    save();
    const blob = new Blob([localStorage.getItem('erb3-state')||'{}'], {type:'application/json'});
    const a = document.createElement('a');
    a.download = 'resume-project.json'; a.href = URL.createObjectURL(blob); a.click();
  };
  top.querySelector('#btnLoad').onclick = async () => {
    const ipt = document.createElement('input'); ipt.type='file'; ipt.accept='application/json';
    ipt.onchange = () => {
      const f = ipt.files?.[0]; if(!f) return;
      const r = new FileReader();
      r.onload = () => { try { const obj = JSON.parse(r.result); Object.assign(S,obj); location.reload(); } catch {} };
      r.readAsText(f);
    };
    ipt.click();
  };
  top.querySelector('#btnScratch').onclick = () => { localStorage.removeItem('erb3-state'); location.reload(); };

  // theme actions
  top.querySelector('#darkToggle').onclick = e => onDarkToggle(e.currentTarget.classList.toggle('on'));
  top.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => onMaterialPick(b.dataset.mat));
  top.querySelectorAll('.swatch').forEach(s => s.onclick = () => onThemePick(s.dataset.k));
  top.querySelector('#applyGrad').onclick = () => onCustomGradient(
    top.querySelector('#c1').value, top.querySelector('#c2').value
  );

  // preview/print
  top.querySelector('#btnPreview').onclick = () => {
    const on = !document.body.classList.contains('preview');
    document.body.classList.toggle('preview', on);
    top.querySelector('#btnPreview').textContent = on ? 'Exit preview' : 'Preview';
  };
  top.querySelector('#btnPrint').onclick = () => { 
    const was = document.body.classList.contains('preview');
    document.body.classList.add('preview'); setTimeout(() => { window.print(); if(!was) document.body.classList.remove('preview'); }, 60);
  };

  // quick layout switch (keeps morphing)
  top.querySelector('#layoutQuick').addEventListener('click', e => {
    const k = e.target.closest('[data-layout]')?.dataset.layout; if(!k) return;
    const prevHeaderRect = document.querySelector('[data-header]')?.getBoundingClientRect();
    morphTo(k); // implemented in layouts/layouts.js
    // fallback: if layouts.js doesn't dispatch an event, still nudge the + after morph
    setTimeout(ensurePlusAtEnd, prevHeaderRect ? 380 : 50);
    top.querySelector('#ddLayout').classList.remove('open');
  });

  // build canvas shell (page + stack + add btn)
  const root = document.getElementById('canvas-root');
  root.innerHTML = `
    <div class="page" id="page"><div id="sheet">
      <div class="stack" id="stack">
        <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
      </div>
    </div></div>
    <div class="pop" id="addMenu" aria-hidden="true"><div class="tray" id="addTray"></div></div>
  `;

  // add menu
  root.querySelector('#dotAdd').onclick = (e) => openAddMenu(e.currentTarget);

  // --- PLUS BUTTON HOSTING (Sidebar support) ------------------------------
  const addWrap = root.querySelector('#canvasAdd');
  const stackEl = root.querySelector('#stack');

  function currentHost(){
    // if Sidebar layout, place sections on the right side of the rail
    const main = document.querySelector('[data-header] [data-zone="main"]');
    return (S.layout === 'side' && main) ? main : stackEl;
  }

  function ensurePlusAtEnd(){
    const host = currentHost();
    if (!host) return;
    if (addWrap.parentElement !== host) host.appendChild(addWrap);
    addWrap.style.display = 'flex';
  }

  // initial placement
  ensurePlusAtEnd();

  // listen for layout changes if layouts.js emits a custom event
  document.addEventListener('layout:changed', ensurePlusAtEnd);

  // robust fallback: observe header insertion/replacement (works even without events)
  const mo = new MutationObserver(() => ensurePlusAtEnd());
  mo.observe(stackEl, { childList:true, subtree:true });
}

// ---- tiny helper to render the small layout mocks in the dropdown --------
function mock(layoutKey,label){
  const kind = layoutKey.split('-')[1]; // side/fancy/top
  const hero = (kind==='side')
    ? `<div style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;left:30px;top:30px;width:42px;height:42px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
         <div style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
       </div>`
    : kind==='fancy'
    ? `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;left:50%;transform:translateX(-50%);top:58px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:24px;top:120px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#2b375f;width:70%"></div>
         <div style="height:8px;border-radius:999px;background:#2b375f;width:48%"></div>
       </div>`
    : `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;right:31px;top:22px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:120px;top:28px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
         <div style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
       </div>`;
  return `<div class="mock" data-layout="${layoutKey}" style="position:relative;min-height:130px;border:1px solid #1f2540;border-radius:14px;padding:10px;background:#0c1324">${hero}</div>`;
}
