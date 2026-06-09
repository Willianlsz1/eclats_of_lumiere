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
  standard: { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "" },
  tank:     { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "Tank" },
  swarm:    { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "Swarm" },
  brute:    { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "Brute" },
  treasure: { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "Treasure" },
  cursed:   { hp: 1.0, dmg: 1.0, reward: 1.0, packBonus: 0, label: "Cursed" },
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
    id: "luminis", name: "Cavernes Luminis", icon: "🌑",
    cssClass: "region-luminis",
    startPower: 1e12,
    description: "Ancient caverns where Or Ein Sof's light crystallized over millennia. The air hums with forgotten resonance.",
    background: "caverns",
    enemies: [
      { name: "Luminis Shard",   archetype: "standard", emoji: "💎" },
      { name: "Crystal Swarm",   archetype: "swarm",    emoji: "✨" },
      { name: "Cavern Warden",   archetype: "tank",     emoji: "🪨" },
      { name: "Void Stalker",    archetype: "brute",    emoji: "🌑" },
      { name: "Echo Phantom",    archetype: "cursed",   emoji: "👻" },
    ],
    boss: { name: "Prismatic Colossus", emoji: "👑" },
  },
  {
    id: "ruins", name: "The Ashen Ruins", icon: "💠",
    cssClass: "region-ruins",
    startPower: 1e24,
    description: "Ruins where Lumière once stood, now consumed by roots and pale mist. The oldest Éclats lie buried in ash.",
    background: "forest",
    enemies: [
      { name: "Ashen Remnant",   archetype: "standard", emoji: "⚫" },
      { name: "Root Tendril",    archetype: "swarm",    emoji: "🌿" },
      { name: "Ruins Hulk",      archetype: "tank",     emoji: "🗿" },
      { name: "The Consumed",    archetype: "brute",    emoji: "💀" },
      { name: "Hollow Wraith",   archetype: "cursed",   emoji: "🕯️" },
    ],
    boss: { name: "The Hollow Warden", emoji: "👑" },
  },
  {
    id: "peaks", name: "The Fractured Peaks", icon: "🔥",
    cssClass: "region-peaks",
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
  { id: "Amulet", stats: ["Lumens"],   defaultName: "The Last Resonance" },
  { id: "Ring",   stats: ["Vestiges"], defaultName: "Band of Dusk"       },
  { id: "Gloves", stats: ["Crit Damage"],                defaultName: "Grasp of the Unnamed"   },
  { id: "Helmet", stats: ["Boss Damage"],                defaultName: "Crown of Hollow Stars"  },
];

