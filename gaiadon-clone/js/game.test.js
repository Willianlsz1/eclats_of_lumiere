// Carrega todos os módulos em ordem de dependência -> globalThis, depois roda os testes.
const data = require("./data.js");
Object.assign(globalThis, data);
for (const f of ["./progression.js", "./loot.js", "./zones.js", "./game.js"]) {
  Object.assign(globalThis, require(f));
}
const game = {};
for (const f of ["./progression.js", "./loot.js", "./zones.js", "./game.js"]) {
  Object.assign(game, require(f));
}
const { test, assert, assertEqual, report } = require("./_assert.js");

console.log("== Estado base ==");
test("defaultState: regionProgress com plains desbloqueada, equipamento common nível 1", () => {
  const s = game.defaultState();
  assertEqual(s.region, 0);
  assertEqual(s.difficulty, 0);
  assertEqual(s.wave, 1);
  assertEqual(s.shards, 0);
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

test("levelUpItem gasta gold e sobe o nível", () => {
  const s = game.defaultState();
  s.gold = 1000;
  const before = s.equipped.Weapon.level;
  assert(game.levelUpItem(s, "Weapon"), "deveria comprar nível");
  assertEqual(s.equipped.Weapon.level, before + 1);
  assert(s.gold < 1000, "deveria gastar gold");
});

test("levelUpMax compra vários níveis de uma vez", () => {
  const s = game.defaultState();
  s.gold = 1000;
  const n = game.levelUpMax(s, "Weapon");
  assert(n > 1, "deveria comprar vários níveis");
  assertEqual(s.equipped.Weapon.level, 1 + n);
});

test("levelUpMax respeita o cap da raridade", () => {
  const s = game.defaultState();
  s.gold = 1e12;
  game.levelUpMax(s, "Weapon");
  assertEqual(s.equipped.Weapon.level, RARITIES[0].cap, "para no cap da common");
});

test("levelUpMaxPreview bate com a compra real (count e custo)", () => {
  const s = game.defaultState();
  s.gold = 800;
  const pre = game.levelUpMaxPreview(s, "Weapon");
  const goldBefore = s.gold;
  const n = game.levelUpMax(s, "Weapon");
  assertEqual(pre.count, n, "count previsto = comprado");
  assertEqual(pre.spent, goldBefore - s.gold, "custo previsto = gasto");
});

test("nível trava no cap da raridade", () => {
  const s = game.defaultState();
  s.gold = 1e9;
  s.equipped.Weapon.level = RARITIES[0].cap;
  assertEqual(game.levelUpItem(s, "Weapon"), false, "não passa do cap sem subir raridade");
});

test("rarityUpItem exige estar no cap + shards e libera o próximo cap", () => {
  const s = game.defaultState();
  s.equipped.Weapon.level = RARITIES[0].cap;
  s.shards = 1e9; s.gold = 1e9;
  const r0 = s.equipped.Weapon.rarity;
  assert(game.rarityUpItem(s, "Weapon"), "deveria subir a raridade");
  assertEqual(s.equipped.Weapon.rarity, r0 + 1);
  assert(game.levelUpItem(s, "Weapon"), "após subir raridade, nível volta a subir");
});

test("não sobe raridade fora do cap", () => {
  const s = game.defaultState();
  s.shards = 1e9;
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
test("registerKill dá shards", () => {
  const s = game.defaultState();
  game.spawnPack(s);
  const ev = game.registerKill(s);
  assert(ev.shards > 0, "deveria ganhar shards");
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
  s.wave = 3; s.gold = 100; s.shards = 50;
  game.handleDeath(s);
  assertEqual(s.gold, 100, "não perde gold");
  assertEqual(s.shards, 50, "não perde shards");
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
  s.gold = 999; s.shards = 500;
  s.equipped.Weapon.rarity = 3; s.equipped.Weapon.level = 120;
  const result = game.ascend(s);
  assertEqual(result, true);
  assertEqual(s.ascensions, 1);
  assertEqual(s.equipped.Weapon.rarity, 3, "equipamento persiste (raridade)");
  assertEqual(s.equipped.Weapon.level, 120, "equipamento persiste (nível)");
  assertEqual(s.gold, 0, "reseta gold");
  assertEqual(s.shards, 0, "reseta shards");
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
  assert(oneH.gold > 0, "deveria render gold");
});

console.log("== Balanceamento (sanidade) ==");
test("o primeiro abate acontece em menos de 1s", () => {
  const s = game.defaultState();
  game.spawnPack(s); s.playerHp = game.playerMaxHp(s);
  const evs = game.tick(s, 1.0);
  assert(evs.some(e => e.type === "kill"), "deveria matar o 1º inimigo em ~1s");
});

test("região difícil mata jogador fresco rapidamente", () => {
  const s = game.defaultState();
  s.region = 4; // Peak (basePower 8100)
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

test("enemyStatsFor retorna stats consistentes", () => {
  const plains = enemyStatsFor(0, 0, 1); // Plains Normal Wave 1
  assertEqual(plains.hp, 4, "Plains Normal Wave 1 HP = 4");
  assertEqual(plains.dmg, 3, "Plains Normal Wave 1 DMG = 3");
  assertEqual(plains.gold, 6, "Plains Normal Wave 1 Gold = 6");

  const forest = enemyStatsFor(1, 0, 1); // Forest Normal Wave 1
  assert(forest.hp > plains.hp, "Forest deve ser mais forte que Plains");

  const hard = enemyStatsFor(0, 1, 1); // Plains Hard Wave 1
  assert(hard.hp > plains.hp, "Hard deve ter mais HP que Normal");
  assert(hard.gold > plains.gold, "Hard deve dar mais gold que Normal");
});

report();
