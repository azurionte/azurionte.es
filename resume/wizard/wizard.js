// /resume/wizard/wizard.js
// [wizard.js] v2.7
console.log('[wizard.js] v2.7');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact, restyleContactChips } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* ---------- styles: hover/selected, modal, inputs, tiny lists -------- */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style');
  st.id = 'wizard-style';
  st.textContent = `
    #wizard .mock{
      position:relative;min-height:158px;border:1px solid #1f2540;border-radius:14px;
      padding:10px;background:#0c1324;cursor:pointer;
      transition:transform .15s ease, box-shadow .15s ease, outline .15s ease;
    }
    #wizard .mock:hover{
      transform:translateY(-2px);
      box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 2px #7c99ff inset;
    }
    #wizard .mock.sel{ outline:2px solid #ffb86c; box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 1px #ffb86c inset; }

    /* theme swatches */
    #wizard .swatch{height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;position:relative;overflow:hidden}
    #wizard .swatch.custom{
      background: linear-gradient(135deg,#ff7a7a,#ffd25a,#58f0a7,#5cc0ff,#b98cff);
      background-size: 400% 400%;
      animation: wiz-rainbow 8s linear infinite;
      display:grid;place-items:center;color:#111;font-weight:800;
    }
    @keyframes wiz-rainbow{0%{background-position:0% 50%}100%{background-position:100% 50%}}

    /* gradient modal */
    .wiz-ovl{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);z-index:22000}
    .wiz-ovl.open{display:grid}
    .wiz-dlg{width:min(680px,96vw);background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);padding:18px 18px 16px}
    .wiz-dlg .title{font-weight:900;margin-bottom:8px}
    .pad-wrap{position:relative;border-radius:12px;overflow:hidden;border:1px solid #243057}
    .pad-wrap canvas{display:block;width:100%;height:220px}
    .pad-handle{position:absolute;width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:translate(-50%,-50%);pointer-events:auto}
    .pad-handle.h1{outline:2px solid #8b5cf6}
    .pad-handle.h2{outline:2px solid #d946ef}
    .grad-preview{height:36px;border-radius:10px;border:1px solid #243057;margin-top:10px}
    .dlg-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
    .dlg-actions .mbtn{padding:8px 12px}

    /* nicer wizard inputs + small list */
    .wipt{
      background:#0c1328;color:#e7ebff;border:1px solid #243057;outline:none;border-radius:10px;padding:10px 12px;width:100%;
      box-shadow:0 4px 14px rgba(0,0,0,.25)
    }
    .wipt::placeholder{color:#95a0c7}
    .mini-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;border:1px solid #2b324b;background:#0c1328}
    .pill button{appearance:none;border:0;border-radius:8px;padding:6px 8px;background:#12182a;color:#e6e8ef;cursor:pointer}
    .rowbtn{appearance:none;border:0;border-radius:10px;padding:8px 12px;background:#12182a;color:#e6e8ef;cursor:pointer}
    .rowbtn.primary{background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;font-weight:800}
    .list{display:grid;gap:10px;margin-top:10px}
  `;
  document.head.appendChild(st);
})();

