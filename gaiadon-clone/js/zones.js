// ===== Maps & Subáreas: escala de inimigos, archetypes, mastery (DESIGN §16) =====
// 5 mapas × 5 subáreas, open-zone (spawn contínuo). HP cresce por subárea:
//   hp(map, sub) = baseHp × subareaRamp^(map×subareasPerMap + sub)
// O chefe da subárea aparece após killsToBoss kills (trigger oculto); derrotá-lo
// avança a subárea. O chefe da Subárea 5 é o chefe final do mapa → Ascensão.
// Depende de data.js (CONFIG, REGIONS, SUBAREAS, ARCHETYPES).

// --- Helpers de mapa/subárea ---
function getMap(s)     { return REGIONS[s.map]; }
function getSubarea(s) { return SUBAREAS[s.subarea]; }
function subareasPerMap() { return CONFIG.map.subareasPerMap; }
function lastSubarea() { return CONFIG.map.subareasPerMap - 1; }

// Índice global da subárea (0..24) — define a posição na curva de HP.
function subareaGlobalIndex(mapIdx, subIdx) {
  return mapIdx * CONFIG.map.subareasPerMap + subIdx;
}

// O chefe da subárea está disponível? (após killsToBoss kills nela)
function isBossReady(s) {
  return (s.killsInSub || 0) >= CONFIG.map.killsToBoss;
}


