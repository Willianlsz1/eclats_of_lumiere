// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de Mémoires foi removido. Multiplicadores neutros; eraUnlocked segue o
// nº de ascensions semeado para algumas relíquias aparecerem desbloqueadas.

import { MEMOIRES } from '../data/constants.js';

export const memoireDmgMult     = () => 1;
export const memoireHpMult      = () => 1;
export const memoireCritDmgMult = () => 1;
export const memoireLumensMult  = () => 1;
export const memoireXpMult      = () => 1;

export const eraUnlocked = (s, era) => (s?.ascensions || 0) >= era;
export const nextCost    = () => 10;
export const canBuy      = () => false;
export const buyMemoire  = () => false;

// Progresso por era (desbloqueadas / total) — total real, desbloqueadas = 0 na casca.
export function eraProgress(_state, era) {
  const total = MEMOIRES.filter((m) => m.era === era).length;
  return { unlocked: 0, total };
}
