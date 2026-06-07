// ===== Static game data & balancing (single source of truth) =====
// Todo texto visível ao jogador em inglês. Comentários podem ficar em português.
// Fase 1 do plano de implementação: constantes para zonas contínuas, gold stats,
// artifacts, essence, archetypes. Substitui o modelo antigo de basePower × factors.

// ═══════════════════════════════════════════════════════════════════════
// Asset paths — imagens reais (Pinterest) + fallback emoji
// ═══════════════════════════════════════════════════════════════════════
const ASSETS = {
  hero: {
    0: "assets/heroes/seeker.jpg",        // Adventurer
    1: "assets/heroes/illumine.jpg",      // Warrior
    2: "assets/heroes/luminary.jpg",      // Champion
    3: "assets/heroes/transcendent.jpg",  // Legend
    4: "assets/heroes/transcendent.jpg",  // Mythic (reusa até termos asset próprio)
  },
  backgrounds: {
    plains:  "assets/backgrounds/auroral-fields.jpg",
    forest:  "assets/backgrounds/umbral-thicket.jpg",
    caverns: "assets/backgrounds/crystalline-depths.jpg",
    desert:  "assets/backgrounds/ashen-reach.jpg",
    peak:    "assets/backgrounds/the-pinnacle.jpg",
  },
  enemies: {
    "Fading Stag":     "assets/mobs/spectral-deer.jpg",
    "Wisp Tendril":    "assets/mobs/corrupted-light.jpg",
    "Lumiveil Moth":   "assets/mobs/luminous-spirit.jpg",
    "Crystal Golem":   "assets/mobs/crystal-golem.jpg",
    "Fire Mote":       "assets/mobs/fire-elemental.jpg",
    "Cosmic Sentinel": "assets/mobs/cosmic-being.jpg",
  },
  equipment: {
    Weapon: "assets/weapons/lunaris-sword.jpg",
    Armor:  "assets/equipment/armor.png",
    Amulet: "assets/equipment/amulet.png",
    Ring:   "assets/equipment/ring.png",
    Gloves: "assets/equipment/gloves.png",
    Helmet: "assets/equipment/helmet.png",
  },
};

// Cache de imagens que existem (checadas via Image.onload).
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
// Enemy Archetypes — personalidade via stats, não IA
// ═══════════════════════════════════════════════════════════════════════
// Cada archetype modifica HP, DMG e reward multiplicativamente.
// Resultado: importa QUEM aparece no pack. Um pack com Brute é perigoso.
const ARCHETYPES = {
  standard: { hp: 1.0,  dmg: 1.0,  reward: 1.0,  packBonus: 0,  label: "" },
  tank:     { hp: 2.5,  dmg: 0.4,  reward: 1.5,  packBonus: 0,  label: "Tank" },
  swarm:    { hp: 0.3,  dmg: 0.6,  reward: 0.5,  packBonus: 2,  label: "Swarm" },
  brute:    { hp: 0.8,  dmg: 2.5,  reward: 2.0,  packBonus: 0,  label: "Brute" },
  treasure: { hp: 0.4,  dmg: 0.2,  reward: 5.0,  packBonus: 0,  label: "Treasure" },
  cursed:   { hp: 1.2,  dmg: 1.0,  reward: 1.0,  packBonus: 0,  label: "Cursed" },
  //                                              packBonus = membros extras no pack
  //                                              cursed: reduz atk speed do player em 20%
};


