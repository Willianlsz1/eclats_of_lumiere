// ===== Progression: tiers, ascensão, synergy, escala por nível =====
// Funções puras que calculam multiplicadores a partir de s.ascensions e s.equipped.
// Sem dependências de combate ou região — só CONFIG e TIERS de data.js.

// --- Tiers da Ordre (DESIGN §15) — tier = nº da ascensão (0-4) ---
function heroTier(s) {
  return Math.max(0, Math.min(s.ascensions, TIERS.length - 1));
}

// Multiplicador de Ascensão: cada ascensão (mapa completado) dá um spike de poder
// (≈ salto de HP por mapa) para começar o próximo. ascMult = spikePerTier ^ ascensions.
// O prestígio FREQUENTE que compõe é a Convergence; a Ascensão são 5 marcos grandes.
function ascMultiplier(s) {
  return Math.pow(CONFIG.ascension.spikePerTier, s.ascensions || 0);
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
function convergenceMult(s) {
  const n = s.convergences || 0;
  if (n === 0) return 1;
  const C = CONFIG.convergence;
  let mult = 1;

  // Segment 1: convergences 1–switchPoint1 (×mult1 each)
  const n1 = Math.min(n, C.switchPoint1);
  if (n1 > 0) mult *= Math.pow(C.mult1, n1);

  // Segment 2: convergences switchPoint1+1–switchPoint2 (×mult2 each)
  if (n > C.switchPoint1) {
    const n2 = Math.min(n - C.switchPoint1, C.switchPoint2 - C.switchPoint1);
    mult *= Math.pow(C.mult2, n2);
  }

  // Segment 3: convergences switchPoint2+1+ (+additive% each, applied multiplicatively)
  if (n > C.switchPoint2) {
    mult *= 1 + (n - C.switchPoint2) * C.additive;
  }

  // Spike ×spikeMultiplier every spikeInterval convergences
  const spikes = Math.floor(n / C.spikeInterval);
  if (spikes > 0) mult *= Math.pow(C.spikeMultiplier, spikes);

  // Clamp de segurança: impede overflow → Infinity (que serializa como null no save).
  return Math.min(mult, C.maxMult);
}

// Returns true if the next convergence yields ≥5% power gain.
function convergenceRecommended(s) {
  const current = convergenceMult(s);
  const next    = convergenceMult({ convergences: (s.convergences || 0) + 1 });
  return (next / current - 1) >= 0.05;
}

function totalPowerMult(s) {
  return ascMultiplier(s) * convergenceMult(s) * synergyBonusMult(s) * synergySurgeMult(s);
}

// Stats POR NÍVEL crescem a cada ascensão.
function perLevelMult(s) { return Math.pow(CONFIG.ascension.perLevelGrowth, s.ascensions); }
function damagePerLevel(s) { return CONFIG.player.damagePerLevel * perLevelMult(s); }
function hpPerLevel(s) { return CONFIG.player.hpPerLevel * perLevelMult(s); }

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
    heroTier, ascMultiplier,
    convergenceMult, convergenceRecommended,
    synergyLevel, synergyBonusMult, synergySurgeCount, synergySurgeMult, totalPowerMult,
    perLevelMult, damagePerLevel, hpPerLevel,
    offlineConfig,
  };
}
