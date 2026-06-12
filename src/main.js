// Bootstrap do Éclats of Lumière — liga núcleo, combate e UI.

import '../style.css';
import { state } from './core/state.js';
import { load, save, setupAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { automationTick } from './game/fatekeepers.js';
import { playerHpMax } from './game/stats.js';
import { simulateOffline } from './game/offline.js';
import { maybeApplyDevUnlock, showDevBadge, setupDevButton } from './core/dev.js';
import { setupUI, renderUI, showOfflineSummary } from './ui/ui.js';

// Carrega o save (se houver) e reconstrói o runtime
const snapshot = load();
const devMode = maybeApplyDevUnlock(state); // modo de teste via ?dev (sem efeito sem o param)
state.player.hp = playerHpMax(state);
resetPack(state);

setupUI(state);
// Modo de teste: por URL (?dev) já vem ativo; senão, botão "DEV 🔓" para ativar
if (devMode) showDevBadge();
else setupDevButton(state, () => { save(); renderUI(state); }); // salva + refresca na hora

// Progresso offline (§15): simula o tempo ausente antes do loop começar
if (snapshot?.savedAt) {
  const away = (Date.now() - snapshot.savedAt) / 1000;
  const summary = simulateOffline(state, away);
  if (summary) showOfflineSummary(summary);
}

setupAutosave();

// Tick de simulação (100ms fixo) + render por tick
startLoop((dt) => {
  combatTick(state, dt);
  automationTick(state, dt); // §8 Fate Keepers: auto-stats/converge/progress + Eco do Seeker (A3)
  renderUI(state);
});

renderUI(state);
