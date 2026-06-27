// =============================================================
// tests/awaken.test.js — sistema Awaken (AWAKEN_V1)
// Rodar: node tests/awaken.test.js
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
const FL = "first_light";

// satisfaz todos os requisitos do First Light
function satisfyAll() {
  const d = G.state.data, req = G.awaken.def(FL).requirements;
  d.maxAreaUnlocked = req.area - 1;          // area (1-based) alcançada
  d.level = req.level;
  d.totalKills = req.kills;
  d.convergences = req.convergences;
  d.awakenMaterials.firstLight = req.materials.firstLight;
}

// 1) estrutura de requisitos configurável
store = {}; G.state.data = null; G.state.load();
const req = G.awaken.def(FL).requirements;
ok(req && "area" in req && "level" in req && "kills" in req && "convergences" in req && "materials" in req,
  "requirements tem area/level/kills/convergences/materials");
ok(G.awaken.requirements(FL).length >= 5, "requirements(id) lista todos os requisitos (incl. material)");

// 2) requisitos pendentes no início
ok(G.awaken.meetsRequirements(FL) === false, "no início, requisitos NÃO atendidos");
ok(G.awaken.canAwaken(FL) === false, "no início, não pode realizar Awaken");
const pend = G.awaken.requirements(FL).filter((r) => !r.met);
ok(pend.length > 0, "há requisitos pendentes listados (para a UI)");

// 3) cada requisito vira "met" ao ser satisfeito
satisfyAll();
const all = G.awaken.requirements(FL);
ok(all.every((r) => r.met), "todos os requisitos ficam concluídos quando satisfeitos");
ok(G.awaken.canAwaken(FL) === true, "com tudo satisfeito, pode realizar Awaken");

// 4) requisito de material é checado de fato
G.state.data.awakenMaterials.firstLight = 0;
ok(G.awaken.canAwaken(FL) === false, "sem Awaken Material -> não pode");
G.state.data.awakenMaterials.firstLight = req.materials.firstLight;

// 5) realizar Awaken consome material, marca concluído, sobe tier
const beforeMat = G.state.data.awakenMaterials.firstLight;
const did = G.awaken.awaken(FL);
ok(did === true, "awaken() executou");
ok(G.state.data.awakenMaterials.firstLight === beforeMat - req.materials.firstLight, "consumiu Awaken Material");
ok(G.awaken.isDone(FL) === true, "First Light marcado como concluído");
ok(G.state.data.awakens.indexOf(FL) !== -1 && G.state.data.awakenTier === 1, "awakens[] e awakenTier atualizados");
ok(G.awaken.canAwaken(FL) === false, "não pode realizar o mesmo Awaken duas vezes");

// 6) bônus do Awaken é aplicado aos stats (baseline medido NO MESMO nível)
store = {}; G.state.data = null; G.state.load();
satisfyAll(); G.state.invalidateStats();
const atkBefore = G.state.stats().atk, hpBefore = G.state.stats().hp;
G.awaken.awaken(FL); G.state.invalidateStats();
const b = G.awaken.def(FL).bonus;
ok(G.state.stats().atk > atkBefore && Math.abs(G.state.stats().atk - atkBefore * b.atkMult) < 2,
  "bônus aplicado: ATK ×atkMult");
ok(Math.abs(G.state.stats().hp - hpBefore * b.hpMult) < 2, "bônus aplicado: HP ×hpMult");

// 7) persistência: awaken concluído sobrevive a save/load
G.state.save(); G.state.data = null; G.state.load();
ok(G.awaken.isDone(FL) && G.state.data.awakenTier === 1, "save/load preserva Awaken concluído e tier");

// 8) totalKills acumula em onKill e NÃO reseta na Convergence
store = {}; G.state.data = null; G.state.load();
const mob8 = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: false };
G.combat.enemies = [mob8]; G.combat.enemy = mob8;   // onKill opera sobre enemies[]
G.combat.onKill();
ok(G.state.data.totalKills === 1, "totalKills incrementa em onKill");
G.state.data.level = 100; G.convergence.converge();
ok(G.state.data.totalKills === 1 && G.state.data.runKills === 0, "Convergence reseta runKills mas NÃO totalKills");

// 9) MIGRAÇÃO de save: awakenTier ausente é derivado da lista awakens; concluído sobrevive
store = {};
const oldSave = G.state.fresh();
delete oldSave.awakenTier;        // save sem o tier explícito
oldSave.awakens = [FL];           // campo canônico atual
oldSave.awakenMaterials = { firstLight: 3 };
store[G.state.SAVE_KEY] = JSON.stringify(oldSave);
G.state.data = null; G.state.load();
ok(G.state.data.awakens.indexOf(FL) !== -1, "migração: awakens preservado no load");
ok(G.state.data.awakensUnlocked.indexOf(FL) !== -1, "migração: awakensUnlocked espelha awakens");
ok(G.state.data.awakenTier === 1, "migração: awakenTier derivado da lista (ausente -> 1)");
ok(G.state.data.awakenMaterials.firstLight === 3, "migração: awakenMaterials preservado");
ok(G.awaken.isDone(FL) === true, "migração: Awaken concluído continua concluído");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
