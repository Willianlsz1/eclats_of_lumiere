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
        { id: "atk", label: "Attack", stat: "atk", layer: "flat", base: 50, perLevel: 10 },
        { id: "atkp", label: "Attack", stat: "atk", layer: "pct", base: 0, perLevel: 1 },
      ],
    },
    helmet: {
      name: "Worn Helm",
      affixes: [
        { id: "hp", label: "HP", stat: "hp", layer: "flat", base: 50, perLevel: 20 },
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
        { id: "atkspd", label: "Attack Speed", stat: "atkSpeed", layer: "flat", base: 0.01, perLevel: 0.01 },
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
        { id: "atkp", label: "Attack", stat: "atk", layer: "pct", base: 5, perLevel: 1 },
      ],
    },
  },

  // ---- Raridades (cor + nº de afixos + peso de drop) ----
  // Quanto mais raro, menos peso (mais difícil) e mais afixos.
  // cap = teto de nível do gear por raridade (AJUSTE SEUS CAPS AQUI)
  // name em inglês (UI do jogo).
  rarities: [
    { id: "common", name: "Common", color: "#9aa7bd", affixes: 1, weight: 60, mult: 1.0, cap: 10 },
    { id: "magic", name: "Magic", color: "#5ee0d2", affixes: 2, weight: 28, mult: 1.4, cap: 20 },
    { id: "rare", name: "Rare", color: "#9d7bff", affixes: 3, weight: 9, mult: 1.9, cap: 30 },
    { id: "epic", name: "Epic", color: "#ff9a4d", affixes: 4, weight: 2.5, mult: 2.6, cap: 40 },
    { id: "legendary", name: "Legendary", color: "#e8b54a", affixes: 5, weight: 0.5, mult: 3.6, cap: 50 },
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
    { id: "haste", label: "Vel. Ataque", stat: "haste", layer: "flat", value: [2, 5] },
    { id: "lumens", label: "Lumens", stat: "lumensBonus", layer: "flat", value: [3, 8] },
  ],

  // stats que são exibidos com "%" mesmo quando entram na camada flat
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
      img: "assets/areas/dreaming_wood.png",
      levelRange: [1, 10],
      enemies: [
        { name: "Candlewisp Shade", sprite: "🔥", img: "assets/enemies/candlewisp_shade.png" },
        { name: "Mothlight Herald", sprite: "🦋", img: "assets/enemies/mothlight_herald.png" },
        { name: "Dreamhorn Warden", sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png" },
      ],
      // (placeholder: o Gilded Hollow vira o boss do clímax — Área 9 — quando criarmos)
      boss: { name: "The Gilded Hollow", sprite: "👁", img: "assets/enemies/gilded_hollow.png" },
    },
    {
      // Área 2 — The Lantern Mire: brejo afogado, Fragmented que se perderam na luz.
      id: 2,
      name: "The Lantern Mire",
      img: "assets/areas/lantern_mire.png",
      levelRange: [11, 20],
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
      img: "assets/areas/whispering_hollows.png",
      levelRange: [21, 30],
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
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [31, 40],
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
      img: "assets/areas/sunken_grove.png",
      levelRange: [41, 50],
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
      img: "assets/areas/gilded_thicket.png",
      levelRange: [51, 60],
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
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [61, 70],
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
      img: "assets/areas/weeping_roots.png",
      levelRange: [71, 80],
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
      img: "assets/areas/hollow_sanctum.png",
      levelRange: [81, 90],
      enemies: [
        { name: "Rootbound Weeper", sprite: "🌱", img: "assets/enemies/rootbound_weeper.png" },   // reaproveitado (Á8)
        { name: "Hollowed Acolyte", sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png" },     // reaproveitado (Á7)
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" }, // reaproveitado (Á6)
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", img: "assets/enemies/gilded_hollow.png" },
    },
  ],

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
    mobHpBase: 20,        // vida do mob no nível 1 (TTK ~2s com ATK base 10)
    mobHpGrowth: 1.064,   // +6,4% de vida por nível do mob (Gaiadon)
    mobAtkBase: 4,        // ATK do mob no nível 1
    mobAtkGrowth: 1.045,  // +4,5% de ATK por nível do mob
    healOnKillFrac: 0.10, // cura 10% do HP máx a cada kill (fôlego)
    retreatOnDeath: 3,    // ao morrer, recua N níveis de mob (autocorrige)
    bossHpMult: 4,        // boss tem 4× a vida normal
    bossDmgMult: 1.5,     // e bate 50% mais forte
    bossRewardMult: 6,    // multiplicador de XP do boss
    goldRatio: 0.25,      // gold-base por kill = goldRatio × vida do mob (âncora ao HP)
    baseXp: 8,            // xp por kill = baseXp × nível do mob
    dropChance: 0.35,     // chance de drop por kill
    respawnDelay: 1.0,    // segundos de espera entre matar um mob e o próximo aparecer
    // ---- level-up de gear (custo LINEAR, estilo Gaiadon) ----
    // o ganho por nível agora é POR AFIXO (campo perLevel em gearBase),
    // não uma % global.
    gearCostBase: 12,     // custo = gearCostBase × nível + gearCostFlat
    gearCostFlat: 8,
  },
};
