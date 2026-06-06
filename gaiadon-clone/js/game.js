// ===== Core logic (sem DOM, testável em Node) =====
// Tudo aqui é função PURA: recebe o estado `s`, calcula, devolve. Nada de tela.

function defaultState() {
  return {
    gold: 0,
    level: 1,
    xp: 0,
    essence: 0,            // moeda de ascensão
    zone: 1,               // zone em combate agora (profundidade)
    maxZone: 0,            // zone mais funda já limpa
    killsInZone: 0,        // abates na zone atual (limpa em killsToClear)
    totalKills: 0,         // usado para os drops garantidos iniciais
    shop: { dmg: 0, hp: 0, spd: 0, gold: 0, offlineEff: 0, offlineCap: 0 },
    equipped: { Weapon: null, Armor: null, Amulet: null },
    inventory: [],
    enemy: null,
    playerHp: null,
    lastSeen: null,        // timestamp do último save (para offline)
  };
}

// --- Stats derivados ---
function ascMultiplier(s) { return 1 + s.essence * CONFIG.ascension.perEssencePct; }

function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + s.shop.dmg * SHOP_UPGRADES[0].value + (s.level - 1) * P.damagePerLevel;
  const w = s.equipped.Weapon;
  if (w) base += w.power; // Weapon → Damage (1:1)
  return Math.round(base * ascMultiplier(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + s.shop.hp * SHOP_UPGRADES[1].value + (s.level - 1) * P.hpPerLevel;
  const a = s.equipped.Armor;
  if (a) base += a.power * CONFIG.itemStats.healthPerPower; // Armor → Health
  return Math.round(base * ascMultiplier(s));
}
function attackSpeed(s) {
  let spd = CONFIG.player.baseAttackSpeed + s.shop.spd * SHOP_UPGRADES[2].value;
  const am = s.equipped.Amulet;
  if (am && am.stat === "Attack Speed") spd += am.power * CONFIG.itemStats.attackSpeedPerPower;
  return spd;
}
function playerDps(s) { return playerDamage(s) * attackSpeed(s); }
function goldBonus(s) {
  let b = 1 + s.shop.gold * SHOP_UPGRADES[3].value;
  const am = s.equipped.Amulet;
  if (am && am.stat === "Gold Find") b += am.power * CONFIG.itemStats.goldFindPerPower;
  return b * ascMultiplier(s);
}

// --- Inimigos (escala pela zone — ver docs/adr/0001) ---
function enemyStats(zone) {
  const E = CONFIG.enemy;
  const d = zone - 1; // zone 1 = expoente 0
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
// Boss Zone = toda zone múltipla de boss.everyZones (10, 20, 30...).
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

// --- Loot ---
// Sorteia uma rarity. Se minName for passado, só considera rarities >= a ela (Boss).
function rollRarity(minName) {
  let pool = RARITIES;
  if (minName) {
    const minIdx = RARITIES.findIndex(r => r.name === minName);
    if (minIdx > 0) pool = RARITIES.slice(minIdx);
  }
  const total = pool.reduce((a, r) => a + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of pool) { if (roll < r.weight) return r; roll -= r.weight; }
  return pool[0];
}
function generateItem(s, minRarity) {
  const D = CONFIG.drops;
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const rarity = rollRarity(minRarity);
  const baseName = ITEM_NAMES[slot][Math.floor(Math.random() * ITEM_NAMES[slot].length)];
  const power = Math.round((D.powerBase + s.zone * D.powerPerZone) * rarity.mult * (0.8 + Math.random() * 0.4));
  const item = { id: Math.random().toString(36).slice(2, 9), slot, rarity: rarity.name, name: baseName, power };
  // Slot "surpresa": Amulet sorteia qual stat concede (Attack Speed ou Gold Find).
  if (slot === "Amulet") item.stat = D.amuletStats[Math.floor(Math.random() * D.amuletStats.length)];
  return item;
}
function maybeDrop(s) {
  const D = CONFIG.drops;
  const guaranteed = s.totalKills <= D.guaranteedFirstKills;
  if (guaranteed || Math.random() < D.baseChance) {
    const item = generateItem(s);
    s.inventory.push(item);
    if (s.inventory.length > D.inventoryMax) s.inventory.shift(); // limite da mochila
    return item;
  }
  return null;
}

// --- Ações ---
function equipItem(s, itemId) {
  const idx = s.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  const item = s.inventory[idx];
  const prev = s.equipped[item.slot];
  s.equipped[item.slot] = item;
  s.inventory.splice(idx, 1);
  if (prev) s.inventory.push(prev); // devolve o antigo pra mochila
  return item;
}
function xpToNext(s) { return Math.round(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, s.level - 1)); }
function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) { s.xp -= xpToNext(s); s.level++; leveled = true; }
  return leveled;
}

// Registra um abate: recompensas + progressão de zone. Retorna o evento "kill".
function registerKill(s) {
  const e = s.enemy;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward);
  s.totalKills++;
  // Drop: Boss dá drop GARANTIDO de rarity >= boss.minRarity; inimigo normal usa maybeDrop.
  let drop;
  if (e.isBoss) {
    drop = generateItem(s, CONFIG.boss.minRarity);
    s.inventory.push(drop);
    if (s.inventory.length > CONFIG.drops.inventoryMax) s.inventory.shift();
  } else {
    drop = maybeDrop(s);
  }
  s.killsInZone++;
  // Boss limpa a zone num único abate; zone normal precisa de killsToClear.
  const needed = e.isBoss ? 1 : CONFIG.enemy.killsToClear;
  let advanced = false, walledCleared = false;
  if (s.killsInZone >= needed) {
    s.killsInZone = 0;
    if (s.zone > s.maxZone) { s.maxZone = s.zone; walledCleared = true; } // limpou a fronteira
    s.zone = s.maxZone + 1; // tenta a fronteira seguinte automaticamente
    advanced = true;
  }
  s.playerHp = playerMaxHp(s); // cura ao matar
  return { type: "kill", name: e.name, gold: g, leveled, drop, advanced, walledCleared, zone: s.zone, wasBoss: e.isBoss };
}

// Morte: sem punição. Recua para a zone segura (maxZone) e zera o contador.
// Captura a zone da PAREDE (onde morreu) antes de recuar, para a mensagem.
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
  events.push({ type: "hit", amount: dmgToEnemy }); // para floating damage

  s.playerHp -= s.enemy.dmg * CONFIG.enemy.damageFactor * dt;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnEnemy(s); return events; }

  if (s.enemy.hp <= 0) { events.push(registerKill(s)); spawnEnemy(s); }
  return events;
}

// --- Ascensão ---
// Só desbloqueia ao limpar a Zone de unlockZone (25). Antes disso, não pode ascender.
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
  Object.assign(s, defaultState());
  s.essence = keepEssence;
  return gain;
}

// --- Loja ---
function shopCost(s, id) {
  const u = SHOP_UPGRADES.find(x => x.id === id);
  return Math.round(u.baseCost * Math.pow(u.growth, s.shop[id]));
}
function buyUpgrade(s, id) {
  const cost = shopCost(s, id);
  if (s.gold < cost) return false;
  s.gold -= cost; s.shop[id]++;
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState, ascMultiplier, playerDamage, playerMaxHp, attackSpeed, playerDps, goldBonus,
    enemyStats, regionFor, isBossZone, spawnEnemy, rollRarity, generateItem, maybeDrop, equipItem,
    xpToNext, gainXp, registerKill, handleDeath, tick, canAscend, essenceOnAscend, ascend, shopCost, buyUpgrade,
  };
}
