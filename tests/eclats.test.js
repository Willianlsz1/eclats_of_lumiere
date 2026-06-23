// =============================================================
// tests/eclats.test.js — fundação dos Éclats (CP-2A)
// Rodar: node tests/eclats.test.js
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
function isNum(v) { return typeof v === "number" && isFinite(v); }

// 1) estado inicial
store = {}; G.state.data = null; G.state.load();
ok(G.state.data.eclats === 0, "fresh: eclats = 0");
ok(G.economy.getEclats() === 0, "getEclats() inicial = 0");

// 2) API pública existe (padrão dos materiais)
ok(typeof G.economy.getEclats === "function" && typeof G.economy.addEclats === "function",
  "API pública: getEclats() e addEclats() expostos");

// 3) add positivo
ok(G.economy.addEclats(50) === 50 && G.economy.getEclats() === 50, "add positivo: +50 -> 50");
ok(G.economy.addEclats(25) === 75, "add acumula: +25 -> 75");

// 4) add negativo (remoção)
ok(G.economy.addEclats(-30) === 45, "add negativo: -30 -> 45");

// 5) clamp em 0 (nunca negativo)
ok(G.economy.addEclats(-999) === 0, "clamp: remoção além do saldo -> 0");
ok(G.economy.getEclats() === 0, "saldo nunca fica negativo");

// 6) nunca NaN (entradas inválidas)
G.economy.addEclats(10);
ok(G.economy.addEclats(NaN) === 10 && isNum(G.economy.getEclats()), "addEclats(NaN) é no-op, nunca grava NaN");
ok(G.economy.addEclats(undefined) === 10, "addEclats(undefined) é no-op");
ok(G.economy.addEclats("abc") === 10, "addEclats(string inválida) é no-op");
// getter robusto mesmo com estado corrompido
G.state.data.eclats = NaN;
ok(G.economy.getEclats() === 0, "getEclats() devolve 0 se o estado estiver corrompido (NaN)");
G.state.data.eclats = 10;

// 7) save/load roundtrip
G.economy.addEclats(123); // 133
const snap = G.economy.getEclats();
G.state.save();
G.state.data = null; G.state.load();
ok(G.economy.getEclats() === snap && snap === 133, "save/load preserva eclats (133)");

// 8) reconcile de save ANTIGO (sem campo eclats)
store = {};
const old = G.state.fresh(); delete old.eclats; old.lumens = 999;
store[G.state.SAVE_KEY] = JSON.stringify(old);
G.state.data = null; G.state.load();
ok(G.state.data.eclats === 0 && G.state.data.lumens === 999, "save antigo sem eclats: inicializa 0, resto preservado");

// 9) reconcile sanea valor inválido salvo
store = {};
const bad = G.state.fresh(); bad.eclats = -50;
store[G.state.SAVE_KEY] = JSON.stringify(bad);
G.state.data = null; G.state.load();
ok(G.state.data.eclats === 0, "save com eclats negativo é saneado para 0 no load");

// 10) reconcile preserva valor válido salvo
store = {};
const good = G.state.fresh(); good.eclats = 777;
store[G.state.SAVE_KEY] = JSON.stringify(good);
G.state.data = null; G.state.load();
ok(G.state.data.eclats === 777, "save com eclats válido é preservado no load");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
