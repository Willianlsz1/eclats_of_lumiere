// Constantes de balanceamento — fonte: docs/eclats_gdd_final_v2.md
// NUNCA inventar valores: tudo aqui vem do GDD (seções 3, 4, 6 e 12).

// §4 — Constantes-âncora do núcleo de combate
export const COMBAT = {
  baseDmg: 7,
  baseAPS: 0.90,          // intervalo de ataque ~1.11s (ajuste pedido pelo Willian: 0.40 → 0.90)
  apsCap: 5,              // teto de 5 kills/s (18k/h) — ajuste pedido pelo Willian (confortável; 15 rápido, 2 lento).
  agiApsCap: 3.75,        // sub-cap do AGI: AGI sozinho leva o APS até ~3.4 (0.90 × 3.75)
  playerBaseHp: 50,
  regenPerSec: 0.01,      // 1% do HP máx por segundo
  regenOnKill: 0.02,      // 2% do HP máx por kill
  bossHpMult: 15,         // usado no CP-D
  bossDmgMult: 3,         // usado no CP-D
  deathRespawnSeconds: 3, // morte: respawn com HP cheio, sem perdas
};

// §12 — Lumens · §6 — XP
export const ECONOMY = {
  goldRatio: 0.10, // lumens_por_kill = mob_hp × 0.10 × frt_total
  xpRatio: 0.08,   // xp_por_kill     = mob_hp × 0.08 × wis_total
};

