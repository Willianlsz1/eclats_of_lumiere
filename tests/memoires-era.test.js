// =============================================================
// tests/memoires-era.test.js — Era Restaurada (CP-2E, estado derivado)
// Rodar: node tests/memoires-era.test.js
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
const IDS = ["premierMatin", "desRires", "deLaMarche"];
// leva uma Mémoire de notFound direto a Lv10 (via estado, p/ teste de Era)
function setMaxed(id) { G.state.data.memoires[id] = { state: "restored", level: 10 }; }
function setLevel(id, st, lv) { G.state.data.memoires[id] = { state: st, level: lv }; }

// 0) Era I centralizada
ok(Array.isArray(G.memoires.ERAS[1]) && G.memoires.ERAS[1].length === 3, "ERAS[1] centraliza as 3 Mémoires da Era I");
ok(JSON.stringify(G.memoires.eraIds(1)) === JSON.stringify(IDS), "eraIds(1) = as 3 Mémoires");
ok(G.memoires.eraIds(2).length === 0, "Eras futuras (2..5) ainda vazias — generalizado, não hardcoded");

// 1) 0/3
store = {}; G.state.data = null; G.state.load();
ok(JSON.stringify(G.memoires.eraProgress(1)) === JSON.stringify({ total: 3, completed: 0 }), "eraProgress(1) inicial = 0/3");
ok(G.memoires.isEraRestored(1) === false, "isEraRestored(1) inicial = false");

// 2) 1/3 (uma maximizada)
setMaxed("premierMatin");
ok(G.memoires.eraProgress(1).completed === 1, "1 maximizada -> 1/3");
ok(G.memoires.isEraRestored(1) === false, "1/3 -> Era NÃO restaurada");

// 3) 2/3 (restaurada mas não no teto não conta)
setLevel("desRires", "restored", 9); // restaurada Lv9 (NÃO completa)
ok(G.memoires.eraProgress(1).completed === 1, "Lv9 não conta como completa (ainda 1/3)");
setMaxed("desRires");
ok(G.memoires.eraProgress(1).completed === 2, "2 maximizadas -> 2/3");
ok(G.memoires.isEraRestored(1) === false, "2/3 -> Era NÃO restaurada");

// 4) found/notFound não contam
setLevel("deLaMarche", "found", 0);
ok(G.memoires.eraProgress(1).completed === 2, "found não conta (2/3)");

// 5) 3/3 -> Era Restaurada
setMaxed("deLaMarche");
ok(JSON.stringify(G.memoires.eraProgress(1)) === JSON.stringify({ total: 3, completed: 3 }), "3 maximizadas -> 3/3");
ok(G.memoires.isEraRestored(1) === true, "3/3 -> isEraRestored(1) = true");

// 6) sem campo novo no save (estado derivado)
ok(!("era1Restored" in G.state.data) && G.state.data.memoires, "nenhum campo era1Restored no save (derivado de state/level)");

// 7) save/load mantém a Era restaurada (derivada do nível persistido)
G.state.save();
G.state.data = null; G.state.load();
ok(G.memoires.isEraRestored(1) === true, "save/load: Era I continua restaurada (derivada)");
ok(IDS.every((id) => G.memoires.level(id) === 10), "save/load: as 3 seguem Lv10");

// 8) via upgrade real (caminho de jogo): restaurar + subir as 3 até 10
store = {}; G.state.data = null; G.state.load();
G.economy.addEclats(1000);
for (const id of IDS) { G.memoires.find(id); G.memoires.restore(id); while (G.memoires.canLevel(id)) G.memoires.upgrade(id); }
ok(G.memoires.isEraRestored(1) === true, "caminho real (find+restore+upgrade x3) -> Era I restaurada");

// 9) compat com saves anteriores (CP-2A/2B/2C/2D)
function loadSave(memoires) {
  store = {}; const s = G.state.fresh();
  if (memoires === undefined) delete s.memoires; else s.memoires = memoires;
  store[G.state.SAVE_KEY] = JSON.stringify(s);
  G.state.data = null; G.state.load();
}
loadSave(undefined); // CP-2A
ok(G.memoires.isEraRestored(1) === false && G.memoires.eraProgress(1).completed === 0, "compat CP-2A: 0/3, não restaurada");
loadSave({ premierMatin: { state: "found" }, desRires: { state: "notFound" }, deLaMarche: { state: "found" } }); // CP-2B
ok(G.memoires.eraProgress(1).completed === 0, "compat CP-2B (sem level): 0/3");
loadSave({ premierMatin: { state: "restored", level: 1 }, desRires: { state: "found" }, deLaMarche: { state: "notFound" } }); // CP-2C/2D
ok(G.memoires.eraProgress(1).completed === 0 && G.memoires.isEraRestored(1) === false, "compat CP-2C/2D (Lv1): 0/3");
loadSave({ premierMatin: { state: "restored", level: 999 }, desRires: { state: "restored", level: 10 }, deLaMarche: { state: "restored", level: 10 } });
ok(G.memoires.isEraRestored(1) === true, "compat: níveis clampados (999->10) ainda detectam Era restaurada");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
