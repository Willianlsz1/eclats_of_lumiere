// Passivas — CP-7a (redesign Mapa 1): 12 nós menores comprados com Pontos de Convergence.
// Efeito por rank: 'mult' = composto (1+per)^rank · 'add' = aditivo rank×per.
// Custo por rank: base × 1.25^rank (cada rank mais caro). Caps onde a mecânica exige.
// Notáveis/keystones = Mapa 3/4 (fora daqui). Sem gates de tier (todos os 12 são menores).

import { PASSIVE_TREES } from '../data/constants.js';

// id → { ramo, mode, per, base(custo rank 1), cap(ranks) }
export const NODES = {
  // Ofensiva
  dmg:        { ramo: 'off', mode: 'mult', per: 0.05,  base: 15, cap: Infinity },
  critChance: { ramo: 'off', mode: 'add',  per: 0.005, base: 20, cap: Infinity },
  critDamage: { ramo: 'off', mode: 'mult', per: 0.05,  base: 18, cap: Infinity },
  atkSpeed:   { ramo: 'off', mode: 'add',  per: 0.01,  base: 30, cap: 25 },  // cap +25% (Mapa 1)
  bossDmg:    { ramo: 'off', mode: 'mult', per: 0.08,  base: 12, cap: Infinity },
  // Resistência
  hp:         { ramo: 'res', mode: 'mult', per: 0.05,  base: 15, cap: Infinity },
  defesa:     { ramo: 'res', mode: 'add',  per: 0.01,  base: 18, cap: 75 },  // teto mitig. 75%
  regen:      { ramo: 'res', mode: 'add',  per: 0.001, base: 12, cap: Infinity },
  // Fortuna
  lumens:     { ramo: 'for', mode: 'mult', per: 0.05,  base: 10, cap: Infinity },
  xp:         { ramo: 'for', mode: 'mult', per: 0.05,  base: 10, cap: Infinity },
  materiais:  { ramo: 'for', mode: 'mult', per: 0.05,  base: 10, cap: Infinity },
  faro:       { ramo: 'for', mode: 'add',  per: 0.002, base: 25, cap: 20 },  // cap +4% (Mapa 1)
};
export const NODE_IDS = Object.keys(NODES);
export const RAMOS = { off: 'Offense', res: 'Resistance', for: 'Fortune' };

const rankOf = (state, id) => (state.passives && state.passives[id]) || 0;
export const nodeRank = rankOf;
export const atNodeCap = (state, id) => rankOf(state, id) >= NODES[id].cap;
export const nodeCost = (state, id) => Math.round(NODES[id].base * 1.25 ** rankOf(state, id));
export const canBuyNode = (state, id) => !atNodeCap(state, id) && state.convPoints >= nodeCost(state, id);

export function buyNode(state, id) {
  if (!canBuyNode(state, id)) return false;
  state.convPoints -= nodeCost(state, id);
  state.passives[id] = rankOf(state, id) + 1;
  return true;
}

// valor do nó: composto ou aditivo
const mult = (state, id) => (1 + NODES[id].per) ** rankOf(state, id);
const add = (state, id) => rankOf(state, id) * NODES[id].per;

// ───── Efeitos (consumidos por stats/combat/economy/enemies/gear) ─────
export const passiveDmgMult = (s) => mult(s, 'dmg');
export const passiveHpMult = (s) => mult(s, 'hp');
export const passiveCritDmgMult = (s) => mult(s, 'critDamage');
export const passiveBossDmgMult = (s) => mult(s, 'bossDmg');
export const passiveLumensMult = (s) => mult(s, 'lumens');
export const passiveXpMult = (s) => mult(s, 'xp');
export const passiveMaterialMult = (s) => mult(s, 'materiais');
export const passiveCritAdd = (s) => add(s, 'critChance');
export const passiveApsMult = (s) => 1 + add(s, 'atkSpeed');
export const passiveDefesaAdd = (s) => add(s, 'defesa');
export const passiveRegenAdd = (s) => add(s, 'regen');
export const passiveEliteBonus = (s) => add(s, 'faro');

// Progresso por ramo (nº de nós comprados / total) — p/ a UI.
export function ramoProgress(state, ramo) {
  const ids = NODE_IDS.filter((id) => NODES[id].ramo === ramo);
  const bought = ids.filter((id) => rankOf(state, id) > 0).length;
  return { bought, total: ids.length };
}

// ───── Compat shims (UI antiga de passivas — substituída no CP-7b) ─────
export const passivesUnlocked = (s) => (s.convergences || 0) >= 1;
export const passiveEcoMult = () => 1;
export const passiveMobBonus = () => 0;
export const passiveEnemyPen = () => 0;
export const passiveEnemyReduce = () => 0;
export const nextCost = () => 0;
export const canBuy = () => false;
export function buyPassive() { return false; }
export const groupUnlocked = () => false;
export const isMax = () => false;
export const treeProgress = () => ({ unlocked: 0, maxed: 0, total: 15 });
export { PASSIVE_TREES };
