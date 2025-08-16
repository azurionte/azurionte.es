// /resume/wizard/wizard.js
// [wizard.js] v2.9.2
console.log('[wizard.js] v2.9.2');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import {
  renderSkills, renderEdu, renderExp, renderBio,
  ensureSkillsSection, addSkillStar, addSkillSlider,
  ensureEduSection, addEduCourse, addEduDegree,
  ensureExpSection, addExpRole
} from '../modules/modules.js';

/* ---------- mock styles (unchanged) ---------- */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style');
  st.id = 'wizard-style';
  st.textContent = `
    #wizard .wz-mock{ width:450px;height:158px;position:relative;cursor:pointer;margin:8px 0;border-radius:18px;transition:transform .15s ease, box-shadow .15s ease, outline .15s ease; }
    #wizard .wz-mock:hover{ transform:translateY(-2px); box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 2px #7c99ff44 inset; }
    #wizard .wz-mock.sel{ outline:2px solid #ffb86c; }
    #wizard .wz-card{ position:absolute; inset:0; border-radius:16px; padding:12px; background:linear-gradient(135deg,#5d71b4,#2e3c79); box-shadow:inset 0 1px 0 #ffffff12, 0 10px 28px rgba(0,0,0,.38); overflow:hidden; }
    #wizard .wz-pill{ height:10px; border-radius:999px; background:#2b375f; }
    #wizard .wz-pp{ width:74px;height:74px;border-radius:50%; background:#cfd6ff; border:4px solid #ffffffc0; box-shadow:0 10px 24px rgba(0,0,0,.35); }

    /* Sidebar */
    #wizard .wz-mock--side .wz-left{ position:absolute; left:12px; top:12px; bottom:12px; width:162px; border-radius:14px; background:linear-gradient(160deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
    #wizard .wz-mock--side .wz-right{ position:absolute; left:192px; right:20px; top:24px; display:grid; row-gap:12px; }
    #wizard .wz-mock--side .wz-right .wz-l1{ width:72%; } #wizard .wz-mock--side .wz-right .wz-l2{ width:56%; } #wizard .wz-mock--side .wz-left .wz-under{ width:72%; }

    /* Top fancy (restored) */
    #wizard .wz-mock--fancy .wz-hero{ position:absolute; left:12px; right:12px; top:12px; height:68px; border-radius:14px; background:linear-gradient(135deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14; }
    #wizard .wz-mock--fancy .wz-pp{ position:absolute; left:50%; transform:translateX(-50%); top:28px; width:92px; height:92px; z-index:1; }
    #wizard .wz-mock--fancy .wz-b1, #wizard .wz-mock--fancy .wz-b2, #wizard .wz-mock--fancy .wz-b3{ position:absolute; left:50%; transform:translateX(-50%); z-index:0; }
    #wizard .wz-mock--fancy .wz-b1{ width:140px; bottom:26px; } #wizard .wz-mock--fancy .wz-b2{ width:78%;  bottom:14px; } #wizard .wz-mock--fancy .wz-b3{ width:160px; bottom:6px; }

    /* Top bar */
    #wizard .wz-mock--top .wz-hero{ position:absolute; left:12px; right:12px; top:12px; height:66px; border-radius:14px; background:linear-gradient(135deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14; }
    #wizard .wz-mock--top .wz-pp{ position:absolute; right:26px; top:15px; width:60px; height:60px; }
    #wizard .wz-mock--top .wz-txt{ position:absolute; left:32px; right:130px; top:30px; display:grid; row-gap:12px; }
    #wizard .wz-mock--top .wz-t1{ width:52%; height:10px; } #wizard .wz-mock--top .wz-t2{ width:70%; height:10px; }
    #wizard .wz-mock--top .wz-b1, #wizard .wz-mock--top .wz-b2, #wizard .wz-mock--top .wz-b3{ position:absolute; left:50%; transform:translateX(-50%); }
    #wizard .wz-mock--top .wz-b1{ width:160px; bottom:42px; } #wizard .wz-mock--top .wz-b2{ width:78%;  bottom:24px; } #wizard .wz-mock--top .wz-b3{ width:170px; bottom:8px; }
  `;
  document.head.appendChild(st);
})();

