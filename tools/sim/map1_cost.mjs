// MAP 1 — achar a curva de CUSTO do gear que dá ~6-8h ativas. APS REAL (0.90).
// Modelo limpo: Base × Gear(2 afixos, Faded) × Conv(0). Mob HP teto = 1e6 (atual).
// custo(L) = costBase × (L+1) × costRamp^L  (ramp=1 → linear). Uso: node tools/sim/map1_cost.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;

function clear(N, hpHi, { flat = 50, pct = 0.02, costBase = 5, costRamp = 1, killGate = 100 } = {}) {
  const hpLo = 10;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * flat) * (1 + p.wl * pct);
  const cost = () => costBase * (p.wl + 1) * costRamp ** p.wl;
  let total = 0, maxWl = 0;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= killGate && dmgHit() * APS >= bossHp / 10) break;
      if (subTime > 200 * 86400) return { total: Infinity };
    }
    maxWl = p.wl;
  }
  return { total, wl: maxWl };
}

const fmtT = (s) => !isFinite(s) ? 'FALHOU' : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(2)}d`;

console.log('='.repeat(78));
console.log('MAP 1 (5 subs, HP teto 1e9, APS 0.90) — re-tunar CUSTO p/ casar c/ o climb de 1e9');
console.log('='.repeat(78));
console.log(' costBase | costRamp  | tempo M1   | arma lvl fim');
console.log(' ' + '-'.repeat(52));
const tests = [
  [5, 1], [20, 1], [50, 1], [100, 1], [200, 1],
  [5, 1.0005], [5, 1.001], [5, 1.0015], [5, 1.002], [5, 1.003], [5, 1.004],
];
for (const [cb, cr] of tests) {
  const r = clear(5, 1e9, { costBase: cb, costRamp: cr });
  console.log(` ${String(cb).padStart(8)} | ${String(cr).padStart(8)} | ${fmtT(r.total).padStart(10)} | ${r.wl ? r.wl.toExponential(2) : '-'}`);
}
