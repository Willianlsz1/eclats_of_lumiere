// [VISUAL-ONLY] Motor de Passivas REMOVIDO. Efeitos neutros, compra desativada.
// treeProgress/eraProgress mantêm a forma esperada pela UI.

import { PASSIVE_TREES } from '../data/constants.js';

export const passivesUnlocked = () => false;
export const unlockCost = () => 0;
export const nextCost = () => 0;
export const isMax = () => false;
export const groupUnlocked = (state, tree, group) => group === 0;
export const canBuy = () => false;
export function buyPassive() { return false; }

export const passiveDmgMult = () => 1;
export const passiveHpMult = () => 1;
export const passiveEcoMult = () => 1;
export const passiveCritAdd = () => 0;
export const passiveApsMult = () => 1;
export const passiveMobBonus = () => 0;
export const passiveMaterialMult = () => 1;
export const passiveEnemyPen = () => 0;
export const passiveEnemyReduce = () => 0;

export const treeProgress = () => ({ unlocked: 0, maxed: 0, total: 15 });

export { PASSIVE_TREES };
