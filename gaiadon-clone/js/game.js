// ===== Game: estado, stats do jogador, loop de combate, ascensão =====
// Módulo de orquestração que combina progression.js + loot.js + zones.js.
// Depende de todos os módulos anteriores via scope global (sem import).

function defaultState() {
  return {
    gold: 0,
    shards: 0,
    level: 1,
    xp: 0,
    ascensions: 0,
    totalKills: 0,

    // World Map state
    region: 0,              // índice em REGIONS
    difficulty: 0,          // índice em DIFFICULTIES
    wave: 1,                // wave atual (1-based)
    killsInWave: 0,         // kills na wave atual

    // Progress: quais dificuldades foram limpas por região.
    // Chave = índice da região. Valor = array de índices de dificuldade limpos.
    // Região "desbloqueada" = tem uma entrada aqui. Plains começa desbloqueada.
    regionProgress: { 0: [] },

    // Equipamento: cada slot guarda { rarity: índice, level }.
    equipped: {
      Weapon: { rarity: 0, level: 1 },
      Armor:  { rarity: 0, level: 1 },
      Amulet: { rarity: 0, level: 1 },
      Ring:   { rarity: 0, level: 1 },
      Gloves: { rarity: 0, level: 1 },
      Helmet: { rarity: 0, level: 1 },
    },

    enemies: [],
    playerHp: null,
    lastSeen: null,

    // Region Mastery: kills acumulados POR REGIÃO — persiste entre ascensões.
    regionMastery: {},
  };
}

// --- Stats do jogador (combinam equipment + progression) ---
function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + (s.level - 1) * damagePerLevel(s);
  base += slotPower(s, "Weapon");
  base *= (1 + affixTotals(s).dmgMult);
  return Math.round(base * totalPowerMult(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + (s.level - 1) * hpPerLevel(s);
  base += slotPower(s, "Armor") * CONFIG.itemStats.healthPerPower;
  base *= (1 + affixTotals(s).hpMult);
  return Math.round(base * totalPowerMult(s));
}
function attackSpeed(s) {
  return CONFIG.player.baseAttackSpeed + slotPower(s, "Amulet") * CONFIG.itemStats.attackSpeedPerPower;
}
function playerDps(s) { return playerDamage(s) * attackSpeed(s) * critExpectedMult(s); }
function goldBonus(s) {
  let b = 1 + slotPower(s, "Amulet") * CONFIG.itemStats.goldFindPerPower;
  b *= (1 + affixTotals(s).goldMult);
  return b * totalPowerMult(s) * regionMasteryBonus(s);
}
function xpMultiplier(s) {
  return totalPowerMult(s) * (1 + affixTotals(s).xpMult) * regionMasteryBonus(s);
}
function shardBonus(s) {
  let b = 1 + slotPower(s, "Ring") * CONFIG.itemStats.shardFindPerPower;
  b *= (1 + affixTotals(s).shardMult);
  return b * totalPowerMult(s) * regionMasteryBonus(s);
}
function bossDmgMult(s) {
  return 1 + slotPower(s, "Helmet") * CONFIG.itemStats.bossDmgPerPower + affixTotals(s).bossDmg;
}

// --- XP / nível do Hero ---
function xpToNext(s) { return Math.round(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, s.level - 1)); }
function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) { s.xp -= xpToNext(s); s.level++; leveled = true; }
  return leveled;
}

// --- Navegação do mapa ---
// Entra numa região+dificuldade. Spawna o pack e cura o jogador.
function enterRegion(s, regionIdx, diffIdx) {
  s.region = regionIdx;
  s.difficulty = diffIdx;
  s.wave = 1;
  s.killsInWave = 0;
  s.enemies = [];
  s.playerHp = playerMaxHp(s);
  spawnPack(s);
}

// Registra o abate de UM inimigo: recompensas + progressão de wave.
function registerKill(s, e) {
  e = e || s.enemies[0];
  const regionAtKill = s.region;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward * xpMultiplier(s));
  s.totalKills++;
  const sh = Math.round(shardsOnKill(s.region, s.difficulty, e.isBoss) * shardBonus(s) * (e.shardMult || 1));
  s.shards += sh;
  s.killsInWave++;

  // Region Mastery: acumula kills permanentes.
  const justMastered = recordRegionMasteryKill(s, regionAtKill);

  const result = {
    type: "kill", name: e.name, tier: e.tier || "normal",
    gold: g, shards: sh, leveled,
    wasBoss: e.isBoss, justMastered,
    masteredRegion: justMastered ? regionAtKill : null,
    waveAdvanced: false, difficultyCleared: false,
    region: s.region, difficulty: s.difficulty,
  };

  if (e.isBoss) {
    // Boss derrotado → limpar dificuldade, desbloquear próximo conteúdo.
    const wasCleared = isDifficultyCleared(s, s.region, s.difficulty);
    clearCurrentDifficulty(s);
    result.difficultyCleared = !wasCleared;
    // Reset para wave 1 (modo farming).
    s.wave = 1;
    s.killsInWave = 0;
  } else if (s.killsInWave >= killsPerWave()) {
    // Wave limpa → avançar.
    s.wave++;
    s.killsInWave = 0;
    result.waveAdvanced = true;
    result.newWave = s.wave;
  }
  // Detecta aumento de pack na nova wave.
  if (result.waveAdvanced) {
    const oldPack = packSizeFor(s.difficulty, s.wave - 1, false);
    const newPack = packSizeFor(s.difficulty, s.wave, isBossWave(s.wave, s.difficulty));
    result.packIncreased = newPack > oldPack;
  }
  return result;
}

