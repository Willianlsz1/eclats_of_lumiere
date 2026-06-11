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

  // ===== DIAGNÓSTICO TEMPORÁRIO (tela preta no mobile) =====
  // Marca o palco e imprime geometria + carregamento de assets no rodapé.
  setTimeout(() => {
    const stage = document.getElementById('stage');
    stage.style.outline = '4px solid magenta';
    const view = document.getElementById('view-combat');
    if (view) view.style.outline = '3px dashed cyan';
    const r = stage.getBoundingClientRect();
    const cs = getComputedStyle(stage);
    const bd = document.getElementById('cb-backdrop');
    const bdImg = bd ? getComputedStyle(bd).backgroundImage : '(sem cb-backdrop)';
    const img = document.querySelector('#view-combat .cb-enemy img');
    const dbg = document.createElement('div');
    dbg.style.cssText = 'position:fixed;left:0;bottom:0;right:0;z-index:99998;background:#000d;' +
      'color:#7CFC7C;font:11px/1.35 ui-monospace,monospace;padding:8px;white-space:pre-wrap;';
    dbg.textContent = [
      `win ${innerWidth}x${innerHeight} dpr ${window.devicePixelRatio}`,
      `stage transform: ${cs.transform}`,
      `stage VISUAL rect: x${Math.round(r.x)} y${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      `coins ${document.querySelectorAll('.coin').length} | nav ${document.querySelectorAll('.navbtn').length} | enemies ${document.querySelectorAll('.cb-enemy').length} | combat.active ${!!document.querySelector('#view-combat.active')}`,
      `backdrop bg: ${String(bdImg).slice(0, 60)}`,
      `enemy img: ${img ? img.getAttribute('src') : 'nenhuma'} | naturalW ${img ? img.naturalWidth : '-'}`,
    ].join('\n');
    document.body.appendChild(dbg);
  }, 1800);
} catch (e) {
  if (window.__eclatsShowErr) window.__eclatsShowErr('Erro no bootstrap', (e && (e.stack || e.message)) || String(e));
  throw e;
}
