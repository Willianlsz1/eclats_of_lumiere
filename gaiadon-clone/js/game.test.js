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

test("levelUpMax compra vários níveis de uma vez", () => {
  const s = game.defaultState();
  s.gold = 1000;
  const n = game.levelUpMax(s, "Weapon");
  assert(n > 1, "deveria comprar vários níveis");
  assertEqual(s.equipped.Weapon.level, 1 + n);
});

test("levelUpMax respeita o cap da raridade", () => {
  const s = game.defaultState();
  s.gold = 1e12; // gold de sobra
  game.levelUpMax(s, "Weapon");
  assertEqual(s.equipped.Weapon.level, RARITIES[0].cap, "para no cap da common (10)");
});

test("levelUpMaxPreview bate com a compra real (count e custo)", () => {
  const s = game.defaultState();
  s.gold = 800;
  const pre = game.levelUpMaxPreview(s, "Weapon");
  const goldBefore = s.gold;
  const n = game.levelUpMax(s, "Weapon");
  assertEqual(pre.count, n, "count previsto = comprado");
  assertEqual(pre.spent, goldBefore - s.gold, "custo previsto = gasto");
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

console.log("== Afixos / Crítico ==");
test("itemAffixes ativa afixos conforme a raridade", () => {
  assertEqual(game.itemAffixes("Weapon", 0).length, 0); // common
  assertEqual(game.itemAffixes("Weapon", 1).length, 1); // uncommon
  assertEqual(game.itemAffixes("Weapon", 4).length, 4); // legendary
});

test("affixTotals soma os afixos dos itens equipados", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2; // critRate + critDmg
  const t = game.affixTotals(s);
  assert(t.critRate > 0 && t.critDmg > 0, "deveria somar crit dos afixos");
});

test("afixos escalam com o nível do item", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2; // critRate + critDmg
  s.equipped.Weapon.level = 1;
  const low = game.affixTotals(s).critDmg;
  s.equipped.Weapon.level = 500;
  const high = game.affixTotals(s).critDmg;
  assert(high > low, "subir o nível do item deveria aumentar o afixo");
});

test("afixos de crítico aumentam o DPS", () => {
  const s = game.defaultState();
  const dps0 = game.playerDps(s); // common: sem crit
  s.equipped.Weapon.rarity = 2;   // rare: critRate + critDmg
  assert(game.critRate(s) > 0, "deveria ter crit rate");
  assert(game.playerDps(s) > game.playerDamage(s) * game.attackSpeed(s), "crit deveria multiplicar o DPS");
});

test("Damage % e Health % dos afixos aumentam os stats", () => {
  const s = game.defaultState();
  s.equipped.Armor.rarity = 1; // hpMult
  const hpBase = CONFIG.player.baseHp;
  assert(game.playerMaxHp(s) > hpBase, "hpMult deveria aumentar a vida acima da base");
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
  s.zone = 1; game.spawnPack(s);
  const ev = game.registerKill(s);
  assert(ev.shards > 0, "deveria ganhar shards");
  assert(!("drop" in ev) || ev.drop == null, "não dropa item");
});

test("Boss dá mais shards e limpa a zone num abate", () => {
  const s = game.defaultState();
  s.maxZone = 9; s.zone = 10; game.spawnPack(s);
  assert(s.enemies[0].isBoss, "zone 10 é Boss");
  const ev = game.registerKill(s);
  assertEqual(s.maxZone, 10, "boss limpa a zone");
  assert(ev.shards > 0, "boss dá shards");
});

test("limpar a fronteira sobe maxZone e auto-avança", () => {
  const s = game.defaultState(); s.zone = 1; game.spawnPack(s);
  for (let i = 0; i < game.killsToClear(1); i++) game.registerKill(s);
  assertEqual(s.maxZone, 1);
  assertEqual(s.zone, 2); // auto-avança para a nova fronteira
});

test("farmar uma zone já limpa NÃO auto-avança", () => {
  const s = game.defaultState(); s.maxZone = 5; s.zone = 3; game.spawnPack(s);
  for (let i = 0; i < game.killsToClear(3); i++) game.registerKill(s);
  assertEqual(s.zone, 3, "deveria ficar farmando a zone 3");
  assertEqual(s.maxZone, 5, "maxZone inalterada");
});

test("killsToClear cresce com a zone", () => {
  assertEqual(game.killsToClear(1), CONFIG.enemy.killsBase);
  assert(game.killsToClear(15) > game.killsToClear(1), "zona funda exige mais abates");
});

test("packSize cresce com a zone (Boss vem sozinho, respeita o teto)", () => {
  assertEqual(game.packSize(1), CONFIG.pack.base);
  assert(game.packSize(15) > game.packSize(1), "zona funda tem mais inimigos");
  assertEqual(game.packSize(10), 1, "Boss Zone vem sozinho");
  assert(game.packSize(1000) <= CONFIG.pack.max, "respeita o teto");
});

