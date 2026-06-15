# Éclats of Lumière — Lógica do Jogo (sem camada visual)

> Dump gerado em 2026-06-15 14:42 UTC a partir da branch `claude/map1-pacing-audit-ugqv9g` (commit `0a75d3f`).
> Inclui apenas a **lógica**: `src/data/constants.js`, `src/core/` e `src/game/`.
> **Fora** (camada visual/apresentação): `src/ui/*`, todos os `.css`, `index.html`, `src/main.js` (bootstrap de UI) e `src/data/assets.js` (mapa de artes).

## Índice
- [`src/data/constants.js`](#src-data-constants-js)
- [`src/core/format.js`](#src-core-format-js)
- [`src/core/state.js`](#src-core-state-js)
- [`src/core/save.js`](#src-core-save-js)
- [`src/core/loop.js`](#src-core-loop-js)
- [`src/core/dev.js`](#src-core-dev-js)
- [`src/game/stats.js`](#src-game-stats-js)
- [`src/game/enemies.js`](#src-game-enemies-js)
- [`src/game/combat.js`](#src-game-combat-js)
- [`src/game/economy.js`](#src-game-economy-js)
- [`src/game/convergence.js`](#src-game-convergence-js)
- [`src/game/ascension.js`](#src-game-ascension-js)
- [`src/game/gear.js`](#src-game-gear-js)
- [`src/game/passives.js`](#src-game-passives-js)
- [`src/game/memoires.js`](#src-game-memoires-js)
- [`src/game/difficulty.js`](#src-game-difficulty-js)
- [`src/game/fatekeepers.js`](#src-game-fatekeepers-js)
- [`src/game/offline.js`](#src-game-offline-js)

---

<a id="src-data-constants-js"></a>

## `src/data/constants.js`

```js
// Constantes de balanceamento — fonte: docs/eclats_gdd_final_v2.md
// NUNCA inventar valores: tudo aqui vem do GDD (seções 3, 4, 6 e 12).

// §4 — Constantes-âncora do núcleo de combate
export const COMBAT = {
  baseDmg: 3500,          // rescale ×500 (14/jun): números iniciais em centenas/milhares (não 0.2/7)
  baseAPS: 0.90,          // intervalo de ataque ~1.11s (ajuste pedido pelo Willian: 0.40 → 0.90)
  apsCap: 5,              // teto de 5 kills/s (18k/h) — ajuste pedido pelo Willian (confortável; 15 rápido, 2 lento).
  agiApsCap: 3.75,        // sub-cap do AGI: AGI sozinho leva o APS até ~3.4 (0.90 × 3.75)
  // APS do gear (afixo do Amuleto): curva DIRETA e front-loaded. ganho = max × p/(p+half),
  // p = força do afixo (~nível×0.02). Cresce rápido cedo e satura: +0.45 → APS ~1.35 no teto;
  // ~1.30 no fim do M1 (gear ~686). Substitui o log "resonance" (que matava os 30%).
  apsBonusMax: 0.45,
  apsHalf: 1.7,
  playerBaseHp: 25000,    // rescale ×500
  regenPerSec: 0.01,      // 1% do HP máx por segundo
  regenOnKill: 0.02,      // 2% do HP máx por kill
  bossHpMult: 15,         // usado no CP-D
  bossDmgMult: 3,         // usado no CP-D
  deathRespawnSeconds: 3, // morte: respawn com HP cheio, sem perdas
  waveClearDelay: 0.3,    // beat entre ondas: cobre o voo do projétil (PROJ_BASE_MS 200ms + frame)
                          // p/ a morte do ÚLTIMO mob chegar ANTES da próxima onda surgir.
};

// §12 — Lumens · §6 — XP
export const ECONOMY = {
  goldRatio: 0.10,  // lumens_por_kill = mob_hp × 0.10 (× convMult; sem frt — CP-3)
  xpRatio: 0.08,    // xp_por_kill     = mob_hp × 0.08 (× convMult; sem wis — CP-3)
  // ✅ Map 1 (14/jun): PISO fixo de lumens/kill. Pesa cedo (mob vale pouco) e some tarde
  // (mob vale milhares) → 1º nível comprável em ~1min (era ~9min). Acelera o early (ok, Willian).
  lumensFloor: 30000,  // rescale ×500 (acompanha o mob_hp ×500; pacing idêntico)
};

// CP-3 (redesign) — NÍVEL = motor de stat base (substitui os Gold Stats).
// O nível vem do XP da RUN (xpRun): level = (xpRun / div)^exp. Reseta na Convergence.
// Cada nível dá stat FLAT. ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste.
export const LEVEL = {
  curveDiv: 11000, curveExp: 0.4, // calibrado p/ ~8h no Map 1 (gate por nível; sim map1_pace.mjs)
  dmgPerLevel: 5000,  // +dano flat por nível (rescale ×500)
  hpPerLevel: 2500,   // +HP flat por nível (rescale ×500)
  goldPerLevel: 1500, // +Lumens base por kill por nível (rescale ×500)
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
const PACK = [2, 3, 4, 5, 6, 8, 10, 12, 14];
export const MAPS = [
  {
    id: 1, name: 'The Dreaming Wood', continent: 'worldmap.continent1', bg: 'backgrounds.map1',
    lvlLo: 1, lvlHi: 1000, hpLo: 5000, hpHi: 5e8, dmgLo: 100, dmgHi: 1e7,
    subareaCount: 9, packSizes: PACK, bossKillThreshold: 100,
    enemyNames: ['Candlewisp Shade', 'Mothlight Herald', 'Dreamhorn Warden', 'Hollowroot Crawler', 'Glowmere Drifter'],
    enemyArts: ['enemies.map1.candlewisp_shade', 'enemies.map1.mothlight_herald', 'enemies.map1.dreamhorn_warden', 'enemies.map1.hollowroot_crawler', 'enemies.map1.glowmere_drifter'],
    guardianArt: 'enemies.map1.dreamhorn_warden',
    bossName: 'The Gilded Hollow', bossArt: 'enemies.map1.gilded_hollow',
    subareaNames: [
      'Lanternroot Glade', 'Glimmercap Hollow', 'The Lightfall Stair', 'The Dreaming Gate',
      'The Verdant Deep', 'The Gilded Mire', 'The Hollowed Grove', 'The Stillwatch', 'The Hollow Heart',
    ],
  },
  {
    id: 2, name: 'Cavernes Luminis', continent: 'worldmap.continent2', bg: 'backgrounds.map2',
    lvlLo: 1000, lvlHi: 1e5, hpLo: 1e6, hpHi: 1e14, dmgLo: 2e4, dmgHi: 2e12,
    subareaCount: 6, packSizes: PACK, bossKillThreshold: 200,
    enemyNames: ['Crystalbound Husk', 'Luminis Pilgrim', 'Hollowflame Adept'],
    enemyArts: ['enemies.map2.crystal_being', 'enemies.map2.cyan_ghost', 'enemies.map2.teal_flame'],
    guardianArt: 'enemies.map2.crystal_being',
    bossName: 'The Pale Reunion', bossArt: 'bosses.pale_reunion',
  },
  {
    id: 3, name: 'The Ashen Ruins', continent: 'worldmap.continent3', bg: 'backgrounds.map3',
    lvlLo: 1e5, lvlHi: 1e7, hpLo: 1e14, hpHi: 1e24, dmgLo: 2e12, dmgHi: 2e22,
    subareaCount: 7, packSizes: PACK, bossKillThreshold: 350,
    enemyNames: ['Ember Revenant', 'Emberhorn Penitent', 'Ash Choir'],
    enemyArts: ['enemies.map3.thorn_sentinel', 'enemies.map3.horned_statue', 'enemies.map3.three_faces'],
    guardianArt: 'enemies.map3.vortex',
    bossName: 'The Ashen King', bossArt: 'bosses.m3_ashen_king',
  },
  {
    id: 4, name: 'The Fractured Peaks', continent: 'worldmap.continent4', bg: 'backgrounds.map4',
    lvlLo: 1e7, lvlHi: 1e8, hpLo: 1e24, hpHi: 1e35, dmgLo: 2e22, dmgHi: 2e33,
    subareaCount: 8, packSizes: PACK, bossKillThreshold: 500,
    enemyNames: ['Fissure Stalker', 'Sundered Titan', 'Claimed Vanguard'],
    enemyArts: ['enemies.map4.fissure_stalker', 'enemies.map4.chained_giant', 'enemies.map4.claimed_vanguard'],
    guardianArt: 'enemies.map4.chained_giant',
    bossName: 'The Claimed Queen', bossArt: 'bosses.m4_claimed_queen',
  },
  {
    id: 5, name: 'Nil Aeternum', continent: 'worldmap.continent5', bg: 'backgrounds.map5',
    lvlLo: 1e8, lvlHi: 1e9, hpLo: 1e35, hpHi: 1e45, dmgLo: 2e33, dmgHi: 2e43,
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

// CP-3 (redesign): Convergence SEM reset de mapa. Gate por NÍVEL; +15% ADITIVO
// permanente (dano/HP/XP/Lumens). VERDADE DO CÓDIGO (convergence.js doConverge):
// reseta o nível da run (xpRun) + os Lumens; MANTÉM o Gear (nível E raridade) e a
// posição no mapa. (O Gatekeeper A1 "não resetar o Gear" já é o comportamento atual.)
// ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste (15% fixo? variável?).
export const CONVERGENCE = {
  bonusPerConv: 0.15,    // convMult = 1 + 0.15 × convergences (ADITIVO) — acelerador, não motor
  gateLevelBase: 40,     // 1ª Convergence: atingir nível 40
  gateLevelGrowth: 1.25, // ✅ Map 1: o alvo de nível sobe ×1.25 a cada Convergence (~12 converges/M1)
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
  // por raridade (índice 0..4): força do afixo e CUSTO sobem
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  // CAP de nível por raridade (✅ Map 1: Faded = 1000). M2+ = placeholder (a discutir).
  levelCap:   [750, 2000, 3000, 4000, 5000],
  // CUSTO por tier. Faded = ×1 (→ 1400×(L+1), ✅ Map 1). M2+ = placeholder seguro (a discutir).
  costMult:   [1, 10, 100, 1000, 10000],
  // ── MODELO MAP 1 (calibrado 14/jun): 2 AFIXOS por peça — flat + % ──
  // Primary (flat, por tipo) — soma à base. Bonus% (%) — multiplica. (×Multiplier removido.)
  flatPerLevel: { dmg: 30000, hp: 12500, defesa: 7500, aps: 0, regen: 0.0005, bossDmg: 0, lumens: 0, xp: 0, crit: 0, critDmg: 0, materiais: 0 },
  bonusRate: 0.02,           // afixo % : 1 + nível × bonusRate × rarityMult (2%/nv no Faded). ✅ Map 1
  multRate:  0,              // ×Multiplier REMOVIDO (decisão Willian 14/jun — era cópia do Gaiadon)
  affixPctRate: 0.01,        // FARM (lumens/xp/materiais): % linear/nível. (fix do NaN — faltava no constants)
  secondaryExp: 0.30,        // afixo SECUNDÁRIO = primário^0.30 (e flat/camadas × secondaryExp)
  capPerAsc: 0,
  critPerLevel: 3e-4,        // afixo crit (chance): GRADUAL, ~15% no fim do M1 (Grasp ~490 Faded)
  critDmgPerLevel: 1e-3,     // afixo critDmg (bônus plano sobre ×2): escala até o cap 1000 do gear
  // custo de nível LINEAR: base × (nível+1) × costMult[raridade]. Calibrado p/ ~8h Map 1 (sim map1_pace.mjs).
  levelCostBase: 420000,
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
// cumprir a CHECKLIST de requisitos → +1 tier (gate de poder no meio do mapa).
// index despertares = 0..4. (Antes do redesign de combate 14/jun o gate era "vencer
// o Guardião da Sub 3"; esse Guardião não existe mais — só a última sub-área tem boss.)
export const SEEKER_RANKS = [
  { name: 'Seeker',     tier: 'I' },
  { name: 'Illuminate', tier: 'II' },
  { name: 'Éclairé',    tier: 'III' },
  { name: 'L’Éveillé',  tier: 'IV' },
  { name: 'Lumière',    tier: 'V' },
];
// ×poder permanente por tier de Despertar (dano E HP). ⏳ PROVISÓRIO — calibração na Escala.
export const DESPERTAR = { mult: 5 };

// §8 redesign (14/jun) — gate do Despertar = CHECKLIST de requisitos COMBINADOS
// (lógica E): Nível (gargalo) + Material T1 + Oferenda (Nitzotzot) + Tributo
// (Vestiges). ⏳ NÚMEROS = LISTA DE CALIBRAÇÃO. Substitui a "Prova: Guardião Sub3"
// (órfã desde o combate single-boss de 14/jun). Drop do Nitzotz: só nas Sub-áreas 3+.
export const NITZOTZ = { dropChance: 0.02, bossChunk: 5 };
// Requisito por TIER ALVO (índice = despertares+1 = 1..4 → T2..T5). [0] não usado (T1 = início).
export const DESPERTAR_REQ = [
  null,
  { nitzotz: 20,  vestiges: 75_000 },    // → T2 Illuminate  (~15% Asc Map1)
  { nitzotz: 40,  vestiges: 285_000 },   // → T3 Éclairé     (~15% Asc Map2)
  { nitzotz: 80,  vestiges: 600_000 },   // → T4 L'Éveillé   (~15% Asc Map3)
  { nitzotz: 160, vestiges: 1_200_000 }, // → T5 Lumière     (~15% Asc Map4)
];
// Nível mínimo da run por TIER ALVO (gargalo principal da checklist). Índice = tier
// alvo 1..4. [0] não usado. ⏳ só o tier 1 tem placeholder pedido; 2-4 acompanham.
export const DESPERTAR_GATE_LEVEL = [
  0,
  30,  // → T2  // PLACEHOLDER - calibrar depois com o sim
  120, // → T3  (placeholder folgado; recalibrar com o sim)
  300, // → T4  (placeholder folgado; recalibrar com o sim)
  600, // → T5  (placeholder folgado; recalibrar com o sim)
];
// Material T1 (materiais[0], o MESMO do upgrade de raridade do gear) por TIER ALVO.
// Índice = tier alvo 1..4. [0] não usado.
export const DESPERTAR_MAT_T1 = [
  0,
  20,  // → T2  // PLACEHOLDER - calibrar depois com o sim
  60,  // → T3  (placeholder folgado; recalibrar com o sim)
  120, // → T4  (placeholder folgado; recalibrar com o sim)
  240, // → T5  (placeholder folgado; recalibrar com o sim)
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
export const SCHEMA_VERSION = 6; // v6 (14/jun): modelo Map 1 — gear 2 afixos + cap 1000 + custo/conv novos (descarta saves antigos incompatíveis)
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
```

<a id="src-core-format-js"></a>

## `src/core/format.js`

```js
// Formatação central de números exibidos.
// Regra (CLAUDE.md): sufixos K/M/B/T, depois notação científica curta.

const SUFFIXES = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

// Acima de 1e15 (esgotados os sufixos) cai na notação científica curta: "1.23e18".
const SCI_THRESHOLD = 1e15;

// Multiplicador exibido como PORCENTAGEM total: ×3.89 → "389%", ×495 → "49.5K%",
// ×1 → "100%". Decisão do Willian (mais amigável que "×N" para crit/bônus).
export function formatMult(v) {
  if (!Number.isFinite(v)) return '∞%';
  return `${formatNumber(v * 100)}%`;
}

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) {
    // valores pequenos: inteiro, ou 1 casa se tiver fração relevante
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
  if (n >= SCI_THRESHOLD) {
    const exp = Math.floor(Math.log10(n));
    const mant = n / 10 ** exp;
    return `${mant.toFixed(2)}e${exp}`;
  }
  for (const { value, suffix } of SUFFIXES) {
    if (n >= value) {
      const v = n / value;
      // 48.2K, 1.85M — máximo 3 algarismos significativos antes do sufixo
      const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
      return v.toFixed(decimals) + suffix;
    }
  }
  return String(Math.round(n));
}
```

<a id="src-core-state-js"></a>

## `src/core/state.js`

```js
// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION, SEEKER_RANKS, MAPS } from '../data/constants.js';

// Nº de sub-áreas de um mapa (default Map 1). CP-2: 8 por mapa.
const subCountOf = (mapId) => (MAPS[(mapId || 1) - 1] || MAPS[0]).subareaCount;
// Normaliza um array de bossDefeated para o comprimento certo (pad false / trunca).
const normBossDefeated = (arr, mapId) =>
  Array.from({ length: subCountOf(mapId) }, (_, i) => !!(arr && arr[i]));

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos
    lumens: 0,
    xpTotal: 0, // XP acumulado da vida — alimenta o level de display (§6 do GDD)
    xpRun: 0,   // XP da run — enche a parede de Convergence, reseta ao convergir

    // Vestiges (§7) — nunca resetam
    vestiges: 0,

    // Éclats (§10) — moeda-relíquia; fonte é a Ascension (A1). Nunca resetam.
    eclats: 0,
    ascensions: 0, // marcos de Ascension concluídos (§9) — gate das Mémoires por era
    despertares: 0, // §8 (Passo 7): tier de Despertar (0..4 = T1..T5), gate de poder no meio do mapa
    nitzotzot: 0, // §8 (redesign 13/jun): material dedicado do Despertar (Oferenda). Dropa nas Sub 3+. PERSISTE.
    memoires: new Array(15).fill(0), // níveis das 15 Mémoires (§11); 0 = bloqueada. PERSISTE.

    // Convergence (§6) — persistem para sempre
    convergences: 0,
    convPoints: 0,
    bestSubareaRun: 1, // subárea mais funda alcançada na run (vira pontos)

    // Gold Stats (§5) — resetam na Convergence (CP-E)
    stats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    // Passivas (§7) — 3 árvores × 15 níveis (0 = bloqueada). PERSISTE sempre;
    // desbloqueia na 1ª Convergence. Índice = ordem canônica do GDD.
    passives: {
      eclat:    new Array(15).fill(0),
      vestige:  new Array(15).fill(0),
      fracture: new Array(15).fill(0),
    },

    // Gear (§13) — 6 peças fixas, cada uma com nível + raridade. PERSISTE sempre
    // (não reseta na Convergence). rarity = índice em GEAR_RARITIES (0=Faded).
    gear: {
      edge:  { level: 0, rarity: 0 },
      vigil: { level: 0, rarity: 0 },
      veil:  { level: 0, rarity: 0 },
      grasp: { level: 0, rarity: 0 },
      reson: { level: 0, rarity: 0 },
      band:  { level: 0, rarity: 0 },
    },
    materiais: [0, 0, 0, 0], // §13B (Passo 4): T1-T4. materiais[r] paga a raridade r→r+1.

    // §8 (Passo 5): dificuldade selecionada (índice em DIFFICULTIES) + automações dos Fate Keepers
    difficulty: 0,
    auto: { stats: false, converge: false, progress: false }, // toggl_es (default off; desbloqueiam por Ascension)
    ecoMap: 0, // §8 Eco do Seeker (A3): mapa que o eco farma em 2º plano (0 = nenhum)

    // Posição no mundo
    map: 1,
    maxMap: 1,          // fronteira: maior mapa já alcançado (permite voltar a anteriores)
    subarea: 1,         // 1..subareaCount (CP-2: 8)
    unlockedSubarea: 1, // gate: maior subárea acessível (abre ao derrotar o boss)
    bossDefeated: normBossDefeated([], 1), // 1ª derrota por subárea (comprimento = subareaCount)
    killsInSubarea: 0,  // contador oculto rumo ao threshold do boss
    mapProgress: {},    // progresso salvo por mapa {id: {subarea, unlockedSubarea, bossDefeated, killsInSubarea}}

    // Jogador (valores derivados ficam em src/game/stats.js)
    player: {
      hp: 0,            // inicializado com hpMax no bootstrap
      dead: false,
      respawnTimer: 0,  // segundos até o respawn quando morto
      attackTimer: 0,   // acumulador do intervalo de ataque
    },

    // Onda ativa de inimigos (runtime, não persistido). Mobs mortos ficam na
    // cena (apagados) até a onda ser limpa — sem respawn individual.
    enemies: [],
    wave: 1, // número da onda atual na subárea (runtime)

    // Fila de efeitos visuais (runtime) — hits para os números flutuantes
    fx: [],

    // Métricas
    killsTotal: 0,
  };
}

// Estado vivo da sessão (singleton simples)
export const state = createInitialState();

// Aplica um snapshot persistido por cima do estado inicial (campos salvos apenas)
export function applySnapshot(snapshot) {
  state.lumens = snapshot.lumens ?? 0;
  state.xpTotal = snapshot.xpTotal ?? 0;
  state.map = snapshot.map ?? 1;
  state.subarea = snapshot.subarea ?? 1;
  state.killsTotal = snapshot.killsTotal ?? 0;
  // saves antigos (sem stats) entram com tudo zerado
  Object.assign(state.stats, snapshot.stats ?? {});
  // saves anteriores ao gate: herda a subárea atual como desbloqueada
  state.unlockedSubarea = snapshot.unlockedSubarea ?? state.subarea;
  // CP-2: normaliza o comprimento ao nº de sub-áreas do mapa (saves antigos = 5 → 8)
  state.bossDefeated = normBossDefeated(snapshot.bossDefeated, state.map);
  state.killsInSubarea = snapshot.killsInSubarea ?? 0;
  state.subarea = Math.min(state.subarea, state.unlockedSubarea);
  // viagem entre mapas: fronteira + progresso por mapa (saves antigos: fronteira = mapa atual)
  state.maxMap = Math.max(snapshot.maxMap ?? state.map, state.map);
  state.mapProgress = snapshot.mapProgress ?? {};
  state.xpRun = snapshot.xpRun ?? 0;
  state.vestiges = snapshot.vestiges ?? 0;
  state.convergences = snapshot.convergences ?? 0;
  state.convPoints = snapshot.convPoints ?? 0;
  state.bestSubareaRun = snapshot.bestSubareaRun ?? state.subarea;
  // Éclats / Ascension / Mémoires persistem
  state.eclats = snapshot.eclats ?? 0;
  state.ascensions = snapshot.ascensions ?? 0;
  if (Array.isArray(snapshot.memoires)) {
    for (let i = 0; i < state.memoires.length; i++) state.memoires[i] = snapshot.memoires[i] ?? 0;
  }
  // Passivas persistem; saves antigos (sem passives) mantêm tudo bloqueado
  if (snapshot.passives) {
    for (const tree of Object.keys(state.passives)) {
      const arr = snapshot.passives[tree];
      if (Array.isArray(arr)) {
        for (let i = 0; i < state.passives[tree].length; i++) state.passives[tree][i] = arr[i] ?? 0;
      }
    }
  }
  // Gear persiste; saves antigos (sem gear) mantêm o default (tudo Faded nível 0)
  if (snapshot.gear) {
    for (const key of Object.keys(state.gear)) {
      const g = snapshot.gear[key];
      if (g) state.gear[key] = { level: g.level ?? 0, rarity: g.rarity ?? 0 };
    }
  }
  // Materiais (§13B, schema v2): default 0 p/ saves antigos (sem materiais). Normaliza sempre.
  const mats = Array.isArray(snapshot.materiais) ? snapshot.materiais : [];
  for (let i = 0; i < state.materiais.length; i++) state.materiais[i] = mats[i] ?? 0;
  // §8 (schema v3): dificuldade + automações. Normaliza sempre (default p/ saves antigos).
  state.difficulty = snapshot.difficulty ?? 0;
  const a = snapshot.auto || {};
  state.auto = { stats: !!a.stats, converge: !!a.converge, progress: !!a.progress };
  state.ecoMap = snapshot.ecoMap ?? 0; // §8 Eco do Seeker (schema v5)
  // §8 (schema v4): tier de Despertar. MIGRA de saves antigos a partir das ascensions p/
  // NÃO regredir o tier — cada ascension passada implica um Despertar (você passou a Sub 3
  // do mapa p/ vencer o boss e ascender); +1 se já passou a Sub 3 do mapa ATUAL.
  state.despertares = snapshot.despertares ?? Math.min(
    SEEKER_RANKS.length - 1,
    state.ascensions + (state.unlockedSubarea > 3 ? 1 : 0),
  );
  state.nitzotzot = snapshot.nitzotzot ?? 0; // §8 redesign (material do Despertar)
}

// Extrai só o que deve ser persistido (pack e timers são reconstruídos no load)
export function toSnapshot() {
  return {
    schemaVersion: state.schemaVersion,
    lumens: state.lumens,
    xpTotal: state.xpTotal,
    map: state.map,
    subarea: state.subarea,
    killsTotal: state.killsTotal,
    stats: { ...state.stats },
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
    maxMap: state.maxMap,
    mapProgress: JSON.parse(JSON.stringify(state.mapProgress)),
    xpRun: state.xpRun,
    vestiges: state.vestiges,
    convergences: state.convergences,
    convPoints: state.convPoints,
    bestSubareaRun: state.bestSubareaRun,
    gear: JSON.parse(JSON.stringify(state.gear)),         // persiste sempre (§13)
    materiais: [...state.materiais],                      // §13B (persiste sempre)
    difficulty: state.difficulty,                         // §8 (Passo 5)
    auto: { ...state.auto },                              // §8 automações
    ecoMap: state.ecoMap,                                 // §8 Eco do Seeker (A3)
    passives: JSON.parse(JSON.stringify(state.passives)), // persiste sempre (§7)
    eclats: state.eclats,                                 // §10
    ascensions: state.ascensions,                         // §9
    despertares: state.despertares,                       // §8 (Passo 7) tier de Despertar
    nitzotzot: state.nitzotzot,                           // §8 redesign — material do Despertar
    memoires: [...state.memoires],                        // §11
  };
}
```

<a id="src-core-save-js"></a>

## `src/core/save.js`

```js
// Persistência em localStorage com versão de schema.
// Autosave a cada 10s e no beforeunload.

import { SAVE_KEY, SCHEMA_VERSION, AUTOSAVE_MS } from '../data/constants.js';
import { toSnapshot, applySnapshot } from './state.js';

export function save() {
  try {
    // savedAt marca o momento do save — base do progresso offline (§15)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...toSnapshot(), savedAt: Date.now() }));
  } catch (e) {
    // localStorage cheio ou indisponível — não derruba o jogo
    console.warn('Falha ao salvar:', e);
  }
}

// Retorna o snapshot carregado (já aplicado ao estado) ou null.
export function load() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    console.warn('Save corrompido — começando do zero.');
    return null;
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    // Migrações entram aqui quando o schema evoluir; por ora, descarta.
    console.warn(`Schema ${snapshot.schemaVersion} ≠ ${SCHEMA_VERSION} — save descartado.`);
    return null;
  }
  applySnapshot(snapshot);
  return snapshot;
}

export function setupAutosave() {
  setInterval(save, AUTOSAVE_MS);
  window.addEventListener('beforeunload', save);
}

// Apaga o save e recomeça do zero. Remove o listener de beforeunload pra o
// autosave NÃO regravar o estado antigo antes do reload.
export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* indisponível */ }
  window.removeEventListener('beforeunload', save);
  window.location.reload();
}
```

<a id="src-core-loop-js"></a>

## `src/core/loop.js`

```js
// Game loop: tick fixo de 100ms com acumulador.
// O setInterval dispara perto de 100ms, mas o tempo real manda: o acumulador
// converte o tempo decorrido em N ticks fixos, mantendo a simulação determinística.

import { TICK_SECONDS, MAX_CATCHUP_TICKS } from '../data/constants.js';

export function startLoop(tickFn) {
  let last = performance.now();
  let accumulator = 0;

  setInterval(() => {
    const now = performance.now();
    accumulator += (now - last) / 1000;
    last = now;

    let ticks = 0;
    while (accumulator >= TICK_SECONDS && ticks < MAX_CATCHUP_TICKS) {
      tickFn(TICK_SECONDS);
      accumulator -= TICK_SECONDS;
      ticks++;
    }
    // Aba em background por muito tempo: descarta o excedente.
    // Ausências longas são cobertas pelo progresso offline (§15) no reload.
    if (ticks >= MAX_CATCHUP_TICKS) accumulator = 0;
  }, TICK_SECONDS * 1000);
}
```

<a id="src-core-dev-js"></a>

## `src/core/dev.js`

```js
// Modo de TESTE/QA — abre o jogo com tudo desbloqueado e recursos fartos, para
// o Willian caçar inconsistências sem grind. Ativa por ?dev na URL OU clicando
// no botão "DEV 🔓" (canto inferior esquerdo). NÃO afeta o jogo normal até ser
// ativado. Isolado aqui; remover no release.

import { MAPS } from '../data/constants.js';

// Nº de sub-áreas do mapa atual (CP-2: 8) — p/ desbloquear o mapa todo sem cravar.
const fullSubs = (state) => (MAPS[(state.map || 1) - 1] || MAPS[0]).subareaCount;

// Aplica os desbloqueios no state (top-up: nunca diminui o que já houver)
export function applyDevUnlock(state) {
  state.lumens   = Math.max(state.lumens, 1e12);   // Gold Stats + Gear à vontade
  state.vestiges = Math.max(state.vestiges, 1e9);  // Passivas à vontade
  state.eclats   = Math.max(state.eclats, 1e9);    // Mémoires à vontade
  state.xpTotal  = Math.max(state.xpTotal, 1e7);   // nível do Seeker decente

  state.convergences = Math.max(state.convergences, 1); // libera as Passivas
  state.convPoints   = Math.max(state.convPoints, 20);  // conv_factor folgado
  state.unlockedSubarea = fullSubs(state);             // mapa todo navegável
  state.maxMap = 5;                                     // os 5 mapas viajáveis
  // boss final batido → A1 fica disponível pra testar a Ascension (não força
  // ascensions: assim dá pra clicar Ascender e ver o fluxo). Mémoires abrem
  // por era conforme você ascende.
  state.bossDefeated = new Array(fullSubs(state)).fill(true);
  state.bestSubareaRun = Math.max(state.bestSubareaRun, fullSubs(state));

  state.stats.vit = Math.max(state.stats.vit, 40);
  state.stats.str = Math.max(state.stats.str, 30);

  state.nitzotzot = Math.max(state.nitzotzot || 0, 9999); // Oferenda do Despertar à vontade
  return true;
}

// Ativa via URL (?dev ou ?unlock) — chamado no boot, antes da UI
export function maybeApplyDevUnlock(state) {
  const q = new URLSearchParams(window.location.search);
  if (!q.has('dev') && !q.has('unlock')) return false;
  return applyDevUnlock(state);
}

// Selo visual indicando que o modo de teste está ativo
export function showDevBadge() {
  const bar = document.querySelector('.topbar');
  if (!bar || document.getElementById('dev-badge')) return;
  const b = document.createElement('div');
  b.id = 'dev-badge';
  b.textContent = 'DEV';
  b.title = 'Modo de teste ativo — tudo desbloqueado';
  b.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;'
    + 'background:#d9a441;color:#1a1206;font:700 12px/1 Inter,sans-serif;letter-spacing:.18em;'
    + 'padding:6px 12px;border-radius:999px;box-shadow:0 0 18px -4px #d9a441;';
  bar.appendChild(b);
}

// ─── Painel DEV flutuante: dar recursos/materiais "infinitos" a qualquer hora ───
const HUGE = 1e30; // "infinito" prático (cabe no teto 1e100 e formata curto)

function devGrant(state, kind) {
  switch (kind) {
    case 'lumens': state.lumens = HUGE; break;
    case 'vestiges': state.vestiges = HUGE; break;
    case 'eclats': state.eclats = HUGE; break;
    case 'nitzotzot': state.nitzotzot = 1e9; break;
    case 'materials': state.materiais = [1e9, 1e9, 1e9, 1e9]; break;
    case 'xp': state.xpTotal += 1e15; break;
    case 'maps':
      state.maxMap = 5; state.unlockedSubarea = fullSubs(state);
      state.bossDefeated = new Array(fullSubs(state)).fill(true);
      state.convergences = Math.max(state.convergences, 1);
      state.ascensions = Math.max(state.ascensions, 5); // abre Mémoires (eras) + ranks
      break;
    case 'all':
      ['lumens', 'vestiges', 'eclats', 'nitzotzot', 'materials', 'xp', 'maps'].forEach((k) => devGrant(state, k));
      break;
    default: break;
  }
}

const DEV_ITEMS = [
  ['★ MAX TUDO', 'all'],
  ['Lumens ∞', 'lumens'],
  ['Vestiges ∞', 'vestiges'],
  ['Éclats ∞', 'eclats'],
  ['Nitzotzot ∞', 'nitzotzot'],
  ['Materiais ∞', 'materials'],
  ['XP +1Qa', 'xp'],
  ['Mapas/Subs', 'maps'],
];

export function setupDevPanel(state, onChange) {
  if (document.getElementById('dev-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = 'position:fixed;left:12px;bottom:56px;z-index:300;display:flex;flex-direction:column;gap:5px;'
    + 'background:rgba(14,20,36,.92);border:1px solid #d9a441;border-radius:12px;padding:10px;'
    + 'width:160px;backdrop-filter:blur(5px);box-shadow:0 8px 26px -8px #000;';
  panel.innerHTML = '<div style="font:700 11px/1 Inter,sans-serif;letter-spacing:.2em;color:#d9a441;'
    + 'text-transform:uppercase;padding:2px 2px 6px;border-bottom:1px solid rgba(217,164,65,.25);margin-bottom:2px">Dev · recursos</div>'
    + DEV_ITEMS.map(([label, k]) =>
      `<button type="button" data-k="${k}" style="cursor:pointer;text-align:left;`
      + 'border:1px solid rgba(217,164,65,.4);border-radius:8px;background:rgba(20,26,37,.7);'
      + `color:#f0d9a0;font:600 12px/1 Inter,sans-serif;padding:8px 10px">${label}</button>`).join('');
  panel.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { devGrant(state, b.dataset.k); if (onChange) onChange(); }));
  document.body.appendChild(panel);
}

// Botão RESET — apaga o save e recomeça do zero (com confirmação). Fica ao lado
// do botão DEV. Útil pra QA: testar o jogo desde o início.
export function setupResetButton(resetFn) {
  if (document.getElementById('reset-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'reset-btn';
  btn.type = 'button';
  btn.textContent = 'RESET ⟳';
  btn.title = 'Apagar o save e recomeçar do zero';
  btn.style.cssText = 'position:fixed;left:108px;bottom:12px;z-index:300;cursor:pointer;'
    + 'background:rgba(37,20,22,.85);color:#e0807f;border:1px solid #b05a59;border-radius:999px;'
    + 'font:700 13px/1 Inter,sans-serif;letter-spacing:.12em;padding:10px 16px;backdrop-filter:blur(4px);';
  btn.addEventListener('click', () => {
    if (window.confirm('Apagar TODO o progresso e recomeçar do zero?')) resetFn();
  });
  document.body.appendChild(btn);
}

// Botão clicável para ativar o modo de teste (quando não veio por URL).
// onApplied() é chamado após ativar (ex.: salvar). Fica fora do #stage para
// não escalar — sempre legível no celular.
export function setupDevButton(state, onApplied) {
  if (document.getElementById('dev-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'dev-btn';
  btn.type = 'button';
  btn.textContent = 'DEV 🔓';
  btn.title = 'Ativar modo de teste — desbloqueia tudo';
  btn.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:300;cursor:pointer;'
    + 'background:rgba(20,26,37,.85);color:#d9a441;border:1px solid #d9a441;border-radius:999px;'
    + 'font:700 13px/1 Inter,sans-serif;letter-spacing:.12em;padding:10px 16px;backdrop-filter:blur(4px);';
  btn.addEventListener('click', () => {
    applyDevUnlock(state);
    showDevBadge();
    setupDevPanel(state, onApplied); // painel flutuante de recursos
    btn.remove();
    if (onApplied) onApplied();
  });
  document.body.appendChild(btn);
}
```

<a id="src-game-stats-js"></a>

## `src/game/stats.js`

```js
// Stats derivados do jogador — modelo CP-3 (redesign).
// NÍVEL (do XP da run) dá dano/HP FLAT — substitui os Gold Stats. APS/crit/economia
// vêm de Gear/Passivas/Mémoires (sem str/vit/agi/lck/frt/wis). Convergence = +15%
// ADITIVO por converge. Fatores de sistemas ainda-não-wirados valem 1.
//
// ⏳ Os shims no fim (strTotal/levelBonus/etc.) existem só pra UI antiga não quebrar
// no CP-3a; somem no CP-3b (rework do Player UI).

import { COMBAT, LEVEL, CRIT, CONVERGENCE, DEFENSE } from '../data/constants.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearDefesaMult, gearCritDmgAdd, gearApsMult,
  gearDamageFlat, gearHpFlat, gearApsFlat } from './gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveEnemyPen, passiveEnemyReduce, passiveApsMult } from './passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult, memoireSurvivalMult } from './memoires.js';
import { ascMult, despertarMult } from './ascension.js';

// ───── Nível (motor de stat base) ─────
// O nível vem do XP da RUN (reseta na Convergence). level = (xpRun / div)^exp.
export function runLevel(state) {
  return Math.max(1, Math.floor((state.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
}
// Nível a partir de um XP qualquer (usado pra display; mesma curva).
export const heroLevel = (xp) => Math.max(1, Math.floor(((xp || 0) / LEVEL.curveDiv) ** LEVEL.curveExp));

// XP do nível atual: xp(L) = curveDiv × L^(1/curveExp) (inverso da curva).
function levelXpBounds(state) {
  const L = runLevel(state);
  const inv = 1 / LEVEL.curveExp;
  return { xpL: LEVEL.curveDiv * L ** inv, xpN: LEVEL.curveDiv * (L + 1) ** inv };
}
// Progresso (0..1) do XP da run dentro do nível atual → enche a barra de LVL.
export function levelProgress(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return Math.max(0, Math.min(1, (state.xpRun - xpL) / (xpN - xpL)));
}
// Valores de XP do nível: acumulado no nível atual / total p/ subir / faltando.
export function levelXpInfo(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return {
    into: Math.max(0, state.xpRun - xpL),
    total: xpN - xpL,
    remaining: Math.max(0, xpN - state.xpRun),
  };
}

// ───── Convergence (+15% ADITIVO por converge) ─────
// Entra em dano, HP, XP e Lumens. O reset (nível da run + nível do gear) é feito
// em convergence.js; aqui é só o multiplicador permanente.
export function convMult(state) {
  return 1 + CONVERGENCE.bonusPerConv * state.convergences;
}

// ───── APS e crit (sem Gold Stats — vêm de gear/passivas) ─────
// APS = baseAPS + ganho DIRETO do afixo de APS (Amuleto), front-loaded e saturante:
//   p = força do afixo (gearApsMult−1 ≈ nível×0.02); ganho = apsBonusMax × p/(p+apsHalf).
// Cresce rápido cedo e satura (≈+0.45 → APS ~1.35). Substitui o log "resonance".
export function apsBonus(state) {
  const p = Math.max(0, gearApsMult(state) - 1);
  return COMBAT.apsBonusMax * p / (p + COMBAT.apsHalf);
}
export function currentAPS(state) {
  const aps = (COMBAT.baseAPS + apsBonus(state)) * passiveApsMult(state);
  return Math.min(COMBAT.apsCap, aps);
}

// Crit ⏳ provisório: rate vem de gear (Grasp) + passivas (Luminal Edge). Sem LCK.
export function critChanceRaw(state) {
  return CRIT.baseChance + gearCritAdd(state) + passiveCritAdd(state);
}
export function critChance(state) {
  return Math.min(1, critChanceRaw(state));
}
export function critDamageMult(state) {
  const overflow = Math.max(0, critChanceRaw(state) - 1); // crit chance > 100% transborda
  return (CRIT.baseDamageMult + overflow * CRIT.overflowFactor + gearCritDmgAdd(state)) * memoireCritDmgMult(state);
}

// ───── Dano e HP (base FLAT: nível do Seeker + flat do Gear) × multiplicadores ─────
const baseDamage = (state) => COMBAT.baseDmg + runLevel(state) * LEVEL.dmgPerLevel + gearDamageFlat(state);
const baseHp = (state) => COMBAT.playerBaseHp + runLevel(state) * LEVEL.hpPerLevel + gearHpFlat(state);

// dano_por_hit = (baseDmg + nível×dmgPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function damagePerHit(state) {
  return baseDamage(state) * convMult(state) * gearDamageMult(state) * passiveDmgMult(state)
    * memoireDmgMult(state) * ascMult(state) * despertarMult(state);
}

// DPS exibido: valor esperado incluindo crit
export function dps(state) {
  const critBonus = 1 + critChance(state) * (critDamageMult(state) - 1);
  return damagePerHit(state) * currentAPS(state) * critBonus;
}

// hp_max = (playerBaseHp + nível×hpPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function playerHpMax(state) {
  return baseHp(state) * convMult(state) * gearHpMult(state) * passiveHpMult(state)
    * memoireHpMult(state) * ascMult(state) * despertarMult(state);
}

// ───── Defesa / mitigação (§4 — inalterado pelo CP-3) ─────
export function veilFactor(state) {
  const fromVeil = Math.max(0, gearDefesaMult(state) - 1) * DEFENSE.veilScale;
  const fromPassives = 0; // ⛓️ hook reservado (Void Endurance etc.)
  const total = (fromVeil + fromPassives) * memoireSurvivalMult(state); // #11 amplia a defesa
  return Math.min(DEFENSE.veilCap, total);
}
export function playerDefesa(state) {
  return playerHpMax(state) * veilFactor(state);
}
export function postArmorDR(_state) {
  return 1; // ⛓️ hook reservado (Nihel's Shadow etc.)
}
export function enemyDefesa(state, _mob) {
  const reduced = DEFENSE.enemyDefBase * (1 - passiveEnemyReduce(state)); // Weakened Void
  return Math.max(0, reduced * (1 - passiveEnemyPen(state)));             // Void Piercing
}

// ───── Compat shims (removidos no CP-3b — UI antiga ainda os importa) ─────
export const strTotal = () => 1;
export const vitTotal = () => 1;
export const frtTotal = () => 1;
export const wisTotal = () => 1;
export const levelBonus = () => 1;             // o nível agora é flat, não multiplicador
export const convFactor = (state) => convMult(state); // a UI mostra a Convergence
export const statCostNext = () => Infinity;    // Gold Stats não são mais compráveis
export function buyStat() { return false; }
export function buyStatMax() {}
```

<a id="src-game-enemies-js"></a>

## `src/game/enemies.js`

```js
// Malha geométrica — GDD §3.
// Bounds de level por subárea: lvl_lo × r^s, com r = (lvl_hi/lvl_lo)^(1/5).
// HP e dano interpolados geometricamente no log do level.

import { MAPS, COMBAT } from '../data/constants.js';

let nextEnemyId = 1;

// Razão geométrica entre subáreas do mapa
function subareaRatio(map) {
  return (map.lvlHi / map.lvlLo) ** (1 / map.subareaCount);
}

// Range de level [lo, hi] da subárea (1-indexada)
export function subareaLevelRange(map, subarea) {
  const r = subareaRatio(map);
  return {
    lo: map.lvlLo * r ** (subarea - 1),
    hi: map.lvlLo * r ** subarea,
  };
}

// Interpolação geométrica no log do level: valor(L) = lo × (hi/lo)^t
// t = (log L − log lvl_lo) / (log lvl_hi − log lvl_lo)
function interp(map, level, lo, hi) {
  const t = (Math.log(level) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
  return lo * (hi / lo) ** t;
}

export function hpForLevel(map, level) {
  return interp(map, level, map.hpLo, map.hpHi);
}

export function dmgForLevel(map, level) {
  return interp(map, level, map.dmgLo, map.dmgHi);
}

// Level sorteado uniformemente no espaço log do range da subárea (malha geométrica)
function rollLevel(map, subarea) {
  const { lo, hi } = subareaLevelRange(map, subarea);
  const level = lo * (hi / lo) ** Math.random();
  return Math.max(1, Math.round(level));
}

export function spawnMob(map, subarea) {
  const level = rollLevel(map, subarea);
  const hpMax = hpForLevel(map, level);
  const id = nextEnemyId++;
  const k = id % map.enemyNames.length; // trio do mapa
  return {
    id,
    name: map.enemyNames[k],
    art: map.enemyArts[k],
    frame: 'frames.enemy_universal', // moldura comum dos inimigos (§8d) — espinhos prateados
    level,
    hpMax,
    hp: hpMax,
    dmg: dmgForLevel(map, level), // dano por segundo causado ao jogador
  };
}

// Boss da subárea (GDD §3/§4): level máximo da subárea, HP ×15, dano ×3.
// Sub 5 = boss final do mapa (arte/nome canônicos); subs 1-4 = Guardião (placeholder).
export function spawnBoss(map, subarea) {
  const level = Math.round(subareaLevelRange(map, subarea).hi);
  const hpMax = hpForLevel(map, level) * COMBAT.bossHpMult;
  const isFinal = subarea === map.subareaCount;
  return {
    id: nextEnemyId++,
    name: isFinal ? map.bossName : `Guardian — Sub-area ${subarea}`,
    art: isFinal ? map.bossArt : map.guardianArt,
    // boss final = moldura própria do mapa (§8d); guardião = moldura comum
    frame: isFinal ? `frames.boss_m${map.id}` : 'frames.enemy_universal',
    isBoss: true,
    isFinalBoss: isFinal,
    level,
    hpMax,
    hp: hpMax,
    dmg: dmgForLevel(map, level) * COMBAT.bossDmgMult,
  };
}

// Pack completo da subárea atual (tamanhos do GDD §4)
export function spawnPack(map, subarea) {
  const size = map.packSizes[subarea - 1];
  return Array.from({ length: size }, () => spawnMob(map, subarea));
}

// Mapa atual conforme state.map (1-indexado). Aceita state ou nada (default Map 1).
export function getCurrentMap(state) {
  const id = state && state.map ? state.map : 1;
  return MAPS[id - 1] || MAPS[0];
}
```

<a id="src-game-combat-js"></a>

## `src/game/combat.js`

```js
// Núcleo de combate — modelo de ONDAS, estilo Gaiadon (ADR 0002, revisado).
// - BASE = SINGLE-TARGET: cada ataque atinge 1 mob (o primeiro vivo). Vale a âncora
//   "máx 1 kill por ataque" → kill rate ≤ APS (ancora a economia base).
// - CLEAVE / AoE (atingir vários/todos) é DESBLOQUEÁVEL por passiva/mecânica na
//   progressão (estilo Gaiadon: começa em 1, libera multi-alvo lá na frente). Quando
//   ligado, `cleaveTargets()` retorna >1 e o ataque excede o teto de kills. ⏳ o
//   unlock real (qual passiva, como escala) será wirado num CP de passivas.
// - Mob morto NÃO respawna: fica na cena (apagado) e para de causar dano. Só
//   quando TODA a onda é limpa é que a próxima onda surge. Reset da onda só
//   acontece ao trocar de subárea ou morrer.
// - Dano ao jogador = Σ dano dos mobs VIVOS da onda (contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.
// - Boss (CP-D): após o kill threshold (oculto), a próxima onda é o Guardião
//   (sozinho); derrotá-lo abre o gate da próxima subárea e vira loop recorrente.

import { COMBAT, NUMBER_CAP, FATE } from '../data/constants.js';
import { spawnPack, spawnBoss, spawnMob, getCurrentMap, subareaLevelRange } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax, critChance, critDamageMult, playerDefesa, postArmorDR, enemyDefesa, runLevel } from './stats.js';
import { awardKill } from './economy.js';
import { eclatsDripPerSec } from './ascension.js';
import { effectiveDifficulty } from './difficulty.js';
import { gearBossDmgMult, gearRegenMult } from './gear.js';
import { memoireSurvivalMult, memoireBossDmgMult, memoireEclatsAllMult, memoireDiffRewardMult } from './memoires.js';
import { passiveMobBonus } from './passives.js';

// Regen efetivo (§4): COMBAT.regenPerSec × afixo Regen do gear × #11 de la Résistance
const regenFactor = (state) => gearRegenMult(state) * memoireSurvivalMult(state);

// Monta a onda da subárea. Se já bateu o threshold, o Guardião entra JUNTO,
// substituindo 1 mob do pack (§4); na Sub 1 (pack de 1) ele vem sozinho.
function makeWave(state) {
  const map = getCurrentMap(state);
  const pack = spawnPack(map, state.subarea);
  // +cap de mobs: Fate Keeper A4 + passiva Void Awareness (rumo ao teto ~24)
  const extra = (state.ascensions >= 4 ? FATE.a4MobBonus : 0) + passiveMobBonus(state);
  for (let i = 0; i < extra; i++) pack.push(spawnMob(map, state.subarea));
  // Redesign 14/jun: SEM Guardião nas sub-áreas 1..N-1; só a ÚLTIMA tem boss
  // (o boss final do mapa). O threshold de kills ainda é o muro que invoca o boss.
  if (state.subarea === map.subareaCount && state.killsInSubarea >= map.bossKillThreshold) {
    pack[0] = spawnBoss(map, state.subarea);
  }
  // Dificuldade (§8): ×HP e ×dano nos mobs da onda
  const d = effectiveDifficulty(state);
  if (d.hpMult !== 1) {
    for (const m of pack) { m.hpMax *= d.hpMult; m.hp = m.hpMax; m.dmg *= d.hpMult; }
  }
  return pack;
}

// Reinicia a onda (boot, troca de subárea, respawn) — zera a contagem de ondas.
export function resetPack(state) {
  state.wave = 1;
  state.enemies = makeWave(state);
}

// Próxima onda (após limpar a atual) — incrementa o contador.
function nextWave(state) {
  state.wave += 1;
  state.enemies = makeWave(state);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss && m.hp > 0);
}

// Redesign 14/jun: a progressão entre sub-áreas é GATE POR NÍVEL (sem Guardião).
// A sub-área n (n≥2) libera quando o nível do jogador alcança o início da sua
// faixa de level (= subareaLevelRange(map, n).lo). Sub-área 1 sempre aberta.
export function subareaUnlockLevel(map, n) {
  if (n <= 1) return 0;
  return Math.max(1, Math.round(subareaLevelRange(map, n).lo));
}

// Avança o high-water de sub-áreas liberadas conforme o nível sobe. unlockedSubarea
// é persistente (não recua na Convergence, mesmo que runLevel zere).
function updateUnlockByLevel(state) {
  const map = getCurrentMap(state);
  const lvl = runLevel(state);
  let u = state.unlockedSubarea || 1;
  while (u < map.subareaCount && lvl >= subareaUnlockLevel(map, u + 1)) u += 1;
  if (u !== state.unlockedSubarea) state.unlockedSubarea = u;
}

export function combatTick(state, dt) {
  const player = state.player;
  const hpMax = playerHpMax(state);

  // --- Morto: só conta o timer de respawn ---
  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.dead = false;
      player.hp = hpMax; // HP cheio, sem perdas
      player.attackTimer = 0;
      resetPack(state);
    }
    return;
  }

  // --- Ataques do jogador (só com alvo VIVO; senão pausa — não desperdiça golpes
  //     nem acumula timer durante o beat de troca de onda). ---
  const hasLive = state.enemies.some((m) => m.hp > 0);
  if (hasLive) {
    const interval = 1 / currentAPS(state);
    player.attackTimer += dt;
    while (player.attackTimer >= interval) {
      player.attackTimer -= interval;
      playerAttack(state, hpMax);
    }
  }

  // --- Onda limpa (todos mortos) → próxima onda APÓS um beat. Sem o beat, o novo
  //     mob substituía na hora o que ainda estava morrendo (projétil no ar) → parecia
  //     que "o mob virou outro". O beat deixa a morte animar e a posição esvaziar. ---
  if (state.enemies.length > 0 && !hasLive) {
    state.waveClearT = (state.waveClearT || 0) + dt;
    if (state.waveClearT >= COMBAT.waveClearDelay) {
      state.waveClearT = 0;
      nextWave(state);
    }
  } else {
    state.waveClearT = 0;
  }

  // --- Dano só dos mobs VIVOS (mortos ficam apagados até a onda virar) ---
  // Mitigação por razão/armadura (§4): dano_recebido = Σdano² / (defesa + Σdano).
  // Sem defesa (early, def=0) → Σdano²/Σdano = Σdano = comportamento original.
  // Camada % à parte (postArmorDR) aplicada DEPOIS da armadura.
  const packDps = state.enemies.reduce((sum, m) => sum + (m.hp > 0 ? m.dmg : 0), 0);
  const def = playerDefesa(state);
  const armored = packDps > 0 ? (packDps * packDps) / (def + packDps) : 0;
  player.hp -= armored * postArmorDR(state) * dt;

  // --- Regen contínuo de 1% HP máx/s (× afixo Regen do gear × #11 Résistance) ---
  player.hp = Math.min(hpMax, player.hp + hpMax * COMBAT.regenPerSec * regenFactor(state) * dt);

  // --- Drip de Éclats (§10): renda passiva após a A1, escala com o frontier ---
  // §8 dificuldade ×rewardMult · #13 du Vide amplia a recompensa · #12 du Temps Brisé = todos os Éclats
  const drip = eclatsDripPerSec(state)
    * effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireEclatsAllMult(state);
  if (drip > 0) state.eclats = Math.min(NUMBER_CAP, state.eclats + drip * dt);

  // Gate por nível: libera sub-áreas conforme o nível sobe (sem Guardião)
  updateUnlockByLevel(state);

  // --- Morte: respawna na MESMA área (sem recuar). O jogador volta de área só
  //     se quiser, pelas setas de navegação. ---
  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = COMBAT.deathRespawnSeconds;
    state.killsInSubarea = 0; // boss some; o muro exige farmar de novo
    state.wave = 1;
    state.enemies = [];
  }
}

// Quantos mobs um ataque atinge. BASE = 1 (single-target — âncora "1 kill/ataque").
// O CLEAVE/AoE é DESBLOQUEÁVEL (passiva/mecânica); quando ligado, retorna >1 e o
// ataque limpa vários alvos. ⏳ TODO(CP passivas): ler o unlock real (qual passiva /
// como escala — ex.: +1 alvo por nível, ou "todos"). Hoje sempre 1 = base correto.
function cleaveTargets() {
  return 1;
}

// Um ataque: atinge os primeiros `cleaveTargets()` mobs vivos da onda (frente → trás).
// BASE = 1 (single-target). Cada mob atingido morre quando seu HP zera. SEM respawn —
// os mortos ficam na cena (apagados) até a onda inteira ser limpa.
function playerAttack(state, hpMax) {
  // Crit ⏳ provisório (GDD §16.6): rola UMA vez por ataque; vale pro golpe inteiro
  // (se/quando o cleave atingir vários, todos herdam o mesmo crit).
  const isCrit = Math.random() < critChance(state);
  const base = damagePerHit(state) * (isCrit ? critDamageMult(state) : 1);

  let remaining = cleaveTargets(); // BASE 1; >1 quando o AoE estiver desbloqueado
  for (const target of state.enemies) {
    if (remaining <= 0) break;
    if (target.hp <= 0) continue; // pula mortos (mantém a ordem frente → trás)
    remaining -= 1;
    // Dano em boss (§13/§11): afixo bossDmg do gear × #7 de la Chute — só no boss
    const bossMult = target.isBoss ? gearBossDmgMult(state) * memoireBossDmgMult(state) : 1;
    const raw = base * bossMult;
    // Defesa de INIMIGOS (§4, razão virada): hit = raw² / (def_inimigo + raw).
    // Early (def_inimigo=0) → hit = raw = comportamento original.
    const edef = enemyDefesa(state, target);
    const hit = edef > 0 ? (raw * raw) / (edef + raw) : raw;
    target.hp -= hit;
    // Fila dos números flutuantes (a UI consome; teto evita acúmulo em background)
    if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
    if (target.hp <= 0) {
      awardKill(state, target);
      // Regen on-kill: 2% do HP máx por kill (× afixo Regen × #11 Résistance)
      state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill * regenFactor(state));
      if (target.isBoss) onBossKill(state);
      else state.killsInSubarea += 1;
    }
  }
}

// Derrota do boss: abre o gate da próxima subárea e reinicia o ciclo
// (loop recorrente de recompensa — o boss volta a cada threshold).
function onBossKill(state) {
  const map = getCurrentMap(state);
  state.bossDefeated[state.subarea - 1] = true;
  state.unlockedSubarea = Math.max(state.unlockedSubarea, Math.min(map.subareaCount, state.subarea + 1));
  state.killsInSubarea = 0;
  // O Despertar NÃO depende mais de boss (combate single-boss 14/jun): é a checklist
  // de ascension.js (Nível+Material T1+Nitzotzot+Vestiges), ato do jogador na tela.
}

// Viagem entre mapas já alcançados (id ≤ maxMap). Guarda o progresso do mapa
// atual em mapProgress e restaura o do destino; mapas anteriores à fronteira
// já foram concluídos → entram com tudo liberado por padrão.
export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.mapProgress[state.map] = {
    subarea: state.subarea,
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
  };
  state.map = dest;
  const map = getCurrentMap(state);
  const saved = state.mapProgress[dest];
  const cleared = dest < state.maxMap; // mapa já concluído (a fronteira passou dele)
  state.unlockedSubarea = saved ? saved.unlockedSubarea : (cleared ? map.subareaCount : 1);
  // CP-2: bossDefeated com o comprimento do mapa destino (normaliza saves de 5 → 8)
  state.bossDefeated = Array.from({ length: map.subareaCount },
    (_, i) => (saved ? !!(saved.bossDefeated && saved.bossDefeated[i]) : cleared));
  state.subarea = Math.min(saved ? saved.subarea : 1, state.unlockedSubarea);
  state.killsInSubarea = saved ? saved.killsInSubarea : 0;
  state.bestSubareaRun = Math.max(state.bestSubareaRun, state.subarea);
  if (!state.player.dead) resetPack(state);
  return true;
}

// Navegação entre subáreas, respeitando o gate (boss abre a próxima)
export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

// Entra direto numa subárea n (1-indexada), respeitando o gate da maior
// desbloqueada. Usado pela tela de Mapa (U-3) e pelas setas do Combate.
export function enterSubarea(state, n) {
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  state.killsInSubarea = 0; // threshold conta kills na subárea atual
  state.bestSubareaRun = Math.max(state.bestSubareaRun, next); // pontos da run (§6)
  if (!state.player.dead) resetPack(state);
}
```

<a id="src-game-economy-js"></a>

## `src/game/economy.js`

```js
// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, LEVEL, NUMBER_CAP, BOSS_LUMEN_MULT, VESTIGES, CRAFT, NITZOTZ, mapMaterialTier } from '../data/constants.js';
import { convMult, runLevel } from './stats.js';
import { gearLumensMult, gearXpMult, gearMaterialDropMult } from './gear.js';
import { passiveEcoMult, passiveMaterialMult } from './passives.js';
import { memoireLumensMult, memoireXpMult, memoireVestigeMult, memoireMateriaisMult, memoireDiffRewardMult } from './memoires.js';
import { effectiveDifficulty } from './difficulty.js';
import { getCurrentMap, subareaLevelRange, hpForLevel } from './enemies.js';

// Multiplicador de YIELD de material (§13B): DIFICULDADE ×rewardMult (×3/×10/×30) ×
//   #13 du Vide (recompensa de dificuldade) × #5 du Façonnage (+% materiais, aditivo, sem motor ×).
// ⛓️ hooks reservados (= 1): Vestige Pull (passiva) · afixo Materiais do gear (⏳ amortecer a curva).
function materialYieldMult(state) {
  return effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireMateriaisMult(state) * gearMaterialDropMult(state)  // afixo Materiais (amortecido, Bloco 3)
    * passiveMaterialMult(state); // Vestige Pull (passiva, amortecido, Bloco 4)
}

// §13B: drop de materiais no kill. 1% do tier do MAPA + 0.1% do tier seguinte; boss = chunk garantido.
function awardMaterials(state, mob) {
  const tier = mapMaterialTier(state.map);
  const y = materialYieldMult(state);
  if (Math.random() < CRAFT.dropChance) state.materiais[tier] += y;
  if (tier < 3 && Math.random() < CRAFT.nextTierChance) state.materiais[tier + 1] += y;
  if (mob.isBoss) state.materiais[tier] += CRAFT.bossChunk * y; // Guardião/final: chunk garantido
}

// §8 redesign: drop de Nitzotzot (Oferenda do Despertar). Só nas Sub-áreas 3+
// (a região do Guardião); chunk garantido em boss. Acumula no mapa do tier.
function awardNitzotz(state, mob) {
  if (state.subarea < 3) return;
  if (mob.isBoss) state.nitzotzot += NITZOTZ.bossChunk;
  else if (Math.random() < NITZOTZ.dropChance) state.nitzotzot += 1;
}

// §7: vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa)
// Map 1 (índice 0): [1, 1, 2, 2, 3] nas Subs 1-5
export function vestigesPerKill(state) {
  return Math.ceil(state.subarea * 0.5) * 3 ** (state.map - 1);
}

// Estimativa de ganho POR MOB numa sub-área (para o painel do mapa). Usa o mob
// de nível "médio" da área (média geométrica do range) e os multiplicadores
// atuais do jogador (conv, gear, passivas, mémoires), espelhando awardKill.
// Materiais é drop-based: devolvemos a chance e o yield por drop.
export function perKillEstimate(state, subarea) {
  const map = getCurrentMap(state);
  const { lo, hi } = subareaLevelRange(map, subarea);
  const level = Math.max(1, Math.round(Math.sqrt(lo * hi)));
  const hp = hpForLevel(map, level);
  const eco = passiveEcoMult(state);
  const cm = convMult(state);
  const lumens = (hp * ECONOMY.goldRatio + ECONOMY.lumensFloor + runLevel(state) * LEVEL.goldPerLevel)
    * cm * gearLumensMult(state) * eco * memoireLumensMult(state);
  const vestiges = Math.ceil(subarea * 0.5) * 3 ** (map.id - 1) * memoireVestigeMult(state);
  const tier = mapMaterialTier(state.map);
  const matPerDrop = materialYieldMult(state);
  return { lumens, vestiges, tier, matChance: CRAFT.dropChance, matPerDrop };
}

export function awardKill(state, mob) {
  // §12: o ×5 de boss só se aplica a Lumens; o XP já escala pelo HP ×15
  const bossMult = mob.isBoss ? BOSS_LUMEN_MULT : 1;
  const eco = passiveEcoMult(state); // §7 Vestige tree (Lumens/XP) — provisório
  const cm = convMult(state);        // CP-3: Convergence +15% em Lumens e XP (sem frt/wis)
  // Lumens base = HP×goldRatio + PISO fixo + nível×goldPerLevel. O piso (✅ Map 1) garante
  // que os primeiros níveis do gear sejam compráveis cedo (mob de HP baixo rende pouco).
  const lumBase = mob.hpMax * ECONOMY.goldRatio + ECONOMY.lumensFloor + runLevel(state) * LEVEL.goldPerLevel;
  state.lumens = Math.min(NUMBER_CAP, state.lumens + lumBase * cm * bossMult * gearLumensMult(state) * eco * memoireLumensMult(state));
  const xp = mob.hpMax * ECONOMY.xpRatio * cm * gearXpMult(state) * eco * memoireXpMult(state);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + xp); // vida (level display)
  state.xpRun = Math.min(NUMBER_CAP, state.xpRun + xp);     // run (parede de Convergence)
  // §7: Vestiges nunca resetam; boss paga ×10
  const vest = vestigesPerKill(state) * (mob.isBoss ? VESTIGES.bossMult : 1) * memoireVestigeMult(state);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + vest);
  awardMaterials(state, mob); // §13B (Passo 4)
  awardNitzotz(state, mob);   // §8 redesign (Oferenda do Despertar)
  state.killsTotal += 1;
}
```

<a id="src-game-convergence-js"></a>

## `src/game/convergence.js`

```js
// Convergence — redesign (calibrado Map 1, 14/jun). SEM reset de mapa. Gate por NÍVEL;
// dá +15% ADITIVO permanente (convMult vive em stats.js: dano/HP/XP/Lumens). É um
// ACELERADOR (~×2 ao fim do Map 1), não um motor. O botão RESETA só o nível da RUN
// (xpRun→0); o GEAR é MANTIDO (sem strand). NÃO reseta: mapa/posição, Lumens, Vestiges.

import { CONVERGENCE } from '../data/constants.js';
import { runLevel, playerHpMax } from './stats.js';
import { resetPack } from './combat.js';

// Nível-alvo da próxima Convergence (sobe a cada converge). 1ª = nível 40.
export function convGateLevel(convergences) {
  return Math.round(CONVERGENCE.gateLevelBase * CONVERGENCE.gateLevelGrowth ** convergences);
}

export function canConverge(state) {
  return runLevel(state) >= convGateLevel(state.convergences);
}

// Progresso rumo ao gate (0..1) — pra UI.
export function convergeProgress(state) {
  return Math.min(1, runLevel(state) / convGateLevel(state.convergences));
}

export function doConverge(state) {
  if (!canConverge(state)) return false;

  state.convergences += 1;
  // Reset (14/jun, ajuste Willian): o nível da run (xpRun) E os Lumens. O GEAR é
  // MANTIDO (sem strand) — Convergence = acelerador ×: +15% permanente sem perder o gear.
  state.xpRun = 0;
  state.lumens = 0;
  // NÃO reseta: gear (nível+raridade), map/subarea/unlockedSubarea/bossDefeated, Vestiges.

  // Renasce cheio na posição atual; reinicia a onda (você está mais fraco agora).
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
```

<a id="src-game-ascension-js"></a>

## `src/game/ascension.js`

```js
// Motor de Ascension — GDD §8. Marco por mapa: derrotar o boss final + custo
// em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank, próximo mapa.
// A1 também libera o drip de Éclats (§10). Persiste sempre. Só Map 1 existe
// no MVP → só A1 é completável; A2-A5 exigem Maps 2-5.

import { ASCENSIONS, ECLATS_DRIP, MAPS, SEEKER_RANKS, DESPERTAR, DESPERTAR_REQ,
  DESPERTAR_GATE_LEVEL, DESPERTAR_MAT_T1 } from '../data/constants.js';
import { hpForLevel, subareaLevelRange, getCurrentMap } from './enemies.js';
import { runLevel } from './stats.js';
import { memoireEclatsAllMult } from './memoires.js';

// Próximo marco de Ascension (ou null se já no fim)
export const nextAscension = (state) =>
  state.ascensions < ASCENSIONS.length ? ASCENSIONS[state.ascensions] : null;

// Multiplicador acumulado de Ascension (aplica a dano E HP — §8)
export function ascMult(state) {
  let m = 1;
  for (let i = 0; i < state.ascensions; i++) m *= ASCENSIONS[i].mult;
  return m;
}

// Requisito do próximo marco: boss final do mapa correspondente derrotado.
// (state.map só é 1 no MVP; bossDefeated é do mapa atual.)
export function reqMet(state) {
  const a = nextAscension(state);
  if (!a) return false;
  return a.mapBoss === state.map && state.bossDefeated[state.bossDefeated.length - 1];
}

export function canAscend(state) {
  const a = nextAscension(state);
  return !!a && reqMet(state) && state.vestiges >= a.cost;
}

export function doAscend(state) {
  if (!canAscend(state)) return false;
  const a = nextAscension(state);
  state.vestiges -= a.cost;
  state.ascensions += 1;
  state.eclats += a.eclats * memoireEclatsAllMult(state); // bolsa da cerimônia (§10) × #12 (todos os Éclats)
  // Avança para o próximo mapa (§8) e reinicia o progresso do mapa. A onda é
  // recriada pelo chamador (resetPack) — evita ciclo de import com combat.js.
  if (a.mapBoss < MAPS.length) {
    state.map = a.mapBoss + 1;
    state.maxMap = Math.max(state.maxMap || 1, state.map); // fronteira avança
    delete state.mapProgress[state.map]; // mapa novo começa zerado
    state.subarea = 1;
    state.unlockedSubarea = 1;
    state.bossDefeated = state.bossDefeated.map(() => false);
    state.killsInSubarea = 0;
  }
  return true;
}

// ───── Despertar / Tier (§8, Passo 7) — DESACOPLADO das ascensions ─────

// Índice de tier = nº de Despertares (0..4). Tier T1..T5 = SEEKER_RANKS[idx].
export const despertarTier = (state) => Math.min(SEEKER_RANKS.length - 1, state.despertares || 0);

// Rank/tier atual da Ordre — lê o tier de DESPERTAR (não as ascensions).
export const currentRank = (state) => SEEKER_RANKS[despertarTier(state)];

// ×poder permanente do Despertar (dano E HP): mult^despertares.
export const despertarMult = (state) => DESPERTAR.mult ** (state.despertares || 0);

// ── Gate do Despertar em 3 camadas (§8 redesign, 13/jun) — ATO DO JOGADOR ──
// Não dispara mais sozinho: vencer o Guardião só destrava a Prova.

// Tier alvo do próximo despertar (despertares+1), ou null se já é Lumière (T5).
export function despertarTarget(state) {
  const t = (state.despertares || 0) + 1;
  return t <= SEEKER_RANKS.length - 1 ? t : null;
}

// Requisito (Oferenda Nitzotzot + Tributo Vestiges) do próximo despertar, ou null.
export function despertarReq(state) {
  const t = despertarTarget(state);
  return t == null ? null : DESPERTAR_REQ[t];
}

// CHECKLIST de requisitos do próximo despertar (redesign 14/jun): lista de gates,
// cada um { key, label, have, need, ok }. Vazia quando já é Lumière (T5). A Prova do
// Guardião da Sub 3 saiu (combate single-boss); entram Nível + Material T1. A UI itera
// esta lista; `canDespertar` = todos os gates ok (lógica E).
export function despertarRequirements(state) {
  const t = despertarTarget(state);
  if (t == null) return [];
  const req = despertarReq(state) || { nitzotz: Infinity, vestiges: Infinity };
  const haveMatT1 = (state.materiais && state.materiais[0]) || 0; // T1 = materiais[0] (mesmo do upgrade de gear)
  const gates = [
    { key: 'level',    label: 'Level',       have: runLevel(state),                  need: DESPERTAR_GATE_LEVEL[t] },
    { key: 'material', label: 'Material T1', have: haveMatT1,                         need: DESPERTAR_MAT_T1[t] },
    { key: 'nitzotz',  label: 'Nitzotzot',   have: Math.floor(state.nitzotzot || 0), need: req.nitzotz },
    { key: 'vestiges', label: 'Vestiges',    have: Math.floor(state.vestiges || 0),  need: req.vestiges },
  ];
  return gates.map((g) => ({ ...g, ok: g.have >= g.need }));
}

// Pode despertar? Toda a checklist atendida (lógica E).
export function canDespertar(state) {
  const reqs = despertarRequirements(state);
  return reqs.length > 0 && reqs.every((g) => g.ok);
}

// Executa o despertar (gasta Material T1 + Nitzotzot + Vestiges, sobe o tier).
// Idempotente/seguro: canDespertar barra antes (material/nitzotz/vestiges nunca negativam).
export function doDespertar(state) {
  if (!canDespertar(state)) return false;
  const req = despertarReq(state);
  const t = despertarTarget(state);
  state.materiais[0] -= DESPERTAR_MAT_T1[t]; // T1 = materiais[0] (mesmo pool do upgrade de raridade do gear)
  state.nitzotzot -= req.nitzotz;
  state.vestiges -= req.vestiges;
  state.despertares = t;
  return true;
}

// §10 — drip de Éclats por segundo (0 antes da A1). Escala com a HP do frontier
// (boss da subárea mais funda desbloqueada do mapa atual).
export function eclatsDripPerSec(state) {
  if (state.ascensions < 1) return 0;
  const map = getCurrentMap(state);
  const frontierLevel = subareaLevelRange(map, state.unlockedSubarea).hi;
  const hpFrontier = hpForLevel(map, frontierLevel);
  return (ECLATS_DRIP.coef * hpFrontier ** ECLATS_DRIP.exp) / 3600;
}
```

<a id="src-game-gear-js"></a>

## `src/game/gear.js`

```js
// Motor de Gear — GDD §13 / §10.5.5 (Passo 3 do wiring).
// 6 peças fixas, cada uma com nível (Lumens) e raridade. Cada peça tem 1 afixo
// PRIMÁRIO inerente + SECUNDÁRIOS que a raridade destrava em ordem (determinístico).
// Modelo de valor calibrado (Camada 3): linear × motor exponencial (Luminous+);
// secundário = primário^0.30 (30% das décadas). Cap de nível da raridade topo sobe
// +capPerAsc por Ascension (motor sem-teto). Persiste sempre (não reseta).

import { GEAR, GEAR_RARITIES, CRAFT } from '../data/constants.js';

const maxRarity = GEAR_RARITIES.length - 1;

// ───── Modelo de valor de um afixo ─────

// multiplicador do afixo PRIMÁRIO = 2 camadas LINEARES que multiplicam (modelo Gaiadon):
//   Bonus% = (1 + nível × bonusRate × rarityMult) · ×Multiplier = (1 + nível × multRate × rarityMult)
// Lineares → o produto cresce ~nível² (polinomial); com a base flat (Primary) → ~nível³.
export function primaryMult(level, rarity) {
  const rm = GEAR.rarityMult[rarity];
  const bonus = 1 + level * GEAR.bonusRate * rm;
  const mult = 1 + level * GEAR.multRate * rm;
  return bonus * mult;
}
// afixo SECUNDÁRIO multiplicativo = primário^0.30 (30% das décadas — gear.mjs corrigido)
export const secondaryMult = (level, rarity) => primaryMult(level, rarity) ** GEAR.secondaryExp;

// crit chance (afixo plano): nível × critPerLevel × rarityMult
export const critOf = (level, rarity) => level * GEAR.critPerLevel * GEAR.rarityMult[rarity];
// crit damage (afixo plano, bônus sobre a base): nível × critDmgPerLevel × rarityMult
export const critDmgOf = (level, rarity) => level * GEAR.critDmgPerLevel * GEAR.rarityMult[rarity];

// Secundários ATIVOS de uma peça conforme a raridade. ✅ 14/jun: TODA peça comum
// (Faded) tem 2 afixos. Peças cujo PRIMÁRIO tem flat (dmg/hp/defesa/aps) já fecham
// 2 com flat + % → 0 secundário no Faded. Peças sem flat no primário (lumens=anel,
// crit=grasp) ganham 1 secundário já no Faded pra fechar 2. Cada raridade acima
// destrava +1 secundário, capado pelo tamanho da lista.
export function activeSecondaries(def, rarity) {
  const primaryHasFlat = (GEAR.flatPerLevel[def.primary] || 0) > 0;
  return def.secondary.slice(0, rarity + (primaryHasFlat ? 0 : 1));
}

// ───── Agregação por tipo de afixo ─────

// Produto dos afixos MULTIPLICATIVOS de um tipo (primário + secundários ativos a 30%)
function gearMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= primaryMult(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) m *= secondaryMult(p.level, p.rarity);
    }
  }
  return m;
}

export const gearDamageMult   = (s) => gearMultBy(s, 'dmg');
export const gearHpMult       = (s) => gearMultBy(s, 'hp');
export const gearDefesaMult   = (s) => gearMultBy(s, 'defesa');   // consumido na mitigação (Passo 2)
export const gearApsMult      = (s) => gearMultBy(s, 'aps');      // ⛓️ consumidor no apsCap (passo futuro)
export const gearRegenMult    = (s) => gearMultBy(s, 'regen');    // ⛓️ consumidor no regen (passo futuro)
export const gearBossDmgMult  = (s) => gearMultBy(s, 'bossDmg');  // ⛓️ consumidor no hit em boss (passo futuro)

// ── Afixo FLAT por nível (CP-4): soma flat à BASE do stat (não multiplica).
//    Primário = valor cheio; secundário = × secondaryExp. Escala pela raridade.
function gearFlatBy(state, type) {
  const per = GEAR.flatPerLevel[type] || 0;
  if (!per) return 0;
  let flat = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    const rm = GEAR.rarityMult[p.rarity];
    if (def.primary === type) flat += p.level * per * rm;
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) flat += p.level * per * rm * GEAR.secondaryExp;
    }
  }
  return flat;
}
export const gearDamageFlat = (s) => gearFlatBy(s, 'dmg'); // soma na base de dano
export const gearHpFlat     = (s) => gearFlatBy(s, 'hp');  // soma na base de HP
export const gearApsFlat    = (s) => gearFlatBy(s, 'aps'); // soma na base de APS (capado depois)
export const gearDefesaFlat = (s) => gearFlatBy(s, 'defesa'); // soma na base de Defesa

// ── Afixos de FARM (Lumens/XP/Materiais) — REGRA Bloco 3: só flat/% ADITIVO, NUNCA o motor ×.
// Valor LINEAR do afixo (sem o 1.0039^L): mantém o farm como bônus modesto, não motor de décadas.
function farmLinear(level, rarity, isSec) {
  return 1 + level * GEAR.affixPctRate * GEAR.rarityMult[rarity] * (isSec ? GEAR.secondaryExp : 1);
}
function farmMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= farmLinear(p.level, p.rarity, false);
    for (const sec of activeSecondaries(def, p.rarity)) if (sec === type) m *= farmLinear(p.level, p.rarity, true);
  }
  return m;
}
export const gearLumensMult = (s) => farmMultBy(s, 'lumens'); // Farm: linear (sem motor)
export const gearXpMult     = (s) => farmMultBy(s, 'xp');     // Farm: linear (sem motor)
// Materiais → DROP: AMORTECIDO por log (o bruto linear ~×70 viraria pacing absurdo). yield = 1 + 0.5×log10(bruto).
// Justificativa: log transforma o crescimento do afixo em bônus ADITIVO limitado; 0.5 lança ≈ ×2 no endgame
// (linear bruto ×70 → log10=1.85 → ×1.9), preservando o pacing de ~27 min/tier (drop base 1% intocado).
export const gearMaterialDropMult = (s) => 1 + 0.5 * Math.log10(Math.max(1, farmMultBy(s, 'materiais')));

// Crit chance: soma plana (primário Grasp + secundário Resonance a 30%)
export function gearCritAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'crit') a += critOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'crit') a += critOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a;
}

