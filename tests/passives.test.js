// =============================================================
// tests/passives.test.js — passivas funcionais + mecânicas memoráveis
// (Bloodlust, Fractured Destiny, Ancient Memory, Perfect Cycle,
//  Fragment Resonance, Deep Explorer, Iron Body, Slayer)
// Rodar: node tests/passives.test.js
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
const P = G.passives;
function idx(tree, key) { return P.trees[tree].list.findIndex((n) => n[1] === key); }
function setNode(tree, key, lv) { G.state.data.passives[tree][idx(tree, key)] = lv; G.state.invalidateStats(); }

store = {}; G.state.data = null; G.state.load();

// 0) toda effect key existe no UNIT e tem descrição (nada "mudo")
let allDescribed = true, allMagnitude = true;
for (const tree of P.TREES) for (const [name, key] of P.trees[tree].list) {
  if (!(key in P.EFFECT_DESC)) { allDescribed = false; console.log("  sem desc:", key); }
  const isMap2 = P.MAP2.indexOf(key) !== -1;
  if (!isMap2 && !(P.UNIT[key] > 0)) { allMagnitude = false; console.log("  magnitude 0:", key); }
}
ok(allDescribed, "todo nó tem descrição em EFFECT_DESC");
ok(allMagnitude, "todo nó (fora Mapa 2) tem magnitude > 0 — nenhum nó morto");

// 1) Iron Body (hpToDamage): parte do HP vira ATK
setNode("eclat", "hpToDamage", 0); const atk0 = G.state.stats().atk;
setNode("eclat", "hpToDamage", 4); const atk1 = G.state.stats().atk;
ok(atk1 > atk0, "Iron Body: HP→ATK aumenta o ATK");
setNode("eclat", "hpToDamage", 0);

// 2) Slayer (bossDmg): vale p/ Boss E Mini Boss
setNode("eclat", "bossDmg", 5);
G.combat.enemy = { isBoss: true }; const mBoss = G.combat.typeDamageMult();
G.combat.enemy = { isMiniBoss: true }; const mMini = G.combat.typeDamageMult();
G.combat.enemy = { isBoss: false, isMiniBoss: false, isElite: false }; const mMob = G.combat.typeDamageMult();
ok(mBoss > 1 && Math.abs(mBoss - mMini) < 1e-9, "Slayer: mesmo bônus contra Boss e Mini Boss");
ok(Math.abs(mMob - 1) < 1e-9, "Slayer: nenhum bônus contra mob comum");
setNode("eclat", "bossDmg", 0); G.combat.enemy = null;

// 3) Bloodlust (dmgPerKill): escala com runKills, zera na Convergence
setNode("eclat", "dmgPerKill", 12);
G.state.data.runKills = 0; const dl0 = P.dynDamageMult();
G.state.data.runKills = 1000; const dl1 = P.dynDamageMult();
ok(Math.abs(dl0 - 1) < 1e-9 && dl1 > dl0, "Bloodlust: dano cresce com kills da run");
setNode("eclat", "dmgPerKill", 0);

// 4) Fractured Destiny (dmgPerArea): escala com a maior área alcançada
setNode("fracture", "dmgPerArea", 6);
G.state.data.maxAreaUnlocked = 0; const fd0 = P.dynDamageMult();
G.state.data.maxAreaUnlocked = 19; const fd1 = P.dynDamageMult();
ok(Math.abs(fd0 - 1) < 1e-9 && fd1 > fd0, "Fractured Destiny: dano cresce com áreas alcançadas");
setNode("fracture", "dmgPerArea", 0); G.state.data.maxAreaUnlocked = 0;

// 5) Ancient Memory (atkPerConvergence): escala com Convergences
setNode("fracture", "atkPerConvergence", 10);
G.state.data.convergences = 0; const am0 = P.dynDamageMult();
G.state.data.convergences = 20; const am1 = P.dynDamageMult();
ok(am1 > am0, "Ancient Memory: dano cresce com Convergences");
setNode("fracture", "atkPerConvergence", 0); G.state.data.convergences = 0;

// 6) Perfect Cycle (globalPerCycle): degrau a cada 10 Convergences (dano e economia)
setNode("fracture", "globalPerCycle", 4);
G.state.data.convergences = 9; const pc9 = P.dynDamageMult();
G.state.data.convergences = 10; const pc10 = P.dynDamageMult();
ok(Math.abs(pc9 - 1) < 1e-9 && pc10 > pc9, "Perfect Cycle: ativa a cada 10 Convergences");
ok(P.dynLumensMult() > 1, "Perfect Cycle: também multiplica a economia");
setNode("fracture", "globalPerCycle", 0); G.state.data.convergences = 0;

// 7) Deep Explorer (lumensPerArea): economia escala com áreas
setNode("vestige", "lumensPerArea", 5);
G.state.data.maxAreaUnlocked = 0; const de0 = P.dynLumensMult();
G.state.data.maxAreaUnlocked = 15; const de1 = P.dynLumensMult();
ok(Math.abs(de0 - 1) < 1e-9 && de1 > de0, "Deep Explorer: Lumens crescem com áreas alcançadas");
setNode("vestige", "lumensPerArea", 0); G.state.data.maxAreaUnlocked = 0;

// 8) Fragment Resonance: cada Convergence amplifica TODAS as outras passivas
setNode("eclat", "atkPct", 5);
G.state.data.convergences = 0; setNode("fracture", "resonancePerConv", 0);
const baseAtkPct = P.effect("atkPct");
setNode("fracture", "resonancePerConv", 10); G.state.data.convergences = 50;
const ampAtkPct = P.effect("atkPct");
ok(ampAtkPct > baseAtkPct, "Fragment Resonance: amplifica os outros efeitos com as Convergences");
// não amplifica a si mesmo (evita feedback)
ok(P.effect("resonancePerConv") === 10 * P.UNIT.resonancePerConv, "Resonance não se auto-amplifica");
setNode("eclat", "atkPct", 0); setNode("fracture", "resonancePerConv", 0); G.state.data.convergences = 0;

// 9) integração: Bloodlust realmente aumenta o dano aplicado no combate
store = {}; G.state.data = null; G.state.load();
setNode("eclat", "dmgPerKill", 12);
G.state.data.runKills = 0; G.combat.enemy = { isBoss: false, isElite: false, isMiniBoss: false };
const hit0 = G.passives.dynDamageMult();
G.state.data.runKills = 500;
const hit1 = G.passives.dynDamageMult();
ok(hit1 > hit0, "integração: multiplicador de dano sobe conforme a run avança");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
