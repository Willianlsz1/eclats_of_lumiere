// ===== Core logic (sem DOM, testável em Node) =====
// Progressão centrada em EQUIPAMENTO (ver docs/adr/0002). Tudo aqui é função pura.

function defaultState() {
  return {
    gold: 0,
    shards: 0,             // material que sobe a raridade do equipamento
    level: 1,
    xp: 0,
    essence: 0,            // moeda de prestígio (gasta em asc upgrades)
    zone: 1,
    maxZone: 0,
    killsInZone: 0,
    totalKills: 0,
    // Equipamento: cada slot guarda { rarity: índice, level }.
    equipped: {
      Weapon: { rarity: 0, level: 1 },
      Armor:  { rarity: 0, level: 1 },
      Amulet: { rarity: 0, level: 1 },
    },
    // Níveis dos upgrades permanentes de Ascensão.
    asc: { power: 0, offlineEff: 0, offlineCap: 0, insight: 0 },
    enemies: [],           // pack de inimigos atual (você foca o [0]; todos atacam)
    playerHp: null,
    lastSeen: null,
  };
}

// --- Equipamento ---
function itemPower(item) {
  if (!item) return 0;
  return Math.round(CONFIG.gear.powerPerLevel * item.level * RARITIES[item.rarity].mult);
}
function slotPower(s, slotId) { return itemPower(s.equipped[slotId]); }
function rarityCap(item) { return RARITIES[item.rarity].cap; }

// --- Stats derivados ---
// Power é MULTIPLICATIVO: cada nível multiplica por (1 + value). Compõe entre ascensões.
function ascMultiplier(s) { return Math.pow(1 + ASCENSION_UPGRADES[0].value, s.asc.power); }

function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + (s.level - 1) * P.damagePerLevel;
  base += slotPower(s, "Weapon"); // Weapon → Damage (1:1)
  return Math.round(base * ascMultiplier(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + (s.level - 1) * P.hpPerLevel;
  base += slotPower(s, "Armor") * CONFIG.itemStats.healthPerPower; // Armor → Health
  return Math.round(base * ascMultiplier(s));
}
function attackSpeed(s) {
  // Amulet → Attack Speed (+ também Gold Find em goldBonus).
  return CONFIG.player.baseAttackSpeed + slotPower(s, "Amulet") * CONFIG.itemStats.attackSpeedPerPower;
}
function playerDps(s) { return playerDamage(s) * attackSpeed(s); }
function goldBonus(s) {
  let b = 1 + slotPower(s, "Amulet") * CONFIG.itemStats.goldFindPerPower; // Amulet → Gold Find
  return b * ascMultiplier(s);
}

// --- Custos e ações de equipamento ---
function levelCostAt(level) {
  return Math.round(CONFIG.gear.levelCostBase * Math.pow(CONFIG.gear.levelCostGrowth, level));
}
function levelUpCost(s, slotId) {
  return levelCostAt(s.equipped[slotId].level);
}
// Quantos níveis dá pra comprar agora (e o custo total), sem alterar o estado.
function levelUpMaxPreview(s, slotId) {
  const item = s.equipped[slotId];
  const cap = rarityCap(item);
  let gold = s.gold, level = item.level, count = 0, spent = 0;
  while (level < cap) {
    const cost = levelCostAt(level);
    if (gold < cost) break;
    gold -= cost; level++; count++; spent += cost;
    if (count > 1e6) break; // trava de segurança
  }
  return { count, spent };
}
// Compra o máximo de níveis possível de uma vez. Retorna quantos comprou.
function levelUpMax(s, slotId) {
  let count = 0;
  while (levelUpItem(s, slotId)) { if (++count > 1e6) break; }
  return count;
}
function canLevelUp(s, slotId) {
  const item = s.equipped[slotId];
  return item.level < rarityCap(item) && s.gold >= levelUpCost(s, slotId);
}
function levelUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.level >= rarityCap(item)) return false; // travado no cap
  const cost = levelUpCost(s, slotId);
  if (s.gold < cost) return false;
  s.gold -= cost; item.level++;
  return true;
}
function rarityUpCost(s, slotId) {
  const item = s.equipped[slotId];
  return Math.round(CONFIG.gear.rarityCostBase * Math.pow(CONFIG.gear.rarityCostGrowth, item.rarity));
}
function canRarityUp(s, slotId) {
  const item = s.equipped[slotId];
  return item.rarity < RARITIES.length - 1
      && item.level >= rarityCap(item)        // precisa estar no cap atual
      && s.shards >= rarityUpCost(s, slotId);
}
function rarityUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.rarity >= RARITIES.length - 1) return false;
  if (item.level < rarityCap(item)) return false; // precisa estar no cap
  const cost = rarityUpCost(s, slotId);
  if (s.shards < cost) return false;
  s.shards -= cost; item.rarity++; // nível mantém; cap agora é maior
  return true;
}