// Morte: SEM PUNIÇÃO. Recua para wave 1, cura, recomeça.
// O jogador farma as waves fáceis e tenta de novo.
function handleDeath(s) {
  const diedOnWave = s.wave;
  s.wave = 1;
  s.killsInWave = 0;
  s.enemies = [];
  s.playerHp = playerMaxHp(s);
  return { type: "death", diedOnWave, region: s.region, difficulty: s.difficulty };
}

// Processa dt segundos de combate. Retorna lista de eventos para a UI.
function tick(s, dt) {
  if (!s.enemies || s.enemies.length === 0) spawnPack(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);
  const events = [];

  const target = s.enemies[0];
  let dmgToEnemy = playerDps(s) * dt;
  if (target.isBoss) dmgToEnemy *= bossDmgMult(s);
  target.hp -= dmgToEnemy;
  events.push({ type: "hit", amount: dmgToEnemy });

  // Todos os inimigos vivos atacam ao mesmo tempo.
  const incoming = s.enemies.reduce((a, e) => a + e.dmg, 0) * CONFIG.enemy.damageFactor * dt;
  s.playerHp -= incoming;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnPack(s); return events; }

  if (target.hp <= 0) {
    const ev = registerKill(s, target);
    events.push(ev);
    s.enemies.shift();
    if (s.enemies.length === 0) { s.playerHp = playerMaxHp(s); spawnPack(s); }
  }
  return events;
}

// --- Ascensão (prestígio) ---
function canAscend(s) {
  return s.level >= CONFIG.ascension.firstReqLevel
      && stagesCleared(s) >= ascStagesRequired(s);
}

function getAscensionStatus(s) {
  const tier = heroTier(s);
  const t    = TIERS[tier];
  const nextT = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;
  const isTierPromo = !!(nextT && s.ascensions + 1 === nextT.minAsc);
  const reqStages = ascStagesRequired(s);
  const cleared   = stagesCleared(s);
  return {
    tier,
    tierName: t.name,
    tierMult: t.mult,
    nextTier: nextT,
    isTierPromo,
    canAscend: canAscend(s),
    ascensionNumber: s.ascensions + 1,
    stagesRequired: reqStages,
    stagesCleared: cleared,
    levelReq: CONFIG.ascension.firstReqLevel,
    currentPowerMult: ascMultiplier(s),
    compoundPreview: Math.pow(t.mult, 10),
  };
}

function ascend(s) {
  if (!canAscend(s)) return false;
  const keepAscensions     = s.ascensions + 1;
  const keepEquipped       = s.equipped;
  const keepRegionProgress = s.regionProgress || { 0: [] };
  const keepRegionMastery  = s.regionMastery  || {};
  Object.assign(s, defaultState());
  s.ascensions     = keepAscensions;
  s.equipped       = keepEquipped;
  s.regionProgress = keepRegionProgress;
  s.regionMastery  = keepRegionMastery;
  return true;
}

// Estima os ganhos enquanto offline (fórmula barata, sem rodar ticks).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const stats = enemyStatsFor(s.region, s.difficulty, 1); // wave 1 do local atual
  const ascMult = Math.pow(CONFIG.enemy.ascGrowth, s.ascensions);
  const killsPerSec = playerDps(s) / Math.max(1, stats.hp * ascMult);
  const kills = killsPerSec * seconds * efficiency;
  const gold   = Math.round(kills * stats.gold * goldBonus(s));
  const xp     = Math.round(kills * stats.xp * xpMultiplier(s));
  const shards = Math.round(kills * shardsOnKill(s.region, s.difficulty, false) * shardBonus(s));
  return { seconds, kills: Math.floor(kills), gold, xp, shards, region: s.region };
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState,
    playerDamage, playerMaxHp, attackSpeed, playerDps,
    goldBonus, xpMultiplier, shardBonus, bossDmgMult,
    xpToNext, gainXp,
    enterRegion, registerKill, handleDeath, tick,
    canAscend, getAscensionStatus, ascend,
    computeOfflineGains,
  };
}
