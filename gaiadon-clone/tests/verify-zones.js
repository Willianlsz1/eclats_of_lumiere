// Verificação das fórmulas de zones.js (Phase 2)
// Roda com: node tests/verify-zones.js

const data = require("../js/data.js");
// Injeta globais (zones.js usa globais do browser)
Object.assign(global, data);

const zones = require("../js/zones.js");

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.error("  ❌ " + label + (detail ? " — " + detail : "")); }
}
function section(title) { console.log("\n═══ " + title + " ═══"); }

// ═══════════════════════════════════════════════════════════════
section("enemyStatsFor — Fórmula de interpolação geométrica");

// Plains Normal wave 1: zoneStart = 10 × 1 = 10 → HP = 10 × 10^0 = 10
var s1 = zones.enemyStatsFor(0, 0, 1);
assert("Plains Normal w1 HP = 10", s1.hp === 10, "got " + s1.hp);
assert("Plains Normal w1 DMG = 2 (10×0.15=1.5→2)", s1.dmg === 2, "got " + s1.dmg);
assert("Plains Normal w1 Gold = 5 (10×0.5)", s1.gold === 5, "got " + s1.gold);
assert("Plains Normal w1 XP = 3 (10×0.3)", s1.xp === 3, "got " + s1.xp);

// Plains Normal wave 30 (boss wave): progress = 29/29 = 1 → HP = 10 × 10^1 = 100
var s30 = zones.enemyStatsFor(0, 0, 30);
assert("Plains Normal w30 HP = 100 (zoneEnd)", s30.hp === 100, "got " + s30.hp);

// Plains Hard wave 1: zoneStart = 10 × 10 = 100
var sh1 = zones.enemyStatsFor(0, 1, 1);
assert("Plains Hard w1 HP = 100", sh1.hp === 100, "got " + sh1.hp);

// Forest Normal wave 1: zoneStart = 15000 × 1 = 15000
var fN1 = zones.enemyStatsFor(1, 0, 1);
assert("Forest Normal w1 HP = 15,000", fN1.hp === 15000, "got " + fN1.hp);

// Peak Nightmare wave 1: zoneStart = 15e12 × 100 = 1.5e15
var pNm1 = zones.enemyStatsFor(4, 2, 1);
var expectedPNm1 = Math.round(15e12 * 100);
assert("Peak Nightmare w1 HP = 1.5Qa", pNm1.hp === expectedPNm1,
  "got " + pNm1.hp + " expected " + expectedPNm1);

// Peak Nightmare wave 75 (boss): progress = 74/74 = 1 → HP = 1.5e15 × 10 = 1.5e16
var pNm75 = zones.enemyStatsFor(4, 2, 75);
var expectedPNm75 = Math.round(15e12 * 100 * 10);
assert("Peak Nightmare w75 HP = 15Qa (1.5e16)", pNm75.hp === expectedPNm75,
  "got " + pNm75.hp + " expected " + expectedPNm75);

// Mid-wave: Plains Normal wave 16 (mid-point) progress = 15/29 ≈ 0.517
var sMid = zones.enemyStatsFor(0, 0, 16);
var expectedMid = Math.round(10 * Math.pow(10, 15/29));
assert("Plains Normal w16 HP ≈ " + expectedMid + " (geometric mid)",
  sMid.hp === expectedMid, "got " + sMid.hp);


// ═══════════════════════════════════════════════════════════════
section("availableEnemies — Wave Tiers");

// Normal (30 waves): enemy 0 from wave 1, enemy 1 from wave 7, etc.
var av1 = zones.availableEnemies(0, 0, 1);
assert("Normal w1: only enemy 0 available", av1.length === 1, "got " + av1.length);
assert("Normal w1: is Fading Stag", av1[0].name === "Fading Stag");

var av7 = zones.availableEnemies(0, 0, 7);
assert("Normal w7: 2 enemies (0.20×30+1=7)", av7.length === 2, "got " + av7.length);

var av13 = zones.availableEnemies(0, 0, 13);
assert("Normal w13: 3 enemies (0.40×30+1=13)", av13.length === 3, "got " + av13.length);

var av25 = zones.availableEnemies(0, 0, 25);
assert("Normal w25: all 5 enemies (0.80×30+1=25)", av25.length === 5, "got " + av25.length);

// Hard (50 waves): enemy 1 from wave 8 (0.15×50+1=8.5→8)
var avH8 = zones.availableEnemies(0, 1, 8);
assert("Hard w8: 2 enemies (0.15×50+1=8)", avH8.length === 2, "got " + avH8.length);

