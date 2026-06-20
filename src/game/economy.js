// Economia de kill — CP-3 (redesign Mapa 1).
// Lumens = HP_mob × 0.25 · XP = HP_mob × 0.10, ambos × convMult × gear × passiva.
// (Drop de gear/material = CP-4. Pontos de Convergence vêm de convergir = CP-6.)

import { ECONOMY } from '../data/constants.js';
import { gearLumensMult, gearXpMult } from './gear.js';
import { passiveLumensMult, passiveXpMult } from './passives.js';
import { convMult, playerHpMax } from './stats.js';
import { getCurrentMap, areaFactor } from './enemies.js';

export function awardKill(state, mob) {
  const cm = convMult(state);
  state.lumens += mob.hpMax * ECONOMY.lumRatio * cm * gearLumensMult(state) * passiveLumensMult(state);
  const xp = mob.hpMax * ECONOMY.xpRatio * cm * gearXpMult(state) * passiveXpMult(state);
  state.xpTotal += xp;
  state.xpRun += xp;
  state.killsTotal += 1;
}

// Vestiges saíram do reward base no redesign (moeda de passiva = Pontos de Convergence).
export function vestigesPerKill() { return 0; }

// Estimativa por kill p/ a tela de Mapa (mob "médio" da área).
export function perKillEstimate(state, subarea) {
  const map = getCurrentMap(state);
  const f = areaFactor(map, subarea);
  const avgHp = playerHpMax(state) * f * 1.6; // roll médio (1.3..1.9)
  const cm = convMult(state);
  const lumens = avgHp * ECONOMY.lumRatio * cm * gearLumensMult(state) * passiveLumensMult(state);
  const xp = avgHp * ECONOMY.xpRatio * cm * gearXpMult(state) * passiveXpMult(state);
  return { lumens, xp, vestiges: 0, tier: 0, matChance: 0, matPerDrop: 0 };
}
