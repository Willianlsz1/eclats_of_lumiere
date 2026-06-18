// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de Passivas foi removido. Multiplicadores neutros; gates abertos para a
// árvore aparecer completa; compras são no-op.

export const passiveDmgMult = () => 1;
export const passiveHpMult  = () => 1;
export const passiveEcoMult = () => 1;
export const passiveApsMult = () => 1;
export const passiveCritAdd = () => 0;

export const passivesUnlocked = (s) => (s?.convergences || 0) >= 1;
export const groupUnlocked    = () => true;
export const isMax            = () => false;
export const nextCost         = () => 100;
export const canBuy           = () => false;
export const buyPassive       = () => false;

export const treeProgress = () => ({ unlocked: 0, maxed: 0, total: 15 });