// --- Inimigos (escala pela zone — ver docs/adr/0001) ---
function enemyStats(zone) {
  const E = CONFIG.enemy;
  const d = zone - 1;
  return {
    hp:   Math.round(E.baseHp   * Math.pow(E.hpGrowth, d)),
    dmg:  Math.round(E.baseDmg  * Math.pow(E.dmgGrowth, d)),
    gold: Math.round(E.baseGold * Math.pow(E.goldGrowth, d)),
    xp:   Math.round(E.baseXp   * Math.pow(E.xpGrowth, d)),
  };
}
function regionFor(zone) {
  const i = Math.floor((zone - 1) / CONFIG.zonesPerRegion) % REGIONS.length;
  return REGIONS[i];
}
function isBossZone(zone) { return zone % CONFIG.boss.everyZones === 0; }
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

// Cria UM inimigo (ou Boss) da zone.
function makeEnemy(zone) {
  const region = regionFor(zone);
  const stats = enemyStats(zone);
  if (isBossZone(zone)) {
    const B = CONFIG.boss;
    const hp = stats.hp * B.hpMult;
    return { name: region.enemies[0] + " Boss", isBoss: true, hp, maxHp: hp, dmg: stats.dmg,
             goldReward: stats.gold * B.goldMult, xpReward: stats.xp * B.xpMult };
  }
  const name = region.enemies[Math.floor(Math.random() * region.enemies.length)];
  return { name, isBoss: false, hp: stats.hp, maxHp: stats.hp, dmg: stats.dmg, goldReward: stats.gold, xpReward: stats.xp };
}

// Spawna um pack novo na zone atual.
function spawnPack(s) {
  const n = packSize(s.zone);
  s.enemies = [];
  for (let i = 0; i < n; i++) s.enemies.push(makeEnemy(s.zone));
  return s.enemies;
}

// --- Shards (drop) ---
function shardsOnKill(zone, isBoss) {
  let n = Math.floor(CONFIG.shards.basePerKill + zone * CONFIG.shards.perZone);
  if (isBoss) n *= CONFIG.shards.bossMult;
  return Math.max(1, n);
}

// --- XP / nível do Hero ---
function xpToNext(s) { return Math.round(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, s.level - 1)); }
function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) { s.xp -= xpToNext(s); s.level++; leveled = true; }
  return leveled;
}

// Registra um abate de UM inimigo: recompensas + progressão de zone. NÃO cura
// (a cura acontece ao limpar o pack inteiro — packs maiores são mais perigosos).
function registerKill(s, e) {
  e = e || s.enemies[0];
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward);
  s.totalKills++;
  const sh = shardsOnKill(s.zone, e.isBoss);
  s.shards += sh;
  s.killsInZone++;
  const needed = e.isBoss ? 1 : killsToClear(s.zone);
  let advanced = false, walledCleared = false;
  if (s.killsInZone >= needed) {
    s.killsInZone = 0;
    if (s.zone > s.maxZone) {            // limpou uma FRONTEIRA nova
      s.maxZone = s.zone; walledCleared = true;
      s.zone = s.maxZone + 1; advanced = true; // segue empurrando
    }
    // farmando uma zone já limpa (zone <= maxZone): fica, não é empurrado.
  }
  return { type: "kill", name: e.name, gold: g, shards: sh, leveled, advanced, walledCleared, zone: s.zone, wasBoss: e.isBoss };
}

// Navegação manual de zone: entre a Zone 1 e a fronteira (maxZone + 1).
function changeZone(s, dir) {
  const target = s.zone + dir;
  if (target < 1 || target > s.maxZone + 1) return false;
  s.zone = target;
  s.killsInZone = 0;
  spawnPack(s);
  s.playerHp = playerMaxHp(s);
  return true;
}

// Morte: sem punição. Recua para a zone segura (maxZone), zera o contador e o pack.
function handleDeath(s) {
  const wallZone = s.zone;
  s.killsInZone = 0;
  s.zone = Math.max(1, s.maxZone);
  s.enemies = [];
  s.playerHp = playerMaxHp(s);
  return { type: "death", wallZone, zone: s.zone };
}

