// /resume/wizard/wizard.js
// [wizard.js] v2.5
console.log('[wizard.js] v2.5');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact, restyleContactChips } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* ---------- inject minimal wizard styles (hover/selected + inputs + modal) ---------- */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style');
  st.id = 'wizard-style';
  st.textContent = `
    #wizard .mock{
      position:relative;min-height:130px;border:1px solid #1f2540;border-radius:14px;
      padding:10px;background:#0c1324;cursor:pointer;
      transition:transform .15s ease, box-shadow .15s ease, outline .15s ease, background .15s ease;
    }
    #wizard .mock:hover{
      transform:translateY(-2px);
      box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 2px #7c99ff inset;
    }
    #wizard .mock.sel{
      outline:2px solid #ffb86c;
      box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 1px #ffb86c inset;
      background:#0f1420;
    }

    /* nicer inputs for contact step */
    #wizard .wipt{
      background:#0c1328;color:#e7ebff;border:1px solid #243057;outline:none;
      border-radius:10px;padding:10px 12px;width:100%;
      box-shadow:0 4px 14px rgba(0,0,0,.25);
    }
    #wizard .wipt::placeholder{ color:#95a0c7 }

    /* Customize swatch animation */
    #wizard .swatch.customize{
      position:relative; overflow:hidden; border:1px solid #2b324b; border-radius:12px; height:42px; cursor:pointer;
      background-size: 300% 300%;
      background-image: linear-gradient(135deg,#ff005b,#ffb628,#08f7fe,#09fbd3,#f5d300,#f538ff);
      animation: wizRainbow 6s linear infinite;
      display:grid; place-items:center; font-weight:800; color:#111;
      text-shadow: 0 1px 0 #fff8;
    }
    @keyframes wizRainbow { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }

    /* Gradient modal */
    #gradModal{
      position:fixed; inset:0; display:none; place-items:center; z-index:22000;
      background:rgba(0,0,0,.55);
    }
    #gradPanel{
      width:min(560px,94vw); background:#0f1420; color:#e6e8ef; border:1px solid #1f2540;
      border-radius:16px; padding:18px; box-shadow:0 40px 140px rgba(0,0,0,.6);
    }
    #hueWrap{ position:relative; height:32px; border-radius:10px; overflow:hidden; border:1px solid #263055 }
    #hueBar{ width:100%; height:100%; display:block }
    .stop{
      position:absolute; top:50%; transform:translate(-50%,-50%);
      width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 6px 14px rgba(0,0,0,.35);
      cursor:grab;
    }
    #gradSample{
      height:42px; border-radius:10px; border:1px solid #2b324b; margin-top:12px;
    }
    .gline{ display:flex; gap:8px; justify-content:flex-end; margin-top:12px }
    .gline .mbtn{ padding:8px 12px }
  `;
  document.head.appendChild(st);
})();