// Crit damage: bônus plano sobre a base ×2 (só secundário — Edge/Grasp), a 30% como secundário.
export function gearCritDmgAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'critDmg') a += critDmgOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'critDmg') a += critDmgOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a; // ⛓️ consumidor em critDamageMult (wiring quando o Crit fechar — §16.6)
}

// ───── Custos e gates ─────

// Cap de nível da peça: a raridade TOPO (Converged) ganha +capPerAsc por Ascension (sem-teto §13)
export function levelCapFor(piece, state) {
  const base = GEAR.levelCap[piece.rarity];
  return piece.rarity === maxRarity ? base + (state.ascensions || 0) * GEAR.capPerAsc : base;
}
export const atLevelCap = (piece, state) => piece.level >= levelCapFor(piece, state);

// CP-4: custo de 1 nível LINEAR (suporta milhões de níveis; expo estouraria).
// cost(L) = base × (L+1) × costMult[raridade]
export function levelCost(piece) {
  return GEAR.levelCostBase * (piece.level + 1) * GEAR.costMult[piece.rarity];
}

// Tier de material que paga a raridade atual→próxima (= índice da raridade atual: T1 paga 0→1)
export const rarityUpTier = (piece) => piece.rarity;
// custo de raridade = MATERIAIS do tier (não mais Lumens, §13B); Infinity se já no topo.
export function rarityUpCost(piece) {
  return piece.rarity >= maxRarity ? Infinity : CRAFT.rarityUpMaterial;
}

