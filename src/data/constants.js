// Constantes de balanceamento — fonte: docs/eclats_gdd_final_v2.md
// NUNCA inventar valores: tudo aqui vem do GDD (seções 3, 4, 6 e 12).

// §4 — Constantes-âncora do núcleo de combate
export const COMBAT = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (2026-06-18, decisão Willian). Stats iniciais do
  // player redefinidos; o resto (Convergence/Despertar/Gear) acompanha. Ver o doc novo
  // docs/eclats_balance_mapa_2026-06-18.md. Substitui a recalibração "em branco" 17/jun.
  baseDmg: 50000,         // dano base do Seeker (decisão Willian: 50.000)
  baseAPS: 0.90,          // atk speed inicial 0,9 (intervalo ~1,11s)
  apsCap: 10,             // teto GLOBAL de APS (decisão Willian); Map 1 termina em ~2,5
  // APS cresce LINEAR com o afixo do Amuleto (gearApsFlat) + Despertar (+0,5/tier).
  // Mantemos as 2 chaves abaixo só por compat de imports (não usadas).
  apsBonusMax: 0.45,
  apsHalf: 1.7,
  playerBaseHp: 100000,   // HP base inicial (decisão Willian: 100k)
  regenPerSec: 0.01,      // 1% do HP máx por segundo
  regenOnKill: 0,         // regen-por-kill REMOVIDO (vira passiva futura — decisão Willian)
  bossHpMult: 15,         // Wall = mob da Sub 9 (nível 1000) × 15 = ~32,5 bi
  bossDmgMult: 3,         // dano do boss ×3 (sim BOSSDMG)
  deathRespawnSeconds: 3, // morte: respawn com HP cheio, sem perdas
  waveClearDelay: 0.3,    // beat entre ondas: cobre o voo do projétil (PROJ_BASE_MS 200ms + frame)
                          // p/ a morte do ÚLTIMO mob chegar ANTES da próxima onda surgir.
};

// §12 — Lumens · §6 — XP
// ✅ recalibração 2026-06-17 (mobs relativos ao player): a recompensa é DESACOPLADA do HP do
// mob (que agora = seu dano → criava feedback explosivo no nível). XP/Lumens por kill =
// BASE FIXA × areaReward[área] × convMult × gear/mémoires. Assim o nível paceia pela
// PROFUNDIDADE + taxa de kill, não pelo seu dano. (goldRatio/xpRatio viram legado.)
export const ECONOMY = {
  lumBase: 4000,    // Lumens base por kill (× areaReward × convMult × gear …) → compra de gear
  xpRatio: 0.10,    // XP por kill = HP do mob × xpRatio (HP = seu dano × 3 → sobe LISO com nível)
  goldRatio: 0.10,  // legado
  xpBase: 90,       // legado
  lumensFloor: 0,
};

// CP-3 (redesign) — NÍVEL = motor de stat base (substitui os Gold Stats).
// O nível vem do XP da RUN (xpRun): level = (xpRun / div)^exp. Reseta na Convergence.
// Cada nível dá stat FLAT. ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste.
export const LEVEL = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (18/jun): per-level escalado ao novo dano/HP base
  // (baseDmg 50k → +7.500/nv mantém a mesma fração ~15%/nv; baseHp 100k → +500/nv ~0,5%/nv).
  // O nível segue motor de stat base; XP da run reseta na Convergence. level=(xpRun/div)^exp.
  curveDiv: 25000, curveExp: 0.42, // ⏳ div ×50 p/ compensar o mobHp ×50 (X=mobHp×ratio) e restaurar o pace
  dmgPerLevel: 7500, // +dano flat por nível (≈15% do base/nv, como antes)
  hpPerLevel: 500,   // +HP flat por nível (≈0,5% do base/nv, como antes)
  goldPerLevel: 0,   // sem bônus de Lumens por nível
};

