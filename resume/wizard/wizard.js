// /resume/wizard/wizard.js
// [wizard.js] v2.11.5 — keeps theme swatches + inline editors; renders with tokens-aware skills
console.log('[wizard.js] v2.11.5');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* ---------- styles (wizard UI + inline editors) ---------- */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style');
  st.id = 'wizard-style';
  st.textContent = `
    /* overlay + frame */
    #wizard[data-overlay]{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);z-index:21000}
    #wizard .wiz{width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden}
    #wizard .wiz-left{background:#0c111f;border-right:1px solid #1b2340;padding:16px}
    #wizard .step-list{display:grid;gap:8px}
    #wizard .step{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;color:#c9d1ff80}
    #wizard .step.on{color:#e8ecff;background:#131a31}
    #wizard .step .dot{width:8px;height:8px;border-radius:50%;background:#2e3b66}
    #wizard .wiz-right{padding:20px 22px;display:flex;flex-direction:column;min-height:480px}
    #wizard #wizBody{flex:1}
    #wizard .navline{display:flex;gap:10px;justify-content:flex-end}
    #wizard .mbtn{appearance:none;background:#0c1328;border:1px solid #243057;color:#e6e8ff;border-radius:10px;padding:8px 12px;cursor:pointer}
    #wizard .mbtn.primary{background:linear-gradient(135deg,var(--accent2,#c084fc),var(--accent,#f472b6));color:#111;border:none}
    #wizard .wtitle{font-weight:900;font-size:18px;margin-bottom:8px}
    #wizard .wsub{opacity:.8;margin-bottom:10px}

    /* inline editors */
    .wiz-mini .row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}
    .wiz-mini .row input[type=text]{background:#0c1328;color:#e7ebff;border:1px solid #243057;border-radius:10px;padding:8px 10px;width:100%}
    .wiz-mini .row .stars{display:inline-flex;gap:var(--star-gap,4px)}
    .wiz-mini .row .star{cursor:pointer;width:16px;height:16px;fill:#d1d5db}
    .wiz-mini .row .star.active{fill:#f59e0b}
    .wiz-mini .btns{display:flex;gap:8px;margin-top:8px}
    .wiz-switch{display:inline-flex;align-items:center;gap:8px;justify-content:center;margin-top:10px}
    .wiz-switch .switch{width:44px;height:24px;border-radius:999px;background:#243057;position:relative;cursor:pointer}
    .wiz-switch .switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#8aa4ff;transition:left .15s ease}
    .wiz-switch .switch.on::after{left:23px}
    .wiz-card{background:#0c1324;border:1px solid #1f2540;border-radius:12px;padding:10px;display:grid;gap:8px}
    .wiz-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .wiz-pill{background:#0c1328;border:1px solid #243057;color:#e7ebff;border-radius:10px;padding:8px 10px;width:100%}
    .wiz-badge{background:#1a2036;border:1px solid #2b3458;color:#cfe1ff;border-radius:999px;padding:4px 10px;font-weight:700}
    .wiz-added{display:grid;place-items:center;height:90px;border:1px dashed #2b3458;border-radius:12px;opacity:.85}
    .wiz-added .spark{animation:wPop .6s ease;display:inline-flex;gap:8px;align-items:center;font-weight:800}
    @keyframes wPop{0%{transform:scale(.9);opacity:.2}60%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
  `;
  document.head.appendChild(st);
})();

/* ---------- tiny DnD for wizard lists ---------- */
function wizAttachDnd(container, itemSel){
  if(!container || container._dndWiz) return; container._dndWiz = true;
  let dragEl = null;
  container.addEventListener('dragstart', e=>{
    const it = e.target.closest(itemSel); if(!it) return;
    dragEl = it;
    e.dataTransfer.effectAllowed = 'move';
    try{ e.dataTransfer.setData('text/plain',''); }catch(_){}
    setTimeout(()=> it.style.opacity = '.35', 0);
  });
  container.addEventListener('dragend', ()=>{
    if(dragEl){ dragEl.style.opacity=''; dragEl=null; }
  });
  container.addEventListener('dragover', e=>{
    if(!dragEl) return; e.preventDefault();
    const after = Array.from(container.querySelectorAll(itemSel)).filter(x=>x!==dragEl)
      .reduce((c,ch)=>{ const b=ch.getBoundingClientRect(); const off=e.clientY-b.top-b.height/2; return off<0 && off>c.o?{o:off,el:ch}:c; },{o:-1e9}).el;
    if(!after) container.appendChild(dragEl); else container.insertBefore(dragEl, after);
  });
}

