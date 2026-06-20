// Stats derivados — CP-2 (redesign Mapa 1).
// NÍVEL (do XP da run) dá HP/Dano FLAT (base + nível×per). Por cima entram os
// multiplicadores de gear/passivas/Convergence (gear/passivas ainda são stubs = 1/0,
// preenchidos nos CP-4/7). HP e Dano crescem JUNTOS (hpPerLevel = dmgPerLevel).

import { COMBAT, LEVEL, CRIT, CONVERGENCE, DEFENSE } from '../data/constants.js';
import {
  gearDamageMult, gearHpMult, gearDefesaMult, gearCritAdd, gearCritDmgAdd,
  gearApsFlat, gearDamageFlat, gearHpFlat,
} from './gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveApsMult, passiveCritDmgMult, passiveDefesaAdd } from './passives.js';

// ───── Nível (motor de stat base) ─────
// O nível vem do XP da RUN (xpRun). level = (xpRun / curveDiv)^curveExp. Reseta na Convergence.
export function runLevel(state) {
  return Math.max(1, Math.floor((state.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
}
export const heroLevel = (xp) => Math.max(1, Math.floor(((xp || 0) / LEVEL.curveDiv) ** LEVEL.curveExp));

// XP nos limites do nível atual: xp(L) = curveDiv × L^(1/curveExp) (inverso da curva).
function levelXpBounds(state) {
  const L = runLevel(state);
  const inv = 1 / LEVEL.curveExp;
  return { xpL: LEVEL.curveDiv * L ** inv, xpN: LEVEL.curveDiv * (L + 1) ** inv };
}
export function levelProgress(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return Math.max(0, Math.min(1, (state.xpRun - xpL) / (xpN - xpL)));
}
export function levelXpInfo(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return {
    into: Math.max(0, state.xpRun - xpL),
    total: xpN - xpL,
    remaining: Math.max(0, xpN - state.xpRun),
  };
}

// ───── Convergence (+15% aditivo por converge) ─────
export function convMult(state) {
  return 1 + CONVERGENCE.bonusPerConv * (state.convergences || 0);
}

// ───── Atk Speed ─────
export function apsBonus(state) {
  return gearApsFlat(state); // afixo aditivo de Atk Speed (gear; stub = 0)
}
export function currentAPS(state) {
  const aps = (COMBAT.baseAPS + apsBonus(state)) * passiveApsMult(state);
  return Math.min(COMBAT.apsCap, aps);
}

// ───── Crit ─────
export function critChanceRaw(state) {
  return CRIT.baseChance + gearCritAdd(state) + passiveCritAdd(state);
}
export function critChance(state) {
  return Math.min(1, critChanceRaw(state));
}
export function critDamageMult(state) {
  return (CRIT.baseDamageMult + gearCritDmgAdd(state)) * passiveCritDmgMult(state);
}

// ───── Dano e HP (base FLAT: nível + flat do gear) × multiplicadores ─────
const baseDamage = (state) => COMBAT.baseDmg + runLevel(state) * LEVEL.dmgPerLevel + gearDamageFlat(state);
const baseHp = (state) => COMBAT.playerBaseHp + runLevel(state) * LEVEL.hpPerLevel + gearHpFlat(state);

export function damagePerHit(state) {
  return baseDamage(state) * convMult(state) * gearDamageMult(state) * passiveDmgMult(state);
}
export function playerHpMax(state) {
  return baseHp(state) * convMult(state) * gearHpMult(state) * passiveHpMult(state);
}
export function dps(state) {
  const critBonus = 1 + critChance(state) * (critDamageMult(state) - 1);
  return damagePerHit(state) * currentAPS(state) * critBonus;
}

// ───── Defesa / mitigação ─────
export function veilFactor(state) {
  const fromVeil = Math.max(0, gearDefesaMult(state) - 1) + passiveDefesaAdd(state);
  return Math.min(0.75, fromVeil); // teto de mitigação 75% (design CP-7)
}
export function playerDefesa(state) {
  return playerHpMax(state) * veilFactor(state);
}
export function postArmorDR() { return 1; }
export function enemyDefesa() { return 0; }

// ───── Compat shims (UI antiga ainda importa) ─────
export const strTotal = () => 1;
export const vitTotal = () => 1;
export const frtTotal = () => 1;
export const wisTotal = () => 1;
export const levelBonus = () => 1;
export const convFactor = (state) => convMult(state);
export const statCostNext = () => Infinity;
export function buyStat() { return false; }
export function buyStatMax() {}
