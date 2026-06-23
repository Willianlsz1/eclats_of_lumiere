// =============================================================
// tests/enemies.test.js — estrutura de inimigos (Elite, Mini Boss, thresholds,
// respawn de Boss, Boss Área 1, Mini Boss aleatório Área 9)
// Rodar: node tests/enemies.test.js
// =============================================================
const fs = require("fs");
const path = require("path");

global.window = global;
let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const SRC = path.join(__dirname, "..", "src");
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
const A = G.data.areas;
const C = G.combat;
// posiciona a sessão de área sem disparar o reset de contadores do spawn()
function setArea(idx) { G.state.data.areaIndex = idx; C._lastAreaIndex = idx; }

store = {}; G.state.data = null; G.state.load();

// 1) Boss da Área 1 adicionado; Área 1 sem Mini Boss
ok(A[0].boss && A[0].boss.name, "Área 1 tem Boss (progressão)");
ok(!A[0].miniBoss && !A[0].miniBossRandom, "Área 1 NÃO tem Mini Boss");

// 2) Áreas 2-8: Common+Rare+Elite+Mini Boss+Boss
let okMid = true;
for (let i = 1; i <= 7; i++) okMid = okMid && !!A[i].miniBoss && !!A[i].boss;
ok(okMid, "Áreas 2-8 têm Mini Boss próprio + Boss");

// 3) Continente 1 = 20 áreas; Área 9 = Guardião; Área 20 = Mini Boss aleatório + Boss Final
ok(A.length === 20, "Continente 1 tem 20 áreas (CP-3A)");
ok(A[8].boss.name === "The Guardian", "Área 9 = Guardião (gate do Awaken)");
ok(A[19].miniBossRandom === true && A[19].boss.name === "The Gilded Hollow", "Área 20 = Mini Boss aleatório + Boss Final");

// 4) Elite só fora da Área 1
ok(C.areaHasElite(A[0]) === false && C.areaHasElite(A[1]) === true, "Elite: ausente na Área 1, presente da Área 2+");

// 5) chooseEncounter — prioridades
setArea(1); G.state.data.level = A[1].levelRange[1]; // no cap da Área 2
G.state.data.bossOnCooldown = false;
ok(C.chooseEncounter(A[1], true, () => 0.99) === "boss", "no cap, fora de cooldown -> Boss");
G.state.data.bossOnCooldown = true;
ok(C.chooseEncounter(A[1], true, () => 0.99) !== "boss", "no cap, em cooldown -> NÃO Boss");

// mini boss por threshold
G.state.data.bossOnCooldown = false; G.state.data.level = A[1].levelRange[0]; // fora do cap
const req = C.miniBossRequired();
G.state.data.miniBossProgress = req;
ok(C.chooseEncounter(A[1], false, () => 0.99) === "miniBoss", "threshold atingido -> Mini Boss");
G.state.data.miniBossProgress = 0;

// elite por chance (rng forçado abaixo da chance)
const baseElite = G.data.balance.eliteChance; G.data.balance.eliteChance = 0.5;
ok(C.chooseEncounter(A[1], false, () => 0.0) === "elite", "rng baixo + chance -> Elite");
ok(C.chooseEncounter(A[1], false, () => 0.99) === "common", "rng alto -> Common");
G.data.balance.eliteChance = baseElite;

// 6) spawn produz flags/identificação corretas por tipo
setArea(1); G.state.data.level = A[1].levelRange[1]; G.state.data.bossOnCooldown = false;
C.spawn();
ok(C.enemy.isBoss === true && C.enemy.name === A[1].boss.name, "spawn no cap -> Boss identificado");

setArea(1); G.state.data.level = A[1].levelRange[0];
G.state.data.miniBossProgress = C.miniBossRequired(); G.state.data.bossOnCooldown = false;
C.spawn();
ok(C.enemy.isMiniBoss === true && C.enemy.name === A[1].miniBoss.name, "spawn com threshold -> Mini Boss identificado");
ok(C.enemy.rarity && C.enemy.rarity.tag === "Mini Boss", "Mini Boss tem tag própria");

// 7) economy roteia drops por tipo (elite/miniBoss têm tabela própria)
ok(G.economy.enemyType({ isElite: true }) === "elite", "enemyType: isElite -> elite");
ok(G.economy.enemyType({ isMiniBoss: true }) === "miniBoss", "enemyType: isMiniBoss -> miniBoss");

// 8) thresholds em onKill: kills normais avançam; Mini Boss reseta
store = {}; G.state.data = null; G.state.load(); setArea(1); G.state.data.level = 100;
G.state.data.miniBossProgress = 0;
G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: false, isElite: false, isMiniBoss: false, rarity: null };
C.onKill();
ok(G.state.data.miniBossProgress === 1, "kill normal avança miniBossProgress");
G.combat.enemy = { name: "mb", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isMiniBoss: true };
C.onKill();
ok(G.state.data.miniBossProgress === 0, "Mini Boss derrotado reinicia o threshold");

// 9) respawn de Boss: kill de Boss entra em cooldown; threshold reabre
G.data.balance.bossRespawnKillsRequired = 3; // placeholder de teste
G.combat.enemy = { name: "b", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: true };
C.onKill();
ok(G.state.data.bossOnCooldown === true && G.state.data.bossProgress === 0, "Boss derrotado -> cooldown + novo threshold");
for (let i = 0; i < 3; i++) { G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1 }; C.onKill(); }
ok(G.state.data.bossOnCooldown === false, "após bossRespawnKillsRequired kills, Boss volta a aparecer");
G.data.balance.bossRespawnKillsRequired = 100;

// 10) Mini Boss aleatório da Área 20 sai do pool das áreas anteriores
const names = G.data.areas.filter((a) => a.miniBoss).map((a) => a.miniBoss.name);
let allFromPool = true;
for (let i = 0; i < 30; i++) { const mb = C.pickMiniBoss(A[19], Math.random); allFromPool = allFromPool && names.indexOf(mb.name) !== -1; }
ok(allFromPool, "Área 20: Mini Boss aleatório vem do pool das áreas anteriores");

// 11) passivas Fracture: eliteChance soma, miniBossThreshold reduz
G.passives.UNIT.eliteChance = 10; G.state.data.passives.fracture[6] = 1; // "Elite Chance" (set direto)
ok(Math.abs(C.eliteChance() - (baseElite + 0.10)) < 1e-9, "passiva Elite Chance soma à chance base");
G.passives.UNIT.eliteChance = 0; G.state.data.passives.fracture[6] = 0;
const reqBase = G.data.balance.miniBossKillsRequired;
G.passives.UNIT.miniBossThreshold = 50; G.state.data.passives.fracture[7] = 1; // "Lower Mini Boss Threshold"
ok(C.miniBossRequired() === Math.ceil(reqBase * 0.5), "passiva reduz o threshold do Mini Boss (50%)");
G.passives.UNIT.miniBossThreshold = 0; G.state.data.passives.fracture[7] = 0;

// 12) compat: save antigo sem contadores -> defaults
store = {}; const oldSave = G.state.fresh();
delete oldSave.miniBossProgress; delete oldSave.bossProgress; delete oldSave.bossOnCooldown;
store[G.state.SAVE_KEY] = JSON.stringify(oldSave);
G.state.data = null; G.state.load();
ok(G.state.data.miniBossProgress === 0 && G.state.data.bossProgress === 0 && G.state.data.bossOnCooldown === false,
  "save antigo: contadores de encontro inicializados com default");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