// §3 — Malha geométrica dos 5 mapas (✅ levels/HP/threshold canônicos).
// ✅ CALIBRADO 2026-06-11 (Camada 2): dano dos mobs = RAZÃO CONSTANTE 0.02 × HP em
// TODOS os mapas (dmgLo=hpLo×0.02, dmgHi=hpHi×0.02). Validado no simulador
// (tools/sim/survival.mjs): a Defesa decide vida/morte na entrada de cada mapa.
// packSizes: densidade de mobs por sub-área (índice = sub-área − 1).
// CP-2 (redesign): nº de sub-áreas CRESCENTE por mapa — Map1=5 · Map2=6 · Map3=7 ·
// Map4=Map5=8 (era 5 fixo). PACK tem 8 entradas; cada mapa usa as primeiras N.
// ⏳ números a re-ancorar na recalibração; curva suave 2→12 por enquanto.
// TODO canon: vínculo nome↔arte dos Maps 2-5 (arte de alguns trios incompleta).
const PACK = [2, 3, 4, 5, 6, 8, 10, 12];
export const MAPS = [
  {
    id: 1, name: 'The Dreaming Wood', continent: 'worldmap.continent1', bg: 'backgrounds.map1',
    lvlLo: 1, lvlHi: 1000, hpLo: 10, hpHi: 1e6, dmgLo: 0.2, dmgHi: 2e4,
    subareaCount: 5, packSizes: PACK, bossKillThreshold: 100,
    enemyNames: ['Candlewisp Shade', 'Mothlight Herald', 'Dreamhorn Warden'],
    enemyArts: ['enemies.map1.constellation_weaver', 'enemies.map1.moth_lantern', 'enemies.map1.deer_spirit'],
    guardianArt: 'enemies.map1.constellation_weaver',
    bossName: 'The Gilded Hollow', bossArt: 'enemies.map1.golden_figure',
  },
  {
    id: 2, name: 'Cavernes Luminis', continent: 'worldmap.continent2', bg: 'backgrounds.map2',
    lvlLo: 1000, lvlHi: 1e5, hpLo: 1e6, hpHi: 1e16, dmgLo: 2e4, dmgHi: 2e14,
    subareaCount: 6, packSizes: PACK, bossKillThreshold: 200,
    enemyNames: ['Crystalbound Husk', 'Luminis Pilgrim', 'Hollowflame Adept'],
    enemyArts: ['enemies.map2.crystal_being', 'enemies.map2.cyan_ghost', 'enemies.map2.teal_flame'],
    guardianArt: 'enemies.map2.crystal_being',
    bossName: 'The Pale Reunion', bossArt: 'bosses.pale_reunion',
  },
  {
    id: 3, name: 'The Ashen Ruins', continent: 'worldmap.continent3', bg: 'backgrounds.map3',
    lvlLo: 1e5, lvlHi: 1e7, hpLo: 1e16, hpHi: 1e34, dmgLo: 2e14, dmgHi: 2e32,
    subareaCount: 7, packSizes: PACK, bossKillThreshold: 350,
    enemyNames: ['Ember Revenant', 'Emberhorn Penitent', 'Ash Choir'],
    enemyArts: ['enemies.map3.thorn_sentinel', 'enemies.map3.horned_statue', 'enemies.map3.three_faces'],
    guardianArt: 'enemies.map3.vortex',
    bossName: 'The Ashen King', bossArt: 'bosses.m3_ashen_king',
  },
  {
    id: 4, name: 'The Fractured Peaks', continent: 'worldmap.continent4', bg: 'backgrounds.map4',
    lvlLo: 1e7, lvlHi: 1e8, hpLo: 1e34, hpHi: 1e62, dmgLo: 2e32, dmgHi: 2e60,
    subareaCount: 8, packSizes: PACK, bossKillThreshold: 500,
    enemyNames: ['Fissure Stalker', 'Sundered Titan', 'Claimed Vanguard'],
    enemyArts: ['enemies.map4.fissure_stalker', 'enemies.map4.chained_giant', 'enemies.map4.claimed_vanguard'],
    guardianArt: 'enemies.map4.chained_giant',
    bossName: 'The Claimed Queen', bossArt: 'bosses.m4_claimed_queen',
  },
  {
    id: 5, name: 'Nil Aeternum', continent: 'worldmap.continent5', bg: 'backgrounds.map5',
    lvlLo: 1e8, lvlHi: 1e9, hpLo: 1e62, hpHi: 1e100, dmgLo: 2e60, dmgHi: 2e98,
    subareaCount: 8, packSizes: PACK, bossKillThreshold: 800,
    enemyNames: ['Pale Courtier', 'Crownless King', 'Crimson Wyrmlord'],
    enemyArts: ['enemies.map5.white_mask_priest', 'enemies.map5.crown_bearer', 'enemies.map5.dragon_lancer'],
    guardianArt: 'enemies.map5.hooded_redeyes',
    bossName: 'Nihel, The Fracture', bossArt: 'enemies.map5.fallen_angel', // fallen_angel = Nihel (arte real)
  },
];
export const MAP_1 = MAPS[0]; // compat
export const BOSS_LUMEN_MULT = 5; // §12: lumens_por_kill de boss ×5

// §5 — Gold Stats (resetam na Convergence — CP-E)
// custo(n) = costBase × costRamp^n · stat_total = (1 + nível × per) × milestones
export const GOLD_STATS = {
  costBase: 10,
  costRamp: 1.15,
  per: { str: 0.08, vit: 0.06, agi: 0.04, lck: 0.002, frt: 0.05, wis: 0.05 }, // ✅ lck 0.015→0.002 (Bloco 5: LCK = fração MÍNIMA de crit; o grosso vem de Grasp + Luminal Edge)
  // Milestones geométricos (não se aplicam a agi — cap duro de APS — nem a lck)
  milestones: [[10, 2], [25, 2.5], [50, 3], [100, 4], [200, 4.5], [400, 5], [800, 5.5], [1600, 6], [3200, 6.5]],
};

// ⏳ PROVISÓRIO (GDD §16.6 — pendência de calibração, aprovado pelo Willian):
// crit damage base ×2, transbordo 1:1 (1% de rate acima de 100% → +1% de crit dmg),
// lck sem milestones. Recalibrar quando o GDD fechar os valores.
export const CRIT = {
  baseChance: 0,
  baseDamageMult: 2,
  overflowFactor: 1,
};

