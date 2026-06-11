// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, NUMBER_CAP, BOSS_LUMEN_MULT, VESTIGES, CRAFT, mapMaterialTier } from '../data/constants.js';
import { frtTotal, wisTotal } from './stats.js';
import { gearLumensMult, gearXpMult } from './gear.js';
import { passiveEcoMult } from './passives.js';
import { memoireLumensMult, memoireXpMult, memoireVestigeMult } from './memoires.js';
import { effectiveDifficulty } from './difficulty.js';

// Multiplicador de YIELD de material (§13B): DIFICULDADE ×rewardMult (×3/×10/×30).
// ⛓️ hooks reservados (= 1 por ora): Vestige Pull (passiva) · Mémoire du Façonnage (Passo 6)
//   · afixo Materiais do gear (⏳ precisa de mapeamento amortecido — a curva crua é forte demais).
function materialYieldMult(state) {
  return effectiveDifficulty(state).rewardMult;
}

// §13B: drop de materiais no kill. 1% do tier do MAPA + 0.1% do tier seguinte; boss = chunk garantido.
function awardMaterials(state, mob) {
  const tier = mapMaterialTier(state.map);
  const y = materialYieldMult(state);
  if (Math.random() < CRAFT.dropChance) state.materiais[tier] += y;
  if (tier < 3 && Math.random() < CRAFT.nextTierChance) state.materiais[tier + 1] += y;
  if (mob.isBoss) state.materiais[tier] += CRAFT.bossChunk * y; // Guardião/final: chunk garantido
}

// §7: vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa)
// Map 1 (índice 0): [1, 1, 2, 2, 3] nas Subs 1-5
export function vestigesPerKill(state) {
  return Math.ceil(state.subarea * 0.5) * 3 ** (state.map - 1);
}

export function awardKill(state, mob) {
  // §12: o ×5 de boss só se aplica a Lumens; o XP já escala pelo HP ×15
  const bossMult = mob.isBoss ? BOSS_LUMEN_MULT : 1;
  const eco = passiveEcoMult(state); // §7 Vestige tree (Lumens/XP) — provisório
  state.lumens = Math.min(NUMBER_CAP, state.lumens + mob.hpMax * ECONOMY.goldRatio * frtTotal(state) * bossMult * gearLumensMult(state) * eco * memoireLumensMult(state));
  const xp = mob.hpMax * ECONOMY.xpRatio * wisTotal(state) * gearXpMult(state) * eco * memoireXpMult(state);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + xp); // vida (level display)
  state.xpRun = Math.min(NUMBER_CAP, state.xpRun + xp);     // run (parede de Convergence)
  // §7: Vestiges nunca resetam; boss paga ×10
  const vest = vestigesPerKill(state) * (mob.isBoss ? VESTIGES.bossMult : 1) * memoireVestigeMult(state);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + vest);
  awardMaterials(state, mob); // §13B (Passo 4)
  state.killsTotal += 1;
}
