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
    asc: { power: 0, offlineEff: 0, offlineCap: 0 },
    enemy: null,
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
function ascMultiplier(s) { return 1 + s.asc.power * ASCENSION_UPGRADES[0].value; }

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
function levelUpCost(s, slotId) {
  const item = s.equipped[slotId];
  return Math.round(CONFIG.gear.levelCostBase * Math.pow(CONFIG.gear.levelCostGrowth, item.level));
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

function spawnEnemy(s) {
  const region = regionFor(s.zone);
  const stats = enemyStats(s.zone);
  if (isBossZone(s.zone)) {
    const B = CONFIG.boss;
    const hp = stats.hp * B.hpMult;
    s.enemy = {
      name: region.enemies[0] + " Boss", isBoss: true,
      hp, maxHp: hp, dmg: stats.dmg,
      goldReward: stats.gold * B.goldMult, xpReward: stats.xp * B.xpMult,
    };
  } else {
    const name = region.enemies[Math.floor(Math.random() * region.enemies.length)];
    s.enemy = { name, isBoss: false, hp: stats.hp, maxHp: stats.hp, dmg: stats.dmg, goldReward: stats.gold, xpReward: stats.xp };
  }
  return s.enemy;
}

// --- Shards (drop) ---
function shardsOnKill(s, isBoss) {
  let n = Math.floor(CONFIG.shards.basePerKill + s.zone * CONFIG.shards.perZone);
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

// Registra um abate: recompensas (gold, xp, shards) + progressão de zone.
function registerKill(s) {
  const e = s.enemy;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward);
  s.totalKills++;
  const sh = shardsOnKill(s, e.isBoss);
  s.shards += sh;
  s.killsInZone++;
  const needed = e.isBoss ? 1 : CONFIG.enemy.killsToClear;
  let advanced = false, walledCleared = false;
  if (s.killsInZone >= needed) {
    s.killsInZone = 0;
    if (s.zone > s.maxZone) { s.maxZone = s.zone; walledCleared = true; }
    s.zone = s.maxZone + 1;
    advanced = true;
  }
  s.playerHp = playerMaxHp(s); // cura ao matar
  return { type: "kill", name: e.name, gold: g, shards: sh, leveled, advanced, walledCleared, zone: s.zone, wasBoss: e.isBoss };
}

// Morte: sem punição. Recua para a zone segura (maxZone) e zera o contador.
function handleDeath(s) {
  const wallZone = s.zone;
  s.killsInZone = 0;
  s.zone = Math.max(1, s.maxZone);
  s.playerHp = playerMaxHp(s);
  return { type: "death", wallZone, zone: s.zone };
}

// Processa dt segundos de combate. Retorna lista de eventos para a UI.
function tick(s, dt) {
  if (!s.enemy) spawnEnemy(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);
  const events = [];

  const dmgToEnemy = playerDps(s) * dt;
  s.enemy.hp -= dmgToEnemy;
  events.push({ type: "hit", amount: dmgToEnemy });

  s.playerHp -= s.enemy.dmg * CONFIG.enemy.damageFactor * dt;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnEnemy(s); return events; }
  if (s.enemy.hp <= 0) { events.push(registerKill(s)); spawnEnemy(s); }
  return events;
}

// --- Ascensão (prestígio) ---
function canAscend(s) { return s.maxZone >= CONFIG.ascension.unlockZone; }
function essenceOnAscend(s) {
  const A = CONFIG.ascension;
  return Math.floor(Math.pow(s.maxZone + 1, A.zoneExp) / A.zoneDiv + s.level / A.levelDiv);
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

if (typeof module !== "undefined") {
  module.exports = {
    defaultState, itemPower, slotPower, rarityCap, ascMultiplier,
    playerDamage, playerMaxHp, attackSpeed, playerDps, goldBonus,
    levelUpCost, canLevelUp, levelUpItem, rarityUpCost, canRarityUp, rarityUpItem,
    enemyStats, regionFor, isBossZone, spawnEnemy, shardsOnKill,
    xpToNext, gainXp, registerKill, handleDeath, tick,
    canAscend, essenceOnAscend, ascend, ascUpgradeCost, buyAscUpgrade, offlineConfig,
  };
}