// Menor raridade entre TODAS as peças (piso do set, pro gate lockstep).
function minSetRarity(state) {
  let m = Infinity;
  for (const def of GEAR.pieces) m = Math.min(m, state.gear[def.key].rarity);
  return m;
}

// Rarity-up gateado por: (1) MATERIAL do tier + (2) LOCKSTEP — uma peça só sobe pra
// R+1 se TODAS já estão ≥ R (✅ 14/jun: não passa pra Luminous enquanto nem todas
// estiverem Kindled). Uma peça por vez, na ordem que o jogador quiser, dentro do piso.
export function canRarityUp(state, key) {
  const p = state.gear[key];
  return p.rarity < maxRarity
    && minSetRarity(state) >= p.rarity              // a peça está no piso do set
    && state.materiais[rarityUpTier(p)] >= CRAFT.rarityUpMaterial;
}

// ───── Ações (gastam Lumens) ─────

export function buyLevel(state, key) {
  const p = state.gear[key];
  if (atLevelCap(p, state)) return false;
  const cost = levelCost(p);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  p.level += 1;
  return true;
}

// Bulk-buy FECHADO (CP-4): compra o máximo de níveis que o orçamento permite — custo
// linear → soma quadrática → resolve k em O(1). Suporta milhões de níveis. n grande = MAX.
export function buyLevels(state, key, n) {
  const p = state.gear[key];
  const cap = levelCapFor(p, state);
  const room = cap - p.level;
  if (room <= 0) return 0;
  const K = GEAR.levelCostBase * GEAR.costMult[p.rarity]; // cost(L) = K × (L+1)
  const c = p.level;
  // máx k pelo orçamento: K/2 × [(c+k)(c+k+1) − c(c+1)] ≤ lumens → quadrática em (c+k)
  const disc = Math.sqrt(1 + 4 * (c * (c + 1) + 2 * state.lumens / K));
  let k = Math.min(n, room, Math.max(0, Math.floor((disc - 1) / 2) - c));
  if (k <= 0) return buyLevel(state, key) ? 1 : 0; // cobre arredondamento (tenta 1)
  let cost = (K / 2) * ((c + k) * (c + k + 1) - c * (c + 1));
  while (cost > state.lumens && k > 0) { k -= 1; cost = (K / 2) * ((c + k) * (c + k + 1) - c * (c + 1)); }
  if (k <= 0) return 0;
  state.lumens -= cost;
  p.level += k;
  return k;
}

