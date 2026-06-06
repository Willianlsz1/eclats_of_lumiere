// ===== Zones: inimigos, regiões, mastery, packs =====
// Tudo sobre o mundo e seus habitantes. Depende de data.js (CONFIG, REGIONS,
// ZONE_NAMES) e progression.js (accessibleDepth para calibração de fronteira).
// makeEnemy() também usa playerMaxHp() (de game.js) — resolvido em call-time
// via scope global, sem dependência circular em load-time.

// --- Escala de inimigos (por zone — ver docs/adr/0001) ---
function enemyStats(zone) {
  const E = CONFIG.enemy;
  const d = zone - 1;
  // ── Portões de região (estilo Gaiadon) ────────────────────────────────────
  // A cada CONFIG.zonesPerRegion zonas, todos os stats dos inimigos crescem
  // regionPowerMult×, criando uma parede de progressão entre regiões.
  // Recompensas (gold, xp) escalam proporcionalmente — regiões mais difíceis
  // são mais lucrativas.
  const regionIndex = Math.floor(d / CONFIG.zonesPerRegion);
  const regionMult  = Math.pow(E.regionPowerMult, regionIndex);
  return {
    hp:   Math.round(E.baseHp   * Math.pow(E.hpGrowth,  d) * regionMult),
    dmg:  Math.round(E.baseDmg  * Math.pow(E.dmgGrowth, d) * regionMult),
    gold: Math.round(E.baseGold * Math.pow(E.goldGrowth, d) * regionMult),
    xp:   Math.round(E.baseXp   * Math.pow(E.xpGrowth,  d) * regionMult),
  };
}
function regionFor(zone) {
  const i = Math.floor((zone - 1) / CONFIG.zonesPerRegion) % REGIONS.length;
  return REGIONS[i];
}
function isBossZone(zone) { return zone % CONFIG.boss.everyZones === 0; }
// Retorna o nome narrativo de uma zona (fallback: "Zone X" para zonas além do array).
function zoneName(zone) {
  const name = ZONE_NAMES[zone - 1];
  return name ? name : `Zone ${zone}`;
}

// --- Zone Mastery ---
// Kills necessários para masterizar a zona (cresce linearmente com a profundidade).
function killsToMaster(zone) {
  return CONFIG.mastery.killsBase + (zone - 1) * CONFIG.mastery.killsPerZone;
}
// Kills acumulados do jogador na zona (0 se nunca tocou).
function masteryKills(s, zone) {
  return (s.zoneMastery || {})[zone] || 0;
}
// Verdadeiro se a zona já foi masterizada.
function isZoneMastered(s, zone) {
  return masteryKills(s, zone) >= killsToMaster(zone);
}
// Número de zonas masterizadas (para calcular o bônus total).
// Boss zones são excluídas — têm só 1 kill por visita e a UI não mostra mastery nelas.
function masteredZoneCount(s) {
  if (!s.zoneMastery) return 0;
  let n = 0;
  for (const [z, k] of Object.entries(s.zoneMastery)) {
    const zone = Number(z);
    if (!isBossZone(zone) && k >= killsToMaster(zone)) n++;
  }
  return n;
}
// Bônus de eficiência econômica: +0.5% de gold/xp/shard por zona masterizada.
// NÃO entra em totalPowerMult (para não afetar calibração de fronteira nem custo de gear).
function zoneMasteryBonus(s) {
  return 1 + masteredZoneCount(s) * CONFIG.mastery.bonusPerZone;
}

// --- Zone Progress tracking ---
// Centraliza save/restore de killsInZone no dict zoneProgress.
// Antes isso era feito manualmente em changeZone(), handleDeath() e registerKill().
function saveZoneProgress(s) {
  if (!s.zoneProgress) s.zoneProgress = {};
  s.zoneProgress[s.zone] = s.killsInZone;
}
function restoreZoneProgress(s, zone) {
  s.killsInZone = (s.zoneProgress || {})[zone] || 0;
}
function clearZoneProgress(s, zone) {
  if (!s.zoneProgress) s.zoneProgress = {};
  s.zoneProgress[zone] = 0;
  s.killsInZone = 0;
}
// Registra 1 kill no mastery permanente. Retorna true se ACABOU DE masterizar.
function recordMasteryKill(s, zone) {
  if (!s.zoneMastery) s.zoneMastery = {};
  const wasMastered = isZoneMastered(s, zone);
  s.zoneMastery[zone] = (s.zoneMastery[zone] || 0) + 1;
  return !wasMastered && isZoneMastered(s, zone);
}
// Adiciona kills em bloco ao mastery (para offline gains).
function addMasteryKills(s, zone, count) {
  if (!s.zoneMastery) s.zoneMastery = {};
  s.zoneMastery[zone] = (s.zoneMastery[zone] || 0) + count;
}

