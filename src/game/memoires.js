// Motor de Mémoires — GDD §10/§11. Moeda = Éclats. Clarté é o motor global
// (dano × 1.07^Σ níveis). Desbloqueio por era via Ascension; evolução barata
// que escala. Persiste sempre. Efeitos `wired:false` ainda contam via Clarté.

import {
  MEMOIRES, MEMOIRE_CLARTE_BASE, MEMOIRE_UNLOCK, MEMOIRE_EVO_BASE, MEMOIRE_EVO_RAMP,
} from '../data/constants.js';

export const eraOf = (i) => MEMOIRES[i].era;
export const eraUnlocked = (state, era) => state.ascensions >= era;

// Custo do próximo passo (Éclats): desbloqueio (nível 0→1) ou evolução
export function nextCost(state, i) {
  const level = state.memoires[i];
  if (level === 0) return MEMOIRE_UNLOCK[MEMOIRES[i].era - 1];   // §11: desbloqueio por era
  return MEMOIRE_EVO_BASE * MEMOIRE_EVO_RAMP ** (level + 1);     // §11: evolução 2 × 1.10^n
}

export function canBuy(state, i) {
  return eraUnlocked(state, MEMOIRES[i].era) && state.eclats >= nextCost(state, i);
}

export function buyMemoire(state, i) {
  if (!canBuy(state, i)) return false;
  state.eclats -= nextCost(state, i);
  state.memoires[i] += 1;
  return true;
}

// ───── Efeitos ─────
export function totalLevels(state) {
  let s = 0;
  for (const l of state.memoires) s += l;
  return s;
}

// Clarté (motor global): dano × 1.07^(Σ todos os níveis)
export const clarte = (state) => MEMOIRE_CLARTE_BASE ** totalLevels(state);

// Σ aditivo de um tipo (1 + Σ per×nível) — só efeitos wired
function addType(state, type) {
  let s = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) s += m.per * state.memoires[i]; });
  return s;
}
// Π multiplicativo de um tipo (Π (1+per)^nível)
function mulType(state, type) {
  let p = 1;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) p *= (1 + m.per) ** state.memoires[i]; });
  return p;
}

// dano = Clarté × (1 + Σ dmg) × Π dmgMult  (§4: × memoire_mult)
export const memoireDmgMult     = (s) => clarte(s) * (1 + addType(s, 'dmg')) * mulType(s, 'dmgMult');
export const memoireHpMult      = (s) => 1 + addType(s, 'hp');
export const memoireLumensMult  = (s) => 1 + addType(s, 'lumens');
export const memoireXpMult      = (s) => 1 + addType(s, 'xp');
export const memoireVestigeMult = (s) => 1 + addType(s, 'vestiges');
export const memoireCritDmgMult = (s) => 1 + addType(s, 'critDmg');

// Progresso por era (desbloqueadas / total) para a UI
export function eraProgress(state, era) {
  let unlocked = 0, total = 0;
  MEMOIRES.forEach((m, i) => { if (m.era === era) { total++; if (state.memoires[i] > 0) unlocked++; } });
  return { unlocked, total };
}
