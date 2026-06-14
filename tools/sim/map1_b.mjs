// MAP 1 — Config B. Base SEM convergence + cap no gear → alvo ~12h (referência).
// Depois a convergence acelera p/ ~5-6h. Aqui só a BASE de 12h. Uso: node tools/sim/map1_b.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e9, FLAT = 50, PCT = 0.02, KILLGATE = 100, GATE_DIV = 13;

function run(cap, costBase, convMult = 1) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, cap) * FLAT) * (1 + Math.min(p.wl, cap) * PCT) * convMult;
  const cost = () => costBase * (p.wl + 1);
  let total = 0, walled = false, hitCap = false;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.wl < cap && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (p.wl >= cap) hitCap = true;
      if (kills >= KILLGATE && dps >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    if (!broke) break;
  }
  return { total, walled, finalWl: p.wl, hitCap };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

console.log('BASE sem conv: cap 40k, custo 280 →', fmtT(run(40000, 280).total), '\n');
console.log('Convergence como ACELERADOR multiplicativo (×M na vida toda), cap 40k, custo 280:');
console.log('  convMult | tempo M1   | arma fim | vs 12.5h');
console.log('  ' + '-'.repeat(46));
const base = run(40000, 280).total;
for (const M of [1, 2, 3, 5, 10, 30, 100]) {
  const r = run(40000, 280, M);
  console.log(`  ${('×'+M).padStart(8)} | ${fmtT(r.total).padStart(10)} | ${r.finalWl.toExponential(2)} | ${(r.total/base*100).toFixed(0)}%`);
}