// 30 afixos fixos (5 por slot). Ativados pela raridade (DESIGN §27): common=1 … legendary=5.
// Afixos por peça conforme DESIGN §28.
const AFFIXES = {
  // The Waning Edge — Weapon (DESIGN §28)
  Weapon: [
    { stat: "critRate", base: 0, perLevel: 0 },  // 1 Common    — Crit Rate
    { stat: "atkSpeed", base: 0, perLevel: 0 },  // 2 Uncommon  — Attack Speed
    { stat: "critDmg",  base: 0, perLevel: 0 },  // 3 Rare      — Crit Damage
    { stat: "bossDmg",  base: 0, perLevel: 0 },  // 4 Epic      — Boss Damage
    { stat: "aoeDmg",   base: 0, perLevel: 0 },  // 5 Legendary — AoE Damage
  ],
  // Veil of Cinders — Armor (DESIGN §28)
  Armor: [
    { stat: "defense",      base: 0, perLevel: 0 },  // 1 Common    — Defense
    { stat: "hpRegenKill",  base: 0, perLevel: 0 },  // 2 Uncommon  — HP Regen per Kill
    { stat: "hpRegenAmp",   base: 0, perLevel: 0 },  // 3 Rare      — HP Regen Amplifier
    { stat: "voidResist",   base: 0, perLevel: 0 },  // 4 Epic      — Void Resistance
    { stat: "dmgReduction", base: 0, perLevel: 0 },  // 5 Legendary — Damage Reduction
  ],
  // The Last Resonance — Amulet (DESIGN §28)
  Amulet: [
    { stat: "xpBonus",          base: 0, perLevel: 0 },  // 1 Common    — XP Bonus
    { stat: "vestigeBonus",     base: 0, perLevel: 0 },  // 2 Uncommon  — Vestige Bonus
    { stat: "offlineBonus",     base: 0, perLevel: 0 },  // 3 Rare      — Offline Bonus
    { stat: "materialDropRate", base: 0, perLevel: 0 },  // 4 Epic      — Material Drop Rate
    { stat: "lumensMult",       base: 0, perLevel: 0 },  // 5 Legendary — Lumens Multiplier
  ],
  // Band of Dusk — Ring (DESIGN §28)
  Ring: [
    { stat: "atkMult",         base: 0, perLevel: 0 },  // 1 Common    — Attack Multiplier
    { stat: "enemyHpReduct",   base: 0, perLevel: 0 },  // 2 Uncommon  — Enemy HP Reduction
    { stat: "convergenceBonus",base: 0, perLevel: 0 },  // 3 Rare      — Convergence Bonus
    { stat: "eclatAffinity",   base: 0, perLevel: 0 },  // 4 Epic      — Éclat Affinity
    { stat: "allStats",        base: 0, perLevel: 0 },  // 5 Legendary — All Stats Bonus
  ],
  // Grasp of the Unnamed — Gloves (DESIGN §28, diversificada)
  Gloves: [
    { stat: "atkSpeed",    base: 0, perLevel: 0 },  // 1 Common    — Attack Speed
    { stat: "aoeDmg",      base: 0, perLevel: 0 },  // 2 Uncommon  — AoE Damage
    { stat: "critRate",    base: 0, perLevel: 0 },  // 3 Rare      — Crit Rate
    { stat: "critDmg",     base: 0, perLevel: 0 },  // 4 Epic      — Crit Damage
    { stat: "critCascade", base: 0, perLevel: 0 },  // 5 Legendary — Crit Cascade Chance
  ],
  // Crown of Hollow Stars — Helmet (DESIGN §28)
  Helmet: [
    { stat: "critVsBoss",    base: 0, perLevel: 0 },  // 1 Common    — Crit Rate vs Bosses
    { stat: "bossHpReduct",  base: 0, perLevel: 0 },  // 2 Uncommon  — Boss HP Reduction
    { stat: "bossSpawnRate", base: 0, perLevel: 0 },  // 3 Rare      — Boss Spawn Rate
    { stat: "bossDropRate",  base: 0, perLevel: 0 },  // 4 Epic      — Boss Drop Rate
    { stat: "bossDmg",       base: 0, perLevel: 0 },  // 5 Legendary — Boss Damage Multiplier
  ],
};

// Raridades: nome, multiplicador de Item Power, CAP de nível.
// Raridade = ×UP geométrico (a "escada" dentro do mapa). Níveis SEM CAP (todos Infinity).
const RARITIES = [
  { name: "common",    mult: 1,     cap: Infinity },
  { name: "uncommon",  mult: 10,    cap: Infinity },
  { name: "rare",      mult: 100,   cap: Infinity },
  { name: "epic",      mult: 1000,  cap: Infinity },
  { name: "legendary", mult: 10000, cap: Infinity },
];