export function doRarityUp(state, key) {
  if (!canRarityUp(state, key)) return false;
  const p = state.gear[key];
  state.materiais[rarityUpTier(p)] -= CRAFT.rarityUpMaterial; // paga em materiais do tier
  p.rarity += 1; // mantém o nível: segue subindo até o cap maior da nova raridade
  return true;
}

// ───── Refino de materiais (§13B): 12:1, SÓ pra cima ─────
export const canRefino = (state, fromTier) =>
  fromTier >= 0 && fromTier < 3 && state.materiais[fromTier] >= CRAFT.refinoRatio;

export function doRefino(state, fromTier) {
  if (!canRefino(state, fromTier)) return false;
  state.materiais[fromTier] -= CRAFT.refinoRatio;
  state.materiais[fromTier + 1] += 1;
  return true;
}
```

<a id="src-game-passives-js"></a>

## `src/game/passives.js`

```js
// Motor de Passivas — GDD §7. Economia canônica; efeitos ⏳ PROVISÓRIOS
// (ver PASSIVES em constants.js). 3 árvores × 15 (3 grupos de 5).
// Moeda = Vestiges. Desbloqueia na 1ª Convergence. Persiste sempre.
//
// Estrutura de custo (§7):
//  - desbloqueio (level 0→1) = unlockLadder[posição] × groupMult[grupo]
//  - evolução (level L→L+1, L≥1) = desbloqueio × 0.3 × 1.30^(L-1)
//  - gate: maximizar os 5 do grupo anterior libera o próximo grupo.

