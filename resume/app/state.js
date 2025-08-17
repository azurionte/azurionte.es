// Central state + helpers
export const S = {
  theme: 'magentaPurple',
  dark: false,
  material: 'paper', // 'glass' | 'paper'
  layout: null,      // 'side' | 'fancy' | 'top'
  contact: { name:'', phone:'', email:'', address:'', linkedin:'' },
  avatar: null,      // dataURL (so it survives morph)
  skillsInSidebar: false,
  skills: [],        // {type:'star'|'slider', label, value}
  edu: [],           // {kind:'course'|'degree', title, year, academy}
  exp: [],           // {dates, role, org, desc}
  bio: ''            // free text
};

// Backwards-compatible alias: some modules expect `S.mat` while S uses `material`.
Object.defineProperty(S, 'mat', {
  enumerable: true,
  get() { return S.material; },
  set(v) { S.material = v; save(); document.body.setAttribute('data-mat', v); }
});

// --- persistence
const KEY='erb3-state';
export function save() {
  try {
    // Ensure the persisted object always contains `material` (and allow older callers to read `mat`).
    const copy = Object.assign({}, S, { material: S.material });
    localStorage.setItem(KEY, JSON.stringify(copy));
  } catch {}
}
export function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    // Support both legacy `mat` and current `material` keys.
    if (obj.mat && !obj.material) obj.material = obj.mat;
    Object.assign(S, obj);
  } catch {}
}

// --- theme setters (also reflect on body)
export function setTheme(k){
  S.theme = k; save();
  document.body.setAttribute('data-theme', k);
}
export function setCustomGradient(a,b){
  document.documentElement.style.setProperty('--accent', a);
  document.documentElement.style.setProperty('--accent2', b);
}
export function setDark(on){
  S.dark = on; save();
  document.body.setAttribute('data-dark', on ? '1' : '0');
}
export function setMaterial(m){
  S.material = m; save();
  document.body.setAttribute('data-mat', m);
}
