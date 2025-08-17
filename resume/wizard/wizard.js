// /resume/wizard/wizard.js
// [wizard.js] v2.11.0 — inline editors (match canvas), sidebar toggle, sparkly "Added" animation
console.log('[wizard.js] v2.11.0');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* ---------- styles ---------- */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style'); st.id = 'wizard-style';
  st.textContent = `
    /* mocks kept */
    #wizard .wz-mock{width:450px;height:158px;position:relative;cursor:pointer;margin:8px 0;border-radius:18px;transition:transform .15s ease, box-shadow .15s ease, outline .15s ease}
    #wizard .wz-mock:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(0,0,0,.35), 0 0 0 2px #7c99ff44 inset}
    #wizard .wz-mock.sel{ outline:2px solid #ffb86c; }
    #wizard .wz-card{position:absolute; inset:0; border-radius:16px; padding:12px;background:linear-gradient(135deg,#5d71b4,#2e3c79);box-shadow:inset 0 1px 0 #ffffff12, 0 10px 28px rgba(0,0,0,.38);overflow:hidden}
    #wizard .wz-pill{ height:10px; border-radius:999px; background:#2b375f; }
    #wizard .wz-pp{width:74px;height:74px;border-radius:50%; background:#cfd6ff;border:4px solid #ffffffc0; box-shadow:0 10px 24px rgba(0,0,0,.35)}
    /* side / fancy / top arrangements (unchanged) */
    #wizard .wz-mock--side .wz-left{position:absolute; left:12px; top:12px; bottom:12px; width:162px;border-radius:14px; background:linear-gradient(160deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px}
    #wizard .wz-mock--side .wz-right{position:absolute; left:192px; right:20px; top:24px; display:grid; row-gap:12px}
    #wizard .wz-mock--side .wz-right .wz-l1{ width:72% }  #wizard .wz-mock--side .wz-right .wz-l2{ width:56% }  #wizard .wz-mock--side .wz-left .wz-under{ width:72% }
    #wizard .wz-mock--fancy .wz-hero{position:absolute; left:12px; right:12px; top:12px; height:68px;border-radius:14px; background:linear-gradient(135deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14}
    #wizard .wz-mock--fancy .wz-pp{position:absolute; left:50%; transform:translateX(-50%); top:28px; width:92px; height:92px; z-index:1}
    #wizard .wz-mock--fancy .wz-b1,#wizard .wz-mock--fancy .wz-b2,#wizard .wz-mock--fancy .wz-b3{position:absolute; left:50%; transform:translateX(-50%); z-index:0}
    #wizard .wz-mock--fancy .wz-b1{ width:140px; bottom:26px } #wizard .wz-mock--fancy .wz-b2{ width:78%;  bottom:14px } #wizard .wz-mock--fancy .wz-b3{ width:160px; bottom:6px }
    #wizard .wz-mock--top .wz-hero{position:absolute; left:12px; right:12px; top:12px; height:66px;border-radius:14px; background:linear-gradient(135deg,#6c7fca,#3b4b93); box-shadow:inset 0 1px 0 #ffffff14}
    #wizard .wz-mock--top .wz-pp{position:absolute; right:26px; top:15px;width:60px; height:60px}
    #wizard .wz-mock--top .wz-txt{position:absolute; left:32px; right:130px; top:30px; display:grid; row-gap:12px}
    #wizard .wz-mock--top .wz-t1{ width:52%; height:10px } #wizard .wz-mock--top .wz-t2{ width:70%; height:10px }
    #wizard .wz-mock--top .wz-b1,#wizard .wz-mock--top .wz-b2,#wizard .wz-mock--top .wz-b3{position:absolute; left:50%; transform:translateX(-50%)}
    #wizard .wz-mock--top .wz-b1{ width:160px; bottom:42px } #wizard .wz-mock--top .wz-b2{ width:78%;  bottom:24px } #wizard .wz-mock--top .wz-b3{ width:170px; bottom:8px }

    /* inline editors (match canvas) */
    .wiz-mini .row{display:grid;grid-template-columns:20px 20px 221px 100px;gap:10px;align-items:center;justify-content:center}
    .wiz-mini .row .handle{display:grid;place-items:center}
    .wiz-mini .row .del{display:grid;place-items:center}
    .wiz-mini .row input[type=text]{background:#0c1328;color:#e7ebff;border:1px solid #243057;border-radius:10px;padding:8px 10px;width:221px}
    .wiz-mini .row input[type=range]{width:100px}
    .wiz-mini .row .stars{display:inline-flex;gap:6px;justify-self:center}
    .wiz-mini .row .star{cursor:pointer;width:16px;height:16px;fill:#d1d5db}
    .wiz-mini .row .star.active{fill:#f59e0b}
    .wiz-mini .btns{display:flex;gap:8px;margin-top:10px;justify-content:center}
    .wiz-switch{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:10px}
    .wiz-switch .switch{width:44px;height:24px;border-radius:999px;background:#243057;position:relative;cursor:pointer}
    .wiz-switch .switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#8aa4ff;transition:left .15s ease}
    .wiz-switch .switch.on::after{left:23px}

    /* education/experience cards to mirror canvas look */
    .wiz-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .edu-card{background:#0f1324;border:1px solid #1f2540;border-radius:14px;padding:12px 14px;display:grid;gap:6px;position:relative}
    .edu-line1{display:flex;align-items:center;gap:8px;font-weight:800}
    .badge{display:inline-block;background:#182243;color:#cfe1ff;border:1px solid #2b3458;padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px}
    .edu-tools{position:absolute;right:8px;top:8px;display:flex;gap:6px}
    .wiz-card{background:#0c1324;border:1px solid #1f2540;border-radius:12px;padding:10px;display:grid;gap:8px}

    /* Bio field dark */
    #wizard .wipt, #wizard textarea.wipt{background:#0c1328;color:#e7ebff;border:1px solid #243057;border-radius:10px;padding:8px 10px}

    /* DnD placeholder */
    .wiz-drop-ph{border:2px dashed #8da0ff44;border-radius:12px;height:42px !important}

    /* Sparkly "Added" state */
    .wiz-added{display:grid;place-items:center;height:120px;border:1px dashed #2b3458;border-radius:12px;position:relative;overflow:hidden}
    .wiz-added .label{font-weight:900}
    .twinkle{position:absolute;font-weight:900;pointer-events:none;animation:twinkle .9s ease-out forwards}
    @keyframes twinkle{
      0%{transform:translate(var(--x0),var(--y0)) scale(.6) rotate(0deg); opacity:0}
      40%{opacity:1}
      100%{transform:translate(var(--x1),var(--y1)) scale(1.1) rotate(25deg); opacity:0}
    }
  `;
  document.head.appendChild(st);
})();