/* ---------- Public API -------------------------------------------------- */
export function mountWelcome() {
  if (document.getElementById('welcome')) return;
  const wrap = document.createElement('div');
  wrap.id = 'welcome';
  wrap.setAttribute('data-overlay', '');
  Object.assign(wrap.style, { position:'fixed', inset:'0', display:'grid', placeItems:'center', background:'rgba(0,0,0,.45)', zIndex:'20000' });
  wrap.innerHTML = `
    <div class="wcard" style="width:min(880px,94vw);min-height:320px;background:#0f1420;border:1px solid #1f2540;border-radius:18px;padding:32px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);display:grid;justify-items:center;gap:16px">
      <div class="wtitle" style="font-weight:900;font-size:22px">Welcome to the Easy Resume Builder</div>
      <div class="wgrid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end;justify-items:center">
        <div class="wcol" style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
          <button class="wbtn primary" id="startWizard" type="button" style="appearance:none;border:none;border-radius:12px;padding:12px 16px;background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;font-weight:700">Wizard</button>
          <div style="opacity:.8">Guided step-by-step set-up.</div>
        </div>
        <div class="wcol" style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
          <button class="wbtn" id="startBlank" type="button" style="appearance:none;border:1px solid #2b324b;border-radius:12px;padding:12px 16px;background:#12182a;color:#e6e8ef;font-weight:700">Manual mode</button>
          <div style="opacity:.8">Start from scratch, arrange freely.</div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  wrap.querySelector('#startWizard').addEventListener('click', () => { wrap.style.display = 'none'; mountWizard(); openWizard(); });
  wrap.querySelector('#startBlank').addEventListener('click', () => { wrap.remove(); const plus = document.getElementById('canvasAdd'); if (plus) plus.style.display = 'flex'; });
}

export function mountWizard() {
  if (document.getElementById('wizard')) return;

  const modal = document.createElement('div');
  modal.id = 'wizard';
  modal.className = 'modal';
  modal.setAttribute('data-overlay', '');
  Object.assign(modal.style, { position:'fixed', inset:'0', display:'none', placeItems:'center', background:'rgba(0,0,0,.55)', zIndex:'21000' });

  modal.innerHTML = `
    <div class="wiz" style="width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden">
      <div class="wiz-left" style="background:#0c111f;border-right:1px solid #1b2340;padding:16px">
        <div class="step-list" id="stepList" style="display:grid;gap:8px"></div>
      </div>
      <div class="wiz-right" style="padding:20px 22px;display:flex;flex-direction:column;min-height:480px">
        <div id="wizBody" style="flex:1"></div>
        <div class="navline" style="display:flex;gap:10px;justify-content:flex-end">
          <button class="mbtn" id="wizStartOver" style="margin-right:auto;display:none" type="button">Start over</button>
          <button class="mbtn" id="wizBack" type="button">Back</button>
          <button class="mbtn" id="wizNext" type="button" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Next</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  buildWizard();
}

/* ---------- Wizard internals ------------------------------------------ */
const STEPS = [
  { k: 'layout',    label: 'Layout' },
  { k: 'theme',     label: 'Theme' },
  { k: 'contact',   label: 'Profile data' },
  { k: 'skills',    label: 'Skills' },
  { k: 'education', label: 'Education' },
  { k: 'experience',label: 'Experience' },
  { k: 'bio',       label: 'Bio' },
  { k: 'done',      label: 'Done' },
];

let stepIdx = 0;
let backCount = 0;

function openWizard(){ renderStep(); document.getElementById('wizard').style.display = 'grid'; }

function buildWizard(){
  const list = document.getElementById('stepList');
  list.innerHTML = '';
  STEPS.forEach((s,i) => {
    const el = document.createElement('div');
    el.className = 'step';
    el.dataset.i = i;
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;color:#c9d1ff80';
    el.innerHTML = `<div class="dot" style="width:8px;height:8px;border-radius:50%;background:#2e3b66"></div><div>${s.label}</div>`;
    list.appendChild(el);
  });

  document.getElementById('wizBack').onclick = () => { if(stepIdx>0){ stepIdx--; backCount++; renderStep(); } };
  document.getElementById('wizStartOver').onclick = () => {
    Object.assign(S,{ contact:{name:'',phone:'',email:'',address:'',linkedin:''}, skills:[], edu:[], exp:[], bio:'' });
    stepIdx=0; backCount=0; renderStep();
  };
  document.getElementById('wizNext').onclick = advance;
}

