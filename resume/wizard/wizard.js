// /resume/wizard/wizard.js
// [wizard.js] v1.1
// Builds the Welcome modal and the multi-step Wizard (layout, theme, profile, skills, edu, exp, bio, done)

console.log('[wizard.js] v1.1');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* ---------- Public API -------------------------------------------------- */
export function mountWelcome() {
  if (document.getElementById('welcome')) return; // already mounted

  const wrap = document.createElement('div');
  wrap.id = 'welcome';
  wrap.setAttribute('data-overlay', ''); // hidden by print
  wrap.style.position = 'fixed';
  wrap.style.inset = '0';
  wrap.style.display = 'grid';
  wrap.style.placeItems = 'center';
  wrap.style.background = 'rgba(0,0,0,.45)';
  wrap.style.zIndex = '20000';

  wrap.innerHTML = `
    <div class="wcard" style="
      width:min(880px,94vw);min-height:320px;background:#0f1420;border:1px solid #1f2540;
      border-radius:18px;padding:32px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);
      display:grid;justify-items:center;gap:16px">
      <div class="wtitle" style="font-weight:900;font-size:22px">Welcome to the Easy Resume Builder</div>
      <div class="wgrid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end;justify-items:center">
        <div class="wcol" style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
          <button class="wbtn primary" id="startWizard" type="button"
            style="appearance:none;border:none;border-radius:12px;padding:12px 16px;
            background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;font-weight:700">
            Wizard
          </button>
          <div style="opacity:.8">Guided step-by-step set-up.</div>
        </div>
        <div class="wcol" style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
          <button class="wbtn" id="startBlank" type="button"
            style="appearance:none;border:1px solid #2b324b;border-radius:12px;padding:12px 16px;background:#12182a;color:#e6e8ef;font-weight:700">
            Manual mode
          </button>
          <div style="opacity:.8">Start from scratch, arrange freely.</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  // wire buttons
  wrap.querySelector('#startWizard').addEventListener('click', () => {
    wrap.style.display = 'none';
    mountWizard(); // ensure shell exists
    openWizard();  // show + render first step
  });

  wrap.querySelector('#startBlank').addEventListener('click', () => {
    wrap.remove();
    const plus = document.getElementById('canvasAdd');
    if (plus) plus.style.display = 'flex';
  });
}

export function mountWizard() {
  if (document.getElementById('wizard')) return;

  const modal = document.createElement('div');
  modal.id = 'wizard';
  modal.className = 'modal';
  modal.setAttribute('data-overlay', '');
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.display = 'none';
  modal.style.placeItems = 'center';
  modal.style.background = 'rgba(0,0,0,.55)';
  modal.style.zIndex = '21000';

  modal.innerHTML = `
    <div class="wiz" style="width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;
      background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;
      box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden">
      <div class="wiz-left" style="background:#0c111f;border-right:1px solid #1b2340;padding:16px">
        <div class="step-list" id="stepList" style="display:grid;gap:8px"></div>
      </div>
      <div class="wiz-right" style="padding:20px 22px;display:flex;flex-direction:column;min-height:480px">
        <div id="wizBody" style="flex:1"></div>
        <div class="navline" style="display:flex;gap:10px;justify-content:flex-end">
          <button class="mbtn" id="wizStartOver" style="margin-right:auto;display:none" type="button">Start over</button>
          <button class="mbtn" id="wizBack" type="button">Back</button>
          <button class="mbtn" id="wizNext" type="button"
            style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Next</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // build stepper once
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

function openWizard(){ 
  const w = document.getElementById('wizard');
  if (!w) mountWizard();
  renderStep();
  document.getElementById('wizard').style.display = 'grid';
}

function buildWizard(){
  const list = document.getElementById('stepList');
  list.innerHTML = '';
  STEPS.forEach((s,i) => {
    const el = document.createElement('div');
    el.className = 'step';
    el.dataset.i = i;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '8px';
    el.style.padding = '8px 10px';
    el.style.borderRadius = '10px';
    el.style.color = '#c9d1ff80';
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
    const dot = el.querySelector('.dot');
    if(dot) dot.style.background = i<stepIdx ? '#26d07c' : '#2e3b66';
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
      <div id="mockRow" style="display:grid;gap:14px">
        ${mock('header-side')}
        ${mock('header-fancy')}
        ${mock('header-top')}
      </div>
      <div class="k-row" style="margin-top:12px"><button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button></div>
    `;
    const row = body.querySelector('#mockRow');
    row.addEventListener('click', e=>{
      const m = e.target.closest('.mock'); if(!m) return;
      row.querySelectorAll('.mock').forEach(x=>x.classList.remove('sel'));
      m.classList.add('sel');
      morphTo(m.dataset.layout);
    });
    body.querySelector('#wizAddPhoto').onclick = () => {
      const ipt = getHeaderNode()?.querySelector('[data-avatar] input');
      if (ipt) ipt.click();
    };
  }

  if (s === 'theme'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose a color theme</div>
      <div class="theme-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
        ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
          .map(k=>`<div class="swatch" data-k="${k}" style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;background:linear-gradient(135deg,var(--a1),var(--a2))"
               data-a1="${A1[k]||'#8b5cf6'}" data-a2="${A2[k]||'#d946ef'}"></div>`).join('')}
      </div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>
    `;
    body.querySelectorAll('.swatch').forEach(swatch=>{
      const k = swatch.dataset.k;
      applyTheme(k);
      swatch.onclick = ()=> applyTheme(k);
      function applyTheme(themeKey){
        document.body.setAttribute('data-theme', themeKey);
        S.theme = themeKey;
      }
    });
    body.querySelector('#wizDark').onclick = e=>{
      e.currentTarget.classList.toggle('on');
      S.dark = e.currentTarget.classList.contains('on');
      document.body.setAttribute('data-dark', S.dark ? '1' : '0');
    };
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
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center">
          <span style="opacity:.7">linkedin.com/in/</span>
          <input class="wipt" id="ln" placeholder="username" style="flex:1" value="${S.contact.linkedin||''}">
        </div>
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
        if (typeof applyContact === 'function') applyContact();
      };
    });
  }

  if (s === 'skills'){
    // Render to canvas when leaving this step (in advance()).
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Use stars or a slider.</div>
      <div id="wsTips" style="opacity:.7">Use the canvas to reorder and edit after finishing.</div>
    `;
  }

  if (s === 'education'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add courses and/or degrees.</div>
      <div style="opacity:.7">Use the add menu (+) on the canvas or continue and edit later.</div>
    `;
  }

  if (s === 'experience'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add roles; you can always edit on the canvas.</div>
    `;
  }

  if (s === 'bio'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Bio</div>
      <textarea id="bioText" class="wipt" rows="6" placeholder="Short profile…"
        style="width:100%;min-height:120px"></textarea>
    `;
    const t = body.querySelector('#bioText');
    t.value = S.bio || '';
    t.oninput = ()=>{ S.bio = t.value; };
  }

  if (s === 'done'){
    body.innerHTML = `
      <div class="wtitle" style="text-align:center">All set ✨</div>
      <div class="wsub" style="opacity:.85;text-align:center">You can keep editing on the canvas.</div>
    `;
    document.getElementById('wizNext').textContent = 'Finish';
  } else {
    document.getElementById('wizNext').textContent = 'Next';
  }
}