// ═══════════════════════════════════════════════════════════════════════
// Regions — 5 regiões com zonas contínuas (10 HP → 1.5e16 HP)
// ═══════════════════════════════════════════════════════════════════════
// startPower = HP do 1º inimigo no Normal wave 1.
// Cada dificuldade multiplica por powerMult (1, 10, 100).
// Dentro de cada zona, waves escalam geometricamente: wave 1 = start, última = start × internalScale.
//
// Escala total: Plains Normal wave 1 = 10 HP → Peak Nightmare wave 75 = ~1.5e16 HP
const REGIONS = [
  {
    id: "plains", name: "Auroral Fields", icon: "✨",
    cssClass: "region-plains",
    startPower: 10,
    description: "Ethereal meadows where light takes form and fledgling seekers awaken.",
    background: "plains",
    // 5 inimigos com archetype + wave em que desbloqueiam (fração das waves)
    enemies: [
      { name: "Fading Stag",    archetype: "standard", emoji: "🦌" },
      { name: "Wisp Tendril",   archetype: "swarm",    emoji: "💫" },
      { name: "Lumiveil Moth",  archetype: "tank",     emoji: "🦋" },
      { name: "Twilight Shard", archetype: "brute",    emoji: "💎" },
      { name: "Echo Weaver",    archetype: "cursed",   emoji: "🕸️" },
    ],
    boss: { name: "Auroral Sentinel", emoji: "👑" },
  },
  {
    id: "forest", name: "Umbral Thicket", icon: "🌑",
    cssClass: "region-forest",
    startPower: 15e3,
    description: "A canopy of living shadows where ancient predators stalk in silence.",
    background: "forest",
    enemies: [
      { name: "Shadow Creeper",  archetype: "standard", emoji: "🕷️" },
      { name: "Thorn Sprite",    archetype: "swarm",    emoji: "🌿" },
      { name: "Ancient Bark",    archetype: "tank",     emoji: "🌳" },
      { name: "Night Stalker",   archetype: "brute",    emoji: "🐺" },
      { name: "Hex Moth",        archetype: "cursed",   emoji: "🦋" },
    ],
    boss: { name: "The Hollow Warden", emoji: "👑" },
  },
  {
    id: "caverns", name: "Crystalline Depths", icon: "💠",
    cssClass: "region-caverns",
    startPower: 15e6,
    description: "Frozen depths where crystalline formations pulse with forgotten power.",
    background: "caverns",
    enemies: [
      { name: "Crystal Fragment", archetype: "standard", emoji: "🔷" },
      { name: "Ice Sprite",      archetype: "swarm",    emoji: "❄️" },
      { name: "Crystal Golem",   archetype: "tank",     emoji: "🧊" },
      { name: "Frost Wraith",    archetype: "brute",    emoji: "👻" },
      { name: "Deep Singer",     archetype: "cursed",   emoji: "🎵" },
    ],
    boss: { name: "Prismatic Colossus", emoji: "👑" },
  },
  {
    id: "desert", name: "Ashen Reach", icon: "🔥",
    cssClass: "region-desert",
    startPower: 15e9,
    description: "A scorched wasteland where fire and ruin reign over the broken earth.",
    background: "desert",
    enemies: [
      { name: "Ember Husk",      archetype: "standard", emoji: "🔥" },
      { name: "Fire Mote",       archetype: "swarm",    emoji: "✨" },
      { name: "Slag Titan",      archetype: "tank",     emoji: "🗿" },
      { name: "Flame Revenant",  archetype: "brute",    emoji: "💀" },
      { name: "Ash Seer",        archetype: "cursed",   emoji: "🎭" },
    ],
    boss: { name: "The Scorched King", emoji: "👑" },
  },
  {
    id: "peak", name: "The Pinnacle", icon: "⚡",
    cssClass: "region-peak",
    startPower: 15e12,
    description: "The summit beyond reality, where cosmic forces clash in eternal war.",
    background: "peak",
    enemies: [
      { name: "Void Fragment",    archetype: "standard", emoji: "🌀" },
      { name: "Star Swarm",       archetype: "swarm",    emoji: "⭐" },
      { name: "Cosmic Sentinel",  archetype: "tank",     emoji: "🛡️" },
      { name: "Astral Devourer",  archetype: "brute",    emoji: "🌑" },
      { name: "Entropy Weaver",   archetype: "cursed",   emoji: "💀" },
    ],
    boss: { name: "Lumière, the Shattered", emoji: "⚡" },
  },
];


