// =============================================================
// tests/economy.test.js — fundação econômica (materiais + drops)
// Rodar: node tests/economy.test.js
// Sem framework: carrega os módulos de src/ num sandbox e usa asserts simples.
// =============================================================
const fs = require("fs");
const path = require("path");

global.window = global; // util.js faz window.G = ...; bare G resolve no global
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
const R0 = { rng: () => 0 }; // rng determinístico: chance passa, qty = min
// índice de um nó pela effect key (robusto a reorganização das árvores)
function nodeIdx(tree, key) { return G.passives.trees[tree].list.findIndex((n) => n[1] === key); }

// 1) fresh inicializa materiais zerados
store = {}; G.state.data = null; G.state.load();
ok(G.state.data.gearMaterials.common === 0 && G.state.data.gearMaterials.uncommon === 0, "fresh: gearMaterials zerados");
ok(G.state.data.awakenMaterials.firstLight === 0, "fresh: awakenMaterials.firstLight zerado");

// 2) compat: save antigo sem materiais -> inicializa com zero, resto preservado
const old = G.state.fresh(); delete old.gearMaterials; delete old.awakenMaterials; old.lumens = 777;
store[G.state.SAVE_KEY] = JSON.stringify(old);
G.state.data = null; G.state.load();
ok(G.state.data.lumens === 777 && G.state.data.gearMaterials.common === 0 && G.state.data.awakenMaterials.firstLight === 0,
  "save antigo: materiais criados com zero, resto preservado");

// 3) reconcile preenche subcampo faltante sem apagar existente
const part = G.state.fresh(); part.gearMaterials = { common: 5 };
store[G.state.SAVE_KEY] = JSON.stringify(part);
G.state.data = null; G.state.load();
ok(G.state.data.gearMaterials.common === 5 && G.state.data.gearMaterials.uncommon === 0,
  "reconcile preenche subcampo faltante sem apagar existente");

// 4) mob comum -> só Common material
store = {}; G.state.data = null; G.state.load(); G.state.data.areaIndex = 0;
let d = G.economy.rollDrops({}, Object.assign({ type: "common", areaIndex: 0 }, R0));
ok(d.commonMaterial >= 1 && !d.uncommonMaterial && !d.awakenMaterial, "common dropa só Common material");
ok(G.economy.getGear("common") >= 1, "Common material foi ao inventário");

// 5) boss em área alta -> Common + Uncommon + Awaken
d = G.economy.rollDrops({ isBoss: true }, Object.assign({ areaIndex: 5 }, R0));
ok(d.commonMaterial && d.uncommonMaterial && d.awakenMaterial, "boss (área 6) dropa Common+Uncommon+Awaken");
ok(G.economy.getAwaken("firstLight") >= 1, "Awaken material (firstLight) foi ao inventário");

// 6) gate de introdução: boss na área 0 só dropa Common
const before = G.economy.getGear("uncommon");
d = G.economy.rollDrops({ isBoss: true }, Object.assign({ areaIndex: 0 }, R0));
ok(!d.uncommonMaterial && !d.awakenMaterial && d.commonMaterial, "gate: área 0 só Common (Uncommon/Awaken bloqueados)");
ok(G.economy.getGear("uncommon") === before, "uncommon não aumentou na área 0");

// 7) passivas Vestige: matCommonPct dobra quantidade (set direto p/ ignorar gating)
store = {}; G.state.data = null; G.state.load();
G.passives.UNIT.matCommonPct = 100; G.state.data.passives.vestige[nodeIdx("vestige", "matCommonPct")] = 1; G.state.invalidateStats();
ok(G.passives.effect("matCommonPct") === 100, "passiva matCommonPct ativa (placeholder de teste)");
ok(Math.abs(G.economy.passiveQtyMult("commonMaterial") - 2) < 1e-9, "matCommonPct 100% -> quantidade ×2");
G.passives.UNIT.matCommonPct = 0;

// 8) passivas Vestige: dropRate -> chance; Fracture: awakenMatPct -> awaken qty
G.passives.UNIT.dropRate = 50; G.state.data.passives.vestige[nodeIdx("vestige", "dropRate")] = 1;
ok(Math.abs(G.economy.passiveChanceMult() - 1.5) < 1e-9, "dropRate 50% -> chance ×1.5");
G.passives.UNIT.dropRate = 0;
G.passives.UNIT.awakenMatPct = 100; G.state.data.passives.fracture[nodeIdx("fracture", "awakenMatPct")] = 1;
ok(Math.abs(G.economy.passiveQtyMult("awakenMaterial") - 2) < 1e-9, "awakenMatPct 100% -> awaken qty ×2");
G.passives.UNIT.awakenMatPct = 0;

// 9) save/load preserva materiais
store = {}; G.state.data = null; G.state.load();
G.economy.addGear("common", 12); G.economy.addGear("uncommon", 4); G.economy.addAwaken("firstLight", 3); G.state.save();
G.state.data = null; G.state.load();
ok(G.economy.getGear("common") === 12 && G.economy.getGear("uncommon") === 4 && G.economy.getAwaken("firstLight") === 3,
  "save/load preserva materiais");

// 10) integração combat.onKill concede materiais
store = {}; G.state.data = null; G.state.load(); G.state.data.areaIndex = 5;
const cBefore = G.economy.getGear("common"), aBefore = G.economy.getAwaken("firstLight");
const realRandom = Math.random; Math.random = () => 0;
G.combat.enemy = { name: "x", isBoss: true, maxHp: 10, hp: 0, dmg: 1, lumens: 10, xp: 5, level: 1, rarity: null };
G.combat.onKill();
Math.random = realRandom;
ok(G.economy.getGear("common") > cBefore && G.economy.getAwaken("firstLight") > aBefore,
  "combat.onKill (boss área 6) concede Common+Awaken via rollDrops");

// 11) awakenEssence legado intacto (First Light fora de escopo)
ok("awakenEssence" in G.state.data, "awakenEssence legado preservado (First Light fora de escopo)");

// 12) tipos elite/miniBoss já existem na tabela (prontos p/ inimigos futuros)
ok(!!(G.economy.dropTable.elite && G.economy.dropTable.miniBoss), "dropTable tem elite e miniBoss (prontos p/ futuro)");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
