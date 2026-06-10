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

// Núcleo / infraestrutura
export const TICK_SECONDS = 0.1;     // tick fixo de 100ms
export const MAX_CATCHUP_TICKS = 50; // teto de catch-up por frame (offline real é CP-F)
export const AUTOSAVE_MS = 10_000;
export const SAVE_KEY = 'eclats_save_v1';
export const SCHEMA_VERSION = 1;
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