function markSteps(){
  const nodes = Array.from(document.querySelectorAll('#stepList .step'));
  nodes.forEach((el,i)=>{
    el.classList.toggle('on', i===stepIdx);
    el.classList.toggle('done', i<stepIdx);
    el.style.color   = i===stepIdx ? '#e8ecff' : (i<stepIdx ? '#a7ffcf' : '#c9d1ff80');
    el.style.background = i===stepIdx ? '#131a31' : 'transparent';
    const dot = el.querySelector('.dot'); if(dot) dot.style.background = i<stepIdx ? '#26d07c' : '#2e3b66';
  });
}

function renderStep(){
  const body = document.getElementById('wizBody');
  const s = STEPS[stepIdx].k;
  markSteps();
  document.getElementById('wizStartOver').style.display = (backCount>=2 ? 'inline-flex' : 'none');

  if (s === 'layout'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose your layout</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Pick a starting header style.</div>
      <div id="mockRow" style="display:grid;gap:22px">
        ${mock('header-side')}
        ${mock('header-fancy')}
        ${mock('header-top')}
      </div>
      <div class="k-row" style="margin-top:12px"><button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button></div>`;
    const row = body.querySelector('#mockRow');
    const current = (S.layout==='side')?'header-side':(S.layout==='fancy')?'header-fancy':(S.layout==='top')?'header-top':null;
    if (current) row.querySelector(`[data-layout="${current}"]`)?.classList.add('sel');
    row.addEventListener('click', e=>{ const m = e.target.closest('.wz-mock'); if(!m) return; row.querySelectorAll('.wz-mock').forEach(x=>x.classList.remove('sel')); m.classList.add('sel'); morphTo(m.dataset.layout); });
    body.querySelector('#wizAddPhoto').onclick = () => getHeaderNode()?.querySelector('[data-avatar] input')?.click();
  }

  if (s === 'theme'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose a color theme</div>
      <div class="theme-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
        ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
          .map(k=>`<div class="swatch" data-k="${k}" style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;background:linear-gradient(135deg,var(--a1),var(--a2))" data-a1="${A1[k]||'#8b5cf6'}" data-a2="${A2[k]||'#d946ef'}"></div>`).join('')}
      </div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>`;
    body.querySelectorAll('.swatch').forEach(swatch=>{ const k = swatch.dataset.k; swatch.onclick = ()=> { document.body.setAttribute('data-theme', k); S.theme=k; }; });
    body.querySelector('#wizDark').onclick = e=>{ e.currentTarget.classList.toggle('on'); S.dark = e.currentTarget.classList.contains('on'); document.body.setAttribute('data-dark', S.dark ? '1' : '0'); };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); };
  }

  if (s === 'contact'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Profile data</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Only filled fields will appear.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input class="wipt" id="nm" placeholder="Full name" value="${S.contact.name||''}">
        <input class="wipt" id="ph" placeholder="Phone" value="${S.contact.phone||''}">
        <input class="wipt" id="em" placeholder="Email" value="${S.contact.email||''}">
        <input class="wipt" id="ad" placeholder="City, Country" value="${S.contact.address||''}">
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center"><span style="opacity:.7">linkedin.com/in/</span><input class="wipt" id="ln" placeholder="username" style="flex:1" value="${S.contact.linkedin||''}"></div>
      </div>`;
    ['nm','ph','em','ad','ln'].forEach(id=>{
      body.querySelector('#'+id).oninput = ()=>{
        S.contact = {
          name: body.querySelector('#nm').value,
          phone: body.querySelector('#ph').value,
          email: body.querySelector('#em').value,
          address: body.querySelector('#ad').value,
          linkedin: body.querySelector('#ln').value
        };
        applyContact?.();
      };
    });
  }

  if (s === 'skills'){
    ensureSkillsSection(); // create empty section once
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:12px">Use stars or a slider; you can fine-tune on the canvas later.</div>
      <div class="ctrl-mini" style="display:flex;gap:8px">
        <button class="mbtn" id="wAddStar">+ ★</button>
        <button class="mbtn" id="wAddSlider">+ Slider</button>
      </div>`;
    body.querySelector('#wAddStar').onclick   = addSkillStar;
    body.querySelector('#wAddSlider').onclick = addSkillSlider;
  }

  if (s === 'education'){
    ensureEduSection();
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:12px">Add items now or later from the canvas.</div>
      <div class="ctrl-mini" style="display:flex;gap:8px">
        <button class="mbtn" id="wAddCourse">+ Add course</button>
        <button class="mbtn" id="wAddDegree">+ Add degree</button>
      </div>`;
    body.querySelector('#wAddCourse').onclick = ()=>{ ensureEduSection(); document.querySelector('.section .ctrl-mini [data-add-course]')?.click(); };
    body.querySelector('#wAddDegree').onclick = ()=>{ ensureEduSection(); document.querySelector('.section .ctrl-mini [data-add-degree]')?.click(); };
  }

  if (s === 'experience'){
    ensureExpSection();
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:12px">You can keep adding/editing from the canvas.</div>
      <div class="ctrl-mini" style="display:flex;gap:8px">
        <button class="mbtn" id="wAddRole">+ Add role</button>
      </div>`;
    body.querySelector('#wAddRole').onclick = addExpRole;
  }

  if (s === 'bio'){
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Bio</div>
      <textarea id="bioText" class="wipt" rows="6" placeholder="Short profile…" style="width:100%;min-height:120px"></textarea>`;
    const t = body.querySelector('#bioText');
    t.value = S.bio || '';
    t.oninput = ()=>{ S.bio = t.value; };
  }

  if (s === 'done'){
    body.innerHTML = `<div class="wtitle" style="text-align:center">All set ✨</div><div class="wsub" style="opacity:.85;text-align:center">Continue on the canvas.</div>`;
    document.getElementById('wizNext').textContent = 'Finish';
  } else {
    document.getElementById('wizNext').textContent = 'Next';
  }
}

