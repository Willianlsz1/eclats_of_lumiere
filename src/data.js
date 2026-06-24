// data.js — conteúdo do jogo (fonte da verdade)
// Balanceamento = mexer só aqui. Nenhuma lógica.

G.data = {
  // Tiers do Seeker (visual progression)
  tiers: [
    { level: 1,    name: "Seeker",     code: "T1" },
    { level: 10,   name: "Illuminate", code: "T2" },
    { level: 25,   name: "Éclairé",    code: "T3" },
    { level: 50,   name: "L'Éveillé",  code: "T4" },
    { level: 100,  name: "Lumière",    code: "T5" },
  ],

  // 6 slots de gear (fixos, nunca dropam)
  slots: [
    { id: "weapon", label: "Weapon", icon: "⚔️" },
    { id: "helmet", label: "Helmet", icon: "🪖" },
    { id: "armor",  label: "Armor",  icon: "🛡️" },
    { id: "gloves", label: "Gloves", icon: "🧤" },
    { id: "boots",  label: "Boots",  icon: "🥾" },
    { id: "cloak",  label: "Cloak",  icon: "🧥" },
  ],

  // Base de cada peça. affixes[].base = valor no Lv.1, perLevel = ganho/nível.
  // valor final no Lv. N = base + perLevel × (N - 1)
  gearBase: {
    weapon: {
      name: "Worn Blade",
      affixes: [
        { id: "atk",  label: "Attack", stat: "atk", layer: "flat", base: 0, perLevel: 20 },
        { id: "atkp", label: "Attack", stat: "atk", layer: "pct",  base: 0, perLevel: 1  },
      ],
    },
    helmet: {
      name: "Worn Helm",
      affixes: [
        { id: "hp",      label: "HP",          stat: "hp",      layer: "flat", base: 0, perLevel: 20 },
        { id: "critDmg", label: "Crit Damage",  stat: "critDmg", layer: "flat", base: 0, perLevel: 1  },
      ],
    },
    armor: {
      name: "Worn Cuirass",
      affixes: [
        { id: "hpp", label: "HP",  stat: "hp",      layer: "pct",  base: 0, perLevel: 1   },
        { id: "xp",  label: "XP",  stat: "xpBonus", layer: "flat", base: 0, perLevel: 0.5 },
      ],
    },
    gloves: {
      name: "Worn Gloves",
      affixes: [
        { id: "crit",    label: "Crit Rate",   stat: "crit",    layer: "flat", base: 0.05, perLevel: 0.025 },
        { id: "critDmg", label: "Crit Damage", stat: "critDmg", layer: "flat", base: 0,    perLevel: 1     },
      ],
    },
    boots: {
      name: "Worn Boots",
      affixes: [
        { id: "atkspd", label: "Attack Speed", stat: "atkSpeed", layer: "flat", base: 0, perLevel: 0.01  },
        { id: "xp",     label: "XP",           stat: "xpBonus", layer: "flat", base: 2, perLevel: 0.5   },
      ],
    },
    cloak: {
      name: "Worn Cloak",
      affixes: [
        { id: "lumens", label: "Lumens", stat: "lumensBonus", layer: "flat", base: 5, perLevel: 1 },
        { id: "atkp",   label: "Attack", stat: "atk",         layer: "pct",  base: 0, perLevel: 1 },
      ],
    },
  },

  // Raridades (Day 1: apenas Common)
  rarities: [
    { id: "common", name: "Common", color: "#9aa7bd", cap: 500 },
  ],

  // Variantes raras de mob comum (adicionam variedade sem sistema separado)
  rareMobs: {
    chance:     0.08,
    plusChance: 0.15,
    rare: {
      tag: "Rare", color: "#9d7bff",
      hpMult: 3, dmgMult: 1.5, rewardMult: 3,
      names: ["Pale Wanderer", "Dusk Remnant", "Mist Shard", "Fractured Echo", "Gilded Wisp"],
    },
    plus: {
      tag: "Rare+", color: "#e8b54a",
      hpMult: 6, dmgMult: 2, rewardMult: 6,
      names: ["Luminal Wraith", "Éclat Splinter", "Hollow Sovereign", "Veil Incarnate", "Shard of Luce"],
    },
  },

  // 9 sub-áreas do Mapa 1
  areas: [
    {
      id: 1, name: "The Dreaming Wood",
      blurb: "Where the Seeker first wakes. Soft auroras drip through ancient boughs, and here the light still dreams.",
      img: "assets/areas/dreaming_wood.png",
      levelRange: [1, 80],
      hp: [2000, 2500],
      enemies: [
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
      ],
      boss: { name: "The Waking Bloom", sprite: "🌸", img: "assets/enemies/waking_bloom.png" },
    },
    {
      id: 2, name: "The Lantern Mire",
      blurb: "A drowned bog of guttering lanterns, where Fragmented souls lost themselves chasing the light.",
      img: "assets/areas/lantern_mire.png",
      levelRange: [81, 350],
      hp: [40000, 80000],
      enemies: [
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
      ],
      boss: { name: "The Drowned Lantern", sprite: "🕯", img: "assets/enemies/drowned_lantern.png" },
    },
    {
      id: 3, name: "The Whispering Hollows",
      blurb: "Hollow trees that sing the trapped light, their murmurs curling endlessly through the dark.",
      img: "assets/areas/whispering_hollows.png",
      levelRange: [351, 700],
      hp: [1000000, 3000000],
      enemies: [
        { name: "Husklight Murmur",  sprite: "🌳", img: "assets/enemies/husklight_murmur.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
      ],
      boss: { name: "The Hollow Cantor", sprite: "🎶", img: "assets/enemies/hollow_cantor.png" },
    },
    {
      id: 4, name: "The Moonlit Canopy",
      blurb: "The high canopy, nearest the aurora, where moths and wardens drift through a pale, restless glow.",
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [701, 1150],
      hp: [20000000, 80000000],
      enemies: [
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
        { name: "Mothlight Herald",   sprite: "🦋", img: "assets/enemies/mothlight_herald.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
      ],
      boss: { name: "The Moonlit Sovereign", sprite: "👑", img: "assets/enemies/moonlit_sovereign.png" },
    },
    {
      id: 5, name: "The Sunken Grove",
      blurb: "A flooded, mirrored grove — every still pool reflects the creeping Mist back at the Seeker.",
      img: "assets/areas/sunken_grove.png",
      levelRange: [1151, 1700],
      hp: [400000000, 1500000000],
      enemies: [
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
        { name: "Mirelight Drifter",  sprite: "🏮", img: "assets/enemies/mirelight_drifter.png"  },
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
      ],
      boss: { name: "The Stillwater Maiden", sprite: "🪷", img: "assets/enemies/stillwater_maiden.png" },
    },
    {
      id: 6, name: "The Gilded Thicket",
      blurb: "A bramble of thorns where the golden corruption climbs — beautiful, and entirely wrong.",
      img: "assets/areas/gilded_thicket.png",
      levelRange: [1701, 2350],
      hp: [6000000000, 20000000000],
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Candlewisp Shade",   sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"   },
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
      ],
      boss: { name: "The Bramble King", sprite: "🥀", img: "assets/enemies/bramble_king.png" },
    },
    {
      id: 7, name: "The Hollow Cathedral",
      blurb: "A cathedral grown of living wood, where the Fragmented kneel and worship the captured light.",
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [2351, 3150],
      hp: [40000000000, 100000000000],
      enemies: [
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
      boss: { name: "The Gilded Confessor", sprite: "✝", img: "assets/enemies/gilded_confessor.png" },
    },
    {
      id: 8, name: "The Weeping Roots",
      blurb: "The deep roots, where the forest bleeds light and mourns everything it has lost.",
      img: "assets/areas/weeping_roots.png",
      levelRange: [3151, 4050],
      hp: [120000000000, 200000000000],
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
      ],
      boss: { name: "The Heartroot Mourner", sprite: "🩸", img: "assets/enemies/heartroot_mourner.png" },
    },
    {
      id: 9, name: "The Hollow Sanctum",
      blurb: "The heart of the wood — the climax of the Dreaming, where the Gilded Hollow waits in the hush.",
      img: "assets/areas/hollow_sanctum.png",
      levelRange: [4051, 5000],
      hp: [220000000000, 350000000000],
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", img: "assets/enemies/gilded_hollow.png" },
    },
  ],

  // HP do mob em dois níveis: curva suave dentro da área + salto brusco entre áreas.
  // hp: [inicial, final] por área. areaHpGrowth deriva a taxa interna.
  areaAt(level) {
    for (const a of this.areas) if (level <= a.levelRange[1]) return a;
    return this.areas[this.areas.length - 1];
  },

  areaHpGrowth(area) {
    const [lo, hi] = area.levelRange;
    const [hpIni, hpFim] = area.hp;
    const span = hi - lo;
    if (span <= 0 || hpIni <= 0) return 1;
    return Math.pow(hpFim / hpIni, 1 / span);
  },

  mobHpAt(level, area) {
    area = area || this.areaAt(level);
    const lo = area.levelRange[0];
    const within = G.util.clamp(level, lo, area.levelRange[1]) - lo;
    return area.hp[0] * Math.pow(this.areaHpGrowth(area), within);
  },

  currentArea() {
    const i = G.util.clamp(G.state.data.areaIndex || 0, 0, this.areas.length - 1);
    return this.areas[i];
  },

  balance: {
    mobAtkBase:        45,
    mobAtkGrowth:      1.00085,
    atkSpeedBase:      0.9,
    atkSpeedCap:       15,
    healOnKillFrac:    0.10,
    bossHpMult:        4,
    bossDmgMult:       1.5,
    bossRewardMult:    6,
    goldRatio:         0.25,
    baseXp:            10,
    respawnDelay:      1.0,
    gearCostBase:      1100,
    gearCostGrowth:    1.05,
    forgeCostBase:     20,
    forgeCostGrowth:   1.064,
  },
};
