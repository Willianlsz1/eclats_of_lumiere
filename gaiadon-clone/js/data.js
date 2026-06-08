// ===== Static game data & balancing (single source of truth) =====
// Todo texto visível ao jogador em inglês. Comentários podem ficar em português.
// Éclats of Lumière — constantes para zonas contínuas, gold stats,
// artifacts, essence, archetypes. Substitui o modelo antigo de basePower × factors.

// ═══════════════════════════════════════════════════════════════════════
// Asset paths — imagens reais (Pinterest) + fallback emoji
// ═══════════════════════════════════════════════════════════════════════
const ASSETS = {
  hero: {
    0: "assets/heroes/seeker.jpg",        // Seeker
    1: "assets/heroes/illumine.jpg",      // Illuminate
    2: "assets/heroes/luminary.jpg",      // Éclairé
    3: "assets/heroes/transcendent.jpg",  // L'Éveillé
    4: "assets/heroes/transcendent.jpg",  // Lumière (reusa até termos asset próprio)
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
// Regions — 5 mapas (DESIGN §16), escala ×1e12 por mapa (10 HP → ~1e60 HP)
// ═══════════════════════════════════════════════════════════════════════
// startPower = HP do 1º inimigo no Normal wave 1. Por mapa: 10, 1e12, 1e24, 1e36, 1e48.
// Cada dificuldade multiplica por powerMult (1, 10, 100).
// Dentro de cada mapa, waves escalam geometricamente: wave 1 = start, última = start × internalScale (1e12).
//
// Escala total: Mapa 1 wave 1 = 10 HP → Nil Aeternum wave final ≈ 1e60 HP
const REGIONS = [
  {
    id: "plains", name: "The Dreaming Wood", icon: "✨",
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
    id: "forest", name: "Cavernes Luminis", icon: "🌑",
    cssClass: "region-forest",
    startPower: 1e12,
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
    id: "caverns", name: "The Ashen Ruins", icon: "💠",
    cssClass: "region-caverns",
    startPower: 1e24,
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
    id: "desert", name: "The Fractured Peaks", icon: "🔥",
    cssClass: "region-desert",
    startPower: 1e36,
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
    id: "peak", name: "Nil Aeternum", icon: "⚡",
    cssClass: "region-peak",
    startPower: 1e48,
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
// Subáreas (DESIGN §16) — 5 por mapa, open-zone, chefe com trigger oculto
// ═══════════════════════════════════════════════════════════════════════
// Faixas de nível de referência (Mapa 1). Cada subárea tem um chefe gatekeeper;
// o da Subárea 5 é o chefe final do mapa → Ascensão.
const SUBAREAS = [
  { idx: 0, name: "Subárea I",   levelRange: [1, 50] },
  { idx: 1, name: "Subárea II",  levelRange: [50, 200] },
  { idx: 2, name: "Subárea III", levelRange: [200, 1000] },
  { idx: 3, name: "Subárea IV",  levelRange: [1000, 10000] },
  { idx: 4, name: "Subárea V",   levelRange: [10000, 100000] }, // chefe final → Ascensão
];


// ═══════════════════════════════════════════════════════════════════════
// Equipment Slots + Affixes (mantém sistema existente do ADR-0002/0003)
// ═══════════════════════════════════════════════════════════════════════
// Nomes das peças — DESIGN §26 (As 6 Peças). Stats principais já alinhados.
const SLOTS = [
  { id: "Weapon", stats: ["Damage"],                     defaultName: "The Waning Edge"        },
  { id: "Armor",  stats: ["Health"],                     defaultName: "Veil of Cinders"        },
  { id: "Amulet", stats: ["Attack Speed", "Lumen Find"], defaultName: "The Last Resonance"     },
  { id: "Ring",   stats: ["Vestige Find"],               defaultName: "Band of Dusk"           },
  { id: "Gloves", stats: ["Crit Damage"],                defaultName: "Grasp of the Unnamed"   },
  { id: "Helmet", stats: ["Boss Damage"],                defaultName: "Crown of Hollow Stars"  },
];

// 30 afixos fixos (5 por slot). Ativados pela raridade (DESIGN §27): common=1 … legendary=5.
const AFFIXES = {
  Weapon: [
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "critDmg",  base: 0.30, perLevel: 0.004  },
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003  },
    { stat: "critDmg",  base: 0.60, perLevel: 0.006  },
    { stat: "dmgMult",  base: 0.40, perLevel: 0.005  }, // §28 #5 (proxy de AoE Damage)
  ],
  Armor: [
    { stat: "hpMult",   base: 0.20, perLevel: 0.004  },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "hpMult",   base: 0.35, perLevel: 0.006  },
    { stat: "dmgMult",  base: 0.20, perLevel: 0.003  },
    { stat: "hpMult",   base: 0.45, perLevel: 0.007  }, // §28 #5 (proxy de Damage Reduction)
  ],
  Amulet: [
    { stat: "goldMult", base: 0.25, perLevel: 0.005  },
    { stat: "xpMult",   base: 0.25, perLevel: 0.005  },
    { stat: "goldMult", base: 0.50, perLevel: 0.007  },
    { stat: "xpMult",   base: 0.50, perLevel: 0.008  },
    { stat: "goldMult", base: 0.70, perLevel: 0.009  }, // §28 #5 Lumens Multiplier
  ],
  Ring: [
    { stat: "shardMult", base: 0.20, perLevel: 0.004 },
    { stat: "xpMult",    base: 0.20, perLevel: 0.004 },
    { stat: "shardMult", base: 0.40, perLevel: 0.006 },
    { stat: "goldMult",  base: 0.30, perLevel: 0.005 },
    { stat: "dmgMult",   base: 0.35, perLevel: 0.005 }, // §28 #5 (proxy de All Stats Bonus)
  ],
  Gloves: [
    { stat: "critDmg",  base: 0.20, perLevel: 0.003  },
    { stat: "critRate", base: 0.05, perLevel: 0.0003 },
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003  },
    { stat: "critDmg",  base: 0.50, perLevel: 0.006  },
    { stat: "critRate", base: 0.08, perLevel: 0.0004 }, // §28 #5 (proxy de Crit Cascade)
  ],
  Helmet: [
    { stat: "bossDmg", base: 0.15, perLevel: 0.003 },
    { stat: "hpMult",  base: 0.20, perLevel: 0.004 },
    { stat: "bossDmg", base: 0.30, perLevel: 0.005 },
    { stat: "dmgMult", base: 0.20, perLevel: 0.003 },
    { stat: "bossDmg", base: 0.45, perLevel: 0.006 }, // §28 #5 Boss Damage Multiplier
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
// Tiers da Ordre de Lumière (DESIGN §15) — 1 por mapa, 5 ascensões totais.
// tier = nº da ascensão = índice do mapa (0→4). minAsc = quantas ascensões para o tier.
// ═══════════════════════════════════════════════════════════════════════
const TIERS = [
  { name: "Seeker",      minAsc: 0, map: 0 },
  { name: "Illuminate",  minAsc: 1, map: 1 },
  { name: "Éclairé",     minAsc: 2, map: 2 },
  { name: "L'Éveillé",   minAsc: 3, map: 3 },
  { name: "Lumière",     minAsc: 4, map: 4 },
];


// ═══════════════════════════════════════════════════════════════════════
// Materiais (PARTE VII do DESIGN) — insumos de craft/upgrade.
// Universais: dropam por TIER de inimigo (normal/elite/champion).
// Especiais por mapa: dropam do CHEFE da região correspondente.
// ═══════════════════════════════════════════════════════════════════════
const MATERIALS = [
  { id: "dimShard",     name: "Dim Shard",     icon: "🔹", rarity: "common",   source: "normal"    },
  { id: "paleFragment", name: "Pale Fragment", icon: "🔸", rarity: "uncommon", source: "elite"     },
  { id: "voidDust",     name: "Void Dust",     icon: "🟣", rarity: "rare",     source: "champion"  },
];

// Material especial por região (índice = índice da REGION). Drop do chefe.
const MAP_MATERIALS = [
  { id: "dreamspore",   name: "Dreamspore",    icon: "🌱", rarity: "rare"      }, // plains
  { id: "crystalTear",  name: "Crystal Tear",  icon: "💧", rarity: "rare"      }, // forest
  { id: "cinderShard",  name: "Cinder Shard",  icon: "🔥", rarity: "epic"      }, // caverns
  { id: "riftFragment", name: "Rift Fragment", icon: "🌀", rarity: "epic"      }, // desert
  { id: "nilEssence",   name: "Nil Essence",   icon: "🌌", rarity: "legendary" }, // peak
];

// Lookup por id (universais + de mapa) — para exibição e validação.
const MATERIALS_BY_ID = {};
MATERIALS.forEach(function (m) { MATERIALS_BY_ID[m.id] = m; });
MAP_MATERIALS.forEach(function (m) { MATERIALS_BY_ID[m.id] = m; });
function materialDef(id) { return MATERIALS_BY_ID[id] || null; }


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
// Passives — 45 nós em 3 árvores (Éclat, Vestige, Fracture)
// ═══════════════════════════════════════════════════════════════════════
// Comprados com Vestiges; efeitos permanentes dentro de uma ascensão.
// Campos: id, tree, name, icon, effect, perLevel, maxLevel,
//         costBase, costGrowth, mapReq, killsReq, desc
// effect="stub" → passiva comprável mas sem efeito até fase futura.
const PASSIVES = [
  // ── Árvore ÉCLAT (dano, crítico, execução) ──────────────────────────
  { id: "radiantStrike",    tree: "eclat",   name: "Radiant Strike",     icon: "⚔️",
    effect: "dmgMult",            perLevel: 0.08,  maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,      desc: "+8% base damage per level" },
  { id: "shardBurst",       tree: "eclat",   name: "Shard Burst",        icon: "💥",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 60,   costGrowth: 1.8,
    mapReq: 1, killsReq: 50,     desc: "+5% AoE damage per level" },
  { id: "luminalEdge",      tree: "eclat",   name: "Luminal Edge",       icon: "✨",
    effect: "critRate",           perLevel: 0.03,  maxLevel: 10, costBase: 90,   costGrowth: 1.7,
    mapReq: 1, killsReq: 100,    desc: "+3% Crit Rate per level" },
  { id: "resonantForce",    tree: "eclat",   name: "Resonant Force",     icon: "🔥",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 150,  costGrowth: 1.9,
    mapReq: 2, killsReq: 200,    desc: "+10% temporary damage per kill per level" },
  { id: "eclatSurge",       tree: "eclat",   name: "Éclat Surge",        icon: "⚡",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 200,  costGrowth: 2.0,
    mapReq: 2, killsReq: 500,    desc: "+5% double attack chance per level" },
  { id: "execute",          tree: "eclat",   name: "Execute",            icon: "💀",
    effect: "stub",               perLevel: 0.01,  maxLevel: 5,  costBase: 250,  costGrowth: 2.0,
    mapReq: 2, killsReq: 1000,   desc: "+1% threshold to instantly kill weakened enemies per level" },
  { id: "overkill",         tree: "eclat",   name: "Overkill",           icon: "🗡️",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 400,  costGrowth: 2.1,
    mapReq: 3, killsReq: 2000,   desc: "+5% overflow damage carries to next enemy per level" },
  { id: "momentum",         tree: "eclat",   name: "Momentum",           icon: "🌊",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 500,  costGrowth: 2.1,
    mapReq: 3, killsReq: 5000,   desc: "+5% damage per consecutive kill per level" },
  { id: "refraction",       tree: "eclat",   name: "Refraction",         icon: "💎",
    effect: "stub",               perLevel: 0.03,  maxLevel: 5,  costBase: 600,  costGrowth: 2.2,
    mapReq: 3, killsReq: 5000,   desc: "+3% crit damage returned as HP per level" },
  { id: "critCascade",      tree: "eclat",   name: "Crit Cascade",       icon: "🌀",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 750,  costGrowth: 2.2,
    mapReq: 3, killsReq: 10000,  desc: "+5% chance of bonus attack on crit per level" },
  { id: "luminalExplosion", tree: "eclat",   name: "Luminal Explosion",  icon: "🌟",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 1000, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+10% AoE damage on crit kill per level" },
  { id: "orEinSofTouch",    tree: "eclat",   name: "Or Ein Sof Touch",   icon: "🌠",
    effect: "critOverflowFactor", perLevel: 0.15,  maxLevel: 5,  costBase: 1200, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+15% Crit Overflow conversion factor per level" },
  { id: "shatteredLight",   tree: "eclat",   name: "Shattered Light",    icon: "💫",
    effect: "shatteredLight",     perLevel: 0.20,  maxLevel: 5,  costBase: 1500, costGrowth: 2.4,
    mapReq: 4, killsReq: 50000,  desc: "+0.20 Crit Damage per full 100% crit overflow per level" },
  { id: "fractureWeakness", tree: "eclat",   name: "Fracture Weakness",  icon: "🔷",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 2000, costGrowth: 2.4,
    mapReq: 4, killsReq: 50000,  desc: "+10% damage vs The Claimed and Qliphoth per level" },
  { id: "voidPiercing",     tree: "eclat",   name: "Void Piercing",      icon: "🌑",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 2500, costGrowth: 2.5,
    mapReq: 5, killsReq: 100000, desc: "+10% defense bypass vs corrupted enemies per level" },

  // ── Árvore VESTIGE (recursos, drops, progressão) ─────────────────────
  { id: "lumenBlessing",    tree: "vestige", name: "Lumen Blessing",     icon: "✨",
    effect: "lumensMult",         perLevel: 0.10,  maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,      desc: "+10% Lumens per kill per level" },
  { id: "wisdomRuins",      tree: "vestige", name: "Wisdom of Ruins",    icon: "📖",
    effect: "xpMult",             perLevel: 0.08,  maxLevel: 10, costBase: 50,   costGrowth: 1.7,
    mapReq: 1, killsReq: 50,     desc: "+8% XP per kill per level" },
  { id: "remnantHarvest",   tree: "vestige", name: "Remnant Harvest",    icon: "🌿",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 80,   costGrowth: 1.8,
    mapReq: 1, killsReq: 100,    desc: "+10% material drop chance per level" },
  { id: "vestigePull",      tree: "vestige", name: "Vestige Pull",       icon: "💜",
    effect: "vestigeMult",        perLevel: 0.10,  maxLevel: 10, costBase: 100,  costGrowth: 1.8,
    mapReq: 1, killsReq: 150,    desc: "+10% Vestiges per kill per level" },
  { id: "scavenger",        tree: "vestige", name: "Scavenger",          icon: "🔍",
    effect: "stub",               perLevel: 0.15,  maxLevel: 5,  costBase: 180,  costGrowth: 1.9,
    mapReq: 2, killsReq: 300,    desc: "+15% boss drop rate per level" },
  { id: "dreamwalker",      tree: "vestige", name: "Dreamwalker",        icon: "🌙",
    effect: "offlineEff",         perLevel: 0.05,  maxLevel: 10, costBase: 200,  costGrowth: 1.9,
    mapReq: 2, killsReq: 500,    desc: "+5% offline efficiency per level" },
  { id: "beastCaller",      tree: "vestige", name: "Beast Caller",       icon: "🐾",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 300,  costGrowth: 2.0,
    mapReq: 2, killsReq: 1000,   desc: "+10% Echo drop chance per level" },
  { id: "hoarder",          tree: "vestige", name: "Hoarder",            icon: "🏦",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 450,  costGrowth: 2.1,
    mapReq: 3, killsReq: 2000,   desc: "+10% Lumens after each Convergence per level" },
  { id: "awakenedHarvest",  tree: "vestige", name: "Awakened Harvest",   icon: "🌸",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 600,  costGrowth: 2.2,
    mapReq: 3, killsReq: 5000,   desc: "+5% double material drop chance per level" },
  { id: "echoGreed",        tree: "vestige", name: "Echo Greed",         icon: "💰",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 800,  costGrowth: 2.2,
    mapReq: 3, killsReq: 5000,   desc: "2nd+ boss kill drops bonus reward per level" },
  { id: "voidScavenger",    tree: "vestige", name: "Void Scavenger",     icon: "🕳️",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 1000, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+10% materials from The Claimed per level" },
  { id: "eternalVestige",   tree: "vestige", name: "Eternal Vestige",    icon: "♾️",
    effect: "stub",               perLevel: 0.001, maxLevel: 5,  costBase: 1200, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "Spent Vestiges grant passive XP bonus per level" },
  { id: "fracturedSoul",    tree: "vestige", name: "Fractured Soul",     icon: "🔮",
    effect: "stub",               perLevel: 0.02,  maxLevel: 5,  costBase: 1500, costGrowth: 2.4,
    mapReq: 4, killsReq: 50000,  desc: "+2% chance of higher tier loot on kill per level" },
  { id: "luminalCache",     tree: "vestige", name: "Luminal Cache",      icon: "⚡",
    effect: "stub",               perLevel: 1,     maxLevel: 1,  costBase: 2000, costGrowth: 1.0,
    mapReq: 5, killsReq: 50000,  desc: "First minute online after offline triples Lumens" },
  { id: "theCollector",     tree: "vestige", name: "The Collector",      icon: "📦",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 2500, costGrowth: 2.5,
    mapReq: 5, killsReq: 100000, desc: "+5% Lumens bonus per Echo type found per level" },

  // ── Árvore FRACTURE (debuffs inimigos, sobrevivência) ─────────────────
  { id: "weakenedVoid",     tree: "fracture", name: "Weakened Void",      icon: "🌪️",
    effect: "enemyHpReduct",      perLevel: 0.05,  maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,      desc: "-5% enemy HP per level" },
  { id: "fractureSense",    tree: "fracture", name: "Fracture Sense",     icon: "👁️",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 60,   costGrowth: 1.8,
    mapReq: 1, killsReq: 50,     desc: "+5% chance to reveal hidden enemy weaknesses per level" },
  { id: "voidAwareness",    tree: "fracture", name: "Void Awareness",     icon: "🌐",
    effect: "rewardMult",         perLevel: 0.06,  maxLevel: 10, costBase: 80,   costGrowth: 1.8,
    mapReq: 1, killsReq: 100,    desc: "+6% all rewards per level" },
  { id: "slowFracture",     tree: "fracture", name: "Slow Fracture",      icon: "❄️",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 120,  costGrowth: 1.9,
    mapReq: 1, killsReq: 150,    desc: "+5% chance to slow enemies per level" },
  { id: "convergentWill",   tree: "fracture", name: "Convergent Will",    icon: "🔗",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 180,  costGrowth: 1.9,
    mapReq: 2, killsReq: 300,    desc: "+5% Convergence XP per level" },
  { id: "nihelShadow",      tree: "fracture", name: "Nihel's Shadow",     icon: "🌒",
    effect: "enemyDmgReduct",     perLevel: 0.05,  maxLevel: 10, costBase: 400,  costGrowth: 2.1,
    mapReq: 3, killsReq: 2000,   desc: "-5% enemy damage per level" },
  { id: "timeFracture",     tree: "fracture", name: "Time Fracture",      icon: "⏳",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 500,  costGrowth: 2.1,
    mapReq: 3, killsReq: 3000,   desc: "+10% chance to reset enemy action per level" },
  { id: "rupture",          tree: "fracture", name: "Rupture",            icon: "💢",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 600,  costGrowth: 2.2,
    mapReq: 3, killsReq: 5000,   desc: "+5% bleed damage over time per level" },
  { id: "lastLight",        tree: "fracture", name: "Last Light",         icon: "🕯️",
    effect: "lastLightDmg",       perLevel: 0.15,  maxLevel: 5,  costBase: 750,  costGrowth: 2.2,
    mapReq: 3, killsReq: 10000,  desc: "+15% damage when below 30% HP per level" },
  { id: "voidPulse",        tree: "fracture", name: "Void Pulse",         icon: "💫",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 900,  costGrowth: 2.3,
    mapReq: 4, killsReq: 15000,  desc: "+5% AoE pulse damage per level" },
  { id: "abyssal",          tree: "fracture", name: "Abyssal",            icon: "🕳️",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 1000, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+10% damage in The Abyss per level" },
  { id: "fractureCore",     tree: "fracture", name: "Fracture Core",      icon: "💠",
    effect: "stub",               perLevel: 0.08,  maxLevel: 5,  costBase: 1200, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+8% damage vs elites per level" },
  { id: "nilsEmbrace",      tree: "fracture", name: "Nil's Embrace",      icon: "🌌",
    effect: "stub",               perLevel: 0.05,  maxLevel: 5,  costBase: 2000, costGrowth: 2.4,
    mapReq: 5, killsReq: 50000,  desc: "+5% damage per minute spent in area per level" },
  { id: "voidEndurance",    tree: "fracture", name: "Void Endurance",     icon: "🛡️",
    effect: "voidEndurance",      perLevel: 0.005, maxLevel: 10, costBase: 2500, costGrowth: 2.5,
    mapReq: 5, killsReq: 100000, desc: "+0.5% defense and HP per boss defeated this map per level" },
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
  combat: {
    baseCritMult: 2.0,
    // Crit overflow: excess Crit Rate above 100% converts to Crit Damage at this ratio.
    critOverflowToDmg: 1.0,
    // Attack Speed: ataques/s = min(cap, √rawAtkSpeed × fator)
    attackSpeedCap:    20,
    attackSpeedFactor: 1.0,
    // HP Regen base: level × regenPerLevel HP/s
    regenPerLevel: 0.1,
    // Crit visual: critMult ≥ threshold → tier "radiant" (cosmético)
    radiantCritThreshold: 5.0,
    // Crit dos inimigos regulares
    enemyCritChanceMin: 0.03,
    enemyCritChanceMax: 0.08,
    enemyCritMult: 2.5,
    // Crit dos chefes
    bossCritChanceMin: 0.15,
    bossCritChanceMax: 0.25,
    bossCritMult: 3.0,
  },

  // ── Convergence (rebirth frequente) ───────────────────────────────────
  // Milestones: ×spikeMultiplier a cada spikeInterval Convergences.
  // Spike por marco; o multiplicador de Convergence é calculado em progression.js.
  convergence: {
    spikeMultiplier: 1.5,
    spikeInterval:   5,
    mult1:        1.20,  // convergences 1–4
    mult2:        1.12,  // convergences 5–8
    additive:     0.05,  // convergences 9+: +5% each (compounding via ×(1+n*0.05))
    switchPoint1: 4,
    switchPoint2: 8,
    minLevel:     10,    // piso de nível para converger (evita spam grátis no piso)
    maxMult:      1e100, // clamp de segurança (impede overflow → Infinity → save corrompido)
  },

  // ── Map / Subárea progression (DESIGN §16) ────────────────────────────
  // 5 mapas × 5 subáreas = 25 passos. HP do inimigo cresce geometricamente
  // por subárea: hp(map, sub) = baseHp × subareaRamp^(map×subareasPerMap + sub).
  // Open-zone: spawn contínuo; o chefe da subárea aparece após killsToBoss kills.
  map: {
    baseHp:         10,    // HP do 1º inimigo (Mapa 1, Subárea 1)
    subareaRamp:    2.87,  // ×HP por subárea (curva global atravessável: 10 → ~1e12 no jogo todo).
                           // ALVO DESIGN §16 = ~251 (×1e12 POR mapa); cranear quando os Echoes
                           // e a economia de poder completa existirem.
    subareasPerMap: 5,
    killsToBoss:    30,    // kills na subárea até o chefe (trigger oculto)
  },

  // ── Escala de recompensa do inimigo (derivada do HP) ───────────────────
  enemy: {
    dmgRatio:   0.15,    // enemy DMG = HP × dmgRatio
    goldRatio:  0.5,     // lumens reward ≈ HP × goldRatio
    xpRatio:    0.3,     // xp reward ≈ HP × xpRatio
    damageFactor: 0.3,   // fração do DMG aplicada por segundo ao player
    ascGrowth: 1.06,     // HP e DMG × 1.06 por ascensão (0-4)
    // Cursed archetype debuff
    cursedAtkSpeedReduction: 0.20,
  },

  boss: {
    hpMult: 5,           // boss HP = última wave regular × 5
    goldMult: 8,         // boss dá 8× mais gold
    xpMult: 5,           // boss dá 5× mais XP
    shardMult: 5,        // boss dá 5× mais shards
  },

  // ── Elites e Champions (chance escala com a subárea) ───────────────────
  elite: {
    eliteMinSubarea:    1,    // a partir da Subárea 2
    championMinSubarea: 3,    // a partir da Subárea 4
    eliteChance:     0.15,
    championChance:  0.04,
    tiers: {
      normal:   { hp: 1.0, dmg: 1.0, reward: 1.0 },
      elite:    { hp: 1.8, dmg: 1.5, reward: 2.5 },
      champion: { hp: 3.5, dmg: 2.5, reward: 6.0 },
    },
  },

  // ── Pack size (cresce com a subárea) ───────────────────────────────────
  pack: {
    baseBySubarea: [1, 2, 2, 3, 3],
    maxBySubarea:  [3, 4, 5, 6, 8],
  },

  // ── Equipment (mantém ADR-0002) ────────────────────────────────────
  gear: {
    powerPerLevel: 1,
    levelCostBase: 5, levelCostGrowth: 1.15,
    // Upgrade de raridade consome MATERIAIS (DESIGN §37), não Vestiges.
    // qty para subir DE cada raridade: common→unc, unc→rare, rare→epic, epic→leg.
    rarityMaterialQty: [10, 8, 6, 5],
  },

  // ── Vestiges (drop por kill) ───────────────────────────────────────
  shards: {
    basePerKill: 1,
    perMap: 2,
    perSubarea: 1,
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

  // ── Ascensão (5 totais, 1 por mapa — DESIGN §15) ───────────────────────
  // Gatilho: derrotar o chefe da Subárea 5 do mapa atual → próximo mapa + tier.
  // Cada ascensão dá um spike de poder (≈ salto de HP por mapa) p/ começar o próximo.
  ascension: {
    firstReqLevel:  30,
    perLevelGrowth: 1.03,
    spikePerTier:   200,   // ascMultiplier = spikePerTier ^ ascensions (0-4)
  },

  // ── Offline (melhora automaticamente com ascensões) ────────────────
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.50,
    startCapHours: 2,      capMaxHours: 24,
    ascPerStep: 10,        effPerStep: 0.0125,
    capHoursPerStep: 0.25,
  },

  // ── Map Mastery (permanente entre ascensões) ───────────────────────
  mastery: {
    killsBase: 200,
    killsPerMap: 50,
    bonusPerMap: 0.02,
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
  // Estendido para a escala dos mapas (DESIGN §16, até ~1e63). Além disso → científico.
  "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg",
];

// Formata número grande com sufixo. Usado em toda a UI.
function fmt(n) {
  // Defensivo: nunca lança em entrada inválida (undefined/null/NaN/string).
  // Um único campo ausente não pode abortar todo o renderAll. Infinity vai pra fmtCap.
  if (typeof n !== "number" || Number.isNaN(n)) n = 0;
  if (n < 1e4) return Math.floor(n).toLocaleString("en-US");
  const orig = n;
  let tier = 0;
  while (n >= 1e3 && tier < NUMBER_SUFFIXES.length - 1) {
    n /= 1e3;
    tier++;
  }
  // Esgotou a tabela de sufixos e ainda é grande → notação científica (ex. "1.00e+72").
  if (n >= 1e3) return orig.toExponential(2);
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
    ASSETS, ARCHETYPES, REGIONS, SUBAREAS,
    SLOTS, AFFIXES, RARITIES, TIERS,
    MATERIALS, MAP_MATERIALS, MATERIALS_BY_ID, materialDef,
    GOLD_STATS, PASSIVES, ARTIFACTS, ARTIFACT_COST_EXPONENT, ESSENCE,
    CONFIG, NUMBER_SUFFIXES,
    fmt, fmtMult, fmtPct,
  };
}
