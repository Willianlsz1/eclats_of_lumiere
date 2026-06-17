// MAP 1 — pacing da RECALIBRAÇÃO "EM BRANCO" (sessão 2026-06-17 c/ Willian).
// Valores definidos por design 1-a-1 (ver docs/eclats_balance_blank_2026-06-17.md).
// Modela: combate single-target, gate de sub-área por NÍVEL, compra gulosa de Gear,
// Convergence (reseta nível da run + nível do Gear; +15% dano/vida e +3% Lumens, frequente),
// e Despertar na sub-área 7 (×2 dano/vida, +5% crit, crit dmg ×2→×4, +0.3 APS).
// Uso: node tools/sim/map1_blank.mjs

// ── Combate base ──
const BASE = 1000;        // baseDmg
const DMG_LVL = 150;      // +dano por nível do Seeker
const HP_LVL = 150;       // +vida por nível do Seeker
const BASE_HP = 30000;    // playerBaseHp
const APS0 = 2.0;         // baseAPS
const APSCAP = 10;        // teto de kills/s
// ── Economia ──
const GOLD = 0.10;        // lumens/kill = mobHp × GOLD
let   XP_RATIO = 0.08;    // xp/kill = mobHp × XP_RATIO  (livre — ajustável)
// ── Gear: 6 peças, 2 afixos cada (flat + bônus%), 2 CAMADAS (Flat + Bonus%).
//    1 nível por peça escala os 2 afixos. Assumo as 6 no MESMO nível L (compra
//    equilibrada): subir L→L+1 custa 6× o custo de 1 peça. Camada Multiplier ×
//    fica pro Hollow/raridades (decisão Willian: "versão 2 camadas" agora).
const GEAR_COST0 = 2000;          // custo do 1º nível (1 peça)
const GEAR_RAMP = 2 ** (1 / 10);  // dobra a cada 10 níveis (~1.0718)
const PIECES = 6;
// afixos por nível (agregados das 6 peças):
const G_DMG_FLAT = 50;            // Weapon: +50 dano flat/nv
const G_DMG_PCT = 0.01 + 0.01;    // Weapon 1% + Amuleto 1% = dano%/nv
const G_HP_FLAT = 300 + 300;      // Elmo 300 + Manto 300 = HP flat/nv
const G_HP_PCT = 0.01;            // Elmo: HP%/nv
const G_CRIT = 0.001;             // Luvas: +0.1% crit chance/nv
const G_CDMG_PCT = 0.02;          // Manto: +2% crit damage/nv (base 0%)
const G_APS = 0.01;               // Amuleto: +0.01 atk speed/nv
const G_GOLD_PCT = 0.02 + 0.02;   // Luvas 2% + Anel 2% = gold%/nv
const G_XP_PCT = 0.01;            // Anel: +1% XP/nv
// ── Malha do Map 1 ──
const N = 9, hpLo = 5000, hpHi = 670000, BOSSMULT = 15; // Wall ≈ 10M
const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 1) / (N - 1));
const bossHp = () => mobHpOf(N) * BOSSMULT;
// ── Convergence ──
const CONV_DMG = 0.15, CONV_LUM = 0.03; // por convergência (aditivo; XP = 0, vem do Gear)
// ── Despertar (sub-área 7) ──
const AWAKEN_SUB = 7, AWAKEN_MULT = 2, AWAKEN_APS = 0.3, AWAKEN_CRIT = 0.05, AWAKEN_CDMG = 2.0; // crit dmg base 0% +200%

