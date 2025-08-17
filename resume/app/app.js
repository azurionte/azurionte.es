// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage } from './state.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome } from '../wizard/wizard.js';
import { ensureCanvas } from '../layouts/layouts.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

// Initial theme + state
// By default a page refresh starts with a clean state. To restore persisted state explicitly
// add ?resume_restore=1 to the URL or set sessionStorage['resume:restore']=1 from the console.
const params = new URLSearchParams(window.location.search);
const doRestore = params.get('resume_restore') === '1' || sessionStorage.getItem('resume:restore') === '1';
if (doRestore) hydrateFromStorage();
document.body.setAttribute('data-theme', S.theme);
document.body.setAttribute('data-dark', S.dark ? '1' : '0');
document.body.setAttribute('data-mat', S.material);

// Mount the editor (top bar + empty page)
mountEditor({
  onThemePick: setTheme,
  onDarkToggle: setDark,
  onMaterialPick: setMaterial,
  onCustomGradient: setCustomGradient
});

// Make sure a clean page exists
ensureCanvas();

// Show welcome/wizard
mountWelcome();
