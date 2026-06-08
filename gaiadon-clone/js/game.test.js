// Carrega todos os módulos em ordem de dependência -> globalThis, depois roda os testes.
const data = require("./data.js");
Object.assign(globalThis, data);
for (const f of ["./progression.js", "./passives.js", "./loot.js", "./zones.js", "./game.js"]) {
  Object.assign(globalThis, require(f));
}
const game = {};
for (const f of ["./progression.js", "./passives.js", "./loot.js", "./zones.js", "./game.js"]) {
  Object.assign(game, require(f));
}
const { test, assert, assertEqual, report } = require("./_assert.js");

console.log("== Estado base ==");
test("defaultState: regionProgress com plains desbloqueada, equipamento common nível 1", () => {
  const s = game.defaultState();
  assertEqual(s.region, 0);
  assertEqual(s.difficulty, 0);
  assertEqual(s.wave, 1);
  assertEqual(s.vestiges, 0);
  assertEqual(s.equipped.Weapon.rarity, 0);
  assertEqual(s.equipped.Weapon.level, 1);
  assertEqual(s.ascensions, 0);
  assert("0" in s.regionProgress, "Plains deve estar desbloqueada");
});

console.log("== Equipamento ==");
test("itemPower cresce com nível e raridade", () => {
  const low = game.itemPower({ rarity: 0, level: 1 });
  const hiLevel = game.itemPower({ rarity: 0, level: 10 });
  const hiRarity = game.itemPower({ rarity: 2, level: 10 });
  assert(hiLevel > low, "mais nível = mais power");
  assert(hiRarity > hiLevel, "mais raridade = mais power");
});

test("levelUpItem gasta lumens e sobe o nível", () => {
  const s = game.defaultState();
  s.lumens = 1000;
  const before = s.equipped.Weapon.level;
  assert(game.levelUpItem(s, "Weapon"), "deveria comprar nível");
  assertEqual(s.equipped.Weapon.level, before + 1);
  assert(s.lumens < 1000, "deveria gastar lumens");
});

test("levelUpMax compra vários níveis de uma vez", () => {
  const s = game.defaultState();
  s.lumens = 1000;
  const n = game.levelUpMax(s, "Weapon");
  assert(n > 1, "deveria comprar vários níveis");
  assertEqual(s.equipped.Weapon.level, 1 + n);
});

test("levelUpMax respeita o cap da raridade", () => {
  const s = game.defaultState();
  s.lumens = 1e12;
  game.levelUpMax(s, "Weapon");
  assertEqual(s.equipped.Weapon.level, RARITIES[0].cap, "para no cap da common");
});

test("levelUpMaxPreview bate com a compra real (count e custo)", () => {
  const s = game.defaultState();
  s.lumens = 800;
  const pre = game.levelUpMaxPreview(s, "Weapon");
  const lumensBefore = s.lumens;
  const n = game.levelUpMax(s, "Weapon");
  assertEqual(pre.count, n, "count previsto = comprado");
  assertEqual(pre.spent, lumensBefore - s.lumens, "custo previsto = gasto");
});

test("nível trava no cap da raridade", () => {
  const s = game.defaultState();
  s.lumens = 1e9;
  s.equipped.Weapon.level = RARITIES[0].cap;
  assertEqual(game.levelUpItem(s, "Weapon"), false, "não passa do cap sem subir raridade");
});

test("rarityUpItem exige estar no cap + vestiges e libera o próximo cap", () => {
  const s = game.defaultState();
  s.equipped.Weapon.level = RARITIES[0].cap;
  s.vestiges = 1e9; s.lumens = 1e9;
  const r0 = s.equipped.Weapon.rarity;
  assert(game.rarityUpItem(s, "Weapon"), "deveria subir a raridade");
  assertEqual(s.equipped.Weapon.rarity, r0 + 1);
  assert(game.levelUpItem(s, "Weapon"), "após subir raridade, nível volta a subir");
});

test("não sobe raridade fora do cap", () => {
  const s = game.defaultState();
  s.vestiges = 1e9;
  assertEqual(game.rarityUpItem(s, "Weapon"), false, "precisa estar no cap pra subir raridade");
});

console.log("== Afixos / Crítico ==");
test("itemAffixes ativa afixos conforme a raridade", () => {
  assertEqual(game.itemAffixes("Weapon", 0).length, 0);
  assertEqual(game.itemAffixes("Weapon", 1).length, 1);
  assertEqual(game.itemAffixes("Weapon", 4).length, 4);
});

