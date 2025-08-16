// Welcome + wizard (all its own styles are inline here)
import { S, save } from '../app/state.js';
import { morphTo, getHeaderNode, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

export function mountWelcome(){
  const root = document.getElementById('overlay-root');
  root.innerHTML = `
    <div data-overlay id="welcome" style="position:fixed;inset:0;display:grid;place-items:center;background:#0007;z-index:20000">
      <div style="width:min(880px,94vw);min-height:340px;background:#0f1420;border:1px solid #1f2540;border-radius:18px;padding:32px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);display:grid;justify-items:center;gap:16px">
        <div style="font-weight:900;font-size:22px;text-align:center">Welcome to the Easy Resume Builder</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end;justify-items:center">
          <div style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
            <button class="mbtn" id="startWizard" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Wizard</button>
            <div style="opacity:.8">Guided step-by-step set-up.</div>
          </div>
          <div style="display:grid;justify-items:center;gap:8px;width:300px;height:70px">
            <button class="mbtn" id="startBlank">Manual mode</button>
            <div style="opacity:.8">Start from scratch, arrange freely.</div>
          </div>
        </div>
      </div>
    </div>
    <div data-overlay id="wizard" style="position:fixed;inset:0;display:none;place-items:center;background:#0009;z-index:21000">
      <div class="wiz" style="width:min(1040px,96vw);display:grid;grid-template-columns:260px 1fr;background:#0f1420;border:1px solid #1f2540;border-radius:18px;color:#e6e8ef;box-shadow:0 40px 140px rgba(0,0,0,.6);overflow:hidden">
        <div style="background:#0c111f;border-right:1px solid #1b2340;padding:16px"><div id="stepList" style="display:grid;gap:8px"></div></div>
        <div style="padding:20px 22px;display:flex;flex-direction:column;min-height:480px">
          <div id="wizBody" style="flex:1"></div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="mbtn" id="wizStartOver" style="margin-right:auto;display:none">Start over</button>
            <button class="mbtn" id="wizBack">Back</button>
            <button class="mbtn" id="wizNext" style="background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111;border:none">Next</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const welcome = document.getElementById('welcome');
  const wizard  = document.getElementById('wizard');
  document.getElementById('startWizard').onclick = () => { welcome.style.display='none'; wizard.style.display='grid'; buildWizard(); };
  document.getElementById('startBlank').onclick = () => { welcome.remove(); };
}

/* ---------------- wizard logic ---------------- */
const STEPS = [
  {k:'layout',label:'Layout'},
  {k:'theme',label:'Theme'},
  {k:'contact',label:'Profile data'},
  {k:'skills',label:'Skills'},
  {k:'education',label:'Education'},
  {k:'experience',label:'Experience'},
  {k:'bio',label:'Bio'},
  {k:'done',label:'Done'}
];
let stepIdx=0, backCount=0;
let stepList, wizBody, wizBack, wizNext, wizStartOver;

function buildWizard(){
  stepList = document.getElementById('stepList');
  wizBody  = document.getElementById('wizBody');
  wizBack  = document.getElementById('wizBack');
  wizNext  = document.getElementById('wizNext');
  wizStartOver = document.getElementById('wizStartOver');

  stepList.innerHTML=''; STEPS.forEach((s,i)=> stepList.insertAdjacentHTML('beforeend', `<div class="step" data-i="${i}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;color:#c9d1ff80"><span style="width:8px;height:8px;border-radius:50%;background:#2e3b66"></span><span>${s.label}</span></div>`));
  wizBack.onclick=()=>{ if(stepIdx>0){ stepIdx--; backCount++; renderStep(); } };
  wizStartOver.onclick=()=>{ Object.assign(S,{contact:{name:'',phone:'',email:'',address:'',linkedin:''},skills:[],edu:[],exp:[],bio:''}); stepIdx=0; backCount=0; renderStep(); };
  wizNext.onclick=advance;
  renderStep();
}

function markSteps(){ [...stepList.children].forEach((el,i)=>{ el.style.color = (i===stepIdx?'#e8ecff': i<stepIdx ? '#e8ecff' : '#c9d1ff80'); el.firstChild.style.background = i<=stepIdx ? '#26d07c' : '#2e3b66'; }); }

function renderStep(){
  markSteps(); wizStartOver.style.display = (backCount>=2?'inline-flex':'none');
  const s = STEPS[stepIdx].k;

  if(s==='layout'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Choose your layout</div>
      <div style="display:grid;gap:14px">
        ${['header-side','header-fancy','header-top'].map(k => `<div class="mock" data-layout="${k}" style="position:relative;min-height:130px;border:1px solid #1f2540;border-radius:14px;padding:10px;background:#0c1324">${layoutMini(k)}</div>`).join('')}
      </div>
      <div class="k-row" style="margin-top:12px"><button class="mbtn" id="wizAddPhoto"><i class="fa-solid fa-camera"></i> Upload photo</button></div>`;
    wizBody.querySelectorAll('[data-layout]').forEach(m => m.onclick=()=>{ morphTo(m.dataset.layout); });
    wizBody.querySelector('#wizAddPhoto').onclick=()=>{ getHeaderNode()?.querySelector('[data-avatar] input')?.click(); };
  }

  if(s==='theme'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Choose a color theme</div>
      <div class="theme-row">${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack'].map(k=>`<div class="swatch" data-k="${k}"></div>`).join('')}</div>
      <div class="k-row"><span>Dark mode</span><div id="wizDark" class="switch ${S.dark?'on':''}"></div></div>
      <div class="k-row"><span>Material</span><button class="mbtn" data-mat="paper">Paper</button><button class="mbtn" data-mat="glass">Glass</button></div>
      <div class="k-row"><span>Custom gradient</span><input type="color" id="w1" value="#8b5cf6"><input type="color" id="w2" value="#d946ef"><button class="mbtn" id="wApply">Apply</button></div>`;
    wizBody.querySelectorAll('.swatch').forEach(s => s.onclick=()=>{ document.body.setAttribute('data-theme', s.dataset.k); S.theme=s.dataset.k; save(); });
    wizBody.querySelector('#wizDark').onclick=e=>{ e.currentTarget.classList.toggle('on'); const on=e.currentTarget.classList.contains('on'); document.body.setAttribute('data-dark',on?'1':'0'); S.dark=on; save(); };
    wizBody.querySelectorAll('[data-mat]').forEach(b=> b.onclick=()=>{ document.body.setAttribute('data-mat', b.dataset.mat); S.material=b.dataset.mat; save(); });
    wizBody.querySelector('#wApply').onclick=()=>{ const a=wizBody.querySelector('#w1').value, b=wizBody.querySelector('#w2').value; document.documentElement.style.setProperty('--accent',a); document.documentElement.style.setProperty('--accent2',b); };
  }

  if(s==='contact'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Profile data</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input class="wipt" id="nm" placeholder="Full name" value="${S.contact.name||''}">
        <input class="wipt" id="ph" placeholder="Phone" value="${S.contact.phone||''}">
        <input class="wipt" id="em" placeholder="Email" value="${S.contact.email||''}">
        <input class="wipt" id="ad" placeholder="City, Country" value="${S.contact.address||''}">
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center"><span style="opacity:.7">linkedin.com/in/</span><input class="wipt" id="ln" placeholder="username" style="flex:1" value="${S.contact.linkedin||''}"></div>
      </div>`;
    ['nm','ph','em','ad','ln'].forEach(id => wizBody.querySelector('#'+id).oninput = () => {
      S.contact = { name: wizBody.querySelector('#nm').value, phone: wizBody.querySelector('#ph').value,
        email: wizBody.querySelector('#em').value, address: wizBody.querySelector('#ad').value, linkedin: wizBody.querySelector('#ln').value };
      const h = getHeaderNode(); if(h) applyContact(h); save();
    });
  }

  if(s==='skills'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Add your skills</div>
      <div id="ws"></div>
      <div class="k-row"><button class="mbtn" id="addStar">+ ★</button><button class="mbtn" id="addSlider">+ <i class="fa-solid fa-sliders"></i></button></div>
      ${(S.layout==='side')?'<div class="k-row"><label><input type="checkbox" id="inSide"> Display in the sidebar</label></div>':''}`;
    const wrap = wizBody.querySelector('#ws');
    const paint = () => { wrap.innerHTML=''; S.skills.forEach((it,i)=> wrap.appendChild(row(it,i))); };
    const row = (it,idx) => {
      const d=document.createElement('div'); d.style.cssText='display:grid;grid-template-columns:1fr 180px;gap:10px;align-items:center;margin:6px 0';
      d.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span class="handle" draggable="true" title="Drag"></span><button class="mbtn" data-rm style="padding:6px 10px">×</button><span contenteditable class="ws-label">${it.label||'Skill'}</span></div><div class="right"></div>`;
      d.querySelector('[data-rm]').onclick=()=>{ S.skills.splice(idx,1); paint(); };
      d.querySelector('.ws-label').oninput=e=>{ it.label=e.target.textContent||''; save(); };
      const R=d.querySelector('.right');
      if(it.type==='star'){
        const h=document.createElement('div'); h.style.display='inline-flex'; h.style.gap='6px';
        for(let i=1;i<=5;i++){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.style.width='18px'; s.style.height='18px'; if(i<=(+it.value||0)) s.style.fill='#f59e0b'; else s.style.fill='#5f6b95'; s.innerHTML='<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>'; s.onclick=()=>{ it.value=i; paint(); save(); }; h.appendChild(s); }
        R.appendChild(h);
      }else{
        const r=document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=+it.value||50;
        r.oninput=()=>{ it.value=r.value; save(); }; R.appendChild(r);
      }
      d.querySelector('.handle').addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',idx));
      d.addEventListener('dragover',ev=>{ ev.preventDefault(); if(!wrap.querySelector('.ph')){ const ph=document.createElement('div'); ph.className='ph'; ph.style.cssText='border:2px dashed #3a4a7a;border-radius:12px;height:46px;opacity:.8'; wrap.insertBefore(ph,d.nextSibling); }});
      d.addEventListener('dragleave',()=>{ const ph=wrap.querySelector('.ph'); if(ph) ph.remove(); });
      d.addEventListener('drop',ev=>{ ev.preventDefault(); const from=+ev.dataTransfer.getData('text/plain'); const to=idx; const [m]=S.skills.splice(from,1); S.skills.splice(to,0,m); paint(); save();});
      return d;
    };
    paint();
    wizBody.querySelector('#addStar').onclick=()=>{ S.skills.push({type:'star',label:'Skill',value:3}); paint(); save(); };
    wizBody.querySelector('#addSlider').onclick=()=>{ S.skills.push({type:'slider',label:'Skill',value:50}); paint(); save(); };
    if (wizBody.querySelector('#inSide')){ const cb=wizBody.querySelector('#inSide'); cb.checked=S.skillsInSidebar; cb.onchange=()=>{ S.skillsInSidebar=cb.checked; save(); }; }
  }

  if(s==='education'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Education</div>
      <div id="eduWrap" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></div>
      <div class="k-row"><button class="mbtn" id="addCourse">+ Add course</button><button class="mbtn" id="addDegree">+ Add degree</button></div>`;
    const wr = wizBody.querySelector('#eduWrap');
    const paint = () => { wr.innerHTML=''; S.edu.forEach((it,i)=>wr.appendChild(card(it,i))); };
    const card = (it,idx) => {
      const c=document.createElement('div'); c.className='sec'; c.style.padding='10px';
      const icon = it.kind==='degree' ? '<i class="fa-solid fa-graduation-cap" style="color:var(--accent)"></i>' : '<i class="fa-solid fa-scroll" style="color:var(--accent2)"></i>';
      c.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><span class="handle" draggable="true"></span><button class="mbtn" data-rm style="padding:6px 10px">×</button><div style="font-weight:700">${icon} <span contenteditable class="ws-label">${it.title||'Title'}</span></div></div>
      <div style="margin-top:6px"><span class="badge" contenteditable style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(it.year||'2018–2022').slice(0,9)}</span></div>
      <div style="margin-top:6px"><span contenteditable class="ws-label">${it.academy||'Academy'}</span></div>`;
      c.querySelector('[data-rm]').onclick=()=>{ S.edu.splice(idx,1); paint(); save(); };
      c.querySelectorAll('[contenteditable]').forEach((el,ix)=> el.oninput=()=>{ if(ix===0) it.title=el.textContent; else if(ix===1) it.year=el.textContent.slice(0,9); else it.academy=el.textContent; save(); });
      c.querySelector('.handle').addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',idx));
      c.addEventListener('dragover',ev=>{ ev.preventDefault(); if(!wr.querySelector('.ph')){ const ph=document.createElement('div'); ph.className='ph'; ph.style.height=c.offsetHeight+'px'; ph.style.border='2px dashed #3a4a7a'; ph.style.borderRadius='12px'; wr.insertBefore(ph,c.nextSibling);} });
      c.addEventListener('dragleave',()=>wr.querySelector('.ph')?.remove());
      c.addEventListener('drop',ev=>{ ev.preventDefault(); const from=+ev.dataTransfer.getData('text/plain'); const to=idx; const [m]=S.edu.splice(from,1); S.edu.splice(to,0,m); paint(); save(); });
      return c;
    };
    paint();
    wizBody.querySelector('#addCourse').onclick=()=>{ S.edu.push({kind:'course',title:'',year:'',academy:''}); paint(); save(); };
    wizBody.querySelector('#addDegree').onclick=()=>{ S.edu.push({kind:'degree',title:'',year:'',academy:''}); paint(); save(); };
  }

  if(s==='experience'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Experience</div>
      <div id="xWrap"></div>
      <div class="k-row"><button class="mbtn" id="addRole">+ Add another</button></div>`;
    const wr = wizBody.querySelector('#xWrap');
    const paint = () => { wr.innerHTML=''; S.exp.forEach(it=>wr.appendChild(card(it))); };
    const card = (it) => {
      const c=document.createElement('div'); c.className='sec'; c.style.background='color-mix(in srgb, var(--accent) 12%, #fff)'; c.style.margin='10px 0';
      c.innerHTML=`<div style="display:flex;gap:8px;align-items:center"><span class="badge" contenteditable style="display:inline-block;padding:6px 10px;border-radius:999px;background:color-mix(in srgb, var(--accent) 16%, #fff);border:1px solid color-mix(in srgb, var(--accent) 40%, #0000)">${(it.dates||'Jan 2022').slice(0,16)}</span><span contenteditable style="font-weight:800">${it.role||'Job title'}</span></div>
        <div style="font-weight:700;color:#374151;margin-top:4px" contenteditable>${it.org||'@Company'}</div>
        <div style="margin-top:6px" contenteditable>${it.desc||'Describe impact, scale and results.'}</div>`;
      const e=c.querySelectorAll('[contenteditable]');
      e[0].oninput=ev=>{ it.dates=ev.target.textContent.slice(0,16); save(); };
      e[1].oninput=ev=>{ it.role=ev.target.textContent; save(); };
      e[2].oninput=ev=>{ it.org=ev.target.textContent; save(); };
      e[3] && (e[3].oninput=ev=>{ it.desc=ev.target.textContent; save(); });
      return c;
    };
    paint();
    wizBody.querySelector('#addRole').onclick=(ev)=>{ S.exp.push({dates:'',role:'',org:'',desc:''}); paint(); save();
      const r=ev.currentTarget.getBoundingClientRect(); const t=document.createElement('div'); t.textContent='Experience added'; t.style.cssText='position:absolute;padding:6px 10px;border-radius:999px;background:#16a34a;color:#fff;font-weight:700;box-shadow:0 10px 24px rgba(0,0,0,.35);opacity:0;transform:translateY(8px)'; document.body.appendChild(t); t.style.left=(r.left+window.scrollX)+'px'; t.style.top=(r.top+window.scrollY-40)+'px'; requestAnimationFrame(()=>{ t.style.transition='all .9s'; t.style.opacity='1'; t.style.transform='translateY(-6px)'; }); setTimeout(()=>t.remove(),900);
    };
  }

  if(s==='bio'){
    wizBody.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">Profile (Bio)</div>
      <textarea id="bio" class="wipt" rows="6" placeholder="Short professional summary...">${S.bio||''}</textarea>`;
    wizBody.querySelector('#bio').oninput = e => { S.bio = e.target.value; save(); };
  }

  if(s==='done'){
    wizBody.innerHTML = `<div style="text-align:center;font-size:18px;font-weight:800">All set ✨</div><div style="text-align:center;opacity:.85">You can keep editing on the canvas.</div>`;
    document.getElementById('wizNext').textContent='Finish';
  }else{
    document.getElementById('wizNext').textContent='Next';
  }
}

