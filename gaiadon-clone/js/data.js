'use strict';

const MAPS = [
  { name:'The Dreaming Wood',    lvl:[1,    1e3], hp:[10,   1e6 ], dmg:[1,    1e4 ], killThreshold:100 },
  { name:'Cavernes Luminis',     lvl:[1e3,  1e5], hp:[1e6,  1e16], dmg:[1e4,  1e12], killThreshold:200 },
  { name:'The Ashen Ruins',      lvl:[1e5,  1e7], hp:[1e16, 1e34], dmg:[1e12, 1e26], killThreshold:350 },
  { name:'The Fractured Peaks',  lvl:[1e7,  1e8], hp:[1e34, 1e62], dmg:[1e26, 1e46], killThreshold:500 },
  { name:'Nil Aeternum',         lvl:[1e8,  1e9], hp:[1e62, 1e100],dmg:[1e46, 1e75], killThreshold:800 },
];
const NSUB = 5;

// Pack size per map × sub (5 subs each)
const PACK_SIZE = [
  [1, 2,  4,  6,  8 ],
  [5, 8,  11, 14, 18],
  [10,14, 17, 21, 24],
  [14,18, 22, 26, 29],
  [20,26, 31, 36, 40],
];

// [level_threshold, cumulative_multiplier]
const MILESTONES = [
  [10,2],[25,2.5],[50,3],[100,4],[200,4.5],[400,5],[800,5.5],[1600,6],[3200,6.5]
];

// Vestige costs for each Ascension (null = free, kill Nihel)
const ASC_COST   = [5e5, 1.9e6, 4e6, 8e6, null];
const ASC_MULT   = [10, 5, 5, 5, 5];
const ECLAT_LUMP = [100, 300, 900, 2700, 0];

// 15 Mémoires — era (1-5), dmgBonus per level (additive to Clarté exponent)
const MEMOIRES = [
  { name:'Lumière Brisée',       era:1, desc:'+1 Clarté exponent per level' },
  { name:'Écho du Vide',         era:1, desc:'+1 Clarté exponent per level' },
  { name:'Traces de Cendres',    era:1, desc:'+1 Clarté exponent per level' },
  { name:'Souvenir Fracturé',    era:2, desc:'+1 Clarté exponent per level' },
  { name:'Le Premier Éveil',     era:2, desc:'+1 Clarté exponent per level' },
  { name:'Voix du Néant',        era:2, desc:'+1 Clarté exponent per level' },
  { name:'Reflet Perdu',         era:3, desc:'+1 Clarté exponent per level' },
  { name:'Marque de l\'Abysse',  era:3, desc:'+1 Clarté exponent per level' },
  { name:'Résonance Brisée',     era:3, desc:'+1 Clarté exponent per level' },
  { name:'Chant du Crépuscule',  era:4, desc:'+1 Clarté exponent per level' },
  { name:'Héritage du Chaos',    era:4, desc:'+1 Clarté exponent per level' },
  { name:'Larme de Lumière',     era:4, desc:'+1 Clarté exponent per level' },
  { name:'L\'Ultime Fracture',   era:5, desc:'+1 Clarté exponent per level + Blessure every 3' },
  { name:'Éclat Final',          era:5, desc:'+1 Clarté exponent per level + Blessure every 3' },
  { name:'Nil Aeternum',         era:5, desc:'+1 Clarté exponent per level + Blessure every 3' },
];

// Gear pieces (6 total)
const GEAR_DEF = [
  { name:'The Waning Edge',      stat:'dmg',  base:0.10 },
  { name:'Veil of Cinders',      stat:'hp',   base:0.10 },
  { name:'Crown of Hollow Stars',stat:'dmg',  base:0.08 },
  { name:'Grasp of the Unnamed', stat:'aps',  base:0.06 },
  { name:'The Last Resonance',   stat:'dmg',  base:0.12 },
  { name:'Band of Dusk',         stat:'hp',   base:0.12 },
];

// rarity index → { label, ratePerLevel, levelCap }
const RARITY = [
  { label:'Common',    rate:0.0050, cap:100    },
  { label:'Rare',      rate:0.0020, cap:500    },
  { label:'Epic',      rate:0.0008, cap:2000   },
  { label:'Legendary', rate:0.00025,cap:Infinity }, // cap = 25000 * ascensions (computed at runtime)
];

