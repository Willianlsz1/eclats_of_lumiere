// Bootstrap da CASCA VISUAL — Éclats of Lumière (reset "folha em branco" 2026-06-18).
// O motor de jogo (loop/save/combate/economia/etc.) foi removido. Aqui só montamos
// a UI uma vez sobre um estado de amostra estático. Sem tick, sem combate, sem save.

import '../style.css';
import { state } from './core/state.js';
import { SAVE_KEY } from './data/constants.js';
import { setupUI, renderUI } from './ui/ui.js';

// Wipe do save: sem persistência nesta fase, limpa qualquer save antigo do navegador.
try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }

setupUI(state);
renderUI(state);