/* ---------- Public API -------------------------------------------- */
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
    </div>
  `;
  document.body.appendChild(modal);
  buildWizard();
}

/* ---------- Wizard internals -------------------------------------- */
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

let stepIdx = 0, backCount = 0;

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
      <div id="mockRow" style="display:grid;gap:18px">
        ${mock('header-side')}
        ${mock('header-fancy')}
        ${mock('header-top')}
      </div>
      <div class="k-row" style="margin-top:12px"><button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button></div>
    `;
    const row = body.querySelector('#mockRow');
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
      <div class="theme-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px">
        ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
          .map(k=>`<div class="swatch" data-k="${k}" style="background:linear-gradient(135deg,var(--a1),var(--a2))" data-a1="${A1[k]}" data-a2="${A2[k]}"></div>`).join('')}
        <div class="swatch custom" id="openCustom">Customize</div>
      </div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>
    `;
    body.querySelectorAll('.swatch[data-k]').forEach(sw=>{
      const k = sw.dataset.k;
      sw.onclick = ()=> { document.body.setAttribute('data-theme', k); S.theme=k; restyleContactChips(); };
    });
    body.querySelector('#wizDark').onclick = e=>{
      e.currentTarget.classList.toggle('on');
      S.dark = e.currentTarget.classList.contains('on');
      document.body.setAttribute('data-dark', S.dark ? '1' : '0');
      restyleContactChips();
    };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); restyleContactChips(); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); restyleContactChips(); };
    body.querySelector('#openCustom').onclick = openGradientModal;
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
    if (!Array.isArray(S.skills)) S.skills = [];
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Use either stars or sliders. Nothing will be added unless you click “Add”.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="rowbtn" id="addStar"><i class="fa-solid fa-star"></i> Add star skill</button>
        <button class="rowbtn" id="addSlider"><i class="fa-solid fa-sliders"></i> Add slider skill</button>
      </div>
      <div class="list" id="skillList"></div>
    `;
    const list = body.querySelector('#skillList');
    const refresh = ()=>{
      list.innerHTML='';
      S.skills.forEach((sk, i)=>{
        const row = document.createElement('div');
        row.className='mini-row';
        row.innerHTML = `
          <input class="wipt" value="${sk.label||'Skill'}">
          <div class="pill">
            <span>${sk.mode==='stars'?'★':'⎯'} ${sk.value??3}</span>
            <button data-i="${i}" class="rm">Remove</button>
          </div>`;
        row.querySelector('input').oninput = (e)=>{ S.skills[i].label = e.target.value; };
        row.querySelector('.rm').onclick = ()=>{ S.skills.splice(i,1); refresh(); };
        list.appendChild(row);
      });
    };
    body.querySelector('#addStar').onclick   = ()=>{ S.skills.push({label:'Skill', mode:'stars',  value:3}); refresh(); };
    body.querySelector('#addSlider').onclick = ()=>{ S.skills.push({label:'Skill', mode:'slider', value:70}); refresh(); };
    refresh();
  }

  if (s === 'education'){
    if (!Array.isArray(S.edu)) S.edu = [];
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add degrees or short courses.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="rowbtn" id="addDegree"><i class="fa-solid fa-graduation-cap"></i> Add degree</button>
        <button class="rowbtn" id="addCourse"><i class="fa-solid fa-book"></i> Add course</button>
      </div>
      <div class="list" id="eduList"></div>
    `;
    const list = body.querySelector('#eduList');
    const refresh = ()=>{
      list.innerHTML='';
      S.edu.forEach((it, i)=>{
        const row = document.createElement('div');
        row.className='mini-row';
        row.innerHTML = `
          <input class="wipt" value="${it.title||''}" placeholder="${it.type==='course'?'Course':'Degree'} title">
          <div class="pill">
            <span>${it.type==='course'?'Course':'Degree'}</span>
            <button data-i="${i}" class="rm">Remove</button>
          </div>`;
        row.querySelector('input').oninput = (e)=>{ S.edu[i].title = e.target.value; };
        row.querySelector('.rm').onclick = ()=>{ S.edu.splice(i,1); refresh(); };
        list.appendChild(row);
      });
    };
    body.querySelector('#addDegree').onclick = ()=>{ S.edu.push({type:'degree', title:''}); refresh(); };
    body.querySelector('#addCourse').onclick = ()=>{ S.edu.push({type:'course', title:''}); refresh(); };
    refresh();
  }

  if (s === 'experience'){
    if (!Array.isArray(S.exp)) S.exp = [];
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add positions you want to show.</div>
      <div><button class="rowbtn" id="addExp"><i class="fa-solid fa-plus"></i> Add experience</button></div>
      <div class="list" id="expList"></div>
    `;
    const list = body.querySelector('#expList');
    const refresh = ()=>{
      list.innerHTML='';
      S.exp.forEach((it, i)=>{
        const row = document.createElement('div');
        row.className='mini-row';
        row.innerHTML = `
          <input class="wipt" value="${it.title||''}" placeholder="Job title @ Company">
          <div class="pill">
            <span>${(it.start||'').toString().slice(0,7)}–${(it.end||'').toString().slice(0,7) || ''}</span>
            <button data-i="${i}" class="rm">Remove</button>
          </div>`;
        row.querySelector('input').oninput = (e)=>{ S.exp[i].title = e.target.value; };
        row.querySelector('.rm').onclick = ()=>{ S.exp.splice(i,1); refresh(); };
        list.appendChild(row);
      });
    };
    body.querySelector('#addExp').onclick = ()=>{ S.exp.push({title:'', start:'', end:'', summary:''}); refresh(); };
    refresh();
  }

  if (s === 'bio'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Bio</div>
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

  // Only render if the user actually added something
  if (cur === 'skills'     && Array.isArray(S.skills) && S.skills.length)         renderSkills();
  if (cur === 'education'  && Array.isArray(S.edu)    && S.edu.length)            renderEdu();
  if (cur === 'experience' && Array.isArray(S.exp)    && S.exp.length)            renderExp();
  if (cur === 'bio'        && typeof S.bio === 'string' && S.bio.trim().length)   renderBio();

  if (cur === 'done'){
    document.getElementById('wizard').style.display = 'none';
    document.getElementById('welcome')?.remove();
    document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex');
    return;
  }
  if (stepIdx < STEPS.length-1){ stepIdx++; renderStep(); }
}

