// =============================================================
// data.js — CONTEÚDO do jogo (a "fonte da verdade" do que existe)
// =============================================================
// Inimigos, raridades, afixos, slots e tiers do herói.
// Mexer no balanceamento do jogo = mexer só aqui. Nenhuma lógica.

G.data = {
  // ---- Tiers do Seeker (escada T1->T5 do art direction) ----
  tiers: [
    { level: 1, name: "Seeker", code: "T1" },
    { level: 10, name: "Illuminate", code: "T2" },
    { level: 25, name: "Éclairé", code: "T3" },
    { level: 50, name: "L'Éveillé", code: "T4" },
    { level: 100, name: "Lumière", code: "T5" },
  ],

  // ---- Slots de equipamento (6 PEÇAS FIXAS) ----
  // Modelo estilo Gaiadon: as peças são permanentes (não dropam, não trocam).
  // Você sobe NÍVEL de cada uma com ✦ Lumens e, no futuro, a RARIDADE.
  // label/UI em inglês (regra do projeto: jogo sempre em inglês).
  slots: [
    { id: "weapon", label: "Weapon", icon: "⚔️" },
    { id: "helmet", label: "Helmet", icon: "🪖" },
    { id: "armor", label: "Armor", icon: "🛡️" },
    { id: "gloves", label: "Gloves", icon: "🧤" },
    { id: "boots", label: "Boots", icon: "🥾" },
    { id: "cloak", label: "Cloak", icon: "🧥" },
  ],

  // ---- Definição base das 6 peças fixas ----
  // Cada afixo escala POR PEÇA: base = valor no Lv.1, perLevel = ganho por nível.
  //   valor no nível N = base + perLevel × (N - 1)   (ver gear.affixValue)
  // layer "flat" = soma direta (Primary) · layer "pct" = bônus % (Bonus).
  //
  // weapon: DEFINIDA pelo usuário. As outras 5 ainda são PLACEHOLDER —
  // vamos definir uma a uma.
  gearBase: {
    weapon: {
      name: "Worn Blade",
      affixes: [
        { id: "atk", label: "Attack", stat: "atk", layer: "flat", base: 0, perLevel: 20 },
        { id: "atkp", label: "Attack", stat: "atk", layer: "pct", base: 0, perLevel: 1 },
      ],
    },
    helmet: {
      name: "Worn Helm",
      affixes: [
        { id: "hp", label: "HP", stat: "hp", layer: "flat", base: 0, perLevel: 20 },
        { id: "critDmg", label: "Crit Damage", stat: "critDmg", layer: "flat", base: 0, perLevel: 1 },
      ],
    },
    armor: {
      name: "Worn Cuirass",
      affixes: [
        { id: "hpp", label: "HP", stat: "hp", layer: "pct", base: 0, perLevel: 1 },
        { id: "xp", label: "XP", stat: "xpBonus", layer: "flat", base: 0, perLevel: 0.5 },
      ],
    },
    gloves: {
      name: "Worn Gloves",
      affixes: [
        { id: "atkspd", label: "Attack Speed", stat: "atkSpeed", layer: "flat", base: 0, perLevel: 0.01 },
        { id: "crit", label: "Crit Rate", stat: "crit", layer: "flat", base: 0.05, perLevel: 0.025 },
      ],
    },
    boots: {
      name: "Worn Boots",
      affixes: [
        { id: "lumens", label: "Lumens", stat: "lumensBonus", layer: "flat", base: 5, perLevel: 1 },
        { id: "xp", label: "XP", stat: "xpBonus", layer: "flat", base: 2, perLevel: 0.5 },
      ],
    },
    cloak: {
      name: "Worn Cloak",
      affixes: [
        { id: "crit", label: "Crit Rate", stat: "crit", layer: "flat", base: 0.05, perLevel: 0.025 },
        { id: "atkp", label: "Attack", stat: "atk", layer: "pct", base: 0, perLevel: 1 },
      ],
    },
  },

  // ---- Raridades (cor + nº de afixos + peso de drop) ----
  // Quanto mais raro, menos peso (mais difícil) e mais afixos.
  // cap = teto de nível do gear por raridade (AJUSTE SEUS CAPS AQUI)
  // name em inglês (UI do jogo).
  rarities: [
    { id: "common", name: "Common", color: "#9aa7bd", affixes: 1, weight: 60, mult: 1.0, cap: 500 },
    { id: "magic", name: "Magic", color: "#5ee0d2", affixes: 2, weight: 28, mult: 1.4, cap: 600 },
    { id: "rare", name: "Rare", color: "#9d7bff", affixes: 3, weight: 9, mult: 1.9, cap: 700 },
    { id: "epic", name: "Epic", color: "#ff9a4d", affixes: 4, weight: 2.5, mult: 2.6, cap: 800 },
    { id: "legendary", name: "Legendary", color: "#e8b54a", affixes: 5, weight: 0.5, mult: 3.6, cap: 1000 },
  ],

  // ---- Afixos possíveis num item ----
  // Modelo do Gaiadon: cada afixo entra numa CAMADA do stat.
  //   layer "flat" = soma direta (Primary)        -> escala com o estágio
  //   layer "pct"  = bônus percentual (Bonus%)     -> multiplica o flat
  // Stats que JÁ são porcentagem (crit/haste/lumens) usam flat e exibem "%".
  // value = [min, max] base; multiplicado por escala (flat) e raridade.
  affixes: [
    { id: "atk", label: "ATK", stat: "atk", layer: "flat", value: [2, 5] },
    { id: "atkp", label: "ATK", stat: "atk", layer: "pct", value: [4, 10] },
    { id: "hp", label: "Vida", stat: "hp", layer: "flat", value: [10, 25] },
    { id: "hpp", label: "Vida", stat: "hp", layer: "pct", value: [4, 10] },
    { id: "crit", label: "Crítico", stat: "crit", layer: "flat", value: [1, 3] },
    { id: "atkspd", label: "Atk Speed", stat: "atkSpeed", layer: "flat", value: [2, 5] },
    { id: "lumens", label: "Lumens", stat: "lumensBonus", layer: "flat", value: [3, 8] },
  ],

  // stats que são exibidos com "%" no TOOLTIP (af.pct = true em buildPiece).
  // Atenção: state.stats() roteia por af.layer ("flat"/"pct"), não por pctStats.
  // pctStats controla APENAS display — adicionar aqui não muda o pipeline de stats.
  pctStats: ["crit", "critDmg", "xpBonus", "lumensBonus"],

  // ---- Base de nomes de item por slot ----
  itemNames: {
    weapon: ["Lâmina", "Cajado", "Estilhaço", "Adaga", "Foice"],
    armor: ["Manto", "Peitoral", "Vestes", "Couraça", "Capa"],
    trinket: ["Amuleto", "Anel", "Selo", "Relicário", "Prisma"],
  },

  // ---- MAPA 1: The Dreaming Wood — 9 sub-áreas ----
  // Cada sub-área tem: bg (img), faixa de nível, trio de inimigos e um boss.
  // Vencer o boss da área libera a próxima. As áreas 2-9 são adicionadas aqui
  // conforme criamos a arte (cada nova área = 1 mob novo + 1 mid-boss novo,
  // reaproveitando mobs das áreas anteriores). Faixas são PLACEHOLDER (o
  // balanceamento vem depois). O emoji é fallback se a imagem não existir.
  areas: [
    {
      id: 1,
      name: "The Dreaming Wood",
      blurb: "Where the Seeker first wakes. Soft auroras drip through ancient boughs, and here the light still dreams.",
      img: "assets/areas/dreaming_wood.png",
      levelRange: [1, 80],
      enemies: [
        { name: "Candlewisp Shade", sprite: "🔥", img: "assets/enemies/candlewisp_shade.png" },
        { name: "Mothlight Herald", sprite: "🦋", img: "assets/enemies/mothlight_herald.png" },
        { name: "Dreamhorn Warden", sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png" },
      ],
      // Área 1 não tem boss: só os mobs normais. Ao atingir o teto, libera a Área 2.
      boss: null,
    },
    {
      // Área 2 — The Lantern Mire: brejo afogado, Fragmented que se perderam na luz.
      id: 2,
      name: "The Lantern Mire",
      blurb: "A drowned bog of guttering lanterns, where Fragmented souls lost themselves chasing the light.",
      img: "assets/areas/lantern_mire.png",
      levelRange: [81, 350],
      enemies: [
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" }, // novo
        { name: "Candlewisp Shade", sprite: "🔥", img: "assets/enemies/candlewisp_shade.png" },   // reaproveitado (Área 1)
        { name: "Mothlight Herald", sprite: "🦋", img: "assets/enemies/mothlight_herald.png" },    // reaproveitado (Área 1)
      ],
      boss: { name: "The Drowned Lantern", sprite: "🕯", img: "assets/enemies/drowned_lantern.png" },
    },
    {
      // Área 3 — The Whispering Hollows: árvores ocas que cantam a luz presa.
      id: 3,
      name: "The Whispering Hollows",
      blurb: "Hollow trees that sing the trapped light, their murmurs curling endlessly through the dark.",
      img: "assets/areas/whispering_hollows.png",
      levelRange: [351, 700],
      enemies: [
        { name: "Husklight Murmur", sprite: "🌳", img: "assets/enemies/husklight_murmur.png" },  // novo
        { name: "Dreamhorn Warden", sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png" },  // reaproveitado (Área 1)
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" }, // reaproveitado (Área 2)
      ],
      boss: { name: "The Hollow Cantor", sprite: "🎶", img: "assets/enemies/hollow_cantor.png" },
    },
    {
      // Área 4 — The Moonlit Canopy: a copa alta, perto da aurora.
      id: 4,
      name: "The Moonlit Canopy",
      blurb: "The high canopy, nearest the aurora, where moths and wardens drift through a pale, restless glow.",
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [701, 1150],
      enemies: [
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" }, // novo
        { name: "Mothlight Herald", sprite: "🦋", img: "assets/enemies/mothlight_herald.png" },      // reaproveitado (Área 1)
        { name: "Husklight Murmur", sprite: "🌳", img: "assets/enemies/husklight_murmur.png" },       // reaproveitado (Área 3)
      ],
      boss: { name: "The Moonlit Sovereign", sprite: "👑", img: "assets/enemies/moonlit_sovereign.png" },
    },
    {
      // Área 5 — The Sunken Grove: bosque inundado e espelhado, reflexos da Névoa.
      id: 5,
      name: "The Sunken Grove",
      blurb: "A flooded, mirrored grove — every still pool reflects the creeping Mist back at the Seeker.",
      img: "assets/areas/sunken_grove.png",
      levelRange: [1151, 1700],
      enemies: [
        { name: "Glasswater Wraith", sprite: "💧", img: "assets/enemies/glasswater_wraith.png" }, // novo
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" }, // reaproveitado (Área 2)
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" }, // reaproveitado (Área 4)
      ],
      boss: { name: "The Stillwater Maiden", sprite: "🪷", img: "assets/enemies/stillwater_maiden.png" },
    },
    {
      // Área 6 — The Gilded Thicket: matagal de espinhos onde a corrupção dourada sobe.
      id: 6,
      name: "The Gilded Thicket",
      blurb: "A bramble of thorns where the golden corruption climbs — beautiful, and entirely wrong.",
      img: "assets/areas/gilded_thicket.png",
      levelRange: [1701, 2350],
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" }, // novo
        { name: "Candlewisp Shade", sprite: "🔥", img: "assets/enemies/candlewisp_shade.png" },     // reaproveitado (Área 1)
        { name: "Glasswater Wraith", sprite: "💧", img: "assets/enemies/glasswater_wraith.png" },    // reaproveitado (Área 5)
      ],
      boss: { name: "The Bramble King", sprite: "🥀", img: "assets/enemies/bramble_king.png" },
    },
    {
      // Área 7 — The Hollow Cathedral: catedral-árvore onde os Fragmented adoram a luz.
      id: 7,
      name: "The Hollow Cathedral",
      blurb: "A cathedral grown of living wood, where the Fragmented kneel and worship the captured light.",
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [2351, 3150],
      enemies: [
        { name: "Hollowed Acolyte", sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png" },   // novo
        { name: "Husklight Murmur", sprite: "🌳", img: "assets/enemies/husklight_murmur.png" },    // reaproveitado (Área 3)
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" }, // reaproveitado (Área 6)
      ],
      boss: { name: "The Gilded Confessor", sprite: "✝", img: "assets/enemies/gilded_confessor.png" },
    },
    {
      // Área 8 — The Weeping Roots: as raízes fundas, a floresta sangrando luz.
      id: 8,
      name: "The Weeping Roots",
      blurb: "The deep roots, where the forest bleeds light and mourns everything it has lost.",
      img: "assets/areas/weeping_roots.png",
      levelRange: [3151, 4050],
      enemies: [
        { name: "Rootbound Weeper", sprite: "🌱", img: "assets/enemies/rootbound_weeper.png" },   // novo
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" }, // reaproveitado (Área 6)
        { name: "Hollowed Acolyte", sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png" },     // reaproveitado (Área 7)
      ],
      boss: { name: "The Heartroot Mourner", sprite: "🩸", img: "assets/enemies/heartroot_mourner.png" },
    },
    {
      // Área 9 — The Hollow Sanctum: o coração da floresta, clímax do Mapa 1.
      id: 9,
      name: "The Hollow Sanctum",
      blurb: "The heart of the wood — the climax of the Dreaming, where the Gilded Hollow waits in the hush.",
      img: "assets/areas/hollow_sanctum.png",
      levelRange: [4051, 5000],
      enemies: [
        { name: "Rootbound Weeper", sprite: "🌱", img: "assets/enemies/rootbound_weeper.png" },   // reaproveitado (Á8)
        { name: "Hollowed Acolyte", sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png" },     // reaproveitado (Á7)
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" }, // reaproveitado (Á6)
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", img: "assets/enemies/gilded_hollow.png" },
    },
  ],

  // ---- Rare mob variants (names + multipliers) ----
  rareMobs: {
    chance: 0.08,       // 8% de chance de um mob virar raro
    plusChance: 0.15,   // desses, 15% viram raro+
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

  // ---- Awaken definitions (permanent power unlocked at area 7+) ----
  awakens: [
    {
      id: "first_light",
      name: "First Light",
      lore: "In the astral hush, the light you carry stirs for the first time — and answers.",
      areaIndex: 6,     // Area 7 = index 6 (The Hollow Cathedral)
      level: 2351,
      essence: 50,
      lumens: 500000,
      bonus: { atkMult: 2.5, hpMult: 1.5, lumensBonus: 25 },
    },
  ],

  // HP do mob num nível — crescimento em ESTÁGIOS (piecewise), contínuo.
  // Aplica o growth de cada estágio da fronteira anterior até min(nível, teto).
  mobHpAt(level) {
    const b = this.balance;
    let hp = b.mobHpBase, prev = 1;
    for (const st of b.mobHpStages) {
      if (level <= prev) break;
      const top = Math.min(level, st.upTo);
      hp *= Math.pow(st.growth, top - prev);
      prev = top;
      if (level <= st.upTo) break;
    }
    return hp;
  },

  // área atual (em função do progresso salvo)
  currentArea() {
    const i = G.util.clamp(G.state.data.areaIndex || 0, 0, this.areas.length - 1);
    return this.areas[i];
  },

  // ---- Constantes de balanceamento (modelo Gaiadon) ----
  // Vida do mob = exponencial no NÍVEL DO MOB (derivado dos prints do Gaiadon:
  // ~+6,4% de vida por nível -> dobra a cada ~10 níveis). O ATK do mob cresce
  // bem mais devagar (~+4,5%/nível). O nível do mob é um eixo de progressão
  // SEPARADO do seu nível de personagem (sobe a cada kill, recua ao morrer).
  balance: {
    // Curva balanceada p/ o Mapa 1 (validada por simulação, jun/2026):
    // Escala 1000/1000 (ATK/HP inicial), nível 1 → 5000 ao longo das 9 áreas.
    // TTK do mob ~2s do início ao fim (você reinveste a renda em gear pra
    // manter o ritmo); cada BOSS é o pico/parede (~7-9s), vencível se o gear
    // da faixa está em dia. Não reinvestir → o mob acompanha seu nível e o TTK
    // sobe. Mapa 1 inteiro ≈ 6h de jogo ativo.
    mobHpBase: 2050,      // vida do mob no nível 1 (TTK ~2s com o ATK base 1000)
    // HP do mob em ESTÁGIOS (growth por faixa de nível) — ver G.data.mobHpAt().
    // Cada estágio aplica seu growth da fronteira anterior até o seu teto, de
    // forma CONTÍNUA (o HP no fim de um estágio = início do próximo). Resolve o
    // "HP achatado": growth maior no early (sobe rápido e visível), estabiliza
    // no mid, e fica agressivo no end (God Mode). Alvos validados:
    //   ~985k no Lv1000 · ~395M no Lv4000 · ~58B no Lv5000.
    mobHpStages: [
      { upTo: 1000, growth: 1.0085 }, // Early (1–1000): HP sobe rápido logo cedo
      { upTo: 4000, growth: 1.0040 },  // Mid (1001–4000): estabiliza
      { upTo: 5000, growth: 1.0090 },  // End (4001–5000): agressivo (desafios finais)
    ],
    mobAtkBase: 45,       // ATK do mob no nível 1
    mobAtkGrowth: 1.00085,// +0,085% de ATK por nível
    healOnKillFrac: 0.10, // cura 10% do HP máx a cada kill (fôlego)
    retreatOnDeath: 3,    // ao morrer, recua N níveis de mob (autocorrige)
    bossHpMult: 4,        // boss tem 4× a vida normal
    bossDmgMult: 1.5,     // e bate 50% mais forte
    bossRewardMult: 6,    // multiplicador de XP do boss
    goldRatio: 0.25,      // gold-base por kill = goldRatio × vida do mob (âncora ao HP)
    baseXp: 10,           // xp por kill = baseXp × nível do mob
    dropChance: 0.35,     // chance de drop por kill
    respawnDelay: 1.0,    // segundos de espera entre matar um mob e o próximo aparecer
    // ---- level-up de gear: custo GEOMÉTRICO ----
    // A renda (Lumens) cresce EXPONENCIAL (ancorada ao HP do mob), então o
    // custo do gear também precisa crescer geométrico, senão reinvestir
    // trivializa o jogo. Assim, manter o TTK na banda exige reinvestir de
    // verdade. Ganho por nível = POR AFIXO (campo perLevel em gearBase).
    //   custo = gearCostBase × gearCostGrowth^(nível-1)
    gearCostBase: 1100,
    gearCostGrowth: 1.05,
    // Forge (weapon reforge — custo separado do gear fixo)
    forgeCostBase: 20,
    forgeCostGrowth: 1.064,
    // Awaken Essence drop chance por kill em área 7+ (multiplicado por matMult passiva)
    awakenDropChance: 0.02,
  },
};
