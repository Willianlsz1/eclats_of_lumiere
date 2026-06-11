// Constantes de balanceamento — fonte: docs/eclats_gdd_final_v2.md
// NUNCA inventar valores: tudo aqui vem do GDD (seções 3, 4, 6 e 12).

// §4 — Constantes-âncora do núcleo de combate
export const COMBAT = {
  baseDmg: 7,
  baseAPS: 0.40,          // intervalo de ataque 2.5s
  apsCap: 1.25,           // intervalo mínimo 0.8s
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

// §3 — Malha geométrica do Map 1 (The Dreaming Wood)
// §4 — Pack sizes e curva de dano dos mobs
export const MAP_1 = {
  id: 1,
  name: 'The Dreaming Wood',
  lvlLo: 1,
  lvlHi: 1000,
  hpLo: 10,
  hpHi: 1e6,
  dmgLo: 1,
  dmgHi: 1e4,
  subareaCount: 5,
  packSizes: [1, 2, 4, 6, 8], // Sub1..Sub5
  bossKillThreshold: 100,     // kills (oculto) para o boss entrar no pack
};

// Boss final do Map 1 (canônico — art direction §3). Bosses das subáreas 1-4
// não têm nome canônico ainda (aguardando doc de lore) — rótulo provisório.
export const MAP_1_BOSS_NAME = 'The Gilded Hollow';
export const BOSS_LUMEN_MULT = 5; // §12: lumens_por_kill de boss ×5

// Trio canônico de criaturas do Map 1 (The Fragmented) — art direction §3
export const MAP_1_ENEMY_NAMES = ['Candlewisp Shade', 'Mothlight Herald', 'Dreamhorn Warden'];

// §5 — Gold Stats (resetam na Convergence — CP-E)
// custo(n) = costBase × costRamp^n · stat_total = (1 + nível × per) × milestones
export const GOLD_STATS = {
  costBase: 10,
  costRamp: 1.15,
  per: { str: 0.08, vit: 0.06, agi: 0.04, lck: 0.015, frt: 0.05, wis: 0.05 },
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

// §6 — Convergence: parede de XP geométrica e pontos por profundidade
export const CONVERGENCE = {
  wallBase: 1500,        // parede da 1ª run
  wallRatio: 1.5,        // razão base entre paredes
  wallRatioGrowth: 1.06, // a razão cresce 6% a cada Convergence
  pointBonus: 0.15,      // conv_factor = 1 + 0.15 × Σ pontos
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
// TODO(canon): rates/caps por raridade, custos, e o afixo real de cada peça.
export const GEAR_RARITIES = ['faded', 'kindled', 'luminous', 'radiant', 'converged'];
export const GEAR_RARITY_LABELS = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
export const GEAR = {
  // 6 peças canônicas (Art Direction §8h). affix = stat afetado (provisório).
  pieces: [
    { key: 'edge',  name: 'The Waning Edge',      slot: 'Arma',     affix: 'dmg' },
    { key: 'vigil', name: 'The Silent Vigil',     slot: 'Elmo',     affix: 'hp' },
    { key: 'veil',  name: 'Veil of Cinders',      slot: 'Manto',    affix: 'hp' },
    { key: 'grasp', name: 'Grasp of the Unnamed', slot: 'Manoplas', affix: 'crit' },
    { key: 'reson', name: 'The Last Resonance',   slot: 'Amuleto',  affix: 'xp' },
    { key: 'band',  name: 'Band of Dusk',         slot: 'Anel',     affix: 'lumens' },
  ],
  // por raridade (índice 0..4): força do afixo sobe, cap de nível sobe, custo sobe
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  levelCap:   [25, 50, 100, 175, 300],
  costMult:   [1, 4, 16, 64, 256],
  // afixo multiplicativo (dmg/hp/xp/lumens) = 1 + nível × perLevel × rarityMult
  affixPerLevel: 0.02,
  // afixo de crit (grasp) = nível × critPerLevel × rarityMult (chance plana)
  critPerLevel: 0.0004,
  // custo de upar 1 nível = base × ramp^nível × costMult[raridade]
  levelCostBase: 50,
  levelCostRamp: 1.12,
  // custo (Lumens) p/ subir à raridade índice i (materiais de boss = pós-MVP).
  // Requer a peça no nível máximo da raridade atual.
  rarityUpCost: [0, 6000, 90_000, 1.5e6, 3e7],
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
  maxLevel: 5,                                    // ⏳ provisório (cap por passiva)
  // envelope agregado por árvore (efeito multiplicativo por nível) — ⏳ provisório
  effectPerLevel: { eclat: 0.05, vestige: 0.03, fracture: 0.04 },
  // nomes na ordem canônica do GDD §7 (grupos de 5) + chave da arte (assets.js)
  trees: {
    eclat: { label: 'Éclat', sub: 'Combate · dano', cls: 't-eclat', list: [
      ['Radiant Strike','e_radiant_strike'], ['Shard Burst','e_shard_burst'], ['Luminal Edge','e_luminal_edge'], ['Resonant Force','e_resonant_force'], ['Éclat Surge','e_eclat_surge'],
      ['Execute','e_execute'], ['Overkill','e_overkill'], ['Momentum','e_momentum'], ['Refraction','e_refraction'], ['Crit Cascade','e_crit_cascade'],
      ['Luminal Explosion','e_luminal_explosion'], ["Or Ein Sof's Touch",'e_oreinsof_touch'], ['Shattered Light','e_shattered_light'], ['Fracture Weakness','e_fracture_weakness'], ['Void Piercing','e_void_piercing'],
    ] },
    vestige: { label: 'Vestige', sub: 'Economia · ganhos', cls: 't-vest', list: [
      ["Lumen's Blessing",'v_lumens_blessing'], ['Wisdom of Ruins','v_wisdom_ruins'], ['Remnant Harvest','v_remnant_harvest'], ['Vestige Pull','v_vestige_pull'], ['Scavenger','v_scavenger'],
      ['Dreamwalker','v_dreamwalker'], ['Beast Caller','v_beast_caller'], ['Hoarder','v_hoarder'], ['Awakened Harvest','v_awakened_harvest'], ['Echo of Greed','v_echo_greed'],
      ['Void Scavenger','v_void_scavenger'], ['Eternal Vestige','v_eternal_vestige'], ['Fractured Soul','v_fractured_soul'], ['Luminal Cache','v_luminal_cache'], ['The Collector','v_collector'],
    ] },
    fracture: { label: 'Fracture', sub: 'Utilidade · HP', cls: 't-frac', list: [
      ['Weakened Void','f_weakened_void'], ['Fracture Sense','f_fracture_sense'], ['Void Awareness','f_void_awareness'], ['Fracture Pulse','f_fracture_pulse'], ['Void Haste','f_void_haste'],
      ['Shard Disruption','f_shard_disruption'], ["Nihel's Shadow",'f_nihels_shadow'], ['Éclat Attunement','f_eclat_attunement'], ["La Fracture's Echo",'f_fractures_echo'], ['Last Light','f_last_light'],
      ['Void Collapse','f_void_collapse'], ["The Fracture's Gift",'f_fractures_gift'], ['Claimed Domination','f_claimed_domination'], ["Nil's Embrace",'f_nils_embrace'], ['Void Endurance','f_void_endurance'],
    ] },
  },
};

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
export const SCHEMA_VERSION = 1;
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
