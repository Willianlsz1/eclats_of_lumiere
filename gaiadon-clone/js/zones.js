// ===== Zones: continuous scaling, archetypes, wave tiers, mastery =====
// Phase 2 — zonas contínuas (10 HP → 1.5e16 HP).
// Enemy HP = interpolação geométrica dentro de cada zona.
// Depende de data.js (CONFIG, REGIONS, DIFFICULTIES, ARCHETYPES, WAVE_TIERS).

// --- Helpers de região/dificuldade ---
function getRegion(s)     { return REGIONS[s.region]; }
function getDifficulty(s) { return DIFFICULTIES[s.difficulty]; }
function totalWaves(diffIdx) { return DIFFICULTIES[diffIdx].waves; }
function isBossWave(wave, diffIdx) { return wave >= totalWaves(diffIdx); }


// ═══════════════════════════════════════════════════════════════════════
// Enemy Stats — Continuous Zone Scaling
// ═══════════════════════════════════════════════════════════════════════
// HP cresce geometricamente de zoneStart até zoneStart × internalScale.
//   wave 1 = zoneStart, wave final = zoneStart × internalScale
//   zoneStart = region.startPower × diff.powerMult
//
// Resultado: Plains Normal wave 1 = 10 HP → Peak Nightmare wave 75 ≈ 15 Qa HP

