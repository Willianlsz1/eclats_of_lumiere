// Motor de Gear — GDD §13 / §10.5.5 (Passo 3 do wiring).
// 6 peças fixas, cada uma com nível (Lumens) e raridade. Cada peça tem 1 afixo
// PRIMÁRIO inerente + SECUNDÁRIOS que a raridade destrava em ordem (determinístico).
// Modelo de valor calibrado (Camada 3): linear × motor exponencial (Luminous+);
// secundário = primário^0.30 (30% das décadas). Cap de nível da raridade topo sobe
// +capPerAsc por Ascension (motor sem-teto). Persiste sempre (não reseta).

import { GEAR, GEAR_RARITIES } from '../data/constants.js';

const maxRarity = GEAR_RARITIES.length - 1;

// ───── Modelo de valor de um afixo ─────

// multiplicador do afixo PRIMÁRIO num nível/raridade: (1 + L×pct×rarityMult) × motor^L
export function primaryMult(level, rarity) {
  const linear = 1 + level * GEAR.affixPctRate * GEAR.rarityMult[rarity];
  const expo = rarity >= GEAR.affixMultFromRarity ? GEAR.affixMultBase ** level : 1;
  return linear * expo;
}
// afixo SECUNDÁRIO multiplicativo = primário^0.30 (30% das décadas — gear.mjs corrigido)
export const secondaryMult = (level, rarity) => primaryMult(level, rarity) ** GEAR.secondaryExp;

// crit chance (afixo plano): nível × critPerLevel × rarityMult
export const critOf = (level, rarity) => level * GEAR.critPerLevel * GEAR.rarityMult[rarity];
// crit damage (afixo plano, bônus sobre a base): nível × critDmgPerLevel × rarityMult
export const critDmgOf = (level, rarity) => level * GEAR.critDmgPerLevel * GEAR.rarityMult[rarity];

// Secundários ATIVOS de uma peça conforme a raridade (secondary[i] ativo se rarity ≥ i+1)
export function activeSecondaries(def, rarity) {
  return def.secondary.slice(0, rarity);
}

// ───── Agregação por tipo de afixo ─────

// Produto dos afixos MULTIPLICATIVOS de um tipo (primário + secundários ativos a 30%)
function gearMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= primaryMult(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) m *= secondaryMult(p.level, p.rarity);
    }
  }
  return m;
}

export const gearDamageMult   = (s) => gearMultBy(s, 'dmg');
export const gearHpMult       = (s) => gearMultBy(s, 'hp');
export const gearDefesaMult   = (s) => gearMultBy(s, 'defesa');   // consumido na mitigação (Passo 2)
export const gearApsMult      = (s) => gearMultBy(s, 'aps');      // ⛓️ consumidor no apsCap (passo futuro)
export const gearLumensMult   = (s) => gearMultBy(s, 'lumens');
export const gearXpMult       = (s) => gearMultBy(s, 'xp');
export const gearRegenMult    = (s) => gearMultBy(s, 'regen');    // ⛓️ consumidor no regen (passo futuro)
export const gearBossDmgMult  = (s) => gearMultBy(s, 'bossDmg');  // ⛓️ consumidor no hit em boss (passo futuro)
export const gearMateriaisMult = (s) => gearMultBy(s, 'materiais'); // ⛓️ consumidor no drop (Passo 4)

// Crit chance: soma plana (primário Grasp + secundário Resonance a 30%)
export function gearCritAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'crit') a += critOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'crit') a += critOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a;
}

// Crit damage: bônus plano sobre a base ×2 (só secundário — Edge/Grasp), a 30% como secundário.
export function gearCritDmgAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'critDmg') a += critDmgOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'critDmg') a += critDmgOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a; // ⛓️ consumidor em critDamageMult (wiring quando o Crit fechar — §16.6)
}

// ───── Custos e gates ─────

// Cap de nível da peça: a raridade TOPO (Converged) ganha +capPerAsc por Ascension (sem-teto §13)
export function levelCapFor(piece, state) {
  const base = GEAR.levelCap[piece.rarity];
  return piece.rarity === maxRarity ? base + (state.ascensions || 0) * GEAR.capPerAsc : base;
}
export const atLevelCap = (piece, state) => piece.level >= levelCapFor(piece, state);

// custo de upar 1 nível = base × ramp^nível × costMult[raridade]
export function levelCost(piece) {
  return GEAR.levelCostBase * GEAR.levelCostRamp ** piece.level * GEAR.costMult[piece.rarity];
}

// custo (Lumens) p/ subir à PRÓXIMA raridade; Infinity se já no topo. ⏳ Passo 4 = materiais.
export function rarityUpCost(piece) {
  if (piece.rarity >= maxRarity) return Infinity;
  return GEAR.rarityUpCost[piece.rarity + 1];
}

export function canRarityUp(state, key) {
  const p = state.gear[key];
  return p.rarity < maxRarity && atLevelCap(p, state) && state.lumens >= rarityUpCost(p);
}

// ───── Ações (gastam Lumens) ─────

export function buyLevel(state, key) {
  const p = state.gear[key];
  if (atLevelCap(p, state)) return false;
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
