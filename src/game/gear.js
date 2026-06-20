// Gear — CP-4a (redesign Mapa 1): MOTOR (afixos, drop, inventário, equipar, descarte).
// Peça dropa com afixos rolados num range escalado pela área (primário cheio,
// secundário ×0.5). Raridade = nº de afixos (Common 1 → Legendary 5). O upgrade
// por Lumens (nível → +% afixos) e Material (subir raridade/forjar) = CP-5.
// Multiplicadores de gear lidos do EQUIPADO (state.equipped) por tipo de afixo.

import { GEAR, UPGRADE } from '../data/constants.js';
import { passiveMaterialMult } from './passives.js';

const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

// ───── Slots e pools de afixo (docs/eclats_afixos_drop_v1.md) ─────
export const SLOTS = ['edge', 'grasp', 'reson', 'vigil', 'veil', 'band'];
export const SLOT_POOL = {
  edge:  { primary: 'dmg',        sec: ['critDamage', 'bossDmg', 'critChance', 'atkSpeed'] },
  grasp: { primary: 'critChance', sec: ['critDamage', 'atkSpeed', 'dmg', 'bossDmg'] },
  reson: { primary: 'atkSpeed',   sec: ['critChance', 'dmg', 'regen', 'bossDmg'] },
  vigil: { primary: 'hp',         sec: ['defesa', 'regen', 'dmg', 'lumens'] },
  veil:  { primary: 'defesa',     sec: ['hp', 'regen', 'xp', 'materiais'] },
  band:  { primary: 'lumens',     sec: ['xp', 'materiais', 'dmg', 'regen'] },
};

// Raridades: 0 Common · 1 Uncommon · 2 Rare · 3 Epic · 4 Legendary. afixos = raridade+1.
export const RARITY_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
export const MAX_RARITY = RARITY_NAMES.length - 1;

// ───── Ranges de valor por afixo (âncoras área 1 e área 9 — PRIMÁRIO) ─────
// [a1lo, a1hi, a9lo, a9hi]. % como fração; atkSpeed flat /s; regen fração /s.
const AFFIX_RANGE = {
  dmg:        [0.08, 0.15, 0.25, 0.45],
  hp:         [0.08, 0.15, 0.25, 0.45],
  critChance: [0.02, 0.05, 0.08, 0.15],
  critDamage: [0.15, 0.30, 0.50, 1.00],
  atkSpeed:   [0.05, 0.10, 0.15, 0.30],
  bossDmg:    [0.20, 0.40, 0.60, 1.20],
  defesa:     [0.03, 0.08, 0.15, 0.30],
  regen:      [0.002, 0.005, 0.010, 0.020],
  lumens:     [0.10, 0.25, 0.50, 1.20],
  xp:         [0.08, 0.20, 0.40, 1.00],
  materiais:  [0.10, 0.25, 0.50, 1.20],
};

// Rola o valor de um afixo na área (1..9). Secundário = ×0.5.
function rollAffixValue(type, area, secondary) {
  const r = AFFIX_RANGE[type] || [0, 0, 0, 0];
  const t = Math.max(0, Math.min(1, (area - 1) / 8));
  const lo = r[0] + (r[2] - r[0]) * t;
  const hi = r[1] + (r[3] - r[1]) * t;
  return rnd(lo, hi) * (secondary ? 0.5 : 1);
}

// Embaralha (Fisher–Yates) — escolher secundários sem repetir.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Gera uma peça nova de um slot, raridade e área.
export function rollItem(state, slot, rarity, area) {
  const pool = SLOT_POOL[slot];
  const affixes = [{ type: pool.primary, value: rollAffixValue(pool.primary, area, false), secondary: false }];
  const secCount = Math.max(0, rarity); // raridade r → r secundários (+1 primário = r+1 afixos)
  for (const type of shuffle(pool.sec).slice(0, secCount)) {
    affixes.push({ type, value: rollAffixValue(type, area, true), secondary: true });
  }
  state.itemSeq = (state.itemSeq || 0) + 1;
  return { id: state.itemSeq, slot, rarity, level: 0, area, affixes };
}

