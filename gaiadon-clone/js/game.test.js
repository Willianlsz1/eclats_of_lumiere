// Carrega data.js -> globalThis -> game.js, depois roda os testes.
//
// Por que isto? No navegador, data.js e game.js são carregados como <script> e
// compartilham as variáveis globais (ZONES, CONFIG, etc). No Node, cada arquivo é
// isolado. Então a gente "empurra" os exports de data.js para o escopo global ANTES
// de carregar game.js — assim game.js encontra CONFIG/RARITIES/... como espera.
const data = require("./data.js");
Object.assign(globalThis, data);
const game = require("./game.js");
const { test, assertEqual, report } = require("./_assert.js");

console.log("== Smoke ==");
test("defaultState começa em maxDepth 0", () => {
  const s = game.defaultState();
  assertEqual(s.maxDepth, 0);
});

report();
