// =============================================================
// tests/hygiene.test.js — PRE_BALANCE_HYGIENE_FINAL
// slots, attack speed, efeitos órfãos resolvidos, unificação matPct, deferidos.
// Rodar: node tests/hygiene.test.js
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
function fresh() { store = {}; G.state.data = null; G.state.load(); }
// liga um efeito de passiva por nó (bypass de gating) com magnitude de teste
function setEffect(tree, idx, key, mag) { G.passives.UNIT[key] = mag; G.state.data.passives[tree][idx] = 1; G.state.invalidateStats(); }
function clearEffect(tree, idx, key) { G.passives.UNIT[key] = 0; G.state.data.passives[tree][idx] = 0; G.state.invalidateStats(); }

// ---------- Task 1: slots ----------
ok(G.gear.buildPiece("gloves", "common").affixes[0].stat === "crit", "Gloves primário = Crit");
ok(G.gear.buildPiece("boots", "common").affixes[0].stat === "atkSpeed", "Boots primário = Attack Speed");
ok(G.gear.buildPiece("cloak", "common").affixes[0].stat === "lumensBonus", "Cloak primário = Economia (lumens)");

// ---------- Task 2: attack speed (cap agora é map-aware) ----------
fresh();
ok(Math.abs(G.state.stats().atkSpeed - 0.9) < 1e-9, "Attack Speed base = 0.9");
G.state.data.equipped.boots.level = 3000; G.state.invalidateStats();
// Mapa 1 (mapOneCleared = false): teto = map1AtkSpeedCap (2)
ok(G.state.stats().atkSpeed === G.data.balance.map1AtkSpeedCap, "Attack Speed teto Mapa 1 = 2 (clampado)");
ok(Math.abs(G.state.attackInterval() - 1 / G.data.balance.map1AtkSpeedCap) < 1e-9, "attackInterval respeita o teto do Mapa 1");
// Mapa 2 (mapOneCleared = true): teto = atkSpeedCap (15)
G.state.data.mapOneCleared = true; G.state.invalidateStats();
ok(G.state.stats().atkSpeed === G.data.balance.atkSpeedCap, "Attack Speed teto Mapa 2 = 15 (clampado)");
ok(Math.abs(G.state.attackInterval() - 1 / G.data.balance.atkSpeedCap) < 1e-9, "attackInterval respeita o teto do Mapa 2");

// ---------- Task 3: bossDmg / eliteDmg agora aplicados inline em combat.playerHit ----------
// (a função typeDamageMult foi removida; o bônus entra direto no cálculo do golpe)
fresh();
G.passives.UNIT.bossDmg = 100; G.state.data.passives.eclat[6] = 1; G.state.invalidateStats();
ok(G.passives.effect("bossDmg") === 100, "bossDmg: efeito da passiva = +100% (×2 contra Boss no playerHit)");
G.passives.UNIT.bossDmg = 0; G.state.data.passives.eclat[6] = 0;
G.passives.UNIT.eliteDmg = 50; G.state.data.passives.eclat[7] = 1; G.state.invalidateStats();
ok(G.passives.effect("eliteDmg") === 50, "eliteDmg: efeito da passiva = +50% (×1.5 contra Elite/Rare)");
G.passives.UNIT.eliteDmg = 0; G.state.data.passives.eclat[7] = 0;

// capstoneEclat -> atk & hp ×
fresh();
const atk0 = G.state.stats().atk, hp0 = G.state.stats().hp;
setEffect("eclat", 14, "capstoneEclat", 100);
ok(Math.abs(G.state.stats().atk - atk0 * 2) < 2 && Math.abs(G.state.stats().hp - hp0 * 2) < 2, "capstoneEclat: ATK e HP ×2");
clearEffect("eclat", 14, "capstoneEclat");

// capstoneVestige -> lumens & xp ×
fresh();
const lum0 = G.state.stats().lumensBonus;
setEffect("vestige", 14, "capstoneVestige", 100);
ok(Math.abs(G.state.stats().lumensBonus - lum0 * 2) < 1e-6, "capstoneVestige: Lumens Bonus ×2");
clearEffect("vestige", 14, "capstoneVestige");