import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';

const GROUP_SIZE = 5;
const groupOf = (i) => Math.floor(i / GROUP_SIZE);
const posOf = (i) => i % GROUP_SIZE;

// Sistema todo só abre na 1ª Convergence (momento de lore §6)
export const passivesUnlocked = (state) => state.convergences >= 1;

// Custo de desbloqueio de uma passiva (índice i na árvore)
export function unlockCost(i) {
  return PASSIVES.unlockLadder[posOf(i)] * PASSIVES.groupMult[groupOf(i)];
}

// Custo do próximo nível de uma passiva (Vestiges)
export function nextCost(state, tree, i) {
  const level = state.passives[tree][i];
  if (level === 0) return unlockCost(i);                 // desbloqueio
  return unlockCost(i) * PASSIVES.evoFactor * PASSIVES.evoRamp ** (level - 1); // evolução
}

export const isMax = (state, tree, i) => state.passives[tree][i] >= PASSIVES.maxLevel;

// Um grupo (0..2) está liberado se for o 1º ou se todos os 5 do anterior estão no máximo
export function groupUnlocked(state, tree, group) {
  if (group === 0) return true;
  const arr = state.passives[tree];
  const prev = group - 1;
  for (let p = 0; p < GROUP_SIZE; p++) {
    if (arr[prev * GROUP_SIZE + p] < PASSIVES.maxLevel) return false;
  }
  return true;
}