// ═══════════════════════════════════════════════════════════════════════
// Tiers da Ordre de Lumière (DESIGN §15) — 1 por mapa, 5 ascensões totais.
// tier = nº da ascensão = índice do mapa (0→4). minAsc = quantas ascensões para o tier.
// ═══════════════════════════════════════════════════════════════════════
// Tiers da Ordre — marcos da ascensão (até 1000). Ascensão é frequente; os tiers
// são marcos grandes (saltos + benefícios). minAsc = ascensões para o tier.
const TIERS = [
  { name: "Seeker",      minAsc: 0    },
  { name: "Illuminate",  minAsc: 50   },
  { name: "Éclairé",     minAsc: 200  },
  { name: "L'Éveillé",   minAsc: 500  },
  { name: "Lumière",     minAsc: 1000 },
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
  { id: "str", name: "Strength",  icon: "⚔️",  stat: "damage",   baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
  { id: "vit", name: "Vitality",  icon: "❤️",  stat: "health",   baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
  { id: "agi", name: "Agility",   icon: "⚡",  stat: "atkSpeed", baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
  { id: "lck", name: "Luck",      icon: "🍀",  stat: "critRate", baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
  { id: "frt", name: "Fortune",   icon: "🪙",  stat: "goldMult", baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
  { id: "wis", name: "Wisdom",    icon: "📖",  stat: "xpMult",   baseCost: 1, exponent: 1.0, desc: "a definir", perLevel: 0 },
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
    effect: "dmgMult",            perLevel: 0,     maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,      desc: "a definir" },
  { id: "shardBurst",       tree: "eclat",   name: "Shard Burst",        icon: "💥",
    effect: "stub",               perLevel: 0,     maxLevel: 5,  costBase: 60,   costGrowth: 1.8,
    mapReq: 1, killsReq: 50,     desc: "a definir" },
  { id: "luminalEdge",      tree: "eclat",   name: "Luminal Edge",       icon: "✨",
    effect: "critRate",           perLevel: 0,     maxLevel: 10, costBase: 90,   costGrowth: 1.7,
    mapReq: 1, killsReq: 100,    desc: "a definir" },
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
    effect: "critOverflowFactor", perLevel: 0,  maxLevel: 5,  costBase: 1200, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,  desc: "+15% Crit Overflow conversion factor per level" },
  { id: "shatteredLight",   tree: "eclat",   name: "Shattered Light",    icon: "💫",
    effect: "shatteredLight",     perLevel: 0,  maxLevel: 5,  costBase: 1500, costGrowth: 2.4,
    mapReq: 4, killsReq: 50000,  desc: "+0.20 Crit Damage per full 100% crit overflow per level" },
  { id: "fractureWeakness", tree: "eclat",   name: "Fracture Weakness",  icon: "🔷",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 2000, costGrowth: 2.4,
    mapReq: 4, killsReq: 50000,  desc: "+10% damage vs The Claimed and Qliphoth per level" },
  { id: "voidPiercing",     tree: "eclat",   name: "Void Piercing",      icon: "🌑",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 2500, costGrowth: 2.5,
    mapReq: 5, killsReq: 100000, desc: "+10% defense bypass vs corrupted enemies per level" },

  // ── Árvore VESTIGE (recursos, drops, progressão) ─────────────────────
  { id: "lumenBlessing",    tree: "vestige", name: "Lumen Blessing",     icon: "✨",
    effect: "lumensMult",         perLevel: 0,  maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,      desc: "+12% Lumens per kill per level" },
  { id: "wisdomRuins",      tree: "vestige", name: "Wisdom of Ruins",    icon: "📖",
    effect: "xpMult",             perLevel: 0,  maxLevel: 10, costBase: 50,   costGrowth: 1.7,
    mapReq: 1, killsReq: 50,     desc: "+10% XP per kill per level" },
  { id: "remnantHarvest",   tree: "vestige", name: "Remnant Harvest",    icon: "🌿",
    effect: "stub",               perLevel: 0.10,  maxLevel: 5,  costBase: 80,   costGrowth: 1.8,
    mapReq: 1, killsReq: 100,    desc: "+10% material drop chance per level" },
  { id: "vestigePull",      tree: "vestige", name: "Vestige Pull",       icon: "💜",
    effect: "vestigeMult",        perLevel: 0,  maxLevel: 10, costBase: 100,  costGrowth: 1.8,
    mapReq: 1, killsReq: 150,    desc: "+12% Vestiges per kill per level" },
  { id: "scavenger",        tree: "vestige", name: "Scavenger",          icon: "🔍",
    effect: "stub",               perLevel: 0.15,  maxLevel: 5,  costBase: 180,  costGrowth: 1.9,
    mapReq: 2, killsReq: 300,    desc: "+15% boss drop rate per level" },
  { id: "dreamwalker",      tree: "vestige", name: "Dreamwalker",        icon: "🌙",
    effect: "offlineEff",         perLevel: 0,  maxLevel: 10, costBase: 200,  costGrowth: 1.9,
    mapReq: 2, killsReq: 500,    desc: "+6% offline efficiency per level" },
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

  // ── Árvore FRACTURE (debuffs inimigos, sobrevivência) — DESIGN §20 ──────
  { id: "weakenedVoid",      tree: "fracture", name: "Weakened Void",       icon: "🌪️",
    effect: "enemyHpReduct",       perLevel: 0,  maxLevel: 10, costBase: 30,   costGrowth: 1.7,
    mapReq: 1, killsReq: 0,       desc: "-% HP dos inimigos por nível" },
  { id: "fractureSense",     tree: "fracture", name: "Fracture Sense",      icon: "👁️",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 60,   costGrowth: 1.8,
    mapReq: 1, killsReq: 50,      desc: "Chefe spawna mais rápido — afeta primeiro spawn" },
  { id: "voidAwareness",     tree: "fracture", name: "Void Awareness",      icon: "🌐",
    effect: "rewardMult",          perLevel: 0,  maxLevel: 10, costBase: 80,   costGrowth: 1.8,
    mapReq: 1, killsReq: 100,     desc: "+% recompensas de qualquer fonte por nível" },
  { id: "fracturePulse",     tree: "fracture", name: "Fracture Pulse",      icon: "❄️",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 120,  costGrowth: 1.9,
    mapReq: 2, killsReq: 150,     desc: "Ao entrar numa subárea, inimigos começam com -X% HP" },
  { id: "voidHaste",         tree: "fracture", name: "Void Haste",          icon: "🔗",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 180,  costGrowth: 1.9,
    mapReq: 2, killsReq: 300,     desc: "Reduz tempo de spawn dos inimigos por nível" },
  { id: "shardDisruption",   tree: "fracture", name: "Shard Disruption",    icon: "⚡",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 220,  costGrowth: 1.9,
    mapReq: 2, killsReq: 500,     desc: "Chance de inimigo perder turno de ataque por nível" },
  { id: "nihelShadow",       tree: "fracture", name: "Nihel's Shadow",      icon: "🌒",
    effect: "enemyDmgReduct",      perLevel: 0,  maxLevel: 10, costBase: 400,  costGrowth: 2.1,
    mapReq: 3, killsReq: 2000,    desc: "-% dano dos inimigos por nível" },
  { id: "eclatAttunement",   tree: "fracture", name: "Éclat Attunement",    icon: "⏳",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 500,  costGrowth: 2.1,
    mapReq: 3, killsReq: 3000,    desc: "Vestiges gastos amplificam Weakened Void e Nihel's Shadow" },
  { id: "laFracturaEcho",    tree: "fracture", name: "La Fractura's Echo",  icon: "💢",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 600,  costGrowth: 2.2,
    mapReq: 3, killsReq: 5000,    desc: "Segundo spawn do chefe em diante começa com HP reduzido" },
  { id: "lastLight",         tree: "fracture", name: "Last Light",          icon: "🕯️",
    effect: "lastLightDmg",        perLevel: 0,  maxLevel: 5,  costBase: 750,  costGrowth: 2.2,
    mapReq: 3, killsReq: 10000,   desc: "+% dano quando abaixo de 30% HP por nível" },
  { id: "voidCollapse",      tree: "fracture", name: "Void Collapse",       icon: "💫",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 900,  costGrowth: 2.3,
    mapReq: 4, killsReq: 15000,   desc: "Corrompidos implodem causando AoE ao morrer" },
  { id: "theFracturesGift",  tree: "fracture", name: "The Fracture's Gift", icon: "🕳️",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 1000, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,   desc: "Ao quase morrer, burst de dano temporário" },
  { id: "claimedDomination", tree: "fracture", name: "Claimed Domination",  icon: "💠",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 1200, costGrowth: 2.3,
    mapReq: 4, killsReq: 20000,   desc: "The Claimed têm -% stats acima de X tier" },
  { id: "nilsEmbrace",       tree: "fracture", name: "Nil's Embrace",       icon: "🌌",
    effect: "stub",                perLevel: 0,  maxLevel: 5,  costBase: 2000, costGrowth: 2.4,
    mapReq: 5, killsReq: 50000,   desc: "Quanto mais tempo numa subárea, mais forte o jogador" },
  { id: "voidEndurance",     tree: "fracture", name: "Void Endurance",      icon: "🛡️",
    effect: "voidEndurance",       perLevel: 0,  maxLevel: 10, costBase: 2500, costGrowth: 2.5,
    mapReq: 5, killsReq: 100000,  desc: "+% defesa e HP por chefe derrotado no mapa atual por nível" },
];

// ═══════════════════════════════════════════════════════════════════════
// CONFIG — painel de balanceamento central
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// CONFIG — tábula rasa: todos os valores zerados/neutros.
// Cada sistema será projetado do zero, um por vez.
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  player: {
    baseDamage: 1, baseHp: 1,
    damagePerLevel: 0, hpPerLevel: 0,
    baseAttackSpeed: 1.0,
  },
  combat: {
    baseCritMult: 1.0,
    critOverflowToDmg: 0,
    attackSpeedCap:    1,
    attackSpeedFactor: 1.0,
    regenPerLevel: 0,
    radiantCritThreshold: 999,
    enemyCritChanceMin: 0,
    enemyCritChanceMax: 0,
    enemyCritMult: 1.0,
    bossCritChanceMin: 0,
    bossCritChanceMax: 0,
    bossCritMult: 1.0,
  },
  convergence: {
    earlyMult:  1.0,
    earlyCount: 1,
    lateCoef:   0,
    minLevel:   2,
    maxMult:    1e9,
  },
  map: {
    baseHp:         1,
    subareaRamp:    251,
    subareasPerMap: 5,
    killsToBoss:    1,
    materialDropChance: 1.0,
  },
  enemy: {
    dmgRatio:   0,
    goldRatio:  0,
    xpRatio:    0,
    damageFactor: 0,
    ascGrowth: 1.0,
    cursedAtkSpeedReduction: 0,
  },
  boss: {
    hpMult: 1,
    goldMult: 1,
    xpMult: 1,
    shardMult: 1,
  },
  elite: {
    eliteMinSubarea:    1,
    championMinSubarea: 3,
    eliteChance:     0,
    championChance:  0,
    tiers: {
      normal:   { hp: 1.0, dmg: 1.0, reward: 1.0 },
      elite:    { hp: 1.0, dmg: 1.0, reward: 1.0 },
      champion: { hp: 1.0, dmg: 1.0, reward: 1.0 },
    },
  },
  pack: {
    baseBySubarea: [1, 1, 1, 1, 1],
    maxBySubarea:  [1, 1, 1, 1, 1],
  },
  gear: {
    powerPerLevel: 1,
    levelCostBase: 1, levelCostGrowth: 1.0,
    rarityMaterialQty: [1, 1, 1, 1],
    rarityLevelReq: [2, 2, 2, 2],
    affixScale: 0,
  },
  shards: {
    basePerKill: 0,
    perMap: 0,
    perSubarea: 0,
  },
  itemStats: {
    healthPerPower:      0,
    attackSpeedPerPower:  0,
    goldFindPerPower:    0,
    shardFindPerPower:   0,
    critDmgPerPower:     0,
    bossDmgPerPower:     0,
  },
  xp: { base: 1, growth: 1.0 },
  ascension: {
    perLevelGrowth: 1.0,
    multBase:   1.0,
    multSlope:  0,
    convPerAsc: 1,
    vestBase:   1,
    vestGrowth: 1.0,
    maxAscensions: 1000,
  },
  offline: {
    startEfficiency: 0, efficiencyMax: 0,
    startCapHours: 0,   capMaxHours: 0,
    ascPerStep: 1,      effPerStep: 0,
    capHoursPerStep: 0,
  },
  synergy: {
    bonusPerLevel: 0,
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
    GOLD_STATS, PASSIVES,
    CONFIG, NUMBER_SUFFIXES,
    fmt, fmtMult, fmtPct,
  };
}