test("affixTotals soma os afixos dos itens equipados", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2;
  const t = game.affixTotals(s);
  assert(t.critRate > 0 && t.critDmg > 0, "deveria somar crit dos afixos");
});

test("afixos escalam com o nível do item", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2;
  s.equipped.Weapon.level = 1;
  const low = game.affixTotals(s).critDmg;
  s.equipped.Weapon.level = 500;
  const high = game.affixTotals(s).critDmg;
  assert(high > low, "subir o nível do item deveria aumentar o afixo");
});

test("afixos de crítico aumentam o DPS", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2;
  assert(game.critRate(s) > 0, "deveria ter crit rate");
  assert(game.playerDps(s) > game.playerDamage(s) * game.attackSpeed(s), "crit deveria multiplicar o DPS");
});

test("Damage % e Health % dos afixos aumentam os stats", () => {
  const s = game.defaultState();
  s.equipped.Armor.rarity = 1;
  const hpBase = CONFIG.player.baseHp;
  assert(game.playerMaxHp(s) > hpBase, "hpMult deveria aumentar a vida acima da base");
});

console.log("== Stats vindos do equipamento ==");
test("subir a Weapon aumenta o Damage", () => {
  const s = game.defaultState();
  const d0 = game.playerDamage(s);
  s.equipped.Weapon.level = 10;
  assert(game.playerDamage(s) > d0, "Weapon melhor = mais dano");
});

test("Amulet dá Attack Speed E Gold Find", () => {
  const s = game.defaultState();
  const spd0 = game.attackSpeed(s), gold0 = game.goldBonus(s);
  s.equipped.Amulet.level = 50;
  assert(game.attackSpeed(s) > spd0, "amuleto deveria acelerar ataques");
  assert(game.goldBonus(s) > gold0, "amuleto deveria aumentar ouro");
});

console.log("== Combate e regiões ==");
test("registerKill dá vestiges", () => {
  const s = game.defaultState();
  game.spawnPack(s);
  const ev = game.registerKill(s);
  assert(ev.vestiges > 0, "deveria ganhar vestiges");
});

test("Boss kill limpa a dificuldade e desbloqueia próximo conteúdo", () => {
  const s = game.defaultState();
  // Avança até a boss wave
  s.wave = totalWaves(0); // boss wave
  game.spawnPack(s);
  assert(s.enemies[0].isBoss, "última wave deve ter Boss");
  const ev = game.registerKill(s);
  assert(ev.wasBoss, "deveria ser kill de boss");
  assert(ev.difficultyCleared, "deveria marcar dificuldade como limpa");
  // Verifica que Plains Normal está limpa
  assert(isDifficultyCleared(s, 0, 0), "Plains Normal deveria estar limpa");
  // Verifica que Forest está desbloqueada
  assert(isRegionUnlocked(s, 1), "Forest deveria estar desbloqueada");
  // Verifica que Plains Hard está desbloqueada
  assert(isDifficultyUnlocked(s, 0, 1), "Plains Hard deveria estar desbloqueada");
});

test("wave avança ao atingir killsPerWave", () => {
  const s = game.defaultState();
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  const kpw = killsPerWave();
  let advanced = false;
  for (let i = 0; i < kpw + 5; i++) {
    if (s.enemies.length === 0) game.spawnPack(s);
    const ev = game.registerKill(s);
    s.enemies.shift();
    if (s.enemies.length === 0) { s.playerHp = game.playerMaxHp(s); game.spawnPack(s); }
    if (ev.waveAdvanced) { advanced = true; break; }
  }
  assert(advanced, "deveria avançar de wave após killsPerWave kills");
  assertEqual(s.wave, 2, "deveria estar na wave 2");
});

test("morte reseta para wave 1 sem punição", () => {
  const s = game.defaultState();
  s.wave = 3; s.lumens = 100; s.vestiges = 50;
  game.handleDeath(s);
  assertEqual(s.lumens, 100, "não perde lumens");
  assertEqual(s.vestiges, 50, "não perde vestiges");
  assertEqual(s.wave, 1, "recua para wave 1");
});