// Passives — 3 trees of 15 each (45 total), using aggregate envelope (+5% per total level)
const PASSIVES_DEF = {
  eclat: [
    { name:'Radiant Strike',   desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Fracture Point',   desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Void Echo',        desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Shard Mastery',    desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Boss Rend',        desc:'Boss Dmg +5%/lv',     tree:'eclat'   },
    { name:'Cinder Pulse',     desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Hollow Edge',      desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Piercing Light',   desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Cascade Strike',   desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Apex Fracture',    desc:'Dmg +10% per level',  tree:'eclat'   },
    { name:'Null Resonance',   desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Eternal Shard',    desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Void Rift',        desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Lumière Blade',    desc:'Dmg +5% per level',   tree:'eclat'   },
    { name:'Final Fracture',   desc:'Dmg +10% per level',  tree:'eclat'   },
  ],
  vestige: [
    { name:'Lumen Surge',      desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Deep Memory',      desc:'XP +5%/lv',           tree:'vestige' },
    { name:'Vestige Hoard',    desc:'Vestiges +5%/lv',     tree:'vestige' },
    { name:'Gold Rush',        desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Echo Harvest',     desc:'Vestiges +5%/lv',     tree:'vestige' },
    { name:'Rune Cache',       desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Shard Greed',      desc:'Éclats +5%/lv',       tree:'vestige' },
    { name:'Lost Archive',     desc:'XP +5%/lv',           tree:'vestige' },
    { name:'Treasure Ward',    desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Apex Loot',        desc:'All yields +5%/lv',   tree:'vestige' },
    { name:'Overflow',         desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Fracture Cache',   desc:'Vestiges +5%/lv',     tree:'vestige' },
    { name:'Echoing Wealth',   desc:'Lumens +5%/lv',       tree:'vestige' },
    { name:'Voracious',        desc:'XP +5%/lv',           tree:'vestige' },
    { name:'Endgame Hoard',    desc:'All yields +10%/lv',  tree:'vestige' },
  ],
  fracture: [
    { name:'Swift Fracture',   desc:'APS +3%/lv',          tree:'fracture'},
    { name:'Void Walker',      desc:'Mob HP -3%/lv',        tree:'fracture'},
    { name:'Temporal Rift',    desc:'Offline eff +5%/lv',  tree:'fracture'},
    { name:'Shatter Step',     desc:'APS +3%/lv',          tree:'fracture'},
    { name:'Null Armor',       desc:'Player HP +5%/lv',    tree:'fracture'},
    { name:'Regen Surge',      desc:'Regen +5%/lv',        tree:'fracture'},
    { name:'Phase Shift',      desc:'APS +3%/lv',          tree:'fracture'},
    { name:'Fracture Skin',    desc:'Player HP +5%/lv',    tree:'fracture'},
    { name:'Time Shard',       desc:'Offline eff +5%/lv',  tree:'fracture'},
    { name:'Apex Speed',       desc:'APS +5%/lv',          tree:'fracture'},
    { name:'Void Cloak',       desc:'Mob HP -5%/lv',        tree:'fracture'},
    { name:'Endurance',        desc:'Player HP +5%/lv',    tree:'fracture'},
    { name:'Eternal Phase',    desc:'APS +3%/lv',          tree:'fracture'},
    { name:'Stillness',        desc:'All survival +5%/lv', tree:'fracture'},
    { name:'Apex Rift',        desc:'Offline eff +10%/lv', tree:'fracture'},
  ],
};

const CONFIG = {
  baseDmg:        7.0,
  baseAPS:        0.40,
  apsCap:         1.25,
  playerBaseHp:   50.0,
  regenPct:       0.01,
  regenOnKillPct: 0.02,
  goldRatio:      0.10,
  xpRatio:        0.08,
  bossHpMult:     15,
  bossDmgMult:    3,
  statCostBase:   10,
  statCostRamp:   1.15,
  strPer:         0.08,
  vitPer:         0.06,
  agiPer:         0.04,
  lckPer:         0.015,
  frtPer:         0.05,
  wisPer:         0.05,
  convPointBonus: 0.15,
  capBase:        8,
  capRamp:        1.5,
  vestSave:       0.60,   // 60% → vestige pool for ascension cost, 40% → passive pool
  clarte:         1.07,
  memCostBase:    2.0,
  memCostRamp:    1.10,
  passDmgPer:     0.05,
  passCostBase:   100.0,
  passCostRamp:   1.25,
  dripBase:       0.1,    // éclats/h base for drip formula
  gearUpgCostBase:50,
  gearUpgCostRamp:1.20,
};