// §4 — DEFESA / MITIGAÇÃO (razão/armadura). Camada 2/3 (Passo 2 do wiring §10.5.1).
//   dano_recebido = Σdano × Σdano / (defesa + Σdano)   → nunca 100%, auto-escala.
//   def_jogador = hp_max × veilFactor ; veilFactor = (gearDefesaMult − 1) × veilScale (+ passivas).
//   Alvo (gear.mjs): Veil maximizado ≈ veilFactor 0.18 → def ≈ 4× packDps ≈ 80% mit.
//   Sem Veil (early) → veilFactor 0 → def 0 → reproduz o comportamento original.
export const DEFENSE = {
  veilScale: 0.015, // ✅ CALIBRADO (Bloco 2): Veil da raridade do mapa rampa rumo ao teto por era
  veilCap: 0.18,    // ✅ teto de veilFactor → def ≈ 4× packDps ≈ 80% mit ("com tudo": Veil+#11+passivas)
  enemyDefBase: 0,  // defesa de inimigos: early = 0 (hooks: Void Piercing penetra · Weakened Void reduz)
};

// §6 — Convergence: parede de XP geométrica e pontos por profundidade
export const CONVERGENCE = {
  wallBase: 1500,        // parede da 1ª run
  wallRatio: 1.5,        // razão base entre paredes
  wallRatioGrowth: 1.06, // a razão cresce 6% a cada Convergence
  // conv_factor = (1 + pointBonusBase × pointBonusGrowth^ascensions)^(Σ pontos) — COMPOSTO + ANINHADO.
  // Camada 7: o aditivo 1+0.15×pts morria (1.57 déc). A Ascension zera os pontos mas
  // AMPLIFICA a base (§8): base sobe 1.04 (A0) → 1.20 (A5), pico ~4 décadas na era final.
  pointBonusBase: 0.04,   // base inicial = 1.04
  pointBonusGrowth: 1.38, // a base composta sobe ×1.38 a cada Ascension
};

// §7 — Vestiges (renda; gasto em Passivas/Ascension é pós-MVP)
// vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa) · boss ×10
export const VESTIGES = {
  bossMult: 10,
};

