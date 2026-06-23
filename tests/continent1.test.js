// =============================================================
// tests/continent1.test.js — correções CP-3A…3E (fechamento do Continente 1)
// Rodar: node tests/continent1.test.js
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
const A = G.data.areas;
function killEnemy(flags, areaIndex) {
  G.state.data.areaIndex = areaIndex == null ? G.state.data.areaIndex : areaIndex;
  G.combat.enemy = Object.assign({ name: "x", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: false, isElite: false, isMiniBoss: false }, flags);
  G.combat.onKill();
}

// ---------- CP-3A: 20 áreas ----------
ok(A.length === 20, "CP-3A: Continente 1 tem 20 áreas");
ok(A[0].levelRange[0] === 1 && A[8].levelRange[1] === 5000, "Parte I (1–9) intacta (1 → 5000)");
ok(A[9].levelRange[0] === 5001 && A[19].levelRange[1] === 16000, "Parte II (10–20) estende além de 5000");
ok(A.every((a) => Array.isArray(a.hp) && a.hp[0] > 0 && a.hp[1] >= a.hp[0]), "todas as 20 áreas têm hp:[ini,fim] válido");
// mobHpAt continua coerente nas áreas novas
ok(G.data.mobHpAt(A[19].levelRange[0], A[19]) === A[19].hp[0], "mobHpAt funciona na Área 20 (início = hpIni)");

// ---------- CP-3B: Guardião Á9 + Boss Final Á20 ----------
ok(A[8].boss.name === "The Guardian", "Área 9 = Guardião (gate do Awaken)");
ok(A[19].boss.name === "The Gilded Hollow" && A[19].miniBossRandom === true, "Área 20 = Boss Final (Gilded Hollow) + mini boss aleatório");
// matar o boss da Área 20 marca o Continente completo; o da Área 9 NÃO
store = {}; G.state.data = null; G.state.load();
G.state.data.areaIndex = 8; killEnemy({ isBoss: true }, 8);
ok(!G.state.data.mapOneCleared, "derrotar o Guardião (Á9) NÃO conclui o Continente");
G.state.data.areaIndex = 19; killEnemy({ isBoss: true }, 19);
ok(G.state.data.mapOneCleared === true, "derrotar o Boss Final (Á20) conclui o Continente");

// ---------- CP-3C: fonte de Éclats (Mini Boss / Boss) ----------
store = {}; G.state.data = null; G.state.load();
ok(G.economy.getEclats() === 0, "Éclats começam em 0");
killEnemy({ isMiniBoss: true }, 1);
ok(G.economy.getEclats() === G.data.balance.eclatsPerMiniBoss, "Mini Boss concede Éclats");
const afterMB = G.economy.getEclats();
killEnemy({ isBoss: true }, 1);
ok(G.economy.getEclats() === afterMB + G.data.balance.eclatsPerBoss, "Boss concede Éclats");
const afterBoss = G.economy.getEclats();
killEnemy({ isBoss: false }, 1); // mob comum
ok(G.economy.getEclats() === afterBoss, "mob comum NÃO concede Éclats");

// ---------- CP-3D: pity garante as Mémoires por área ----------
store = {}; G.state.data = null; G.state.load();
// na Área 7 (antes do limite 8) o pity ainda não garante M1
killEnemy({}, 6);
ok(G.memoires.get("premierMatin").state === "notFound", "antes da Área 8: M1 ainda não garantida pelo pity");
// na Área 8 o pity garante M1
killEnemy({}, 7);
ok(G.memoires.get("premierMatin").state === "found", "Área 8: pity garante M1 (du Premier Matin)");
ok(G.memoires.get("desRires").state === "notFound", "Área 8: M2 ainda não garantida (limite 14)");
// na Área 18 o pity garante todas
killEnemy({}, 17);
ok(["premierMatin", "desRires", "deLaMarche"].every((id) => G.memoires.isFound(id)), "Área 18: pity garante as 3 Mémoires");
// pity não redescobre uma já encontrada/restaurada
G.economy.addEclats(50); G.memoires.restore("premierMatin");
killEnemy({}, 17);
ok(G.memoires.get("premierMatin").state === "restored", "pity não rebaixa uma Mémoire já restaurada");

// ---------- CP-3E: Ascension I + rank por Ascension ----------
store = {}; G.state.data = null; G.state.load();
ok(G.ascension.count() === 0 && G.ascension.rank() === "Seeker", "rank inicial = Seeker (0 ascensions)");
ok(G.ascension.canAscend() === false, "não pode ascender sem requisitos");
// satisfaz os 3 requisitos
const req = G.awaken.def("first_light").requirements;
G.state.data.maxAreaUnlocked = req.area - 1; G.state.data.level = req.level;
G.state.data.totalKills = req.kills; G.state.data.convergences = req.convergences;
G.state.data.awakenMaterials.firstLight = req.materials.firstLight;
G.awaken.awaken("first_light");                 // Awaken ✓
G.state.data.mapOneCleared = true;               // Boss Final ✓
for (const id of G.memoires.all()) G.state.data.memoires[id] = { state: "restored", level: 10 }; // Era I Restaurada ✓
ok(G.ascension.requirements().every((r) => r.met), "3 requisitos da Ascension I atendidos");
ok(G.ascension.canAscend() === true, "canAscend() = true com Awaken + Boss Final + Era I Restaurada");
ok(G.ascension.ascend() === true, "ascend() executa");
ok(G.ascension.count() === 1 && G.ascension.rank() === "Illuminate", "Ascension I concede rank Illuminate");
ok(G.ascension.canAscend() === false, "não há segunda Ascension no Continente 1");

// rank persiste e é por ascension (não por nível)
G.state.data.level = 1; // nível baixo não rebaixa o rank
G.state.save(); G.state.data = null; G.state.load();
ok(G.ascension.rank() === "Illuminate" && G.state.data.ascensions === 1, "save/load preserva a Ascension; rank vem da Ascension, não do nível");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
