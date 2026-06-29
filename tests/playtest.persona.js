// =============================================================
// tests/playtest.persona.js — PERSONA DE QA ("Marina, a Completista")
// Rodar: node tests/playtest.persona.js
//
// Marina joga o jogo inteiro de forma headless e relata achados.
// Perfil: metódica, gasta TODO lumen em gear, promove quando tem material,
// converge no gate e investe em passivas, empurra o mais longe possível.
//
// Não usa framework. Carrega os módulos de src/ num sandbox (G.ui = null) e
// dirige o motor real (combat/state/economy/convergence/passives/gear).
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
// Date.now é usado por state.save/fresh; ok no Node.
const SRC = path.join(__dirname, "..", "src");
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));
G.ui = null; // headless: combat resolve hits na hora (sem projéteis)

// RNG determinístico: combat/economy usam Math.random (via G.util.chance/pick).
// Semear torna a sim REPRODUTÍVEL — pré-requisito pra medir balance, não chutar.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seed(s) { Math.random = mulberry32(s >>> 0); }
seed(0xEC1A75); // seed global padrão

// ---------- coletor de achados ----------
const findings = [];
function flag(sev, area, msg) { findings.push({ sev, area, msg }); }
const num = (n) => G.util.fmt(n);
function finite(x) { return Number.isFinite(x); }

// ---------- IA da Marina: gasto de lumens ----------
function spendLumens() {
  // promove peças maximizadas se houver material
  for (const slot of G.data.slots) {
    const item = G.state.data.equipped[slot.id];
    if (G.gear.isMaxed(item) && G.gear.canPromote(item)) G.gear.promote(item);
  }
  // sobe o nível da peça mais barata enquanto puder pagar (esvazia o lumen)
  let guard = 100000;
  while (guard-- > 0) {
    let cheapest = null, cost = Infinity;
    for (const slot of G.data.slots) {
      const item = G.state.data.equipped[slot.id];
      if (G.gear.isMaxed(item)) continue;
      const c = G.gear.cost(item);
      if (c < cost) { cost = c; cheapest = item; }
    }
    if (!cheapest || G.state.data.lumens < cost) break;
    G.gear.levelUp(cheapest);
  }
}

// compra passivas acessíveis (prioriza nó primário de cada árvore)
function spendPassives() {
  let bought = 0, guard = 5000;
  while (guard-- > 0) {
    let did = false;
    for (const tree of G.passives.TREES)
      for (let i = 0; i < 15; i++)
        if (G.passives.canBuy(tree, i)) { G.passives.buy(tree, i); bought++; did = true; }
    if (!did) break;
  }
  return bought;
}

