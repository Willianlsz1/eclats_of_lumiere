// MAP 1 — cálculo REVERSO: do boss → dano necessário → distribuição dos afixos.
// cap arma 1000 · APS rampa 0.90→1.5 (cap do M1) · duração mín 6h (ativo, com conv).
// Reporta o dano-por-hit no boss (com/sem conv) e a margem. Uso: node tools/sim/map1_affix.mjs

const BASE = 7, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08, DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e6, KILLGATE = 100, GATE_DIV = 13, CAP = 1000;
const APS_LO = 0.90, APS_HI = 1.5; // rampa de APS ao longo do mapa (afixo do Amuleto)
const CONV_PER = 0.15, GATE_BASE = 40;

// APS sobe com o progresso da arma (proxy do afixo de APS subindo junto): 0.90→1.5 no cap
const apsOf = (wl) => APS_LO + (APS_HI - APS_LO) * Math.min(1, wl / CAP);

function run({ useConv, FLAT, PCT, costBase, gateGrowth, lumFloor = 0 }) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const cost = () => costBase * (p.wl + 1);
  let total = 0, walled = false, bossDmgHit = 0, bossHp = 0, bossKillS = 0, totalKills = 0, firstBuyT = -1, lvl5T = -1; const rows = [];
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const aps = apsOf(p.wl);
      const dps = dmgHit() * aps;
      const tpk = Math.max(1 / aps, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt; totalKills += k;
      p.lumens += k * (mobHp * GOLD + lumFloor); // + PISO fixo de lumens (ajuda o early)
      if (firstBuyT < 0 && p.wl >= 1) firstBuyT = total;
      if (lvl5T < 0 && p.wl >= 5) lvl5T = total; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      while (useConv && p.level >= p.gate) { p.convMult += CONV_PER; p.convs++; p.gate *= gateGrowth; p.xpRun = 0; p.level = 1; }
      let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dps >= bHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    // breakdown do crossover: décadas do FLAT da arma vs décadas do % da arma
    const addBase = BASE + p.level * DMG_PER_LVL;            // base + nível (aditivo, sem arma)
    const wFlat = Math.min(p.wl, CAP) * FLAT;                // flat da arma (aditivo)
    const wPctMult = 1 + Math.min(p.wl, CAP) * PCT;          // % da arma (multiplicador)
    const flatDec = Math.log10((addBase + wFlat) / addBase); // quanto o FLAT da arma soma
    const pctDec = Math.log10(wPctMult);                     // quanto o % da arma multiplica
    rows.push({ s, wl: p.wl, flatDec, pctDec, prot: pctDec > flatDec ? '%' : 'flat' });
    if (s === N) { bossDmgHit = dmgHit(); bossHp = bHp; bossKillS = bHp / (dmgHit() * apsOf(p.wl)); }
    if (!broke) { walled = true; break; }
  }
  return { total, walled, bossDmgHit, bossHp, bossKillS, convMult: p.convMult, convs: p.convs, wl: p.wl, rows, totalKills, firstBuyT, lvl5T };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

const GROWTH = 1.25;
console.log('='.repeat(82));
console.log(`MAP 1 — flat→% protagonista · cap ${CAP} · APS ${APS_LO}→${APS_HI} · Boss 1.5e7 (~7.7e5/hit)`);
console.log('='.repeat(82));
// splits + custo ajustado p/ conv ~6h. Mostra onde o % assume.
const FLAT = 60, PCT = 0.02;
console.log(`Config: flat ${FLAT} + ${PCT*100}% · cap ${CAP} · piso de lumens + custo p/ segurar ≥6h`);
console.log('  piso | custo | 1º nível | nível 5  | TOTAL(conv) | TOTAL(sem)');
console.log('  ' + '-'.repeat(62));
for (const [lumFloor, COST] of [[60, 1400], [60, 1700], [60, 1900], [30, 1600], [120, 2000]]) {
  const a = run({ useConv: false, FLAT, PCT, costBase: COST, gateGrowth: GROWTH, lumFloor });
  const r = run({ useConv: true, FLAT, PCT, costBase: COST, gateGrowth: GROWTH, lumFloor });
  console.log(`  ${String(lumFloor).padStart(4)} | ${String(COST).padStart(5)} | ${fmtT(r.firstBuyT).padStart(8)} | ${fmtT(r.lvl5T).padStart(8)} | ${fmtT(r.total).padStart(11)} | ${fmtT(a.total).padStart(10)}`);
}
