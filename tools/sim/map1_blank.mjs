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
// ── Gear (arma) ──
const GEAR_DMG_FLAT = 50; // +dano por nível de arma
const GEAR_COST0 = 2000;  // custo do 1º nível
const GEAR_RAMP = 2 ** (1 / 10); // dobra a cada 10 níveis (~1.0718)
// ── Malha do Map 1 ──
const N = 9, hpLo = 5000, hpHi = 670000, BOSSMULT = 15; // Wall ≈ 10M
const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 1) / (N - 1));
const bossHp = () => mobHpOf(N) * BOSSMULT;
// ── Convergence ──
const CONV_DMG = 0.15, CONV_LUM = 0.03; // por convergência (aditivo)
// ── Despertar (sub-área 7) ──
const AWAKEN_SUB = 7, AWAKEN_MULT = 2, AWAKEN_APS = 0.3, AWAKEN_CRIT = 0.05, AWAKEN_CDMG = 2; // +200% → ×4

// Níveis-alvo de unlock das 9 sub-áreas (LIVRES — é o que estamos calibrando).
// Convergence frequente = 1ª na sub-área 2; gate de conv = unlock da sub-área alcançada.
const fmtT = (s) => s == null ? '  —  ' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s / 60).toFixed(1)}min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(2)}d`;

function pace(curveDiv, curveExp, gates, convGrowth) {
  // estado persistente (sobrevive à Convergence)
  let conv = 0, unlocked = 1, t = 0, awakened = false, convGate = gates[1]; // 1ª conv = gate da sub2
  // estado da run (reseta na Convergence)
  let xpRun = 0, level = 1, gearLvl = 0, lumens = 0;
  let kills9 = 0, convCount = 0;
  // marcos
  const M = { lvl2: null, sub2: null, conv1: null, awaken: null };

  const convDmg = () => 1 + CONV_DMG * conv;
  const convHp = () => 1 + CONV_DMG * conv;
  const convLum = () => 1 + CONV_LUM * conv;
  const awMult = () => awakened ? AWAKEN_MULT : 1;
  const aps = () => Math.min(APSCAP, APS0 + (awakened ? AWAKEN_APS : 0));
  const critChance = () => awakened ? AWAKEN_CRIT : 0;
  const critMult = () => awakened ? (2 + AWAKEN_CDMG) : 2; // ×2 base, ×4 pós-despertar
  const dmgHit = () => (BASE + level * DMG_LVL + gearLvl * GEAR_DMG_FLAT) * convDmg() * awMult();
  const dps = () => dmgHit() * aps() * (1 + critChance() * (critMult() - 1));
  const gearCost = () => GEAR_COST0 * GEAR_RAMP ** gearLvl;

  let guard = 0;
  while (guard++ < 5e7) {
    const onBoss = unlocked === N && kills9 >= 50; // entra a Wall após farmar a sub9
    const mobHp = onBoss ? bossHp() : mobHpOf(unlocked);
    const d = dps();
    const tpk = Math.max(1 / aps(), mobHp / d);
    const dt = tpk, k = 1; // 1 kill por passo
    t += dt;
    // renda ancorada ao mob mais fundo farmado
    lumens += k * mobHpOf(unlocked) * GOLD * convLum();
    xpRun += k * mobHpOf(unlocked) * XP_RATIO;
    level = Math.max(1, Math.floor((xpRun / curveDiv) ** curveExp));
    if (M.lvl2 === null && level >= 2) M.lvl2 = t;
    if (unlocked === N) kills9 += k;
    // unlock de sub-áreas por nível
    while (unlocked < N && level >= gates[unlocked]) {
      unlocked++;
      if (unlocked === 2 && M.sub2 === null) M.sub2 = t;
      if (unlocked === AWAKEN_SUB) { awakened = true; if (M.awaken === null) M.awaken = t; } // Despertar ao entrar na sub7
    }
    // compra gulosa de Gear
    let b = 0; while (lumens >= gearCost() && b++ < 5000) { lumens -= gearCost(); gearLvl++; }
    // Convergence: ao atingir o gate de nível (frequente). Reseta run; mantém posição+conv.
    if (level >= convGate && unlocked >= 2 && !onBoss) {
      conv++; convCount++;
      if (M.conv1 === null) M.conv1 = t;
      convGate = Math.max(convGate * convGrowth, level + 1); // próximo gate sobe
      xpRun = 0; level = 1; gearLvl = 0; lumens = 0;
    }
    // Wall derrotável → Map 1 limpo
    if (onBoss && d * 3 >= bossHp()) break;
    if (t > 86400 * 10) break; // trava de segurança
  }
  return { t, conv: convCount, unlocked, awakened, M };
}

// ── calibração: varrer curveDiv / curveExp / gates ──
// gates[0]=sub1(=1), depois níveis de unlock crescentes.
const gates = [1, 30, 70, 130, 220, 350, 520, 740, 1000];
const XP1 = hpLo * XP_RATIO; // xp do 1º mob
// curveDiv fixado p/ level-2 acontecer em ~3 kills (≈8s): xpRun(lvl2)=3×XP1
const fitDiv = (curveExp) => (3 * XP1) / (2 ** (1 / curveExp));
console.log('gates de unlock (sub1..sub9):', gates.join(' '));
console.log('curveExp | curveDiv | t→lvl2 | t→sub2(1ª conv) | t→despertar | tempo Map1 | nº conv');
// ✅ ESCOLHIDO (Willian, 2026-06-17): curveExp=0.47 / curveDiv≈275 → Map 1 ~1,3 dias.
for (const curveExp of [0.47]) {
  const curveDiv = Math.round(fitDiv(curveExp));
  const r = pace(curveDiv, curveExp, gates, 1.3);
  const m = r.M;
  console.log(`${String(curveExp).padStart(8)} | ${String(curveDiv).padStart(8)} | ${fmtT(m.lvl2).padStart(6)} | ${fmtT(m.sub2 ?? m.conv1).padStart(15)} | ${fmtT(m.awaken).padStart(11)} | ${fmtT(r.t).padStart(10)} | ${String(r.conv).padStart(6)}`);
}
