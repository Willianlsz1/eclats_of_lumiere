// [VISUAL-ONLY] Motor de stats REMOVIDO. Stubs neutros (multiplicadores = 1,
// valores de exibição fixos) só para a UI renderizar sem quebrar.

export const runLevel = () => 1;
export const heroLevel = () => 1;
export const levelProgress = () => 0;
export const levelXpInfo = () => ({ into: 0, total: 100, remaining: 100 });
export const convMult = () => 1;
export const apsBonus = () => 0;
export const currentAPS = () => 1;
export const critChanceRaw = () => 0;
export const critChance = () => 0;
export const critDamageMult = () => 2;
export const damagePerHit = () => 10;
export const dps = () => 10;
export const playerHpMax = () => 100;
export const veilFactor = () => 0;
export const playerDefesa = () => 0;
export const postArmorDR = () => 1;
export const enemyDefesa = () => 0;

// Shims antigos
export const strTotal = () => 1;
export const vitTotal = () => 1;
export const frtTotal = () => 1;
export const wisTotal = () => 1;
export const levelBonus = () => 1;
export const convFactor = () => 1;
export const statCostNext = () => Infinity;
export function buyStat() { return false; }
export function buyStatMax() {}