const fmtT = (s) => s == null ? '  —  ' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s / 60).toFixed(1)}min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(2)}d`;
const REGEN_S = 0.01, REGEN_KILL = 0.02; // 1%/s + 2%/kill da vida máx (decisão Willian)
const PACK_OF = (s) => s <= 7 ? 2 : 3;    // 2 mobs até sub7, 3 nas sub8/9

// Luta UMA onda cheia, tick a tick. Só HP (sem defesa). Retorna {vive, minFrac, t}.
// snap = {maxHp, hit, aps, cc, cm} ; mob = {hp, dmg} ; boss = {hp, dmg}|null
function fightWave(snap, pack, mob, boss) {
  const eff = snap.hit * (1 + snap.cc * (snap.cm - 1)); // golpe esperado (com crit médio)
  let hp = snap.maxHp, trash = pack, bossHp = boss ? boss.hp : 0, atkCD = 0, t = 0, minFrac = 1;
  const dt = 0.02;
  while (t < 600) {
    const incoming = trash * mob.dmg + (bossHp > 0 ? boss.dmg : 0);
    hp -= incoming * dt;
    hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_S * dt);
    if (hp <= 0) return { vive: false, minFrac: 0, t };
    minFrac = Math.min(minFrac, hp / snap.maxHp);
    atkCD -= dt;
    while (atkCD <= 0 && (trash > 0 || bossHp > 0)) {
      atkCD += 1 / snap.aps;
      if (trash > 0) { trash--; hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_KILL); } // 1 kill/ataque
      else { bossHp -= eff; if (bossHp <= 0) hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_KILL); }
    }
    if (trash <= 0 && bossHp <= 0) return { vive: true, minFrac, t };
    t += dt;
  }
  return { vive: true, minFrac, t };
}

function pace(curveDiv, curveExp, gates, convGrowth, convBase = gates[1]) {
  // estado persistente (sobrevive à Convergence)
  let conv = 0, unlocked = 1, t = 0, awakened = false, convGate = convBase;
  const events = [];
  // estado da run (reseta na Convergence — exceto o Gear)
  let xpRun = 0, level = 1, gearLvl = 0, lumens = 0;
  let convCount = 0;
  const M = { lvl2: null, sub2: null, conv1: null, awaken: null, wall: null };

  const convDmg = () => 1 + CONV_DMG * conv;
  const convLum = () => 1 + CONV_LUM * conv;
  const awMult = () => awakened ? AWAKEN_MULT : 1;
  const aps = () => Math.min(APSCAP, APS0 + gearLvl * G_APS + (awakened ? AWAKEN_APS : 0));
  const critChance = () => Math.min(1, gearLvl * G_CRIT + (awakened ? AWAKEN_CRIT : 0));
  const critMult = () => 1 + gearLvl * G_CDMG_PCT + (awakened ? AWAKEN_CDMG : 0); // base 0% bônus
  const dmgHit = () => (BASE + level * DMG_LVL + gearLvl * G_DMG_FLAT) * (1 + gearLvl * G_DMG_PCT) * convDmg() * awMult();
  const dps = () => dmgHit() * aps() * (1 + critChance() * (critMult() - 1));
  const maxHp = () => (BASE_HP + level * HP_LVL + gearLvl * G_HP_FLAT) * (1 + gearLvl * G_HP_PCT) * convDmg() * awMult();
  const goldMult = () => (1 + gearLvl * G_GOLD_PCT) * convLum();
  const xpMult = () => 1 + gearLvl * G_XP_PCT;
  const stepCost = () => PIECES * GEAR_COST0 * GEAR_RAMP ** gearLvl; // subir as 6 de L→L+1
  // pior momento (menor HP) por área, p/ a checagem de sobrevivência
  const worst = {}; const snap = () => ({ maxHp: maxHp(), hit: dmgHit(), aps: aps(), cc: critChance(), cm: critMult(), level, gearLvl, conv });

  let guard = 0;
  while (guard++ < 5e7) {
    const mobHp = mobHpOf(unlocked);
    const d = dps();
    const tpk = Math.max(1 / aps(), mobHp / d);
    t += tpk;
    // registra o pior momento (menor maxHp) na área atual
    const mh = maxHp();
    if (!worst[unlocked] || mh < worst[unlocked].maxHp) worst[unlocked] = snap();
    lumens += mobHp * GOLD * goldMult();
    xpRun += mobHp * XP_RATIO * xpMult();
    level = Math.max(1, Math.floor((xpRun / curveDiv) ** curveExp));
    if (M.lvl2 === null && level >= 2) M.lvl2 = t;
    while (unlocked < N && level >= gates[unlocked]) {
      unlocked++;
      if (unlocked === 2 && M.sub2 === null) M.sub2 = t;
      if (unlocked === AWAKEN_SUB) { awakened = true; if (M.awaken === null) M.awaken = t; }
      if (unlocked === N) worst[N] = snap(); // captura o estado na ENTRADA da Wall
    }
    // compra gulosa de Gear (as 6 peças juntas; PERSISTE pela Convergence)
    let b = 0; while (lumens >= stepCost() && b++ < 5000) { lumens -= stepCost(); gearLvl++; }
    // Convergence: reseta SÓ o nível da run (Gear persiste)
    if (level >= convGate && unlocked >= 2) {
      conv++; convCount++; events.push({ area: unlocked, lvl: level });
      if (M.conv1 === null) M.conv1 = t;
      convGate = Math.max(convGate * convGrowth, level + 1);
      xpRun = 0; level = 1; lumens = 0;
    }
    if (unlocked === N && d >= bossHp() / 30) { M.wall = t; break; }
    if (t > 86400 * 10) break;
  }
  return { t, conv: convCount, unlocked, awakened, gearLvl, M, events, worst };
}

// ── calibração: varrer curveDiv / curveExp / gates ──
// gates[0]=sub1(=1), depois níveis de unlock crescentes.
const gates = [1, 30, 70, 130, 220, 350, 520, 740, 1000];
const XP1 = hpLo * XP_RATIO; // xp do 1º mob
// curveDiv fixado p/ level-2 acontecer em ~3 kills (≈8s): xpRun(lvl2)=3×XP1
const fitDiv = (curveExp) => (3 * XP1) / (2 ** (1 / curveExp));
console.log('gates de unlock (sub1..sub9):', gates.join(' '));
console.log('curveExp | curveDiv | t→lvl2 | t→sub2(1ª conv) | t→despertar | tempo Map1 | nº conv | gearLvl fim');
// ✅ ESCOLHIDO (Willian, 2026-06-17): curveExp=0.455 / curveDiv≈262 → Map 1 ~1,3 dias
// (com Gear persistente, packs 2×7+3+3, boss junto na sub9, sem cap de nível de mob).
// Convergence: gatilho 1º = LV 40 (decisão Willian); cresce ×1,3 a cada conv.
const CONV_BASE = 40, CONV_GROWTH = 1.3;
// ✅ ESCOLHIDO (Willian): com Gear completo (6 peças, 2 afixos flat+%, 2 camadas),
// curveExp=0.41 / curveDiv≈221 → Map 1 ~1,2 dias. Gear termina ~nível 184.
const curveExp = 0.41, curveDiv = Math.round(fitDiv(curveExp));
{
  const r = pace(curveDiv, curveExp, gates, CONV_GROWTH, CONV_BASE);
  const m = r.M;
  console.log(`${String(curveExp).padStart(8)} | ${String(curveDiv).padStart(8)} | ${fmtT(m.lvl2).padStart(6)} | ${fmtT(m.sub2 ?? m.conv1).padStart(15)} | ${fmtT(m.awaken).padStart(11)} | ${fmtT(r.t).padStart(10)} | ${String(r.conv).padStart(6)} | ${String(r.gearLvl).padStart(10)}`);
}

// ── SOBREVIVÊNCIA (só HP) — luta a onda no pior momento de cada área ──
console.log('\n=== sobrevivência (só HP) — pior momento (menor HP) por área ===');
console.log('área | HP no pior momento | dano onda/s | vive? | HP mínimo na luta | nota');
{
  const r = pace(curveDiv, curveExp, gates, CONV_GROWTH, CONV_BASE);
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.round(n).toLocaleString('pt-BR');
  for (let s = 1; s <= N; s++) {
    const w = r.worst[s]; if (!w) continue;
    const mob = { hp: mobHpOf(s), dmg: mobHpOf(s) * 0.04 };
    const boss = s === N ? { hp: bossHp(), dmg: mobHpOf(N) * 0.04 * 3 } : null;
    const pack = PACK_OF(s);
    const res = fightWave(w, pack, mob, boss);
    const wave = pack * mob.dmg + (boss ? boss.dmg : 0);
    const nota = s === N ? `Wall (boss ${fmt(bossHp())})` : `lvl ${w.level}, gear ${w.gearLvl}, conv ${w.conv}`;
    console.log(`${String(s).padStart(4)} | ${fmt(w.maxHp).padStart(18)} | ${fmt(wave).padStart(11)} | ${(res.vive ? ' SIM ' : '☠ MORRE').padStart(7)} | ${(res.vive ? (res.minFrac * 100).toFixed(0) + '%' : '0%').padStart(17)} | ${nota}`);
  }
}

// ── Estudo do GATILHO da Convergence (Willian vai escolher) ──
console.log('\n=== gatilho da Convergence (1º LV) → quantas conv e em que áreas ===');
console.log('gatilho | nº conv | áreas onde dispara (a cada conv) | tempo Map1');
for (const convBase of [30, 50, 80, 120, 180, 250]) {
  const r = pace(curveDiv, curveExp, gates, 1.3, convBase);
  const areas = r.events.map(e => e.area).join(',');
  console.log(`${String(convBase).padStart(7)} | ${String(r.conv).padStart(7)} | ${areas.padEnd(32)} | ${fmtT(r.t)}`);
}