// ═══════════════════════════════════════════════════════════════════════
// Difficulties — waves por dificuldade + powerMult
// ═══════════════════════════════════════════════════════════════════════
// powerMult substitui statMult/dropMult. HP do inimigo = startPower × powerMult × waveMult.
// Recompensas escalam proporcionalmente ao HP (dmgRatio, goldRatio, xpRatio em CONFIG).
const DIFFICULTIES = [
  { id: "normal",    name: "Normal",    powerMult: 1,    waves: 30, cssClass: "diff-normal" },
  { id: "hard",      name: "Hard",      powerMult: 10,   waves: 50, cssClass: "diff-hard" },
  { id: "nightmare", name: "Nightmare", powerMult: 100,  waves: 75, cssClass: "diff-nightmare" },
];


// ═══════════════════════════════════════════════════════════════════════
// Wave Tiers — quando cada inimigo desbloqueia dentro da zona
// ═══════════════════════════════════════════════════════════════════════
// Frações das waves em que cada enemy index (0-4) aparece pela primeira vez.
// Normal: gradual (tutorial). Nightmare: todos desde wave 1.
const WAVE_TIERS = {
  normal:    [0, 0.20, 0.40, 0.60, 0.80],  // enemy 0 em wave 1, enemy 4 em wave 25
  hard:      [0, 0.15, 0.30, 0.50, 0.70],  // um pouco mais cedo
  nightmare: [0, 0,    0,    0,    0],      // todos desde wave 1
};


// ═══════════════════════════════════════════════════════════════════════
// Equipment Slots + Affixes (mantém sistema existente do ADR-0002/0003)
// ═══════════════════════════════════════════════════════════════════════
const SLOTS = [
  { id: "Weapon", stats: ["Damage"],                   defaultName: "Sword"   },
  { id: "Armor",  stats: ["Health"],                   defaultName: "Tunic"   },
  { id: "Amulet", stats: ["Attack Speed", "Gold Find"], defaultName: "Pendant" },
  { id: "Ring",   stats: ["Shard Find"],               defaultName: "Band"    },
  { id: "Gloves", stats: ["Crit Damage"],              defaultName: "Grips"   },
  { id: "Helmet", stats: ["Boss Damage"],              defaultName: "Crown"   },
];

