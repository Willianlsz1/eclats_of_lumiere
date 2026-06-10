// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, NUMBER_CAP, BOSS_LUMEN_MULT } from '../data/constants.js';
import { frtTotal, wisTotal } from './stats.js';

export function awardKill(state, mob) {
  // §12: o ×5 de boss só se aplica a Lumens; o XP já escala pelo HP ×15
  const bossMult = mob.isBoss ? BOSS_LUMEN_MULT : 1;
  state.lumens = Math.min(NUMBER_CAP, state.lumens + mob.hpMax * ECONOMY.goldRatio * frtTotal(state) * bossMult);
  const xp = mob.hpMax * ECONOMY.xpRatio * wisTotal(state);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + xp); // vida (level display)
  state.xpRun = Math.min(NUMBER_CAP, state.xpRun + xp);     // run (parede de Convergence)
  state.killsTotal += 1;
}
