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
    desert:  { "Scorpion": "assets/enemies/desert/scorpion.png", "Mummy": "assets/enemies/desert/mummy.png", "Djinn": "assets/enemies/desert/djinn.png" },
    peak:    { "Young Dragon": "assets/enemies/peak/young-dragon.png", "Chimera": "assets/enemies/peak/chimera.png", "Titan": "assets/enemies/peak/titan.png" },
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
  // Inicia a checagem assíncrona; retorna false até confirmar.
  _assetCache[path] = false;
  const img = new Image();
  img.onload = () => { _assetCache[path] = true; };
  img.onerror = () => { _assetCache[path] = false; };
  img.src = path;
  return false;
}

// Regions cosméticas — puramente visuais, mudam a cada CONFIG.zonesPerRegion zones.
// Cada region reúne TODOS os seus dados (nome, enemies, emoji, CSS) num único objeto.
// Adicionar uma region = 1 linha aqui. Nenhum outro arquivo precisa ser editado.
const REGIONS = [
  { name: "Plains of Aurin",    cssClass: "region-plains",  enemies: ["Slime", "Giant Rat", "Goblin"],       emojis: { "Slime": "🟢", "Giant Rat": "🐀", "Goblin": "👺" } },
  { name: "Whispering Forest",  cssClass: "region-forest",  enemies: ["Shadow Wolf", "Spider", "Treant"],     emojis: { "Shadow Wolf": "🐺", "Spider": "🕷️", "Treant": "🌳" } },
  { name: "Frostbound Caverns", cssClass: "region-caverns", enemies: ["Yeti", "Ice Golem", "Bat"],           emojis: { "Yeti": "❄️", "Ice Golem": "🧊", "Bat": "🦇" } },
  { name: "Ashen Desert",       cssClass: "region-desert",  enemies: ["Scorpion", "Mummy", "Djinn"],         emojis: { "Scorpion": "🦂", "Mummy": "🧟", "Djinn": "🌪️" } },
  { name: "Gaiadon's Peak",     cssClass: "region-peak",    enemies: ["Young Dragon", "Chimera", "Titan"],   emojis: { "Young Dragon": "🐉", "Chimera": "🦁", "Titan": "🗿" } },
];