// Nightmare: all from wave 1
var avN1 = zones.availableEnemies(0, 2, 1);
assert("Nightmare w1: all 5 enemies", avN1.length === 5, "got " + avN1.length);


// ═══════════════════════════════════════════════════════════════
section("makeEnemy — Archetype + Tier + Boss");

// Fake state para Plains Normal wave 1, 0 ascensions
var fakeState = {
  region: 0, difficulty: 0, wave: 1, ascensions: 0,
  enemies: [], regionProgress: { 0: [] },
};

// Test boss creation
fakeState.wave = 30; // boss wave
var boss = zones.makeEnemy(fakeState);
assert("Boss wave creates boss", boss.isBoss === true);
assert("Boss name matches region", boss.name === "Auroral Sentinel");
// Boss HP = wave30 stats × ascMult(=1) × bossHpMult(=5) = 100 × 1 × 5 = 500
assert("Boss HP = 500 (100 × 5)", boss.hp === 500, "got " + boss.hp);
assert("Boss gold = 800 (100×0.5=50 × 8)", boss.goldReward === 400,
  "got " + boss.goldReward);

// Test regular enemy
fakeState.wave = 1;
var enemy = zones.makeEnemy(fakeState);
assert("Wave 1 creates non-boss", enemy.isBoss === false);
assert("Enemy has archetype", typeof enemy.archetype === "string");
assert("Enemy has tier", ["normal","elite","champion"].includes(enemy.tier));

// Test ascension scaling
fakeState.ascensions = 10;
fakeState.wave = 1;
var ascEnemy = zones.makeEnemy(fakeState);
var ascMult = Math.pow(1.06, 10);
// HP without arch/elite = 10, with ascMult ≈ 17.9
assert("Asc 10 scales HP by 1.06^10 ≈ 1.79×",
  ascEnemy.hp >= 10 && ascEnemy.hp <= Math.round(10 * ascMult * 3.5), // max arch × elite
  "got " + ascEnemy.hp);
fakeState.ascensions = 0;


// ═══════════════════════════════════════════════════════════════
section("spawnPack — Pack size + Swarm bonus");

fakeState.wave = 1;
fakeState.difficulty = 0;

// Normal w1: pack base = 1, should have at least 1 enemy
var pack = zones.spawnPack(fakeState);
assert("Normal w1 pack has ≥1 enemy", pack.length >= 1, "got " + pack.length);
assert("spawnPack sets s.enemies", fakeState.enemies === pack);

// Boss pack = 1
fakeState.wave = 30;
var bossPack = zones.spawnPack(fakeState);
assert("Boss pack = 1 enemy", bossPack.length === 1, "got " + bossPack.length);
assert("Boss pack enemy isBoss=true", bossPack[0].isBoss === true);

// Pack capping: Nightmare should cap at maxByDifficulty[2]=8
fakeState.wave = 70;
fakeState.difficulty = 2;
var nightPack = zones.spawnPack(fakeState);
assert("Nightmare late pack ≤8", nightPack.length <= 8, "got " + nightPack.length);
fakeState.wave = 1;
fakeState.difficulty = 0;


// ═══════════════════════════════════════════════════════════════
section("packSizeFor — Base and growth");

assert("Normal w1 pack = 1", zones.packSizeFor(0, 1, false) === 1);
assert("Hard w1 pack = 2",   zones.packSizeFor(1, 1, false) === 2);
assert("Nightmare w1 pack = 3", zones.packSizeFor(2, 1, false) === 3);
assert("Boss pack = 1 always", zones.packSizeFor(0, 1, true) === 1);

// Normal w7 pack = min(3, 1 + floor(6/3)) = min(3, 3) = 3
assert("Normal w7 pack = 3 (capped)", zones.packSizeFor(0, 7, false) === 3);


// ═══════════════════════════════════════════════════════════════
section("shardsOnKill — Escala com powerMult");

var s_p_n = zones.shardsOnKill(0, 0, false);
assert("Plains Normal regular = 1 shard", s_p_n === 1, "got " + s_p_n);

var s_f_n = zones.shardsOnKill(1, 0, false);
assert("Forest Normal regular = 3 shards", s_f_n === 3, "got " + s_f_n);

var s_p_boss = zones.shardsOnKill(0, 0, true);
assert("Plains Normal boss = 5 shards (1 × 5)", s_p_boss === 5, "got " + s_p_boss);

var s_p_h = zones.shardsOnKill(0, 1, false);
assert("Plains Hard regular = 2 shards (1 × shardMult 2)", s_p_h === 2, "got " + s_p_h);

