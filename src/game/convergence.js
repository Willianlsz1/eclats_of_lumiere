// Convergence — CP-3 (redesign). SEM reset de mapa. Gate por NÍVEL; dá +15% ADITIVO
// permanente (o convMult vive em stats.js, entra em dano/HP/XP/Lumens). O botão
// RESETA: o nível da RUN (xpRun→0) + o NÍVEL do Gear (a RARIDADE nunca reseta).
// NÃO reseta: mapa/posição, Lumens, Vestiges. (O Gatekeeper A1 vai tirar o reset
// do gear — CP-7.) Você nunca volta pro início do mapa: sempre pra frente.

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
  // Reset: nível da run + NÍVEL do Gear (raridade preservada).
  state.xpRun = 0;
  for (const key of Object.keys(state.gear)) state.gear[key].level = 0;
  // NÃO reseta: map/subarea/unlockedSubarea/bossDefeated, Lumens, Vestiges, raridade.

  // Renasce cheio na posição atual; reinicia a onda (você está mais fraco agora).
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
