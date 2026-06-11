// Bootstrap do Éclats of Lumière — liga núcleo, combate e UI.

import '../style.css';
import { state } from './core/state.js';
import { load, setupAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { playerHpMax } from './game/stats.js';
import { simulateOffline } from './game/offline.js';
import { setupUI, renderUI, showOfflineSummary } from './ui/ui.js';

// Sinaliza ao diagnóstico (index.html) que o módulo executou; em caso de
// exceção no boot, mostra o erro na tela em vez de ficar preto. (temporário)
try {
  window.__ECLATS_BOOTED__ = true;

  // Carrega o save (se houver) e reconstrói o runtime
  const snapshot = load();
  state.player.hp = playerHpMax(state);
  resetPack(state);

  setupUI(state);

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
    renderUI(state);
  });

  renderUI(state);
} catch (e) {
  if (window.__eclatsShowErr) window.__eclatsShowErr('Erro no bootstrap', (e && (e.stack || e.message)) || String(e));
  throw e;
}
