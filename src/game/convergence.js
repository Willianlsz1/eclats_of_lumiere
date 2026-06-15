// Convergence — redesign (calibrado Map 1, 14/jun). SEM reset de mapa. Gate por NÍVEL;
// dá +15% ADITIVO permanente (convMult vive em stats.js: dano/HP/XP/Lumens). É um
// ACELERADOR (~×2 ao fim do Map 1), não um motor. O botão RESETA só o nível da RUN
// (xpRun→0); o GEAR é MANTIDO (sem strand). NÃO reseta: mapa/posição, Lumens, Vestiges.

import { CONVERGENCE } from '../data/constants.js';
import { runLevel, playerHpMax } from './stats.js';
import { resetPack } from './combat.js';

// Nível-alvo da próxima Convergence (sobe a cada converge). 1ª = nível 40.
export function convGateLevel(convergences) {
  return Math.round(CONVERGENCE.gateLevelBase * CONVERGENCE.gateLevelGrowth ** convergences);
}

export function canConverge(state) {
  return runLevel(state) >= convGateLevel(state.convergences);
}

// Progresso rumo ao gate (0..1) — pra UI.
export function convergeProgress(state) {
  return Math.min(1, runLevel(state) / convGateLevel(state.convergences));
}

export function doConverge(state) {
  if (!canConverge(state)) return false;

  state.convergences += 1;
  // Reset (14/jun, ajuste Willian): o nível da run (xpRun) E os Lumens. O GEAR é
  // MANTIDO (sem strand) — Convergence = acelerador ×: +15% permanente sem perder o gear.
  state.xpRun = 0;
  state.lumens = 0;
  // NÃO reseta: gear (nível+raridade), map/subarea/unlockedSubarea/bossDefeated, Vestiges.

  // Renasce cheio na posição atual; reinicia a onda (você está mais fraco agora).
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
