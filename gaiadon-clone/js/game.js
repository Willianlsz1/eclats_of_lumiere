// ===== Lógica central (sem DOM, para ser testável) =====

function defaultState() {
  return {
    gold: 0,
    level: 1,
    xp: 0,
    essence: 0,            // moeda de ascensão
    zone: 0,               // índice da zona atual
    killsInZone: 0,        // abates na zona (10 = libera próxima)
    maxZoneReached: 0,
    shop: { dmg: 0, hp: 0, spd: 0, gold: 0 }, // níveis comprados
    equipped: { Arma: null, Armadura: null, Amuleto: null },
    inventory: [],
    enemy: null,
    playerHp: null,
  };
}

// --- Cálculos derivados ---
function ascMultiplier(s) {
  return 1 + s.essence * 0.10; // cada essência = +10%
}

function playerDamage(s) {
  let base = 5 + s.shop.dmg * SHOP_UPGRADES[0].value + (s.level - 1) * 1.5;
  const w = s.equipped.Arma;
  if (w) base += w.power;
  return Math.round(base * ascMultiplier(s));
}

function playerMaxHp(s) {
  let base = 50 + s.shop.hp * SHOP_UPGRADES[1].value + (s.level - 1) * 8;
  const a = s.equipped.Armadura;
  if (a) base += a.power * 3;
  return Math.round(base * ascMultiplier(s));
}

// ataques por segundo
function attackSpeed(s) {
  return 1 + s.shop.spd * SHOP_UPGRADES[2].value;
}

function goldBonus(s) {
  let b = 1 + s.shop.gold * SHOP_UPGRADES[3].value;
  const am = s.equipped.Amuleto;
  if (am) b += am.power * 0.02;
  return b * ascMultiplier(s);
}

// --- Inimigos ---
function spawnEnemy(s) {
  const zone = ZONES[s.zone];
  const tier = s.zone; // 0-based
  const names = zone.enemies;
  const name = names[Math.floor(Math.random() * names.length)];
  const hp = Math.round(30 * Math.pow(1.55, tier) * (1 + s.killsInZone * 0.05));
  const dmg = Math.round(5 * Math.pow(1.4, tier));
  const goldReward = Math.round(8 * Math.pow(1.5, tier));
  const xpReward = Math.round(5 * Math.pow(1.4, tier));
  s.enemy = { name, hp, maxHp: hp, dmg, goldReward, xpReward };
  return s.enemy;
}

// --- Geração de loot ---
function rollRarity() {
  const total = RARITIES.reduce((a, r) => a + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) {
    if (roll < r.weight) return r;
    roll -= r.weight;
  }
  return RARITIES[0];
}

function generateItem(s) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const rarity = rollRarity();
  const baseName = ITEM_NAMES[slot][Math.floor(Math.random() * ITEM_NAMES[slot].length)];
  const power = Math.round((3 + s.zone * 4) * rarity.mult * (0.8 + Math.random() * 0.4));
  return {
    id: Math.random().toString(36).slice(2, 9),
    slot, rarity: rarity.name, name: baseName, power,
  };
}

// ~22% de chance de drop por abate
function maybeDrop(s) {
  if (Math.random() < 0.22) {
    const item = generateItem(s);
    s.inventory.push(item);
    if (s.inventory.length > 24) s.inventory.shift(); // limite da mochila
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

function xpToNext(s) {
  return Math.round(20 * Math.pow(1.25, s.level - 1));
}

function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) {
    s.xp -= xpToNext(s);
    s.level++;
    leveled = true;
  }
  return leveled;
}

// Processa 1 segundo de combate. Retorna eventos para a UI/log.
function tick(s, dt) {
  if (!s.enemy) spawnEnemy(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);

  const events = [];
  const dps = playerDamage(s) * attackSpeed(s);
  s.enemy.hp -= dps * dt;

  // jogador também toma dano (mas regenera ao trocar de inimigo)
  s.playerHp -= s.enemy.dmg * 0.5 * dt;
  if (s.playerHp <= 0) {
    // "morte" sem punição dura: cura total e perde poucos abates
    s.playerHp = playerMaxHp(s);
    events.push({ type: "death" });
  }

  if (s.enemy.hp <= 0) {
    const g = Math.round(s.enemy.goldReward * goldBonus(s));
    s.gold += g;
    const leveled = gainXp(s, s.enemy.xpReward);
    const drop = maybeDrop(s);
    s.killsInZone++;
    events.push({ type: "kill", name: s.enemy.name, gold: g, leveled, drop });

    // libera próxima zona a cada 10 abates
    if (s.killsInZone >= 10 && s.zone < ZONES.length - 1) {
      // não avança sozinho; apenas marca disponível
    }
    s.playerHp = playerMaxHp(s); // cura ao matar
    spawnEnemy(s);
  }
  return events;
}

// --- Zonas ---
function canAdvance(s) {
  return s.killsInZone >= 10 && s.zone < ZONES.length - 1;
}
function changeZone(s, dir) {
  const target = s.zone + dir;
  if (target < 0 || target >= ZONES.length) return false;
  if (dir > 0 && s.killsInZone < 10) return false; // precisa de 10 abates
  s.zone = target;
  s.killsInZone = 0;
  s.maxZoneReached = Math.max(s.maxZoneReached, target);
  spawnEnemy(s);
  s.playerHp = playerMaxHp(s);
  return true;
}

// --- Loja ---
function shopCost(s, id) {
  const u = SHOP_UPGRADES.find(x => x.id === id);
  const lvl = s.shop[id];
  return Math.round(u.baseCost * Math.pow(u.growth, lvl));
}
function buyUpgrade(s, id) {
  const cost = shopCost(s, id);
  if (s.gold < cost) return false;
  s.gold -= cost;
  s.shop[id]++;
  return true;
}

// --- Ascensão ---
function essenceOnAscend(s) {
  // baseado na zona máxima e nível
  return Math.floor(Math.pow(s.maxZoneReached + 1, 1.5) + s.level / 5);
}
function ascend(s) {
  const gain = essenceOnAscend(s);
  if (gain <= 0) return false;
  const keepEssence = s.essence + gain;
  Object.assign(s, defaultState());
  s.essence = keepEssence;
  return gain;
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState, ascMultiplier, playerDamage, playerMaxHp, attackSpeed,
    goldBonus, spawnEnemy, rollRarity, generateItem, maybeDrop, equipItem,
    xpToNext, gainXp, tick, canAdvance, changeZone, shopCost, buyUpgrade,
    essenceOnAscend, ascend,
  };
}
