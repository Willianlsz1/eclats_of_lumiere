// =============================================================
// tests/memoires-effects.test.js — bônus mecânico das Mémoires (CANON_V2 §2)
// premierMatin (×dano) · des Rires (proc Lumens×2) · de la Marche (escala c/ áreas)
// Rodar: node tests/memoires-effects.test.js
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
const M = G.memoires;
function setMemoire(id, state, level) { G.state.data.memoires[id] = { state, level }; }

store = {}; G.state.data = null; G.state.load();

// 0) sem Mémoires restauradas: bônus neutros
ok(M.damageMult() === 1, "sem restauração: damageMult = 1");
ok(M.doubleLumensChance() === 0, "sem restauração: chance de Lumens×2 = 0");
ok(M.gainsMult() === 1, "sem restauração: gainsMult = 1");

// 1) Premier Matin (×dano) — só conta quando restaurada e escala com nível
setMemoire("premierMatin", "found", 0);
ok(M.damageMult() === 1, "Premier Matin apenas encontrada (não restaurada) -> sem bônus");
setMemoire("premierMatin", "restored", 1); const d1 = M.damageMult();
setMemoire("premierMatin", "restored", 10); const d10 = M.damageMult();
ok(d1 > 1 && d10 > d1, "Premier Matin: dano escala com o nível");

// 2) integra no combate (typeDamageMult multiplica pelo bônus da Mémoire)
G.combat.enemy = { isBoss: false, isElite: false, isMiniBoss: false };
ok(Math.abs(G.combat.typeDamageMult() - d10) < 1e-9, "combate: Premier Matin entra no multiplicador de dano");
G.combat.enemy = null;
setMemoire("premierMatin", "notFound", 0);

// 3) des Rires — chance de Lumens×2 escala com nível
setMemoire("desRires", "restored", 1); const c1 = M.doubleLumensChance();
setMemoire("desRires", "restored", 10); const c10 = M.doubleLumensChance();
ok(c1 > 0 && c10 > c1, "des Rires: chance de Lumens×2 escala com o nível");
// proc determinístico: rng 0 sempre dobra
const realRandom = Math.random;
store = {}; G.state.data = null; G.state.load();
setMemoire("desRires", "restored", 10);
G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 100, xp: 1, isBoss: false };
Math.random = () => 0; const before = G.state.data.lumens; G.combat.onKill();
const gained = G.state.data.lumens - before;
ok(gained >= 200, "des Rires: com chance e rng baixo, Lumens do kill são dobrados");
Math.random = realRandom;

// 4) de la Marche — escala com áreas alcançadas
store = {}; G.state.data = null; G.state.load();
setMemoire("deLaMarche", "restored", 10);
G.state.data.maxAreaUnlocked = 0; const g0 = M.gainsMult();
G.state.data.maxAreaUnlocked = 19; const g19 = M.gainsMult();
ok(Math.abs(g0 - 1) < 1e-9 && g19 > g0, "de la Marche: ganhos crescem com áreas alcançadas");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
