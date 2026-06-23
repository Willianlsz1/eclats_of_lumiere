// =============================================================
// tests/promotion.test.js — raridade + promoção (Common → Uncommon)
// Rodar: node tests/promotion.test.js
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

// 1) Mapa 1 só tem Common + Uncommon (Rare/Epic/Legendary removidas)
ok(G.data.rarities.length === 2 && G.data.rarities[0].id === "common" && G.data.rarities[1].id === "uncommon",
  "rarities = [Common, Uncommon] apenas");
ok(G.data.rarities[0].cap === 500 && G.data.rarities[1].cap === 1200, "caps: Common 500 / Uncommon 1200");

// 2) estado inicial: todas as peças Common
store = {}; G.state.data = null; G.state.load();
const slots = G.data.slots.map((s) => s.id);
ok(slots.every((id) => G.state.data.equipped[id].rarity === "common"), "estado inicial: todas as peças Common");
ok(G.gear.cap(G.state.data.equipped.weapon) === 500, "Common cap = 500");

// 3) escada de raridade
const w = () => G.state.data.equipped.weapon;
ok(G.gear.nextRarity({ rarity: "common" }) === "uncommon", "nextRarity(common) = uncommon");
ok(G.gear.nextRarity({ rarity: "uncommon" }) === null, "nextRarity(uncommon) = null (topo do Mapa 1)");
ok(G.gear.promotable(w()) === true, "Common é promovível");

// 4) requisito: estar no cap
ok(G.gear.canPromote(w()) === false, "não promove fora do cap (nível 1)");
w().level = 500; // no cap
ok(G.gear.isMaxed(w()) === true, "Common nível 500 está no cap");

// 5) requisito: materiais
G.state.data.gearMaterials.common = 0;
ok(G.gear.canPromote(w()) === false, "no cap mas sem materiais -> não promove");
G.state.data.gearMaterials.common = 10;
ok(G.gear.canPromote(w()) === true, "no cap + materiais -> pode promover");

// 6) promoção: consome materiais, sobe raridade, PRESERVA nível, aumenta cap
const before = G.state.data.gearMaterials.common;
const okp = G.gear.promote(w());
ok(okp === true, "promote() executou");
ok(w().rarity === "uncommon", "raridade subiu para Uncommon");
ok(w().level === 500, "nível PRESERVADO (500)");
ok(G.gear.cap(w()) === 1200, "cap aumentou para 1200");
ok(G.state.data.gearMaterials.common === before - 10, "consumiu 10 Common materials");
ok(G.gear.isMaxed(w()) === false, "após promover, 500/1200 não está mais no cap (pode evoluir)");

// 7) Uncommon no topo: não promove mais (sem Rare no Mapa 1)
w().level = 1200;
ok(G.gear.promotable(w()) === false && G.gear.canPromote(w()) === false, "Uncommon no cap não promove (topo do Mapa 1)");

// 8) não promove fora do cap mesmo com materiais
const h = () => G.state.data.equipped.helmet;
G.state.data.gearMaterials.common = 999; h().level = 100; // abaixo do cap 500
ok(G.gear.canPromote(h()) === false, "Common 100/500 com materiais -> ainda não (precisa do cap)");

// 9) passiva Fracture promotionCostReduction reduz o custo (placeholder de teste)
G.passives.UNIT.promotionCostReduction = 50;
G.state.data.passives.fracture[11] = 1; // nó "Promotion Cost Reduction"
h().level = 500;
const cost = G.gear.promotionCost(h());
ok(cost.common === 5, "promotionCostReduction 50% -> custo 10 cai para 5");
G.passives.UNIT.promotionCostReduction = 0; G.state.data.passives.fracture[11] = 0;

// 10) MIGRAÇÃO de save antigo (5 raridades) -> Common/Uncommon, nível clampado
store = {};
const oldSave = G.state.fresh();
oldSave.equipped = {
  weapon: { slot: "weapon", rarity: "legendary", level: 1000 }, // antigo -> Uncommon
  helmet: { slot: "helmet", rarity: "magic", level: 590 },      // antigo -> Uncommon
  armor:  { slot: "armor",  rarity: "common", level: 400 },     // Common
  gloves: { slot: "gloves", rarity: "epic", level: 1500 },      // -> Uncommon, clampa a 1200
  boots:  { slot: "boots",  rarity: "rare", level: 700 },       // -> Uncommon
  cloak:  { slot: "cloak",  rarity: "common", level: 500 },     // Common no cap
};
store[G.state.SAVE_KEY] = JSON.stringify(oldSave);
G.state.data = null; G.state.load();
const eq = G.state.data.equipped;
ok(eq.weapon.rarity === "uncommon" && eq.weapon.level === 1000, "migração: legendary->Uncommon, nível 1000 preservado");
ok(eq.helmet.rarity === "uncommon" && eq.helmet.level === 590, "migração: magic->Uncommon, nível preservado");
ok(eq.armor.rarity === "common" && eq.armor.level === 400, "migração: common permanece Common");
ok(eq.gloves.rarity === "uncommon" && eq.gloves.level === 1200, "migração: epic->Uncommon, nível 1500 clampado a 1200");
ok(eq.boots.rarity === "uncommon" && eq.boots.level === 700, "migração: rare->Uncommon, nível preservado");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