/* ---------- Gradient modal --------------------------------------- */
function openGradientModal(){
  let ovl = document.getElementById('grad-ovl');
  if (!ovl){
    ovl = document.createElement('div');
    ovl.id = 'grad-ovl';
    ovl.className = 'wiz-ovl';
    ovl.innerHTML = `
      <div class="wiz-dlg" role="dialog" aria-modal="true">
        <div class="title">Customize gradient</div>
        <div class="pad-wrap" id="padWrap">
          <canvas id="gradPad" width="560" height="220"></canvas>
          <div class="pad-handle h1" id="h1"></div>
          <div class="pad-handle h2" id="h2"></div>
        </div>
        <div class="grad-preview" id="gradPrev"></div>
        <div class="dlg-actions">
          <button class="mbtn" id="gradCancel">Cancel</button>
          <button class="mbtn" id="gradApply" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(ovl);

    // backdrop click closes
    ovl.addEventListener('click', (e)=>{ if (e.target === ovl) ovl.classList.remove('open'); });

    // draw pad once
    const pad = ovl.querySelector('#gradPad');
    const ctx = pad.getContext('2d');
    const w = pad.width, h = pad.height;

    function renderPad(){
      const img = ctx.createImageData(w, h);
      for (let y=0; y<h; y++){
        for (let x=0; x<w; x++){
          const hue = (x / w) * 360;
          const sat = (y / h);
          const [r,g,b] = hslToRgb(hue/360, sat, 0.55);
          const i = (y*w + x) * 4;
          img.data[i] = r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=255;
        }
      }
      ctx.putImageData(img,0,0);
    }
    renderPad();

    // handles + drag
    const wrap = ovl.querySelector('#padWrap');
    const h1 = ovl.querySelector('#h1'), h2 = ovl.querySelector('#h2'), prev = ovl.querySelector('#gradPrev');

    const root = getComputedStyle(document.documentElement);
    let c1 = S.customAccent1 || root.getPropertyValue('--accent').trim() || '#8b5cf6';
    let c2 = S.customAccent2 || root.getPropertyValue('--accent2').trim() || '#d946ef';

    function placeFromColor(el, hex){
      const {h, s} = hexToHsl(hex);
      const x = Math.max(0, Math.min(1, h/360)) * w;
      const y = Math.max(0, Math.min(1, s)) * h;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      el.style.background = hex;
    }
    placeFromColor(h1, c1);
    placeFromColor(h2, c2);
    prev.style.background = `linear-gradient(135deg, ${c2}, ${c1})`;

    function attachDrag(el, assign){
      function move(ev){
        const rect = wrap.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width,  ev.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
        el.style.left = x + 'px'; el.style.top = y + 'px';
        const px = Math.round((x/rect.width) * w);
        const py = Math.round((y/rect.height)* h);
        const data = ctx.getImageData(Math.max(0,Math.min(w-1,px)), Math.max(0,Math.min(h-1,py)), 1,1).data;
        const hex = rgbToHex(data[0],data[1],data[2]);
        el.style.background = hex;
        assign(hex);
        prev.style.background = `linear-gradient(135deg, ${c2}, ${c1})`;
      }
      function up(){ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
      return (e)=>{ e.preventDefault(); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); };
    }

    h1.onpointerdown = attachDrag(h1, hex=>{ c1 = hex; });
    h2.onpointerdown = attachDrag(h2, hex=>{ c2 = hex; });

    ovl.querySelector('#gradCancel').onclick = ()=> ovl.classList.remove('open');
    ovl.querySelector('#gradApply').onclick  = ()=>{
      document.documentElement.style.setProperty('--accent',  c1);
      document.documentElement.style.setProperty('--accent2', c2);
      S.theme = 'custom'; S.customAccent1=c1; S.customAccent2=c2;
      restyleContactChips();
      ovl.classList.remove('open');
    };
  }
  document.getElementById('grad-ovl').classList.add('open');
}

/* ---------- helpers ------------------------------------------------ */
const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

/* KEEPING YOUR MOCK EXACT LOOK — not touching layout visuals */
function mock(layoutKey){
  const kind = layoutKey.split('-')[1];
  const hero = (kind==='side')
    ? `<div class="hero" style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div class="pp" style="position:absolute;left:30px;top:30px;width:42px;height:42px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div class="txt" style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
       </div>`
    : kind==='fancy'
    ? `<div class="hero" style="height:86px;margin:8px;border-radius:14px;background:#263266"></div>
       <div class="pp" style="position:absolute;left:50%;transform:translateX(-50%);top:86px;width:74px;height:74px;border-radius:50%;background:#cfd6ff;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.35)"></div>
       <div class="txt" style="position:absolute;left:24px;right:24px;top:176px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:40%;margin:0 auto"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:70%;margin:0 auto"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:48%;margin:0 auto"></div>
       </div>`
    : `<div class="hero" style="height:86px;margin:8px;border-radius:14px;background:#263266;position:relative"></div>
       <div class="pp" style="position:absolute;right:28px;top:28px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.35)"></div>
       <div class="txt" style="position:absolute;left:24px;right:120px;top:28px;display:grid;gap:8px">
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div>
         <div class="line" style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div>
       </div>`;
  return `<div class="mock ${kind}" data-layout="${layoutKey}">${hero}</div>`;
}

/* color helpers */
function hslToRgb(h, s, l){
  let r, g, b;
  if(s === 0){ r = g = b = l; }
  else{
    const hue2rgb = (p, q, t)=>{
      if(t < 0) t += 1; if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function hexToHsl(hex){
  const m = hex.replace('#','');
  const r = parseInt(m.substring(0,2),16)/255;
  const g = parseInt(m.substring(2,4),16)/255;
  const b = parseInt(m.substring(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l=(max+min)/2;
  if(max===min){ h=s=0; }
  else{
    const d=max-min;
    s=l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return { h: h*360, s, l };
}