// ============================================================
// PART A — LOOP VIVO (early game, simulação literal na Área 1)
// ============================================================
function partA() {
  console.log("\n===== PART A — Loop vivo (Área 1, simulação real) =====");
  store = {}; G.state.data = null; G.state.load();
  const d = G.state.data;

  // sanity inicial
  const s0 = G.state.stats();
  if (!finite(s0.atk) || !finite(s0.hp)) flag("BUG", "A", "Stats iniciais não-finitos");
  const firstMobHp = G.data.mobHpAt(1, G.data.areas[0]);
  const ttk0 = firstMobHp / (s0.atk / G.state.attackInterval());
  console.log(`Início: ATK ${num(s0.atk)} | HP ${num(s0.hp)} | atkSpeed ${s0.atkSpeed} | 1º mob HP ${num(firstMobHp)} | TTK ${ttk0.toFixed(2)}s`);
  if (ttk0 < 0.5) flag("BAL", "A", `TTK do 1º mob baixo demais (${ttk0.toFixed(2)}s) — one-shot logo de cara`);
  if (ttk0 > 6)   flag("BAL", "A", `TTK do 1º mob alto demais (${ttk0.toFixed(2)}s) — early lento`);

  // simula até ~25 min de jogo OU subir de área
  let t = 0, kills0 = d.totalKills, deaths = 0, dropEvents = 0, maxAtkSpeed = 0;
  const T_MAX = 25 * 60;
  const hpBefore = () => d.hp;
  // hook de drops: detecta se cai material na Área 1/2 (não deveria)
  const origRoll = G.economy.rollDrops.bind(G.economy);
  G.economy.rollDrops = function (e, opts) {
    const out = origRoll(e, opts);
    if (Object.keys(out).length) {
      dropEvents++;
      if ((d.areaIndex || 0) < 2) flag("BUG", "A", `Material dropou na área ${d.areaIndex + 1} (gate é Área 3+)`);
    }
    return out;
  };

  // checkpoints de PACE
  const gearLevels = () => G.data.slots.reduce((s, sl) => s + (d.equipped[sl.id].level || 1), 0);
  const gearMaxed  = () => G.data.slots.every(sl => G.gear.isMaxed(d.equipped[sl.id]));
  let cpArea1 = null, cpGearMax = null;

  let oneShotReported = false, lastLevel = d.level, levelStalls = 0, lastKills = d.totalKills;
  while (t < T_MAX) {
    const dt = 0.1; // dt fino: tempo realista (~60fps no jogo), não amarrado ao attackInterval
    const hp0 = hpBefore();
    G.combat.tick(dt);
    t += dt;
    if (d.hp < hp0 && d.hp === G.state.maxHp() && hp0 <= G.state.maxHp()) {} // ignore
    maxAtkSpeed = Math.max(maxAtkSpeed, G.state.stats().atkSpeed);
    // detecta morte (respawn cura total): heurística via log seria melhor, mas
    // checamos hp que voltou ao máximo após cair a 0 — aproximamos por respawnTimer
    spendLumens();
    if (d.level !== lastLevel) { lastLevel = d.level; }
    // checkpoint: Área 1 limpa (entrou na Área 2)
    if (!cpArea1 && d.areaIndex >= 1)
      cpArea1 = { t, kills: d.totalKills - kills0, lumens: d.lumens, gearLv: gearLevels(), level: d.level };
    // checkpoint: gear totalmente maximizado
    if (!cpGearMax && gearMaxed())
      cpGearMax = { t, level: d.level, area: d.areaIndex + 1, lumens: d.lumens };
    // sobe de área ao desbloquear (Marina viaja assim que pode)
    if ((d.maxAreaUnlocked || 0) > d.areaIndex) { d.areaIndex = d.maxAreaUnlocked; }
    // verifica one-shot recorrente: se mob morre em 1 swing consistentemente em nível alto
    if (!oneShotReported && d.totalKills - kills0 > 50) {
      const s = G.state.stats();
      const mhp = G.data.mobHpAt(d.level, G.data.currentArea());
      const dmgPerSwing = s.atk * (1 + s.critDmg / 100 * (s.crit / 100));
      if (dmgPerSwing > mhp * 3) { flag("BAL", "A", `One-shot fácil: dano/golpe (${num(dmgPerSwing)}) >> HP do mob (${num(mhp)}) por volta do nível ${d.level}`); oneShotReported = true; }
    }
  }
  G.economy.rollDrops = origRoll; // restaura

  const killsA = d.totalKills - kills0;
  const kpm = killsA / (t / 60);
  console.log(`Após ${(t/60).toFixed(0)} min: nível ${d.level} | kills ${killsA} (${kpm.toFixed(1)}/min) | lumens ${num(d.lumens)} | área ${d.areaIndex + 1} | atkSpeed máx ${maxAtkSpeed}`);
  console.log(`Drops na Área 1-2: ${dropEvents} evento(s) (esperado 0 até Área 3)`);
  // ---- PACE (alvo: Área 1 em ~10-15 min; gear não maximizar antes da Área 3) ----
  if (cpArea1)
    console.log(`PACE · Área 1 limpa: ${(cpArea1.t/60).toFixed(1)} min | nível ${cpArea1.level} | ${cpArea1.kills} kills | gear total Lv ${cpArea1.gearLv}/3000 | lumens ${num(cpArea1.lumens)}`);
  else
    console.log(`PACE · Área 1 NÃO limpa em ${(t/60).toFixed(0)} min`);
  if (cpGearMax)
    console.log(`PACE · Gear maximizado: ${(cpGearMax.t/60).toFixed(1)} min | nível ${cpGearMax.level} | Área ${cpGearMax.area} | lumens sobrando ${num(cpGearMax.lumens)}`);
  else
    console.log(`PACE · Gear NÃO maximizou em ${(t/60).toFixed(0)} min (bom: ainda há ralo)`);
  // avaliações de pace vs alvos
  if (cpArea1) {
    const m = cpArea1.t / 60;
    // alvo ~18 min: Attack Speed cresce devagar de propósito (capa só no Mapa 2),
    // o que torna o Mapa 1 mais deliberado (~5h). Decisão consciente de design.
    if (m < 10) flag("BAL", "A", `Área 1 rápida demais (${m.toFixed(1)} min; alvo ~18)`);
    if (m > 26) flag("BAL", "A", `Área 1 lenta demais (${m.toFixed(1)} min; alvo ~18)`);
  }
  if (cpGearMax && cpGearMax.area < 3)
    flag("BAL", "A", `Gear maximiza na Área ${cpGearMax.area} (antes da Área 3, onde abre a promoção) → lumens transbordam`);
  // valida cap de atk speed no Mapa 1
  if (maxAtkSpeed > G.data.balance.map1AtkSpeedCap + 1e-9)
    flag("BUG", "A", `atkSpeed ${maxAtkSpeed} passou do cap do Mapa 1 (${G.data.balance.map1AtkSpeedCap})`);
  // progresso mínimo (não soft-lock)
  if (d.level < 3) flag("BAL", "A", `Progresso muito lento: só nível ${d.level} após ${(t/60).toFixed(0)} min`);
  return { level: d.level, kpm, lumens: d.lumens, area: d.areaIndex + 1 };
}