// ───── Drop por kill ─────
// Teto de raridade por área: 1–3 Common · 4–7 +Uncommon · 8–9 +Rare.
export function maxRarityForArea(subarea) {
  if (subarea >= 8) return 2;
  if (subarea >= 4) return 1;
  return 0;
}
const DROP_CHANCE = [0.010, 0.006, 0.003]; // Common / Uncommon / Rare (por kill, mob comum)
const INV_CAP = 200;

// Rola drops de um kill (rolls independentes por raridade permitida). Empurra no inventário.
export function rollDrop(state, mob) {
  const mult = mob.isBoss ? 7 : mob.isElite ? 4 : 1;
  const maxR = maxRarityForArea(state.subarea);
  for (let r = 0; r <= maxR; r++) {
    if (Math.random() < DROP_CHANCE[r] * mult) {
      if (state.inventory.length >= INV_CAP) break; // cheio (4b: aviso/auto-descarte)
      const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
      state.inventory.push(rollItem(state, slot, r, state.subarea));
    }
  }
}

// ───── Inventário: equipar / descartar ─────
export function equipItem(state, itemId) {
  const idx = state.inventory.findIndex((it) => it.id === itemId);
  if (idx < 0) return false;
  const item = state.inventory.splice(idx, 1)[0];
  const prev = state.equipped[item.slot];
  if (prev) state.inventory.push(prev); // devolve a antiga ao inventário
  state.equipped[item.slot] = item;
  return true;
}

const DISCARD_MAT = [1, 3, 8, 20, 50]; // material por raridade ao descartar
export function discardItem(state, itemId) {
  const idx = state.inventory.findIndex((it) => it.id === itemId);
  if (idx < 0) return false;
  const item = state.inventory.splice(idx, 1)[0];
  const tier = Math.min(item.rarity, state.materiais.length - 1);
  state.materiais[tier] += (DISCARD_MAT[item.rarity] || 1) * passiveMaterialMult(state);
  return true;
}

// ───── Upgrade por Lumens (nível → +% em todos os afixos) — CP-5 ─────
export const growthOf = (rarity) => (UPGRADE.capMult[rarity] - 1) / UPGRADE.capLevel[rarity];
export const levelMult = (item) => 1 + (item.level || 0) * growthOf(item.rarity); // ×nos afixos
export const capLevelOf = (item) => UPGRADE.capLevel[item.rarity];
export const atCap = (item) => (item.level || 0) >= capLevelOf(item);
export const itemLevelCost = (item) => UPGRADE.lumCostBase * ((item.level || 0) + 1) * UPGRADE.lumCostMult[item.rarity];

// Acha uma peça por id no inventário ou equipada.
function findItem(state, id) {
  const inv = state.inventory.find((it) => it.id === id);
  if (inv) return inv;
  for (const slot of SLOTS) { const it = state.equipped[slot]; if (it && it.id === id) return it; }
  return null;
}

export function upgradeItem(state, id) {
  const it = findItem(state, id);
  if (!it || atCap(it)) return false;
  const cost = itemLevelCost(it);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  it.level = (it.level || 0) + 1;
  return true;
}

// ───── Material: melhorar (subir raridade) / forjar / refino — CP-5 ─────
export const rarityUpMatCost = (item) => (item.rarity < MAX_RARITY ? UPGRADE.rarityUpMat[item.rarity] : Infinity);
export function canRarityUpItem(state, id) {
  const it = findItem(state, id);
  return !!it && it.rarity < MAX_RARITY && state.materiais[it.rarity] >= rarityUpMatCost(it);
}
export function rarityUpItem(state, id) {
  const it = findItem(state, id);
  if (!canRarityUpItem(state, id)) return false;
  state.materiais[it.rarity] -= rarityUpMatCost(it);
  // adiciona 1 secundário novo (do pool, ainda não presente), rolado na área da peça
  const have = new Set(it.affixes.map((a) => a.type));
  const choices = SLOT_POOL[it.slot].sec.filter((t) => !have.has(t));
  if (choices.length) {
    const type = choices[Math.floor(Math.random() * choices.length)];
    it.affixes.push({ type, value: rollAffixValue(type, it.area || 1, true), secondary: true });
  }
  it.rarity += 1; // sobe a raridade → sobe o cap de nível também
  return true;
}

