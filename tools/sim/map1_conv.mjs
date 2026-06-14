// MAP 1 Config B FINAL — convergence reseta SÓ o nível (mantém o gear), +15%/converge.
// Mecânica (decisão Willian 14/jun): converge quando nível ≥ gate; convMult += 0.15;
// gate ×= growth; xpRun=0 (nível→1); GEAR PERMANECE. Sem strand. Uso: node tools/sim/map1_conv.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, FLAT = 50, PCT = 0.02, KILLGATE = 100, GATE_DIV = 13;
const CAP = 1000; // ← cap do Faded = 1000 (decisão Willian)
const CONV_PER = 0.15, GATE_BASE = 40;

function run({ useConv, hpHi, costBase, gateGrowth }) {
  const COST_BASE = costBase, GATE_GROWTH = gateGrowth;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const cost = () => COST_BASE * (p.wl + 1);
  const rows = [];
  let total = 0, walled = false;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    const hitsEntry = Math.max(1, mobHp / dmgHit());
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      // convergence: reseta SÓ o nível, mantém o gear
      while (useConv && p.level >= p.gate) {
        p.convMult += CONV_PER; p.convs++; p.gate *= GATE_GROWTH; p.xpRun = 0; p.level = 1;
      }
      let b = 0;
      while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dmgHit() * APS >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    rows.push({ s, subTime, wl: p.wl, convs: p.convs, convMult: p.convMult, hitsEntry });
    if (!broke) { walled = true; break; }
  }
  return { total, rows, convs: p.convs, convMult: p.convMult, walled };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

const hpHi = 1e6;
console.log(`CAP Faded ${CAP} · HP teto ${hpHi.toExponential(0)} · alvo: SEM conv 12h, COM conv 6h\n`);
console.log('PASSO 2 — custo 900 (SEM conv ≈12.4h) · gate growth p/ COM conv ≈ 6h:');
console.log('  growth | COM conv (convs, ×mult)');
console.log('  ' + '-'.repeat(38));
for (const gateGrowth of [1.25, 1.35, 1.45, 1.6, 1.8]) {
  const b = run({ useConv: true, hpHi, costBase: 900, gateGrowth });
  console.log(`  ${String(gateGrowth).padStart(6)} | ${b.walled ? 'PAREDE' : `${fmtT(b.total)} (${b.convs}c, ×${b.convMult.toFixed(1)})`}`);
}
// config escolhida
const COST12 = 900, GROWTH = 1.25;
console.log(`\nDETALHE FINAL — custo ${COST12}, gate growth ${GROWTH}, cap ${CAP}:`);
for (const useConv of [false, true]) {
  const r = run({ useConv, hpHi, costBase: COST12, gateGrowth: GROWTH });
  console.log(`\n  ${useConv ? 'COM' : 'SEM'} conv — TOTAL ${r.walled ? 'PAREDE' : fmtT(r.total)} · ${r.convs} convs · ×${r.convMult.toFixed(2)}`);
  console.log('   sub | hits/mob | tempo sub  | arma lvl | convs | convMult');
  for (const x of r.rows)
    console.log(`   ${x.s}   | ${x.hitsEntry.toFixed(1).padStart(8)} | ${fmtT(x.subTime).padStart(10)} | ${x.wl.toExponential(2).padStart(8)} | ${String(x.convs).padStart(5)} | ×${x.convMult.toFixed(2)}`);
}
