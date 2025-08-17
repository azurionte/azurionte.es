// [wizard.js] v2.11.2 — inline editors + safe Next flow + sparkle add for Exp
console.log('[wizard.js] v2.11.2');

import { S } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

/* styles for wizard + sparkle */
(function ensureWizardStyle(){
  if (document.getElementById('wizard-style')) return;
  const st = document.createElement('style'); st.id = 'wizard-style';
  st.textContent = `
    #wizard .wiz{width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden}
    #wizard .wiz-left{background:#0c111f;border-right:1px solid #1b2340;padding:16px}
    #wizard .wiz-right{padding:20px 22px;display:flex;flex-direction:column;min-height:480px}
    .wipt,.wiz-pill{background:#0c1328;border:1px solid #243057;color:#e7ebff;border-radius:10px;padding:8px 10px}
    .mbtn{appearance:none;background:#141a31;border:1px solid #2b324b;color:#e6e8ef;border-radius:10px;padding:8px 12px;cursor:pointer}
    .switch{width:44px;height:24px;border-radius:999px;background:#243057;position:relative;cursor:pointer}
    .switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#8aa4ff;transition:left .15s ease}
    .switch.on::after{left:23px}
    .wiz-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .wiz-card{background:#0c1324;border:1px solid #1f2540;border-radius:12px;padding:10px;display:grid;gap:8px}
    .stars .star{cursor:pointer;width:16px;height:16px;fill:#d1d5db}
    .stars .star.active{fill:#f59e0b}
    .sparkles{display:grid;place-items:center;height:96px;border:1px dashed #2b3458;border-radius:12px;position:relative;overflow:hidden}
    .spark{position:absolute;animation:tw .9s ease-out infinite}
    .spark i{color:#26d07c;margin:0 4px}
    @keyframes tw{0%{transform:translateY(10px) scale(.8);opacity:0}50%{opacity:1}100%{transform:translateY(-24px) scale(1);opacity:0}}
  `;
  document.head.appendChild(st);
})();

/* DnD (compact) */
function wizAttachDnd(container, itemSel){
  if(!container || container._dndWiz) return; container._dndWiz = true;
  let dragEl=null;
  container.addEventListener('dragstart', e=>{
    const it = e.target.closest(itemSel); if(!it) return;
    dragEl=it; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain','');}catch(_){}
    setTimeout(()=> it.style.opacity='.35',0);
  });
  container.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; dragEl=null; } });
  container.addEventListener('dragover', e=>{
    if(!dragEl) return; e.preventDefault();
    const after = Array.from(container.querySelectorAll(itemSel)).filter(x=>x!==dragEl)
      .reduce((c,ch)=>{const b=ch.getBoundingClientRect(); const off=e.clientY-b.top-b.height/2; return off<0 && off>c.o?{o:off,el:ch}:c;},{o:-1e9}).el;
    if(!after) container.appendChild(dragEl); else container.insertBefore(dragEl, after);
  });
}

/* wizard state */
let W = { skills:[], addSkillsToRail:true, edu:[], exp:[], expDraft:{dates:'',role:'',org:'',desc:''}, bio:'' };