// ============================================================
// PART B — META LOOP (convergence × passivas, analítico)
// ============================================================
function partB() {
  console.log("\n===== PART B — Convergence × Passivas =====");
  store = {}; G.state.data = null; G.state.load();
  const levels = [80, 150, 400, 700, 1000, 2000, 5000];
  console.log("Pontos por convergence (k=" + G.convergence.legacy.k + "):");
  for (const L of levels) {
    G.state.data.level = L;
    const pts = G.convergence.points();
    if (!finite(pts)) flag("BUG", "B", `Pontos não-finitos no nível ${L}`);
    console.log(`  Lv ${String(L).padStart(4)} → ${num(pts)} pts`);
  }
  // custo do tier 1 de UMA árvore (5 nós × nível 10)
  let tier1Cost = 0;
  for (let i = 0; i < 5; i++) {
    tier1Cost += G.passives.unlockCost(i);
    for (let lv = 1; lv < G.passives.nodeMax("eclat", i); lv++)
      tier1Cost += Math.ceil(G.passives.unlockCost(i) * G.passives.evoFactor * Math.pow(G.passives.evoRamp, lv - 1));
  }
  console.log(`Custo do tier 1 de uma árvore (maxado): ${num(tier1Cost)} pts`);

  // simula convergences repetidas no padrão de jogo do dono (Lv ~400-1000)
  store = {}; G.state.data = null; G.state.load();
  let conv = 0, guard = 500;
  const convAtLevel = () => 400 + Math.min(conv * 60, 600); // empurra mais a cada run, satura em 1000
  while (guard-- > 0) {
    G.state.data.level = convAtLevel();
    G.convergence.converge();
    conv++;
    spendPassives();
    const prog = G.passives.treeProgress("eclat");
    if (prog.maxed >= 5) break; // tier 1 da Éclat (índices 0-4) maxado
  }
  console.log(`Convergences até maximizar o tier 1 da Éclat: ${conv}`);
  if (conv < 8)  flag("BAL", "B", `Tier 1 maximiza rápido demais (${conv} convergences; alvo 10-15)`);
  if (conv > 20) flag("BAL", "B", `Tier 1 maximiza lento demais (${conv} convergences; alvo 10-15)`);
  return { conv, tier1Cost };
}

