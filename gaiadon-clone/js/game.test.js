// Carrega data.js -> globalThis -> game.js, depois roda os testes.
const data = require("./data.js");
Object.assign(globalThis, data);
const game = require("./game.js");
const { test, assert, assertEqual, report } = require("./_assert.js");

console.log("== Estado base ==");
test("defaultState: equipamento common nível 1, sem shards, asc zerado", () => {
  const s = game.defaultState();
  assertEqual(s.maxZone, 0);
  assertEqual(s.shards, 0);
  assertEqual(s.equipped.Weapon.rarity, 0);
  assertEqual(s.equipped.Weapon.level, 1);
  assertEqual(s.asc.power, 0);
});

console.log("== Equipamento ==");
test("itemPower cresce com nível e raridade", () => {
  const low = game.itemPower({ rarity: 0, level: 1 });
  const hiLevel = game.itemPower({ rarity: 0, level: 10 });
  const hiRarity = game.itemPower({ rarity: 2, level: 10 });
  assert(hiLevel > low, "mais nível = mais power");
  assert(hiRarity > hiLevel, "mais raridade = mais power");
});

test("levelUpItem gasta gold e sobe o nível", () => {
  const s = game.defaultState();
  s.gold = 1000;
  const before = s.equipped.Weapon.level;
  assert(game.levelUpItem(s, "Weapon"), "deveria comprar nível");
  assertEqual(s.equipped.Weapon.level, before + 1);
  assert(s.gold < 1000, "deveria gastar gold");
});

test("nível trava no cap da raridade", () => {
  const s = game.defaultState();
  s.gold = 1e9;
  s.equipped.Weapon.level = RARITIES[0].cap; // common no cap (10)
  assertEqual(game.levelUpItem(s, "Weapon"), false, "não passa do cap sem subir raridade");
});

test("rarityUpItem exige estar no cap + shards e libera o próximo cap", () => {
  const s = game.defaultState();
  s.equipped.Weapon.level = RARITIES[0].cap; // no cap
  s.shards = 1e9; s.gold = 1e9; // precisa de gold pra subir nível depois
  const r0 = s.equipped.Weapon.rarity;
  assert(game.rarityUpItem(s, "Weapon"), "deveria subir a raridade");
  assertEqual(s.equipped.Weapon.rarity, r0 + 1);
  // agora dá pra continuar subindo o nível (cap maior)
  assert(game.levelUpItem(s, "Weapon"), "após subir raridade, nível volta a subir");
});

test("não sobe raridade fora do cap", () => {
  const s = game.defaultState();
  s.shards = 1e9; // nível 1, cap 10 — não está no cap
  assertEqual(game.rarityUpItem(s, "Weapon"), false, "precisa estar no cap pra subir raridade");
});

console.log("== Stats vindos do equipamento ==");
test("subir a Weapon aumenta o Damage", () => {
  const s = game.defaultState();
  const d0 = game.playerDamage(s);
  s.equipped.Weapon.level = 10;
  assert(game.playerDamage(s) > d0, "Weapon melhor = mais dano");
});

test("Amulet dá Attack Speed E Gold Find", () => {
  const s = game.defaultState();
  const spd0 = game.attackSpeed(s), gold0 = game.goldBonus(s);
  s.equipped.Amulet.level = 50;
  assert(game.attackSpeed(s) > spd0, "amuleto deveria acelerar ataques");
  assert(game.goldBonus(s) > gold0, "amuleto deveria aumentar ouro");
});

console.log("== Combate e zones ==");
test("registerKill dá shards (sem drop de item)", () => {
  const s = game.defaultState();
  s.zone = 1; game.spawnEnemy(s);
  const ev = game.registerKill(s);
  assert(ev.shards > 0, "deveria ganhar shards");
  assert(!("drop" in ev) || ev.drop == null, "não dropa item");
});

test("Boss dá mais shards e limpa a zone num abate", () => {
  const s = game.defaultState();
  s.maxZone = 9; s.zone = 10; game.spawnEnemy(s);
  assert(s.enemy.isBoss, "zone 10 é Boss");
  const ev = game.registerKill(s);
  assertEqual(s.maxZone, 10, "boss limpa a zone");
  assert(ev.shards > 0, "boss dá shards");
});

test("morte na fronteira não pune e recua", () => {
  const s = game.defaultState();
  s.maxZone = 3; s.zone = 4; s.gold = 100; s.shards = 50;
  game.handleDeath(s);
  assertEqual(s.gold, 100, "não perde gold");
  assertEqual(s.shards, 50, "não perde shards");
  assert(s.zone <= s.maxZone, "recua para a zone segura");
});

console.log("== Ascensão (prestígio) ==");
test("upgrade Power aumenta o multiplicador", () => {
  const s = game.defaultState();
  const m0 = game.ascMultiplier(s);
  s.asc.power = 5;
  assert(game.ascMultiplier(s) > m0, "Power deveria aumentar o multiplicador");
});

test("ascensão trava antes da Zone 25 e libera depois", () => {
  const s = game.defaultState();
  s.maxZone = CONFIG.ascension.unlockZone - 1; s.level = 20;
  assertEqual(game.canAscend(s), false);
  assertEqual(game.ascend(s), false);
  s.maxZone = CONFIG.ascension.unlockZone;
  assertEqual(game.canAscend(s), true);
});

test("ascender mantém Essence e upgrades de ascensão", () => {
  const s = game.defaultState();
  s.maxZone = 30; s.level = 20; s.asc.power = 4; s.essence = 2; s.gold = 999;
  const gain = game.ascend(s);
  assert(gain > 0, "deveria render essência");
  assertEqual(s.asc.power, 4, "mantém upgrades de ascensão");
  assertEqual(s.gold, 0, "reseta o gold da run");
  assert(s.essence >= 2 + gain - 1, "acumula essência");
});

test("buyAscUpgrade gasta essência e respeita maxLevel", () => {
  const s = game.defaultState();
  s.essence = 1e6;
  s.asc.offlineCap = 22; // no maxLevel
  assertEqual(game.buyAscUpgrade(s, "offlineCap"), false, "não passa do maxLevel");
  assert(game.buyAscUpgrade(s, "power"), "Power não tem cap, deve comprar");
});

test("offlineConfig reflete os upgrades de ascensão", () => {
  const s = game.defaultState();
  const c0 = game.offlineConfig(s);
  s.asc.offlineEff = 3; s.asc.offlineCap = 5;
  const c1 = game.offlineConfig(s);
  assert(c1.efficiency > c0.efficiency, "rate sobe");
  assert(c1.capHours > c0.capHours, "cap sobe");
});

report();