/* ---------- Public API ---------- */
export function mountWelcome() {
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
  wrap.querySelector('#startWizard').addEventListener('click', () => { wrap.style.display = 'none'; mountWizard(); openWizard(); });
  wrap.querySelector('#startBlank').addEventListener('click', () => { wrap.remove(); document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex'); });
}

export function mountWizard() {
  if (document.getElementById('wizard')) return;
  const modal = document.createElement('div');
  modal.id = 'wizard'; modal.className = 'modal'; modal.setAttribute('data-overlay','');
  Object.assign(modal.style, { position:'fixed', inset:'0', display:'none', placeItems:'center', background:'rgba(0,0,0,.55)', zIndex:'21000' });
  modal.innerHTML = `
    <div class="wiz">
      <div class="wiz-left"><div class="step-list" id="stepList" style="display:grid;gap:8px"></div></div>
      <div class="wiz-right">
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

/* ---------- internals ---------- */
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

/* Render step bodies (layout/theme identical to your last good version) */
function renderStep(){
  const body = document.getElementById('wizBody');
  const s = STEPS[stepIdx].k; markSteps();
  document.getElementById('wizStartOver').style.display = (backCount>=2 ? 'inline-flex' : 'none');

  if (s === 'layout'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose your layout</div>
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

  if (s === 'theme'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Choose a color theme</div>
      <div class="k-row" style="margin-top:12px"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" id="wizPaper">Paper</button><button class="mbtn" id="wizGlass">Glass</button></div>`;
    body.querySelector('#wizDark').onclick = e=>{ e.currentTarget.classList.toggle('on'); S.dark = e.currentTarget.classList.contains('on'); document.body.setAttribute('data-dark', S.dark ? '1' : '0'); };
    body.querySelector('#wizPaper').onclick = ()=>{ S.mat='paper'; document.body.setAttribute('data-mat','paper'); };
    body.querySelector('#wizGlass').onclick = ()=>{ S.mat='glass'; document.body.setAttribute('data-mat','glass'); };
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
    ['nm','ph','em','ad','ln'].forEach(id=> body.querySelector('#'+id).oninput = ()=>{ S.contact = { name: body.querySelector('#nm').value, phone: body.querySelector('#ph').value, email: body.querySelector('#em').value, address: body.querySelector('#ad').value, linkedin: body.querySelector('#ln').value }; applyContact?.(); }));
  }

  if (s === 'skills'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Add your skills</div>
      <div class="wsub" style="opacity:.8;margin-bottom:10px;text-align:left">Use ★ or a slider; you can fine-tune on the canvas later.</div>
      <div id="wizSkills" style="display:grid;gap:8px"></div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="mbtn" id="addStar">+ ★</button><button class="mbtn" id="addSlider">+ <i class="fa-solid fa-sliders"></i></button></div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px"><span>Add to sidebar</span><div id="toRail" class="switch ${W.addSkillsToRail?'on':''}"></div></div>`;
    const list = body.querySelector('#wizSkills');

    const rowStar = (label='Skill', active=3)=>{
      const r = document.createElement('div'); r.className='wiz-card'; r.setAttribute('draggable','true'); r.dataset.t='star';
      r.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center">
        <input type="text" class="wiz-pill" value="${label}">
        <span class="stars">${[1,2,3,4,5].map(i=>`<svg class="star ${i<=active?'active':''}" data-i="${i}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`).join('')}</span></div>`;
      r.querySelectorAll('.star').forEach(s=> s.onclick = e=>{ const n=+e.currentTarget.dataset.i; r.querySelectorAll('.star').forEach((el,i)=> el.classList.toggle('active', i<n)); });
      return r;
    };
    const rowSlider = (label='Skill', val=60)=>{
      const r = document.createElement('div'); r.className='wiz-card'; r.setAttribute('draggable','true'); r.dataset.t='slider';
      r.innerHTML = `<div style="display:grid;grid-template-columns:1fr 140px;gap:10px;align-items:center">
        <input type="text" class="wiz-pill" value="${label}">
        <input type="range" min="0" max="100" value="${val}">
      </div>`;
      return r;
    };

    body.querySelector('#addStar').onclick   = ()=> list.appendChild(rowStar());
    body.querySelector('#addSlider').onclick = ()=> list.appendChild(rowSlider());
    wizAttachDnd(list, '.wiz-card');
    W.skills.forEach(it=> list.appendChild(it.type==='star' ? rowStar(it.label,it.stars) : rowSlider(it.label,it.value)));
    body.querySelector('#toRail').onclick = (e)=>{ e.currentTarget.classList.toggle('on'); W.addSkillsToRail = e.currentTarget.classList.contains('on'); };
  }

  if (s === 'education'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Education</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">Add items now or later from the canvas.</div>
      <div id="wizEdu" class="wiz-grid2"></div>
      <div style="display:flex;gap:8px;margin-top:6px"><button class="mbtn" id="addCourse">+ Add course</button><button class="mbtn" id="addDegree">+ Add degree</button></div>`;
    const list = body.querySelector('#wizEdu');
    const iconCls = k => k==='degree' ? 'fa-graduation-cap':'fa-scroll';
    const mk = (kind='course', data={})=>{
      const card = document.createElement('div'); card.className='wiz-card'; card.setAttribute('draggable','true'); card.dataset.k = kind;
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px"><i class="fa-solid ${iconCls(kind)}"></i><span class="wiz-badge" contenteditable>${data.dates||'2018–2022'}</span><button class="mbtn" title="Remove" style="margin-left:auto">×</button></div>
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

  if (s === 'experience'){
    body.innerHTML = `
      <div class="wtitle" style="font-weight:900;font-size:18px;margin-bottom:8px">Experience</div>
      <div class="wsub" style="opacity:.8;margin-bottom:8px">You can keep adding/editing from the canvas.</div>
      <div id="wizExpWrap"></div>
      <div style="display:flex;gap:8px;margin-top:6px"><button class="mbtn" id="addExpNow">+ Add another</button></div>`;
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
      wrap.innerHTML = `<div class="sparkles">
        <div class="spark" style="left:20%"><i class="fa-solid fa-plus"></i> ✨</div>
        <div class="spark" style="left:50%;animation-delay:.15s">✨ <i class="fa-solid fa-plus"></i> ✨</div>
        <div class="spark" style="left:78%;animation-delay:.3s"><i class="fa-solid fa-plus"></i> ✨</div>
        <div style="position:relative;z-index:2;font-weight:900">Added</div>
      </div>`;
      setTimeout(()=>{ wrap.innerHTML=''; wrap.appendChild(mkEditor({})); }, 900);
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
      renderExp([d]);  // add immediately to canvas
      showAdded();
    };
  }

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
      W.skills = Array.from(list.querySelectorAll('.wiz-card')).map(r=>{
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
      W.edu = Array.from(list.querySelectorAll('.wiz-card')).map(c=>{
        const badge = c.querySelector('.wiz-badge')?.textContent.trim() || '';
        return { kind: c.dataset.k, title: c.querySelectorAll('input')[0].value.trim(), dates: badge, academy: c.querySelectorAll('input')[1].value.trim() };
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
function mock(layoutKey){
  const kind = layoutKey.split('-')[1];
  const base = `<div class="wz-mock" data-layout="${layoutKey}" style="width:450px;height:158px;position:relative;cursor:pointer;margin:8px 0;border-radius:18px;transition:transform .15s ease, box-shadow .15s ease, outline .15s ease">
    <div class="wz-card" style="position:absolute; inset:0; border-radius:16px; padding:12px;background:linear-gradient(135deg,#5d71b4,#2e3c79);box-shadow:inset 0 1px 0 #ffffff12, 0 10px 28px rgba(0,0,0,.38)"></div>
  </div>`;
  const el = document.createElement('div'); el.innerHTML = base.trim();
  return el.firstChild.outerHTML;
}
