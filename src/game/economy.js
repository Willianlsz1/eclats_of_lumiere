// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (frt = 1 até o CP-C)
// xp_por_kill     = mob_hp × 0.08 × wis_total (wis = 1 até o CP-C)

import { ECONOMY, NUMBER_CAP } from '../data/constants.js';

export function awardKill(state, mob) {
  state.lumens = Math.min(NUMBER_CAP, state.lumens + mob.hpMax * ECONOMY.goldRatio);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + mob.hpMax * ECONOMY.xpRatio);
  state.killsTotal += 1;
}
