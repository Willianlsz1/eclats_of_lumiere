// Convergence — GDD §6 e §2.
// O portão é uma parede de XP geométrica: quando o XP da run enche a parede,
// o botão acende e o jogador converge — reseta Gold Stats, Lumens e progresso
// de mapa; ganha pontos pela subárea mais funda alcançada na run.
// Persistem: pontos de Convergence, XP/level do Seeker (e, fora do MVP,
// Gear/Echoes/Passivas/Mémoires).

import { CONVERGENCE } from '../data/constants.js';
import { playerHpMax } from './stats.js';
import { resetPack } from './combat.js';

// parede_da_run(c) = 1500 × Π(i=0..c-1) [1.5 × 1.06^i]
export function xpWall(convergences) {
  let wall = CONVERGENCE.wallBase;
  for (let i = 0; i < convergences; i++) {
    wall *= CONVERGENCE.wallRatio * CONVERGENCE.wallRatioGrowth ** i;
  }
  return wall;
}

export function canConverge(state) {
  return state.xpRun >= xpWall(state.convergences);
}

// pontos_da_run = índice global da subárea mais funda (Map 1: 1-5)
export function runPoints(state) {
  return state.bestSubareaRun;
}

export function doConverge(state) {
  if (!canConverge(state)) return false;

  state.convergences += 1;
  state.convPoints += runPoints(state);

  // Reset de run: Gold Stats, Lumens e progresso de mapa
  state.lumens = 0;
  for (const key of Object.keys(state.stats)) state.stats[key] = 0;
  state.xpRun = 0;
  state.subarea = 1;
  state.unlockedSubarea = 1;
  state.bossDefeated = state.bossDefeated.map(() => false);
  state.killsInSubarea = 0;
  state.bestSubareaRun = 1;

  // Jogador renasce cheio na sub 1 (a 1ª Convergence desbloqueia as
  // Passivas no jogo completo — fora do MVP; Vestiges são CP-F)
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