test("packSize cresce com dificuldade (boss vem sozinho)", () => {
  const p1 = packSizeFor(0, 1, false); // Normal wave 1
  const p2 = packSizeFor(1, 1, false); // Hard wave 1
  const p3 = packSizeFor(2, 1, false); // Nightmare wave 1
  assert(p2 > p1, "Hard deve ter mais inimigos que Normal");
  assert(p3 > p2, "Nightmare deve ter mais que Hard");
  assertEqual(packSizeFor(0, 1, true), 1, "Boss vem sozinho");
});

test("enterRegion configura o estado corretamente", () => {
  const s = game.defaultState();
  s.regionProgress = { 0: [0], 1: [] }; // Forest desbloqueada
  game.enterRegion(s, 1, 0); // Forest Normal
  assertEqual(s.region, 1);
  assertEqual(s.difficulty, 0);
  assertEqual(s.wave, 1);
  assertEqual(s.killsInWave, 0);
  assert(s.enemies.length > 0, "deveria ter inimigos spawnados");
});

test("ascensões e afixo de XP aumentam o multiplicador de XP", () => {
  const s = game.defaultState();
  const base = game.xpMultiplier(s);
  s.ascensions = 4;
  assert(game.xpMultiplier(s) > base, "ascensões devem aumentar o XP mult");
  const withAsc = game.xpMultiplier(s);
  s.equipped.Amulet.rarity = 2;
  assert(game.xpMultiplier(s) > withAsc, "afixo de XP deveria somar ainda mais");
});

console.log("== Ascensão (prestígio) ==");
test("heroTier retorna o tier correto conforme o número de ascensões", () => {
  const s = game.defaultState();
  assertEqual(game.heroTier(s), 0);
  s.ascensions = 49;
  assertEqual(game.heroTier(s), 0);
  s.ascensions = 50;
  assertEqual(game.heroTier(s), 1);
  s.ascensions = 200;
  assertEqual(game.heroTier(s), 2);
  s.ascensions = 500;
  assertEqual(game.heroTier(s), 3);
  s.ascensions = 1000;
  assertEqual(game.heroTier(s), 4);
});

test("tierSpikeMultiplier acumula corretamente nos limiares", () => {
  assertEqual(game.tierSpikeMultiplier(0),   1);
  assertEqual(game.tierSpikeMultiplier(49),  1);
  assertEqual(game.tierSpikeMultiplier(50),  10);
  assertEqual(game.tierSpikeMultiplier(200), 10 * 50);
  assertEqual(game.tierSpikeMultiplier(500), 10 * 50 * 200);
});

test("ascensões aumentam o multiplicador automaticamente", () => {
  const s = game.defaultState();
  const m0 = game.ascMultiplier(s);
  s.ascensions = 5;
  assert(game.ascMultiplier(s) > m0, "ascensões devem aumentar o mult");
  const m5 = game.ascMultiplier(s);
  s.ascensions = 10;
  assert(game.ascMultiplier(s) > m5, "mais ascensões = mult maior");
});

test("ascensão requer nível + stages limpos", () => {
  const s = game.defaultState();
  // Sem stages limpos e sem nível: não pode ascender.
  assertEqual(game.canAscend(s), false);
  // Limpa 1 stage mas sem nível.
  s.regionProgress = { 0: [0] };
  s.level = 10;
  assertEqual(game.canAscend(s), false, "sem nível suficiente");
  // Com nível mas sem stages.
  s.regionProgress = { 0: [] };
  s.level = 30;
  assertEqual(game.canAscend(s), false, "sem stages suficientes");
  // Com ambos.
  s.regionProgress = { 0: [0] };
  s.level = 30;
  assertEqual(game.canAscend(s), true, "deveria poder ascender");
});

test("ascender mantém EQUIPAMENTO e regionProgress, reseta recursos", () => {
  const s = game.defaultState();
  s.level = 30;
  s.regionProgress = { 0: [0], 1: [] };
  s.lumens = 999; s.vestiges = 500;
  s.equipped.Weapon.rarity = 3; s.equipped.Weapon.level = 120;
  const result = game.ascend(s);
  assertEqual(result, true);
  assertEqual(s.ascensions, 1);
  assertEqual(s.equipped.Weapon.rarity, 3, "equipamento persiste (raridade)");
  assertEqual(s.equipped.Weapon.level, 120, "equipamento persiste (nível)");
  assertEqual(s.lumens, 0, "reseta lumens");
  assertEqual(s.vestiges, 0, "reseta vestiges");
  assert("1" in s.regionProgress, "regionProgress persiste");
});

