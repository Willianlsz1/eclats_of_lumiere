// Verificação do sistema de Gold Stats (Phase 3)
// Roda com: node tests/verify-gold-stats.js

const data = require("../js/data.js");
Object.assign(global, data);
for (const f of ["../js/progression.js", "../js/passives.js", "../js/loot.js", "../js/zones.js", "../js/game.js"]) {
  Object.assign(global, require(f));
}
const game = {};
for (const f of ["../js/progression.js", "../js/passives.js", "../js/loot.js", "../js/zones.js", "../js/game.js"]) {
  Object.assign(game, require(f));
}

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.error("  ❌ " + label + (detail ? " — " + detail : "")); }
}
function section(title) { console.log("\n═══ " + title + " ═══"); }


// ═══════════════════════════════════════════════════════════════
section("goldStatCost — Custo polynomial");

// STR: baseCost=10, exponent=1.8
// Level 0 → next: 10 × (0+1)^1.8 = 10 × 1 = 10
assert("STR lv0 cost = 10", game.goldStatCost("str", 0) === 10);

// Level 1 → next: 10 × (1+1)^1.8 = 10 × 3.48 ≈ 35
var strCost1 = game.goldStatCost("str", 1);
assert("STR lv1 cost ≈ 35", strCost1 === Math.round(10 * Math.pow(2, 1.8)),
  "got " + strCost1 + " expected " + Math.round(10 * Math.pow(2, 1.8)));

// Level 5: 10 × 6^1.8 ≈ 10 × 26.3 = 263
var strCost5 = game.goldStatCost("str", 5);
assert("STR lv5 cost ≈ 263", strCost5 === Math.round(10 * Math.pow(6, 1.8)),
  "got " + strCost5);

// AGI: baseCost=15, exponent=2.0
// Level 0: 15 × 1^2 = 15
assert("AGI lv0 cost = 15", game.goldStatCost("agi", 0) === 15);
// Level 4: 15 × 5^2 = 375
assert("AGI lv4 cost = 375", game.goldStatCost("agi", 4) === 375);

// Invalid stat
assert("Invalid stat cost = Infinity", game.goldStatCost("xxx", 0) === Infinity);


// ═══════════════════════════════════════════════════════════════
section("goldStatBonus — Bônus por level");

var s = game.defaultState();
assert("STR bonus at lv0 = 0", game.goldStatBonus(s, "str") === 0);

s.goldStats.str = 5;
assert("STR bonus at lv5 = 10 (5 × 2)", game.goldStatBonus(s, "str") === 10);

s.goldStats.vit = 3;
assert("VIT bonus at lv3 = 30 (3 × 10)", game.goldStatBonus(s, "vit") === 30);

s.goldStats.agi = 10;
var agiBonus = game.goldStatBonus(s, "agi");
assert("AGI bonus at lv10 = 0.30 (10 × 0.03)", Math.abs(agiBonus - 0.30) < 0.001,
  "got " + agiBonus);

s.goldStats.lck = 4;
var lckBonus = game.goldStatBonus(s, "lck");
assert("LCK bonus at lv4 = 0.020 (4 × 0.005)", Math.abs(lckBonus - 0.020) < 0.001,
  "got " + lckBonus);

s.goldStats.frt = 6;
var frtBonus = game.goldStatBonus(s, "frt");
assert("FRT bonus at lv6 = 0.30 (6 × 0.05)", Math.abs(frtBonus - 0.30) < 0.001,
  "got " + frtBonus);


// ═══════════════════════════════════════════════════════════════
section("buyGoldStat — Compra individual");

s = game.defaultState();
s.lumens = 100;

assert("Buy STR with 100 gold succeeds", game.buyGoldStat(s, "str") === true);
assert("STR is now lv1", s.goldStats.str === 1);
assert("Gold reduced by 10", s.lumens === 90, "got " + s.lumens);

// Buy again (cost = round(10 × 2^1.8) = 35)
assert("Buy STR lv2 succeeds", game.buyGoldStat(s, "str") === true);
assert("STR is now lv2", s.goldStats.str === 2);
assert("Gold reduced by 35 more", s.lumens === 55, "got " + s.lumens);

// Can't afford VIT lv0 (cost=12) with remaining 55? Yes can.
assert("Buy VIT with 55 gold succeeds", game.buyGoldStat(s, "vit") === true);

// Not enough for FRT (cost=25) after spending
s.lumens = 10;
assert("Can't buy FRT with 10 gold (cost 25)", game.buyGoldStat(s, "frt") === false);


// ═══════════════════════════════════════════════════════════════
section("buyGoldStatMax — Compra em bulk");

s = game.defaultState();
s.lumens = 1000;

var bought = game.buyGoldStatMax(s, "str");
assert("buyGoldStatMax buys multiple", bought > 1, "bought " + bought);
assert("STR level matches bought count", s.goldStats.str === bought);
assert("Gold is reduced", s.lumens < 1000, "remaining " + s.lumens);

// Preview should match
s = game.defaultState();
s.lumens = 500;
var preview = game.buyGoldStatMaxPreview(s, "str");
var lumensBefore = s.lumens;
var actualBought = game.buyGoldStatMax(s, "str");
assert("Preview count matches actual (" + preview.count + " vs " + actualBought + ")",
  preview.count === actualBought);
assert("Preview cost matches actual spent (" + preview.spent + " vs " + (lumensBefore - s.lumens) + ")",
  preview.spent === lumensBefore - s.lumens);


// ═══════════════════════════════════════════════════════════════
section("Integração — STR aumenta playerDamage");

s = game.defaultState();
var dmg0 = game.playerDamage(s);