// Nomes únicos por zona — imersão narrativa sem mudar nenhuma lógica.
// Índice 0 = zona 1. Para zonas além do array, zoneName() usa fallback "Zone X".
const ZONE_NAMES = [
  // ── Plains of Aurin (1-10) ─────────────────────────────────────────────
  "Muddy Hollow",          // 1
  "Goblin Camp",           // 2
  "Thornbriar Patch",      // 3
  "Crumbling Outpost",     // 4
  "Bandit's Crossing",     // 5
  "Rotting Stockade",      // 6
  "Howling Flats",         // 7
  "Bleakwood Trail",       // 8
  "Watcher's Ridge",       // 9
  "The Aurin Gate",        // 10  ← boss zone

  // ── Whispering Forest (11-20) ──────────────────────────────────────────
  "Mossy Glade",           // 11
  "Wolf's Run",            // 12
  "Spider Hollow",         // 13
  "Ancient Oak Ring",      // 14
  "Umbral Canopy",         // 15
  "Root Maze",             // 16
  "Shadowbark Trail",      // 17
  "The Twisted Grove",     // 18
  "Deep Wood's Heart",     // 19
  "Treant's Throne",       // 20  ← boss zone

  // ── Frostbound Caverns (21-30) ─────────────────────────────────────────
  "Ice Shelf Entry",       // 21
  "Frozen Corridor",       // 22
  "Blizzard Grotto",       // 23
  "Yeti's Lair",           // 24
  "Glacial Depths",        // 25
  "The Black Ice Vein",    // 26
  "Crystal Cathedral",     // 27
  "Frost Wyrm's Pass",     // 28
  "Eternal Winter",        // 29
  "Cavern's Frozen Heart", // 30  ← boss zone

  // ── Ashen Desert (31-40) ──────────────────────────────────────────────
  "Scorched Flats",        // 31
  "Dune of Bones",         // 32
  "Sunbaked Ruins",        // 33
  "Mirage Wastes",         // 34
  "Sandstorm Valley",      // 35
  "Mummy's Tomb",          // 36
  "Djinn's Hollow",        // 37
  "Obsidian Mesa",         // 38
  "The Burning Threshold", // 39
  "Sultan's Graveyard",    // 40  ← boss zone

  // ── Gaiadon's Peak (41-50) ────────────────────────────────────────────
  "Mountain Approach",     // 41
  "Dragon's Roost",        // 42
  "Chimera Ridge",         // 43
  "Stormlord's Cleft",     // 44
  "The Fractured Summit",  // 45
  "Titan Grounds",         // 46
  "Sky Shard Cliffs",      // 47
  "Heaven's Edge",         // 48
  "Throne Antechamber",    // 49
  "Gaiadon's Throne",      // 50  ← boss zone

  // ── Ruined Plains (51-60) ─────────────────────────────────────────────
  "Ashen Hollow",          // 51
  "Daemon's Camp",         // 52
  "Thornfire Patch",       // 53
  "Cursed Outpost",        // 54
  "Warlord's Crossing",    // 55
  "Forsaken Stockade",     // 56
  "Wailing Flats",         // 57
  "Grimwood Trail",        // 58
  "Corrupted Ridge",       // 59
  "The Broken Gate",       // 60  ← boss zone

  // ── Withered Forest (61-70) ───────────────────────────────────────────
  "Putrid Glade",          // 61
  "Hellhound's Run",       // 62
  "Venom Spider Pit",      // 63
  "Blighted Oak Ring",     // 64
  "Void Canopy",           // 65
  "Cursed Root Maze",      // 66
  "Darkbark Trail",        // 67
  "The Dead Grove",        // 68
  "Heart of Blight",       // 69
  "Ancient Treant's Corpse", // 70  ← boss zone

  // ── Shattered Caverns (71-80) ─────────────────────────────────────────
  "Crumbling Shelf",       // 71
  "Cursed Corridor",       // 72
  "Howling Grotto",        // 73
  "Elder Yeti's Den",      // 74
  "Abyssal Depths",        // 75
  "Dark Crystal Vein",     // 76
  "Shattered Cathedral",   // 77
  "Wyrm Bone Pass",        // 78
  "The Endless Winter",    // 79
  "Heart of Ruin",         // 80  ← boss zone

  // ── Scorched Wastes (81-90) ───────────────────────────────────────────
  "Blistered Flats",       // 81
  "Skeleton Dunes",        // 82
  "Cursed Ruins",          // 83
  "Phantom Wastes",        // 84
  "Eternal Sandstorm",     // 85
  "Lich's Tomb",           // 86
  "Elder Djinn's Prison",  // 87
  "Black Mesa",            // 88
  "The Infernal Threshold", // 89
  "The Eternal Graveyard", // 90  ← boss zone

  // ── Shattered Peak (91-100) ───────────────────────────────────────────
  "Desolate Approach",     // 91
  "Dragon's Lair",         // 92
  "Chimera Nest",          // 93
  "Tempest's Maw",         // 94
  "The Broken Summit",     // 95
  "Fallen Titan Grounds",  // 96
  "Void Shard Cliffs",     // 97
  "Edge of Eternity",      // 98
  "The Final Threshold",   // 99
  "Shattered Throne",      // 100 ← boss zone
];

// Slots de equipamento (data-driven — dá pra adicionar mais slots no futuro).
// Cada slot concede um ou mais Stats e tem um nome-base por raridade (cosmético).
const SLOTS = [
  { id: "Weapon", stats: ["Damage"],                   defaultName: "Sword"   },
  { id: "Armor",  stats: ["Health"],                   defaultName: "Tunic"   },
  { id: "Amulet", stats: ["Attack Speed", "Gold Find"], defaultName: "Pendant" },
  { id: "Ring",   stats: ["Shard Find"],               defaultName: "Band"    },
  { id: "Gloves", stats: ["Crit Damage"],              defaultName: "Grips"   },
  { id: "Helmet", stats: ["Boss Damage"],              defaultName: "Crown"   },
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
  Amulet: [ // economia + utilidade
    { stat: "goldMult", base: 0.25, perLevel: 0.005 },
    { stat: "xpMult",   base: 0.25, perLevel: 0.005 },
    { stat: "goldMult", base: 0.50, perLevel: 0.007 },
    { stat: "xpMult",   base: 0.50, perLevel: 0.008 },
  ],
  Ring: [ // economia de shard — destrava raridade mais rápido
    { stat: "shardMult", base: 0.20, perLevel: 0.004 }, // uncommon
    { stat: "xpMult",    base: 0.20, perLevel: 0.004 }, // rare
    { stat: "shardMult", base: 0.40, perLevel: 0.006 }, // epic
    { stat: "goldMult",  base: 0.30, perLevel: 0.005 }, // legendary
  ],
  Gloves: [ // ofensa — escala crits com gear
    { stat: "critDmg",  base: 0.20, perLevel: 0.003  }, // uncommon
    { stat: "critRate", base: 0.05, perLevel: 0.0003 }, // rare
    { stat: "dmgMult",  base: 0.15, perLevel: 0.003  }, // epic
    { stat: "critDmg",  base: 0.50, perLevel: 0.006  }, // legendary
  ],
  Helmet: [ // especialização em bosses — ataca as paredes de progresso
    { stat: "bossDmg", base: 0.15, perLevel: 0.003 }, // uncommon
    { stat: "hpMult",  base: 0.20, perLevel: 0.004 }, // rare
    { stat: "bossDmg", base: 0.30, perLevel: 0.005 }, // epic
    { stat: "dmgMult", base: 0.20, perLevel: 0.003 }, // legendary
  ],
};

