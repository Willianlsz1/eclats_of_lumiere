// =============================================================
// tests/playthrough.test.js — JORNADA COMPLETA (espinha jogável headless)
// Valida o loop de ponta a ponta: kills → Convergence → passivas → Guardião →
// Awaken (Endormi→Seeker) → Boss Final → Mémoires (Era Restaurada) → Ascensão I.
// Rodar: node tests/playthrough.test.js
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
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "memoires", "ascension", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
const C = G.combat;
function killAt(areaIndex, flags) {
  G.state.data.areaIndex = areaIndex;
  C.enemy = Object.assign({ name: "x", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 10, xp: 5,
    isBoss: false, isElite: false, isMiniBoss: false, rarity: null }, flags);
  C.onKill();
}

store = {}; G.state.data = null; G.state.load();

// 1) começo: Endormi, sem moedas
ok(G.ascension.rank() === "Endormi", "início: rank Endormi");
ok(G.state.data.lumens === 0 && G.economy.getEclats() === 0 && G.state.data.vestiges === 0, "início: moedas zeradas");

// 2) farm no Mapa 1: kills geram Lumens
const lum0 = G.state.data.lumens;
for (let i = 0; i < 20; i++) killAt(0, {});
ok(G.state.data.lumens > lum0, "kills geram Lumens");

// 3) Convergence: alcança o gate e renasce -> Vestiges
G.state.data.level = G.convergence.gateLevel + 5;
G.state.data.runMaxAreaIndex = 2; G.state.data.areaIndex = 2;
ok(G.convergence.canConverge() === true, "no gate, pode convergir");
ok(G.convergence.converge() === true, "converge() executa");
ok(G.state.data.vestiges > 0 && G.state.data.convergences === 1, "Convergence credita Vestiges e conta o renascimento");
ok(G.state.data.level === 1 && G.state.data.areaIndex === 0, "Convergence reseta nível/área");

// 4) passivas destravam e são compráveis com Vestiges
ok(G.passives.unlocked() === true, "passivas destravam após a 1ª Convergence");
G.state.data.vestiges = 1e9;
const vBefore = G.state.data.vestiges;
ok(G.passives.buy("eclat", 0) === true, "compra de passiva (Radiant Strike) executa");
ok(G.state.data.vestiges < vBefore && G.passives.level("eclat", 0) === 1, "passiva sobe de nível e debita Vestiges");

// 5) progressão até o Guardião (Área 9) — derrotá-lo NÃO fecha o Continente
G.state.data.maxAreaUnlocked = 8;
killAt(8, { isBoss: true });
ok(G.state.data.guardianDefeated === true, "Guardião (Á9) derrotado marca a flag");
ok(G.state.data.mapOneCleared === false, "Guardião NÃO conclui o Continente");

// 6) Awaken (First Light): Endormi -> Seeker
const req = G.awaken.def("first_light").requirements;
G.state.data.level = req.level; G.state.data.convergences = req.convergences;
G.state.data.totalKills = req.kills; G.state.data.awakenMaterials.firstLight = req.materials.firstLight;
ok(G.awaken.canAwaken("first_light") === true, "com Guardião + requisitos, pode despertar");
ok(G.awaken.awaken("first_light") === true, "First Light executa");
ok(G.ascension.rank() === "Seeker", "após o Awaken, o herói é Seeker");

// 7) Mapa 2: Boss Final (Área 20) conclui o Continente
G.state.data.maxAreaUnlocked = 19;
killAt(19, { isBoss: true });
ok(G.state.data.mapOneCleared === true, "Boss Final (Á20) conclui o Continente 1");

// 8) Mémoires: descobrir, restaurar e maximizar -> Era I Restaurada
G.economy.addEclats(100);
for (const id of G.memoires.all()) {
  G.memoires.find(id);
  G.memoires.restore(id);
  while (G.memoires.canLevel(id)) G.memoires.upgrade(id);
  ok(G.memoires.get(id).level === G.memoires.MAX_LEVEL, `Mémoire ${id} chega ao nível máximo`);
}
ok(G.memoires.isEraRestored(1) === true, "Era I Restaurada (3 Mémoires no máximo)");

// 9) bônus mecânico ativo: dano com Premier Matin restaurada > 1
C.enemy = { isBoss: false, isElite: false, isMiniBoss: false };
ok(C.typeDamageMult() > 1, "bônus de Mémoire/passiva entram no multiplicador de dano");
C.enemy = null;

// 10) Ascensão I -> Illuminate
ok(G.ascension.canAscend() === true, "Awaken + Boss Final + Era Restaurada -> pode ascender");
ok(G.ascension.ascend() === true, "Ascensão I executa");
ok(G.ascension.count() === 1 && G.ascension.rank() === "Illuminate", "Ascensão I -> rank Illuminate");

// 11) persistência: save/load preserva a jornada
G.state.save(); G.state.data = null; G.state.load();
ok(G.ascension.rank() === "Illuminate" && G.state.data.mapOneCleared && G.memoires.isEraRestored(1),
  "save/load preserva Ascensão, Continente concluído e Era Restaurada");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
