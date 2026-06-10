// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, NUMBER_CAP } from '../data/constants.js';
import { frtTotal, wisTotal } from './stats.js';

export function awardKill(state, mob) {
  state.lumens = Math.min(NUMBER_CAP, state.lumens + mob.hpMax * ECONOMY.goldRatio * frtTotal(state));
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + mob.hpMax * ECONOMY.xpRatio * wisTotal(state));
  state.killsTotal += 1;
}