export const forgeCost = (tier) => ({ mat: UPGRADE.forgeMat[tier], lum: UPGRADE.forgeLum[tier] });
export function canForge(state, slot, tier) {
  const c = forgeCost(tier);
  return tier >= 0 && tier <= MAX_RARITY && state.materiais[tier] >= c.mat && state.lumens >= c.lum
    && state.inventory.length < INV_CAP;
}
export function forgeItem(state, slot, tier) {
  if (!canForge(state, slot, tier)) return false;
  const c = forgeCost(tier);
  state.materiais[tier] -= c.mat;
  state.lumens -= c.lum;
  state.inventory.push(rollItem(state, slot, tier, state.subarea));
  return true;
}

export const canRefineMat = (state, fromTier) =>
  fromTier >= 0 && fromTier < state.materiais.length - 1 && state.materiais[fromTier] >= UPGRADE.refineRatio;
export function refineMat(state, fromTier) {
  if (!canRefineMat(state, fromTier)) return false;
  state.materiais[fromTier] -= UPGRADE.refineRatio;
  state.materiais[fromTier + 1] += 1;
  return true;
}

// ───── Multiplicadores lidos do EQUIPADO (afixos × nível da peça) ─────
function sumAffix(state, type) {
  let s = 0;
  for (const slot of SLOTS) {
    const it = state.equipped && state.equipped[slot];
    if (!it) continue;
    const lm = levelMult(it);
    for (const a of it.affixes) if (a.type === type) s += a.value * lm;
  }
  return s;
}

export const gearDamageMult = (s) => 1 + sumAffix(s, 'dmg');
export const gearHpMult = (s) => 1 + sumAffix(s, 'hp');
export const gearDefesaMult = (s) => 1 + sumAffix(s, 'defesa');
export const gearLumensMult = (s) => 1 + sumAffix(s, 'lumens');
export const gearXpMult = (s) => 1 + sumAffix(s, 'xp');
export const gearMaterialDropMult = (s) => 1 + sumAffix(s, 'materiais');
export const gearBossDmgMult = (s) => 1 + sumAffix(s, 'bossDmg');
export const gearCritAdd = (s) => sumAffix(s, 'critChance');
export const gearCritDmgAdd = (s) => sumAffix(s, 'critDamage');
export const gearApsFlat = (s) => sumAffix(s, 'atkSpeed');
export const gearRegenBonus = (s) => sumAffix(s, 'regen');

// ───── Compat shims (UI antiga de gear/forge — substituída no CP-4b/5) ─────
export const gearApsMult = () => 1;
export const gearRegenMult = () => 1;
export const gearDamageFlat = () => 0;
export const gearHpFlat = () => 0;
export const gearDefesaFlat = () => 0;
export const primaryMult = () => 1;
export const secondaryMult = () => 1;
export const critOf = () => 0;
export const critDmgOf = () => 0;
export const activeSecondaries = () => [];
export const levelCapFor = (piece) => ((GEAR && GEAR.levelCap) ? (GEAR.levelCap[(piece && piece.rarity) || 0] ?? 50) : 50);
export const atLevelCap = () => false;
export const levelCost = () => 10;
export const rarityUpTier = (piece) => (piece && piece.rarity) || 0;
export const rarityUpCost = () => Infinity;
export const canRarityUp = () => false;
export function buyLevel() { return false; }
export function buyLevels() { return 0; }
export function doRarityUp() { return false; }
export const canRefino = () => false;
export function doRefino() { return false; }
