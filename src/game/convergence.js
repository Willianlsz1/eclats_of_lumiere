// Convergence — CP-6 (redesign Mapa 1): o rebirth.
// Gate por NÍVEL (50, ×1.5/conv). Dá SÓ Pontos (= nível ao convergir), gastos em
// passivas (CP-7). Reseta: nível da run (xpRun) + Lumens + acesso às áreas fundas
// (volta à área 1; re-sobe pelo gate). MANTÉM: gear, inventário, materiais, pontos.

import { CONVERGENCE } from '../data/constants.js';
import { runLevel, playerHpMax } from './stats.js';
import { resetPack } from './combat.js';

// Nível-alvo da próxima Convergence (sobe ×1.5 por converge). 1ª = nível 50.
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

// Pontos que esta Convergence renderia AGORA (= nível da run).
export function pointsOnConverge(state) {
  return runLevel(state);
}

export function doConverge(state) {
  if (!canConverge(state)) return false;
  state.convPoints += pointsOnConverge(state); // Pontos = nível ao convergir
  state.convergences += 1;

  // Reseta a run: nível (xpRun) + Lumens + acesso às áreas fundas.
  state.xpRun = 0;
  state.lumens = 0;
  state.subarea = 1;
  state.unlockedSubarea = 1;
  state.killsInSubarea = 0;
  state.bestSubareaRun = 1;

  // Renasce cheio na área 1; reinicia a onda.
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
