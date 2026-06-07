// ===== Regions: inimigos, waves, packs, mastery, desbloqueio =====
// Tudo sobre o mundo e seus habitantes. Depende de data.js (CONFIG, REGIONS,
// DIFFICULTIES) e progression.js (totalPowerMult para calibração).

// --- Helpers de região/dificuldade ---
function getRegion(s)     { return REGIONS[s.region]; }
function getDifficulty(s) { return DIFFICULTIES[s.difficulty]; }
function totalWaves(diffIdx) { return DIFFICULTIES[diffIdx].waves; }
function isBossWave(wave, diffIdx) { return wave >= totalWaves(diffIdx); }

// --- Escala de inimigos (por região + dificuldade + wave) ---
function enemyStatsFor(regionIdx, diffIdx, wave) {
  const region = REGIONS[regionIdx];
  const diff   = DIFFICULTIES[diffIdx];
  const E      = CONFIG.enemy;
  const waveMult = Math.pow(E.waveGrowth, wave - 1);
  const power    = region.basePower * waveMult;
  return {
    hp:   Math.round(power * E.hpFactor   * diff.statMult),
    dmg:  Math.round(power * E.dmgFactor  * diff.statMult),
    gold: Math.round(power * E.goldFactor * diff.dropMult),
    xp:   Math.round(power * E.xpFactor   * diff.dropMult),
  };
}

// --- Kills por wave (flat) ---
function killsPerWave() { return CONFIG.wave.killsPerWave; }

// --- Region Mastery ---
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
  let n = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    if (isRegionMastered(s, i)) n++;
  }
  return n;
}
// Bônus de eficiência econômica por regiões masterizadas.
function regionMasteryBonus(s) {
  return 1 + masteredRegionCount(s) * CONFIG.mastery.bonusPerRegion;
}
// Registra 1 kill no mastery permanente. Retorna true se ACABOU DE masterizar.
function recordRegionMasteryKill(s, regionIdx) {
  if (!s.regionMastery) s.regionMastery = {};
  const wasMastered = isRegionMastered(s, regionIdx);
  s.regionMastery[regionIdx] = (s.regionMastery[regionIdx] || 0) + 1;
  return !wasMastered && isRegionMastered(s, regionIdx);
}
// Adiciona kills em bloco (para offline gains).
function addRegionMasteryKills(s, regionIdx, count) {
  if (!s.regionMastery) s.regionMastery = {};
  s.regionMastery[regionIdx] = (s.regionMastery[regionIdx] || 0) + count;
}

// --- Region/Difficulty unlock & clear ---
function isRegionUnlocked(s, regionIdx) {
  return regionIdx.toString() in (s.regionProgress || {});
}
function isDifficultyUnlocked(s, regionIdx, diffIdx) {
  if (!isRegionUnlocked(s, regionIdx)) return false;
  if (diffIdx === 0) return true;
  const cleared = s.regionProgress[regionIdx] || [];
  return cleared.includes(diffIdx - 1);
}
function isDifficultyCleared(s, regionIdx, diffIdx) {
  const cleared = (s.regionProgress || {})[regionIdx] || [];
  return cleared.includes(diffIdx);
}

// Marca a dificuldade atual como limpa e desbloqueia o próximo conteúdo.
function clearCurrentDifficulty(s) {
  if (!s.regionProgress) s.regionProgress = { 0: [] };
  const progress = s.regionProgress[s.region] || [];
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

// --- Pack size (baseado em dificuldade + wave) ---
function packSizeFor(diffIdx, wave, isBoss) {
  if (isBoss) return 1;
  const P = CONFIG.pack;
  const base = P.baseByDifficulty[diffIdx] || 1;
  const max  = P.maxByDifficulty[diffIdx]  || 3;
  return Math.min(max, base + Math.floor((wave - 1) / P.growthPerWave));
}

// Sorteia o tier de um inimigo (normal / elite / champion).
// Depende da dificuldade: Normal = sem especiais, Hard = elites, Nightmare = elites + champions.
function getEnemyTier(diffIdx) {
  const E = CONFIG.elite;
  if (diffIdx >= E.championMinDifficulty && Math.random() < E.championChance) return "champion";
  if (diffIdx >= E.eliteMinDifficulty    && Math.random() < E.eliteChance)    return "elite";
  return "normal";
}

// Cria UM inimigo (ou Boss) para o estado atual do jogador.
function makeEnemy(s) {
  const region = REGIONS[s.region];
  const stats  = enemyStatsFor(s.region, s.difficulty, s.wave);
  const E      = CONFIG.enemy;

  // Escala com ascensões: HP e DMG crescem 6% por ascensão.
  const ascMult  = Math.pow(E.ascGrowth, s.ascensions);
  let hpFinal  = Math.round(stats.hp  * ascMult);
  let dmgFinal = Math.round(stats.dmg * ascMult);

  if (isBossWave(s.wave, s.difficulty)) {
    const B  = CONFIG.boss;
    const hp = hpFinal * B.hpMult;
    return { name: region.boss, isBoss: true, tier: "normal",
             hp, maxHp: hp, dmg: dmgFinal,
             goldReward: stats.gold * B.goldMult, xpReward: stats.xp * B.xpMult,
             shardMult: B.shardMult };
  }

  // Elite & Champion spawn.
  const tierKey = getEnemyTier(s.difficulty);
  const tm      = CONFIG.elite.tiers[tierKey];
  const name    = region.enemies[Math.floor(Math.random() * region.enemies.length)];
  const finalHp  = Math.round(hpFinal  * tm.hp);
  const finalDmg = Math.round(dmgFinal * tm.dmg);
  return { name, isBoss: false, tier: tierKey,
           hp: finalHp, maxHp: finalHp, dmg: finalDmg,
           goldReward: Math.round(stats.gold * tm.reward),
           xpReward:   Math.round(stats.xp   * tm.reward),
           shardMult:  tm.reward };
}

// Spawna um pack novo na wave atual.
function spawnPack(s) {
  const boss = isBossWave(s.wave, s.difficulty);
  const n = packSizeFor(s.difficulty, s.wave, boss);
  s.enemies = [];
  for (let i = 0; i < n; i++) s.enemies.push(makeEnemy(s));
  return s.enemies;
}

// --- Shards (drop) ---
function shardsOnKill(regionIdx, diffIdx, isBoss) {
  let n = Math.floor(CONFIG.shards.basePerKill + regionIdx * CONFIG.shards.perRegion);
  n = Math.round(n * DIFFICULTIES[diffIdx].dropMult);
  if (isBoss) n *= CONFIG.boss.shardMult;
  return Math.max(1, n);
}

if (typeof module !== "undefined") {
  module.exports = {
    getRegion, getDifficulty, totalWaves, isBossWave,
    enemyStatsFor, killsPerWave,
    killsToMasterRegion, regionMasteryKills, isRegionMastered, masteredRegionCount,
    regionMasteryBonus, recordRegionMasteryKill, addRegionMasteryKills,
    isRegionUnlocked, isDifficultyUnlocked, isDifficultyCleared, clearCurrentDifficulty,
    packSizeFor, getEnemyTier, makeEnemy, spawnPack,
    shardsOnKill,
  };
}
