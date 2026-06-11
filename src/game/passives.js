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

// ───── Efeitos agregados (⏳ envelope provisório: +effectPerLevel por nível) ─────
function treeLevelSum(state, tree) {
  let s = 0;
  for (const lv of state.passives[tree]) s += lv;
  return s;
}
function treeMult(state, tree) {
  return 1 + PASSIVES.effectPerLevel[tree] * treeLevelSum(state, tree);
}

export const passiveDmgMult = (s) => treeMult(s, 'eclat');    // Éclat → dano
export const passiveEcoMult = (s) => treeMult(s, 'vestige');  // Vestige → Lumens/XP
export const passiveHpMult  = (s) => treeMult(s, 'fracture'); // Fracture → HP

// Contadores para a UI (quantas desbloqueadas / maximizadas por árvore)
export function treeProgress(state, tree) {
  const arr = state.passives[tree];
  let unlocked = 0, maxed = 0;
  for (const lv of arr) { if (lv > 0) unlocked++; if (lv >= PASSIVES.maxLevel) maxed++; }
  return { unlocked, maxed, total: arr.length };
}

export { PASSIVE_TREES };
