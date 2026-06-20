// [VISUAL-ONLY] Motor de Gear REMOVIDO. Multiplicadores neutros (1/0), custos e
// caps fixos, ações desativadas — só para a UI das peças renderizar.

import { GEAR } from '../data/constants.js';

export const primaryMult = () => 1;
export const secondaryMult = () => 1;
export const critOf = () => 0;
export const critDmgOf = () => 0;
export const activeSecondaries = () => [];

export const gearDamageMult = () => 1;
export const gearHpMult = () => 1;
export const gearDefesaMult = () => 1;
export const gearApsMult = () => 1;
export const gearRegenMult = () => 1;
export const gearBossDmgMult = () => 1;

export const gearDamageFlat = () => 0;
export const gearHpFlat = () => 0;
export const gearApsFlat = () => 0;
export const gearDefesaFlat = () => 0;

export const gearLumensMult = () => 1;
export const gearXpMult = () => 1;
export const gearMaterialDropMult = () => 1;

export const gearCritAdd = () => 0;
export const gearCritDmgAdd = () => 0;

export const levelCapFor = (piece) => GEAR.levelCap[piece.rarity] ?? 50;
export const atLevelCap = () => false;
export const levelCost = () => 10;
export const rarityUpTier = (piece) => piece.rarity;
export const rarityUpCost = () => Infinity;
export const canRarityUp = () => false;
export function buyLevel() { return false; }
export function buyLevels() { return 0; }
export function doRarityUp() { return false; }
export const canRefino = () => false;
export function doRefino() { return false; }