function advance(){
  const cur = STEPS[stepIdx].k;

  // Apply side effects when leaving a step
  if (cur === 'skills')   { renderSkills(); }
  if (cur === 'education'){ renderEdu();    }
  if (cur === 'experience'){ renderExp();   }
  if (cur === 'bio')      { renderBio();    }

  if (cur === 'done'){
    document.getElementById('wizard').style.display = 'none';
    const w = document.getElementById('welcome'); if (w) w.remove();
    const plus = document.getElementById('canvasAdd'); if (plus) plus.style.display = 'flex';
    return;
  }
  if (stepIdx < STEPS.length-1){ stepIdx++; renderStep(); }
}

/* ---------- helpers ---------------------------------------------------- */

const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

function mock(layoutKey){
  const kind = layoutKey.split('-')[1]; // side / fancy / top
  const hero = (kind==='side')
    ? `<div class="hero" style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;left:30px;top:30px;width:42px;height:42px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div class="txt" style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
       </div>`
    : kind==='fancy'
    ? `<div class="hero" style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;left:50%;transform:translateX(-50%);top:58px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div class="txt" style="position:absolute;left:24px;right:24px;top:120px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:70%"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:48%"></div>
       </div>`
    : `<div class="hero" style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;right:31px;top:22px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div class="txt" style="position:absolute;left:24px;right:120px;top:28px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
       </div>`;

  return `<div class="mock ${kind}" data-layout="${layoutKey}"
            style="position:relative;min-height:130px;border:1px solid #1f2540;border-radius:14px;padding:10px;background:#0c1324;cursor:pointer;transition:transform .15s ease">
            ${hero}
          </div>`;
}

// expose for tests if needed
export const __steps = STEPS;