// ═══════════════════════════════════════════════════════════════════════
// Enemy Stats — escala geométrica por subárea
// ═══════════════════════════════════════════════════════════════════════
function enemyStatsFor(mapIdx, subIdx) {
  const M = CONFIG.map;
  const E = CONFIG.enemy;
  const hp = Math.round(M.baseHp * Math.pow(M.subareaRamp, subareaGlobalIndex(mapIdx, subIdx)));
  return {
    hp:   hp,
    dmg:  Math.max(1, Math.round(hp * E.dmgRatio)),
    gold: Math.max(1, Math.round(hp * E.goldRatio)),
    xp:   Math.max(1, Math.round(hp * E.xpRatio)),
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Inimigos disponíveis — open-zone: todos do mapa, sorteio uniforme
// ═══════════════════════════════════════════════════════════════════════
function pickEnemy(mapIdx) {
  var pool = REGIONS[mapIdx].enemies;
  if (!pool || pool.length === 0) pool = [{ name: "Eidolon", archetype: "standard", emoji: "👤" }];
  return pool[Math.floor(Math.random() * pool.length)];
}


// ═══════════════════════════════════════════════════════════════════════
// Map Mastery (permanente entre ascensões)
// ═══════════════════════════════════════════════════════════════════════
function killsToMasterMap(mapIdx) {
  return CONFIG.mastery.killsBase + mapIdx * CONFIG.mastery.killsPerMap;
}
function mapMasteryKills(s, mapIdx) {
  return (s.mapMastery || {})[mapIdx] || 0;
}
function isMapMastered(s, mapIdx) {
  return mapMasteryKills(s, mapIdx) >= killsToMasterMap(mapIdx);
}
function masteredMapCount(s) {
  if (!s.mapMastery) return 0;
  var n = 0;
  for (var i = 0; i < REGIONS.length; i++) if (isMapMastered(s, i)) n++;
  return n;
}
function mapMasteryBonus(s) {
  return 1 + masteredMapCount(s) * CONFIG.mastery.bonusPerMap;
}
function recordMapMasteryKill(s, mapIdx) {
  if (!s.mapMastery) s.mapMastery = {};
  var wasMastered = isMapMastered(s, mapIdx);
  s.mapMastery[mapIdx] = (s.mapMastery[mapIdx] || 0) + 1;
  return !wasMastered && isMapMastered(s, mapIdx);
}
function addMapMasteryKills(s, mapIdx, count) {
  if (!s.mapMastery) s.mapMastery = {};
  s.mapMastery[mapIdx] = (s.mapMastery[mapIdx] || 0) + count;
}


// ═══════════════════════════════════════════════════════════════════════
// Unlock & progresso de mapa/subárea (linear)
// ═══════════════════════════════════════════════════════════════════════
// s.mapProgress[mapIdx] = maior subárea cujo chefe foi derrotado (-1 = nenhuma).
function maxSubareaCleared(s, mapIdx) {
  var p = (s.mapProgress || {})[mapIdx];
  return p === undefined ? -1 : p;
}
function isSubareaCleared(s, mapIdx, subIdx) {
  return maxSubareaCleared(s, mapIdx) >= subIdx;
}
// Mapa desbloqueado = mapa 0 sempre, ou o chefe final do mapa anterior derrotado.
function isMapUnlocked(s, mapIdx) {
  if (mapIdx === 0) return true;
  return maxSubareaCleared(s, mapIdx - 1) >= lastSubarea();
}
// Marca o chefe da subárea atual como derrotado e avança a posição.
function clearCurrentSubarea(s) {
  if (!s.mapProgress) s.mapProgress = {};
  if (maxSubareaCleared(s, s.map) < s.subarea) s.mapProgress[s.map] = s.subarea;
  s.killsInSub = 0;
  if (s.subarea < lastSubarea()) {
    s.subarea++;                       // avança dentro do mapa
  } else if (s.map < REGIONS.length - 1) {
    s.map++; s.subarea = 0;            // chefe final → avança para o próximo mapa
  }
  // (Ascensão é separada: power-up via convergences + Vestiges, não muda de mapa.)
}


// ═══════════════════════════════════════════════════════════════════════
// Pack size (cresce com a subárea)
// ═══════════════════════════════════════════════════════════════════════
function packSizeFor(subIdx, isBoss) {
  if (isBoss) return 1;
  var P = CONFIG.pack;
  return P.maxBySubarea[subIdx] ? P.baseBySubarea[subIdx] : (P.baseBySubarea[0] || 1);
}


// ═══════════════════════════════════════════════════════════════════════
// Enemy tier (normal / elite / champion) — chance escala com a subárea
// ═══════════════════════════════════════════════════════════════════════
function getEnemyTier(subIdx) {
  var E = CONFIG.elite;
  if (subIdx >= E.championMinSubarea && Math.random() < E.championChance) return "champion";
  if (subIdx >= E.eliteMinSubarea    && Math.random() < E.eliteChance)    return "elite";
  return "normal";
}


// ═══════════════════════════════════════════════════════════════════════
// makeEnemy — cria UM inimigo (boss da subárea ou regular)
// ═══════════════════════════════════════════════════════════════════════
function makeEnemy(s) {
  var map   = REGIONS[s.map];
  var stats = enemyStatsFor(s.map, s.subarea);
  var E     = CONFIG.enemy;
  var C     = CONFIG.combat;

  // Escala com ascensões (0-4): HP e DMG × ascGrowth por ascensão.
  var ascMult = Math.pow(E.ascGrowth, s.ascensions);

  // --- CHEFE DA SUBÁREA ---
  if (isBossReady(s)) {
    var B  = CONFIG.boss;
    var isFinal = s.subarea >= lastSubarea();
    var bossName = isFinal && map.boss ? map.boss.name : (map.name + " Warden " + (s.subarea + 1));
    var bossEmoji = isFinal && map.boss ? map.boss.emoji : "👑";
    var bossHp = Math.round(stats.hp * ascMult * B.hpMult);
    if (typeof passiveTotals === "function" && s.passives) {
      var _wpr = passiveTotals(s).enemyHpReduct;
      if (_wpr > 0) bossHp = Math.max(1, Math.round(bossHp * (1 - Math.min(0.9, _wpr))));
    }
    var bossCrit = C.bossCritChanceMin + Math.random() * (C.bossCritChanceMax - C.bossCritChanceMin);
    return {
      name: bossName, emoji: bossEmoji,
      isBoss: true, isFinalBoss: isFinal,
      tier: "normal", archetype: "standard",
      hp: bossHp, maxHp: bossHp,
      dmg: Math.round(stats.dmg * ascMult),
      goldReward: Math.round(stats.gold * B.goldMult),
      xpReward:   Math.round(stats.xp   * B.xpMult),
      shardMult:  B.shardMult,
      critChance: bossCrit,
    };
  }

  // --- INIMIGO REGULAR ---
  var enemyDef = pickEnemy(s.map);
  var arch     = ARCHETYPES[enemyDef.archetype] || ARCHETYPES.standard;
  var tierKey  = getEnemyTier(s.subarea);
  var tm       = CONFIG.elite.tiers[tierKey];

  var finalHp  = Math.max(1, Math.round(stats.hp  * arch.hp  * tm.hp  * ascMult));
  var finalDmg = Math.max(1, Math.round(stats.dmg * arch.dmg * tm.dmg * ascMult));

  if (typeof passiveTotals === "function" && s.passives) {
    var _wpr2 = passiveTotals(s).enemyHpReduct;
    if (_wpr2 > 0) finalHp = Math.max(1, Math.round(finalHp * (1 - Math.min(0.9, _wpr2))));
  }

  var goldReward = Math.max(1, Math.round(stats.gold * arch.reward * tm.reward));
  var xpReward   = Math.max(1, Math.round(stats.xp   * arch.reward * tm.reward));
  var enemyCrit  = C.enemyCritChanceMin + Math.random() * (C.enemyCritChanceMax - C.enemyCritChanceMin);

  return {
    name: enemyDef.name, emoji: enemyDef.emoji,
    isBoss: false, tier: tierKey, archetype: enemyDef.archetype,
    hp: finalHp, maxHp: finalHp,
    dmg: finalDmg,
    goldReward: goldReward, xpReward: xpReward,
    shardMult: tm.reward,
    critChance: enemyCrit,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// spawnPack — grupo de inimigos atual
// ═══════════════════════════════════════════════════════════════════════
function spawnPack(s) {
  var boss = isBossReady(s);
  var n    = packSizeFor(s.subarea, boss);
  s.enemies = [];

  if (boss) { s.enemies.push(makeEnemy(s)); return s.enemies; }

  for (var i = 0; i < n; i++) {
    var enemy = makeEnemy(s);
    s.enemies.push(enemy);
    var arch = ARCHETYPES[enemy.archetype];
    if (arch && arch.packBonus > 0) {
      var max = CONFIG.pack.maxBySubarea[s.subarea] || 3;
      for (var j = 0; j < arch.packBonus && s.enemies.length < max; j++) s.enemies.push(makeEnemy(s));
    }
  }
  return s.enemies;
}


// ═══════════════════════════════════════════════════════════════════════
// Vestiges (drop por kill) — escala com mapa + subárea
// ═══════════════════════════════════════════════════════════════════════
function shardsOnKill(mapIdx, subIdx, isBoss) {
  var n = Math.floor(CONFIG.shards.basePerKill + mapIdx * CONFIG.shards.perMap + subIdx * CONFIG.shards.perSubarea);
  if (isBoss) n *= CONFIG.boss.shardMult;
  return Math.max(1, n);
}


// ═══════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════
if (typeof module !== "undefined") {
  module.exports = {
    getMap, getSubarea, subareasPerMap, lastSubarea, subareaGlobalIndex, isBossReady,
    enemyStatsFor, pickEnemy,
    killsToMasterMap, mapMasteryKills, isMapMastered, masteredMapCount,
    mapMasteryBonus, recordMapMasteryKill, addMapMasteryKills,
    maxSubareaCleared, isSubareaCleared, isMapUnlocked, clearCurrentSubarea,
    packSizeFor, getEnemyTier, makeEnemy, spawnPack,
    shardsOnKill,
  };
}
