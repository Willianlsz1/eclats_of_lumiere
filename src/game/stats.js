// Stats derivados do jogador — fórmulas do GDD §4 e §6.
// Fatores de sistemas futuros (Gold Stats, Convergence, Ascension, Gear,
// Passivas, Mémoires) valem 1 até seus CPs chegarem.

import { COMBAT } from '../data/constants.js';

// level_do_Seeker = (XP_total_da_vida / 10)^0.4 — display (§6)
export function heroLevel(xpTotal) {
  return Math.max(1, Math.floor((xpTotal / 10) ** 0.4));
}

// level_bonus = 1 + sqrt(heroLevel) × 0.20 (§4)
export function levelBonus(xpTotal) {
  return 1 + Math.sqrt(heroLevel(xpTotal)) * 0.20;
}

// dano_por_hit = baseDmg × str_total × level_bonus × conv_factor × asc_mult × ... (§4)
export function damagePerHit(state) {
  return COMBAT.baseDmg * levelBonus(state.xpTotal);
}

export function currentAPS() {
  return COMBAT.baseAPS; // melhorias de APS vêm em CPs futuros (respeitar apsCap)
}

export function dps(state) {
  return damagePerHit(state) * currentAPS();
}

// hp_max = playerBaseHp × vit_total × level_bonus × conv_factor × ... (§4)
export function playerHpMax(state) {
  return COMBAT.playerBaseHp * levelBonus(state.xpTotal);
}
