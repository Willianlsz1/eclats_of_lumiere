// Bootstrap do Éclats of Lumière — liga núcleo, combate e UI.

import '../style.css';
import { state } from './core/state.js';
import { load, setupAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { playerHpMax } from './game/stats.js';
import { setupUI, renderUI } from './ui/ui.js';

// Carrega o save (se houver) e reconstrói o runtime
load();
state.player.hp = playerHpMax(state);
resetPack(state);

setupUI(state);
setupAutosave();

// Tick de simulação (100ms fixo) + render por tick
startLoop((dt) => {
  combatTick(state, dt);
  renderUI(state);
});

renderUI(state);