// ✅ INIMIGOS RELATIVOS AO PLAYER (recalibração 2026-06-17, decisão Willian: "números
// grandes, mobs te seguem"). HP/dano/nível dos mobs derivam do PODER ATUAL do player —
// não mais da malha estática. Coerente por construção (e imune ao reset da Convergence):
//   mob.level   = nível do player × (fator leve por área)
//   mob.hpMax   = dano_por_hit do player × hitsToKill × areaHp[área]   → ~3 golpes p/ matar
//   mob.dmg/s   = HP_máx do player × dmgFrac × areaDmg[área]           → ameaça real (~30%+)
//   recompensa  = HP do mob × ratio × areaReward[área]                 → fundo = mais ganho
// Boss (Wall) = mob × bossHpMult (HP) e × bossDmgMult (dano). Índices = sub-área − 1.
export const ENEMY = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (18/jun): TTK inicial ~2,2s (2 golpes ÷ APS 0,9) e CRESCE
  // com a profundidade (áreas 2/3+ com mobs "bem mais fortes" — decisão Willian). O TTK CAI
  // conforme o player investe (gear/Convergence/Despertar furam o baseline → menos golpes).
  hitsToKill: 2,
  areaHp:     [1, 1.4, 2.0, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5],     // deeper = mobs bem mais fortes (TTK sobe)
  dmgFrac:    0.009,                                           // dano da ONDA = HP_baseline × dmgFrac × areaDmg /s
  areaDmg:    [1, 1.4, 1.9, 2.6, 3.4, 4.4, 5.6, 7.0, 9.0],     // profundidade = MUITO mais perigo (Wall mata)
  areaReward: [1, 1.6, 2.6, 4.2, 6.8, 11, 18, 29, 47],         // Lumens crescem com a profundidade
  // ✅ "VALORES NO MAPA" (18/jun): Wall (área 9) = mob × 250 de HP → SÓ vencível com o burst do
  // Despertar (×2 dano/vida + crit). O dano da Wall é % do SEU HP (~8s p/ morrer); sem o Despertar
  // você não derruba a Wall na janela e morre em loop (NODESP=1 = não limpa em 60h). Com Despertar
  // é um clímax tenso (dezenas de mortes), não um death-grind.
  bossHpMult: 250,
  bossDmgMult: 5,                                              // boss causa 5× o dano-onda de um mob
  levelPerArea: 0.03,                                          // mob.level = playerLevel × (1 + 0.03×(área−1))
};

