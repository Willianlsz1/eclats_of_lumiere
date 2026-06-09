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
test("defaultState: mapa 0 / subárea 0, equipamento common nível 1", () => {
  const s = game.defaultState();
  assertEqual(s.map, 0);
  assertEqual(s.subarea, 0);
  assertEqual(s.killsInSub, 0);
  assertEqual(s.vestiges, 0);
  assertEqual(s.equipped.Weapon.rarity, 0);
  assertEqual(s.equipped.Weapon.level, 1);
  assertEqual(s.ascensions, 0);
  assert(game.isMapUnlocked(s, 0), "Mapa 1 deve estar desbloqueado");
  assert(!game.isMapUnlocked(s, 1), "Mapa 2 começa bloqueado");
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

test("níveis são SEM cap (gasta tudo que puder)", () => {
  const s = game.defaultState();
  s.lumens = 1e6;
  const n = game.levelUpMax(s, "Weapon");
  assert(n > 25, "deve subir muito além do antigo cap 25 (uncapped)");
  assert(s.lumens < Math.ceil(5 * Math.pow(1.15, s.equipped.Weapon.level)), "gastou até não poder mais");
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

test("rarityUpItem exige nível mínimo + materiais", () => {
  const s = game.defaultState();
  s.equipped.Weapon.level = CONFIG.gear.rarityLevelReq[0]; // nível p/ subir de common
  const need = game.rarityUpMaterial(s, "Weapon"); // common→uncommon = Dim Shard
  assertEqual(need.id, "dimShard", "primeiro upgrade pede Dim Shard");
  s.materials[need.id] = need.qty + 5;
  const r0 = s.equipped.Weapon.rarity;
  assert(game.rarityUpItem(s, "Weapon"), "deveria subir a raridade");
  assertEqual(s.equipped.Weapon.rarity, r0 + 1);
  assertEqual(s.materials[need.id], 5, "consome a quantidade exata de material");
});

test("não sobe raridade sem material suficiente", () => {
  const s = game.defaultState();
  s.equipped.Weapon.level = CONFIG.gear.rarityLevelReq[0];
  const need = game.rarityUpMaterial(s, "Weapon");
  s.materials[need.id] = need.qty - 1; // 1 a menos
  assertEqual(game.rarityUpItem(s, "Weapon"), false, "material insuficiente bloqueia");
});

test("epic→legendary consome o material especial do mapa atual", () => {
  const s = game.defaultState();
  s.map = 4; // Nil Aeternum → Nil Essence
  s.equipped.Weapon.rarity = 3; // epic
  s.equipped.Weapon.level = CONFIG.gear.rarityLevelReq[3];
  const need = game.rarityUpMaterial(s, "Weapon");
  assertEqual(need.id, "nilEssence", "epic→legendary no peak pede Nil Essence");
  s.materials.nilEssence = need.qty;
  assert(game.rarityUpItem(s, "Weapon"), "sobe para legendary com o material do mapa");
  assertEqual(s.equipped.Weapon.rarity, 4);
});

test("não sobe raridade sem nível mínimo", () => {
  const s = game.defaultState();
  s.materials = { dimShard: 1e9 }; s.equipped.Weapon.level = 1; // abaixo do req
  assertEqual(game.rarityUpItem(s, "Weapon"), false, "precisa do nível mínimo pra subir raridade");
});

console.log("== Afixos / Crítico ==");
test("itemAffixes ativa afixos conforme a raridade (DESIGN §27: 1→5)", () => {
  assertEqual(game.itemAffixes("Weapon", 0).length, 1, "common = 1 afixo");
  assertEqual(game.itemAffixes("Weapon", 1).length, 2, "uncommon = 2");
  assertEqual(game.itemAffixes("Weapon", 4).length, 5, "legendary = 5");
  // Todas as 6 peças têm 5 afixos definidos (para o legendary).
  ["Weapon","Armor","Amulet","Ring","Gloves","Helmet"].forEach(function(slot) {
    assertEqual(game.itemAffixes(slot, 4).length, 5, slot + " legendary = 5 afixos");
  });
});

test("getNewAffix retorna o afixo correto ao subir raridade", () => {
  // Subir para legendary (4) revela o 5º afixo (índice 4).
  const a = game.getNewAffix("Weapon", 4);
  assert(a && a.stat === "dmgMult", "5º afixo da Weapon = dmgMult");
  assertEqual(game.getNewAffix("Weapon", 1).stat, AFFIXES.Weapon[1].stat, "subir p/ uncommon revela índice 1");
});

test("affixTotals soma os afixos dos itens equipados (estrutura)", () => {
  const s = game.defaultState();
  s.equipped.Weapon.rarity = 2;
  const t = game.affixTotals(s);
  // Com affixScale=0 os valores são 0 — verificamos apenas a estrutura do objeto.
  assert(typeof t.critRate === "number", "affixTotals deve ter critRate numérico");
  assert(typeof t.critDmg  === "number", "affixTotals deve ter critDmg numérico");
  assert(typeof t.dmgMult  === "number", "affixTotals deve ter dmgMult numérico");
  assert(typeof t.hpMult   === "number", "affixTotals deve ter hpMult numérico");
});

console.log("== Combate e regiões ==");
test("registerKill dá vestiges", () => {
  const s = game.defaultState();
  game.spawnPack(s);
  const ev = game.registerKill(s);
  assert(ev.vestiges > 0, "deveria ganhar vestiges");
});

test("chefe da subárea aparece após killsToBoss e avança a subárea ao morrer", () => {
  const s = game.defaultState();
  s.killsInSub = CONFIG.map.killsToBoss; // trigger oculto atingido
  game.spawnPack(s);
  assert(s.enemies[0].isBoss, "deve spawnar o chefe da subárea");
  const ev = game.registerKill(s);
  assert(ev.wasBoss, "kill de chefe");
  assert(ev.subareaAdvanced, "avança para a próxima subárea (não é a final)");
  assertEqual(s.subarea, 1, "agora na Subárea 2");
  assertEqual(s.killsInSub, 0, "kills da subárea zeram");
});

test("chefe final do mapa (Subárea 5) marca mapCleared e avança o mapa", () => {
  const s = game.defaultState();
  s.subarea = game.lastSubarea();
  s.killsInSub = CONFIG.map.killsToBoss;
  game.spawnPack(s);
  assert(s.enemies[0].isFinalBoss, "deve ser o chefe final do mapa");
  const ev = game.registerKill(s);
  assert(ev.mapCleared, "mapa limpo");
  assertEqual(s.map, 1, "avança para o próximo mapa");
  assertEqual(s.subarea, 0, "começa na subárea 1 do novo mapa");
});

test("morte zera killsInSub sem punição de recursos", () => {
  const s = game.defaultState();
  s.subarea = 2; s.killsInSub = 20; s.lumens = 100; s.vestiges = 50;
  game.handleDeath(s);
  assertEqual(s.lumens, 100, "não perde lumens");
  assertEqual(s.vestiges, 50, "não perde vestiges");
  assertEqual(s.killsInSub, 0, "zera o progresso da subárea");
  assertEqual(s.subarea, 1, "recua uma subárea ao morrer");
});

test("packSize cresce com a subárea (boss vem sozinho)", () => {
  const p0 = game.packSizeFor(0, false);
  const p4 = game.packSizeFor(4, false);
  assert(p4 >= p0, "subáreas avançadas têm packs maiores ou iguais");
  assertEqual(game.packSizeFor(0, true), 1, "Boss vem sozinho");
});

test("enterMap configura o estado corretamente", () => {
  const s = game.defaultState();
  s.mapProgress = { 0: game.lastSubarea() }; // mapa 1 limpo → mapa 2 desbloqueado
  game.enterMap(s, 1, 0);
  assertEqual(s.map, 1);
  assertEqual(s.subarea, 0);
  assertEqual(s.killsInSub, 0);
  assert(s.enemies.length > 0, "deveria ter inimigos spawnados");
});

console.log("== Ascensão (tiered, até 1000) ==");
test("heroTier por marco da Ordre (minAsc 0/50/200/500/1000)", () => {
  const s = game.defaultState();
  assertEqual(game.heroTier(s), 0);
  s.ascensions = 49;  assertEqual(game.heroTier(s), 0, "Seeker até 49");
  s.ascensions = 50;  assertEqual(TIERS[game.heroTier(s)].name, "Illuminate");
  s.ascensions = 1000; assertEqual(TIERS[game.heroTier(s)].name, "Lumière");
});

test("ascMultiplier = produto de mults crescentes", () => {
  const A = CONFIG.ascension;
  assertEqual(game.ascMultiplier({ ascensions: 0 }), 1);
  assertEqual(game.ascMultiplier({ ascensions: 1 }), A.multBase);
  const expect2 = A.multBase * (A.multBase + A.multSlope);
  assert(Math.abs(game.ascMultiplier({ ascensions: 2 }) - expect2) < 1e-9, "2 asc = produto");
  assert(game.ascMultiplier({ ascensions: 10 }) >= game.ascMultiplier({ ascensions: 9 }), "cresce ou é igual (neutro em estado zero)");
});

test("canAscend exige X convergences + Vestiges (não reseta nada)", () => {
  const s = game.defaultState();
  assertEqual(game.canAscend(s), false, "sem convergences nem vestiges");
  s.convsSinceAsc = CONFIG.ascension.convPerAsc;
  assertEqual(game.canAscend(s), false, "tem convergences mas falta vestiges");
  s.vestiges = game.ascCost(s);
  assert(game.canAscend(s), "X convergences + Vestiges → pode ascender");
});

test("ascend: power-up permanente (consome conv+vestiges, não reseta mapa/gear/nível)", () => {
  const s = game.defaultState();
  s.convsSinceAsc = CONFIG.ascension.convPerAsc;
  s.vestiges = game.ascCost(s) + 100;
  s.level = 40; s.map = 2; s.subarea = 3;
  s.equipped.Weapon.level = 120;
  const cost = game.ascCost(s);
  assert(game.ascend(s), "deve ascender");
  assertEqual(s.ascensions, 1, "ascensão incrementa");
  assertEqual(s.convsSinceAsc, 0, "zera o contador de convergences");
  assertEqual(s.vestiges, 100, "consome o custo em vestiges");
  assertEqual(s.level, 40, "NÃO reseta nível");
  assertEqual(s.map, 2, "NÃO muda de mapa");
  assertEqual(s.equipped.Weapon.level, 120, "NÃO reseta gear");
});

test("offlineConfig respeita teto de efficiencyMax e capMaxHours", () => {
  const s = game.defaultState();
  s.ascensions = 10000;
  const c = game.offlineConfig(s);
  assert(c.efficiency <= CONFIG.offline.efficiencyMax, "eficiência não passa do teto");
  assert(c.capHours <= CONFIG.offline.capMaxHours, "cap de horas não passa do teto");
});

console.log("== Balanceamento (sanidade) ==");
test("o primeiro abate acontece rápido no início (open-zone, qualquer arquétipo)", () => {
  const s = game.defaultState();
  // Inimigo determinístico (standard, HP base) para evitar variância de arquétipo/sorteio.
  const st = game.enemyStatsFor(0, 0);
  s.enemies = [{ hp: st.hp, maxHp: st.hp, dmg: st.dmg, isBoss: false, tier: "normal", archetype: "standard", critChance: 0 }];
  s.playerHp = game.playerMaxHp(s);
  let killed = false;
  for (let i = 0; i < 30 && !killed; i++) {
    const evs = game.tick(s, 0.1);
    if (evs.some(e => e.type === "kill")) killed = true;
  }
  assert(killed, "deveria matar o 1º inimigo em ~3s");
});

console.log("== Map unlock/progresso ==");
test("isMapUnlocked depende de limpar o mapa anterior", () => {
  const s = game.defaultState();
  assert(game.isMapUnlocked(s, 0), "Mapa 1 sempre desbloqueado");
  assert(!game.isMapUnlocked(s, 1), "Mapa 2 bloqueado inicialmente");
  s.mapProgress = { 0: game.lastSubarea() }; // limpa chefe final do mapa 1
  assert(game.isMapUnlocked(s, 1), "Mapa 2 desbloqueado após limpar o mapa 1");
});

test("enemyStatsFor: escala geométrica por subárea (DESIGN §16)", () => {
  const m1 = enemyStatsFor(0, 0); // Mapa 1, Subárea 1
  assertEqual(m1.hp, CONFIG.map.baseHp, "Mapa 1 Subárea 1 HP = baseHp");
  assertEqual(m1.dmg, Math.max(1, Math.round(m1.hp * CONFIG.enemy.dmgRatio)), "DMG = HP × dmgRatio");
  assertEqual(m1.gold, Math.max(1, Math.round(m1.hp * CONFIG.enemy.goldRatio)), "Gold = HP × goldRatio");

  // HP cresce por subárea (índice global = map×5 + sub).
  const ramp = CONFIG.map.subareaRamp;
  assertEqual(enemyStatsFor(0, 4).hp, Math.round(CONFIG.map.baseHp * Math.pow(ramp, 4)), "Subárea 5 do mapa 1");
  assertEqual(enemyStatsFor(1, 0).hp, Math.round(CONFIG.map.baseHp * Math.pow(ramp, 5)), "Mapa 2 Subárea 1 = passo 5");
  assert(enemyStatsFor(1, 0).hp > enemyStatsFor(0, 4).hp, "mapa seguinte é mais forte");
  assert(enemyStatsFor(0, 4).hp > m1.hp, "HP cresce ao longo das subáreas");
});

console.log("== Fase 1 — Combate Core ==");
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

test("attackSpeed nunca passa do cap configurado", () => {
  const s = game.defaultState();
  s.goldStats.agi = 10000; // valor absurdo
  s.equipped.Amulet.level = 10000;
  assert(game.attackSpeed(s) <= CONFIG.combat.attackSpeedCap, "cap de ataques/s respeitado");
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
  const def = PASSIVES.find(p => p.id === "radiantStrike");
  assert(Math.abs(pt3.dmgMult - 3 * def.perLevel) < 0.001, `Radiant Strike lv3 = +${(3 * def.perLevel).toFixed(2)} dmgMult`);
});

test("ascend é power-up puro: não reseta passivas/bossKills/nada", () => {
  const s = game.defaultState();
  s.passives.radiantStrike = 3;
  s.bossKills = 5;
  s.totalVestgesSpent = 999;
  s.convsSinceAsc = CONFIG.ascension.convPerAsc;
  s.vestiges = game.ascCost(s);
  game.ascend(s);
  assertEqual(s.passives.radiantStrike, 3, "passivas persistem");
  assertEqual(s.bossKills, 5, "bossKills NÃO reseta (ascend não reseta nada)");
  assertEqual(s.totalVestgesSpent, 999, "totalVestgesSpent persiste");
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

test("convergenceMult: early multiplicativo (earlyMult^n)", () => {
  const C = CONFIG.convergence;
  const s = game.defaultState();
  s.convergences = 1;
  assert(Math.abs(game.convergenceMult(s) - C.earlyMult) < 1e-9, "1 conv = earlyMult");
  s.convergences = C.earlyCount;
  const expected = Math.pow(C.earlyMult, C.earlyCount);
  assert(Math.abs(game.convergenceMult(s) - expected) < 1e-6, `${C.earlyCount} conv = earlyMult^earlyCount`);
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
  s.mapProgress = { 0: game.lastSubarea() };
  game.ascend(s);
  assertEqual(s.convergences, 3, "convergences deve persistir após ascend");
});

test("canConverge: bloqueado abaixo de minLevel, liberado em/acima", () => {
  const s = game.defaultState();
  s.level = CONFIG.convergence.minLevel - 1;
  assert(!game.canConverge(s), "abaixo de minLevel deve bloquear");
  s.level = CONFIG.convergence.minLevel;
  assert(game.canConverge(s), "em minLevel deve liberar");
  s.level = CONFIG.convergence.minLevel + 5;
  assert(game.canConverge(s), "acima de minLevel deve liberar");
});

test("converge abaixo de minLevel não faz nada (anti-exploit)", () => {
  const s = game.defaultState();
  s.level = 1; // piso: sem nada a sacrificar
  const ok = game.converge(s);
  assertEqual(ok, false, "converge deve retornar false abaixo do gate");
  assertEqual(s.convergences, 0, "convergences NÃO deve incrementar no piso");
});

test("convergenceMult: finito e modesto mesmo com convergences absurdo", () => {
  const s = game.defaultState();
  s.convergences = 1e6;
  const m = game.convergenceMult(s);
  assert(Number.isFinite(m), "deve ser finito");
  assert(m <= CONFIG.convergence.maxMult, "respeita o teto de segurança");
  assert(m < 1e6, "com √, 1M de conv ainda é « 1e6 (não trivializa)");
});

console.log("\n== Fase 4: materiais (drop + inventário) ==");
test("defaultState tem materials: {}", () => {
  const s = game.defaultState();
  assert(s.materials && typeof s.materials === "object", "materials deve existir");
  assertEqual(Object.keys(s.materials).length, 0, "inventário começa vazio");
});

test("materialDropFor: tier de inimigo → material universal", () => {
  assertEqual(game.materialDropFor({ tier: "normal" }, 0), "dimShard");
  assertEqual(game.materialDropFor({ tier: "elite" }, 0), "paleFragment");
  assertEqual(game.materialDropFor({ tier: "champion" }, 0), "voidDust");
});

test("materialDropFor: chefe → material especial do mapa (por região)", () => {
  assertEqual(game.materialDropFor({ isBoss: true }, 0), "dreamspore");
  assertEqual(game.materialDropFor({ isBoss: true }, 4), "nilEssence");
});

test("registerKill dropa material conforme o tier (drop forçado)", () => {
  // Drop regular é por chance; força com Math.random=0.
  const _r = Math.random; Math.random = function () { return 0; };
  try {
    const s = game.defaultState();
    game.registerKill(s, { name: "x", tier: "elite", goldReward: 1, xpReward: 1, isBoss: false });
    assertEqual(s.materials.paleFragment, 1, "elite dropa Pale Fragment");
    game.registerKill(s, { name: "x", tier: "normal", goldReward: 1, xpReward: 1, isBoss: false });
    assertEqual(s.materials.dimShard, 1, "normal dropa Dim Shard");
  } finally { Math.random = _r; }
});

test("registerKill de chefe dropa o material do mapa atual", () => {
  const s = game.defaultState();
  s.map = 0; // The Dreaming Wood → Dreamspore
  game.registerKill(s, { name: "boss", goldReward: 1, xpReward: 1, isBoss: true, shardMult: 1 });
  assertEqual(s.materials.dreamspore, 1, "chefe de plains dropa Dreamspore");
});

test("materiais persistem após converge e ascend", () => {
  const s = game.defaultState();
  s.materials = { dimShard: 50, dreamspore: 3 };
  s.level = 15;
  game.converge(s);
  assertEqual(s.materials.dimShard, 50, "materiais persistem no converge");
  assertEqual(s.materials.dreamspore, 3, "material de mapa persiste no converge");
  s.level = 30; s.mapProgress = { 0: game.lastSubarea() };
  game.ascend(s);
  assertEqual(s.materials.dimShard, 50, "materiais persistem no ascend");
});

console.log("\n== Fase 5: peças nomeadas (DESIGN §26) ==");
test("as 6 peças usam os nomes do DESIGN", () => {
  const byId = {};
  SLOTS.forEach(s => byId[s.id] = s.defaultName);
  assertEqual(byId.Weapon, "The Waning Edge");
  assertEqual(byId.Armor,  "Veil of Cinders");
  assertEqual(byId.Amulet, "The Last Resonance");
  assertEqual(byId.Ring,   "Band of Dusk");
  assertEqual(byId.Gloves, "Grasp of the Unnamed");
  assertEqual(byId.Helmet, "Crown of Hollow Stars");
});

console.log("\n== Fase 2: Ordre de Lumière (tiers) ==");
test("tiers usam a Ordre de Lumière (Seeker→Lumière)", () => {
  const names = TIERS.map(t => t.name);
  assertEqual(names[0], "Seeker", "tier 0 = Seeker");
  assertEqual(names[1], "Illuminate", "tier 1 = Illuminate");
  assertEqual(names[2], "Éclairé", "tier 2 = Éclairé");
  assertEqual(names[3], "L'Éveillé", "tier 3 = L'Éveillé");
  assertEqual(names[4], "Lumière", "tier 4 = Lumière");
});

test("heroTier resolve o nome da Ordre conforme ascensões", () => {
  const s = game.defaultState();
  s.ascensions = 0;    assertEqual(TIERS[game.heroTier(s)].name, "Seeker");
  s.ascensions = 50;   assertEqual(TIERS[game.heroTier(s)].name, "Illuminate");
  s.ascensions = 1000; assertEqual(TIERS[game.heroTier(s)].name, "Lumière");
});

console.log("\n== Regressão: render robusto ==");
test("fmt não lança em entrada inválida (undefined/null/NaN)", () => {
  // Regressão: s.gold virou undefined após o rename da Fase 0 e fmt(undefined)
  // lançava TypeError, abortando renderAll → tela branca.
  assertEqual(fmt(undefined), "0", "fmt(undefined) deve virar 0, não lançar");
  assertEqual(fmt(null), "0", "fmt(null) deve virar 0");
  assertEqual(fmt(NaN), "0", "fmt(NaN) deve virar 0");
  assertEqual(fmt(0), "0", "fmt(0) continua 0");
});

report();
