// =============================================================
// tests/memoires-discovery.test.js — descoberta das Mémoires (CP-2B, Era I)
// Rodar: node tests/memoires-discovery.test.js
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

// 1) estado inicial
store = {}; G.state.data = null; G.state.load();
ok(IDS.every((id) => G.state.data.memoires[id].state === "notFound"), "fresh: 3 Mémoires da Era I em notFound");
ok(IDS.every((id) => G.memoires.get(id).state === "notFound"), "get(): todas notFound");
ok(G.memoires.remaining().length === 3, "remaining() inicial = 3");

// 2) estado usa string (não boolean) — evita migração no CP-2C
ok(typeof G.state.data.memoires.premierMatin.state === "string" && !("found" in G.state.data.memoires.premierMatin),
  "estado usa `state` (string), não found:true/false");

// 3) find()
ok(G.memoires.find("premierMatin") === true, "find(premierMatin) descobre (true)");
ok(G.memoires.isFound("premierMatin") === true, "isFound(premierMatin) = true");
ok(G.memoires.get("premierMatin").state === "found", "get() reflete found");
ok(G.memoires.remaining().length === 2, "remaining() cai p/ 2");

// 4) idempotência (não duplica)
ok(G.memoires.find("premierMatin") === false, "find() de novo = false (não duplica)");
ok(G.memoires.remaining().length === 2, "remaining() permanece 2 após re-find");

// 5) get() de id inválido nunca devolve estado inválido
ok(G.memoires.get("inexistente").state === "notFound", "get(id inválido) -> notFound (nunca inválido)");
ok(G.memoires.find("inexistente") === false, "find(id inválido) = false");

// 6) rollDiscovery — só considera não-encontradas; chance 0 padrão = null
store = {}; G.state.data = null; G.state.load();
ok(G.memoires.rollDiscovery({ rng: () => 0 }) === null, "rollDiscovery: chance 0 (placeholder) -> null");
// forçando chance: descobre a 1ª remaining (ordem canônica)
ok(G.memoires.rollDiscovery({ rng: () => 0, chance: 1 }) === "premierMatin", "rollDiscovery(chance 1) -> 1ª remaining (premierMatin)");
ok(G.memoires.rollDiscovery({ rng: () => 0.99, chance: 0.5 }) === null, "rollDiscovery: rng alto -> null");

// 7) remoção da tabela após descoberta (sai do pool de remaining)
G.memoires.find("premierMatin");
const next = G.memoires.rollDiscovery({ rng: () => 0, chance: 1 });
ok(next === "desRires", "após descobrir premierMatin, rollDiscovery pula p/ desRires (removida do pool)");
ok(G.memoires.rollDiscovery({ rng: () => 0, chance: 1, }) !== "premierMatin", "rollDiscovery nunca redescobre premierMatin");

// 8) integração com combat.onKill (chance forçada + rng determinístico)
store = {}; G.state.data = null; G.state.load();
const realRandom = Math.random; Math.random = () => 0;
G.memoires.discoveryTable.premierMatin.chance = 1; // força só p/ o teste
G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: false };
G.combat.onKill();
ok(G.memoires.isFound("premierMatin") === true, "combat.onKill descobre via rollDiscovery+find");
G.memoires.discoveryTable.premierMatin.chance = 0; // restaura placeholder
Math.random = realRandom;

// 9) nenhuma duplicação possível via onKill repetido
const realRandom2 = Math.random; Math.random = () => 0;
G.memoires.discoveryTable.desRires.chance = 1;
let foundCountBefore = G.memoires.all().filter((id) => G.memoires.isFound(id)).length;
G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1 }; G.combat.onKill();
G.combat.enemy = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1 }; G.combat.onKill();
let foundCountAfter = G.memoires.all().filter((id) => G.memoires.isFound(id)).length;
ok(foundCountAfter === foundCountBefore + 1, "2 kills com desRires forçada -> só +1 descoberta (sem duplicar)");
G.memoires.discoveryTable.desRires.chance = 0;
Math.random = realRandom2;

// 10) save/load roundtrip preserva descobertas
store = {}; G.state.data = null; G.state.load();
G.memoires.find("premierMatin"); G.memoires.find("deLaMarche");
G.state.save();
G.state.data = null; G.state.load();
ok(G.memoires.isFound("premierMatin") && G.memoires.isFound("deLaMarche") && !G.memoires.isFound("desRires"),
  "save/load preserva exatamente as descobertas (premierMatin + deLaMarche)");

// 11) reconcile de save ANTIGO (sem campo memoires)
store = {};
const old = G.state.fresh(); delete old.memoires; old.lumens = 42;
store[G.state.SAVE_KEY] = JSON.stringify(old);
G.state.data = null; G.state.load();
ok(IDS.every((id) => G.memoires.get(id).state === "notFound") && G.state.data.lumens === 42,
  "save antigo sem memoires: cria as 3 em notFound, resto preservado");

// 12) reconcile preenche faltante e saneia estado inválido (preserva found válido)
store = {};
const partial = G.state.fresh();
partial.memoires = { premierMatin: { state: "found" }, desRires: { state: "lixo" } }; // deLaMarche ausente, estado inválido
store[G.state.SAVE_KEY] = JSON.stringify(partial);
G.state.data = null; G.state.load();
ok(G.memoires.isFound("premierMatin"), "reconcile preserva found válido");
ok(G.memoires.get("desRires").state === "notFound", "reconcile saneia estado inválido -> notFound");
ok(G.memoires.get("deLaMarche").state === "notFound", "reconcile cria campo faltante -> notFound");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
