// Bootstrap do Éclats of Lumière — CP-1 (núcleo: estado + loop + save).
// O combate/economia/etc. ainda são stubs (próximos CPs); aqui o jogo só "vive":
// carrega o save, monta a UI, liga o autosave e roda o loop (tick → render).

import '../style.css';
import { state } from './core/state.js';
import { load, setupAutosave, resetSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { playerHpMax } from './game/stats.js';
import { setupUI, renderUI } from './ui/ui.js';

// Carrega o save (se houver) e reconstrói o runtime.
load();
state.player.hp = playerHpMax(state); // HP cheio no boot
state.player.dead = false;
resetPack(state);                     // popula a cena (mobs estáticos até o CP-3)

setupUI(state);
setupAutosave();

// Tick fixo (100ms) — combatTick é stub até o CP-3; já fica wirado.
startLoop((dt) => {
  combatTick(state, dt);
  renderUI(state);
});

renderUI(state);

// Atalho de teste no console: eclatsReset() apaga o save e recomeça.
window.eclatsReset = resetSave;
