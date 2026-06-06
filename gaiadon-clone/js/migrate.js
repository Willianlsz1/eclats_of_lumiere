// ===== Save migration chain =====
// Each function upgrades the save state from one schema version to the next.
// Applied in sequence on every load — all migrations must be idempotent
// (safe to run on an already-migrated save).
//
// Adding a new migration: append one function to MIGRATIONS. load() never changes.

const MIGRATIONS = [
  // v0 → v1: normalise equipped shape.
  // Old saves may have rarity as a string, item as an object, or missing fields.
  // Discard anything invalid and fall back to { rarity: 0, level: 1 }.
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

  // v1 → v2: remove obsolete Essence fields from the early prototype.
  function removeEssenceFields(s) {
    delete s.asc;
    delete s.essence;
    return s;
  },

  // v2 → v3: restaura maxZone para jogadores presos após ascensão.
  // Bug: ascend() resetava maxZone=0, fazendo a calibração de fronteira disparar em
  // toda zona (incluindo zona 1) — inimigos com HP de quadrilhões logo no início.
  // Se o player conseguiu avançar 1-2 zonas após o bug, maxZone pode ser 1 ou 2.
  // A condição antiga (=== 0) não capturava esses casos.
  // Fórmula: a ascensão N exigia ter limpado zona (firstReqZone + (N-1)*zoneIncrement).
  // Com firstReqZone=5 e zoneIncrement=1: minZone esperado = 5 + (ascensions - 1).
  // Condição corrigida: qualquer maxZone abaixo do mínimo esperado é tratado.
  function restoreMaxZoneAfterAscension(s) {
    const expectedMin = s.ascensions > 0 ? 5 + (s.ascensions - 1) : 0;
    if (s.ascensions > 0 && s.maxZone < expectedMin) {
      s.maxZone = expectedMin;
      s.zone    = s.maxZone + 1; // coloca direto na fronteira
    }
    return s;
  },

  // v3 → v4: adiciona zoneMastery e zoneProgress para saves sem esses campos.
  // zoneMastery: histórico permanente de kills por zona (inicia em {}).
  // zoneProgress: progresso de limpeza por zona na run atual (inicia em {}).
  function addZoneMastery(s) {
    if (!s.zoneMastery)   s.zoneMastery   = {};
    if (!s.zoneProgress)  s.zoneProgress  = {};
    return s;
  },

  // Future migrations go here ↓
];

// Apply every migration in sequence and return the upgraded state.
function migrate(state) {
  return MIGRATIONS.reduce((s, fn) => fn(s), state);
}
