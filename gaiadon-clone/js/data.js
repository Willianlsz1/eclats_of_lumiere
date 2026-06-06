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

const SLOTS = ["Weapon", "Armor", "Amulet"];

// Raridades: nome (EN), peso de drop (chance relativa), multiplicador de stats.
const RARITIES = [
  { name: "common",    weight: 60, mult: 1.0 },
  { name: "uncommon",  weight: 25, mult: 1.5 },
  { name: "rare",      weight: 10, mult: 2.2 },
  { name: "epic",      weight: 4,  mult: 3.5 },
  { name: "legendary", weight: 1,  mult: 6.0 },
];

const ITEM_NAMES = {
  "Weapon": ["Sword", "Axe", "Staff", "Dagger", "Spear"],
  "Armor":  ["Breastplate", "Chainmail", "Tunic", "Cuirass"],
  "Amulet": ["Pendant", "Ring", "Talisman", "Medallion"],
};

// Loja: id, nome (EN), custo base, fator de crescimento por nível, valor por nível.
// A ORDEM importa: game.js referencia SHOP_UPGRADES[0..5] por índice.
const SHOP_UPGRADES = [
  { id: "dmg",        name: "Strength (+damage)",        baseCost: 10,  growth: 1.15, value: 2 },
  { id: "hp",         name: "Vitality (+health)",        baseCost: 15,  growth: 1.15, value: 10 },
  { id: "spd",        name: "Agility (+attack speed)",   baseCost: 25,  growth: 1.20, value: 0.05 },
  { id: "gold",       name: "Greed (+gold)",             baseCost: 40,  growth: 1.18, value: 0.10 },
  { id: "offlineEff", name: "Dreamcatcher (+offline %)", baseCost: 100, growth: 1.30, value: 0.05 },
  { id: "offlineCap", name: "Hourglass (+offline cap)",  baseCost: 150, growth: 1.35, value: 1 }, // +1h por nível
];

// ===== Painel de balanceamento — TODAS as alavancas num só lugar =====
const CONFIG = {
  player: {
    baseDamage: 5, baseHp: 50,
    damagePerLevel: 1.5, hpPerLevel: 8,
    baseAttackSpeed: 1.0, // ataques por segundo
  },
  enemy: {
    baseHp: 20, hpGrowth: 1.18,     // HP escala com a zone
    baseDmg: 3, dmgGrowth: 1.15,
    baseGold: 6, goldGrowth: 1.14,
    baseXp: 4, xpGrowth: 1.12,
    killsToClear: 10,               // abates para limpar uma zone
    damageFactor: 0.5,              // fração do dano do inimigo aplicada por segundo
  },
  boss: {
    everyZones: 10,                 // Boss Zone a cada N zones (10, 20, 30...)
    hpMult: 8,                      // Health do Boss = Enemy normal × isto
    minRarity: "rare",              // drop garantido de rarity >= isto
    goldMult: 5, xpMult: 5,         // recompensa extra do Boss
  },
  drops: {
    baseChance: 0.22,               // chance de drop por abate (inimigo normal)
    guaranteedFirstKills: 3,        // os primeiros N abates do save SEMPRE dropam
    powerBase: 3, powerPerZone: 1.5,
    inventoryMax: 24,
    // Stats que o Amulet pode sortear (o slot "surpresa"):
    amuletStats: ["Attack Speed", "Gold Find"],
  },
  xp: { base: 20, growth: 1.25 },   // xpToNext = base * growth^(level-1)
  ascension: { unlockZone: 25, perEssencePct: 0.10, zoneExp: 1.5, zoneDiv: 3, levelDiv: 5 },
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.60, // base + offlineEff*value, teto 0.60
    startCapHours: 2, capMaxHours: 8,           // base + offlineCap*value, teto 8h
  },
  // Como o Item Power vira bônus de cada stat:
  itemStats: {
    healthPerPower: 3,          // Armor: +power × 3 de Health
    attackSpeedPerPower: 0.01,  // Amulet (Attack Speed): +power × 0.01 golpes/s
    goldFindPerPower: 0.02,     // Amulet (Gold Find): +power × 0.02 (×2%/power) de ouro
    // Weapon: Damage usa o power 1:1 (sem fator).
  },
  zonesPerRegion: 10, // muda a region cosmética a cada 10 zones
};

if (typeof module !== "undefined") {
  module.exports = { REGIONS, SLOTS, RARITIES, ITEM_NAMES, SHOP_UPGRADES, CONFIG };
}