export function canBuy(state, tree, i) {
  if (!passivesUnlocked(state)) return false;
  if (isMax(state, tree, i)) return false;
  if (!groupUnlocked(state, tree, groupOf(i))) return false;
  return state.vestiges >= nextCost(state, tree, i);
}

// Compra/evolui uma passiva (gasta Vestiges)
export function buyPassive(state, tree, i) {
  if (!canBuy(state, tree, i)) return false;
  state.vestiges -= nextCost(state, tree, i);
  state.passives[tree][i] += 1;
  return true;
}

// ───── Efeitos individuais (Bloco 4, esquema Camada 5) ─────
// Multiplicador da PRIMÁRIA de uma árvore (Éclat→dano · Fracture→HP · Vestige→economia):
//   (1 + Σ %aditivo dos default) × Π(motores ×1.52^nível). Levers ficam FORA (efeito especial).
function treeMult(state, tree) {
  const arr = state.passives[tree];
  let add = 0, eng = 1;
  PASSIVES.trees[tree].list.forEach(([, art], i) => {
    const lv = arr[i];
    if (lv === 0) return;
    if (PASSIVES.levers[art]) return;                                  // lever: fora do mult
    if (PASSIVES.engines[tree].includes(art)) eng *= PASSIVES.engineMult ** lv; // motor ×1.52/nível
    else add += PASSIVES.groupAddPct[groupOf(i)] * lv;                 // default: % do grupo
  });
  return (1 + add) * eng;
}
export const passiveDmgMult = (s) => treeMult(s, 'eclat');
export const passiveHpMult  = (s) => treeMult(s, 'fracture');
export const passiveEcoMult = (s) => treeMult(s, 'vestige');