// ============================================================
// PART C — INVARIANTES POR ÁREA + sistemas (promote, drops, forge)
// ============================================================
function partC() {
  console.log("\n===== PART C — Invariantes por área e sistemas =====");
  store = {}; G.state.data = null; G.state.load();
  const d = G.state.data;

  console.log("Área | mob HP (início→teto) | boss HP | mob dmg@teto");
  for (let i = 0; i < G.data.areas.length; i++) {
    const a = G.data.areas[i];
    d.level = a.levelRange[0];
    const hpLo = G.data.mobHpAt(a.levelRange[0], a);
    const hpHi = G.data.mobHpAt(a.levelRange[1], a);
    const bossHp = hpHi * G.data.balance.bossHpMult;
    const mobAtk = G.data.balance.mobAtkByArea[i];   // ATK do mob agora é por área
    if (![hpLo, hpHi, bossHp, mobAtk].every(finite)) flag("BUG", "C", `Valores não-finitos na área ${i + 1}`);
    if (hpHi < hpLo) flag("BAL", "C", `Área ${i + 1}: HP do teto (${num(hpHi)}) < HP do início (${num(hpLo)})`);
    console.log(`  ${String(i+1).padStart(2)} | ${num(hpLo)} → ${num(hpHi)} | ${num(bossHp)} | ${num(Math.ceil(mobAtk))}`);
  }

  // salto de dificuldade entre áreas (paradox of power): HP início da área N vs teto da N-1
  for (let i = 1; i < G.data.areas.length; i++) {
    const prevHi = G.data.mobHpAt(G.data.areas[i-1].levelRange[1], G.data.areas[i-1]);
    const curLo  = G.data.mobHpAt(G.data.areas[i].levelRange[0],  G.data.areas[i]);
    const ratio  = curLo / prevHi;
    if (ratio > 1.0) {} // esperado subir
    if (ratio < 0.3) flag("BAL", "C", `Área ${i+1} começa com HP ${(ratio*100).toFixed(0)}% do teto anterior — queda de dificuldade`);
  }

  // atkSpeed cap respeitado em ambos os mapas
  store = {}; G.state.data = null; G.state.load();
  G.state.data.mapOneCleared = false;
  // injeta atkSpeed gigante via passiva? Mais simples: checa o clamp diretamente
  const capMap1 = G.state.currentAtkSpeedCap();
  G.state.data.mapOneCleared = true; G.state.invalidateStats();
  const capMap2 = G.state.currentAtkSpeedCap();
  console.log(`atkSpeed cap: Mapa 1 = ${capMap1} | Mapa 2 = ${capMap2}`);
  if (capMap1 !== G.data.balance.map1AtkSpeedCap) flag("BUG", "C", "Cap do Mapa 1 incorreto");
  if (capMap2 !== G.data.balance.map2AtkSpeedCap) flag("BUG", "C", "Cap do Mapa 2 incorreto");
  if (G.data.balance.map2AtkSpeedCap >= G.data.balance.atkSpeedCap)
    flag("BUG", "C", "Cap do Mapa 2 deveria ficar abaixo do teto final (15)");

  // PROMOTE: common → uncommon preservando nível e consumindo material
  store = {}; G.state.data = null; G.state.load();
  const weapon = G.state.data.equipped.weapon;
  weapon.level = G.gear.cap(weapon); // maxa
  G.economy.addGear("common", G.data.balance.promoteCommonCost);
  const lvlBefore = weapon.level, matBefore = G.economy.getGear("common");
  const promoted = G.gear.promote(weapon);
  const w2 = G.state.data.equipped.weapon;
  if (!promoted) flag("BUG", "C", "Promote common→uncommon falhou mesmo com material e nível máximo");
  else {
    if (w2.rarity !== "uncommon") flag("BUG", "C", "Promote não mudou a raridade para uncommon");
    if (w2.level !== lvlBefore)   flag("BUG", "C", `Promote não preservou o nível (${lvlBefore} → ${w2.level})`);
    if (G.economy.getGear("common") !== matBefore - G.data.balance.promoteCommonCost)
      flag("BUG", "C", "Promote não consumiu a quantidade certa de material");
  }
  console.log(`Promote weapon: ${promoted ? "OK" : "FALHOU"} (raridade ${w2.rarity}, nível ${w2.level})`);

  // DROP GATING por área
  store = {}; G.state.data = null; G.state.load();
  const R0 = { rng: () => 0 };
  for (const [idx, expect] of [[0, false], [1, false], [2, true]]) {
    const out = G.economy.rollDrops({}, Object.assign({ type: "elite", areaIndex: idx }, R0));
    const got = Object.keys(out).length > 0;
    if (got !== expect) flag("BUG", "C", `Drop gating errado: área ${idx+1} elite deu drop=${got}, esperado ${expect}`);
  }
  console.log("Drop gating Área 1-2 bloqueado / Área 3 liberado: verificado");
}