test("stats por nível crescem a cada ascensão", () => {
  const s = game.defaultState();
  const d0 = game.damagePerLevel(s), h0 = game.hpPerLevel(s);
  s.ascensions = 3;
  assert(game.damagePerLevel(s) > d0, "dano por nível deveria crescer");
  assert(game.hpPerLevel(s) > h0, "vida por nível deveria crescer");
});

test("ascMultiplier se aplica ao dano e ao ouro do herói", () => {
  const s = game.defaultState();
  const dmg0 = game.playerDamage(s), gold0 = game.goldBonus(s);
  s.ascensions = 20;
  assert(game.playerDamage(s) > dmg0, "ascensões devem aumentar o dano");
  assert(game.goldBonus(s) > gold0, "ascensões devem aumentar o ouro");
});

test("offlineConfig cresce automaticamente com ascensões", () => {
  const s = game.defaultState();
  const c0 = game.offlineConfig(s);
  s.ascensions = 50;
  const c1 = game.offlineConfig(s);
  assert(c1.efficiency > c0.efficiency, "eficiência offline sobe com ascensões");
  assert(c1.capHours > c0.capHours, "cap de horas sobe com ascensões");
});

test("offlineConfig respeita teto de 50% e 24h", () => {
  const s = game.defaultState();
  s.ascensions = 10000;
  const c = game.offlineConfig(s);
  assert(c.efficiency <= 0.50, "eficiência não passa de 50%");
  assert(c.capHours <= 24, "cap não passa de 24h");
});

test("ganhos offline > 0", () => {
  const s = game.defaultState();
  const oneH = game.computeOfflineGains(s, 3600);
  assert(oneH.lumens > 0, "deveria render lumens");
});

console.log("== Balanceamento (sanidade) ==");
test("o primeiro abate acontece em menos de 3s (design: 1.5-3s)", () => {
  const s = game.defaultState();
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  // Com startPower=10, DPS~6 → kill em ~1.67s. Testa em 3s (margem).
  let killed = false;
  for (let i = 0; i < 30 && !killed; i++) {
    const evs = game.tick(s, 0.1);
    if (evs.some(e => e.type === "kill")) killed = true;
  }
  assert(killed, "deveria matar o 1º inimigo em ~3s");
});

test("região difícil mata jogador fresco rapidamente", () => {
  const s = game.defaultState();
  s.region = 4; // Peak (startPower 15e12)
  s.difficulty = 0;
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  let died = false, killed = false;
  for (let i = 0; i < 100 && !died && !killed; i++) {
    const evs = game.tick(s, 0.1);
    if (evs.some(e => e.type === "death")) died = true;
    if (evs.some(e => e.type === "kill")) killed = true;
  }
  assert(died && !killed, "jogador fresco deveria MORRER em região difícil");
});

console.log("== Region unlock/clear ==");
test("isRegionUnlocked e isDifficultyUnlocked funcionam corretamente", () => {
  const s = game.defaultState();
  assert(isRegionUnlocked(s, 0), "Plains está desbloqueada");
  assert(!isRegionUnlocked(s, 1), "Forest não está desbloqueada inicialmente");
  assert(isDifficultyUnlocked(s, 0, 0), "Normal sempre desbloqueada");
  assert(!isDifficultyUnlocked(s, 0, 1), "Hard não desbloqueada sem limpar Normal");

  // Limpa Normal
  s.regionProgress[0] = [0];
  assert(isDifficultyUnlocked(s, 0, 1), "Hard desbloqueada após limpar Normal");
});

test("enemyStatsFor retorna stats consistentes (contínuo)", () => {
  const plains = enemyStatsFor(0, 0, 1); // Plains Normal Wave 1
  // Nova fórmula: startPower=10, progress=0 → HP=10, DMG=2 (10×0.15), Gold=5 (10×0.5)
  assertEqual(plains.hp, 10, "Plains Normal Wave 1 HP = 10");
  assertEqual(plains.dmg, 2, "Plains Normal Wave 1 DMG = 2");
  assertEqual(plains.gold, 5, "Plains Normal Wave 1 Gold = 5");

  const forest = enemyStatsFor(1, 0, 1); // Forest Normal Wave 1
  assertEqual(forest.hp, 15000, "Forest Normal Wave 1 HP = 15,000");
  assert(forest.hp > plains.hp, "Forest deve ser mais forte que Plains");

  const hard = enemyStatsFor(0, 1, 1); // Plains Hard Wave 1
  assertEqual(hard.hp, 100, "Plains Hard Wave 1 HP = 100 (10 × powerMult 10)");
  assert(hard.hp > plains.hp, "Hard deve ter mais HP que Normal");
  assert(hard.gold > plains.gold, "Hard deve dar mais gold que Normal");

  // Continuidade: Normal last = Hard first
  const normalLast = enemyStatsFor(0, 0, 30);
  assertEqual(normalLast.hp, hard.hp, "Normal w30 = Hard w1 (continuidade)");
});