// §13 — GEAR · ⏳ PROVISÓRIO (aprovado pelo Willian, 2026-06-11)
// O GDD §13 fixa a ESTRUTURA (6 peças, 5 raridades, 2 eixos: nível+raridade),
// mas marca os VALORES como "a definir" (§16.4) e o DESIGN.md §26-28 não está
// no repo. Tudo abaixo é PLACEHOLDER para recalibrar na malha v2 — não é cânon.
// TODO(canon): rates/caps por raridade, custos. ✅ Afixo PRIMÁRIO de cada peça = canon (§10.5.5, Passo 1).
export const GEAR_RARITIES = ['faded', 'kindled', 'luminous', 'radiant', 'converged'];
export const GEAR_RARITY_LABELS = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
export const GEAR = {
  // 6 peças canônicas (§10.5.5). Cada peça: PRIMÁRIO inerente + SECUNDÁRIOS que a raridade
  // destrava em ordem (secondary[i] ativo quando rarity ≥ i+1). Determinístico.
  // Pool de afixos: dmg · hp · defesa · crit · critDmg · aps · regen · bossDmg · lumens · xp · materiais
  //                 (+ erosao = future, só reservado — penetração de defesa de inimigos, sem consumidor).
  pieces: [
    { key: 'edge',  name: 'The Waning Edge',      slot: 'Arma',     primary: 'dmg',    secondary: ['critDmg', 'bossDmg', 'erosao'] },
    { key: 'vigil', name: 'The Silent Vigil',     slot: 'Elmo',     primary: 'hp',     secondary: ['defesa', 'regen'] },
    { key: 'veil',  name: 'Veil of Cinders',      slot: 'Manto',    primary: 'defesa', secondary: ['hp', 'regen', 'erosao'] },
    { key: 'grasp', name: 'Grasp of the Unnamed', slot: 'Manoplas', primary: 'crit',   secondary: ['critDmg', 'aps', 'dmg'] },
    { key: 'reson', name: 'The Last Resonance',   slot: 'Amuleto',  primary: 'aps',    secondary: ['crit', 'regen', 'dmg'] },
    { key: 'band',  name: 'Band of Dusk',         slot: 'Anel',     primary: 'lumens', secondary: ['xp', 'materiais'] },
  ],
  // por raridade (índice 0..4): força do afixo sobe, cap de nível sobe, custo sobe
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  levelCap:   [25, 50, 100, 175, 300],
  costMult:   [1, 4, 16, 64, 256],
  // ── Modelo de valor calibrado (Camada 3 / `tools/sim/gear.mjs`) ──
  affixPctRate: 0.02,        // sabor %: 1 + nível × 0.02 × rarityMult  (linear, toda raridade)
  affixMultBase: 1.0039,     // sabor ×: 1.0039^nível (a partir de Luminous) — agregado de dano ≈ 10 déc
  affixMultFromRarity: 2,    // Luminous (idx 2) destrava o sabor × (motor sem-teto)
  secondaryExp: 0.30,        // afixo SECUNDÁRIO = primário^0.30 (30% das décadas; crit/critDmg = 30% do valor plano)
  capPerAsc: 500,            // a Ascension soma +500 ao cap de nível da raridade TOPO (Converged) — sem-teto
  critPerLevel: 0.0015,      // ✅ CALIBRADO (Bloco 5): afixo crit (chance) — Grasp + Luminal Edge fecham 100% no mid
  critDmgPerLevel: 0.01,     // afixo critDmg (bônus plano sobre a base ×2) = nível × critDmgPerLevel × rarityMult
  // custo de upar 1 nível = base × ramp^nível × costMult[raridade]
  levelCostBase: 50,
  levelCostRamp: 1.12,
  // (Subir raridade = gate duplo: nível no cap + MATERIAIS do tier — ver CRAFT, Passo 4.)
};

// §13B — CRAFT / MATERIAIS (Camada 4, Passo 4). Material TIERED por raridade:
// materiais[r] paga o salto da raridade r→r+1 (T1=idx0: Faded→Kindled … T4=idx3: Radiant→Converged).
export const CRAFT = {
  dropChance: 0.01,        // 1% por mob comum, do tier do MAPA atual
  nextTierChance: 0.001,   // 0.1% do tier seguinte (tabela com peso — pré-estoca)
  bossChunk: 30,           // boss (Guardião/final): chunk garantido do tier do mapa (acelera, não gate)
  rarityUpMaterial: 40,    // 40 materiais do tier p/ subir 1 PEÇA de raridade (gate duplo c/ nível máx)
  refinoRatio: 12,         // refino 12:1 (só pra cima): 12 de Tn → 1 de Tn+1
};
// tier do material que o mapa dropa (índice 0..3 = T1..T4); Map 5 = T4 (future T5)
export const mapMaterialTier = (map) => Math.min(map - 1, 3);

// §8 — DIFICULDADES (Camada 7, Passo 5). hpMult aplica a HP E dano dos mobs;
// rewardMult a materiais/Éclats. O SISTEMA abre na A2 (minAscension); o gate dos
// modos é por PODER (você morre se fraco) + bloqueio de OVERFLOW (≤ 1e100).
// Nightmare/Tormento = território break_infinity → VISÍVEIS mas sempre bloqueados (breakInf).
export const DIFFICULTIES = [
  { key: 'normal',    name: 'Normal',    hpMult: 1,    rewardMult: 1,  minAscension: 0, breakInf: false },
  { key: 'dificil',   name: 'Difícil',   hpMult: 1e5,  rewardMult: 3,  minAscension: 2, breakInf: false },
  { key: 'nightmare', name: 'Nightmare', hpMult: 1e15, rewardMult: 10, minAscension: 2, breakInf: true  },
  { key: 'tormento',  name: 'Tormento',  hpMult: 1e30, rewardMult: 30, minAscension: 2, breakInf: true  },
];