/* ---------- tiny DnD with drop outline ---------- */
function wizAttachDnd(container, itemSel){
  if(!container || container._dndWiz) return; container._dndWiz = true;
  let dragEl=null, ph=null;
  container.addEventListener('dragstart', e=>{
    const it = e.target.closest(itemSel); if(!it) return;
    dragEl=it; e.dataTransfer.effectAllowed='move';
    try{e.dataTransfer.setData('text/plain','');}catch(_){}
    ph = document.createElement('div'); ph.className='wiz-drop-ph'; ph.style.height=it.offsetHeight+'px';
    setTimeout(()=> it.style.opacity='.35',0);
  });
  container.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; ph&&ph.remove(); dragEl=null; ph=null; } });
  container.addEventListener('dragover', e=>{
    if(!dragEl) return; e.preventDefault();
    const after = Array.from(container.querySelectorAll(itemSel)).filter(x=>x!==dragEl)
      .reduce((c,ch)=>{const b=ch.getBoundingClientRect(); const off=e.clientY-b.top-b.height/2; return off<0 && off>c.o?{o:off,el:ch}:c;},{o:-1e9}).el;
    if(!after) container.appendChild(ph); else container.insertBefore(ph, after);
  });
  container.addEventListener('drop', e=>{
    if(!dragEl||!ph) return; e.preventDefault();
    container.insertBefore(dragEl, ph); ph.remove(); dragEl.style.opacity='';
  });
}

/* ---------- wizard state ---------- */
let W = { skills:[], addSkillsToRail:true, edu:[], exp:[], expDraft:{dates:'',role:'',org:'',desc:''}, bio:'' };

