// ===== Progression: tiers, ascensão, synergy, escala por nível =====
// Funções puras que calculam multiplicadores a partir de s.ascensions e s.equipped.
// Sem dependências de combate ou região — só CONFIG e TIERS de data.js.

// --- Tiers da Ordre — marco da ascensão (até 1000) ---
function heroTier(s) {
  const n = s.ascensions || 0;
  for (let i = TIERS.length - 1; i >= 0; i--) if (n >= TIERS[i].minAsc) return i;
  return 0;
}

// Multiplicador de Ascensão (motor geométrico): produto de mults crescentes.
// ascMult = Π_{i=0}^{n-1} (multBase + multSlope·i). Cada ascensão vale um pouco mais.
function ascMultiplier(s) {
  const n = s.ascensions || 0;
  const A = CONFIG.ascension;
  let mult = 1;
  for (let i = 0; i < n; i++) mult *= (A.multBase + A.multSlope * i);
  return mult;
}

// --- Synergy (soma de todos os níveis de equipamento) — só o bônus linear leve ---
function synergyLevel(s) {
  return Object.values(s.equipped).reduce((sum, it) => sum + it.level, 0);
}
function synergyBonusMult(s) {
  return 1 + synergyLevel(s) * CONFIG.synergy.bonusPerLevel;
}
function convergenceMult(s) {
  const n = s.convergences || 0;
  if (n <= 0) return 1;
  const C = CONFIG.convergence;
  // Early: multiplicativo. Late: saturação √ (retornos decrescentes).
  let mult = Math.pow(C.earlyMult, Math.min(n, C.earlyCount));
  if (n > C.earlyCount) mult *= 1 + C.lateCoef * Math.sqrt(n - C.earlyCount);
  return Math.min(mult, C.maxMult);
}

// Returns true if the next convergence yields ≥2% power gain.
function convergenceRecommended(s) {
  const current = convergenceMult(s);
  const next    = convergenceMult({ convergences: (s.convergences || 0) + 1 });
  return (next / current - 1) >= 0.02;
}

function totalPowerMult(s) {
  return ascMultiplier(s) * convergenceMult(s) * synergyBonusMult(s);
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
    synergyLevel, synergyBonusMult, totalPowerMult,
    perLevelMult, damagePerLevel, hpPerLevel,
    offlineConfig,
  };
}
