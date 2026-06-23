// =============================================================
// tests/memoires-restoration.test.js — restauração das Mémoires (CP-2C, Era I)
// Ciclo: notFound -> found -> restored (Lv1). Rodar:
//   node tests/memoires-restoration.test.js
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

// 1) estado inicial: notFound + level 0
store = {}; G.state.data = null; G.state.load();
ok(G.memoires.get(ID).state === "notFound" && G.memoires.level(ID) === 0, "inicial: notFound, level 0");
ok(typeof G.memoires.RESTORE_COST === "number" && G.memoires.RESTORE_COST === 1, "RESTORE_COST = 1 (placeholder único)");

// 2) canRestore exige state === found
ok(G.memoires.canRestore(ID) === false, "canRestore(notFound) = false");
G.memoires.find(ID);
ok(G.memoires.get(ID).state === "found" && G.memoires.level(ID) === 0, "após find: found, level 0");

// 3) bloqueio sem Éclats
G.state.data.eclats = 0;
ok(G.memoires.canRestore(ID) === false, "canRestore(found, 0 Éclats) = false");
ok(G.memoires.restore(ID) === false, "restore sem Éclats = false (bloqueado)");
ok(G.memoires.get(ID).state === "found", "estado permanece found após restore bloqueado");

// 4) restauração válida + consumo de Éclats
G.economy.addEclats(5); // 5 Éclats
ok(G.memoires.canRestore(ID) === true, "canRestore(found, com Éclats) = true");
const before = G.economy.getEclats();
ok(G.memoires.restore(ID) === true, "restore() = true");
ok(G.memoires.get(ID).state === "restored" && G.memoires.level(ID) === 1, "após restore: restored, Lv1");
ok(G.economy.getEclats() === before - G.memoires.RESTORE_COST, "consumiu exatamente RESTORE_COST Éclats");

// 5) idempotência: não restaura de novo
ok(G.memoires.canRestore(ID) === false, "canRestore(restored) = false");
const after = G.economy.getEclats();
ok(G.memoires.restore(ID) === false, "restore() de novo = false (não duplica)");
ok(G.economy.getEclats() === after, "restore bloqueado não consome Éclats");

// 6) bloqueio em notFound (não dá p/ restaurar sem encontrar)
ok(G.memoires.canRestore("desRires") === false && G.memoires.restore("desRires") === false,
  "restore direto em notFound = bloqueado");

// 7) find não reabre uma Mémoire restaurada
ok(G.memoires.find(ID) === false && G.memoires.get(ID).state === "restored",
  "find() não rebaixa uma Mémoire restaurada");
ok(G.memoires.isFound(ID) === true && G.memoires.remaining().indexOf(ID) === -1,
  "restaurada continua 'descoberta' (fora de remaining)");

// 8) id inválido
ok(G.memoires.canRestore("xxx") === false && G.memoires.restore("xxx") === false, "restore(id inválido) = false");
ok(G.memoires.level("xxx") === 0, "level(id inválido) = 0");

// 9) save/load roundtrip preserva state + level + Éclats
store = {}; G.state.data = null; G.state.load();
G.economy.addEclats(10); G.memoires.find(ID); G.memoires.restore(ID); // ID restored Lv1
G.memoires.find("deLaMarche"); // found
const eclatsSnap = G.economy.getEclats();
G.state.save();
G.state.data = null; G.state.load();
ok(G.memoires.get(ID).state === "restored" && G.memoires.level(ID) === 1, "save/load: restored + Lv1 preservados");
ok(G.memoires.get("deLaMarche").state === "found", "save/load: found preservado");
ok(G.memoires.get("desRires").state === "notFound", "save/load: notFound preservado");
ok(G.economy.getEclats() === eclatsSnap, "save/load: Éclats preservados");

// 10) reconcile de save CP-2B (state sem level) -> adiciona level coerente
store = {};
const cp2b = G.state.fresh();
cp2b.memoires = { premierMatin: { state: "found" }, desRires: { state: "notFound" }, deLaMarche: { state: "restored" } };
store[G.state.SAVE_KEY] = JSON.stringify(cp2b);
G.state.data = null; G.state.load();
ok(G.memoires.get("premierMatin").state === "found" && G.memoires.level("premierMatin") === 0,
  "reconcile CP-2B: found ganha level 0");
ok(G.memoires.get("deLaMarche").state === "restored" && G.memoires.level("deLaMarche") === 1,
  "reconcile CP-2B: restored sem level vira Lv>=1");

// 11) reconcile saneia estado inválido e nível incoerente
store = {};
const bad = G.state.fresh();
bad.memoires = { premierMatin: { state: "lixo", level: 9 }, desRires: { state: "found", level: 7 }, deLaMarche: {} };
store[G.state.SAVE_KEY] = JSON.stringify(bad);
G.state.data = null; G.state.load();
ok(G.memoires.get("premierMatin").state === "notFound" && G.memoires.level("premierMatin") === 0, "reconcile: estado inválido -> notFound, level 0");
ok(G.memoires.get("desRires").state === "found" && G.memoires.level("desRires") === 0, "reconcile: found força level 0");
ok(G.memoires.get("deLaMarche").state === "notFound", "reconcile: objeto vazio -> notFound");

// 12) reconcile de save antigo (CP-2A: sem memoires)
store = {};
const cp2a = G.state.fresh(); delete cp2a.memoires;
store[G.state.SAVE_KEY] = JSON.stringify(cp2a);
G.state.data = null; G.state.load();
ok(["premierMatin", "desRires", "deLaMarche"].every((id) => G.memoires.get(id).state === "notFound" && G.memoires.level(id) === 0),
  "reconcile save sem memoires (CP-2A): 3 em notFound/level 0");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
