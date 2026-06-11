// Progresso offline — GDD §15.
// O tick de combate é o motor real também offline: simulamos o tempo ausente
// com o mesmo combatTick (mesmo dt), então morte/recuo acontecem como online
// e a cascata estabiliza no ponto sustentável. O jogador NUNCA abre morto.

import { TICK_SECONDS, OFFLINE } from '../data/constants.js';
import { combatTick, resetPack } from './combat.js';
import { automationTick } from './fatekeepers.js';
import { playerHpMax } from './stats.js';

// Simula `seconds` de ausência. Retorna o resumo dos ganhos (ou null se curto).
export function simulateOffline(state, seconds) {
  const simSeconds = Math.min(Math.max(0, seconds), OFFLINE.maxSeconds);
  if (simSeconds < OFFLINE.minSecondsToReport) return null;

  const before = {
    lumens: state.lumens,
    xp: state.xpTotal,
    vestiges: state.vestiges,
    kills: state.killsTotal,
    subarea: state.subarea,
  };

  const ticks = Math.floor(simSeconds / TICK_SECONDS);
  for (let i = 0; i < ticks; i++) {
    combatTick(state, TICK_SECONDS);
    automationTick(state); // §8: automações dos Fate Keepers também rodam offline
  }

  // Garantia do §15: nunca abrir morto — completa o respawn pendente
  if (state.player.dead) {
    state.player.dead = false;
    state.player.respawnTimer = 0;
    state.player.hp = playerHpMax(state);
    resetPack(state);
  }

  return {
    seconds: simSeconds,
    lumens: state.lumens - before.lumens,
    xp: state.xpTotal - before.xp,
    vestiges: state.vestiges - before.vestiges,
    kills: state.killsTotal - before.kills,
    retreated: state.subarea < before.subarea, // recuou até o sustentável?
  };
}
