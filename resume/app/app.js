// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage } from './state.js';
import { mountEditor } from '../editor/editor.js';
import { mountWelcome } from '../wizard/wizard.js';
import { ensureCanvas } from '../layouts/layouts.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

// Initial theme + state
hydrateFromStorage();
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
