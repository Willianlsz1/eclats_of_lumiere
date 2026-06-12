// Fate Keepers (A1-A5) — §8 (Passo 5). Desbloqueiam por Ascension:
//   A1 auto-Gold Stats + auto-Convergir · A2 auto-progressão + abre dificuldades ·
//   A3 motor de Éclats (drip + offline 24h) · A4 +cap de mobs · A5 Transcendência (stub).
// As automações são TOGGLES (default off): o Fate Keeper LIBERA, o jogador LIGA.

import { buyStatMax } from './stats.js';
import { canConverge, doConverge } from './convergence.js';
import { enterSubarea } from './combat.js';
import { hpForLevel } from './enemies.js';
import { MAPS, ECO, CRAFT, ECONOMY, VESTIGES, NUMBER_CAP, mapMaterialTier } from '../data/constants.js';

// Fate Keeper N desbloqueado?
export const fateKeeperUnlocked = (state, n) => state.ascensions >= n;

// A3 — Eco do Seeker: farma `ecoMap` (já limpo) em 2º plano a ECO.fraction do rendimento daquele mapa.
// Rende materiais (do tier do eco map) + Lumens + Vestiges, online E offline (roda no automationTick).
export function ecoTick(state, dt) {
  if (state.ascensions < 3 || !state.ecoMap) return;
  const ecoMap = MAPS[state.ecoMap - 1];
  if (!ecoMap) return;
  const kills = ECO.killRate * dt;          // kills equivalentes no período
  const f = ECO.fraction;
  const frontierHp = hpForLevel(ecoMap, ecoMap.lvlHi); // mob mais fundo do eco map
  // Materiais do tier do eco map (valor esperado = chance × kills), a fração
  state.materiais[mapMaterialTier(state.ecoMap)] += f * CRAFT.dropChance * kills;
  // Lumens e Vestiges a fração (sempre < farm ativo, pois o eco map é mais baixo)
  state.lumens = Math.min(NUMBER_CAP, state.lumens + f * frontierHp * ECONOMY.goldRatio * kills);
  const vestPerKill = Math.ceil(ecoMap.subareaCount * 0.5) * 3 ** (state.ecoMap - 1);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + f * vestPerKill * kills);
}

// Tick de automação (roda no loop online e na simulação offline)
export function automationTick(state, dt = 0) {
  // A1 — auto-Gold Stats + auto-Convergir
  if (state.ascensions >= 1) {
    if (state.auto.stats) for (const key of Object.keys(state.stats)) buyStatMax(state, key);
    if (state.auto.converge && canConverge(state)) doConverge(state);
  }
  // A2 — auto-progressão (vai p/ a sub-área mais funda desbloqueada)
  if (state.ascensions >= 2 && state.auto.progress) {
    if (state.subarea < state.unlockedSubarea) enterSubarea(state, state.unlockedSubarea);
  }
  // A3 — Eco do Seeker (2º plano). A4 (+cap de mobs) é aplicado no spawn (combat.js); A5 = flag.
  ecoTick(state, dt);
}