// §3 — Malha geométrica dos 5 mapas (✅ levels/HP/threshold canônicos).
// ⚠️ HP/dano dos mobs agora vêm de ENEMY (relativo ao player); os campos hp*/dmg* abaixo
// viram LEGADO (mantidos p/ compat de imports e do nível geométrico de unlock).
// packSizes: densidade de mobs por sub-área (índice = sub-área − 1).
// CP-2 (redesign): nº de sub-áreas CRESCENTE por mapa — Map1=5 · Map2=6 · Map3=7 ·
// Map4=Map5=8 (era 5 fixo). PACK tem 8 entradas; cada mapa usa as primeiras N.
// ⏳ números a re-ancorar na recalibração; curva suave 2→12 por enquanto.
// TODO canon: vínculo nome↔arte dos Maps 2-5 (arte de alguns trios incompleta).
const PACK = [2, 3, 4, 5, 6, 8, 10, 12, 14];
export const MAPS = [
  {
    id: 1, name: 'The Dreaming Wood', continent: 'worldmap.continent1', bg: 'backgrounds.map1',
    // ✅ RECALIBRAÇÃO "EM BRANCO": mob 2.000 (2 hits) → Sub 9 nível 1000 = 2,169 bi;
    // Wall (boss ×15) = ~32,5 bi. Dano dos mobs = curva PRÓPRIA (80 → 700k), Wall "perigo C".
    lvlLo: 1, lvlHi: 1000, hpLo: 2000, hpHi: 2169085656, dmgLo: 80, dmgHi: 7e5,
    // ✅ "VALORES NO MAPA" (18/jun): 2 mobs por área, EXCETO a área 9 (Wall) com 3 (decisão Willian).
    subareaCount: 9, packSizes: [2, 2, 2, 2, 2, 2, 2, 2, 3], bossKillThreshold: 100,
    // ✅ Map 1 sobe o gear só até INCOMUM (Kindled, índice 1) — raro+ é pós-Map 1 (decisão Willian).
    gearRarityCap: 1,
    // ✅ GATE DE NÍVEL re-calibrado e VALIDADO no harness (18/jun): bandas espalhadas pela
    // jornada real de níveis (cresce via Convergence). Sub 7 (nível 540) = Despertar de fato
    // ANTES da Wall; Sub 9 (nível 950) = Wall. unlockLevels[n-1] = nível p/ liberar a Sub n.
    unlockLevels: [1, 25, 60, 130, 240, 380, 540, 720, 950],
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
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): crit damage inicial = 0 → um crit NÃO
  // multiplica (×1) até você ganhar crit damage (Despertar +400%/tier, afixo do Manto, transbordo).
  // critDamageMult = 1 + Σ(crit dmg). (Antes a base era ×2.)
  baseDamageMult: 1,
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
// permanente (dano/HP/XP/Lumens). Reseta o nível da run (xpRun) + o nível do Gear.
// ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste (15% fixo? variável?).
export const CONVERGENCE = {
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): bônus ADITIVO de +20% em dano/HP base e
  // +0,5% em Gold por Convergence. XP fica 0% (vem do Gear). Reseta o nível/Gold da run,
  // NÃO reseta a posição no mapa. Cada Convergence exige um nível maior.
  bonusPerConv: 0.20,        // dano/HP: convMult = 1 + 0.20 × convergences (ADITIVO)
  goldBonusPerConv: 0.005,   // Gold (Lumens): convLumensMult = 1 + 0.005 × convergences (canal próprio)
  gateLevelBase: 40,     // 1ª Convergence: atingir nível 40 (⏳ re-calibrado no harness)
  gateLevelGrowth: 1.3,  // cada Convergence exige um nível maior (×1.3)
  // ✅ HEAD-START (2026-06-17, ref. Gaiadon "Starting Ascension"): ao convergir, o nível da
  // run NÃO volta pro 1 — reseta p/ headstartFrac × nível atingido. Conserta o death-loop
  // das áreas fundas e corta a tediosidade de re-upar do zero. Validado no sim.
  headstartFrac: 0.5,
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
  // Pool de afixos: dmg · hp · gilded · crit · critDmg · aps · regen · bossDmg · lumens · xp · materiais
  //   (✅ 18/jun: DEFESA removida do jogo — decisão Willian. O Manto agora rola GILDED = chance de
  //    aparecer um mob mais forte/rico, ver bloco GILDED. erosao = future, só reservado.)
  pieces: [
    { key: 'edge',  name: 'The Waning Edge',      slot: 'Arma',     primary: 'dmg',    secondary: ['critDmg', 'bossDmg', 'erosao'] },
    { key: 'vigil', name: 'The Silent Vigil',     slot: 'Elmo',     primary: 'hp',     secondary: ['regen', 'hp'] },
    { key: 'veil',  name: 'Veil of Cinders',      slot: 'Manto',    primary: 'gilded', secondary: ['hp', 'regen', 'erosao'] },
    { key: 'grasp', name: 'Grasp of the Unnamed', slot: 'Manoplas', primary: 'crit',   secondary: ['critDmg', 'aps', 'dmg'] },
    { key: 'reson', name: 'The Last Resonance',   slot: 'Amuleto',  primary: 'aps',    secondary: ['crit', 'regen', 'dmg'] },
    { key: 'band',  name: 'Band of Dusk',         slot: 'Anel',     primary: 'lumens', secondary: ['xp', 'materiais'] },
  ],
  // por raridade (índice 0..4): força do afixo e CUSTO sobem
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  // ✅ "VALORES NO MAPA" (18/jun): CAP de nível — comum (Faded) 500 · incomum (Kindled) 1400
  // (decisão Willian). M2+ = placeholder.
  levelCap:   [500, 1400, 3000, 4000, 5000],
  // CUSTO por tier. Faded = ×1; Kindled = ×10. M2+ = placeholder seguro.
  costMult:   [1, 10, 100, 1000, 10000],
  // ── MODELO MAP 1 (✅ "VALORES NO MAPA" 18/jun) ──
  // COMUM (Faded): 2 AFIXOS por peça — 1 flat + 1 % (bonusRate). Flats escalados ao novo
  // dano/HP base (dmg 50k → +2.500/nv; hp 100k → +2.000/nv). APS/crit calibrados p/ os ALVOS
  // de fim de Map 1: APS 2,5 e crit rate 30% (com 1 Despertar: +0,5 APS e +5% crit).
  // INCOMUM (Kindled+): destrava 1 afixo MULTIPLIER × (camada multiplicativa — ver gear.js;
  // só ativo em rarity ≥ 1). É o "salto" da raridade, não um "+10%".
  // rates calibrados ao FIM income-limited do Map 1 (gear ~260, custo geométrico padrão do gênero).
  flatPerLevel: { dmg: 2500, hp: 2000, aps: 0.002643, regen: 0.0005, bossDmg: 0, lumens: 0, xp: 0, crit: 0, critDmg: 0, materiais: 0 },
  bonusRate: 0.02,           // afixo % : 1 + nível × bonusRate × rarityMult (2%/nv no Faded)
  multRate:  0.0003,         // afixo MULTIPLIER × (só rarity ≥ 1 = Incomum+): 1 + nível × multRate × rarityMult
  affixPctRate: 0.04,        // FARM (lumens/xp/materiais): % linear/nível (Anel 4% Lumens/nv)
  secondaryExp: 0.30,        // afixo SECUNDÁRIO = primário^0.30 (e flat/camadas × secondaryExp)
  capPerAsc: 0,
  critPerLevel: 0.00061,   // afixo crit (chance) — RAZÃO calibrada p/ crit ACOMPANHAR o APS
                             // (critPerLevel/apsFlat ≈ 0.230 = 0.25/1.1). Re-ancorado ao MAX do Incomum
                             // (gear 1400 no fim): APS 2,5 → Grasp ~25% + 5% do Despertar = 30%.
  critDmgPerLevel: 0.0667,   // afixo critDmg (secundário a 0.30 → ~+2%/nv efetivo)
  gildedPerLevel: 0.00018, // afixo GILDED (chance, afixo do Manto): nível × × rarityMult, teto GILDED.chanceCap.
                             // Manto MAXADO no fim do Map 1 (1400 Kindled) ≈ 5%; cap GLOBAL 30%.
  // ✅ recalibração "em branco": custo EXPONENCIAL por peça (sim) — barato cedo, dobra a cada
  // 10 níveis (costRamp) → cria teto-SUAVE (~280) bem abaixo do cap duro (400). custo(L) =
  // base × costRamp^L × costMult[raridade], clampado a NUMBER_CAP (M2+ recalibra à parte).
  // ✅ "CUSTO CONTROLADO DENTRO DO TIER" (18/jun, decisão Willian, ref. img): o custo NÃO estoura
  // dentro de um mesmo tier — só a TROCA de tier sobe (costMult ×10). Ramp bem gentil (dobra a
  // cada ~90 níveis) → no topo do Comum (500) ~9,5K/nv e no topo do Incomum (1400) ~98M/nv
  // (leg​ível, sem 1e17). Quem limita a progressão é a renda (Lumens) + o cap duro + materiais.
  // ✅ "CUSTO ESTILO GÊNERO" (18/jun, decisão Willian + pesquisa): GEOMÉTRICO padrão (Clicker
  // Heroes/Cookie Clicker): base PEQUENA e ESCALA. Comum (base ×1) começa baratíssimo (~50) e o
  // custo dobra a cada ~10 níveis; o Incomum é a MESMA curva ×10 (base maior). Números grandes
  // (1eX) são esperados (e ok): o gear para income-limited (~260 no Map 1), longe do cap.
  levelCostBase: 50,         // base do Comum (bem menor — decisão Willian)
  costRamp: 1.07,            // +7%/nível (≈ dobra a cada ~10): a "escala" do custo
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

// ✅ "VALORES NO MAPA" (18/jun, decisão Willian): GILDED — variante de mob "mais forte" que
// substitui a DEFESA (removida). A chance vem do afixo do Manto (gear); teto GLOBAL de 30%
// (no Map 1 chega a ~5% no fim). Um Gilded é mais TANQUE (×hp) e dá mais Gold/XP — NÃO bate
// mais forte (dmgMult 1). Tiers: T1 no Map 1; T2+ liberam em mapas futuros (placeholder).
// Nome canônico "Gilded" (o douramento do Dreaming Wood; eco do boss The Gilded Hollow).
export const GILDED = {
  chanceCap: 0.30, // teto GLOBAL da chance de Gilded (qualquer tier)
  // unlockMap = mapa que libera o tier; o spawn usa o MAIOR tier com unlockMap ≤ mapa atual.
  tiers: [
    { name: 'Gilded',         hpMult: 3.3, lumensMult: 2.5, xpMult: 2.2, dmgMult: 1, unlockMap: 1 },
    { name: 'Gilded Eidolon', hpMult: 6.0, lumensMult: 5.0, xpMult: 4.0, dmgMult: 1, unlockMap: 2 }, // ⏳ placeholder Map 2
  ],
};

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
// ✅ DESPERTAR (recalibração "em branco" 2026-06-17) — pacote de efeitos por tier, igual ao
// "awaken" do sim + economia. Ato do jogador, alcançável ANTES da Wall (Sub 7).
export const DESPERTAR = {
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): pacote por tier. Map 1 libera 1 Despertar
  // (na área 7). É a "chave" pré-Wall: liga o crit e multiplica o poder.
  mult: 2,            // ×2 dano E vida por tier (multiplicativo)
  critRateAdd: 0.05,  // +5% crit rate por tier
  critDmgAdd: 4.0,    // +400% crit damage por tier (somado ao gear; base de crit dmg = 0)
  apsAdd: 0.5,        // +0,500 de atk speed por tier (somado ao base/gear, antes do apsCap)
  lumensBonus: 1.0,   // +100% Gold (Lumens) por tier
  xpBonus: 0.40,      // +40% XP por tier
};