console.log("== Fase 1 — Combate Core ==");
test("critMult inclui overflow: crit rate > 100% converte para crit damage", () => {
  const s = game.defaultState();
  const baseMult = game.critMult(s);
  // lck=220 → 220 × 0.005 = 1.1 crit rate → overflow = 0.1
  s.goldStats.lck = 220;
  const overflow = game.critOverflow(s);
  assert(overflow > 0, "deve haver overflow com lck 220 (1.1 crit rate > 1.0)");
  assert(game.critMult(s) > baseMult, "overflow deve aumentar critMult");
  // overflow × critOverflowToDmg deve ser exatamente o bônus adicionado
  const expected = baseMult + overflow * CONFIG.combat.critOverflowToDmg;
  assert(Math.abs(game.critMult(s) - expected) < 0.001, "critMult = base + overflow × fator");
});

test("critExpectedMult segue a fórmula EV = 1 + rate × (mult − 1)", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2;
  const rate = game.critRate(s);
  const mult = game.critMult(s);
  const ev   = game.critExpectedMult(s);
  const expected = 1 + rate * (mult - 1);
  assert(Math.abs(ev - expected) < 0.001, `EV esperado ${expected.toFixed(4)}, obtido ${ev.toFixed(4)}`);
});

test("defenseReduction: 0=0%, 100≈20%, 1000≈30%, 10000=40%", () => {
  assert(game.defenseReduction(0)     === 0,                    "0 def → 0% redução");
  assert(Math.abs(game.defenseReduction(100)   - 0.2) < 0.001, "100 def → 20%");
  assert(Math.abs(game.defenseReduction(1000)  - 0.3) < 0.001, "1.000 def → 30%");
  assert(Math.abs(game.defenseReduction(10000) - 0.4) < 0.001, "10.000 def → 40%");
});

test("hpRegenPerSec: level × regenPerLevel", () => {
  const s = game.defaultState();
  s.level = 10;
  const expected = 10 * CONFIG.combat.regenPerLevel;
  assert(game.hpRegenPerSec(s) === expected, `esperado ${expected}, obtido ${game.hpRegenPerSec(s)}`);
});

test("HP regen é aplicado no tick (jogador cura ao longo do tempo)", () => {
  const s = game.defaultState();
  s.level = 30; // regen 3 HP/s
  game.spawnPack(s);
  s.enemies.forEach(e => { e.dmg = 0; }); // anula dano recebido
  s.playerHp = 10; // HP baixo
  game.tick(s, 1);  // 1 segundo
  assert(s.playerHp > 10, "regen deve aumentar o HP");
});

test("attackSpeed usa fórmula √ — retornos decrescentes por investimento igual", () => {
  const s = game.defaultState();
  // Incrementos iguais de amulet level (200 níveis cada passo)
  const spd1   = game.attackSpeed(s);               // level 1 (base)
  s.equipped.Amulet.level = 200;
  const spd200 = game.attackSpeed(s);               // raw ≈ 3.0
  s.equipped.Amulet.level = 400;
  const spd400 = game.attackSpeed(s);               // raw ≈ 5.0
  const gain_1to200   = spd200 - spd1;
  const gain_200to400 = spd400 - spd200;
  assert(spd200 > spd1,   "mais amulet = mais speed");
  assert(spd400 > spd200, "ainda mais = ainda mais speed");
  // O SEGUNDO incremento de 200 levels deve render MENOS que o primeiro (retornos decrescentes)
  assert(gain_200to400 < gain_1to200, "investimento igual → ganho decrescente (√ é côncava)");
});

test("attackSpeed nunca passa do cap de 20", () => {
  const s = game.defaultState();
  s.goldStats.agi = 10000; // valor absurdo
  s.equipped.Amulet.level = 10000;
  assert(game.attackSpeed(s) <= 20, "cap de 20 ataques/s respeitado");
});

