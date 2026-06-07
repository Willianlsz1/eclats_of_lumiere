// ===== Static game data & balancing (single source of truth) =====
// Todo texto visível ao jogador em inglês. Comentários podem ficar em português.

// ===== Asset paths — imagens geradas por AI (Gemini) =====
// Todas as imagens ficam em assets/. Se o arquivo não existir, o código usa emoji fallback.
// Para adicionar um asset: salve a imagem no caminho indicado e ela aparece automaticamente.
const ASSETS = {
  // Hero portraits — um por tier. Caminho: assets/hero/<tier>.png
  hero: {
    common:    "assets/hero/adventurer.png",
    uncommon:  "assets/hero/warrior.png",
    rare:      "assets/hero/champion.png",
    epic:      "assets/hero/legend.png",
    legendary: "assets/hero/mythic.png",
  },
  // Region backgrounds — fundo do enemy card. Caminho: assets/regions/<region>.png
  regions: {
    "region-plains":  "assets/regions/plains.png",
    "region-forest":  "assets/regions/forest.png",
    "region-caverns": "assets/regions/caverns.png",
    "region-desert":  "assets/regions/desert.png",
    "region-peak":    "assets/regions/peak.png",
  },
  // Enemy illustrations — um por inimigo. Caminho: assets/enemies/<region>/<name>.png
  // Nome do arquivo = nome do inimigo em lowercase, espaços → hífens.
  enemies: {
    plains:  { "Slime": "assets/enemies/plains/slime.png", "Giant Rat": "assets/enemies/plains/giant-rat.png", "Goblin": "assets/enemies/plains/goblin.png" },
    forest:  { "Shadow Wolf": "assets/enemies/forest/shadow-wolf.png", "Spider": "assets/enemies/forest/spider.png", "Treant": "assets/enemies/forest/treant.png" },
    caverns: { "Yeti": "assets/enemies/caverns/yeti.png", "Ice Golem": "assets/enemies/caverns/ice-golem.png", "Bat": "assets/enemies/caverns/bat.png" },
    desert:  { "Bone Stalker": "assets/enemies/desert/bone-stalker.png", "Dune Lord": "assets/enemies/desert/dune-lord.png", "Hex Dancer": "assets/enemies/desert/hex-dancer.png" },
    peak:    { "Young Dragon": "assets/enemies/peak/young-dragon.png", "Obsidian Knight": "assets/enemies/peak/obsidian-knight.png", "Hollow King": "assets/enemies/peak/hollow-king.png" },
  },
  // Equipment icons — um por slot. Caminho: assets/equipment/<slot>.png
  equipment: {
    Weapon: "assets/equipment/weapon.png",
    Armor:  "assets/equipment/armor.png",
    Amulet: "assets/equipment/amulet.png",
    Ring:   "assets/equipment/ring.png",
    Gloves: "assets/equipment/gloves.png",
    Helmet: "assets/equipment/helmet.png",
  },
};