// Fate Keepers (A1-A5) — desbloqueio = state.ascensions ≥ N. A4 soma mobs na tela.
export const FATE = {
  a4MobBonus: 6, // +6 mobs no pack quando ascensions ≥ 4 (respeita o teto ~24: sub5 12→18)
};
// Fate Keeper A3 — ECO DO SEEKER (Bloco 3): um eco farma um mapa já limpo em 2º plano.
export const ECO = {
  fraction: 0.35, // ✅ rende 35% do farm daquele mapa (faixa 25-40%). Útil p/ material de refino,
                  // mas SEMPRE < farm ativo (o eco roda um mapa MAIS BAIXO/limpo, não o atual).
  killRate: 15,   // kills/s equivalentes do eco (= teto de APS)
};

// §7 — PASSIVAS · economia ✅ canônica · efeitos individuais ⏳ PROVISÓRIOS.
// 3 árvores × 15 (3 grupos de 5). Moeda = Vestiges. Desbloqueia na 1ª Convergence.
// Custo de desbloqueio (posição ×5) e evolução (×0.3×1.30^(n-1)) são do GDD §7;
// groupMult, maxLevel e os efeitos por nível são PLACEHOLDER (TODO canon §16.3).
export const PASSIVE_TREES = ['eclat', 'vestige', 'fracture'];
export const PASSIVES = {
  unlockLadder: [100, 500, 2500, 12500, 62500], // §7: custo por posição no grupo (×5)
  groupMult: [1, 10, 100],                        // ⏳ multiplicador por grupo (provisório)
  evoFactor: 0.3, evoRamp: 1.30,                  // §7: evolução = desbloqueio × 0.3 × 1.30^(n-1)
  maxLevel: 12,                                   // ✅ CALIBRADO (Bloco 4, esquema Camada 5)
  // ── Esquema dos 45 efeitos (Bloco 4) ──
  groupAddPct: [0.05, 0.10, 0.20],  // % aditivo/nível na primária da árvore, por grupo (g1/g2/g3)
  engineMult: 1.52,                 // 3 MOTORES por árvore (no grupo 3): ×1.52/nível
  // motores (×1.52) por árvore — as 3 mais fortes do grupo 3
  engines: {
    eclat:   ['e_luminal_explosion', 'e_oreinsof_touch', 'e_shattered_light'],
    vestige: ['v_eternal_vestige', 'v_fractured_soul', 'v_collector'],
    fracture:['f_void_collapse', 'f_claimed_domination', 'f_void_endurance'],
  },
  // alavancas FUNCIONAIS (efeito especial, fora do mult da árvore) — art key → tipo
  levers: {
    e_luminal_edge: 'crit', e_void_piercing: 'enemyPen',
    f_fracture_pulse: 'aps', f_void_awareness: 'mobCap', f_weakened_void: 'enemyReduce',
    v_vestige_pull: 'material',
  },
  lever: {
    critPerLevel: 0.04,     // Luminal Edge: +4% crit chance/nível (com Grasp fecha 100% mid)
    apsPerLevel: 0.46,      // Fracture Pulse: fator de APS rumo a ~6.5 maxado (Bloco 6 fecha p/ 15)
    mobPerLevel: 0.5,       // Void Awareness: +0.5 mob/nível (maxado +6 → rumo ao teto 24)
    materialPerLevel: 0.75, // Vestige Pull: ×drop de material (FARM, amortecido por log → ×~2 maxado)
    penPerLevel: 0.04,      // Void Piercing: penetra 4%/nível da def de inimigos (no-op até enemyDef>0)
    reducePerLevel: 0.04,   // Weakened Void: reduz 4%/nível a def de inimigos (no-op até enemyDef>0)
  },
  // nomes na grade de posicionamento APROVADA do GDD §7 (g1 early · g2 mid · g3 late) + chave de arte
  trees: {
    eclat: { label: 'Éclat', sub: 'Combate · dano', cls: 't-eclat', list: [
      ['Radiant Strike','e_radiant_strike'], ['Luminal Edge','e_luminal_edge'], ['Éclat Surge','e_eclat_surge'], ['Refraction','e_refraction'], ['Crit Cascade','e_crit_cascade'],
      ['Shard Burst','e_shard_burst'], ['Resonant Force','e_resonant_force'], ['Momentum','e_momentum'], ['Fracture Weakness','e_fracture_weakness'], ['Execute','e_execute'],
      ['Overkill','e_overkill'], ['Luminal Explosion','e_luminal_explosion'], ["Or Ein Sof's Touch",'e_oreinsof_touch'], ['Shattered Light','e_shattered_light'], ['Void Piercing','e_void_piercing'],
    ] },
    vestige: { label: 'Vestige', sub: 'Economia · ganhos', cls: 't-vest', list: [
      ["Lumen's Blessing",'v_lumens_blessing'], ['Wisdom of Ruins','v_wisdom_ruins'], ['Remnant Harvest','v_remnant_harvest'], ['Scavenger','v_scavenger'], ['Echo of Greed','v_echo_greed'],
      ['Awakened Harvest','v_awakened_harvest'], ['Hoarder','v_hoarder'], ['Dreamwalker','v_dreamwalker'], ['Beast Caller','v_beast_caller'], ['Vestige Pull','v_vestige_pull'],
      ['Void Scavenger','v_void_scavenger'], ['Eternal Vestige','v_eternal_vestige'], ['Fractured Soul','v_fractured_soul'], ['Luminal Cache','v_luminal_cache'], ['The Collector','v_collector'],
    ] },
    fracture: { label: 'Fracture', sub: 'Utilidade · HP', cls: 't-frac', list: [
      ['Fracture Pulse','f_fracture_pulse'], ['Void Haste','f_void_haste'], ['Fracture Sense','f_fracture_sense'], ['Void Awareness','f_void_awareness'], ['Last Light','f_last_light'],
      ['Weakened Void','f_weakened_void'], ['Shard Disruption','f_shard_disruption'], ["Nihel's Shadow",'f_nihels_shadow'], ['Éclat Attunement','f_eclat_attunement'], ["The Fracture's Gift",'f_fractures_gift'],
      ['Void Collapse','f_void_collapse'], ["La Fracture's Echo",'f_fractures_echo'], ['Claimed Domination','f_claimed_domination'], ["Nil's Embrace",'f_nils_embrace'], ['Void Endurance','f_void_endurance'],
    ] },
  },
};

