// Progresso offline — GDD §15.
// O tick de combate é o motor real também offline: simulamos o tempo ausente
// com o mesmo combatTick (mesmo dt), então morte/recuo acontecem como online
// e a cascata estabiliza no ponto sustentável. O jogador NUNCA abre morto.

import { TICK_SECONDS, OFFLINE } from '../data/constants.js';
import { combatTick, resetPack } from './combat.js';
import { automationTick } from './fatekeepers.js';
import { playerHpMax } from './stats.js';
import { memoireOfflineMult } from './memoires.js';

// Simula `seconds` de ausência. Retorna o resumo dos ganhos (ou null se curto).
export function simulateOffline(state, seconds) {
  // #6 des Profondeurs amplia o tempo offline efetivo (capado pelo teto de engenharia)
  const simSeconds = Math.min(Math.max(0, seconds) * memoireOfflineMult(state), OFFLINE.maxSeconds);
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
    automationTick(state, TICK_SECONDS); // §8: automações + Eco do Seeker rodam offline também
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
