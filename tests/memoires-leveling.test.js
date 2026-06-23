// =============================================================
// tests/memoires-leveling.test.js — evolução das Mémoires (CP-2D, Lv1->Lv10)
// Rodar: node tests/memoires-leveling.test.js
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
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "memoires", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
const ID = "premierMatin";
// helper: deixa a Mémoire restaurada (Lv1) com saldo de Éclats
function setupRestored(eclats) {
  store = {}; G.state.data = null; G.state.load();
  G.economy.addEclats(eclats);
  G.memoires.find(ID);
  G.memoires.restore(ID); // consome RESTORE_COST, vira restored Lv1
}

// 1) maxLevel
ok(G.memoires.maxLevel() === 10 && G.memoires.MAX_LEVEL === 10, "maxLevel() = 10 (constante)");
ok(Object.keys(G.memoires.LEVEL_COSTS).length === 9, "LEVEL_COSTS cobre Lv2..Lv10 (9 níveis)");

// 2) canLevel exige restored
store = {}; G.state.data = null; G.state.load();
ok(G.memoires.canLevel(ID) === false, "canLevel(notFound) = false");
G.economy.addEclats(50); G.memoires.find(ID);
ok(G.memoires.canLevel(ID) === false, "canLevel(found, não restaurada) = false");

// 3) upgrade válido: Lv1 -> Lv2 + consumo
setupRestored(50);
ok(G.memoires.level(ID) === 1, "restaurada começa em Lv1");
ok(G.memoires.canLevel(ID) === true, "canLevel(restored, com Éclats) = true");
const before = G.economy.getEclats();
ok(G.memoires.upgrade(ID) === true, "upgrade() = true");
ok(G.memoires.level(ID) === 2, "nível subiu p/ Lv2");
ok(G.economy.getEclats() === before - G.memoires.LEVEL_COSTS[2], "consumiu o custo do Lv2");

// 4) bloqueio sem Éclats
setupRestored(0); // só os 0 -> mas restore precisa de 1... ajusta:
store = {}; G.state.data = null; G.state.load();
G.economy.addEclats(1); G.memoires.find(ID); G.memoires.restore(ID); // gasta o 1, saldo 0
ok(G.economy.getEclats() === 0 && G.memoires.level(ID) === 1, "restaurada com saldo 0");
ok(G.memoires.canLevel(ID) === false, "canLevel sem Éclats = false");
ok(G.memoires.upgrade(ID) === false && G.memoires.level(ID) === 1, "upgrade sem Éclats bloqueado (Lv1)");

// 5) subir até o teto e bloquear em Lv10
setupRestored(100);
for (let i = 0; i < 20; i++) G.memoires.upgrade(ID); // mais que o suficiente
ok(G.memoires.level(ID) === 10, "sobe exatamente até Lv10 (não ultrapassa)");
ok(G.memoires.canLevel(ID) === false, "canLevel(Lv10) = false (no teto)");
const atMax = G.economy.getEclats();
ok(G.memoires.upgrade(ID) === false && G.memoires.level(ID) === 10, "upgrade em Lv10 bloqueado");
ok(G.economy.getEclats() === atMax, "upgrade bloqueado em Lv10 não consome Éclats");

// 6) gasto total Lv1->Lv10 = soma dos custos Lv2..Lv10
setupRestored(100);
const start = G.economy.getEclats();
while (G.memoires.canLevel(ID)) G.memoires.upgrade(ID);
const spent = start - G.economy.getEclats();
const expected = Object.keys(G.memoires.LEVEL_COSTS).reduce((s, k) => s + G.memoires.LEVEL_COSTS[k], 0);
ok(G.memoires.level(ID) === 10 && spent === expected, "gasto Lv1->Lv10 = soma de LEVEL_COSTS (" + expected + ")");

// 7) id inválido
ok(G.memoires.canLevel("xxx") === false && G.memoires.upgrade("xxx") === false, "canLevel/upgrade(id inválido) = false");

// 8) save/load preserva nível + Éclats
setupRestored(100);
G.memoires.upgrade(ID); G.memoires.upgrade(ID); G.memoires.upgrade(ID); // Lv4
const snapLvl = G.memoires.level(ID), snapEclats = G.economy.getEclats();
G.state.save();
G.state.data = null; G.state.load();
ok(G.memoires.level(ID) === snapLvl && snapLvl === 4, "save/load preserva o nível (Lv4)");
ok(G.economy.getEclats() === snapEclats, "save/load preserva Éclats");

// 9) reconcile: nível acima do máximo -> clamp 10
store = {};
let s = G.state.fresh();
s.memoires = { premierMatin: { state: "restored", level: 999 }, desRires: { state: "restored", level: 0 }, deLaMarche: { state: "restored", level: 4.9 } };
store[G.state.SAVE_KEY] = JSON.stringify(s);
G.state.data = null; G.state.load();
ok(G.memoires.level("premierMatin") === 10, "reconcile: nível acima do máx -> clamp 10");
ok(G.memoires.level("desRires") === 1, "reconcile: restored com nível < 1 -> 1");
ok(G.memoires.level("deLaMarche") === 4, "reconcile: nível fracionário -> floor (4)");

// 10) reconcile: nível inválido / restored sem nível -> normalizado
store = {};
s = G.state.fresh();
s.memoires = { premierMatin: { state: "restored", level: "abc" }, desRires: { state: "restored" }, deLaMarche: { state: "found", level: 5 } };
store[G.state.SAVE_KEY] = JSON.stringify(s);
G.state.data = null; G.state.load();
ok(G.memoires.level("premierMatin") === 1, "reconcile: nível inválido (string) -> 1");
ok(G.memoires.level("desRires") === 1, "reconcile: restored sem nível -> 1");
ok(G.memoires.get("deLaMarche").state === "found" && G.memoires.level("deLaMarche") === 0, "reconcile: found força nível 0");

// 11) compatibilidade com saves anteriores (CP-2A sem memoires, CP-2B sem level)
store = {};
const cp2a = G.state.fresh(); delete cp2a.memoires;
store[G.state.SAVE_KEY] = JSON.stringify(cp2a);
G.state.data = null; G.state.load();
ok(["premierMatin", "desRires", "deLaMarche"].every((id) => G.memoires.get(id).state === "notFound" && G.memoires.level(id) === 0),
  "compat CP-2A (sem memoires): 3 em notFound/Lv0");
store = {};
const cp2b = G.state.fresh();
cp2b.memoires = { premierMatin: { state: "found" }, desRires: { state: "notFound" }, deLaMarche: { state: "found" } };
store[G.state.SAVE_KEY] = JSON.stringify(cp2b);
G.state.data = null; G.state.load();
ok(G.memoires.get("premierMatin").state === "found" && G.memoires.level("premierMatin") === 0, "compat CP-2B (sem level): found -> Lv0");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