test("inimigos têm critChance após spawn", () => {
  const s = game.defaultState();
  game.spawnPack(s);
  s.enemies.forEach(e => {
    assert(typeof e.critChance === "number" && e.critChance >= 0, `${e.name} deve ter critChance`);
  });
});

// ══════════════════════════════════════════════════════════════════
console.log("== Fase 3 — Passivas ==");

test("passiveCost: lv0 = costBase, cresce exponencialmente", () => {
  const def = PASSIVES.find(p => p.id === "radiantStrike");
  assertEqual(game.passiveCost("radiantStrike", 0), def.costBase, "lv0 = costBase");
  const lv1 = Math.round(def.costBase * Math.pow(def.costGrowth, 1));
  assertEqual(game.passiveCost("radiantStrike", 1), lv1, "lv1 = costBase × growth");
  assertEqual(game.passiveCost("radiantStrike", def.maxLevel), Infinity, "maxLevel = Infinity");
});

test("passiveUnlocked: mapReq 1 sempre disponível, mapReq 2 exige ascensão", () => {
  const s = game.defaultState();
  assert(game.passiveUnlocked(s, "radiantStrike"), "mapReq 1, kills 0: deve estar desbloqueado");
  assert(!game.passiveUnlocked(s, "resonantForce"), "mapReq 2, 0 ascensões: deve estar bloqueado");
  s.ascensions = 1; s.totalKills = 200;
  assert(game.passiveUnlocked(s, "resonantForce"), "mapReq 2, 1 ascensão: deve estar desbloqueado");
});

test("passiveUnlocked: killsReq bloqueia com kills insuficientes", () => {
  const s = game.defaultState();
  assert(!game.passiveUnlocked(s, "luminalEdge"), "luminalEdge killsReq 100, totalKills 0: bloqueado");
  s.totalKills = 100;
  assert(game.passiveUnlocked(s, "luminalEdge"), "luminalEdge killsReq 100, totalKills 100: ok");
});

test("buyPassive: debita vestiges, incrementa nível, rastreia totalVestgesSpent", () => {
  const s = game.defaultState();
  s.vestiges = 1000; s.totalKills = 0;
  assert(game.buyPassive(s, "radiantStrike"), "deve comprar");
  assertEqual(game.passiveLevel(s, "radiantStrike"), 1, "lv deve ser 1");
  const cost = PASSIVES.find(p => p.id === "radiantStrike").costBase;
  assertEqual(s.vestiges, 1000 - cost, "vestiges devem ser debitados");
  assertEqual(s.totalVestgesSpent, cost, "totalVestgesSpent deve rastrear");
});

test("buyPassive: retorna false sem vestiges suficientes", () => {
  const s = game.defaultState();
  s.vestiges = 1;
  assertEqual(game.buyPassive(s, "radiantStrike"), false, "sem vestiges suficientes");
  assertEqual(game.passiveLevel(s, "radiantStrike"), 0, "nível não deve mudar");
});

test("passiveTotals: Radiant Strike aumenta dmgMult", () => {
  const s = game.defaultState();
  const pt0 = game.passiveTotals(s);
  assertEqual(pt0.dmgMult, 0, "sem passivas: dmgMult = 0");
  s.passives.radiantStrike = 3;
  const pt3 = game.passiveTotals(s);
  assert(Math.abs(pt3.dmgMult - 3 * 0.08) < 0.001, "Radiant Strike lv3 = +0.24 dmgMult");
});

test("Radiant Strike aumenta playerDamage", () => {
  const s = game.defaultState();
  const dmg0 = game.playerDamage(s);
  s.passives.radiantStrike = 5;
  assert(game.playerDamage(s) > dmg0, "Radiant Strike lv5 deve aumentar dano");
});

test("Luminal Edge aumenta critRate via passiveTotals", () => {
  const s = game.defaultState();
  s.totalKills = 100;
  s.vestiges = 500;
  game.buyPassive(s, "luminalEdge");
  const pt = game.passiveTotals(s);
  assert(pt.critRate > 0, "Luminal Edge deve aumentar critRate no total");
  assert(game.critRate(s) > 0, "critRate(s) deve refletir a passiva");
});