// Nível de uma passiva pela chave de arte (busca nas 3 árvores)
function leverLevel(state, art) {
  for (const tree of PASSIVE_TREES) {
    const idx = PASSIVES.trees[tree].list.findIndex(([, a]) => a === art);
    if (idx >= 0) return state.passives[tree][idx];
  }
  return 0;
}

// ── Alavancas funcionais (efeitos especiais, consumidos pelos sistemas reais) ──
const L = PASSIVES.lever;
export const passiveCritAdd      = (s) => leverLevel(s, 'e_luminal_edge') * L.critPerLevel;   // crit chance
export const passiveApsMult      = (s) => 1 + leverLevel(s, 'f_fracture_pulse') * L.apsPerLevel; // APS (Bloco 6)
export const passiveMobBonus     = (s) => Math.floor(leverLevel(s, 'f_void_awareness') * L.mobPerLevel); // +mobs
// Vestige Pull → ×drop de material (FARM: amortecido por log, nunca motor)
export const passiveMaterialMult = (s) => 1 + Math.log10(1 + leverLevel(s, 'v_vestige_pull') * L.materialPerLevel);
// Void Piercing (penetra) / Weakened Void (reduz) a defesa de INIMIGOS — consome o hook do Passo 2
export const passiveEnemyPen     = (s) => leverLevel(s, 'e_void_piercing') * L.penPerLevel;   // fração penetrada
export const passiveEnemyReduce  = (s) => leverLevel(s, 'f_weakened_void') * L.reducePerLevel; // fração reduzida

// Contadores para a UI (quantas desbloqueadas / maximizadas por árvore)
export function treeProgress(state, tree) {
  const arr = state.passives[tree];
  let unlocked = 0, maxed = 0;
  for (const lv of arr) { if (lv > 0) unlocked++; if (lv >= PASSIVES.maxLevel) maxed++; }
  return { unlocked, maxed, total: arr.length };
}