// ============================================================
// PART D — REACH TEST (playthrough completo headless, motor real)
// Mede o "ponto cego": dá pra completar o Mapa 1 SEM convergir? E COM, em quantas?
// Modela a Marina voltando a pé pós-convergence (avança 1 área por boss batido),
// e convergindo quando EMPACA (não troca de área há 15 min virtuais).
// ============================================================
const fmtT = (s) => (s < 60 ? s.toFixed(0) + "s" : s < 3600 ? (s / 60).toFixed(1) + "m" : (s / 3600).toFixed(2) + "h");

function reachRun(allowConverge, runSeed) {
  seed(runSeed);
  store = {}; G.state.data = null; G.state.load();
  const d = G.state.data;
  let t = 0, conv = 0, deaths = 0;
  const dt = 0.25;
  const origDeath = G.combat.onDeath.bind(G.combat);
  G.combat.onDeath = function () { deaths++; return origDeath(); };
  const perArea = [];
  let lastArea = -1, lastLevel = d.level, lastLevelT = 0;
  const T_MAX = (allowConverge ? 24 : 6) * 3600;
  let outcome = "timeout";

  const snapshot = () => {
    const s = G.state.stats();
    const a = G.data.currentArea();
    const mhp = G.data.mobHpAt(d.level, a);
    const dps = s.atk * s.atkSpeed * (1 + (s.crit / 100) * (s.critMult - 1));
    const pack = d.areaIndex < 2 ? 1 : d.areaIndex < 5 ? 2 : 3;
    const inDps = (G.data.balance.mobAtkByArea[d.areaIndex] / 0.99) * pack;
    perArea[d.areaIndex] = { t, level: d.level, gear: d.equipped.weapon.rarity + " Lv" + d.equipped.weapon.level, conv, ttk: mhp / dps, survS: s.hp / inDps };
  };

  while (t < T_MAX) {
    G.combat.tick(dt); t += dt;
    spendLumens();
    // Marina sobe de nível DENTRO da área e só avança quando "outgrow" o teto de
    // nível dela (modelo realista; evita avançar subnivelada no boss-rush).
    const area = G.data.currentArea();
    if (d.level >= area.levelRange[1] && (d.maxAreaUnlocked || 0) > d.areaIndex && d.areaIndex < 8) d.areaIndex++;
    if (d.areaIndex !== lastArea) { lastArea = d.areaIndex; snapshot(); }
    if (d.level > lastLevel) { lastLevel = d.level; lastLevelT = t; }
    if (d.mapOneCleared) { outcome = "cleared"; break; }
    // PAREDE = nível estagnado (morrendo em loop / TTK infinito) por 10 min virtuais
    if (t - lastLevelT > 10 * 60) {
      if (allowConverge && G.convergence.canConverge()) {
        conv++; G.convergence.converge(); spendPassives();
        lastArea = -1; lastLevel = d.level; lastLevelT = t; // resetou pra Área 1
      } else { outcome = "wall"; break; }
    }
  }
  G.combat.onDeath = origDeath;
  if (!perArea[d.areaIndex]) snapshot();
  return { perArea, t, conv, deaths, outcome, areaStuck: d.areaIndex + 1, level: d.level };
}