test("Weakened Void reduz HP do inimigo no spawn", () => {
  const s = game.defaultState();
  game.spawnPack(s);
  const hpBase = s.enemies[0].hp;
  s.passives.weakenedVoid = 5; // -25% HP
  game.spawnPack(s);
  const hpReduced = s.enemies[0].hp;
  assert(hpReduced < hpBase, "Weakened Void deve reduzir HP do inimigo");
});

test("passivas persistem após ascend, bossKills reseta", () => {
  const s = game.defaultState();
  s.passives.radiantStrike = 3;
  s.bossKills = 5;
  s.totalVestgesSpent = 999;
  s.level = 30;
  s.regionProgress = { 0: [0] };
  game.ascend(s);
  assertEqual(s.passives.radiantStrike, 3, "passivas devem persistir");
  assertEqual(s.bossKills, 0, "bossKills deve resetar");
  assertEqual(s.totalVestgesSpent, 999, "totalVestgesSpent deve persistir");
});

console.log("\n== Fase 2: Convergence ==");
test("defaultState tem convergences: 0", () => {
  const s = game.defaultState();
  assertEqual(s.convergences, 0, "convergences deve iniciar em 0");
});

test("convergenceMult: 0 convergências = 1", () => {
  const s = game.defaultState();
  assertEqual(game.convergenceMult(s), 1, "sem convergências, mult deve ser 1");
});

test("convergenceMult: 1 convergência = 1.20", () => {
  const s = game.defaultState();
  s.convergences = 1;
  const m = game.convergenceMult(s);
  assert(Math.abs(m - 1.20) < 0.0001, `esperado 1.20, obtido ${m}`);
});

test("convergenceMult: 4 convergências = 1.20^4", () => {
  const s = game.defaultState();
  s.convergences = 4;
  const expected = Math.pow(1.20, 4);
  const m = game.convergenceMult(s);
  assert(Math.abs(m - expected) < 0.001, `esperado ${expected.toFixed(4)}, obtido ${m.toFixed(4)}`);
});

test("convergenceMult: 5 convergências = 1.20^4 × 1.12 × spike(×1.5)", () => {
  const s = game.defaultState();
  s.convergences = 5;
  const m = game.convergenceMult(s);
  const expected = Math.pow(1.20, 4) * Math.pow(1.12, 1) * 1.5;
  assert(Math.abs(m - expected) < 0.001, `esperado ${expected.toFixed(4)}, obtido ${m.toFixed(4)}`);
});

test("convergenceRecommended: true em 0 convergências (+20% ≥ 5%)", () => {
  const s = game.defaultState();
  assert(game.convergenceRecommended(s), "primeiro convergence sempre recommended (+20%)");
});

test("getConvergenceStatus: campos corretos", () => {
  const s = game.defaultState();
  s.convergences = 2;
  const cv = game.getConvergenceStatus(s);
  assertEqual(cv.convergences, 2, "convergences correto");
  assert(cv.currentMult > 1, "currentMult > 1");
  assert(cv.nextMult > cv.currentMult, "nextMult > currentMult");
  assert(cv.gainPct > 0, "gainPct > 0");
});

test("converge: incrementa convergences, reseta level/lumens, preserva passivas e ascensions", () => {
  const s = game.defaultState();
  s.level = 20;
  s.lumens = 500;
  s.ascensions = 3;
  s.passives.radiantStrike = 2;
  s.convergences = 1;
  game.converge(s);
  assertEqual(s.convergences, 2, "convergences deve incrementar");
  assertEqual(s.ascensions, 3, "ascensions deve ser preservado");
  assertEqual(s.level, 1, "level deve resetar");
  assertEqual(s.lumens, 0, "lumens deve resetar");
  assertEqual(s.passives.radiantStrike, 2, "passivas devem persistir");
});

test("ascend preserva convergences", () => {
  const s = game.defaultState();
  s.convergences = 3;
  s.level = 30;
  s.regionProgress = { 0: [0] };
  game.ascend(s);
  assertEqual(s.convergences, 3, "convergences deve persistir após ascend");
});

test("convergenceMult integrado em totalPowerMult", () => {
  const s0 = game.defaultState();
  const s1 = game.defaultState();
  s1.convergences = 1;
  const p0 = game.totalPowerMult(s0);
  const p1 = game.totalPowerMult(s1);
  assert(p1 > p0, "totalPowerMult deve crescer com convergências");
  assert(Math.abs(p1 / p0 - 1.20) < 0.001, "ganho de 1 convergência deve ser ×1.20 no totalPowerMult");
});

report();
