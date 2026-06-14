// Stats derivados do jogador — modelo CP-3 (redesign).
// NÍVEL (do XP da run) dá dano/HP FLAT — substitui os Gold Stats. APS/crit/economia
// vêm de Gear/Passivas/Mémoires (sem str/vit/agi/lck/frt/wis). Convergence = +15%
// ADITIVO por converge. Fatores de sistemas ainda-não-wirados valem 1.
//
// ⏳ Os shims no fim (strTotal/levelBonus/etc.) existem só pra UI antiga não quebrar
// no CP-3a; somem no CP-3b (rework do Player UI).

import { COMBAT, LEVEL, CRIT, CONVERGENCE, DEFENSE } from '../data/constants.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearDefesaMult, gearCritDmgAdd, gearApsMult,
  gearDamageFlat, gearHpFlat, gearApsFlat } from './gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveEnemyPen, passiveEnemyReduce, passiveApsMult } from './passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult, memoireSurvivalMult } from './memoires.js';
import { ascMult, despertarMult } from './ascension.js';

// ───── Nível (motor de stat base) ─────
// O nível vem do XP da RUN (reseta na Convergence). level = (xpRun / div)^exp.
export function runLevel(state) {
  return Math.max(1, Math.floor((state.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
}
// Nível a partir de um XP qualquer (usado pra display; mesma curva).
export const heroLevel = (xp) => Math.max(1, Math.floor(((xp || 0) / LEVEL.curveDiv) ** LEVEL.curveExp));

// ───── Convergence (+15% ADITIVO por converge) ─────
// Entra em dano, HP, XP e Lumens. O reset (nível da run + nível do gear) é feito
// em convergence.js; aqui é só o multiplicador permanente.
export function convMult(state) {
  return 1 + CONVERGENCE.bonusPerConv * state.convergences;
}

// ───── APS e crit (sem Gold Stats — vêm de gear/passivas) ─────
// APS = baseAPS × Fracture Pulse (passiva) × Resonance (gear, amortecido por log), teto apsCap.
export function currentAPS(state) {
  const resonance = 1 + 0.3 * Math.log10(Math.max(1, gearApsMult(state)));
  // CP-4: gear soma APS FLAT na base (capado no apsCap)
  const aps = (COMBAT.baseAPS + gearApsFlat(state)) * passiveApsMult(state) * resonance;
  return Math.min(COMBAT.apsCap, aps);
}

// Crit ⏳ provisório: rate vem de gear (Grasp) + passivas (Luminal Edge). Sem LCK.
export function critChanceRaw(state) {
  return CRIT.baseChance + gearCritAdd(state) + passiveCritAdd(state);
}
export function critChance(state) {
  return Math.min(1, critChanceRaw(state));
}
export function critDamageMult(state) {
  const overflow = Math.max(0, critChanceRaw(state) - 1); // crit chance > 100% transborda
  return (CRIT.baseDamageMult + overflow * CRIT.overflowFactor + gearCritDmgAdd(state)) * memoireCritDmgMult(state);
}

// ───── Dano e HP (base FLAT: nível do Seeker + flat do Gear) × multiplicadores ─────
const baseDamage = (state) => COMBAT.baseDmg + runLevel(state) * LEVEL.dmgPerLevel + gearDamageFlat(state);
const baseHp = (state) => COMBAT.playerBaseHp + runLevel(state) * LEVEL.hpPerLevel + gearHpFlat(state);

// dano_por_hit = (baseDmg + nível×dmgPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function damagePerHit(state) {
  return baseDamage(state) * convMult(state) * gearDamageMult(state) * passiveDmgMult(state)
    * memoireDmgMult(state) * ascMult(state) * despertarMult(state);
}

// DPS exibido: valor esperado incluindo crit
export function dps(state) {
  const critBonus = 1 + critChance(state) * (critDamageMult(state) - 1);
  return damagePerHit(state) * currentAPS(state) * critBonus;
}

// hp_max = (playerBaseHp + nível×hpPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function playerHpMax(state) {
  return baseHp(state) * convMult(state) * gearHpMult(state) * passiveHpMult(state)
    * memoireHpMult(state) * ascMult(state) * despertarMult(state);
}

// ───── Defesa / mitigação (§4 — inalterado pelo CP-3) ─────
export function veilFactor(state) {
  const fromVeil = Math.max(0, gearDefesaMult(state) - 1) * DEFENSE.veilScale;
  const fromPassives = 0; // ⛓️ hook reservado (Void Endurance etc.)
  const total = (fromVeil + fromPassives) * memoireSurvivalMult(state); // #11 amplia a defesa
  return Math.min(DEFENSE.veilCap, total);
}
export function playerDefesa(state) {
  return playerHpMax(state) * veilFactor(state);
}
export function postArmorDR(_state) {
  return 1; // ⛓️ hook reservado (Nihel's Shadow etc.)
}
export function enemyDefesa(state, _mob) {
  const reduced = DEFENSE.enemyDefBase * (1 - passiveEnemyReduce(state)); // Weakened Void
  return Math.max(0, reduced * (1 - passiveEnemyPen(state)));             // Void Piercing
}

// ───── Compat shims (removidos no CP-3b — UI antiga ainda os importa) ─────
export const strTotal = () => 1;
export const vitTotal = () => 1;
export const frtTotal = () => 1;
export const wisTotal = () => 1;
export const levelBonus = () => 1;             // o nível agora é flat, não multiplicador
export const convFactor = (state) => convMult(state); // a UI mostra a Convergence
export const statCostNext = () => Infinity;    // Gold Stats não são mais compráveis
export function buyStat() { return false; }
export function buyStatMax() {}
