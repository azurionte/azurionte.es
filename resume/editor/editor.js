// /resume/editor/editor.js
// [editor.js] v1.6.3 — theme swatches + menu + preview/print + keeps "+" in right host
console.log('[editor.js] v1.6.3');

import { S, save } from '../app/state.js';
import { morphTo } from '../layouts/layouts.js';
import { openAddMenu } from '../modules/modules.js';

const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

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
            <div class="theme-row" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px">
              ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
                .map(k => `<div class="swatch" data-k="${k}" title="${k}"
                     style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;
                            background:linear-gradient(135deg,${A1[k]},${A2[k]})"></div>`).join('')}
            </div>
            <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="darkToggle" class="switch ${S.dark?'on':''}"></div></div>
            <div class="k-row"><span>Material</span>
              <button class="mbtn" data-mat="paper">Paper</button>
              <button class="mbtn" data-mat="glass">Glass</button>
            </div>
            <div style="border-top:1px solid #23283b;margin:10px 0"></div>
            <div class="k-row"><span>Custom gradient</span>
              <input type="color" id="c1" value="${A1[S.theme]||'#8b5cf6'}">
              <input type="color" id="c2" value="${A2[S.theme]||'#d946ef'}">
              <button class="mbtn" id="applyGrad">Apply</button>
            </div>
          </div>
        </div>

        <button id="btnPrint" class="mbtn"><i class="fa-solid fa-download"></i> Download</button>
        <button id="btnPreview" class="mbtn">Preview</button>
      </div>
    </div>
  `;

  // Dropdown wiring
  const dds = [...top.querySelectorAll('.dropdown')];
  dds.forEach(dd => dd.querySelector('button').onclick = () => dd.classList.toggle('open'));
  document.addEventListener('click', e => dds.forEach(dd => { if(!dd.contains(e.target)) dd.classList.remove('open'); }));

  // File actions
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

  // Theme actions
  top.querySelectorAll('.swatch').forEach(s => s.onclick = () => onThemePick(s.dataset.k));
  top.querySelector('#darkToggle').onclick = e => {
    const on = e.currentTarget.classList.toggle('on');
    onDarkToggle(on);
    document.body.setAttribute('data-dark', on ? '1' : '0');
  };
  top.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => onMaterialPick(b.dataset.mat));
  top.querySelector('#applyGrad').onclick = () => onCustomGradient(
    top.querySelector('#c1').value, top.querySelector('#c2').value
  );

  // Preview/print
  top.querySelector('#btnPreview').onclick = () => {
    const on = !document.body.classList.contains('preview');
    document.body.classList.toggle('preview', on);
    top.querySelector('#btnPreview').textContent = on ? 'Exit preview' : 'Preview';
  };
  top.querySelector('#btnPrint').onclick = () => {
    const was = document.body.classList.contains('preview');
    document.body.classList.add('preview'); setTimeout(() => { window.print(); if(!was) document.body.classList.remove('preview'); }, 60);
  };

  // Canvas shell
  const root = document.getElementById('canvas-root');
  root.innerHTML = `
    <div class="page" id="page"><div id="sheet">
      <div class="stack" id="stack">
        <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
      </div>
    </div></div>
    <div class="pop" id="addMenu" aria-hidden="true"><div class="tray" id="addTray"></div></div>
  `;

  // Add menu open
  root.querySelector('#dotAdd').onclick = (e) => openAddMenu(e.currentTarget);

  // Layout morph quick switch
  top.querySelector('#layoutQuick').addEventListener('click', e => {
    const k = e.target.closest('[data-layout]')?.dataset.layout; if(!k) return;
    morphTo(k);
    // keep the + inside the right host after morph
    setTimeout(() => {
      const plus = document.getElementById('canvasAdd');
      const main = document.querySelector('[data-header] [data-zone="main"]') || document.getElementById('stack');
      if (plus && plus.parentElement !== main) main.appendChild(plus);
      plus.style.display='flex';
    }, 380);
    top.querySelector('#ddLayout').classList.remove('open');
  });
}

// ---- tiny helper for layout mocks in dropdown ----
function mock(layoutKey,label){
  const kind = layoutKey.split('-')[1];
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
