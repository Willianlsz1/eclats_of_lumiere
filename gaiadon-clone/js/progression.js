// ===== Progression: tiers, ascensão, synergy, escala por nível =====
// Funções puras que calculam multiplicadores a partir de s.ascensions e s.equipped.
// Sem dependências de combate ou zona — só CONFIG e TIERS de data.js.

// --- Tiers de classe ---
// Tier atual: derivado de s.ascensions (nunca salvo — evita saves corrompidos).
function heroTier(s) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (s.ascensions >= TIERS[i].minAsc) return i;
  }
  return 0;
}

// Produto acumulado dos spikes de todos os tiers já alcançados.
// Ex: 200 ascensões → Warrior (×10) + Champion (×50) = ×500.
function tierSpikeMultiplier(totalAscensions) {
  let spike = 1;
  for (let i = 1; i < TIERS.length; i++) {
    if (totalAscensions >= TIERS[i].minAsc) spike *= TIERS[i].spike;
  }
  return spike;
}

// Multiplicador total acumulado de todas as ascensões feitas, agrupadas por tier.
// Tier 0: ascensões 1-49 usam rate 1.06 (a 50ª já usa Warrior — ver spec).
// Tier i>0: ascensões de TIERS[i].minAsc em diante usam TIERS[i].mult.
function ascMultiplier(s) {
  const n = s.ascensions;
  if (n === 0) return 1;
  let mult = 1;
  for (let i = 0; i < TIERS.length; i++) {
    const t = TIERS[i];
    const nextMin = i + 1 < TIERS.length ? TIERS[i + 1].minAsc : Infinity;
    let exp;
    if (i === 0) {
      // Tier 0: máximo 49 ascensões neste rate (a 50ª começa o Warrior).
      exp = Math.min(n, nextMin - 1);
    } else {
      // Tier i: de t.minAsc até (nextMin - 1).
      const tierCap = nextMin === Infinity ? n - t.minAsc : nextMin - t.minAsc;
      exp = Math.max(0, Math.min(n - t.minAsc, tierCap));
    }
    if (exp > 0) mult *= Math.pow(t.mult, exp);
  }
  return mult * tierSpikeMultiplier(n);
}

// --- Synergy (soma de todos os níveis de equipamento) ---
// Incentiva evoluir TODOS os slots, não só o favorito.
function synergyLevel(s) {
  return Object.values(s.equipped).reduce((sum, it) => sum + it.level, 0);
}
// Bônus linear: +0.1% a todos os stats por nível de sinergia.
function synergyBonusMult(s) {
  return 1 + synergyLevel(s) * CONFIG.synergy.bonusPerLevel;
}
// Surges: milestones a cada surgeInterval níveis — cada um multiplica tudo por surgeMultiplier.
function synergySurgeCount(s) {
  return Math.floor(synergyLevel(s) / CONFIG.synergy.surgeInterval);
}
function synergySurgeMult(s) {
  const n = synergySurgeCount(s);
  return n > 0 ? Math.pow(CONFIG.synergy.surgeMultiplier, n) : 1;
}
// Multiplicador global: ascensão × bônus de sinergia × surges acumulados.
// Substitui ascMultiplier(s) nos stats que escalam com poder total.
function totalPowerMult(s) {
  return ascMultiplier(s) * synergyBonusMult(s) * synergySurgeMult(s);
}

// Stats POR NÍVEL crescem a cada ascensão (o Hero fica permanentemente mais forte).
function perLevelMult(s) { return Math.pow(CONFIG.ascension.perLevelGrowth, s.ascensions); }
function damagePerLevel(s) { return CONFIG.player.damagePerLevel * perLevelMult(s); }
function hpPerLevel(s) { return CONFIG.player.hpPerLevel * perLevelMult(s); }

// --- Requisitos de ascensão ---
// Gate: nível mínimo (warmup fixo) + zona-fronteira crescente (grind real).
// A zona exigida sobe +1 por ascensão — self-balancing com a calibração de fronteira.
function ascZoneReq(s) {
  return CONFIG.ascension.firstReqZone + s.ascensions * CONFIG.ascension.zoneIncrement;
}

// Profundidade de zona que o jogador já pode acessar sem calibração de fronteira.
// = máximo entre o maxZone real E a profundidade inferida do histórico de ascensões.
// Por que inferir? Se ascend() bugou e resetou maxZone, o player ainda "merece"
// estar na zona (ascZoneReq-1). Usar só maxZone o prenderia em zonas triviais
// com inimigos impossíveis porque a calibração de fronteira não dispararia lá.
// Exemplo: asc=17, maxZone=2 → accessibleDepth=21 (zona 22 é a nova fronteira).
function accessibleDepth(s) {
  return Math.max(s.maxZone, ascZoneReq(s) - 1);
}

// Config de offline: melhora automaticamente a cada CONFIG.offline.ascPerStep ascensões.
// Teto: 50% de eficiência, 24h de cap.
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
    ascZoneReq, accessibleDepth,
    offlineConfig,
  };
}