/* ---------- Public API -------------------------------------------------- */
export function mountWelcome() {
  if (document.getElementById('welcome')) return;

  const wrap = document.createElement('div');
  wrap.id = 'welcome';
  wrap.setAttribute('data-overlay', '');
  Object.assign(wrap.style, {
    position:'fixed', inset:'0', display:'grid', placeItems:'center',
    background:'rgba(0,0,0,.45)', zIndex:'20000'
  });

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

  wrap.querySelector('#startWizard').addEventListener('click', () => {
    wrap.style.display = 'none';
    mountWizard();
    openWizard();
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
  Object.assign(modal.style, {
    position:'fixed', inset:'0', display:'none', placeItems:'center',
    background:'rgba(0,0,0,.55)', zIndex:'21000'
  });

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
    <div id="gradModal">
      <div id="gradPanel">
        <div style="font-weight:800;margin-bottom:8px">Customize gradient</div>
        <div id="hueWrap"><canvas id="hueBar" width="520" height="32"></canvas>
          <div id="stop1" class="stop" style="left:20%"></div>
          <div id="stop2" class="stop" style="left:80%"></div>
        </div>
        <div id="gradSample"></div>
        <div class="gline">
          <button class="mbtn" id="gCancel">Cancel</button>
          <button class="mbtn" id="gApply" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Apply</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  initGradientEditor();     // wire once
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

    // pre-select current layout
    const current = (S.layout==='side')?'header-side':(S.layout==='fancy')?'header-fancy':(S.layout==='top')?'header-top':null;
    if (current) row.querySelector(`[data-layout="${current}"]`)?.classList.add('sel');

    row.addEventListener('click', e=>{
      const m = e.target.closest('.mock'); if(!m) return;
      row.querySelectorAll('.mock').forEach(x=>x.classList.remove('sel'));
      m.classList.add('sel');
      morphTo(m.dataset.layout);
    });
    body.querySelector('#wizAddPhoto').onclick = () => getHeaderNode()?.querySelector('[data-avatar] input')?.click();
  }

  if (s === 'theme'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose a color theme</div>
      <div class="theme-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
        ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack','custom']
          .map(k => (k==='custom')
            ? `<div class="swatch customize" id="customizeSw" title="Customize">Customize</div>`
            : `<div class="swatch" data-k="${k}" style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;background:linear-gradient(135deg,${A1[k]},${A2[k]})"></div>`
          ).join('')}
      </div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>
    `;
    body.querySelectorAll('.swatch[data-k]').forEach(swatch=>{
      const k = swatch.dataset.k;
      swatch.onclick = ()=> { document.body.setAttribute('data-theme', k); S.theme=k; restyleContactChips(); };
    });
    body.querySelector('#customizeSw').onclick = ()=> openGradModal();

    body.querySelector('#wizDark').onclick = e=>{
      e.currentTarget.classList.toggle('on');
      S.dark = e.currentTarget.classList.contains('on');
      document.body.setAttribute('data-dark', S.dark ? '1' : '0');
      restyleContactChips();
    };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); restyleContactChips(); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); restyleContactChips(); };
  }

  if (s === 'contact'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Profile data</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Only filled fields will appear.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input class="wipt" id="nm" placeholder="Full name" value="${S.contact?.name||''}">
        <input class="wipt" id="ph" placeholder="Phone" value="${S.contact?.phone||''}">
        <input class="wipt" id="em" placeholder="Email" value="${S.contact?.email||''}">
        <input class="wipt" id="ad" placeholder="City, Country" value="${S.contact?.address||''}">
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center"><span style="opacity:.7">linkedin.com/in/</span><input class="wipt" id="ln" placeholder="username" style="flex:1" value="${S.contact?.linkedin||''}"></div>
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
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Use stars or a slider; you can fine-tune on the canvas later.</div>`;
  }

  if (s === 'education'){
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add items now or later from the canvas.</div>`;
  }

  if (s === 'experience'){
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">You can keep adding/editing from the canvas.</div>`;
  }

  if (s === 'bio'){
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Bio</div>
      <textarea id="bioText" class="wipt" rows="6" placeholder="Short profile…" style="width:100%;min-height:120px"></textarea>`;
    const t = body.querySelector('#bioText');
    t.value = S.bio || '';
    t.oninput = ()=>{ S.bio = t.value; };
  }

  if (s === 'done'){
    body.innerHTML = `<div class="wtitle" style="text-align:center">All set ✨</div>
      <div class="wsub" style="opacity:.85;text-align:center">Continue on the canvas.</div>`;
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
  const hero = (kind==='side')
    ? `<div class="hero" style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:14px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;left:30px;top:26px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.35)"></div>
       <div class="txt" style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px">
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:58%"></div>
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:42%"></div>
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:64%"></div>
       </div>`
    : kind==='fancy'
    ? `<div class="hero" style="height:74px;margin:10px;border-radius:14px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;left:50%;transform:translate(-50%,-50%);top:84px;width:76px;height:76px;border-radius:50%;background:#cfd6ff;border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.35)"></div>
       <div class="txt" style="position:absolute;left:24px;right:24px;top:120px;display:grid;gap:10px">
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:32%;margin:0 auto"></div>
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:70%;margin:0 auto"></div>
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:46%;margin:0 auto"></div>
       </div>`
    : `<div class="hero" style="height:74px;margin:10px;border-radius:14px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;right:24px;top:18px;width:64px;height:64px;border-radius:50%;background:#cfd6ff;border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.35)"></div>
       <div class="txt" style="position:absolute;left:24px;right:110px;top:28px;display:grid;gap:10px">
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:38%"></div>
         <div class="line" style="height:10px;border-radius:999px;background:#2b375f;width:56%"></div>
       </div>`;
  return `<div class="mock ${kind}" data-layout="${layoutKey}" style="width:450px;height:158px"></div>`.replace('></div>', `>${hero}</div>`);
}

/* ---------- Gradient editor ----------------------------------------- */
let gState = { a:'#8b5cf6', b:'#d946ef' };

function openGradModal(){
  const overlay = document.getElementById('gradModal');
  if (!overlay) return;
  // restore last or current vars
  const cs = getComputedStyle(document.documentElement);
  gState.a = cs.getPropertyValue('--accent').trim() || gState.a;
  gState.b = cs.getPropertyValue('--accent2').trim() || gState.b;
  updateGradSample();
  overlay.style.display = 'grid';
}

function closeGradModal(){ document.getElementById('gradModal').style.display = 'none'; }

function setGradientVars(a,b){
  document.documentElement.style.setProperty('--accent',  a);
  document.documentElement.style.setProperty('--accent2', b);
  S.theme = 'custom';
  S.custom = { a, b };
  restyleContactChips();
}

function hslToHex(h, s=100, l=60){
  // h in [0,360)
  const c = (1 - Math.abs(2*l/100 - 1)) * (s/100);
  const x = c * (1 - Math.abs((h/60)%2 - 1));
  const m = l/100 - c/2;
  let r=0,g=0,b=0;
  if (0<=h && h<60)   { r=c; g=x; b=0; }
  else if (60<=h&&h<120){ r=x; g=c; b=0; }
  else if (120<=h&&h<180){ r=0; g=c; b=x; }
  else if (180<=h&&h<240){ r=0; g=x; b=c; }
  else if (240<=h&&h<300){ r=x; g=0; b=c; }
  else                   { r=c; g=0; b=x; }
  const toHex=v=>('0'+Math.round((v+m)*255).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function initGradientEditor(){
  const hue = document.getElementById('hueBar');
  const ctx = hue.getContext('2d');
  const overlay = document.getElementById('gradModal');

  // draw hue strip
  const paintHue=()=>{
    const {width:w,height:h}=hue;
    const grd = ctx.createLinearGradient(0,0,w,0);
    for(let i=0;i<=360;i+=6){ grd.addColorStop(i/360, hslToHex(i,100,50)); }
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);
  };
  paintHue();

  const s1 = document.getElementById('stop1');
  const s2 = document.getElementById('stop2');
  const sample = document.getElementById('gradSample');

  let drag = null;
  const posToHue = x => Math.max(0, Math.min(1, x / hue.getBoundingClientRect().width)) * 360;

  function updateFromStops(){
    const r = hue.getBoundingClientRect();
    const x1 = parseFloat(s1.style.left) / 100 * r.width;
    const x2 = parseFloat(s2.style.left) / 100 * r.width;
    const h1 = posToHue(x1);
    const h2 = posToHue(x2);
    gState.a = hslToHex(h1,100,60);
    gState.b = hslToHex(h2,100,60);
    updateGradSample();
  }
  function updateGradSample(){
    sample.style.background = `linear-gradient(135deg, ${gState.a}, ${gState.b})`;
  }

  function onDown(e){
    const t = e.target;
    if (t===s1 || t===s2){
      drag = t;
      drag.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }
  function onMove(e){
    if (!drag) return;
    const r = hue.getBoundingClientRect();
    const x = (e.touches?e.touches[0].clientX:e.clientX) - r.left;
    const pct = Math.max(0, Math.min(100, (x / r.width) * 100));
    drag.style.left = pct + '%';
    updateFromStops();
  }
  function onUp(){
    if (!drag) return;
    drag.style.cursor = 'grab';
    drag = null;
  }

  hue.addEventListener('mousedown', onDown);
  hue.addEventListener('touchstart', onDown);
  window.addEventListener('mousemove', onMove, { passive:false });
  window.addEventListener('touchmove', onMove, { passive:false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  document.getElementById('gApply').onclick = ()=>{ setGradientVars(gState.a,gState.b); closeGradModal(); };
  document.getElementById('gCancel').onclick = ()=> closeGradModal();

  // also allow clicking hue bar to reposition nearest stop
  hue.addEventListener('click', (e)=>{
    const r = hue.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100;
    const t = Math.abs(x - parseFloat(s1.style.left)) < Math.abs(x - parseFloat(s2.style.left)) ? s1 : s2;
    t.style.left = Math.max(0, Math.min(100, x)) + '%';
    updateFromStops();
  });

  // initial sample fill
  updateGradSample();
}