function partD() {
  console.log("\n===== PART D — Reach test (playthrough completo) =====");
  const printRun = (r, label) => {
    console.log(`\n· ${label}`);
    console.log("  Área | chegada | Lv | gear | TTK | sobrev | conv");
    for (let i = 0; i < 9; i++) { const p = r.perArea[i]; if (!p) continue;
      console.log(`  A${i+1} | ${fmtT(p.t)} | ${p.level} | ${p.gear} | ${p.ttk.toFixed(1)}s | ${p.survS.toFixed(1)}s | ${p.conv}`); }
    if (r.outcome === "cleared") console.log(`  ✓ LIMPO em ${fmtT(r.t)} | ${r.conv} convergences | ${r.deaths} mortes`);
    else if (r.outcome === "wall") console.log(`  ✋ PAREDE na Área ${r.areaStuck} | ${fmtT(r.t)} | ${r.deaths} mortes`);
    else console.log(`  (timeout em ${fmtT(r.t)}, parou na Área ${r.areaStuck})`);
  };

  const SEEDS = [0xA11, 0xB22, 0xC33, 0xD44, 0xE55];
  const median = (xs) => { const a = xs.slice().sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };

  // gear-only: roda todos os seeds, reporta 1 e agrega a parede
  const g0s = SEEDS.map((s) => reachRun(false, s));
  printRun(g0s[0], "SEM CONVERGENCE (gear-only) — seed 1 de " + SEEDS.length);
  const wallAreas = g0s.map((r) => r.outcome === "cleared" ? 99 : r.areaStuck);
  const wMed = median(wallAreas);
  console.log(`  paredes por seed: [${wallAreas.join(", ")}] → mediana A${wMed}`);

  const gCs = SEEDS.map((s) => reachRun(true, s));
  printRun(gCs[0], "COM CONVERGENCE — seed 1 de " + SEEDS.length);
  const convs = gCs.map((r) => r.outcome === "cleared" ? r.conv : null);
  const cleared = convs.filter((c) => c != null);
  console.log(`  convergences p/ limpar por seed: [${gCs.map(r => r.outcome === "cleared" ? r.conv : "✗A" + r.areaStuck).join(", ")}]`);

  // ---- avalia vs o alvo do dono: A1-3 passáveis sem conv; parede na A4; clear com conv ----
  if (wMed >= 99) flag("BAL", "D", `Gear-only LIMPA o mapa — convergence é pulável (alvo: parede na A4)`);
  else if (wMed < 4) flag("BAL", "D", `Parede cedo demais: gear-only trava na A${wMed} (alvo A4 — A1-3 sem convergence)`);
  else if (wMed > 4) flag("BAL", "D", `Parede tarde demais: gear-only trava na A${wMed} (alvo A4)`);
  else console.log(`  ✓ alvo: gear-only passa A1-3 e trava na A4 (mediana) — correto`);

  if (cleared.length < SEEDS.length) flag("BAL", "D", `Com convergence nem sempre limpa (${cleared.length}/${SEEDS.length} seeds)`);
  else { const cMed = median(cleared);
    if (cMed < 8) flag("BAL", "D", `Limpa com poucas convergences (mediana ${cMed}; alvo 8-12)`);
    else if (cMed > 14) flag("BAL", "D", `Limpa com convergences demais (mediana ${cMed}; alvo 8-12)`);
    else console.log(`  ✓ alvo: limpa com mediana ${cMed} convergences (8-12) — correto`); }
  return { g0s, gCs };
}

// ---------- run ----------
const A = partA();
const B = partB();
partC();
partD();

console.log("\n========== ACHADOS DA MARINA ==========");
if (!findings.length) console.log("Nenhum problema crítico encontrado nos aspectos testados.");
const order = { BUG: 0, BAL: 1, DEAD: 2 };
findings.sort((a, b) => (order[a.sev] - order[b.sev]) || a.area.localeCompare(b.area));
for (const f of findings) console.log(`[${f.sev}] (Part ${f.area}) ${f.msg}`);
console.log(`\nTotal: ${findings.length} achado(s) — ` +
  `${findings.filter(f=>f.sev==="BUG").length} bug, ` +
  `${findings.filter(f=>f.sev==="BAL").length} balance, ` +
  `${findings.filter(f=>f.sev==="DEAD").length} dead-content.`);
