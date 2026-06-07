// ===== Progression: tiers, ascensão, synergy, escala por nível =====
// Funções puras que calculam multiplicadores a partir de s.ascensions e s.equipped.
// Sem dependências de combate ou região — só CONFIG e TIERS de data.js.

// --- Tiers de classe ---
function heroTier(s) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (s.ascensions >= TIERS[i].minAsc) return i;
  }
  return 0;
}

function tierSpikeMultiplier(totalAscensions) {
  let spike = 1;
  for (let i = 1; i < TIERS.length; i++) {
    if (totalAscensions >= TIERS[i].minAsc) spike *= TIERS[i].spike;
  }
  return spike;
}

function ascMultiplier(s) {
  const n = s.ascensions;
  if (n === 0) return 1;
  let mult = 1;
  for (let i = 0; i < TIERS.length; i++) {
    const t = TIERS[i];
    const nextMin = i + 1 < TIERS.length ? TIERS[i + 1].minAsc : Infinity;
    let exp;
    if (i === 0) {
      exp = Math.min(n, nextMin - 1);
    } else {
      const tierCap = nextMin === Infinity ? n - t.minAsc : nextMin - t.minAsc;
      exp = Math.max(0, Math.min(n - t.minAsc, tierCap));
    }
    if (exp > 0) mult *= Math.pow(t.mult, exp);
  }
  return mult * tierSpikeMultiplier(n);
}

// --- Synergy (soma de todos os níveis de equipamento) ---
function synergyLevel(s) {
  return Object.values(s.equipped).reduce((sum, it) => sum + it.level, 0);
}
function synergyBonusMult(s) {
  return 1 + synergyLevel(s) * CONFIG.synergy.bonusPerLevel;
}
function synergySurgeCount(s) {
  return Math.floor(synergyLevel(s) / CONFIG.synergy.surgeInterval);
}
function synergySurgeMult(s) {
  const n = synergySurgeCount(s);
  return n > 0 ? Math.pow(CONFIG.synergy.surgeMultiplier, n) : 1;
}
function totalPowerMult(s) {
  return ascMultiplier(s) * synergyBonusMult(s) * synergySurgeMult(s);
}

// Stats POR NÍVEL crescem a cada ascensão.
function perLevelMult(s) { return Math.pow(CONFIG.ascension.perLevelGrowth, s.ascensions); }
function damagePerLevel(s) { return CONFIG.player.damagePerLevel * perLevelMult(s); }
function hpPerLevel(s) { return CONFIG.player.hpPerLevel * perLevelMult(s); }

// --- Requisitos de ascensão (sistema de mapa-mundo) ---
// Total de "stages" existentes (região × dificuldade).
function totalStages() { return REGIONS.length * DIFFICULTIES.length; }

// Quantos stages o jogador precisa ter limpado para a próxima ascensão.
// Cresce +1 por ascensão até o teto de totalStages(). Depois, só nível é gate.
function ascStagesRequired(s) {
  return Math.min(s.ascensions + 1, totalStages());
}

// Conta quantos stages o jogador já limpou (boss derrotado).
function stagesCleared(s) {
  let count = 0;
  for (const key of Object.keys(s.regionProgress || {})) {
    count += (s.regionProgress[key] || []).length;
  }
  return count;
}

// Config de offline: melhora automaticamente a cada CONFIG.offline.ascPerStep ascensões.
function offlineConfig(s) {
  const O = CONFIG.offline;
  const steps = Math.floor(s.ascensions / O.ascPerStep);
  const efficiency = Math.min(O.efficiencyMax, O.startEfficiency + steps * O.effPerStep);
  const capHours   = Math.min(O.capMaxHours,   O.startCapHours   + steps * O.capHoursPerStep);
  return { efficiency, capHours };
}

if (typeof module !== "undefined") {
  module.exports = {
    heroTier, tierSpikeMultiplier, ascMultiplier,
    synergyLevel, synergyBonusMult, synergySurgeCount, synergySurgeMult, totalPowerMult,
    perLevelMult, damagePerLevel, hpPerLevel,
    totalStages, ascStagesRequired, stagesCleared,
    offlineConfig,
  };
}
