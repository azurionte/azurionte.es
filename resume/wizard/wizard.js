// /resume/welcome/wizard.js
// Wizard UI (layout/theme/profile/skills/education/experience/bio)
// v1.0
console.log('[wizard.js] v1.0');

import { S } from '../app/state.js';
import { morphTo } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio, updatePlusMenu } from '../modules/modules.js';

/* ---------- one-time styles for wizard cards (hover + selected) ---------- */
(function ensureWizardStyles(){
  if (document.getElementById('wizardStyles')) return;
  const css = `
    .mock{position:relative;min-height:130px;border:1px solid #1f2540;border-radius:14px;
      padding:14px;background:#0c1324;transition:transform .15s ease,box-shadow .15s ease,outline-color .15s ease}
    .mock:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(0,0,0,.35)}
    .mock.sel{outline:2px solid #ffb86c}
    .mock .hero{border-radius:12px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)}
    .mock .line{height:8px;border-radius:999px;background:#2b375f}
    .mock.sidebar .hero{position:absolute;inset:14px auto 14px 14px;width:30%}
    .mock.sidebar .pp{position:absolute;left:34px;top:34px;width:42px;height:42px;border-radius:50%;background:#cfd6ff;border:3px solid #fff}
    .mock.sidebar .txt{position:absolute;left:38%;right:20px;top:26px;display:grid;gap:10px}
    .mock.fancy .hero{height:64px;margin:8px}
    .mock.fancy .pp{position:absolute;left:50%;transform:translateX(-50%);top:58px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff}
    .mock.fancy .txt{position:absolute;left:26px;right:26px;top:120px;display:grid;gap:10px}
    .mock.topbar .hero{height:64px;margin:8px}
    .mock.topbar .pp{position:absolute;right:31px;top:22px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff}
    .mock.topbar .txt{position:absolute;left:26px;right:120px;top:28px;display:grid;gap:10px}
  `;
  const tag = document.createElement('style');
  tag.id = 'wizardStyles';
  tag.textContent = css;
  document.head.appendChild(tag);
})();

/* ------------------------ public: build the wizard ------------------------ */
export function mountWizard(container){
  container.innerHTML = `
    <div class="wtitle">Choose your layout</div><div class="wsub">Pick a starting header style.</div>
    <div class="wrow" style="display:grid;gap:14px">
      <div class="mock sidebar" data-layout="header-side">
        <div class="hero"></div><div class="pp"></div>
        <div class="txt"><div class="line" style="width:60%"></div><div class="line" style="width:40%"></div><div class="line" style="width:56%"></div></div>
      </div>
      <div class="mock fancy" data-layout="header-fancy">
        <div class="hero"></div><div class="pp"></div>
        <div class="txt"><div class="line" style="width:70%"></div><div class="line" style="width:48%"></div></div>
      </div>
      <div class="mock topbar" data-layout="header-top">
        <div class="hero"></div><div class="pp"></div>
        <div class="txt"><div class="line" style="width:60%"></div><div class="line" style="width:40%"></div></div>
      </div>
    </div>
    <div class="k-row" style="margin-top:12px">
      <button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button>
    </div>
  `;

  // show current selection
  const key = S.layout==='side' ? 'header-side' : S.layout==='fancy' ? 'header-fancy' :
              S.layout==='top'  ? 'header-top'  : null;
  if (key) container.querySelector(`[data-layout="${key}"]`)?.classList.add('sel');

  // click → toggle sel + morph
  container.querySelectorAll('.mock').forEach(m=>{
    m.addEventListener('click', ()=>{
      container.querySelectorAll('.mock').forEach(x=>x.classList.remove('sel'));
      m.classList.add('sel');
      morphTo(m.dataset.layout);
      // after a morph, re-place sections (in case user already added some)
      renderSkills(); renderEdu(); renderExp(); renderBio(); updatePlusMenu();
    });
  });

  // upload photo shortcut
  container.querySelector('#wizAddPhoto').onclick = ()=>{
    document.querySelector('[data-header] [data-avatar] input')?.click();
  };
}

/* ------------- advance API used by your existing Next button ------------- */
export function advanceWizard(stepKey){
  // persist + paint when leaving certain steps (keeps your current flow)
  if (stepKey==='skills'){ renderSkills(); updatePlusMenu(); }
  if (stepKey==='education'){ renderEdu(); }
  if (stepKey==='experience'){ renderExp(); }
  if (stepKey==='bio'){ renderBio(); }
}
