// [VISUAL-ONLY] Motor de Mémoires REMOVIDO. Multiplicadores neutros, compra
// desativada. eraOf/eraProgress mantêm a forma esperada pela UI (leitura de dados).

import { MEMOIRES } from '../data/constants.js';

export const eraOf = (i) => MEMOIRES[i].era;
export const eraUnlocked = () => false;
export const nextCost = () => 0;
export const canBuy = () => false;
export function buyMemoire() { return false; }
export const totalLevels = () => 0;
export const clarte = () => 1;

export const memoireDmgMult = () => 1;
export const memoireHpMult = () => 1;
export const memoireLumensMult = () => 1;
export const memoireXpMult = () => 1;
export const memoireVestigeMult = () => 1;
export const memoireCritDmgMult = () => 1;
export const memoireSurvivalMult = () => 1;
export const memoireMateriaisMult = () => 1;
export const memoireEclatsAllMult = () => 1;
export const memoireDiffRewardMult = () => 1;
export const memoireBossDmgMult = () => 1;
export const memoireOfflineMult = () => 1;
export const memoireConvPointBonus = () => 0;

export function eraProgress(state, era) {
  let unlocked = 0, total = 0;
  MEMOIRES.forEach((m, i) => { if (m.era === era) { total++; if (state.memoires[i] > 0) unlocked++; } });
  return { unlocked, total };
}
