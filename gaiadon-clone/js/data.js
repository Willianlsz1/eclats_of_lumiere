// ===== Static game data & balancing (single source of truth) =====
// Todo texto visível ao jogador em inglês. Comentários podem ficar em português.

// Regions cosméticas — puramente visuais, mudam a cada CONFIG.zonesPerRegion zones.
const REGIONS = [
  { name: "Plains of Aurin",      enemies: ["Slime", "Giant Rat", "Goblin"] },
  { name: "Whispering Forest",    enemies: ["Shadow Wolf", "Spider", "Treant"] },
  { name: "Frostbound Caverns",   enemies: ["Yeti", "Ice Golem", "Bat"] },
  { name: "Ashen Desert",         enemies: ["Scorpion", "Mummy", "Djinn"] },
  { name: "Gaiadon's Peak",       enemies: ["Young Dragon", "Chimera", "Titan"] },
];

// Slots de equipamento (data-driven — dá pra adicionar mais slots no futuro).
// Cada slot concede um ou mais Stats e tem um nome-base por raridade (cosmético).
const SLOTS = [
  { id: "Weapon", stats: ["Damage"],                   defaultName: "Sword" },
  { id: "Armor",  stats: ["Health"],                   defaultName: "Tunic" },
  { id: "Amulet", stats: ["Attack Speed", "Gold Find"], defaultName: "Pendant" },
];

// Afixos por slot, FIXOS por raridade. O item ativa os primeiros `rarity` afixos da
// lista (common=0, uncommon=1, rare=2, epic=3, legendary=4). Temáticos por slot.
// stats (frações): critRate, critDmg, dmgMult, hpMult, goldMult.
// Cada afixo: { stat, base, perLevel }. Valor = base + perLevel × nível do item.
// Ou seja, subir o NÍVEL do item também aumenta os afixos (não só o stat base).
const AFFIXES = {
  Weapon: [
    { stat: "critRate", base: 0.05, perLevel: 0.0003 }, // uncommon
    { stat: "critDmg",  base: 0.30, perLevel: 0.004 },  // rare
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003 },  // epic
    { stat: "critDmg",  base: 0.60, perLevel: 0.006 },  // legendary
  ],
  Armor: [
    { stat: "hpMult",   base: 0.20, perLevel: 0.004 },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "hpMult",   base: 0.35, perLevel: 0.006 },
    { stat: "dmgMult",  base: 0.20, perLevel: 0.003 },
  ],
  Amulet: [
    { stat: "goldMult", base: 0.25, perLevel: 0.005 },
    { stat: "dmgMult",  base: 0.10, perLevel: 0.002 },
    { stat: "critDmg",  base: 0.30, perLevel: 0.004 },
    { stat: "goldMult", base: 0.60, perLevel: 0.008 },
  ],
};

// Raridades: nome, multiplicador de Item Power, e CAP de nível (×10 por tier).
// A ORDEM importa (índice = tier). legendary tem cap "infinito".
const RARITIES = [
  { name: "common",    mult: 1.0, cap: 10 },
  { name: "uncommon",  mult: 1.5, cap: 100 },
  { name: "rare",      mult: 2.2, cap: 1000 },
  { name: "epic",      mult: 3.5, cap: 10000 },
  { name: "legendary", mult: 6.0, cap: Infinity },
];

// Upgrades de Ascensão: comprados com ESSENCE (moeda de prestígio).
// A ORDEM importa: game.js referencia por índice. "power" substitui o antigo
// multiplicador automático de essência.
// A ORDEM importa: game.js referencia por índice (0=power, 1=offlineEff, 2=offlineCap, 3=insight).
const ASCENSION_UPGRADES = [
  { id: "power",      name: "Power",       baseCost: 2, growth: 1.8, value: 0.50, unit: "damage & gold", multiplicative: true },
  { id: "offlineEff", name: "Dreamcatcher", baseCost: 3, growth: 2.5, value: 0.05, unit: "offline rate", percent: true, maxLevel: 7 },
  { id: "offlineCap", name: "Hourglass",    baseCost: 5, growth: 2.5, value: 1,    unit: "offline cap", suffix: "h", maxLevel: 22 },
  { id: "insight",    name: "Insight",      baseCost: 3, growth: 1.7, value: 0.25, unit: "essence gained", percent: true },
];

// ===== Painel de balanceamento — TODAS as alavancas num só lugar =====
const CONFIG = {
  player: {
    baseDamage: 5, baseHp: 50,
    damagePerLevel: 1.5, hpPerLevel: 8,
    baseAttackSpeed: 1.0, // ataques por segundo
  },
  combat: { baseCritMult: 2.0 }, // crítico base = ×2 (afixos de Crit Damage somam a isto)
  enemy: {
    baseHp: 4, hpGrowth: 1.20,      // HP escala com a zone (primeiro abate <1s)
    baseDmg: 3, dmgGrowth: 1.18,
    baseGold: 6, goldGrowth: 1.16,
    baseXp: 4, xpGrowth: 1.12,
    killsBase: 10, killsPerZone: 3, // abates p/ limpar = killsBase + (zone-1)*killsPerZone
    damageFactor: 0.3,              // dano por segundo de CADA inimigo do pack (vários atacam juntos)
  },
  boss: {
    everyZones: 10,                 // Boss Zone a cada N zones
    hpMult: 8,                      // Health do Boss = Enemy normal × isto
    goldMult: 5, xpMult: 5, shardMult: 5, // recompensas extras do Boss
  },
  // Pack: quantos inimigos aparecem juntos (todos atacam; você foca um por vez).
  pack: {
    base: 1, perZones: 7, max: 5,   // size = base + floor((zone-1)/perZones), teto max
    // size = 1 (zone 1), 3 (zone 15), 5 (zone 29+). Boss vem sempre sozinho.
  },
  // Equipamento: Item Power = powerPerLevel × level × mult(raridade).
  gear: {
    powerPerLevel: 1,
    levelCostBase: 5, levelCostGrowth: 1.11,  // custo de GOLD por nível
    rarityCostBase: 5, rarityCostGrowth: 8,   // custo de SHARDS por tier de raridade
  },
  // Shards (material) dropam dos inimigos e sobem a raridade do equipamento.
  shards: {
    basePerKill: 1, perZone: 0.2,   // por abate, escala com a zone
    bossMult: 5,
  },
  // Como o Item Power vira bônus de cada stat:
  itemStats: {
    healthPerPower: 3,          // Armor: +power × 3 de Health
    attackSpeedPerPower: 0.01,  // Amulet (Attack Speed): +power × 0.01 golpes/s
    goldFindPerPower: 0.02,     // Amulet (Gold Find): +power × 0.02 de ouro
    // Weapon: Damage usa o power 1:1 (sem fator).
  },
  xp: { base: 20, growth: 1.25 }, // xpToNext = base * growth^(level-1)
  ascension: { unlockZone: 25, zoneExp: 1.5, zoneDiv: 3, levelDiv: 5 },
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.60, // base + offlineEff*value, teto 0.60
    startCapHours: 2, capMaxHours: 24,          // base 2h + offlineCap*value, teto 24h
  },
  zonesPerRegion: 10, // muda a region cosmética a cada 10 zones
};

if (typeof module !== "undefined") {
  module.exports = { REGIONS, SLOTS, RARITIES, AFFIXES, ASCENSION_UPGRADES, CONFIG };
}
