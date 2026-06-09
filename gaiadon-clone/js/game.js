// ===== Game: estado, stats do jogador, loop de combate, ascensão =====
// Módulo de orquestração que combina progression.js + loot.js + zones.js.
// Depende de todos os módulos anteriores via scope global (sem import).

function defaultState() {
  return {
    lumens: 0,
    vestiges: 0,
    level: 1,
    xp: 0,
    ascensions: 0,         // 0-1000: motor geométrico tiered (Ordre)
    convergences: 0,       // total de convergences (nunca reseta a contagem)
    convsSinceAsc: 0,      // convergences desde a última ascensão (gate da próxima)
    totalKills: 0,

    // Map/Subárea state (DESIGN §16)
    map: 0,                 // índice em REGIONS (mapa atual)
    subarea: 0,             // 0-4: subárea atual dentro do mapa
    killsInSub: 0,          // kills na subárea atual (trigger oculto do chefe)

    // Progresso: maior subárea cujo chefe foi derrotado, por mapa.
    // Chave = índice do mapa. Valor = índice da subárea (-1 = nenhuma; ausente = idem).
    mapProgress: {},

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

    // Map Mastery: kills acumulados POR MAPA — persiste entre ascensões.
    mapMastery: {},
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
// Renda DESACOPLADA do poder (não multiplica por totalPowerMult): escala só com a
// profundidade (HP do inimigo, via goldReward) + investimentos diretos (gear find, stats).
function goldBonus(s) {
  let b = 1 + slotPower(s, "Amulet") * CONFIG.itemStats.goldFindPerPower;
  b *= (1 + affixTotals(s).goldMult);
  b *= (1 + goldStatBonus(s, "frt"));        // FRT: +5% gold per level
  b = b * mapMasteryBonus(s);
  if (typeof passiveTotals === "function") {
    const _pt = passiveTotals(s);
    b *= (1 + _pt.lumensMult);
    b *= (1 + _pt.rewardMult);
  }
  return b;
}
function xpMultiplier(s) {
  var base = (1 + affixTotals(s).xpMult) * mapMasteryBonus(s);
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
  b = b * mapMasteryBonus(s);
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
// Entra num mapa+subárea. Spawna o pack e cura o jogador.
function enterMap(s, mapIdx, subIdx) {
  s.map = mapIdx;
  s.subarea = subIdx || 0;
  s.killsInSub = 0;
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
function materialDropFor(e, mapIdx) {
  if (e.isBoss) {
    const m = MAP_MATERIALS[mapIdx];
    return m ? m.id : null;
  }
  if (e.tier === "champion") return "voidDust";
  if (e.tier === "elite")    return "paleFragment";
  return "dimShard";
}

function registerKill(s, e) {
  e = e || s.enemies[0];
  const mapAtKill = s.map;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.lumens += g;
  const leveled = gainXp(s, e.xpReward * xpMultiplier(s));
  s.totalKills++;
  const sh = Math.round(shardsOnKill(s.map, s.subarea, e.isBoss) * shardBonus(s) * (e.shardMult || 1));
  s.vestiges += sh;
  s.killsInSub++;

  // Materiais (Fase 4): drop ESCASSO — chefe sempre dropa; kill regular por chance.
  let matId = null;
  if (e.isBoss || Math.random() < CONFIG.map.materialDropChance) {
    matId = materialDropFor(e, mapAtKill);
    addMaterial(s, matId, 1);
  }

  // Map Mastery: acumula kills permanentes.
  const justMastered = recordMapMasteryKill(s, mapAtKill);

  const result = {
    type: "kill", name: e.name, tier: e.tier || "normal",
    lumens: g, vestiges: sh, material: matId, leveled,
    wasBoss: e.isBoss, isFinalBoss: !!e.isFinalBoss, justMastered,
    masteredMap: justMastered ? mapAtKill : null,
    subareaAdvanced: false, mapCleared: false,
    map: s.map, subarea: s.subarea,
  };

  if (e.isBoss) {
    s.bossKills = (s.bossKills || 0) + 1;
    const wasFinal = e.isFinalBoss; // chefe da Subárea 5 → habilita Ascensão
    const fromSub = s.subarea;
    clearCurrentSubarea(s);          // marca progresso e avança a subárea
    result.subareaAdvanced = !wasFinal;
    result.mapCleared = wasFinal;    // mapa limpo → canAscend libera
    result.newSubarea = s.subarea;
    result.clearedSubarea = fromSub;
  }
  return result;
}

// Morte: SEM PUNIÇÃO. Zera o progresso de kills da subárea, cura, recomeça.
function handleDeath(s) {
  const diedOnSubarea = s.subarea;
  s.killsInSub = 0;
  // Recua uma subárea (conteúdo sobrevivível) para regrindar/convergir e voltar.
  if (s.subarea > 0) s.subarea--;
  s.enemies = [];
  s.playerHp = playerMaxHp(s);
  return { type: "death", diedOnSubarea, retreatedTo: s.subarea, map: s.map };
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
// Soft trigger: livre acima de CONFIG.convergence.minLevel (exige nível a sacrificar).
// Reseta: level, xp, lumens, goldStats, totalKills, bossKills, killsInSub.
// Mantém: equipped, mapProgress, mapMastery, posição no mapa (map/subarea),
// passives, materials, totalVestgesSpent, ascensions e convergences (DESIGN §14:
// "progresso de mapa permanece"). Cada convergência compõe o multiplicador permanente.

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
  const keep = {
    convergences:      (s.convergences || 0) + 1,
    convsSinceAsc:     (s.convsSinceAsc || 0) + 1,  // conta p/ a próxima ascensão
    ascensions:        s.ascensions || 0,
    map:               s.map,
    subarea:           s.subarea,
    mapProgress:       s.mapProgress || {},
    mapMastery:        s.mapMastery  || {},
    equipped:          s.equipped,
    passives:          s.passives || {},
    materials:         s.materials || {},
    totalVestgesSpent: s.totalVestgesSpent || 0,
  };
  Object.assign(s, defaultState());
  Object.assign(s, keep);
  return true;
}

// Custo da próxima ascensão em Vestiges (crescente).
function ascCost(s) {
  const A = CONFIG.ascension;
  return Math.ceil(A.vestBase * Math.pow(A.vestGrowth, s.ascensions || 0));
}

// Ascensão = power-up permanente (motor geométrico). Exige X convergences (desde a
// última ascensão) + Vestiges. NÃO reseta mapa, gear nem nível — só consome e dá o ×UP.
function canAscend(s) {
  return (s.ascensions || 0) < CONFIG.ascension.maxAscensions
      && (s.convsSinceAsc || 0) >= CONFIG.ascension.convPerAsc
      && s.vestiges >= ascCost(s);
}

function getAscensionStatus(s) {
  const tier  = heroTier(s);
  const t     = TIERS[tier];
  const nextT = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;
  const A     = CONFIG.ascension;
  return {
    tier,
    tierName: t.name,
    nextTier: nextT,
    nextTierName: nextT ? nextT.name : null,
    isMaxTier: !nextT,
    canAscend: canAscend(s),
    ascensions: s.ascensions || 0,
    maxAscensions: A.maxAscensions,
    convsSinceAsc: s.convsSinceAsc || 0,
    convPerAsc: A.convPerAsc,
    vestCost: ascCost(s),
    haveVestiges: s.vestiges,
    currentPowerMult: ascMultiplier(s),
    nextPowerMult: ascMultiplier({ ascensions: (s.ascensions || 0) + 1 }),
  };
}

function ascend(s) {
  if (!canAscend(s)) return false;
  s.vestiges -= ascCost(s);
  s.ascensions = (s.ascensions || 0) + 1;
  s.convsSinceAsc = 0;
  return true;
}

// Estima os ganhos enquanto offline (fórmula barata, sem rodar ticks).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const stats = enemyStatsFor(s.map, s.subarea); // subárea atual
  const ascMult = Math.pow(CONFIG.enemy.ascGrowth, s.ascensions);
  const killsPerSec = playerDps(s) / Math.max(1, stats.hp * ascMult);
  const passiveOfflineEff = typeof passiveTotals === "function" ? passiveTotals(s).offlineEff : 0;
  const effectiveEfficiency = Math.min(1.0, efficiency + passiveOfflineEff);
  const kills = killsPerSec * seconds * effectiveEfficiency;
  const lumens   = Math.round(kills * stats.gold * goldBonus(s));
  const xp       = Math.round(kills * stats.xp * xpMultiplier(s));
  const vestiges = Math.round(kills * shardsOnKill(s.map, s.subarea, false) * shardBonus(s));
  return { seconds, kills: Math.floor(kills), lumens, xp, vestiges, map: s.map };
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState,
    goldStatCost, goldStatBonus, buyGoldStat, buyGoldStatMax, buyGoldStatMaxPreview,
    playerDamage, playerMaxHp, atkSpeedRaw, attackSpeed, playerDps,
    playerDefense, defenseReduction, hpRegenPerSec,
    goldBonus, xpMultiplier, shardBonus, bossDmgMult,
    xpToNext, gainXp,
    enterMap, registerKill, handleDeath, tick,
    addMaterial, materialDropFor,
    canConverge, getConvergenceStatus, converge,
    canAscend, getAscensionStatus, ascend, ascCost,
    computeOfflineGains,
  };
}
