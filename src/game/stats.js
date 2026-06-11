// Stats derivados do jogador — fórmulas do GDD §4, §5 e §6.
// Fatores de sistemas futuros (Convergence, Ascension, Gear, Passivas,
// Mémoires) valem 1 até seus CPs chegarem.

import { COMBAT, GOLD_STATS, CRIT, CONVERGENCE } from '../data/constants.js';
import { gearDamageMult, gearHpMult, gearCritAdd } from './gear.js';
import { passiveDmgMult, passiveHpMult } from './passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult } from './memoires.js';

// ───── Gold Stats (§5) ─────

// Produto dos milestones atingidos pelo nível
function milestoneMult(level) {
  let mult = 1;
  for (const [at, m] of GOLD_STATS.milestones) {
    if (level >= at) mult *= m;
  }
  return mult;
}

// stat_total = (1 + nível × bônus) × milestones — para str/vit/frt/wis
function statTotal(level, per) {
  return (1 + level * per) * milestoneMult(level);
}

export const strTotal = (s) => statTotal(s.stats.str, GOLD_STATS.per.str);
export const vitTotal = (s) => statTotal(s.stats.vit, GOLD_STATS.per.vit);
export const frtTotal = (s) => statTotal(s.stats.frt, GOLD_STATS.per.frt);
export const wisTotal = (s) => statTotal(s.stats.wis, GOLD_STATS.per.wis);

// custo(n) = 10 × 1.15^n (paridade com a renda — tempo por compra constante)
export function statCostNext(level) {
  return GOLD_STATS.costBase * GOLD_STATS.costRamp ** level;
}

export function buyStat(state, key) {
  const cost = statCostNext(state.stats[key]);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  state.stats[key] += 1;
  return true;
}

// Compra em sequência enquanto houver Lumens (teto de segurança)
export function buyStatMax(state, key) {
  for (let i = 0; i < 10_000; i++) {
    if (!buyStat(state, key)) break;
  }
}

// ───── APS e crit ─────

// agi: sem milestones (cap duro de 1.25 APS torna-os irrelevantes — herdado do sim)
export function currentAPS(state) {
  return Math.min(COMBAT.apsCap, COMBAT.baseAPS * (1 + state.stats.agi * GOLD_STATS.per.agi));
}

// ⏳ Crit provisório (GDD §16.6): rate = lck × 1.5%, sem milestones;
// excedente acima de 100% transborda 1:1 para crit damage sobre a base ×2.
export function critChanceRaw(state) {
  return CRIT.baseChance + state.stats.lck * GOLD_STATS.per.lck + gearCritAdd(state);
}

export function critChance(state) {
  return Math.min(1, critChanceRaw(state));
}

export function critDamageMult(state) {
  const overflow = Math.max(0, critChanceRaw(state) - 1);
  return (CRIT.baseDamageMult + overflow * CRIT.overflowFactor) * memoireCritDmgMult(state);
}

// ───── Fórmulas do jogador (§4 e §6) ─────

// level_do_Seeker = (XP_total_da_vida / 10)^0.4 — display (§6)
export function heroLevel(xpTotal) {
  return Math.max(1, Math.floor((xpTotal / 10) ** 0.4));
}

// level_bonus = 1 + sqrt(heroLevel) × 0.20 (§4)
export function levelBonus(xpTotal) {
  return 1 + Math.sqrt(heroLevel(xpTotal)) * 0.20;
}

// conv_factor = 1 + 0.15 × Σ pontos de Convergence (§6)
export function convFactor(state) {
  return 1 + CONVERGENCE.pointBonus * state.convPoints;
}

// dano_por_hit = baseDmg × str_total × level_bonus × conv_factor × gear_bonus × ... (§4)
export function damagePerHit(state) {
  return COMBAT.baseDmg * strTotal(state) * levelBonus(state.xpTotal) * convFactor(state) * gearDamageMult(state) * passiveDmgMult(state) * memoireDmgMult(state);
}

// DPS exibido: valor esperado incluindo crit
export function dps(state) {
  const critBonus = 1 + critChance(state) * (critDamageMult(state) - 1);
  return damagePerHit(state) * currentAPS(state) * critBonus;
}

// hp_max = playerBaseHp × vit_total × level_bonus × conv_factor × gear_hp × ... (§4)
export function playerHpMax(state) {
  return COMBAT.playerBaseHp * vitTotal(state) * levelBonus(state.xpTotal) * convFactor(state) * gearHpMult(state) * passiveHpMult(state) * memoireHpMult(state);
}