// --- Abates e packs ---
// Abates para limpar uma zone — cresce com a profundidade.
function killsToClear(zone) {
  return CONFIG.enemy.killsBase + Math.floor((zone - 1) * CONFIG.enemy.killsPerZone);
}

// Quantos inimigos aparecem juntos numa zone (Boss vem sempre sozinho).
function packSize(zone) {
  if (isBossZone(zone)) return 1;
  const P = CONFIG.pack;
  return Math.min(P.max, P.base + Math.floor((zone - 1) / P.perZones));
}

// Sorteia o tier de um inimigo comum (normal / elite / champion).
// Separado de makeEnemy para facilitar testes unitários.
function getEnemyTier(zone) {
  const E = CONFIG.elite;
  if (zone >= E.championMinZone && Math.random() < E.championChance) return "champion";
  if (zone >= E.eliteMinZone    && Math.random() < E.eliteChance)    return "elite";
  return "normal";
}

// Cria UM inimigo (ou Boss) da zone.
// s (opcional): estado do jogador — ativa escala por ascensão e calibração de fronteira.
function makeEnemy(zone, s) {
  const region = regionFor(zone);
  const stats  = enemyStats(zone);
  const E      = CONFIG.enemy;

  // ── Escala com ascensões: HP e DMG crescem 6% por ascensão ──────────────
  const asc     = s ? s.ascensions : 0;
  const ascMult = Math.pow(E.ascGrowth, asc);
  let hpFinal   = Math.round(stats.hp  * ascMult);
  let dmgFinal  = Math.round(stats.dmg * ascMult);

  // ── Calibração de fronteira (só além da profundidade acessível) ──────────
  // Usa accessibleDepth, NÃO s.maxZone, para suportar saves com maxZone
  // resetado erroneamente — o histórico de ascensões recompõe a profundidade.
  //
  // SOMENTE O DANO é calibrado — HP usa escala natural.
  // Por quê não calibrar HP? Se hpFinal = playerDps × K, upgrades de gear
  // fazem os inimigos escalarem junto, tornando os upgrades inúteis para
  // avançar zonas — um rubber-band que quebra o loop de progressão.
  // Com HP natural, gear upgrades REDUZEM o tempo de kill → mais kills
  // por "vida" → o jogador realmente rompe a parede com esforço.
  // O dano calibrado previne morte instantânea (dá tempo de reagir).
  if (s && zone > accessibleDepth(s)) {
    const targetPackDps = playerMaxHp(s) / E.frontierDangerSec;
    dmgFinal = Math.ceil(targetPackDps / (packSize(zone) * E.damageFactor));
    // hpFinal: mantém escala natural (não substitui)
  }

  if (isBossZone(zone)) {
    const B  = CONFIG.boss;
    const hp = hpFinal * B.hpMult;
    return { name: region.enemies[0] + " Boss", isBoss: true, tier: "normal",
             hp, maxHp: hp, dmg: dmgFinal,
             goldReward: stats.gold * B.goldMult, xpReward: stats.xp * B.xpMult,
             shardMult: B.shardMult };
  }

  // ── Elite & Champion spawn ────────────────────────────────────────────────
  const tierKey = getEnemyTier(zone);
  const tm      = CONFIG.elite.tiers[tierKey]; // { hp, dmg, reward }

  const name = region.enemies[Math.floor(Math.random() * region.enemies.length)];
  const finalHp  = Math.round(hpFinal  * tm.hp);
  const finalDmg = Math.round(dmgFinal * tm.dmg);
  return { name, isBoss: false, tier: tierKey,
           hp: finalHp, maxHp: finalHp, dmg: finalDmg,
           goldReward: Math.round(stats.gold * tm.reward),
           xpReward:   Math.round(stats.xp   * tm.reward),
           shardMult:  tm.reward }; // usado em registerKill para escalar shards
}

// Spawna um pack novo na zone atual.
function spawnPack(s) {
  const n = packSize(s.zone);
  s.enemies = [];
  for (let i = 0; i < n; i++) s.enemies.push(makeEnemy(s.zone, s));
  return s.enemies;
}

// --- Shards (drop) ---
function shardsOnKill(zone, isBoss) {
  let n = Math.floor(CONFIG.shards.basePerKill + zone * CONFIG.shards.perZone);
  if (isBoss) n *= CONFIG.shards.bossMult;
  return Math.max(1, n);
}

if (typeof module !== "undefined") {
  module.exports = {
    enemyStats, regionFor, isBossZone, zoneName,
    killsToClear, killsToMaster, masteryKills, isZoneMastered, masteredZoneCount, zoneMasteryBonus,
    saveZoneProgress, restoreZoneProgress, clearZoneProgress, recordMasteryKill, addMasteryKills,
    packSize, getEnemyTier, makeEnemy, spawnPack,
    shardsOnKill,
  };
}