// Cache de imagens que existem (checadas via Image.onload). Evita flicker.
const _assetCache = {};
function assetExists(path) {
  if (path in _assetCache) return _assetCache[path];
  _assetCache[path] = false;
  const img = new Image();
  img.onload = () => { _assetCache[path] = true; };
  img.onerror = () => { _assetCache[path] = false; };
  img.src = path;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// World Map: Regiões selecionáveis + Dificuldades
// ═══════════════════════════════════════════════════════════════════════
// Cada região é uma área distinta do mundo com inimigos próprios, um boss final,
// e um basePower que define a escala de dificuldade.
// Progressão: Plains → Forest → Caverns → Desert → Peak.
// Dentro de cada região: Normal → Hard → Nightmare (dificuldades crescentes).
const REGIONS = [
  { id: "plains", name: "Plains of Aurin", cssClass: "region-plains",
    basePower: 100, icon: "🌾",
    description: "Gentle grasslands where fledgling adventurers test their mettle.",
    enemies: ["Slime", "Giant Rat", "Goblin"],
    boss: "Aurin Guardian",
    emojis: { "Slime": "🟢", "Giant Rat": "🐀", "Goblin": "👺", "Aurin Guardian": "👑" },
  },
  { id: "forest", name: "Whispering Forest", cssClass: "region-forest",
    basePower: 300, icon: "🌲",
    description: "Dense woods where predators lurk beneath ancient canopies.",
    enemies: ["Shadow Wolf", "Spider", "Treant"],
    boss: "Ancient Treant",
    emojis: { "Shadow Wolf": "🐺", "Spider": "🕷️", "Treant": "🌳", "Ancient Treant": "👑" },
  },
  { id: "caverns", name: "Frostbound Caverns", cssClass: "region-caverns",
    basePower: 900, icon: "❄️",
    description: "Frozen depths where ice and darkness consume the unwary.",
    enemies: ["Yeti", "Ice Golem", "Bat"],
    boss: "Frost Wyrm",
    emojis: { "Yeti": "❄️", "Ice Golem": "🧊", "Bat": "🦇", "Frost Wyrm": "👑" },
  },
  { id: "desert", name: "Ashen Desert", cssClass: "region-desert",
    basePower: 2700, icon: "🏜️",
    description: "Sun-scorched sands hiding undead horrors and ancient curses.",
    enemies: ["Bone Stalker", "Dune Lord", "Hex Dancer"],
    boss: "Desert Pharaoh",
    emojis: { "Bone Stalker": "🦴", "Dune Lord": "🐏", "Hex Dancer": "🎭", "Desert Pharaoh": "👑" },
  },
  { id: "peak", name: "Gaiadon's Peak", cssClass: "region-peak",
    basePower: 8100, icon: "⛰️",
    description: "The summit where the god Gaiadon awaits the worthy.",
    enemies: ["Young Dragon", "Obsidian Knight", "Hollow King"],
    boss: "Gaiadon, the Eternal",
    emojis: { "Young Dragon": "🐉", "Obsidian Knight": "🗡️", "Hollow King": "👑", "Gaiadon, the Eternal": "⚡" },
  },
];

// Dificuldades: cada uma multiplica stats e rewards dos inimigos.
// waves = número de waves antes do boss. Boss é sempre a wave final.
// Normal: introdutório. Hard: elites aparecem. Nightmare: elites + champions.
const DIFFICULTIES = [
  { id: "normal",    name: "Normal",    statMult: 1,  dropMult: 1,  waves: 5,  cssClass: "diff-normal" },
  { id: "hard",      name: "Hard",      statMult: 5,  dropMult: 8,  waves: 10, cssClass: "diff-hard" },
  { id: "nightmare", name: "Nightmare", statMult: 25, dropMult: 50, waves: 15, cssClass: "diff-nightmare" },
];

// Slots de equipamento (data-driven — dá pra adicionar mais slots no futuro).
const SLOTS = [
  { id: "Weapon", stats: ["Damage"],                   defaultName: "Sword"   },
  { id: "Armor",  stats: ["Health"],                   defaultName: "Tunic"   },
  { id: "Amulet", stats: ["Attack Speed", "Gold Find"], defaultName: "Pendant" },
  { id: "Ring",   stats: ["Shard Find"],               defaultName: "Band"    },
  { id: "Gloves", stats: ["Crit Damage"],              defaultName: "Grips"   },
  { id: "Helmet", stats: ["Boss Damage"],              defaultName: "Crown"   },
];

// Afixos por slot, FIXOS por raridade.
const AFFIXES = {
  Weapon: [
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "critDmg",  base: 0.30, perLevel: 0.004 },
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003 },
    { stat: "critDmg",  base: 0.60, perLevel: 0.006 },
  ],
  Armor: [
    { stat: "hpMult",   base: 0.20, perLevel: 0.004 },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "hpMult",   base: 0.35, perLevel: 0.006 },
    { stat: "dmgMult",  base: 0.20, perLevel: 0.003 },
  ],
  Amulet: [
    { stat: "goldMult", base: 0.25, perLevel: 0.005 },
    { stat: "xpMult",   base: 0.25, perLevel: 0.005 },
    { stat: "goldMult", base: 0.50, perLevel: 0.007 },
    { stat: "xpMult",   base: 0.50, perLevel: 0.008 },
  ],
  Ring: [
    { stat: "shardMult", base: 0.20, perLevel: 0.004 },
    { stat: "xpMult",    base: 0.20, perLevel: 0.004 },
    { stat: "shardMult", base: 0.40, perLevel: 0.006 },
    { stat: "goldMult",  base: 0.30, perLevel: 0.005 },
  ],
  Gloves: [
    { stat: "critDmg",  base: 0.20, perLevel: 0.003  },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003  },
    { stat: "critDmg",  base: 0.50, perLevel: 0.006  },
  ],
  Helmet: [
    { stat: "bossDmg", base: 0.15, perLevel: 0.003 },
    { stat: "hpMult",  base: 0.20, perLevel: 0.004 },
    { stat: "bossDmg", base: 0.30, perLevel: 0.005 },
    { stat: "dmgMult", base: 0.20, perLevel: 0.003 },
  ],
};

// Raridades: nome, multiplicador de Item Power, e CAP de nível.
const RARITIES = [
  { name: "common",    mult: 1.0, cap: 25 },
  { name: "uncommon",  mult: 1.5, cap: 75 },
  { name: "rare",      mult: 2.2, cap: 150 },
  { name: "epic",      mult: 3.5, cap: 300 },
  { name: "legendary", mult: 6.0, cap: Infinity },
];