// ✅ GATE do Despertar (recalibração "em branco" 2026-06-17, decisão Willian): profundidade
// (Sub 7+) + KILLS (total) + NÍVEL (da run) + MATERIAIS do T1 (consumidos no ato). Substitui
// o gate Prova-Sub3/Nitzotzot/Vestiges (a Prova-Sub3 era inalcançável após o redesign 14/jun).
// Drop do Nitzotz mantido (vestigial por ora; pode virar moeda de outra coisa).
export const NITZOTZ = { dropChance: 0.02, bossChunk: 5 };
// Requisito por TIER ALVO (índice = despertares+1 = 1..4 → T2..T5). [0] não usado (T1 = início).
// subarea = profundidade mín. liberada · kills = total de kills · level = nível da run · t1 = materiais[0].
export const DESPERTAR_REQ = [
  null,
  { subarea: 7, kills: 6000,   level: 480,    t1: 40 },   // → T2 (Map 1): cai na Sub 7 (decisão Willian)
  { subarea: 5, kills: 30_000, level: 5_000,  t1: 120 },  // → T3 (Map 2) ⏳ placeholder
  { subarea: 6, kills: 1e5,    level: 1e5,    t1: 300 },  // → T4 (Map 3) ⏳ placeholder
  { subarea: 7, kills: 3e5,    level: 1e6,    t1: 600 },  // → T5 (Map 4) ⏳ placeholder
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
export const SCHEMA_VERSION = 8; // v8 (18/jun): recalibração "VALORES NO MAPA" — baseDmg 50k/HP 100k, Conv +20%/+0,5% Gold, Despertar (+400% crit dmg, +0,5 APS, +100% Gold, +40% XP), gear cap 500/1400, Incomum c/ Multiplier, packs 2/área-9=3. Descarta saves v7.
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