/* ---------- Public API ---------- */
export function mountWelcome() {
  if (document.getElementById('welcome')) return;
  const wrap = document.createElement('div');
  wrap.id = 'welcome'; wrap.setAttribute('data-overlay', '');
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
  wrap.querySelector('#startBlank').addEventListener('click', () => { wrap.remove(); document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex'); });
}

export function mountWizard() {
  if (document.getElementById('wizard')) return;
  const modal = document.createElement('div');
  modal.id = 'wizard'; modal.className = 'modal'; modal.setAttribute('data-overlay', '');
  Object.assign(modal.style, { position:'fixed', inset:'0', display:'none', placeItems:'center', background:'rgba(0,0,0,.55)', zIndex:'21000' });
  modal.innerHTML = `
    <div class="wiz" style="width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden">
      <div class="wiz-left" style="background:#0c111f;border-right:1px solid #1b2340;padding:16px"><div class="step-list" id="stepList" style="display:grid;gap:8px"></div></div>
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

/* ---------- Wizard internals ---------- */
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
  const list = document.getElementById('stepList'); list.innerHTML = '';
  STEPS.forEach((s,i) => {
    const el = document.createElement('div');
    el.className = 'step'; el.dataset.i = i;
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;color:#c9d1ff80';
    el.innerHTML = `<div class="dot" style="width:8px;height:8px;border-radius:50%;background:#2e3b66"></div><div>${s.label}</div>`;
    list.appendChild(el);
  });
  document.getElementById('wizBack').onclick = () => { if(stepIdx>0){ stepIdx--; backCount++; renderStep(); } };
  document.getElementById('wizStartOver').onclick = () => { Object.assign(S,{ contact:{name:'',phone:'',email:'',address:'',linkedin:''} }); W={skills:[],addSkillsToRail:true,edu:[],exp:[],expDraft:{dates:'',role:'',org:'',desc:''},bio:''}; stepIdx=0; backCount=0; renderStep(); };
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

  /* Layout */
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
    row.addEventListener('click', e=>{ const m=e.target.closest('.wz-mock'); if(!m) return; row.querySelectorAll('.wz-mock').forEach(x=>x.classList.remove('sel')); m.classList.add('sel'); morphTo(m.dataset.layout); });
    body.querySelector('#wizAddPhoto').onclick = () => getHeaderNode()?.querySelector('[data-avatar] input')?.click();
  }

  /* Theme */
  if (s === 'theme'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose a color theme</div>
      <div class="theme-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
        ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
          .map(k=>`<div class="swatch" data-k="${k}" style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;background:linear-gradient(135deg,var(--a1),var(--a2))" data-a1="${A1[k]||'#8b5cf6'}" data-a2="${A2[k]||'#d946ef'}"></div>`).join('')}
      </div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>`;
    body.querySelectorAll('.swatch').forEach(swatch=>{ const k=swatch.dataset.k; swatch.onclick=()=>{ document.body.setAttribute('data-theme', k); S.theme=k; };});
    body.querySelector('#wizDark').onclick = e=>{ e.currentTarget.classList.toggle('on'); S.dark = e.currentTarget.classList.contains('on'); document.body.setAttribute('data-dark', S.dark ? '1' : '0'); };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); };
  }

  /* Contact */
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
    ['nm','ph','em','ad','ln'].forEach(id=> body.querySelector('#'+id).oninput = ()=>{
      S.contact = { name: body.querySelector('#nm').value, phone: body.querySelector('#ph').value, email: body.querySelector('#em').value, address: body.querySelector('#ad').value, linkedin: body.querySelector('#ln').value };
      applyContact?.();
    }));
  }

  /* Skills */
  if (s === 'skills'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:10px;text-align:center">Use ★ or a slider; you can fine-tune on the canvas later.</div>
      <div class="wiz-mini">
        <div id="wizSkills" class="list" style="display:grid;gap:8px;justify-items:center"></div>
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
      const r = document.createElement('div'); r.className='row'; r.setAttribute('draggable','true');
      r.innerHTML = `<span class="handle">⋮⋮</span><span class="del">×</span><input type="text" value="${label}"><span class="stars">${[1,2,3,4,5].map(i=>`<svg class="star" data-i="${i}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`).join('')}</span>`;
      r.dataset.t='star'; r.querySelector('.del').onclick=()=>r.remove();
      r.querySelectorAll('.star').forEach((s,ix)=>{ if(ix<active) s.classList.add('active'); s.onclick = e=>{ const n=+e.currentTarget.dataset.i; r.querySelectorAll('.star').forEach((el,i)=> el.classList.toggle('active', i<n)); }; });
      return r;
    };
    const rowSlider = (label='Skill', val=60)=>{
      const r = document.createElement('div'); r.className='row'; r.setAttribute('draggable','true');
      r.innerHTML = `<span class="handle">⋮⋮</span><span class="del">×</span><input type="text" value="${label}"><input type="range" min="0" max="100" value="${val}">`;
      r.dataset.t='slider'; r.querySelector('.del').onclick=()=>r.remove(); return r;
    };

    body.querySelector('#addStar').onclick   = ()=> list.appendChild(rowStar());
    body.querySelector('#addSlider').onclick = ()=> list.appendChild(rowSlider());
    wizAttachDnd(list, '.row');

    // restore
    W.skills.forEach(it=> list.appendChild(it.type==='star' ? rowStar(it.label,it.stars) : rowSlider(it.label,it.value)));
    body.querySelector('#toRail').onclick = (e)=>{ e.currentTarget.classList.toggle('on'); W.addSkillsToRail = e.currentTarget.classList.contains('on'); };
  }

  /* Education (cards match canvas) */
  if (s === 'education'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add items now or later from the canvas.</div>
      <div id="wizEdu" class="wiz-grid2"></div>
      <div class="btns"><button class="mbtn" id="addCourse">+ Add course</button><button class="mbtn" id="addDegree">+ Add degree</button></div>`;
    const list = body.querySelector('#wizEdu');
    const mk = (kind='course', data={})=>{
      const icon = kind==='degree' ? 'fa-graduation-cap' : 'fa-scroll';
      const card = document.createElement('div'); card.className='edu-card'; card.setAttribute('draggable','true'); card.dataset.k = kind;
      card.innerHTML = `
        <div class="edu-tools"><span class="handle" title="Drag">⋮⋮</span><button class="mbtn" title="Remove">×</button></div>
        <div class="edu-line1"><i class="fa-solid ${icon} edu-title-icon"></i><span class="badge" contenteditable>${data.dates||'2018–2022'}</span></div>
        <input type="text" placeholder="Title" class="wipt" style="width:100%" value="${data.title||''}">
        <input type="text" placeholder="Academy" class="wipt" style="width:100%" value="${data.academy||''}">`;
      card.querySelector('.mbtn').onclick = ()=> card.remove();
      return card;
    };
    body.querySelector('#addCourse').onclick = ()=> list.appendChild(mk('course'));
    body.querySelector('#addDegree').onclick = ()=> list.appendChild(mk('degree'));
    wizAttachDnd(list, '.edu-card');
    W.edu.forEach(it=> list.appendChild(mk(it.kind,it)));
  }

  /* Experience (one at a time + sparkles) */
  if (s === 'experience'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">You can keep adding/editing from the canvas.</div>
      <div id="wizExpWrap" class="wiz-mini"></div>
      <div class="btns"><button class="mbtn" id="addExpNow">+ Add another</button></div>`;
    const wrap = body.querySelector('#wizExpWrap');

    const mkEditor = (d={})=>{
      const c = document.createElement('div'); c.className='wiz-card';
      c.innerHTML = `
        <input type="text" placeholder="Dates (e.g. Jan 2024 – Present)" class="wipt" id="eDates" value="${d.dates||''}">
        <input type="text" placeholder="Role (e.g. Front-end Engineer)" class="wipt" id="eRole" value="${d.role||''}">
        <input type="text" placeholder="Organization (e.g. @Company)" class="wipt" id="eOrg" value="${d.org||''}">
        <input type="text" placeholder="Short description of impact/results" class="wipt" id="eDesc" value="${d.desc||''}">`;
      return c;
    };

    const showAdded = ()=>{
      wrap.innerHTML = `<div class="wiz-added"><div class="label">Added</div></div>`;
      const box = wrap.querySelector('.wiz-added');

      // spawn twinkles (+ and ✨) at random paths around "Added"
      const N = 16 + Math.floor(Math.random()*8);
      for(let i=0;i<N;i++){
        const span = document.createElement('span');
        span.className = 'twinkle';
        const isPlus = Math.random() < 0.55;
        span.textContent = isPlus ? '+' : '✨';
        span.style.color = isPlus ? '#26d07c' : '';
        const x0 = (Math.random()*60-30) + 'px';
        const y0 = (Math.random()*14-7) + 'px';
        const x1 = (Math.random()*240-120) + 'px';
        const y1 = (Math.random()*120-60) + 'px';
        span.style.setProperty('--x0', x0); span.style.setProperty('--y0', y0);
        span.style.setProperty('--x1', x1); span.style.setProperty('--y1', y1);
        span.style.left = '50%'; span.style.top = '50%';
        span.style.animationDelay = (Math.random()*0.3)+'s';
        box.appendChild(span);
      }
      setTimeout(()=>{ wrap.innerHTML=''; wrap.appendChild(mkEditor({})); }, 1150);
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
      W.exp.push(d); W.expDraft = {};
      renderExp([d]);                // append to canvas right away
      showAdded();
    };
  }

  /* Bio */
  if (s === 'bio'){
    body.innerHTML = `<div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Bio</div>
      <textarea id="bioText" class="wipt" rows="6" placeholder="Short profile…" style="width:100%;min-height:120px"></textarea>`;
    const t = body.querySelector('#bioText'); t.value = W.bio || ''; t.oninput = ()=>{ W.bio = t.value; };
  }

  if (s === 'done'){
    body.innerHTML = `<div class="wtitle" style="text-align:center">All set ✨</div><div class="wsub" style="opacity:.85;text-align:center">Continue on the canvas.</div>`;
    document.getElementById('wizNext').textContent = 'Finish';
  } else {
    document.getElementById('wizNext').textContent = 'Next';
  }
}

/* ---------- Next: collect & push (only when edited) ---------- */
function advance(){
  const cur = STEPS[stepIdx].k;

  if (cur === 'skills'){
    const list = document.getElementById('wizBody').querySelector('#wizSkills');
    if (list){
      W.skills = Array.from(list.querySelectorAll('.row')).map(r=>{
        if(r.dataset.t==='star'){
          const label = r.querySelector('input[type=text]').value.trim() || 'Skill';
          const stars = r.querySelectorAll('.star.active').length;
          return { type:'star', label, stars };
        }else{
          const label = r.querySelector('input[type=text]').value.trim() || 'Skill';
          const value = +r.querySelector('input[type=range]').value;
          return { type:'slider', label, value };
        }
      });
      if (W.skills.length) renderSkills(W.skills, { toRail: W.addSkillsToRail });
    }
  }

  if (cur === 'education'){
    const list = document.getElementById('wizBody').querySelector('#wizEdu');
    if (list){
      W.edu = Array.from(list.querySelectorAll('.edu-card')).map(c=>{
        const badge = c.querySelector('.badge')?.textContent.trim() || '';
        const inputs = c.querySelectorAll('input');
        return { kind: c.dataset.k, title: inputs[0]?.value.trim() || '', dates: badge, academy: inputs[1]?.value.trim() || '' };
      }).filter(x=> x.title||x.dates||x.academy);
      if (W.edu.length) renderEdu(W.edu);
    }
  }

  if (cur === 'experience'){
    const wrap = document.getElementById('wizBody').querySelector('#wizExpWrap');
    if (wrap && wrap.querySelector('#eDates')){
      const d = { dates: wrap.querySelector('#eDates').value.trim(), role: wrap.querySelector('#eRole').value.trim(), org: wrap.querySelector('#eOrg').value.trim(), desc: wrap.querySelector('#eDesc').value.trim() };
      const edited = d.dates || d.role || d.org || d.desc;
      if (edited){ W.exp.push(d); renderExp([d]); }
    }
  }

  if (cur === 'bio'){ if (W.bio && W.bio.trim()) renderBio(W.bio); }

  if (cur === 'done'){
    document.getElementById('wizard').style.display = 'none';
    document.getElementById('welcome')?.remove();
    document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex');
    return;
  }
  if (stepIdx < STEPS.length-1){ stepIdx++; renderStep(); }
}

/* ---------- helpers ---------- */
const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

function mock(layoutKey){
  const kind = layoutKey.split('-')[1];
  if (kind === 'side'){
    return `<div class="wz-mock wz-mock--side" data-layout="${layoutKey}">
      <div class="wz-card">
        <div class="wz-left"><div class="wz-pp"></div><div class="wz-pill wz-under"></div></div>
        <div class="wz-right"><div class="wz-pill wz-l1"></div><div class="wz-pill wz-l2"></div></div>
      </div></div>`;
  }
  if (kind === 'fancy'){
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