// Tiers de classe do herói.
const TIERS = [
  { name: "Adventurer", minAsc: 0,    mult: 1.06, spike: 1    },
  { name: "Warrior",    minAsc: 50,   mult: 1.08, spike: 10   },
  { name: "Champion",   minAsc: 200,  mult: 1.10, spike: 50   },
  { name: "Legend",     minAsc: 500,  mult: 1.12, spike: 200  },
  { name: "Mythic",     minAsc: 1000, mult: 1.15, spike: 1000 },
];

// ===== Painel de balanceamento — TODAS as alavancas num só lugar =====
const CONFIG = {
  player: {
    baseDamage: 5, baseHp: 50,
    damagePerLevel: 1.5, hpPerLevel: 8,
    baseAttackSpeed: 1.0,
  },
  combat: { baseCritMult: 2.0 },
  // Inimigos: stats derivados de region.basePower × fatores.
  // Plains Normal Wave 1: HP=4, DMG=3, Gold=6, XP=4 (preserva o feel original).
  enemy: {
    hpFactor:   0.04,   // HP  = basePower × hpFactor × statMult × waveMult
    dmgFactor:  0.03,   // DMG = basePower × dmgFactor × statMult × waveMult
    goldFactor: 0.06,   // Gold = basePower × goldFactor × dropMult × waveMult
    xpFactor:   0.04,   // XP  = basePower × xpFactor × dropMult × waveMult
    waveGrowth: 1.15,   // inimigos ficam 15% mais fortes a cada wave (compound)
    damageFactor: 0.3,  // dano por segundo de CADA inimigo do pack
    ascGrowth: 1.06,    // HP e DMG dos inimigos × 1.06 por ascensão do jogador
  },
  boss: {
    hpMult: 8,
    goldMult: 5, xpMult: 5, shardMult: 5,
  },
  // Elite & Champion: aparecem conforme a dificuldade.
  // Normal: sem especiais. Hard: elites. Nightmare: elites + champions.
  elite: {
    eliteMinDifficulty:    1,    // Hard+
    championMinDifficulty: 2,    // Nightmare only
    eliteChance:     0.15,
    championChance:  0.04,
    tiers: {
      normal:   { hp: 1.0, dmg: 1.0, reward: 1.0 },
      elite:    { hp: 1.8, dmg: 1.5, reward: 2.5 },
      champion: { hp: 3.5, dmg: 2.5, reward: 6.0 },
    },
  },
  // Pack: inimigos simultâneos. Escala com dificuldade e wave.
  pack: {
    baseByDifficulty: [1, 2, 3],  // Normal, Hard, Nightmare
    maxByDifficulty:  [3, 5, 8],
    growthPerWave: 3,              // +1 membro a cada N waves
  },
  // Waves: quantos kills por wave antes de avançar.
  wave: {
    killsPerWave: 10,
  },
  gear: {
    powerPerLevel: 1,
    levelCostBase: 5, levelCostGrowth: 1.15,
    rarityCostBase: 50, rarityCostGrowth: 20,
  },
  shards: {
    basePerKill: 1,
    perRegion: 2,    // +2 por índice de região (forest=3, caverns=5, etc.)
  },
  itemStats: {
    healthPerPower:    3,
    attackSpeedPerPower: 0.01,
    goldFindPerPower:  0.02,
    shardFindPerPower: 0.015,
    critDmgPerPower:   0.004,
    bossDmgPerPower:   0.008,
  },
  xp: { base: 20, growth: 1.10 },
  // Ascensão: requer nível mínimo + ter limpado X "stages" (região × dificuldade).
  // Stage = uma dificuldade completada numa região (boss derrotado).
  // Total de stages = REGIONS.length × DIFFICULTIES.length = 15.
  ascension: {
    firstReqLevel: 30,
    perLevelGrowth: 1.03,
  },
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.50,
    startCapHours: 2,      capMaxHours: 24,
    ascPerStep: 10,        effPerStep: 0.0125,
    capHoursPerStep: 0.25,
  },
  // Region Mastery: recompensa farming permanente por região.
  mastery: {
    killsBase: 200,          // kills base para masterizar
    killsPerRegion: 50,      // +50 por índice da região
    bonusPerRegion: 0.02,    // +2% de gold/xp/shard por região masterizada
  },
  synergy: {
    bonusPerLevel:   0.001,
    surgeInterval:   100,
    surgeMultiplier: 1.10,
  },
};

if (typeof module !== "undefined") {
  module.exports = { REGIONS, DIFFICULTIES, SLOTS, RARITIES, AFFIXES, TIERS, CONFIG };
}
