// Motor de Mémoires — GDD §10/§11. Moeda = Éclats. Clarté é o motor global
// (dano × 1.07^Σ níveis). Desbloqueio por era via Ascension; evolução barata
// que escala. Persiste sempre. Efeitos `wired:false` ainda contam via Clarté.

import {
  MEMOIRES, MEMOIRE_CLARTE_BASE, MEMOIRE_UNLOCK, MEMOIRE_EVO_BASE, MEMOIRE_EVO_RAMP,
  MEMOIRE_CLARTE_EXP_PER,
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

// Σ aditivo de um tipo (1 + Σ per×nível) — só efeitos wired
function addType(state, type) {
  let s = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) s += m.per * state.memoires[i]; });
  return s;
}
// du Choix (#15): +5%/nível a TODOS os efeitos INDIVIDUAIS (não à Clarté nem ao motor ×Blessure)
const allMult = (state) => 1 + addType(state, 'allMemoire');
// Σ aditivo de um tipo, JÁ amplificado por du Choix
const eff = (state, type) => addType(state, type) * allMult(state);
// Π multiplicativo de um tipo (Π (1+per)^nível)
function mulType(state, type) {
  let p = 1;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) p *= (1 + m.per) ** state.memoires[i]; });
  return p;
}

// ⚠️ Clarté: o expoente é amplificado por #14 (de la Lumière Entière) — STUB (per=0, sem efeito).
// Com MEMOIRE_CLARTE_EXP_PER=0 o expoente = Σníveis ⇒ Clarté = 1.07^Σníveis (Camada 6 INTACTA).
function clarteExponent(state) {
  let amp = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'clarteExp') amp += MEMOIRE_CLARTE_EXP_PER * state.memoires[i]; });
  return totalLevels(state) * (1 + amp);
}
export const clarte = (state) => MEMOIRE_CLARTE_BASE ** clarteExponent(state);

// dano = Clarté × (1 + Σ dmg) × Π dmgMult  (§4: × memoire_mult)
export const memoireDmgMult     = (s) => clarte(s) * (1 + eff(s, 'dmg')) * mulType(s, 'dmgMult');
// HP recebe os MESMOS fatores de prestige (§4) — INCLUSIVE a Clarté. Sem isto o HP fica ~70 déc
// atrás do dano e o jogador morre instantâneo no late (a sobrevivência da Camada 2 assume HP∝dano).
export const memoireHpMult      = (s) => clarte(s) * (1 + eff(s, 'hp') + eff(s, 'survival'));
export const memoireLumensMult  = (s) => 1 + eff(s, 'lumens');
export const memoireXpMult      = (s) => 1 + eff(s, 'xp');
export const memoireVestigeMult = (s) => 1 + eff(s, 'vestiges');
export const memoireCritDmgMult = (s) => 1 + eff(s, 'critDmg');
// ── Passo 6: efeitos novos/wired ──
export const memoireSurvivalMult   = (s) => 1 + eff(s, 'survival');   // #11 → regen (combat) + defesa (veilFactor)
export const memoireMateriaisMult  = (s) => 1 + eff(s, 'materiais');  // #5  → yield de material (economy)
export const memoireEclatsAllMult  = (s) => 1 + eff(s, 'eclatsAll');  // #12 → drip + bolsas de Ascension
export const memoireDiffRewardMult = (s) => 1 + eff(s, 'diffReward'); // #13 → multiplica rewardMult da dificuldade
export const memoireBossDmgMult    = (s) => 1 + eff(s, 'bossDmg');    // #7  → dano em boss (path do gearBossDmg)
export const memoireOfflineMult    = (s) => 1 + eff(s, 'offline');    // #6  → ganho offline
// #9 du Dernier Chant: +1 ponto de Convergence/run a cada 5 níveis
export function memoireConvPointBonus(state) {
  let b = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'convPoint') b += Math.floor(state.memoires[i] / 5); });
  return b;
}

// Progresso por era (desbloqueadas / total) para a UI
export function eraProgress(state, era) {
  let unlocked = 0, total = 0;
  MEMOIRES.forEach((m, i) => { if (m.era === era) { total++; if (state.memoires[i] > 0) unlocked++; } });
  return { unlocked, total };
}