// capstoneFracture -> pontos de Convergence ×
fresh(); G.state.data.level = 200;
const pts0 = G.convergence.points();
G.passives.UNIT.capstoneFracture = 100; G.state.data.passives.fracture[14] = 1;
ok(G.convergence.points() === pts0 * 2, "capstoneFracture: pontos de Convergence ×2");
G.passives.UNIT.capstoneFracture = 0; G.state.data.passives.fracture[14] = 0;

// (upgradeCostReduction foi cortado da árvore Fracture — nó 10 hoje é "Refined Methods" → xpPct)

// awakenReqReduction -> reduz limiares numéricos do Awaken
fresh();
const needLv0 = G.awaken.requirements("first_light").find((r) => r.key === "level").need;
G.passives.UNIT.awakenReqReduction = 50; G.state.data.passives.fracture[5] = 1;
const needLv1 = G.awaken.requirements("first_light").find((r) => r.key === "level").need;
ok(needLv1 === Math.ceil(needLv0 * 0.5), "awakenReqReduction 50%: requisito de nível pela metade");
const areaReq = G.awaken.requirements("first_light").find((r) => r.key === "area").need;
ok(areaReq === G.awaken.def("first_light").requirements.area, "awakenReqReduction NÃO reduz o requisito de Área");
G.passives.UNIT.awakenReqReduction = 0; G.state.data.passives.fracture[5] = 0;

// awakenEfficiency -> amplifica o bônus do Awaken
fresh();
const req = G.awaken.def("first_light").requirements;
G.state.data.maxAreaUnlocked = req.area - 1; G.state.data.level = req.level;
G.state.data.totalKills = req.kills; G.state.data.convergences = req.convergences;
G.state.data.awakenMaterials.firstLight = req.materials.firstLight;
G.state.invalidateStats();                       // nível mudou → recomputar baseline
const atkNoAwk = G.state.stats().atk;
G.awaken.awaken("first_light"); G.state.invalidateStats();
const atkAwk = G.state.stats().atk;            // base × 2.5
G.passives.UNIT.awakenEfficiency = 100; G.state.data.passives.fracture[13] = 1; G.state.invalidateStats();
const atkEff = G.state.stats().atk;            // base × (1 + 1.5×2) = ×4
ok(atkEff > atkAwk && Math.abs(atkEff / atkNoAwk - 4) < 0.01, "awakenEfficiency 100%: bônus 2.5× vira 4×");
G.passives.UNIT.awakenEfficiency = 0; G.state.data.passives.fracture[13] = 0;

// ---------- Task 4: unificação matPct / matGeneralPct ----------
fresh();
ok(G.passives.trees.vestige.list[13][1] === "matGeneralPct", "nó 'Materials %' agora usa matGeneralPct");
ok(G.passives.UNIT.matPct === undefined, "chave matPct removida do UNIT");
G.passives.UNIT.matGeneralPct = 100; G.state.data.passives.vestige[8] = 1;
ok(Math.abs(G.economy.passiveQtyMult("commonMaterial") - 2) < 1e-9, "matGeneralPct 100%: quantidade de material ×2 (unificado)");
G.passives.UNIT.matGeneralPct = 0; G.state.data.passives.vestige[8] = 0;

// ---------- Task 3 (deferidos): moreEnemies / gearXp -> Mapa 2 ----------
fresh();
ok(G.passives.isDeferred("fracture", 8) && G.passives.isDeferred("fracture", 9), "moreEnemies e gearXp marcados como Mapa 2");
G.state.data.convergences = 1; // árvore desbloqueada
ok(G.passives.canBuy("fracture", 8) === false && G.passives.canBuy("fracture", 9) === false, "nós Mapa 2 não são compráveis");
ok(G.passives.treeProgress("fracture").total === 13, "treeProgress ignora os 2 nós Mapa 2 (15→13)");
// efeito 0 mesmo se houvesse nível
G.passives.UNIT.moreEnemies = 100; G.state.data.passives.fracture[8] = 5;
ok(G.passives.effect("moreEnemies") === 0, "nó Mapa 2 não produz efeito (excluído de effects())");
G.passives.UNIT.moreEnemies = 0; G.state.data.passives.fracture[8] = 0;
// gating de grupo ignora os deferidos
G.state.data.passives.fracture[5] = 12; G.state.data.passives.fracture[6] = 12; G.state.data.passives.fracture[7] = 12;
ok(G.passives.groupUnlocked("fracture", 2) === true, "grupo 2 libera com 5/6/7 no máx (8/9 Mapa 2 ignorados)");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
