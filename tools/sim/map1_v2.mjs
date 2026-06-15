// MAP 1 v2 — 9 sub-áreas, rescale ×500, crit gradual, APS→~1.3. Modelo fiel ao engine.
// Uso: node tools/sim/map1_v2.mjs
const BASE = 3500, DMG_PER_LVL = 5000, HP_PER_LVL = 2500, BASE_HP = 25000;
const GOLD = 0.10, XP = 0.08, DIV = 5000, EXP = 0.4, GOLD_PER_LVL = 1500, LUM_FLOOR = 30000;
const N = 9, hpLo = 5000, hpHi = 5e8, BOSSMULT = 15, KILLGATE = 100;
const CAP = 750, COSTBASE = 420000;
const APS0 = 0.90, APS_FLAT = 2e-4, CRIT_PER = 3e-4, DMG_FLAT = 30000, PCT = 0.02;
const CONV_PER = 0.15, GATE_BASE = 40, GATE_GROWTH = 1.25, APSCAP = 5;

const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
const bossHpOf = () => hpLo * (hpHi / hpLo) ** (N / N) * BOSSMULT;

function sim({ useConv }) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  // dano por hit = (base + nivel*dmgPerLvl + arma_flat) * (1 + wl*PCT) * conv   (Edge: flat + %)
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * DMG_FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const apsOf = () => {
    const reson = 1 + 0.3 * Math.log10(1 + Math.min(p.wl, CAP) * PCT * 9); // ~mult do afixo aps (Reson)
    return Math.min(APSCAP, (APS0 + Math.min(p.wl, CAP) * APS_FLAT) * reson);
  };
  const critOf = () => Math.min(1, Math.min(p.wl, CAP) * CRIT_PER);
  const cost = () => COSTBASE * (p.wl + 1);
  let total = 0; const rows = [];
  for (let s = 1; s <= N; s++) {
    const mobHp = s < N ? mobHpOf(s) : bossHpOf();
    const entryHit = dmgHit(), entryAps = apsOf(), entryCrit = critOf();
    let kills = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const aps = apsOf();
      const effDmg = dmgHit() * (1 + critOf() * 1); // crit = ×2 → +100% no proc
      const dps = effDmg * aps;
      const tpk = Math.max(1 / aps, mobHp / dps);
      const dt = Math.max(tpk, 0.5), k = dt / tpk;
      kills += k; total += dt;
      p.lumens += k * (mobHp * GOLD + LUM_FLOOR + p.level * GOLD_PER_LVL);
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      while (useConv && p.level >= p.gate) { p.convMult += CONV_PER; p.convs++; p.gate *= GATE_GROWTH; p.xpRun = 0; p.level = 1; }
      let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      const gate = s < N ? kills >= KILLGATE : (kills >= KILLGATE && dps >= mobHp / 13);
      if (gate) { broke = true; break; }
      if (total > 30 * 86400) break;
    }
    rows.push({ s, mobHp, mobAtk: mobHp * 0.02, hit: entryHit, aps: entryAps, crit: entryCrit, wl: p.wl, lvl: p.level });
    if (!broke) { rows.push({ walled: true }); break; }
  }
  return { total, rows, convs: p.convs, convMult: p.convMult, wl: p.wl, crit: Math.min(1, p.wl * CRIT_PER), aps: apsOf.call ? null : null };
}

const fmt = (n) => n >= 1e6 ? n.toExponential(2) : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toFixed(1);
const fmtT = (s) => s < 5400 ? `${(s / 60).toFixed(1)}min` : s < 1.3e5 ? `${(s / 3600).toFixed(2)}h` : `${(s / 86400).toFixed(1)}d`;

for (const useConv of [true, false]) {
  const r = sim({ useConv });
  console.log('='.repeat(78));
  console.log(`MAP 1 v2 — ${useConv ? 'COM Convergence' : 'SEM Convergence'} | total ${fmtT(r.total)} | convs ${r.convs} | gear wl ${r.wl} | crit fim ${(r.crit * 100).toFixed(1)}%`);
  console.log(' area |   mobHP  | mobATK |  hit@entry | APS  | crit% | wl  | lvl');
  for (const x of r.rows) {
    if (x.walled) { console.log('  >> WALL'); continue; }
    console.log(`   ${x.s}/${N} | ${fmt(x.mobHp).padStart(8)} | ${fmt(x.mobAtk).padStart(6)} | ${fmt(x.hit).padStart(10)} | ${x.aps.toFixed(2)} | ${(x.crit * 100).toFixed(1).padStart(5)} | ${String(x.wl).padStart(3)} | ${x.lvl}`);
  }
}