function advance(){
  const cur = STEPS[stepIdx].k;
  if (cur==='skills') renderSkills();
  if (cur==='education') renderEdu();
  if (cur==='experience') renderExp();
  if (cur==='bio') renderBio();
  if (cur==='done'){ document.getElementById('wizard').style.display='none'; document.getElementById('welcome')?.remove(); return; }
  if (stepIdx<STEPS.length-1){ stepIdx++; renderStep(); }
}

function layoutMini(k){
  const kind=k.split('-')[1];
  return (kind==='side')
    ? `<div style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;left:30px;top:30px;width:42px;height:42px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px"><div style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div><div style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div></div>`
    : kind==='fancy'
    ? `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;left:50%;transform:translateX(-50%);top:58px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:24px;top:120px;display:grid;gap:8px"><div style="height:8px;border-radius:999px;background:#2b375f;width:70%"></div><div style="height:8px;border-radius:999px;background:#2b375f;width:48%"></div></div>`
    : `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#5b6fb7,#2f3d7a)"></div>
       <div style="position:absolute;right:31px;top:22px;width:56px;height:56px;border-radius:50%;background:#cfd6ff;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:120px;top:28px;display:grid;gap:8px"><div style="height:8px;border-radius:999px;background:#2b375f;width:60%"></div><div style="height:8px;border-radius:999px;background:#2b375f;width:40%"></div></div>`;
}
