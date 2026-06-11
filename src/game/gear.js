// Motor de Gear — GDD §13. ⏳ VALORES PROVISÓRIOS (ver GEAR em constants.js).
// 6 peças fixas, cada uma com nível (Lumens) e raridade (Lumens, gate por nível
// máximo). Os afixos somam aos fatores gear_* das fórmulas do §4/§12.
// Persiste sempre (não reseta na Convergence).

import { GEAR, GEAR_RARITIES } from '../data/constants.js';

const maxRarity = GEAR_RARITIES.length - 1;

// Afixo multiplicativo de uma peça (dmg/hp/xp/lumens): 1 + nível × perLevel × rarityMult
export function affixMult(piece) {
  return 1 + piece.level * GEAR.affixPerLevel * GEAR.rarityMult[piece.rarity];
}

// Afixo de crit (chance plana adicionada) de uma peça
export function critAdd(piece) {
  return piece.level * GEAR.critPerLevel * GEAR.rarityMult[piece.rarity];
}

// Agrega todas as peças de um tipo de afixo (produto p/ multiplicadores)
function gearMult(state, affix) {
  let m = 1;
  for (const p of GEAR.pieces) {
    if (p.affix === affix) m *= affixMult(state.gear[p.key]);
  }
  return m;
}

export const gearDamageMult = (s) => gearMult(s, 'dmg');
export const gearHpMult     = (s) => gearMult(s, 'hp');
export const gearXpMult     = (s) => gearMult(s, 'xp');
export const gearLumensMult = (s) => gearMult(s, 'lumens');

// Crit é soma plana das peças de crit (grasp)
export function gearCritAdd(state) {
  let a = 0;
  for (const p of GEAR.pieces) {
    if (p.affix === 'crit') a += critAdd(state.gear[p.key]);
  }
  return a;
}

// ───── Custos e gates ─────

export const atLevelCap = (piece) => piece.level >= GEAR.levelCap[piece.rarity];

// custo de upar 1 nível = base × ramp^nível × costMult[raridade]
export function levelCost(piece) {
  return GEAR.levelCostBase * GEAR.levelCostRamp ** piece.level * GEAR.costMult[piece.rarity];
}

// custo (Lumens) p/ subir à PRÓXIMA raridade; Infinity se já no topo
export function rarityUpCost(piece) {
  if (piece.rarity >= maxRarity) return Infinity;
  return GEAR.rarityUpCost[piece.rarity + 1];
}

export function canRarityUp(state, key) {
  const p = state.gear[key];
  return p.rarity < maxRarity && atLevelCap(p) && state.lumens >= rarityUpCost(p);
}

// ───── Ações (gastam Lumens) ─────

export function buyLevel(state, key) {
  const p = state.gear[key];
  if (atLevelCap(p)) return false;
  const cost = levelCost(p);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  p.level += 1;
  return true;
}

// Compra n níveis (ou até o cap / acabar Lumens); n grande = "MAX"
export function buyLevels(state, key, n) {
  let bought = 0;
  for (let i = 0; i < n; i++) {
    if (!buyLevel(state, key)) break;
    bought++;
  }
  return bought;
}

export function doRarityUp(state, key) {
  if (!canRarityUp(state, key)) return false;
  const p = state.gear[key];
  state.lumens -= rarityUpCost(p);
  p.rarity += 1; // mantém o nível: segue subindo até o cap maior da nova raridade
  return true;
}
