// ===== Save migration chain =====
// Each function upgrades the save state from one schema version to the next.
// Applied in sequence on every load — all migrations must be idempotent.

const MIGRATIONS = [
  // v0 → v1: normalise equipped shape.
  function normaliseEquipped(s) {
    const equipped = {};
    for (const slot of SLOTS) {
      const it = (s.equipped || {})[slot.id];
      const validRarity = it && Number.isInteger(it.rarity) && it.rarity >= 0 && it.rarity < RARITIES.length;
      const validLevel  = it && typeof it.level === "number" && it.level >= 1;
      equipped[slot.id] = (validRarity && validLevel)
        ? { rarity: it.rarity, level: it.level }
        : { rarity: 0, level: 1 };
    }
    s.equipped = equipped;
    return s;
  },

  // v1 → v2: remove obsolete Essence fields.
  function removeEssenceFields(s) {
    delete s.asc;
    delete s.essence;
    return s;
  },

  // v2 → v3: migra do sistema de zonas lineares para o mapa-mundo.
  // Converte zone/maxZone em region/difficulty/wave + regionProgress.
  function migrateToWorldMap(s) {
    // Se já tem regionProgress, já está no novo formato.
    if (s.regionProgress && s.region !== undefined && s.zone === undefined) return s;

    // Só migra se tinha o campo zone do sistema antigo.
    if (s.zone !== undefined || s.maxZone !== undefined) {
      const oldMaxZone = s.maxZone || 0;

      // Determina região e wave baseado na zona antiga.
      const oldZone = s.zone || 1;
      const regionIdx = Math.min(Math.floor((oldZone - 1) / 10), REGIONS.length - 1);

      s.region = regionIdx;
      s.difficulty = 0;
      s.wave = 1;
      s.killsInWave = 0;

      // Reconstrói regionProgress a partir de maxZone.
      // Cada 10 zonas = 1 região no Normal.
      s.regionProgress = { 0: [] };
      for (let r = 0; r < REGIONS.length; r++) {
        const bossZone = (r + 1) * 10;
        if (oldMaxZone >= bossZone) {
          // Limpou o boss desta região no Normal.
          s.regionProgress[r] = [0];
          // Desbloqueia a próxima região.
          if (r + 1 < REGIONS.length && !((r + 1).toString() in s.regionProgress)) {
            s.regionProgress[r + 1] = [];
          }
        } else if (oldMaxZone >= r * 10 + 1) {
          // Chegou nesta região mas não limpou o boss.
          if (!(r.toString() in s.regionProgress)) {
            s.regionProgress[r] = [];
          }
        }
      }

      // Converte zoneMastery (por zona) em regionMastery (por região).
      s.regionMastery = {};
      if (s.zoneMastery) {
        for (const [z, k] of Object.entries(s.zoneMastery)) {
          const rIdx = Math.floor((Number(z) - 1) / 10) % REGIONS.length;
          s.regionMastery[rIdx] = (s.regionMastery[rIdx] || 0) + k;
        }
      }

      // Remove campos obsoletos.
      delete s.zone;
      delete s.maxZone;
      delete s.killsInZone;
      delete s.zoneProgress;
      delete s.zoneMastery;
    }

    // Garante que os campos existem (para saves completamente novos).
    if (!s.regionProgress) s.regionProgress = { 0: [] };
    if (!s.regionMastery)  s.regionMastery  = {};
    if (s.region === undefined)     s.region = 0;
    if (s.difficulty === undefined) s.difficulty = 0;
    if (s.wave === undefined)       s.wave = 1;
    if (s.killsInWave === undefined) s.killsInWave = 0;

    return s;
  },
  // v3 → v4: adiciona goldStats a saves antigos que não tinham.
  // Fase 0: renomeia gold→lumens e shards→vestiges (idempotente).
  // NB: load() faz Object.assign(defaultState(), parsed) ANTES de migrar, então
  // lumens/vestiges já existem (=0) aqui. O gate é a PRESENÇA do campo antigo, não
  // a ausência do novo — senão o save antigo seria descartado e o jogador perderia tudo.
  function renameCurrencyFields(s) {
    if (s.gold !== undefined) {
      s.lumens = s.gold;
      delete s.gold;
    }
    if (s.shards !== undefined) {
      s.vestiges = s.shards;
      delete s.shards;
    }
    return s;
  },

  // v4 → v5: adiciona goldStats a saves antigos que não tinham.
  function addGoldStats(s) {
    if (!s.goldStats) {
      s.goldStats = { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 };
    }
    // Garante que todos os 6 stats existem (caso novos stats sejam adicionados).
    for (var i = 0; i < GOLD_STATS.length; i++) {
      var id = GOLD_STATS[i].id;
      if (!(id in s.goldStats)) s.goldStats[id] = 0;
    }
    return s;
  },

  // v5 → v6: adiciona estado de passivas (Fase 3).
  function addPassivesState(s) {
    if (!s.passives) s.passives = {};
    if (s.bossKills === undefined) s.bossKills = 0;
    if (s.totalVestgesSpent === undefined) s.totalVestgesSpent = 0;
    return s;
  },

  // v6 → v7: adiciona convergences (Fase 2).
  function addConvergencesField(s) {
    if (s.convergences === undefined) s.convergences = 0;
    return s;
  },

  // v7 → v8: adiciona inventário de materiais (Fase 4).
  function addMaterialsState(s) {
    if (!s.materials) s.materials = {};
    return s;
  },
];

function migrate(state) {
  return MIGRATIONS.reduce((s, fn) => fn(s), state);
}
