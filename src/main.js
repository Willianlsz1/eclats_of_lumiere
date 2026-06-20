// Bootstrap do Éclats v0 — liga núcleo, combate e UI.
import '../style.css';
import { state } from './core/state.js';
import { load, save, setupAutosave, resetSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick } from './game/combat.js';
import { playerHpMax } from './game/player.js';
import { setupUI, renderUI } from './ui/shell.js';

load(); // aplica save (se houver e schema bater)
state.player.hp = playerHpMax(state);

setupUI(state);
setupAutosave();

startLoop((dt) => {
  combatTick(state, dt);
  renderUI(state);
});
renderUI(state);

// Utilidades de teste no console.
window.eclats = { state, save, reset: resetSave };
