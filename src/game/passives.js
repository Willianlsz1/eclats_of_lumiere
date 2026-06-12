// Motor de Passivas — GDD §7. Economia canônica; efeitos ⏳ PROVISÓRIOS
// (ver PASSIVES em constants.js). 3 árvores × 15 (3 grupos de 5).
// Moeda = Vestiges. Desbloqueia na 1ª Convergence. Persiste sempre.
//
// Estrutura de custo (§7):
//  - desbloqueio (level 0→1) = unlockLadder[posição] × groupMult[grupo]
//  - evolução (level L→L+1, L≥1) = desbloqueio × 0.3 × 1.30^(L-1)
//  - gate: maximizar os 5 do grupo anterior libera o próximo grupo.

import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';

const GROUP_SIZE = 5;
const groupOf = (i) => Math.floor(i / GROUP_SIZE);
const posOf = (i) => i % GROUP_SIZE;

// Sistema todo só abre na 1ª Convergence (momento de lore §6)
export const passivesUnlocked = (state) => state.convergences >= 1;

// Custo de desbloqueio de uma passiva (índice i na árvore)
export function unlockCost(i) {
  return PASSIVES.unlockLadder[posOf(i)] * PASSIVES.groupMult[groupOf(i)];
}

// Custo do próximo nível de uma passiva (Vestiges)
export function nextCost(state, tree, i) {
  const level = state.passives[tree][i];
  if (level === 0) return unlockCost(i);                 // desbloqueio
  return unlockCost(i) * PASSIVES.evoFactor * PASSIVES.evoRamp ** (level - 1); // evolução
}

export const isMax = (state, tree, i) => state.passives[tree][i] >= PASSIVES.maxLevel;

// Um grupo (0..2) está liberado se for o 1º ou se todos os 5 do anterior estão no máximo
export function groupUnlocked(state, tree, group) {
  if (group === 0) return true;
  const arr = state.passives[tree];
  const prev = group - 1;
  for (let p = 0; p < GROUP_SIZE; p++) {
    if (arr[prev * GROUP_SIZE + p] < PASSIVES.maxLevel) return false;
  }
  return true;
}

export function canBuy(state, tree, i) {
  if (!passivesUnlocked(state)) return false;
  if (isMax(state, tree, i)) return false;
  if (!groupUnlocked(state, tree, groupOf(i))) return false;
  return state.vestiges >= nextCost(state, tree, i);
}

// Compra/evolui uma passiva (gasta Vestiges)
export function buyPassive(state, tree, i) {
  if (!canBuy(state, tree, i)) return false;
  state.vestiges -= nextCost(state, tree, i);
  state.passives[tree][i] += 1;
  return true;
}

// ───── Efeitos individuais (Bloco 4, esquema Camada 5) ─────
// Multiplicador da PRIMÁRIA de uma árvore (Éclat→dano · Fracture→HP · Vestige→economia):
//   (1 + Σ %aditivo dos default) × Π(motores ×1.52^nível). Levers ficam FORA (efeito especial).
function treeMult(state, tree) {
  const arr = state.passives[tree];
  let add = 0, eng = 1;
  PASSIVES.trees[tree].list.forEach(([, art], i) => {
    const lv = arr[i];
    if (lv === 0) return;
    if (PASSIVES.levers[art]) return;                                  // lever: fora do mult
    if (PASSIVES.engines[tree].includes(art)) eng *= PASSIVES.engineMult ** lv; // motor ×1.52/nível
    else add += PASSIVES.groupAddPct[groupOf(i)] * lv;                 // default: % do grupo
  });
  return (1 + add) * eng;
}
export const passiveDmgMult = (s) => treeMult(s, 'eclat');
export const passiveHpMult  = (s) => treeMult(s, 'fracture');
export const passiveEcoMult = (s) => treeMult(s, 'vestige');

// Nível de uma passiva pela chave de arte (busca nas 3 árvores)
function leverLevel(state, art) {
  for (const tree of PASSIVE_TREES) {
    const idx = PASSIVES.trees[tree].list.findIndex(([, a]) => a === art);
    if (idx >= 0) return state.passives[tree][idx];
  }
  return 0;
}

// ── Alavancas funcionais (efeitos especiais, consumidos pelos sistemas reais) ──
const L = PASSIVES.lever;
export const passiveCritAdd      = (s) => leverLevel(s, 'e_luminal_edge') * L.critPerLevel;   // crit chance
export const passiveApsMult      = (s) => 1 + leverLevel(s, 'f_fracture_pulse') * L.apsPerLevel; // APS (Bloco 6)
export const passiveMobBonus     = (s) => Math.floor(leverLevel(s, 'f_void_awareness') * L.mobPerLevel); // +mobs
// Vestige Pull → ×drop de material (FARM: amortecido por log, nunca motor)
export const passiveMaterialMult = (s) => 1 + Math.log10(1 + leverLevel(s, 'v_vestige_pull') * L.materialPerLevel);
// Void Piercing (penetra) / Weakened Void (reduz) a defesa de INIMIGOS — consome o hook do Passo 2
export const passiveEnemyPen     = (s) => leverLevel(s, 'e_void_piercing') * L.penPerLevel;   // fração penetrada
export const passiveEnemyReduce  = (s) => leverLevel(s, 'f_weakened_void') * L.reducePerLevel; // fração reduzida

// Contadores para a UI (quantas desbloqueadas / maximizadas por árvore)
export function treeProgress(state, tree) {
  const arr = state.passives[tree];
  let unlocked = 0, maxed = 0;
  for (const lv of arr) { if (lv > 0) unlocked++; if (lv >= PASSIVES.maxLevel) maxed++; }
  return { unlocked, maxed, total: arr.length };
}

export { PASSIVE_TREES };
