// Fate Keepers (A1-A5) — §8 (Passo 5). Desbloqueiam por Ascension:
//   A1 auto-Gold Stats + auto-Convergir · A2 auto-progressão + abre dificuldades ·
//   A3 motor de Éclats (drip + offline 24h) · A4 +cap de mobs · A5 Transcendência (stub).
// As automações são TOGGLES (default off): o Fate Keeper LIBERA, o jogador LIGA.

import { buyStatMax } from './stats.js';
import { canConverge, doConverge } from './convergence.js';
import { enterSubarea } from './combat.js';

// Fate Keeper N desbloqueado?
export const fateKeeperUnlocked = (state, n) => state.ascensions >= n;

// Tick de automação (roda no loop online e na simulação offline)
export function automationTick(state) {
  // A1 — auto-Gold Stats + auto-Convergir
  if (state.ascensions >= 1) {
    if (state.auto.stats) for (const key of Object.keys(state.stats)) buyStatMax(state, key);
    if (state.auto.converge && canConverge(state)) doConverge(state);
  }
  // A2 — auto-progressão (vai p/ a sub-área mais funda desbloqueada)
  if (state.ascensions >= 2 && state.auto.progress) {
    if (state.subarea < state.unlockedSubarea) enterSubarea(state, state.unlockedSubarea);
  }
  // A4 (+cap de mobs) é aplicado no spawn da onda (combat.js); A3/A5 são flags/drip.
}