// 25 afixos fixos (4 por slot, desbloqueados pela raridade: common=0, uncommon=1, etc.).
const AFFIXES = {
  Weapon: [
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "critDmg",  base: 0.30, perLevel: 0.004  },
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003  },
    { stat: "critDmg",  base: 0.60, perLevel: 0.006  },
  ],
  Armor: [
    { stat: "hpMult",   base: 0.20, perLevel: 0.004  },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "hpMult",   base: 0.35, perLevel: 0.006  },
    { stat: "dmgMult",  base: 0.20, perLevel: 0.003  },
  ],
  Amulet: [
    { stat: "goldMult", base: 0.25, perLevel: 0.005  },
    { stat: "xpMult",   base: 0.25, perLevel: 0.005  },
    { stat: "goldMult", base: 0.50, perLevel: 0.007  },
    { stat: "xpMult",   base: 0.50, perLevel: 0.008  },
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

// Raridades: nome, multiplicador de Item Power, CAP de nível.
const RARITIES = [
  { name: "common",    mult: 1.0, cap: 25    },
  { name: "uncommon",  mult: 1.5, cap: 75    },
  { name: "rare",      mult: 2.2, cap: 150   },
  { name: "epic",      mult: 3.5, cap: 300   },
  { name: "legendary", mult: 6.0, cap: Infinity },
];


// ═══════════════════════════════════════════════════════════════════════
// Tiers de classe do herói (Ascension Redesign spec)
// ═══════════════════════════════════════════════════════════════════════
const TIERS = [
  { name: "Adventurer", minAsc: 0,    mult: 1.06, spike: 1    },
  { name: "Warrior",    minAsc: 50,   mult: 1.08, spike: 10   },
  { name: "Champion",   minAsc: 200,  mult: 1.10, spike: 50   },
  { name: "Legend",     minAsc: 500,  mult: 1.12, spike: 200  },
  { name: "Mythic",     minAsc: 1000, mult: 1.15, spike: 1000 },
];


// ═══════════════════════════════════════════════════════════════════════
// Gold Stats — 6 stats compráveis com Gold (resetam na ascensão)
// ═══════════════════════════════════════════════════════════════════════
// Custo polynomial: baseCost × (level+1)^exponent
// Amplificados por Artifacts (multiplicador externo).
const GOLD_STATS = [
  { id: "str", name: "Strength",  icon: "⚔️",  stat: "damage",   baseCost: 10,  exponent: 1.8,
    desc: "+2 base damage per level",  perLevel: 2 },
  { id: "vit", name: "Vitality",  icon: "❤️",  stat: "health",   baseCost: 12,  exponent: 1.8,
    desc: "+10 max health per level",  perLevel: 10 },
  { id: "agi", name: "Agility",   icon: "⚡",  stat: "atkSpeed", baseCost: 15,  exponent: 2.0,
    desc: "+0.03 attack speed per level", perLevel: 0.03 },
  { id: "lck", name: "Luck",      icon: "🍀",  stat: "critRate", baseCost: 20,  exponent: 2.0,
    desc: "+0.5% crit rate per level", perLevel: 0.005 },
  { id: "frt", name: "Fortune",   icon: "🪙",  stat: "goldMult", baseCost: 25,  exponent: 2.2,
    desc: "+5% gold bonus per level",  perLevel: 0.05 },
  { id: "wis", name: "Wisdom",    icon: "📖",  stat: "xpMult",   baseCost: 25,  exponent: 2.2,
    desc: "+5% XP bonus per level",    perLevel: 0.05 },
];


// ═══════════════════════════════════════════════════════════════════════
// Artifacts — 13 artifacts comprados com Essence (permanentes)
// ═══════════════════════════════════════════════════════════════════════
// Custo: baseCost × level^1.6 (lv1 = baseCost exato, soft cap natural)
// Fórmula: artifactCost(id, lv) = baseCost × lv^ARTIFACT_COST_EXPONENT
// Lv1=baseCost, Lv2=baseCost×3.03, Lv3=baseCost×5.28, Lv5=baseCost×12.01
// Efeitos amplificam Gold Stats, combat, ou meta-progressão.
// Persistem entre ascensões.
const ARTIFACT_COST_EXPONENT = 1.6;

const ARTIFACTS = [
  // Amplificam Gold Stats 1:1
  { id: "warBanner",     name: "War Banner",         icon: "🚩",
    effect: "strMult",   perLevel: 0.10,  baseCost: 25,
    desc: "+10% Strength effectiveness per level" },
  { id: "guardShield",   name: "Guardian's Shield",   icon: "🛡️",
    effect: "vitMult",   perLevel: 0.10,  baseCost: 20,
    desc: "+10% Vitality effectiveness per level" },
  { id: "swiftTalisman", name: "Swift Talisman",      icon: "💨",
    effect: "agiMult",   perLevel: 0.10,  baseCost: 22,
    desc: "+10% Agility effectiveness per level" },
  { id: "luckyCoin",     name: "Lucky Coin",          icon: "🎰",
    effect: "lckMult",   perLevel: 0.10,  baseCost: 25,
    desc: "+10% Luck effectiveness per level" },
  { id: "goldenChalice", name: "Golden Chalice",      icon: "🏆",
    effect: "frtMult",   perLevel: 0.10,  baseCost: 22,
    desc: "+10% Fortune effectiveness per level" },
  { id: "scholarTome",   name: "Scholar's Tome",      icon: "📚",
    effect: "wisMult",   perLevel: 0.10,  baseCost: 22,
    desc: "+10% Wisdom effectiveness per level" },

  // Meta-progressão
  { id: "crownRebirth",  name: "Crown of Rebirth",    icon: "👑",
    effect: "startGold", perLevel: 50,    baseCost: 18,
    desc: "+50 starting gold per level after ascension" },
  { id: "wandererCompass", name: "Wanderer's Compass", icon: "🧭",
    effect: "waveSpeed", perLevel: 0.05,  baseCost: 18,
    desc: "+5% kill speed (reduces kills per wave) per level" },

  // Combat
  { id: "championMark",  name: "Champion's Mark",     icon: "⚜️",
    effect: "critDmg",   perLevel: 0.08,  baseCost: 30,
    desc: "+8% crit damage per level" },
  { id: "dragonHeart",   name: "Dragon's Heart",      icon: "🐉",
    effect: "bossDmg",   perLevel: 0.10,  baseCost: 35,
    desc: "+10% boss damage per level" },

  // Progressão
  { id: "soulPrism",     name: "Soul Prism",          icon: "💎",
    effect: "essenceMult", perLevel: 0.05, baseCost: 30,
    desc: "+5% Essence gain per level" },
  { id: "eternalHourglass", name: "Eternal Hourglass", icon: "⏳",
    effect: "offlineEff", perLevel: 0.02, baseCost: 28,
    desc: "+2% offline efficiency per level" },

  // Ultimate (caro, amplifica tudo)
  { id: "voidShard",     name: "Void Shard",          icon: "🌌",
    effect: "allStats",  perLevel: 0.03,  baseCost: 50,
    desc: "+3% to ALL Gold Stats per level" },
];


// ═══════════════════════════════════════════════════════════════════════
// Essence — moeda de prestígio, 4 fontes ao ascender
// ═══════════════════════════════════════════════════════════════════════
// Sublinear por design: cresce, mas devagar → incentiva jogar, não exploitar.
// Calibrada para 1ª ascensão ≈ 220 Essence → 5 artifacts lv1 + 1 lv2.
const ESSENCE = {
  // Fonte 1: stage clears (região × dificuldade limpas no run)
  clear: {
    base: 15,           // Essence por clear da 1ª região Normal
    regionMult: 2.5,    // cada região seguinte dá ×2.5 mais
    diffMult: 2.0,      // Hard = ×2, Nightmare = ×4
  },
  // Fonte 2: profundidade total (√ das waves limpas × scale)
  depth: {
    scale: 10,          // √(total_waves) × 10
  },
  // Fonte 3: boss kills
  boss: {
    base: 5,            // Essence por boss kill
    perRegion: 3,       // +3 por índice de região (Forest boss = 8, Caverns boss = 11...)
  },
  // Fonte 4: base flat (cresce levemente a cada ascensão)
  base: {
    flat: 15,           // Essence base por ascensão
    perAscension: 0.5,  // +0.5 por ascensão anterior (linear lento)
  },
};


// ═══════════════════════════════════════════════════════════════════════
// CONFIG — painel de balanceamento central
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  player: {
    baseDamage: 5, baseHp: 50,
    damagePerLevel: 1.5, hpPerLevel: 8,
    baseAttackSpeed: 1.0,
  },
  combat: { baseCritMult: 2.0 },

  // ── Zonas contínuas: escala de inimigos ────────────────────────────
  // HP do inimigo = interpolação geométrica dentro da zona.
  // enemyHP(region, diff, wave) = zoneStart × (internalScale ^ progress)
  //   onde zoneStart = region.startPower × diff.powerMult
  //   e progress = (wave-1) / (totalWaves-1)
  enemy: {
    internalScale: 10,   // ×10 do início ao fim de cada zona
    dmgRatio:   0.15,    // enemy DMG = HP × dmgRatio
    goldRatio:  0.5,     // gold reward ≈ HP × goldRatio (ajustado pela escala)
    xpRatio:    0.3,     // xp reward ≈ HP × xpRatio
    damageFactor: 0.3,   // fração do DMG aplicada por segundo ao player
    ascGrowth: 1.06,     // HP e DMG × 1.06 por ascensão do jogador
    // Cursed archetype debuff
    cursedAtkSpeedReduction: 0.20,
  },

  boss: {
    hpMult: 5,           // boss HP = última wave regular × 5
    goldMult: 8,         // boss dá 8× mais gold
    xpMult: 5,           // boss dá 5× mais XP
    shardMult: 5,        // boss dá 5× mais shards
  },

  // ── Elites e Champions (dentro das waves) ──────────────────────────
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

  // ── Pack size ──────────────────────────────────────────────────────
  pack: {
    baseByDifficulty: [1, 2, 3],
    maxByDifficulty:  [3, 5, 8],
    growthPerWave: 3,
  },

  // ── Waves ──────────────────────────────────────────────────────────
  wave: {
    killsPerWave: 10,
  },

  // ── Equipment (mantém ADR-0002) ────────────────────────────────────
  gear: {
    powerPerLevel: 1,
    levelCostBase: 5, levelCostGrowth: 1.15,
    rarityCostBase: 50, rarityCostGrowth: 20,
  },

  // ── Shards ─────────────────────────────────────────────────────────
  shards: {
    basePerKill: 1,
    perRegion: 2,
  },

  // ── Item stat conversions ──────────────────────────────────────────
  itemStats: {
    healthPerPower:      3,
    attackSpeedPerPower:  0.01,
    goldFindPerPower:    0.02,
    shardFindPerPower:   0.015,
    critDmgPerPower:     0.004,
    bossDmgPerPower:     0.008,
  },

  // ── XP / Hero level ────────────────────────────────────────────────
  xp: { base: 20, growth: 1.10 },

  // ── Ascensão ───────────────────────────────────────────────────────
  ascension: {
    firstReqLevel: 30,
    perLevelGrowth: 1.03,
  },

  // ── Offline (melhora automaticamente com ascensões) ────────────────
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.50,
    startCapHours: 2,      capMaxHours: 24,
    ascPerStep: 10,        effPerStep: 0.0125,
    capHoursPerStep: 0.25,
  },

  // ── Region Mastery ─────────────────────────────────────────────────
  mastery: {
    killsBase: 200,
    killsPerRegion: 50,
    bonusPerRegion: 0.02,
  },

  // ── Synergy (soma de equip levels) ─────────────────────────────────
  synergy: {
    bonusPerLevel:   0.001,
    surgeInterval:   100,
    surgeMultiplier: 1.10,
  },
};