// §8 — ASCENSION (✅ CALIBRADO). Marco por mapa: derrotar o boss final do mapa
// + custo em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank da Ordre e
// o próximo mapa. A1 libera o sistema de Éclats/Mémoires + o drip. Só Map 1
// existe no MVP, então só A1 é completável; A2-A5 aguardam Maps 2-5.
// ✅ CALIBRADO (Bloco 1, 2026-06-12): asc_mult = ×2 por Ascension (×16 total A1-A4),
// substituindo ×10/×5/×5/×5 (×6250). O salto de fim-de-mapa migrou para o DESPERTAR
// (×5/tier, ×625 total). Orçamento: Ascension 1.2 déc + Despertar 2.8 déc = 4.0 combinados.
export const ASCENSIONS = [
  { id: 1, mapBoss: 1, req: 'Boss do Map 1',  cost: 500_000,   mult: 2, eclats: 100,  rank: 'Illuminate', tier: 'II' },
  { id: 2, mapBoss: 2, req: 'Boss do Map 2',  cost: 1_900_000, mult: 2, eclats: 300,  rank: 'Éclairé',    tier: 'III' },
  { id: 3, mapBoss: 3, req: 'Boss do Map 3',  cost: 4_000_000, mult: 2, eclats: 900,  rank: 'L’Éveillé',  tier: 'IV' },
  { id: 4, mapBoss: 4, req: 'Boss do Map 4',  cost: 8_000_000, mult: 2, eclats: 2700, rank: 'Lumière',    tier: 'V' },
  { id: 5, mapBoss: 5, req: 'Derrotar Nihel', cost: 0,         mult: 1, eclats: 0,    rank: 'Lumière',    tier: 'V' },
];
// §10 — drip de Éclats (liberado pela A1): éclats_por_hora = 0.1 × HP_frontier^0.9
export const ECLATS_DRIP = { coef: 0.1, exp: 0.9 };

