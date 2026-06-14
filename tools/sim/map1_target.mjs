// MAP 1 — alvo de 36h. Quanto de HP os mobs precisam? (sem o cap de 1e6)
// Testa N=5 e N=9 sub-áreas, varrendo o TETO de HP do mob (hpHi). Modelo limpo do M1:
// Base(Nível) × Gear(2 afixos, Faded) × Convergence. Gasta só na arma. Uso: node tools/sim/map1_target.mjs

const APS = 5, BASE = 7, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15, KILLGATE = 100;

// modelo de poder (Faded, conv=0): dmgHit = (base + nível×10 + wl×flat) × (1 + wl×pct)
function clear(N, hpHi, { flat = 50, pct = 0.02, costBase = 5, costRamp = 1, killGate = KILLGATE } = {}) {
  const hpLo = 10;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * flat) * (1 + p.wl * pct);
  const cost = () => costBase * (p.wl + 1) * costRamp ** p.wl;
  let total = 0;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0;
    while (guard++ < 2e7) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.lumens >= cost() && b++ < 20000) { p.lumens -= cost(); p.wl++; }
      if (kills >= killGate && dmgHit() * APS >= bossHp / 10) break;
      if (subTime > 400 * 86400) return { total: Infinity, wl: p.wl }; // trava (>400d = falhou)
    }
  }
  return { total, wl: p.wl };
}

const fmtT = (s) => !isFinite(s) ? 'FALHOU(>400d)' : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(2)}d`;

console.log('='.repeat(82));
console.log('MAP 1 → quanto de HP precisa pra ~36h? · custo do gear ATUAL (5×(L+1), linear)');
console.log('='.repeat(82));
const ceilings = [1e6, 1e9, 1e12, 1e15, 1e20, 1e30, 1e45, 1e60, 1e80];
for (const N of [5, 9]) {
  console.log(`\n── ${N} sub-áreas ──`);
  console.log(' HP teto (hpHi) | tempo M1     | arma lvl fim');
  console.log(' ' + '-'.repeat(46));
  for (const H of ceilings) {
    const r = clear(N, H);
    console.log(` ${H.toExponential(0).padStart(13)} | ${fmtT(r.total).padStart(12)} | ${r.wl.toExponential(2)}`);
  }
}
console.log('\n' + '='.repeat(82));
console.log('TESTE 2 — e se apertar o CUSTO do gear (a renda não acompanha)? N=5, HP teto 1e12');
console.log('='.repeat(82));
console.log(' costBase | costRamp | tempo M1');
console.log(' ' + '-'.repeat(36));
for (const [cb, cr] of [[5, 1], [5, 1.00002], [5, 1.00005], [50, 1.00005], [5, 1.0001]]) {
  const r = clear(5, 1e12, { costBase: cb, costRamp: cr });
  console.log(` ${String(cb).padStart(8)} | ${String(cr).padStart(8)} | ${fmtT(r.total)} (arma ${r.wl.toExponential(1)})`);
}