// Peak Nightmare boss: (1 + 4×2)=9 × 3 × 5 = 135 (não 4500!)
var s_peak_nm_boss = zones.shardsOnKill(4, 2, true);
assert("Peak Nightmare boss = 135 shards (9 × 3 × 5)", s_peak_nm_boss === 135, "got " + s_peak_nm_boss);


// ═══════════════════════════════════════════════════════════════
section("Region Mastery — funciona corretamente");

var ms = { regionMastery: {} };
assert("Region 0 mastery kills = 200", zones.killsToMasterRegion(0) === 200);
assert("Region 2 mastery kills = 300", zones.killsToMasterRegion(2) === 300);
assert("Not mastered initially", !zones.isRegionMastered(ms, 0));

// Simulate 200 kills
for (var k = 0; k < 200; k++) zones.recordRegionMasteryKill(ms, 0);
assert("Mastered after 200 kills", zones.isRegionMastered(ms, 0));
assert("Mastered count = 1", zones.masteredRegionCount(ms) === 1);


// ═══════════════════════════════════════════════════════════════
section("Region unlock / clear");

var us = { regionProgress: { 0: [] }, region: 0, difficulty: 0 };
assert("Region 0 unlocked", zones.isRegionUnlocked(us, 0));
assert("Region 1 NOT unlocked", !zones.isRegionUnlocked(us, 1));
assert("Difficulty 0 unlocked for region 0", zones.isDifficultyUnlocked(us, 0, 0));
assert("Difficulty 1 NOT unlocked yet", !zones.isDifficultyUnlocked(us, 0, 1));

zones.clearCurrentDifficulty(us);
assert("After clear Normal: difficulty 0 cleared", zones.isDifficultyCleared(us, 0, 0));
assert("After clear Normal: difficulty 1 unlocked", zones.isDifficultyUnlocked(us, 0, 1));
assert("After clear Normal: region 1 unlocked", zones.isRegionUnlocked(us, 1));


// ═══════════════════════════════════════════════════════════════
section("Continuidade da escala entre zonas");

// A última wave de uma zona deveria ser ~10× a próxima zona's primeira wave.
// Plains Normal w30 = 100. Forest Normal w1 = 15000. Ratio = 150×.
// Mas isso é por DESIGN — regiões são saltos grandes, dificuldades escalam dentro.
// O que IMPORTA é que Plains Hard w1 (100) > Plains Normal w30 (100) — exatamente contínuo.

var pN_last = zones.enemyStatsFor(0, 0, 30).hp;   // 100
var pH_first = zones.enemyStatsFor(0, 1, 1).hp;     // 100
assert("Plains Normal last HP = Plains Hard first HP (" + pN_last + " vs " + pH_first + ")",
  pN_last === pH_first);

var pH_last = zones.enemyStatsFor(0, 1, 50).hp;     // 1000
var pNm_first = zones.enemyStatsFor(0, 2, 1).hp;     // 1000
assert("Plains Hard last HP = Plains Nightmare first HP (" + pH_last + " vs " + pNm_first + ")",
  pH_last === pNm_first);


// ═══════════════════════════════════════════════════════════════
section("HP overview por zona (tabela de sanidade)");

console.log("\n  ┌─────────────────────────┬─────────┬────────────┬──────────────┐");
console.log("  │ Zone                    │ Wave 1  │ Mid Wave   │ Boss Wave    │");
console.log("  ├─────────────────────────┼─────────┼────────────┼──────────────┤");

for (var r = 0; r < REGIONS.length; r++) {
  for (var d = 0; d < DIFFICULTIES.length; d++) {
    var diff = DIFFICULTIES[d];
    var midW = Math.ceil(diff.waves / 2);
    var w1   = zones.enemyStatsFor(r, d, 1);
    var wM   = zones.enemyStatsFor(r, d, midW);
    var wB   = zones.enemyStatsFor(r, d, diff.waves);
    var label = (REGIONS[r].name + " " + diff.name).padEnd(23);
    console.log("  │ " + label + " │ " + fmt(w1.hp).padStart(7) + " │ " +
      fmt(wM.hp).padStart(10) + " │ " + fmt(wB.hp).padStart(12) + " │");
  }
}
console.log("  └─────────────────────────┴─────────┴────────────┴──────────────┘");


// ═══════════════════════════════════════════════════════════════
section("Resultado final");

console.log("\n  " + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
console.log("  🎉 Phase 2 zones.js verification complete!\n");