/* ---------- wizard state ---------- */
let W = {
  skills: [],                 // {type:'star'|'slider', label, stars|value}
  addSkillsToRail: true,      // toggle for sidebar placement
  edu: [],                    // {kind:'course'|'degree', title, dates, academy}
  exp: [],
  expDraft: { dates:'', role:'', org:'', desc:'' },
  bio: ''
};

/* ---------- Public API ---------- */
export function mountWelcome(){
  if (document.getElementById('welcome')) return;
  const wrap = document.createElement('div');
  wrap.id = 'welcome'; wrap.setAttribute('data-overlay','');
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
  wrap.querySelector('#startWizard').addEventListener('click', ()=>{ wrap.style.display='none'; mountWizard(); openWizard(); });
  wrap.querySelector('#startBlank').addEventListener('click', ()=>{ wrap.remove(); document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display='flex'); });
}

export function mountWizard(){
  if (document.getElementById('wizard')) return;
  const modal = document.createElement('div');
  modal.id = 'wizard'; modal.className = 'modal'; modal.setAttribute('data-overlay','');
  modal.innerHTML = `
    <div class="wiz">
      <div class="wiz-left"><div class="step-list" id="stepList"></div></div>
      <div class="wiz-right">
        <div id="wizBody"></div>
        <div class="navline">
          <button class="mbtn" id="wizStartOver" style="margin-right:auto;display:none" type="button">Start over</button>
          <button class="mbtn" id="wizBack" type="button">Back</button>
          <button class="mbtn" id="wizNext" type="button" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Next</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  buildWizard();
}

/* ---------- Wizard internals ---------- */
const STEPS = [
  { k:'layout',    label:'Layout' },
  { k:'theme',     label:'Theme' },
  { k:'contact',   label:'Profile data' },
  { k:'skills',    label:'Skills' },
  { k:'education', label:'Education' },
  { k:'experience',label:'Experience' },
  { k:'bio',       label:'Bio' },
  { k:'done',      label:'Done' }
];

let stepIdx = 0;
let backCount = 0;

function openWizard(){ renderStep(); document.getElementById('wizard').style.display='grid'; }

function buildWizard(){
  const list = document.getElementById('stepList');
  list.innerHTML = '';
  STEPS.forEach((s,i)=>{
    const el = document.createElement('div');
    el.className='step'; el.dataset.i=i;
    el.innerHTML = `<div class="dot"></div><div>${s.label}</div>`;
    list.appendChild(el);
  });
  document.getElementById('wizBack').onclick = ()=>{ if(stepIdx>0){ stepIdx--; backCount++; renderStep(); } };
  document.getElementById('wizStartOver').onclick = ()=>{
    Object.assign(S,{ contact:{name:'',phone:'',email:'',address:'',linkedin:''} });
    W={ skills:[], addSkillsToRail:true, edu:[], exp:[], expDraft:{dates:'',role:'',org:'',desc:''}, bio:'' };
    stepIdx=0; backCount=0; renderStep();
  };
  document.getElementById('wizNext').onclick = advance;
}

function markSteps(){
  const nodes = Array.from(document.querySelectorAll('#stepList .step'));
  nodes.forEach((el,i)=>{
    el.classList.toggle('on', i===stepIdx);
    el.classList.toggle('done', i<stepIdx);
    el.style.color = i===stepIdx ? '#e8ecff' : (i<stepIdx ? '#a7ffcf' : '#c9d1ff80');
    el.style.background = i===stepIdx ? '#131a31' : 'transparent';
    const dot = el.querySelector('.dot'); if(dot) dot.style.background = i<stepIdx ? '#26d07c' : '#2e3b66';
  });
}

function renderStep(){
  const body = document.getElementById('wizBody');
  const s = STEPS[stepIdx].k;
  markSteps();
  document.getElementById('wizStartOver').style.display = (backCount>=2 ? 'inline-flex' : 'none');

  /* ----- LAYOUT ----- */
  if (s==='layout'){
    body.innerHTML = `
      <div class="wtitle">Choose your layout</div>
      <div class="wsub">Pick a starting header style.</div>
      <div id="mockRow" style="display:grid;gap:22px">
        ${mock('header-side')}
        ${mock('header-fancy')}
        ${mock('header-top')}
      </div>
      <div class="k-row" style="margin-top:12px"><button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button></div>`;
    const row = body.querySelector('#mockRow');
    const current = (S.layout==='side')?'header-side':(S.layout==='fancy')?'header-fancy':(S.layout==='top')?'header-top':null;
    if (current) row.querySelector(`[data-layout="${current}"]`)?.classList.add('sel');
    row.addEventListener('click', e=>{
      const m=e.target.closest('.wz-mock'); if(!m) return;
      row.querySelectorAll('.wz-mock').forEach(x=>x.classList.remove('sel'));
      m.classList.add('sel'); morphTo(m.dataset.layout);
    });
    body.querySelector('#wizAddPhoto').onclick = ()=> getHeaderNode()?.querySelector('[data-avatar] input')?.click();
  }

  /* ----- THEME ----- */
  if (s==='theme'){
    body.innerHTML = `
      <div class="wtitle">Choose a color theme</div>
      <div class="theme-row">
        ${THEMES.map(k=>`<div class="swatch" data-k="${k}" title="${k}" style="background:linear-gradient(135deg,${A1[k]},${A2[k]})"></div>`).join('')}
      </div>
      <div class="k-row" style="margin:10px 0 8px;display:flex;align-items:center;gap:10px">
        <span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div>
      </div>
      <div class="k-row" style="display:flex;align-items:center;gap:10px">
        <span>Material</span>
        <button class="mbtn" id="wizPaper">Paper</button>
        <button class="mbtn" id="wizGlass">Glass</button>
      </div>`;
    body.querySelectorAll('.swatch').forEach(swatch=>{
      const k=swatch.dataset.k;
      swatch.onclick = ()=>{
        document.body.setAttribute('data-theme', k);
        S.theme = k;
      };
    });
    body.querySelector('#wizDark').onclick = e=>{
      e.currentTarget.classList.toggle('on');
      S.dark = e.currentTarget.classList.contains('on');
      document.body.setAttribute('data-dark', S.dark ? '1' : '0');
    };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); };
  }

  /* ----- CONTACT ----- */
  if (s==='contact'){
    body.innerHTML = `
      <div class="wtitle">Profile data</div>
      <div class="wsub">Only filled fields will appear.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input class="wipt" id="nm" placeholder="Full name" value="${S.contact?.name||''}">
        <input class="wipt" id="ph" placeholder="Phone" value="${S.contact?.phone||''}">
        <input class="wipt" id="em" placeholder="Email" value="${S.contact?.email||''}">
        <input class="wipt" id="ad" placeholder="City, Country" value="${S.contact?.address||''}">
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center">
          <span style="opacity:.7">linkedin.com/in/</span>
          <input class="wipt" id="ln" placeholder="username" style="flex:1" value="${S.contact?.linkedin||''}">
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
        applyContact?.();
      };
    });
  }

  /* ----- SKILLS ----- */
  if (s==='skills'){
    body.innerHTML = `
      <div class="wtitle">Add your skills</div>
      <div class="wsub">Use ★ or a slider; you can fine-tune on the canvas later.</div>
      <div class="wiz-mini">
        <div id="wizSkills" class="list"></div>
        <div class="btns">
          <button class="mbtn" id="addStar">+ ★</button>
          <button class="mbtn" id="addSlider">+ <i class="fa-solid fa-sliders"></i></button>
        </div>
        <div class="wiz-switch">
          <span>Add to sidebar</span>
          <div id="toRail" class="switch ${W.addSkillsToRail?'on':''}"></div>
        </div>
      </div>`;
    const list = body.querySelector('#wizSkills');

    const rowStar = (label='Skill', active=0)=>{
      const r = document.createElement('div'); r.className='row'; r.setAttribute('draggable','true'); r.dataset.t='star';
      r.innerHTML = `<span class="handle">⋮⋮</span><input type="text" value="${label}">
        <span class="stars">${[1,2,3,4,5].map(i=>`<svg class="star" data-i="${i}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`).join('')}</span>`;
      r.querySelectorAll('.star').forEach((s,ix)=>{ if(ix<active) s.classList.add('active'); s.onclick = e=>{ const n=+e.currentTarget.dataset.i; r.querySelectorAll('.star').forEach((el,i)=> el.classList.toggle('active', i<n)); }; });
      return r;
    };
    const rowSlider = (label='Skill', val=60)=>{
      const r = document.createElement('div'); r.className='row'; r.setAttribute('draggable','true'); r.dataset.t='slider';
      r.innerHTML = `<span class="handle">⋮⋮</span><input type="text" value="${label}">
        <input type="range" min="0" max="100" value="${val}">`;
      return r;
    };

    body.querySelector('#addStar').onclick   = ()=> list.appendChild(rowStar());
    body.querySelector('#addSlider').onclick = ()=> list.appendChild(rowSlider());
    wizAttachDnd(list, '.row');
    W.skills.forEach(it=> list.appendChild(it.type==='star' ? rowStar(it.label,it.stars) : rowSlider(it.label,it.value)));
    body.querySelector('#toRail').onclick = (e)=>{ e.currentTarget.classList.toggle('on'); W.addSkillsToRail = e.currentTarget.classList.contains('on'); };
  }

  /* ----- EDUCATION ----- */
  if (s==='education'){
    body.innerHTML = `
      <div class="wtitle">Education</div>
      <div class="wsub">Add items now or later from the canvas.</div>
      <div id="wizEdu" class="wiz-grid2"></div>
      <div class="btns"><button class="mbtn" id="addCourse">+ Add course</button><button class="mbtn" id="addDegree">+ Add degree</button></div>`;
    const list = body.querySelector('#wizEdu');
    const mk = (kind='course', data={})=>{
      const icon = kind==='degree' ? 'fa-graduation-cap' : 'fa-scroll';
      const card = document.createElement('div'); card.className='wiz-card'; card.setAttribute('draggable','true'); card.dataset.k = kind;
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <i class="fa-solid ${icon}"></i>
          <span class="wiz-badge" contenteditable>${data.dates||'2018–2022'}</span>
          <button class="mbtn" title="Remove" style="margin-left:auto">×</button>
        </div>
        <input type="text" placeholder="Title" class="wiz-pill" value="${data.title||''}">
        <input type="text" placeholder="Academy" class="wiz-pill" value="${data.academy||''}">`;
      card.querySelector('.mbtn').onclick = ()=> card.remove();
      return card;
    };
    body.querySelector('#addCourse').onclick = ()=> list.appendChild(mk('course'));
    body.querySelector('#addDegree').onclick = ()=> list.appendChild(mk('degree'));
    wizAttachDnd(list, '.wiz-card');
    W.edu.forEach(it=> list.appendChild(mk(it.kind,it)));
  }

  /* ----- EXPERIENCE ----- */
  if (s==='experience'){
    body.innerHTML = `
      <div class="wtitle">Experience</div>
      <div class="wsub">You can keep adding/editing from the canvas.</div>
      <div id="wizExpWrap" class="wiz-mini"></div>
      <div class="btns"><button class="mbtn" id="addExpNow">+ Add another</button></div>`;
    const wrap = body.querySelector('#wizExpWrap');

    const mkEditor = (d={})=>{
      const c = document.createElement('div'); c.className='wiz-card';
      c.innerHTML = `
        <input type="text" placeholder="Dates (e.g. Jan 2024 – Present)" class="wiz-pill" id="eDates" value="${d.dates||''}">
        <input type="text" placeholder="Role (e.g. Front-end Engineer)" class="wiz-pill" id="eRole" value="${d.role||''}">
        <input type="text" placeholder="Organization (e.g. @Company)" class="wiz-pill" id="eOrg" value="${d.org||''}">
        <input type="text" placeholder="Short description of impact/results" class="wiz-pill" id="eDesc" value="${d.desc||''}">`;
      return c;
    };

    const showAdded = ()=>{
      wrap.innerHTML = `<div class="wiz-added"><div class="spark">✨ <span>Added</span> <span style="color:#26d07c">+ +</span> ✨</div></div>`;
      setTimeout(()=>{ wrap.innerHTML=''; wrap.appendChild(mkEditor({})); }, 520);
    };

    wrap.appendChild(mkEditor(W.expDraft||{}));
    body.querySelector('#addExpNow').onclick = ()=>{
      const d = {
        dates: wrap.querySelector('#eDates').value.trim(),
        role:  wrap.querySelector('#eRole').value.trim(),
        org:   wrap.querySelector('#eOrg').value.trim(),
        desc:  wrap.querySelector('#eDesc').value.trim()
      };
      const edited = d.dates || d.role || d.org || d.desc;
      if(!edited) return;
      W.exp.push(d);
      W.expDraft = {};
      renderExp([d]);    // append to canvas immediately
      showAdded();
    };
  }

  /* ----- BIO ----- */
  if (s==='bio'){
    body.innerHTML = `
      <div class="wtitle">Bio</div>
      <textarea id="bioText" class="wipt" rows="6" placeholder="Short profile…" style="width:100%;min-height:120px;background:#0c1328;color:#e7ebff;border:1px solid #243057;border-radius:10px;padding:10px"></textarea>`;
    const t = body.querySelector('#bioText'); t.value = W.bio || '';
    t.oninput = ()=>{ W.bio = t.value; };
  }

  if (s==='done'){
    body.innerHTML = `<div class="wtitle" style="text-align:center">All set ✨</div><div class="wsub" style="opacity:.85;text-align:center">Continue on the canvas.</div>`;
    document.getElementById('wizNext').textContent = 'Finish';
  } else {
    document.getElementById('wizNext').textContent = 'Next';
  }
}

/* ---------- Next flow: collect & push ---------- */
function advance(){
  const cur = STEPS[stepIdx].k;

  if (cur==='skills'){
    const list = document.getElementById('wizBody').querySelector('#wizSkills');
    if (list){
      W.skills = Array.from(list.querySelectorAll('.row')).map(r=>{
        if (r.dataset.t==='star'){
          const label = r.querySelector('input[type=text]').value.trim() || 'Skill';
          const stars = r.querySelectorAll('.star.active').length;
          return { type:'star', label, stars };
        } else {
          const label = r.querySelector('input[type=text]').value.trim() || 'Skill';
          const value = +r.querySelector('input[type=range]').value;
          return { type:'slider', label, value };
        }
      });
      if (W.skills.length) renderSkills(W.skills, { toRail: W.addSkillsToRail });
    }
  }

  if (cur==='education'){
    const list = document.getElementById('wizBody').querySelector('#wizEdu');
    if (list){
      W.edu = Array.from(list.querySelectorAll('.wiz-card')).map(c=>{
        const dates = c.querySelector('.wiz-badge')?.textContent.trim() || '';
        return {
          kind: c.dataset.k,
          title: c.querySelectorAll('input')[0].value.trim(),
          dates,
          academy: c.querySelectorAll('input')[1].value.trim()
        };
      }).filter(x=> x.title||x.dates||x.academy);
      if (W.edu.length) renderEdu(W.edu);
    }
  }

  if (cur==='experience'){
    const wrap = document.getElementById('wizBody').querySelector('#wizExpWrap');
    if (wrap && wrap.querySelector('#eDates')){
      const d = {
        dates: wrap.querySelector('#eDates').value.trim(),
        role:  wrap.querySelector('#eRole').value.trim(),
        org:   wrap.querySelector('#eOrg').value.trim(),
        desc:  wrap.querySelector('#eDesc').value.trim()
      };
      const edited = d.dates || d.role || d.org || d.desc;
      if (edited){ W.exp.push(d); renderExp([d]); }
    }
  }

  if (cur==='bio'){
    if (W.bio && W.bio.trim()) renderBio(W.bio);
  }

  if (cur==='done'){
    document.getElementById('wizard').style.display='none';
    document.getElementById('welcome')?.remove();
    document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display='flex');
    return;
  }
  if (stepIdx < STEPS.length-1){ stepIdx++; renderStep(); }
}

/* ---------- helpers ---------- */
const THEMES = ['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack'];
const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

function mock(layoutKey){
  const kind = layoutKey.split('-')[1];
  if (kind==='side'){
    return `<div class="wz-mock wz-mock--side" data-layout="${layoutKey}">
      <div class="wz-card">
        <div class="wz-left"><div class="wz-pp"></div><div class="wz-pill wz-under"></div></div>
        <div class="wz-right"><div class="wz-pill wz-l1"></div><div class="wz-pill wz-l2"></div></div>
      </div></div>`;
  }
  if (kind==='fancy'){
    return `<div class="wz-mock wz-mock--fancy" data-layout="${layoutKey}">
      <div class="wz-card"><div class="wz-hero"></div><div class="wz-pp"></div>
        <div class="wz-pill wz-b1"></div><div class="wz-pill wz-b2"></div><div class="wz-pill wz-b3"></div>
      </div></div>`;
  }
  return `<div class="wz-mock wz-mock--top" data-layout="${layoutKey}">
    <div class="wz-card"><div class="wz-hero"></div><div class="wz-pp"></div>
      <div class="wz-txt"><div class="wz-pill wz-t1"></div><div class="wz-pill wz-t2"></div></div>
      <div class="wz-pill wz-b1"></div><div class="wz-pill wz-b2"></div><div class="wz-pill wz-b3"></div>
    </div></div>`;
}