function enemyStatsFor(regionIdx, diffIdx, wave) {
  const region = REGIONS[regionIdx];
  const diff   = DIFFICULTIES[diffIdx];
  const E      = CONFIG.enemy;

  const zoneStart  = region.startPower * diff.powerMult;
  const wavesTotal = diff.waves;
  const progress   = (wave - 1) / Math.max(1, wavesTotal - 1); // 0 a 1

  const hp = Math.round(zoneStart * Math.pow(E.internalScale, progress));

  return {
    hp:   hp,
    dmg:  Math.max(1, Math.round(hp * E.dmgRatio)),
    gold: Math.max(1, Math.round(hp * E.goldRatio)),
    xp:   Math.max(1, Math.round(hp * E.xpRatio)),
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Wave Tiers — quais inimigos estão disponíveis em cada wave
// ═══════════════════════════════════════════════════════════════════════
// Normal: inimigos novos a cada ~20% das waves (gradual, tutorial).
// Nightmare: todos desde wave 1.

function availableEnemies(regionIdx, diffIdx, wave) {
  const region = REGIONS[regionIdx];
  const diff   = DIFFICULTIES[diffIdx];
  const tiers  = WAVE_TIERS[diff.id] || WAVE_TIERS.normal;
  const wavesTotal = diff.waves;

  return region.enemies.filter(function(_, i) {
    if (i >= tiers.length) return true; // fallback: disponível
    var unlockWave = Math.floor(tiers[i] * wavesTotal) + 1;
    return wave >= unlockWave;
  });
}

// Sorteia um inimigo dentre os disponíveis na wave atual.
function pickEnemy(regionIdx, diffIdx, wave) {
  var pool = availableEnemies(regionIdx, diffIdx, wave);
  if (pool.length === 0) pool = [REGIONS[regionIdx].enemies[0]]; // fallback
  return pool[Math.floor(Math.random() * pool.length)];
}


// ═══════════════════════════════════════════════════════════════════════
// Kills por wave
// ═══════════════════════════════════════════════════════════════════════

function killsPerWave() { return CONFIG.wave.killsPerWave; }


// ═══════════════════════════════════════════════════════════════════════
// Region Mastery (permanente entre ascensões)
// ═══════════════════════════════════════════════════════════════════════

function killsToMasterRegion(regionIdx) {
  return CONFIG.mastery.killsBase + regionIdx * CONFIG.mastery.killsPerRegion;
}
function regionMasteryKills(s, regionIdx) {
  return (s.regionMastery || {})[regionIdx] || 0;
}
function isRegionMastered(s, regionIdx) {
  return regionMasteryKills(s, regionIdx) >= killsToMasterRegion(regionIdx);
}
function masteredRegionCount(s) {
  if (!s.regionMastery) return 0;
  var n = 0;
  for (var i = 0; i < REGIONS.length; i++) {
    if (isRegionMastered(s, i)) n++;
  }
  return n;
}
function regionMasteryBonus(s) {
  return 1 + masteredRegionCount(s) * CONFIG.mastery.bonusPerRegion;
}
function recordRegionMasteryKill(s, regionIdx) {
  if (!s.regionMastery) s.regionMastery = {};
  var wasMastered = isRegionMastered(s, regionIdx);
  s.regionMastery[regionIdx] = (s.regionMastery[regionIdx] || 0) + 1;
  return !wasMastered && isRegionMastered(s, regionIdx);
}
function addRegionMasteryKills(s, regionIdx, count) {
  if (!s.regionMastery) s.regionMastery = {};
  s.regionMastery[regionIdx] = (s.regionMastery[regionIdx] || 0) + count;
}


// ═══════════════════════════════════════════════════════════════════════
// Region/Difficulty unlock & clear
// ═══════════════════════════════════════════════════════════════════════

function isRegionUnlocked(s, regionIdx) {
  return regionIdx.toString() in (s.regionProgress || {});
}
function isDifficultyUnlocked(s, regionIdx, diffIdx) {
  if (!isRegionUnlocked(s, regionIdx)) return false;
  if (diffIdx === 0) return true;
  var cleared = s.regionProgress[regionIdx] || [];
  return cleared.includes(diffIdx - 1);
}
function isDifficultyCleared(s, regionIdx, diffIdx) {
  var cleared = (s.regionProgress || {})[regionIdx] || [];
  return cleared.includes(diffIdx);
}

function clearCurrentDifficulty(s) {
  if (!s.regionProgress) s.regionProgress = { 0: [] };
  var progress = s.regionProgress[s.region] || [];
  if (!progress.includes(s.difficulty)) {
    progress.push(s.difficulty);
    s.regionProgress[s.region] = progress;
  }
  // Limpar Normal de uma região desbloqueia a próxima região.
  if (s.difficulty === 0 && s.region + 1 < REGIONS.length) {
    if (!((s.region + 1).toString() in s.regionProgress)) {
      s.regionProgress[s.region + 1] = [];
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════
// Pack size (inimigos simultâneos)
// ═══════════════════════════════════════════════════════════════════════

function packSizeFor(diffIdx, wave, isBoss) {
  if (isBoss) return 1;
  var P = CONFIG.pack;
  var base = P.baseByDifficulty[diffIdx] || 1;
  var max  = P.maxByDifficulty[diffIdx]  || 3;
  return Math.min(max, base + Math.floor((wave - 1) / P.growthPerWave));
}


// ═══════════════════════════════════════════════════════════════════════
// Enemy tier (normal / elite / champion)
// ═══════════════════════════════════════════════════════════════════════

function getEnemyTier(diffIdx) {
  var E = CONFIG.elite;
  if (diffIdx >= E.championMinDifficulty && Math.random() < E.championChance) return "champion";
  if (diffIdx >= E.eliteMinDifficulty    && Math.random() < E.eliteChance)    return "elite";
  return "normal";
}


// ═══════════════════════════════════════════════════════════════════════
// makeEnemy — cria UM inimigo com archetype + tier + ascension scaling
// ═══════════════════════════════════════════════════════════════════════

function makeEnemy(s) {
  var region = REGIONS[s.region];
  var stats  = enemyStatsFor(s.region, s.difficulty, s.wave);
  var E      = CONFIG.enemy;

  // Escala com ascensões: HP e DMG crescem ascGrowth por ascensão.
  var ascMult = Math.pow(E.ascGrowth, s.ascensions);

  // --- BOSS ---
  if (isBossWave(s.wave, s.difficulty)) {
    var B  = CONFIG.boss;
    var bossHp = Math.round(stats.hp * ascMult * B.hpMult);
    return {
      name: region.boss.name,
      emoji: region.boss.emoji,
      isBoss: true,
      tier: "normal",
      archetype: "standard",
      hp: bossHp, maxHp: bossHp,
      dmg: Math.round(stats.dmg * ascMult),
      goldReward: Math.round(stats.gold * B.goldMult),
      xpReward:   Math.round(stats.xp   * B.xpMult),
      shardMult:  B.shardMult,
    };
  }

  // --- REGULAR ENEMY ---
  // Sorteia um inimigo disponível nesta wave (wave tier system).
  var enemyDef = pickEnemy(s.region, s.difficulty, s.wave);
  var arch     = ARCHETYPES[enemyDef.archetype] || ARCHETYPES.standard;

  // Elite/Champion tier
  var tierKey = getEnemyTier(s.difficulty);
  var tm      = CONFIG.elite.tiers[tierKey];

  // Stats finais: base × archetype × elite tier × ascension
  var finalHp  = Math.max(1, Math.round(stats.hp  * arch.hp  * tm.hp  * ascMult));
  var finalDmg = Math.max(1, Math.round(stats.dmg * arch.dmg * tm.dmg * ascMult));

  // Reward: base × archetype × elite tier (sem ascMult na reward)
  var goldReward = Math.max(1, Math.round(stats.gold * arch.reward * tm.reward));
  var xpReward   = Math.max(1, Math.round(stats.xp   * arch.reward * tm.reward));

  return {
    name:  enemyDef.name,
    emoji: enemyDef.emoji,
    isBoss: false,
    tier: tierKey,
    archetype: enemyDef.archetype,
    hp: finalHp, maxHp: finalHp,
    dmg: finalDmg,
    goldReward: goldReward,
    xpReward:   xpReward,
    shardMult:  tm.reward,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// spawnPack — gera o grupo de inimigos da wave atual
// ═══════════════════════════════════════════════════════════════════════

function spawnPack(s) {
  var boss = isBossWave(s.wave, s.difficulty);
  var n    = packSizeFor(s.difficulty, s.wave, boss);

  s.enemies = [];

  if (boss) {
    // Boss é sempre sozinho.
    s.enemies.push(makeEnemy(s));
    return s.enemies;
  }

  // Gera o pack base.
  for (var i = 0; i < n; i++) {
    var enemy = makeEnemy(s);
    s.enemies.push(enemy);

    // Swarm archetype: adiciona membros extras ao pack (capped pelo max).
    var arch = ARCHETYPES[enemy.archetype];
    if (arch && arch.packBonus > 0) {
      var max = CONFIG.pack.maxByDifficulty[s.difficulty] || 3;
      for (var j = 0; j < arch.packBonus && s.enemies.length < max; j++) {
        s.enemies.push(makeEnemy(s));
      }
    }
  }

  return s.enemies;
}


// ═══════════════════════════════════════════════════════════════════════
// Shards (drop por kill)
// ═══════════════════════════════════════════════════════════════════════
// Escala com região e powerMult (substitui antigo dropMult).

function shardsOnKill(regionIdx, diffIdx, isBoss) {
  var n = Math.floor(CONFIG.shards.basePerKill + regionIdx * CONFIG.shards.perRegion);
  n = Math.round(n * DIFFICULTIES[diffIdx].powerMult);
  if (isBoss) n *= CONFIG.boss.shardMult;
  return Math.max(1, n);
}


// ═══════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined") {
  module.exports = {
    getRegion, getDifficulty, totalWaves, isBossWave,
    enemyStatsFor, availableEnemies, pickEnemy,
    killsPerWave,
    killsToMasterRegion, regionMasteryKills, isRegionMastered, masteredRegionCount,
    regionMasteryBonus, recordRegionMasteryKill, addRegionMasteryKills,
    isRegionUnlocked, isDifficultyUnlocked, isDifficultyCleared, clearCurrentDifficulty,
    packSizeFor, getEnemyTier, makeEnemy, spawnPack,
    shardsOnKill,
  };
}