// Processa dt segundos de combate. Retorna lista de eventos para a UI.
function tick(s, dt) {
  if (!s.enemies || s.enemies.length === 0) spawnPack(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);
  const events = [];

  // Você FOCA o inimigo da frente.
  const target = s.enemies[0];
  const dmgToEnemy = playerDps(s) * dt;
  target.hp -= dmgToEnemy;
  events.push({ type: "hit", amount: dmgToEnemy });

  // TODOS os inimigos vivos do pack te atacam ao mesmo tempo.
  const incoming = s.enemies.reduce((a, e) => a + e.dmg, 0) * CONFIG.enemy.damageFactor * dt;
  s.playerHp -= incoming;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnPack(s); return events; }

  if (target.hp <= 0) {
    const ev = registerKill(s, target);
    events.push(ev);
    s.enemies.shift(); // remove o morto
    if (ev.advanced) s.enemies = []; // mudou de zone: descarta o pack antigo
    if (s.enemies.length === 0) { s.playerHp = playerMaxHp(s); spawnPack(s); } // cura ao limpar o pack
  }
  return events;
}

// --- Ascensão (prestígio) ---
function canAscend(s) { return s.maxZone >= CONFIG.ascension.unlockZone; }
// Insight multiplica a essência ganha (cresce com a profundidade via maxZone).
function essenceMultiplier(s) { return 1 + s.asc.insight * ASCENSION_UPGRADES[3].value; }
function essenceOnAscend(s) {
  const A = CONFIG.ascension;
  const base = Math.pow(s.maxZone + 1, A.zoneExp) / A.zoneDiv + s.level / A.levelDiv;
  return Math.floor(base * essenceMultiplier(s));
}
function ascend(s) {
  if (!canAscend(s)) return false;
  const gain = essenceOnAscend(s);
  if (gain <= 0) return false;
  const keepEssence = s.essence + gain;
  const keepAsc = s.asc; // upgrades de ascensão são permanentes
  Object.assign(s, defaultState());
  s.essence = keepEssence;
  s.asc = keepAsc;
  return gain;
}

// Upgrades permanentes comprados com Essence.
function ascUpgradeCost(s, id) {
  const u = ASCENSION_UPGRADES.find(x => x.id === id);
  return Math.round(u.baseCost * Math.pow(u.growth, s.asc[id]));
}
function buyAscUpgrade(s, id) {
  const u = ASCENSION_UPGRADES.find(x => x.id === id);
  if (u.maxLevel != null && s.asc[id] >= u.maxLevel) return false;
  const cost = ascUpgradeCost(s, id);
  if (s.essence < cost) return false;
  s.essence -= cost; s.asc[id]++;
  return true;
}

// Config de offline derivada dos upgrades de ascensão.
function offlineConfig(s) {
  const O = CONFIG.offline;
  const efficiency = Math.min(O.efficiencyMax, O.startEfficiency + s.asc.offlineEff * ASCENSION_UPGRADES[1].value);
  const capHours   = Math.min(O.capMaxHours,   O.startCapHours   + s.asc.offlineCap * ASCENSION_UPGRADES[2].value);
  return { efficiency, capHours };
}

// Estima os ganhos enquanto offline, de forma BARATA (fórmula, sem rodar ticks).
// Farma na zone segura (onde o jogador estava, no máximo até a maxZone).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const farmZone = Math.max(1, Math.min(s.zone, s.maxZone));
  const st = enemyStats(farmZone);
  const killsPerSec = playerDps(s) / Math.max(1, st.hp);
  const kills = killsPerSec * seconds * efficiency;
  const gold = Math.round(kills * st.gold * goldBonus(s));
  const xp = Math.round(kills * st.xp);
  const shards = Math.round(kills * shardsOnKill(farmZone, false));
  return { seconds, kills: Math.floor(kills), gold, xp, shards };
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState, itemPower, slotPower, rarityCap, ascMultiplier,
    playerDamage, playerMaxHp, attackSpeed, playerDps, goldBonus,
    levelCostAt, levelUpCost, levelUpMaxPreview, levelUpMax, canLevelUp, levelUpItem,
    rarityUpCost, canRarityUp, rarityUpItem,
    enemyStats, regionFor, isBossZone, killsToClear, packSize, makeEnemy, spawnPack, shardsOnKill,
    xpToNext, gainXp, registerKill, changeZone, handleDeath, tick,
    canAscend, essenceMultiplier, essenceOnAscend, ascend, ascUpgradeCost, buyAscUpgrade, offlineConfig, computeOfflineGains,
  };
}
