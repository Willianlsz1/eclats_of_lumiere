// Bootstrap do Éclats of Lumière — liga núcleo, combate e UI.

import '../style.css';
import { state } from './core/state.js';
import { load, save, setupAutosave, resetSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { automationTick } from './game/fatekeepers.js';
import { playerHpMax } from './game/stats.js';
import { simulateOffline } from './game/offline.js';
import { maybeApplyDevUnlock, showDevBadge, setupDevButton, setupDevPanel, setupResetButton } from './core/dev.js';
import { setupUI, renderUI, showOfflineSummary } from './ui/ui.js';
import { openAwakening, closeAwakening } from './ui/awakening.js';
import { openConvergence, closeConvergence } from './ui/convergence.js';
import { openOffline, closeOffline } from './ui/offline.js';

// Carrega o save (se houver) e reconstrói o runtime
const snapshot = load();
const devMode = maybeApplyDevUnlock(state); // modo de teste via ?dev (sem efeito sem o param)
state.player.hp = playerHpMax(state);
resetPack(state);

setupUI(state);
// Modo de teste: por URL (?dev) já vem ativo; senão, botão "DEV 🔓" para ativar
if (devMode) { showDevBadge(); setupDevPanel(state, () => { save(); renderUI(state); }); }
else setupDevButton(state, () => { save(); renderUI(state); }); // salva + refresca na hora
setupResetButton(resetSave); // botão RESET (apaga o save e recomeça)

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

// Cerimônias (overlays) — expostas para teste manual no console enquanto a
// lógica de disparo não existe. Ex.: eclatsCeremonies.awaken({ tier: 3 }).
// TODO(lógica): disparar Awakening ao vencer o Guardião da Sub 3 (checkDespertar)
// e Convergence no ciclo de dispersão; passar dados reais (ganhos calculados).
window.eclatsCeremonies = {
  awaken: openAwakening, closeAwaken: closeAwakening,
  converge: openConvergence, closeConverge: closeConvergence,
};

// Modal de entrada offline — exposto para teste manual. Ex.: eclatsOffline.open().
// TODO(lógica): disparar na inicialização com os ganhos offline reais (o
// showOfflineSummary atual permanece; a troca pelo modal é decisão futura).
window.eclatsOffline = { open: openOffline, close: closeOffline };