s.goldStats.str = 10;  // +20 base damage
var dmg10 = game.playerDamage(s);
assert("STR 10 increases damage", dmg10 > dmg0, "dmg0=" + dmg0 + " dmg10=" + dmg10);
// Diferença esperada ≈ 20 (antes de multiplicadores)
assert("STR 10 adds ~20 damage", dmg10 - dmg0 === 20,
  "diff=" + (dmg10 - dmg0) + " expected 20");

s.goldStats.str = 0;


// ═══════════════════════════════════════════════════════════════
section("Integração — VIT aumenta playerMaxHp");

s = game.defaultState();
var hp0 = game.playerMaxHp(s);

s.goldStats.vit = 5;  // +50 base HP, amplificado pelos multiplicadores de HP
var hp5 = game.playerMaxHp(s);
assert("VIT 5 increases HP", hp5 > hp0, "hp0=" + hp0 + " hp5=" + hp5);
// Delta esperado = 50 base × (1 + hpMult dos afixos) × totalPowerMult (fórmula de playerMaxHp).
// Robusto à expansão de afixos da Fase 5 (Armor common agora tem afixo hpMult).
var hpScale = (1 + game.affixTotals(s).hpMult) * game.totalPowerMult(s);
var expectedDelta = game.goldStatBonus(s, "vit") * hpScale;
assert("VIT 5 adds 50 base HP (×mults)", Math.abs((hp5 - hp0) - expectedDelta) <= 2,
  "diff=" + (hp5 - hp0) + " expected≈" + expectedDelta.toFixed(1));

s.goldStats.vit = 0;


// ═══════════════════════════════════════════════════════════════
section("Integração — AGI aumenta attackSpeed");

s = game.defaultState();
var spd0 = game.attackSpeed(s);
var raw0 = game.atkSpeedRaw(s);

s.goldStats.agi = 5;  // +0.15 ao raw stat (agi.perLevel × 5)
var spd5 = game.attackSpeed(s);
var raw5 = game.atkSpeedRaw(s);
assert("AGI 5 increases speed", spd5 > spd0, "spd0=" + spd0 + " spd5=" + spd5);
// Com a fórmula √, spd = √raw. Verificamos que o raw aumentou 0.15 (e speed subiu).
assert("AGI 5 adds 0.15 to raw stat", Math.abs(raw5 - raw0 - 0.15) < 0.001,
  "diff_raw=" + (raw5 - raw0));

s.goldStats.agi = 0;


// ═══════════════════════════════════════════════════════════════
section("Integração — LCK aumenta critRate");

s = game.defaultState();
var cr0 = critRate(s);

s.goldStats.lck = 10;  // +5% crit rate
var cr10 = critRate(s);
assert("LCK 10 increases crit rate", cr10 > cr0, "cr0=" + cr0 + " cr10=" + cr10);
assert("LCK 10 adds 0.05 crit rate", Math.abs(cr10 - cr0 - 0.05) < 0.001,
  "diff=" + (cr10 - cr0));

s.goldStats.lck = 0;


// ═══════════════════════════════════════════════════════════════
section("Integração — FRT aumenta goldBonus");

s = game.defaultState();
var gb0 = game.goldBonus(s);

s.goldStats.frt = 4;  // +20% gold
var gb4 = game.goldBonus(s);
assert("FRT 4 increases gold bonus", gb4 > gb0, "gb0=" + gb0 + " gb4=" + gb4);
// Multiplicativo: gb4 = gb0 × 1.20
assert("FRT 4 multiplies by 1.20", Math.abs(gb4 / gb0 - 1.20) < 0.01,
  "ratio=" + (gb4 / gb0).toFixed(3));

s.goldStats.frt = 0;


// ═══════════════════════════════════════════════════════════════
section("Integração — WIS aumenta xpMultiplier");

s = game.defaultState();
var xp0 = game.xpMultiplier(s);

s.goldStats.wis = 6;  // +30% xp
var xp6 = game.xpMultiplier(s);
assert("WIS 6 increases XP mult", xp6 > xp0, "xp0=" + xp0 + " xp6=" + xp6);
assert("WIS 6 multiplies by 1.30", Math.abs(xp6 / xp0 - 1.30) < 0.01,
  "ratio=" + (xp6 / xp0).toFixed(3));

s.goldStats.wis = 0;


// ═══════════════════════════════════════════════════════════════
section("Ascensão reseta goldStats");

s = game.defaultState();
s.goldStats.str = 20;
s.goldStats.vit = 15;
s.level = 30;
s.regionProgress = { 0: [0] };

game.ascend(s);
assert("After ascend, STR = 0", s.goldStats.str === 0);
assert("After ascend, VIT = 0", s.goldStats.vit === 0);
assert("After ascend, all gold stats are 0",
  Object.values(s.goldStats).every(function(v) { return v === 0; }));


// ═══════════════════════════════════════════════════════════════
section("Tabela de custos (sanidade)");

console.log("\n  ┌───────────┬────────┬────────┬────────┬────────┬────────┐");
console.log("  │ Stat      │ Lv1    │ Lv5    │ Lv10   │ Lv20   │ Lv50   │");
console.log("  ├───────────┼────────┼────────┼────────┼────────┼────────┤");
GOLD_STATS.forEach(function(def) {
  var costs = [0, 4, 9, 19, 49].map(function(lv) {
    return fmt(game.goldStatCost(def.id, lv)).padStart(6);
  });
  console.log("  │ " + (def.name).padEnd(9) + " │" + costs.join(" │") + " │");
});
console.log("  └───────────┴────────┴────────┴────────┴────────┴────────┘");


// ═══════════════════════════════════════════════════════════════
section("Resultado final");

console.log("\n  " + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
console.log("  🎉 Phase 3 Gold Stats verification complete!\n");