export { PASSIVE_TREES };
```

<a id="src-game-memoires-js"></a>

## `src/game/memoires.js`

```js
// Motor de Mémoires — GDD §10/§11. Moeda = Éclats. Clarté é o motor global
// (dano × 1.07^Σ níveis). Desbloqueio por era via Ascension; evolução barata
// que escala. Persiste sempre. Efeitos `wired:false` ainda contam via Clarté.

import {
  MEMOIRES, MEMOIRE_CLARTE_BASE, MEMOIRE_UNLOCK, MEMOIRE_EVO_BASE, MEMOIRE_EVO_RAMP,
  MEMOIRE_CLARTE_EXP_PER, MEMOIRE_INDIV_DMG_CAP,
} from '../data/constants.js';

export const eraOf = (i) => MEMOIRES[i].era;
export const eraUnlocked = (state, era) => state.ascensions >= era;

// Custo do próximo passo (Éclats): desbloqueio (nível 0→1) ou evolução
export function nextCost(state, i) {
  const level = state.memoires[i];
  if (level === 0) return MEMOIRE_UNLOCK[MEMOIRES[i].era - 1];   // §11: desbloqueio por era
  return MEMOIRE_EVO_BASE * MEMOIRE_EVO_RAMP ** (level + 1);     // §11: evolução 2 × 1.10^n
}

export function canBuy(state, i) {
  return eraUnlocked(state, MEMOIRES[i].era) && state.eclats >= nextCost(state, i);
}

export function buyMemoire(state, i) {
  if (!canBuy(state, i)) return false;
  state.eclats -= nextCost(state, i);
  state.memoires[i] += 1;
  return true;
}

// ───── Efeitos ─────
export function totalLevels(state) {
  let s = 0;
  for (const l of state.memoires) s += l;
  return s;
}

// Σ aditivo de um tipo (1 + Σ per×nível) — só efeitos wired
function addType(state, type) {
  let s = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) s += m.per * state.memoires[i]; });
  return s;
}
// du Choix (#15): +5%/nível a TODOS os efeitos INDIVIDUAIS (não à Clarté nem ao motor ×Blessure)
const allMult = (state) => 1 + addType(state, 'allMemoire');
// Σ aditivo de um tipo, JÁ amplificado por du Choix
const eff = (state, type) => addType(state, type) * allMult(state);
// Π multiplicativo de um tipo (Π (1+per)^nível)
function mulType(state, type) {
  let p = 1;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) p *= (1 + m.per) ** state.memoires[i]; });
  return p;
}

// ⚠️ Clarté: o expoente é amplificado por #14 (de la Lumière Entière) — STUB (per=0, sem efeito).
// Com MEMOIRE_CLARTE_EXP_PER=0 o expoente = Σníveis ⇒ Clarté = 1.07^Σníveis (Camada 6 INTACTA).
function clarteExponent(state) {
  let amp = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'clarteExp') amp += MEMOIRE_CLARTE_EXP_PER * state.memoires[i]; });
  return totalLevels(state) * (1 + amp);
}
export const clarte = (state) => MEMOIRE_CLARTE_BASE ** clarteExponent(state);

// dano = Clarté × bônus individual AMORTECIDO (#1 + #10), capado p/ não abrir gap no late.
// A Clarté é O motor (70 déc); #1/#10 dão um bônus pequeno por cima (teto ×CAP) e seus níveis
// ainda alimentam a Clarté via totalLevels. Andar Mémoires ≈ 70 déc no TOTAL.
export const memoireDmgMult = (s) =>
  clarte(s) * Math.min(MEMOIRE_INDIV_DMG_CAP, (1 + eff(s, 'dmg')) * mulType(s, 'dmgMult'));
// HP recebe os MESMOS fatores de prestige (§4) — INCLUSIVE a Clarté. Sem isto o HP fica ~70 déc
// atrás do dano e o jogador morre instantâneo no late (a sobrevivência da Camada 2 assume HP∝dano).
export const memoireHpMult      = (s) => clarte(s) * (1 + eff(s, 'hp') + eff(s, 'survival'));
export const memoireLumensMult  = (s) => 1 + eff(s, 'lumens');
export const memoireXpMult      = (s) => 1 + eff(s, 'xp');
export const memoireVestigeMult = (s) => 1 + eff(s, 'vestiges');
export const memoireCritDmgMult = (s) => 1 + eff(s, 'critDmg');
// ── Passo 6: efeitos novos/wired ──
export const memoireSurvivalMult   = (s) => 1 + eff(s, 'survival');   // #11 → regen (combat) + defesa (veilFactor)
export const memoireMateriaisMult  = (s) => 1 + eff(s, 'materiais');  // #5  → yield de material (economy)
export const memoireEclatsAllMult  = (s) => 1 + eff(s, 'eclatsAll');  // #12 → drip + bolsas de Ascension
export const memoireDiffRewardMult = (s) => 1 + eff(s, 'diffReward'); // #13 → multiplica rewardMult da dificuldade
export const memoireBossDmgMult    = (s) => 1 + eff(s, 'bossDmg');    // #7  → dano em boss (path do gearBossDmg)
export const memoireOfflineMult    = (s) => 1 + eff(s, 'offline');    // #6  → ganho offline
// #9 du Dernier Chant: +1 ponto de Convergence/run a cada 5 níveis
export function memoireConvPointBonus(state) {
  let b = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'convPoint') b += Math.floor(state.memoires[i] / 5); });
  return b;
}

// Progresso por era (desbloqueadas / total) para a UI
export function eraProgress(state, era) {
  let unlocked = 0, total = 0;
  MEMOIRES.forEach((m, i) => { if (m.era === era) { total++; if (state.memoires[i] > 0) unlocked++; } });
  return { unlocked, total };
}
```

<a id="src-game-difficulty-js"></a>

## `src/game/difficulty.js`

```js
// Dificuldades — §8 (Camada 7, Passo 5). Re-roda mapas com HP/dano ×mult e
// recompensa (materiais/Éclats) ×rewardMult. Sistema abre na A2; gate dos modos
// = PODER (você morre se fraco) + bloqueio de OVERFLOW (≤ 1e100). Nightmare/Tormento
// = break_infinity → visíveis mas sempre bloqueados (não implementa a lib agora).

import { DIFFICULTIES, NUMBER_CAP, COMBAT } from '../data/constants.js';
import { getCurrentMap, hpForLevel, subareaLevelRange } from './enemies.js';

export const currentDifficulty = (state) => DIFFICULTIES[state.difficulty] || DIFFICULTIES[0];

// HP do boss mais fundo do mapa atual (proxy de overflow) × hpMult ≤ 1e100 ?
function noOverflow(state, hpMult) {
  const map = getCurrentMap(state);
  const deepBossHp = hpForLevel(map, subareaLevelRange(map, map.subareaCount).hi) * COMBAT.bossHpMult;
  return deepBossHp * hpMult <= NUMBER_CAP;
}

// Uma dificuldade está DISPONÍVEL p/ o conteúdo atual?
export function difficultyAvailable(state, idx) {
  const d = DIFFICULTIES[idx];
  if (!d) return false;
  if (idx === 0) return true;                         // Normal sempre
  if (d.breakInf) return false;                       // Nightmare/Tormento: visível mas bloqueado (break_infinity)
  if (state.ascensions < d.minAscension) return false; // sistema abre na A2
  return noOverflow(state, d.hpMult);                 // não pode estourar 1e100
}

// Dificuldade EFETIVA (clamp p/ Normal se a selecionada não está disponível no conteúdo atual)
export function effectiveDifficulty(state) {
  return difficultyAvailable(state, state.difficulty) ? currentDifficulty(state) : DIFFICULTIES[0];
}

// Tenta selecionar uma dificuldade (respeita disponibilidade). Retorna true se aplicou.
export function setDifficulty(state, idx) {
  if (!difficultyAvailable(state, idx)) return false;
  state.difficulty = idx;
  return true;
}
```

<a id="src-game-fatekeepers-js"></a>

## `src/game/fatekeepers.js`

```js
// Fate Keepers (A1-A5) — §8 (Passo 5). Desbloqueiam por Ascension:
//   A1 auto-Gold Stats + auto-Convergir · A2 auto-progressão + abre dificuldades ·
//   A3 motor de Éclats (drip + offline 24h) · A4 +cap de mobs · A5 Transcendência (stub).
// As automações são TOGGLES (default off): o Fate Keeper LIBERA, o jogador LIGA.

import { buyStatMax } from './stats.js';
import { canConverge, doConverge } from './convergence.js';
import { enterSubarea } from './combat.js';
import { hpForLevel } from './enemies.js';
import { MAPS, ECO, CRAFT, ECONOMY, VESTIGES, NUMBER_CAP, mapMaterialTier } from '../data/constants.js';

// Fate Keeper N desbloqueado?
export const fateKeeperUnlocked = (state, n) => state.ascensions >= n;

// A3 — Eco do Seeker: farma `ecoMap` (já limpo) em 2º plano a ECO.fraction do rendimento daquele mapa.
// Rende materiais (do tier do eco map) + Lumens + Vestiges, online E offline (roda no automationTick).
export function ecoTick(state, dt) {
  if (state.ascensions < 3 || !state.ecoMap) return;
  const ecoMap = MAPS[state.ecoMap - 1];
  if (!ecoMap) return;
  const kills = ECO.killRate * dt;          // kills equivalentes no período
  const f = ECO.fraction;
  const frontierHp = hpForLevel(ecoMap, ecoMap.lvlHi); // mob mais fundo do eco map
  // Materiais do tier do eco map (valor esperado = chance × kills), a fração
  state.materiais[mapMaterialTier(state.ecoMap)] += f * CRAFT.dropChance * kills;
  // Lumens e Vestiges a fração (sempre < farm ativo, pois o eco map é mais baixo)
  state.lumens = Math.min(NUMBER_CAP, state.lumens + f * frontierHp * ECONOMY.goldRatio * kills);
  const vestPerKill = Math.ceil(ecoMap.subareaCount * 0.5) * 3 ** (state.ecoMap - 1);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + f * vestPerKill * kills);
}

// Tick de automação (roda no loop online e na simulação offline)
export function automationTick(state, dt = 0) {
  // A1 — auto-Gold Stats + auto-Convergir
  if (state.ascensions >= 1) {
    if (state.auto.stats) for (const key of Object.keys(state.stats)) buyStatMax(state, key);
    if (state.auto.converge && canConverge(state)) doConverge(state);
  }
  // A2 — auto-progressão (vai p/ a sub-área mais funda desbloqueada)
  if (state.ascensions >= 2 && state.auto.progress) {
    if (state.subarea < state.unlockedSubarea) enterSubarea(state, state.unlockedSubarea);
  }
  // A3 — Eco do Seeker (2º plano). A4 (+cap de mobs) é aplicado no spawn (combat.js); A5 = flag.
  ecoTick(state, dt);
}
```

<a id="src-game-offline-js"></a>

## `src/game/offline.js`

```js
// Progresso offline — GDD §15.
// O tick de combate é o motor real também offline: simulamos o tempo ausente
// com o mesmo combatTick (mesmo dt), então morte/recuo acontecem como online
// e a cascata estabiliza no ponto sustentável. O jogador NUNCA abre morto.

import { TICK_SECONDS, OFFLINE } from '../data/constants.js';
import { combatTick, resetPack } from './combat.js';
import { automationTick } from './fatekeepers.js';
import { playerHpMax } from './stats.js';
import { memoireOfflineMult } from './memoires.js';

// Simula `seconds` de ausência. Retorna o resumo dos ganhos (ou null se curto).
export function simulateOffline(state, seconds) {
  // #6 des Profondeurs amplia o tempo offline efetivo (capado pelo teto de engenharia)
  const simSeconds = Math.min(Math.max(0, seconds) * memoireOfflineMult(state), OFFLINE.maxSeconds);
  if (simSeconds < OFFLINE.minSecondsToReport) return null;

  const before = {
    lumens: state.lumens,
    xp: state.xpTotal,
    vestiges: state.vestiges,
    kills: state.killsTotal,
    subarea: state.subarea,
  };

  const ticks = Math.floor(simSeconds / TICK_SECONDS);
  for (let i = 0; i < ticks; i++) {
    combatTick(state, TICK_SECONDS);
    automationTick(state, TICK_SECONDS); // §8: automações + Eco do Seeker rodam offline também
  }

  // Garantia do §15: nunca abrir morto — completa o respawn pendente
  if (state.player.dead) {
    state.player.dead = false;
    state.player.respawnTimer = 0;
    state.player.hp = playerHpMax(state);
    resetPack(state);
  }

  return {
    seconds: simSeconds,
    lumens: state.lumens - before.lumens,
    xp: state.xpTotal - before.xp,
    vestiges: state.vestiges - before.vestiges,
    kills: state.killsTotal - before.kills,
    retreated: state.subarea < before.subarea, // recuou até o sustentável?
  };
}
```

