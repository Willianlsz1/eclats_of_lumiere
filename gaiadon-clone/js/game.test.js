// Carrega data.js -> globalThis -> game.js, depois roda os testes.
//
// Por que isto? No navegador, data.js e game.js são carregados como <script> e
// compartilham as variáveis globais (ZONES, CONFIG, etc). No Node, cada arquivo é
// isolado. Então a gente "empurra" os exports de data.js para o escopo global ANTES
// de carregar game.js — assim game.js encontra CONFIG/RARITIES/... como espera.
const data = require("./data.js");
Object.assign(globalThis, data);
const game = require("./game.js");
const { test, assert, assertEqual, report } = require("./_assert.js");

console.log("== Smoke ==");
test("defaultState começa em maxZone 0", () => {
  const s = game.defaultState();
  assertEqual(s.maxZone, 0);
});

console.log("== Core logic ==");

test("defaultState tem campos de zone", () => {
  const s = game.defaultState();
  assertEqual(s.zone, 1);
  assertEqual(s.maxZone, 0);
  assertEqual(s.killsInZone, 0);
});

test("dano do jogador cresce com upgrade de força", () => {
  const s = game.defaultState();
  const d0 = game.playerDamage(s);
  s.shop.dmg = 5;
  assert(game.playerDamage(s) > d0, "dano deveria subir");
});

test("vida do inimigo escala com a zone", () => {
  const a = game.enemyStats(1).hp;
  const b = game.enemyStats(5).hp;
  assert(b > a, "inimigo mais fundo deveria ter mais HP");
});

test("limpar 10 abates avança a maxZone", () => {
  const s = game.defaultState();
  s.zone = 1;
  game.spawnEnemy(s); // registerKill precisa de um inimigo vivo
  for (let i = 0; i < CONFIG.enemy.killsToClear; i++) game.registerKill(s);
  assert(s.maxZone >= 1, "deveria ter limpado a zone 1");
});

test("Boss Zone limpa num único abate", () => {
  const s = game.defaultState();
  s.maxZone = 9; s.zone = 10; // zone 10 = Boss Zone
  game.spawnEnemy(s);
  assert(s.enemy.isBoss === true, "zone 10 deveria gerar um Boss");
  const ev = game.registerKill(s);
  assertEqual(s.maxZone, 10, "matar o Boss limpa a zone de uma vez");
  assert(ev.drop, "Boss dá drop garantido");
});

test("Amulet sorteia um stat válido", () => {
  const s = game.defaultState();
  let amulet = null;
  for (let i = 0; i < 200 && !amulet; i++) {
    const it = game.generateItem(s);
    if (it.slot === "Amulet") amulet = it;
  }
  assert(amulet, "deveria gerar ao menos 1 amuleto em 200 tentativas");
  assert(CONFIG.drops.amuletStats.includes(amulet.stat), "stat do amuleto deve vir do pool");
});

test("morte na fronteira não pune e recua para farm", () => {
  const s = game.defaultState();
  s.maxZone = 3; s.zone = 4; s.gold = 100;
  const inv = s.inventory.length;
  game.handleDeath(s);
  assertEqual(s.gold, 100, "não perde ouro");
  assertEqual(s.inventory.length, inv, "não perde itens");
  assert(s.zone <= s.maxZone, "recua para a zone segura");
});

test("ascensão trava antes da Zone 25 e libera depois", () => {
  const s = game.defaultState();
  s.maxZone = CONFIG.ascension.unlockZone - 1; s.level = 20;
  assert(game.canAscend(s) === false, "não pode ascender antes da unlockZone");
  assertEqual(game.ascend(s), false, "ascend() deve recusar quando travado");
  s.maxZone = CONFIG.ascension.unlockZone;
  assert(game.canAscend(s) === true, "pode ascender ao atingir a unlockZone");
});

test("essência de ascensão usa a zone máxima", () => {
  const s = game.defaultState();
  s.maxZone = 30; s.level = 20;
  assert(game.essenceOnAscend(s) > 0, "deveria render essência");
});

test("upgrade de offline trava no maxLevel", () => {
  const s = game.defaultState();
  s.gold = 1e12; // ouro de sobra
  s.shop.offlineCap = 22; // já no teto (24h - 2h base)
  assertEqual(game.buyUpgrade(s, "offlineCap"), false, "não deve comprar além do maxLevel");
  assertEqual(s.shop.offlineCap, 22, "nível não muda quando maxado");
});

test("maxLevel do offline bate com os caps (sem drift)", () => {
  const O = CONFIG.offline;
  const eff = SHOP_UPGRADES.find(u => u.id === "offlineEff");
  const cap = SHOP_UPGRADES.find(u => u.id === "offlineCap");
  assertEqual(eff.maxLevel, Math.round((O.efficiencyMax - O.startEfficiency) / eff.value));
  assertEqual(cap.maxLevel, Math.round((O.capMaxHours - O.startCapHours) / cap.value));
});

report();