// §8 — DESPERTAR / TIER (Passo 7). O tier T1→T5 é DESACOPLADO do nº de ascensions:
// vence o Guardião da Sub 3 do mapa → +1 tier (gate de poder no meio do mapa).
// Map N Sub3 → despertares=N (T_{N+1}); Map 5 já é T5. index despertares = 0..4.
export const SEEKER_RANKS = [
  { name: 'Seeker',     tier: 'I' },
  { name: 'Illuminate', tier: 'II' },
  { name: 'Éclairé',    tier: 'III' },
  { name: 'L’Éveillé',  tier: 'IV' },
  { name: 'Lumière',    tier: 'V' },
];
// ×poder permanente por tier de Despertar (dano E HP). ⏳ PROVISÓRIO — calibração na Escala.
export const DESPERTAR = { mult: 5 };

// §8 redesign (13/jun) — gate do Despertar em 3 camadas: Prova (Guardião Sub3) +
// Oferenda (Nitzotzot) + Tributo (Vestiges). ⏳ NÚMEROS = LISTA DE CALIBRAÇÃO.
// Drop do Nitzotz: só nas Sub-áreas 3+; chunk garantido em boss (Guardião).
export const NITZOTZ = { dropChance: 0.02, bossChunk: 5 };
// Requisito por TIER ALVO (índice = despertares+1 = 1..4 → T2..T5). [0] não usado (T1 = início).
export const DESPERTAR_REQ = [
  null,
  { nitzotz: 20,  vestiges: 75_000 },    // → T2 Illuminate  (~15% Asc Map1)
  { nitzotz: 40,  vestiges: 285_000 },   // → T3 Éclairé     (~15% Asc Map2)
  { nitzotz: 80,  vestiges: 600_000 },   // → T4 L'Éveillé   (~15% Asc Map3)
  { nitzotz: 160, vestiges: 1_200_000 }, // → T5 Lumière     (~15% Asc Map4)
];