// Raridades: nome, multiplicador de Item Power, e CAP de nível (×10 por tier).
// A ORDEM importa (índice = tier). legendary tem cap "infinito".
const RARITIES = [
  { name: "common",    mult: 1.0, cap: 25 },
  { name: "uncommon",  mult: 1.5, cap: 75 },
  { name: "rare",      mult: 2.2, cap: 150 },
  { name: "epic",      mult: 3.5, cap: 300 },
  { name: "legendary", mult: 6.0, cap: Infinity }, // sem teto: nivela infinitamente
];

// Tiers de classe do herói. Cada tier tem:
//   minAsc  — nº total de ascensões para entrar neste tier
//   mult    — multiplicador por ascensão feita DENTRO deste tier
//   spike   — bônus único aplicado AO ENTRAR no tier (acumula nos tiers seguintes)
// Tier 0 não tem spike (é o inicial). A ascensão 50 já usa o rate do Warrior.
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
    baseAttackSpeed: 1.0, // ataques por segundo (1 hit/s base)
  },
  combat: { baseCritMult: 2.0 }, // crítico base = ×2 (afixos de Crit Damage somam a isto)
  enemy: {
    baseHp: 4, hpGrowth: 1.22,      // HP escala com a zone (mais hardcore que o original 1.20)
    baseDmg: 3, dmgGrowth: 1.20,
    baseGold: 6, goldGrowth: 1.16,
    baseXp: 4, xpGrowth: 1.12,
    killsBase: 10, killsPerZone: 3, // abates p/ limpar = killsBase + (zone-1)*killsPerZone
    damageFactor: 0.3,              // dano por segundo de CADA inimigo do pack (vários atacam juntos)
    ascGrowth: 1.06,               // HP e DMG dos inimigos × 1.06 por ascensão do jogador
    frontierDangerSec: 15,         // zona-fronteira: DMG calibrado para matar o jogador em ~15s (pressão real)
    regionPowerMult: 15,           // a cada nova região (10 zonas) inimigos ficam 15× mais fortes (portões de progressão)
  },
  boss: {
    everyZones: 10,                 // Boss Zone a cada N zones
    hpMult: 8,                      // Health do Boss = Enemy normal × isto
    goldMult: 5, xpMult: 5, shardMult: 5, // recompensas extras do Boss
  },
  // Elite & Champion: inimigos especiais que aparecem aleatoriamente nos packs.
  // Stats SUBSTITUEM o normal (multiplicador sobre a base calibrada).
  // Elite  → vermelho  · Champion → roxo/dourado
  // Não aparecem em Boss Zones (bosses já são únicos).
  elite: {
    eliteMinZone:    5,    // zonas iniciais são fáceis — elites chegam no mid-game
    eliteChance:     0.15, // 15%: frequente o bastante para ser divertido, não spam
    championMinZone: 20,   // champion só na segunda região em diante
    championChance:  0.04, // 4%: raro e emocionante — "jackpot" do pack
    // Multiplicadores sobre os stats calibrados do inimigo normal.
    tiers: {
      normal:   { hp: 1.0, dmg: 1.0, reward: 1.0 },
      elite:    { hp: 1.8, dmg: 1.5, reward: 2.5 },  // recompensa 2.5×
      champion: { hp: 3.5, dmg: 2.5, reward: 6.0 },  // recompensa 6×
    },
  },
  // Pack: quantos inimigos aparecem juntos (todos atacam; você foca um por vez).
  // Crescimento mais rápido e cap maior para que profundidade = mais inimigos.
  pack: {
    base: 1, perZones: 5, max: 8,
    // size = base + floor((zone-1)/perZones), teto max. Boss vem sempre sozinho.
    // zone 1 → 1 · zone 6 → 2 · zone 11 → 3 · zone 16 → 4 · zone 21 → 5
    // zone 26 → 6 · zone 31 → 7 · zone 36+ → 8
  },
  // Equipamento: Item Power = powerPerLevel × level × mult(raridade).
  gear: {
    powerPerLevel: 1,
    levelCostBase: 5, levelCostGrowth: 1.15,  // custo de GOLD por nível (1.15 = gold escasso, escolhas importam)
    rarityCostBase: 50, rarityCostGrowth: 20,  // custo BASE de shards (50/1000/20000/400000) — escala com totalPowerMult em runtime
  },
  // Shards (material) dropam dos inimigos e sobem a raridade do equipamento.
  shards: {
    basePerKill: 1, perZone: 0.2,   // por abate, escala com a zone
    bossMult: 5,
  },
  // Como o Item Power vira bônus de cada stat:
  itemStats: {
    healthPerPower:    3,       // Armor:  +power × 3 de Health
    attackSpeedPerPower: 0.01,  // Amulet: +power × 0.01 golpes/s
    goldFindPerPower:  0.02,    // Amulet: +power × 0.02 de ouro
    // Weapon: Damage usa o power 1:1 (sem fator).
    shardFindPerPower: 0.015,   // Ring:   +power × 1.5% de Shard Find
    critDmgPerPower:   0.004,   // Gloves: +power × 0.4% de Crit Damage
    bossDmgPerPower:   0.008,   // Helmet: +power × 0.8% de Boss Damage
  },
  xp: { base: 20, growth: 1.10 }, // xpToNext = base * growth^(level-1) (curva achatada p/ níveis altos)
  // Ascensão: gate DUPLO — nível mínimo fixo (warmup) + zona crescente (grind real).
  // firstReqLevel: nível constante exigido após cada reset (trivial com equipamento).
  // firstReqZone / zoneIncrement: zona-fronteira exigida cresce +1 por ascensão.
  //   Ex: asc 1 = zona 5, asc 16 = zona 21, asc 100 = zona 105, asc 1000 = zona 1005.
  // Isso é auto-balanceado: a calibração de fronteira garante que cada nova zona
  // seja sempre proporcional ao poder atual, mantendo o tempo por ascensão constante.
  // perLevelGrowth: stats por nível (dano/vida) multiplicam a cada ascensão.
  ascension: {
    firstReqLevel: 30,    // nível mínimo fixo (não cresce — warmup real antes do reset)
    firstReqZone: 10,     // zona mínima para a 1ª ascensão (limpar toda a 1ª região + boss)
    zoneIncrement: 1,     // +1 zona exigida a cada ascensão (linear)
    perLevelGrowth: 1.03, // multiplicador de stats por nível a cada ascensão (sutil mas compound)
  },
  // Offline melhora automaticamente a cada ascPerStep ascensões (sem gastar nada).
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.50, // teto: 50%
    startCapHours: 2,      capMaxHours: 24,      // teto: 24h
    ascPerStep: 10,        effPerStep: 0.0125,   // +1.25% por passo (~200 asc p/ 50%)
    capHoursPerStep: 0.25,                       // +15 min por passo (~880 asc p/ 24h)
  },
  zonesPerRegion: 10, // muda a region cosmética a cada 10 zones
  // Zone Mastery: recompensa grind permanente por zona.
  // Matar X inimigos numa zona a "masteriza" — bônus de eficiência económica
  // (gold/xp/shard) que persiste entre ascensões. Não afeta dano/HP para não
  // mexer na calibração de fronteira.
  mastery: {
    killsBase: 50,          // zona 1 precisa de 50 kills para masterizar
    killsPerZone: 3,        // +3 por zona (zona 10→77, zona 30→137, zona 50→197)
    bonusPerZone: 0.005,    // +0.5% de gold/xp/shard por zona masterizada (30 zonas → +15%)
  },
  // Synergy: soma dos níveis de todos os slots de equipamento.
  // Bônus linear: +bonusPerLevel% a todos os stats por nível.
  // Surge: a cada surgeInterval níveis, multiplica tudo por surgeMultiplier (acumula).
  synergy: {
    bonusPerLevel:   0.001,  // +0.1% por nível de sinergia (linear)
    surgeInterval:   100,    // novo Surge a cada 100 níveis totais de equipamento (~17 lv/slot)
    surgeMultiplier: 1.10,   // cada Surge multiplica todos os stats por ×1.10 (compound controlado)
  },
};

if (typeof module !== "undefined") {
  module.exports = { REGIONS, ZONE_NAMES, SLOTS, RARITIES, AFFIXES, TIERS, CONFIG };
}