// ═══════════════════════════════════════════════════════════════════════
// Number Formatting — sufixos para números gigantes
// ═══════════════════════════════════════════════════════════════════════
// 1,234 → "1,234" | 12,345 → "12.3K" | 1.5e12 → "1.50T"
const NUMBER_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
];

// Formata número grande com sufixo. Usado em toda a UI.
function fmt(n) {
  if (n < 1e4) return Math.floor(n).toLocaleString("en-US");
  let tier = 0;
  while (n >= 1e3 && tier < NUMBER_SUFFIXES.length - 1) {
    n /= 1e3;
    tier++;
  }
  if (tier >= NUMBER_SUFFIXES.length) return n.toExponential(2);
  return (n >= 100 ? Math.floor(n) : n.toFixed(n >= 10 ? 1 : 2)) + NUMBER_SUFFIXES[tier];
}

// Formata multiplicador: ×1.23
function fmtMult(n) { return "×" + n.toFixed(2); }

// Formata porcentagem: +12.5%
function fmtPct(n) { return (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%"; }


// ═══════════════════════════════════════════════════════════════════════
// Exports (Node.js para testes)
// ═══════════════════════════════════════════════════════════════════════
if (typeof module !== "undefined") {
  module.exports = {
    ASSETS, ARCHETYPES, REGIONS, DIFFICULTIES, WAVE_TIERS,
    SLOTS, AFFIXES, RARITIES, TIERS,
    GOLD_STATS, ARTIFACTS, ARTIFACT_COST_EXPONENT, ESSENCE,
    CONFIG, NUMBER_SUFFIXES,
    fmt, fmtMult, fmtPct,
  };
}