// §10/§11 — ÉCLATS + MÉMOIRES (✅ motor canônico do GDD). 15 relíquias, 3 por era,
// desbloqueadas pela Ascension da era; moeda = Éclats. Clarté é o motor global.
// Os efeitos `wired:true` já somam aos fatores memoire_*; os `wired:false` são
// exibidos mas ainda contam só via Clarté (efeito específico em CP futuro).
export const MEMOIRE_CLARTE_BASE = 1.07;        // Clarté: dano × 1.07^(Σ níveis)
export const MEMOIRE_UNLOCK = [10, 30, 90, 270, 810]; // §11: desbloqueio por era
export const MEMOIRE_EVO_BASE = 2, MEMOIRE_EVO_RAMP = 3.0; // §11: evolução = 2 × 3.0^n (Camada 6: 1.10 era raso → maximizava instantâneo; 3.0 paceia pela profundidade)
// ⚠️ #14 de la Lumière Entière amplifica o EXPOENTE da Clarté — a alavanca MAIS PERIGOSA
// (multiplica o expoente que monta as ~70 décadas). STUB = 0 até a sessão de Escala (auditoria).
export const MEMOIRE_CLARTE_EXP_PER = 0; // por nível; 0 = wired mas desarmado
// AMORTECE os efeitos INDIVIDUAIS de dano (#1 du Premier Matin + #10 de la Blessure): teto no bônus
// sobre a Clarté, p/ o andar Mémoires somar ~70 déc no TOTAL (Clarté + indiv), não 70 + extras.
// Sem isto, #10 (×1.10/nível) abria ~9 déc no late (gap-opener). Os níveis ainda contam via Clarté.
export const MEMOIRE_INDIV_DMG_CAP = 3; // ×3 máx de bônus individual sobre a Clarté (~0.5 déc)
// Nomes das eras (Épopées) — ⏳ TODO(canon): placeholders L'Aube…Le Choix.
export const MEMOIRE_ERAS = ['L’Aube', 'Le Façonnage', 'La Chute', 'La Blessure', 'Le Choix'];
export const MEMOIRES = [
  { name: 'du Premier Matin',     era: 1, art: 'e1_matin',       label: '+10% dano global',                 type: 'dmg',       per: 0.10, wired: true },
  { name: 'des Rires',            era: 1, art: 'e1_rires',       label: '+10% Lumens',                      type: 'lumens',    per: 0.10, wired: true },
  { name: 'de la Marche',         era: 1, art: 'e1_marche',      label: '+8% XP',                           type: 'xp',        per: 0.08, wired: true },
  { name: 'de la Forme',          era: 2, art: 'e2_forme',       label: '+8% Crit Damage',                  type: 'critDmg',   per: 0.08, wired: true },
  { name: 'du Façonnage',         era: 2, art: 'e2_faconnage',   label: '+5% materiais dropados',           type: 'materiais', per: 0.05, wired: true },
  { name: 'des Profondeurs',      era: 2, art: 'e2_profondeurs', label: '+10% offline',                     type: 'offline',   per: 0.10, wired: true },
  { name: 'de la Chute',          era: 3, art: 'e3_chute',       label: '+12% dano em boss',                type: 'bossDmg',   per: 0.12, wired: true },
  { name: 'des Cendres',          era: 3, art: 'e3_cendres',     label: '+10% Vestiges',                    type: 'vestiges',  per: 0.10, wired: true },
  { name: 'du Dernier Chant',     era: 3, art: 'e3_chant',       label: '+1 ponto de Convergence/run a cada 5 níveis', type: 'convPoint', per: 0, wired: true },
  { name: 'de la Blessure',       era: 4, art: 'e4_blessure',    label: '×1.10 dano (multiplicativo)',      type: 'dmgMult',   per: 0.10, wired: true },
  { name: 'de la Résistance',     era: 4, art: 'e4_resistance',  label: '+12% HP, regen e defesa',          type: 'survival',  per: 0.12, wired: true },
  { name: 'du Temps Brisé',       era: 4, art: 'e4_temps',       label: '+15% a TODOS os Éclats',           type: 'eclatsAll', per: 0.15, wired: true },
  { name: 'du Vide',              era: 5, art: 'e5_vide',        label: '+10% recompensa nas dificuldades', type: 'diffReward',per: 0.10, wired: true },
  { name: 'de la Lumière Entière',era: 5, art: 'e5_lumiere',     label: 'amplifica o expoente da Clarté (stub)', type: 'clarteExp', per: 0, wired: true },
  { name: 'du Choix',             era: 5, art: 'e5_choix',       label: '+5% a todos os efeitos de Mémoires',type: 'allMemoire',per: 0.05, wired: true },
];

// §15 — Offline: simulação real do combate enquanto fora.
// Teto de 30 dias é guarda de engenharia (custo de CPU), não balanceamento.
export const OFFLINE = {
  maxSeconds: 30 * 24 * 3600,
  minSecondsToReport: 60, // abaixo disso não mostra o resumo
};

// Núcleo / infraestrutura
export const TICK_SECONDS = 0.1;     // tick fixo de 100ms
export const MAX_CATCHUP_TICKS = 50; // teto de catch-up por frame (ausências longas: offline §15 no reload)
export const AUTOSAVE_MS = 10_000;
export const SAVE_KEY = 'eclats_save_v1';
export const SCHEMA_VERSION = 5; // v5 (Bloco 3): + state.ecoMap (Eco do Seeker, Fate Keeper A3)
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
