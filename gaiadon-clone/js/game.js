// ===== Game: estado, stats do jogador, loop de combate, ascensão =====
// Módulo de orquestração que combina progression.js + loot.js + zones.js.
// Depende de todos os módulos anteriores via scope global (sem import).

function defaultState() {
  return {
    lumens: 0,
    vestiges: 0,
    level: 1,
    xp: 0,
    ascensions: 0,
    convergences: 0,
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

    // Gold Stats: 6 stats compráveis com gold (resetam na ascensão).
    goldStats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    // Materiais (Fase 4): map de id → quantidade. Insumo de craft/upgrade.
    materials: {},

    // Passives (Fase 3): map de id → level (nunca reseta).
    passives: {},
    // Kills de boss neste ascend (reseta no ascend).
    bossKills: 0,
    // Total gasto em vestiges (persiste sempre).
    totalVestgesSpent: 0,

    enemies: [],
    playerHp: null,
    lastSeen: null,

    // Region Mastery: kills acumulados POR REGIÃO — persiste entre ascensões.
    regionMastery: {},
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Gold Stats — 6 stats compráveis com gold
// ═══════════════════════════════════════════════════════════════════════
// Custo: baseCost × (level+1)^exponent
// Bônus: perLevel × level (aditivo, antes dos multiplicadores)
// Resetam na ascensão; futuramente amplificados por Artifacts (Phase 6).

function _goldStatDef(statId) {
  return GOLD_STATS.find(function(g) { return g.id === statId; });
}

function goldStatCost(statId, level) {
  var def = _goldStatDef(statId);
  if (!def) return Infinity;
  return Math.round(def.baseCost * Math.pow(level + 1, def.exponent));
}

function goldStatBonus(s, statId) {
  var def = _goldStatDef(statId);
  if (!def) return 0;
  var level = (s.goldStats && s.goldStats[statId]) || 0;
  return def.perLevel * level;
}

function buyGoldStat(s, statId) {
  var level = (s.goldStats && s.goldStats[statId]) || 0;
  var cost = goldStatCost(statId, level);
  if (s.lumens < cost) return false;
  s.lumens -= cost;
  if (!s.goldStats) s.goldStats = {};
  s.goldStats[statId] = level + 1;
  return true;
}

function buyGoldStatMax(s, statId) {
  var count = 0;
  while (buyGoldStat(s, statId)) count++;
  return count;
}

function buyGoldStatMaxPreview(s, statId) {
  var level = (s.goldStats && s.goldStats[statId]) || 0;
  var budget = s.lumens;
  var count = 0, spent = 0;
  while (true) {
    var cost = goldStatCost(statId, level + count);
    if (spent + cost > budget) break;
    spent += cost;
    count++;
  }
  return { count: count, spent: spent };
}

// --- Stats do jogador (combinam goldStats + equipment + progression) ---
function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + (s.level - 1) * damagePerLevel(s);
  base += slotPower(s, "Weapon");
  base += goldStatBonus(s, "str");            // STR: +2 dmg per level
  base *= (1 + affixTotals(s).dmgMult);
  if (typeof passiveTotals === "function") base *= (1 + passiveTotals(s).dmgMult);
  return Math.round(base * totalPowerMult(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + (s.level - 1) * hpPerLevel(s);
  base += slotPower(s, "Armor") * CONFIG.itemStats.healthPerPower;
  base += goldStatBonus(s, "vit");            // VIT: +10 hp per level
  base *= (1 + affixTotals(s).hpMult);
  const _pt = typeof passiveTotals === "function" ? passiveTotals(s) : null;
  if (_pt && _pt.voidEnduranceBonus > 0) base *= (1 + _pt.voidEnduranceBonus);
  return Math.round(base * totalPowerMult(s));
}
// Stat bruto (soma linear de fontes). Entrada para a fórmula de atk speed.
function atkSpeedRaw(s) {
  return CONFIG.player.baseAttackSpeed
    + slotPower(s, "Amulet") * CONFIG.itemStats.attackSpeedPerPower
    + goldStatBonus(s, "agi");
}
// Ataques por segundo: min(cap, √rawAtkSpeed × fator). Crescimento sublinear intencional.
function attackSpeed(s) {
  const C = CONFIG.combat;
  return Math.min(C.attackSpeedCap, Math.sqrt(atkSpeedRaw(s)) * C.attackSpeedFactor);
}

// ── Defesa & Regen ──────────────────────────────────────────────────────
// playerDefense: voidEnduranceBonus × 100 (passiva Fase 3).
function playerDefense(s) {
  if (typeof passiveTotals !== "function") return 0;
  return passiveTotals(s).voidEnduranceBonus * 100;
}
// Redução logarítmica: nunca chega a 100% (jogador nunca fica imortal).
function defenseReduction(defense) {
  return Math.min(0.9, Math.log10(defense + 1) / 10);
}
// Regen base por segundo: level × regenPerLevel. Sempre ativo.
function hpRegenPerSec(s) {
  return s.level * CONFIG.combat.regenPerLevel;
}
function playerDps(s) { return playerDamage(s) * attackSpeed(s) * critExpectedMult(s); }
function goldBonus(s) {
  let b = 1 + slotPower(s, "Amulet") * CONFIG.itemStats.goldFindPerPower;
  b *= (1 + affixTotals(s).goldMult);
  b *= (1 + goldStatBonus(s, "frt"));        // FRT: +5% gold per level
  b = b * totalPowerMult(s) * regionMasteryBonus(s);
  if (typeof passiveTotals === "function") {
    const _pt = passiveTotals(s);
    b *= (1 + _pt.lumensMult);
    b *= (1 + _pt.rewardMult);
  }
  return b;
}
function xpMultiplier(s) {
  var base = totalPowerMult(s) * (1 + affixTotals(s).xpMult) * regionMasteryBonus(s);
  base = base * (1 + goldStatBonus(s, "wis")); // WIS: +5% xp per level
  if (typeof passiveTotals === "function") {
    const _pt = passiveTotals(s);
    base *= (1 + _pt.xpMult);
    base *= (1 + _pt.rewardMult);
  }
  return base;
}
function shardBonus(s) {
  let b = 1 + slotPower(s, "Ring") * CONFIG.itemStats.shardFindPerPower;
  b *= (1 + affixTotals(s).shardMult);
  b = b * totalPowerMult(s) * regionMasteryBonus(s);
  if (typeof passiveTotals === "function") {
    const _pt = passiveTotals(s);
    b *= (1 + _pt.vestigeMult);
    b *= (1 + _pt.rewardMult);
  }
  return b;
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
// Materiais (Fase 4): adiciona quantidade ao inventário.
function addMaterial(s, id, qty) {
  if (!id) return;
  if (!s.materials) s.materials = {};
  s.materials[id] = (s.materials[id] || 0) + qty;
}

// Qual material um inimigo dropa: chefe → material do mapa; senão pelo tier.
function materialDropFor(e, regionIdx) {
  if (e.isBoss) {
    const m = MAP_MATERIALS[regionIdx];
    return m ? m.id : null;
  }
  if (e.tier === "champion") return "voidDust";
  if (e.tier === "elite")    return "paleFragment";
  return "dimShard";
}

function registerKill(s, e) {
  e = e || s.enemies[0];
  const regionAtKill = s.region;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.lumens += g;
  const leveled = gainXp(s, e.xpReward * xpMultiplier(s));
  s.totalKills++;
  const sh = Math.round(shardsOnKill(s.region, s.difficulty, e.isBoss) * shardBonus(s) * (e.shardMult || 1));
  s.vestiges += sh;
  s.killsInWave++;

  // Materiais (Fase 4): drop conforme tier do inimigo / chefe.
  const matId = materialDropFor(e, regionAtKill);
  addMaterial(s, matId, 1);

  // Region Mastery: acumula kills permanentes.
  const justMastered = recordRegionMasteryKill(s, regionAtKill);

  const result = {
    type: "kill", name: e.name, tier: e.tier || "normal",
    lumens: g, vestiges: sh, material: matId, leveled,
    wasBoss: e.isBoss, justMastered,
    masteredRegion: justMastered ? regionAtKill : null,
    waveAdvanced: false, difficultyCleared: false,
    region: s.region, difficulty: s.difficulty,
  };

  if (e.isBoss) {
    s.bossKills = (s.bossKills || 0) + 1;
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

  // ── Player ataca o alvo principal ──
  const target = s.enemies[0];
  const _tickPt = typeof passiveTotals === "function" ? passiveTotals(s) : null;
  let dmgToEnemy = playerDps(s) * dt;
  if (target.isBoss) dmgToEnemy *= bossDmgMult(s);
  // Last Light: bônus de dano quando HP < 30%.
  if (_tickPt && _tickPt.lastLightDmg > 0 && s.playerHp != null && playerMaxHp(s) > 0) {
    if (s.playerHp / playerMaxHp(s) < 0.30) dmgToEnemy *= (1 + _tickPt.lastLightDmg);
  }
  target.hp -= dmgToEnemy;

  // Tier de crit para visual (normal / crit / radiant).
  const critR = critRate(s);
  const didCrit = critR > 0 && Math.random() < critR;
  const critTier = didCrit
    ? (critMult(s) >= CONFIG.combat.radiantCritThreshold ? "radiant" : "crit")
    : "normal";
  events.push({ type: "hit", amount: dmgToEnemy, critTier });

  // ── Inimigos atacam o jogador (com possível crit + redução de defesa) ──
  const reduction = defenseReduction(playerDefense(s));
  let incoming = 0;
  for (const e of s.enemies) {
    let dmg = e.dmg * CONFIG.enemy.damageFactor * dt;
    if (e.critChance > 0 && Math.random() < e.critChance) {
      dmg *= e.isBoss ? CONFIG.combat.bossCritMult : CONFIG.combat.enemyCritMult;
    }
    // Nihel's Shadow: reduz dano recebido.
    if (_tickPt && _tickPt.enemyDmgReduct > 0) dmg *= (1 - _tickPt.enemyDmgReduct);
    incoming += dmg * (1 - reduction);
  }
  s.playerHp -= incoming;

  // ── HP Regen — 3 fontes (base, amplifier, per-kill via afixos futuros) ──
  s.playerHp = Math.min(playerMaxHp(s), s.playerHp + hpRegenPerSec(s) * dt);

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
// ═══════════════════════════════════════════════════════════════════════
// Convergence — lightweight rebirth nested inside ascensions
// ═══════════════════════════════════════════════════════════════════════
// Soft trigger: livre a qualquer momento acima de CONFIG.convergence.minLevel
// (sem gate de boss/recurso, mas exige progresso de nível a sacrificar — senão
// converger no piso seria grátis e renderia poder infinito por spam).
// Reseta: level, xp, lumens, goldStats, totalKills, bossKills e posição no mapa
// (region/difficulty/wave/killsInWave).
// Mantém: equipped, regionProgress, regionMastery, passives, totalVestgesSpent,
// ascensions e convergences. Cada convergência compõe um multiplicador
// permanente de poder via convergenceMult().

function canConverge(s) {
  return s.level >= CONFIG.convergence.minLevel;
}

function getConvergenceStatus(s) {
  const n       = s.convergences || 0;
  const current = convergenceMult(s);
  const next    = convergenceMult({ convergences: n + 1 });
  const gainPct = (next / current - 1) * 100;
  return {
    convergences: n,
    currentMult:  current,
    nextMult:     next,
    gainPct,
    recommended:  convergenceRecommended(s),
    canConverge:  canConverge(s),
    levelReq:     CONFIG.convergence.minLevel,
  };
}

function converge(s) {
  if (!canConverge(s)) return false;
  const keepConvergences   = (s.convergences || 0) + 1;
  const keepAscensions     = s.ascensions;
  const keepEquipped       = s.equipped;
  const keepRegionProgress = s.regionProgress || { 0: [] };
  const keepRegionMastery  = s.regionMastery  || {};
  const keepPassives       = s.passives || {};
  const keepVestgesSpent   = s.totalVestgesSpent || 0;
  const keepMaterials      = s.materials || {};
  Object.assign(s, defaultState());
  s.convergences      = keepConvergences;
  s.ascensions        = keepAscensions;
  s.equipped          = keepEquipped;
  s.regionProgress    = keepRegionProgress;
  s.regionMastery     = keepRegionMastery;
  s.passives          = keepPassives;
  s.totalVestgesSpent = keepVestgesSpent;
  s.materials         = keepMaterials;
  return true;
}

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
  const keepConvergences   = s.convergences || 0;
  const keepEquipped       = s.equipped;
  const keepRegionProgress = s.regionProgress || { 0: [] };
  const keepRegionMastery  = s.regionMastery  || {};
  const keepPassives       = s.passives || {};
  const keepVestgesSpent   = s.totalVestgesSpent || 0;
  const keepMaterials      = s.materials || {};
  Object.assign(s, defaultState());
  s.ascensions        = keepAscensions;
  s.convergences      = keepConvergences;
  s.equipped          = keepEquipped;
  s.regionProgress    = keepRegionProgress;
  s.regionMastery     = keepRegionMastery;
  s.passives          = keepPassives;
  s.totalVestgesSpent = keepVestgesSpent;
  s.materials         = keepMaterials;
  // bossKills NÃO é preservado — reseta por mapa (defaultState já o zera)
  return true;
}

// Estima os ganhos enquanto offline (fórmula barata, sem rodar ticks).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const stats = enemyStatsFor(s.region, s.difficulty, 1); // wave 1 do local atual
  const ascMult = Math.pow(CONFIG.enemy.ascGrowth, s.ascensions);
  const killsPerSec = playerDps(s) / Math.max(1, stats.hp * ascMult);
  const passiveOfflineEff = typeof passiveTotals === "function" ? passiveTotals(s).offlineEff : 0;
  const effectiveEfficiency = Math.min(1.0, efficiency + passiveOfflineEff);
  const kills = killsPerSec * seconds * effectiveEfficiency;
  const lumens   = Math.round(kills * stats.gold * goldBonus(s));
  const xp       = Math.round(kills * stats.xp * xpMultiplier(s));
  const vestiges = Math.round(kills * shardsOnKill(s.region, s.difficulty, false) * shardBonus(s));
  return { seconds, kills: Math.floor(kills), lumens, xp, vestiges, region: s.region };
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState,
    goldStatCost, goldStatBonus, buyGoldStat, buyGoldStatMax, buyGoldStatMaxPreview,
    playerDamage, playerMaxHp, atkSpeedRaw, attackSpeed, playerDps,
    playerDefense, defenseReduction, hpRegenPerSec,
    goldBonus, xpMultiplier, shardBonus, bossDmgMult,
    xpToNext, gainXp,
    enterRegion, registerKill, handleDeath, tick,
    addMaterial, materialDropFor,
    canConverge, getConvergenceStatus, converge,
    canAscend, getAscensionStatus, ascend,
    computeOfflineGains,
  };
}