function advance(){
  const cur = STEPS[stepIdx].k;
  if (cur === 'skills')     renderSkills();
  if (cur === 'education')  renderEdu();
  if (cur === 'experience') renderExp();
  if (cur === 'bio')        renderBio();

  if (cur === 'done'){
    document.getElementById('wizard').style.display = 'none';
    document.getElementById('welcome')?.remove();
    document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex');
    return;
  }
  if (stepIdx < STEPS.length-1){ stepIdx++; renderStep(); }
}

/* ---------- helpers ---------------------------------------------------- */
const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

function mock(layoutKey){
  const kind = layoutKey.split('-')[1];

  if (kind === 'side'){
    return `
      <div class="wz-mock wz-mock--side" data-layout="${layoutKey}">
        <div class="wz-card">
          <div class="wz-left">
            <div class="wz-pp"></div>
            <div class="wz-pill wz-under"></div>
          </div>
          <div class="wz-right">
            <div class="wz-pill wz-l1"></div>
            <div class="wz-pill wz-l2"></div>
          </div>
        </div>
      </div>`;
  }

  if (kind === 'fancy'){
    return `
      <div class="wz-mock wz-mock--fancy" data-layout="${layoutKey}">
        <div class="wz-card">
          <div class="wz-hero"></div>
          <div class="wz-pp"></div>
          <div class="wz-pill wz-b1"></div>
          <div class="wz-pill wz-b2"></div>
          <div class="wz-pill wz-b3"></div>
        </div>
      </div>`;
  }

  return `
    <div class="wz-mock wz-mock--top" data-layout="${layoutKey}">
      <div class="wz-card">
        <div class="wz-hero"></div>
        <div class="wz-pp"></div>
        <div class="wz-txt">
          <div class="wz-pill wz-t1"></div>
          <div class="wz-pill wz-t2"></div>
        </div>
        <div class="wz-pill wz-b1"></div>
        <div class="wz-pill wz-b2"></div>
        <div class="wz-pill wz-b3"></div>
      </div>
    </div>`;
}