test("pack maior causa mais dano por segundo ao jogador", () => {
  const s = game.defaultState(); s.maxZone = 20; s.zone = 15;
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  const hp0 = s.playerHp; game.tick(s, 0.1);
  const dmgPack = hp0 - s.playerHp;
  const s2 = game.defaultState(); s2.maxZone = 20; s2.zone = 15;
  game.spawnPack(s2); s2.enemies = [s2.enemies[0]]; s2.playerHp = game.playerMaxHp(s2);
  const hp1 = s2.playerHp; game.tick(s2, 0.1);
  const dmgSingle = hp1 - s2.playerHp;
  assert(dmgPack > dmgSingle, "o pack inteiro deveria doer mais que um inimigo só");
});

test("Power e afixo de XP aumentam o multiplicador de XP", () => {
  const s = game.defaultState();
  const base = game.xpMultiplier(s);
  s.asc.power = 4; // Power agora também multiplica XP
  assert(game.xpMultiplier(s) > base, "Power deveria aumentar o XP mult");
  const withPower = game.xpMultiplier(s);
  s.equipped.Amulet.rarity = 2; // inclui afixo xpMult
  assert(game.xpMultiplier(s) > withPower, "afixo de XP deveria somar ainda mais");
});

test("Insight multiplica a essência ganha", () => {
  const s = game.defaultState(); s.maxZone = 30; s.level = 20;
  const base = game.essenceOnAscend(s);
  s.asc.insight = 4;
  assert(game.essenceOnAscend(s) > base, "Insight deveria aumentar a essência");
});

test("changeZone respeita os limites [1, maxZone+1]", () => {
  const s = game.defaultState(); s.maxZone = 4; s.zone = 2;
  assert(game.changeZone(s, -1), "deveria voltar"); assertEqual(s.zone, 1);
  assertEqual(game.changeZone(s, -1), false, "não vai abaixo de 1");
  s.zone = 5; // fronteira = maxZone+1
  assertEqual(game.changeZone(s, +1), false, "não passa da fronteira");
  assert(game.changeZone(s, -1), "deveria avançar de volta"); assertEqual(s.zone, 4);
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

test("ascensão trava abaixo do nível exigido e libera ao atingi-lo", () => {
  const s = game.defaultState();
  s.maxZone = 30; s.level = game.ascLevelReq(s) - 1;
  assertEqual(game.canAscend(s), false);
  assertEqual(game.ascend(s), false);
  s.level = game.ascLevelReq(s);
  assertEqual(game.canAscend(s), true);
});

test("o requisito de nível ESCALA a cada ascensão", () => {
  const s = game.defaultState();
  const req0 = game.ascLevelReq(s);
  s.ascensions = 3;
  assert(game.ascLevelReq(s) > req0, "ascensões seguintes exigem nível maior");
});

test("ascender mantém Essence/upgrades e incrementa a contagem", () => {
  const s = game.defaultState();
  s.maxZone = 30; s.level = 100; s.asc.power = 4; s.essence = 2; s.gold = 999;
  const gain = game.ascend(s);
  assert(gain > 0, "deveria render essência");
  assertEqual(s.asc.power, 4, "mantém upgrades de ascensão");
  assertEqual(s.ascensions, 1, "conta a ascensão");
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

test("ganhos offline > 0 e respeitam o teto de horas", () => {
  const s = game.defaultState();
  s.maxZone = 3; s.zone = 3;
  const oneH = game.computeOfflineGains(s, 3600);
  const huge = game.computeOfflineGains(s, 999 * 3600); // muito além do cap
  assert(oneH.gold > 0, "deveria render gold");
  assert(oneH.shards >= 0, "deveria ter shards");
  const capSec = game.offlineConfig(s).capHours * 3600;
  assert(huge.seconds <= capSec + 1, "respeita o teto de acúmulo");
});

test("mais tempo offline = mais ganho (dentro do teto)", () => {
  const s = game.defaultState();
  s.maxZone = 2; s.zone = 2;
  const a = game.computeOfflineGains(s, 600);   // 10 min
  const b = game.computeOfflineGains(s, 1800);  // 30 min (dentro do cap de 2h)
  assert(b.gold > a.gold, "mais tempo deveria render mais gold");
});

console.log("== Balanceamento (sanidade) ==");
test("o primeiro abate acontece em menos de 1s", () => {
  const s = game.defaultState();
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  const evs = game.tick(s, 1.0); // 1 segundo de combate
  assert(evs.some(e => e.type === "kill"), "deveria matar o 1º inimigo em ~1s");
});

test("a parede é letal: jogador fresco morre numa zone muito funda", () => {
  const s = game.defaultState();
  s.maxZone = 59; s.zone = 60; game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  let died = false, killed = false;
  for (let i = 0; i < 100 && !died && !killed; i++) {
    const evs = game.tick(s, 0.1);
    if (evs.some(e => e.type === "death")) died = true;
    if (evs.some(e => e.type === "kill")) killed = true;
  }
  assert(died && !killed, "jogador fresco deveria MORRER (não matar) numa zone funda");
});

report();
