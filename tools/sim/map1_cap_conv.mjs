// MAP 1 — testar: (a) ~5 hits/mob, (b) cap de nível por raridade (700, estilo Gaiadon)
// vs SEM cap, (c) como o Convergence (+15% aditivo) entra. Uso: node tools/sim/map1_cap_conv.mjs
//
// Estrutura nossa: raridade FIXA (Faded) o Map 1 inteiro — diferente do Gaiadon, que sobe
// raridade dentro da progressão (por isso o cap 700 funciona lá: você rarity-up e segue).

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e9;
const FLAT = 50, PCT = 0.02, COST_BASE = 120, KILLGATE = 100, GATE_DIV = 6; // boss em 6s → frontier ~5 hits

// roda o Map 1 com um cap de nível de arma (Infinity = sem cap) e convMult fixo
function run(cap, convMult) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, cap) * FLAT)
    * (1 + Math.min(p.wl, cap) * PCT) * convMult;
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
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.wl < cap && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dps >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 20 * 86400) { walled = true; break; } // 20d sem limpar = PAREDE
    }
    rows.push({ s, mobHp, hitsEntry, subTime, wl: Math.min(p.wl, cap), level: p.level, cleared: broke });
    if (!broke) break;
  }
  return { rows, total, walled, finalWl: p.wl };
}

const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

function report(title, r) {
  console.log(`\n### ${title}`);
  console.log(' sub | mob HP   | hits/mob | tempo sub  | arma lvl | nível    | limpou?');
  console.log(' ' + '-'.repeat(70));
  for (const x of r.rows) {
    console.log(` ${x.s}   | ${x.mobHp.toExponential(1)} | ${x.hitsEntry.toFixed(1).padStart(8)} | ${fmtT(x.subTime).padStart(10)} | ${x.wl.toExponential(2).padStart(8)} | ${x.level.toString().padStart(8)} | ${x.cleared ? 'sim' : 'NÃO (parede)'}`);
  }
  console.log(` TOTAL: ${r.walled ? 'NÃO LIMPA (parede)' : fmtT(r.total)}`);
}

console.log('='.repeat(74));
console.log('MAP 1 — ~5 hits/mob · SEM cap vs COM cap 700 · convMult variando');
console.log('='.repeat(74));

report('SEM cap · conv 0 (×1)', run(Infinity, 1));
report('COM cap 700 · conv 0 (×1)', run(700, 1));
report('COM cap 700 · 10 convergências (×2.5)', run(700, 1 + 0.15 * 10));
report('COM cap 700 · 100 convergências (×16)', run(700, 1 + 0.15 * 100));

console.log('\n' + '='.repeat(74));
console.log('CONVERGENCE — quanto +15% aditivo realmente move (e o custo: reseta gear+nível)');
console.log('='.repeat(74));
for (const c of [1, 5, 10, 50, 100, 1000]) {
  const m = 1 + 0.15 * c;
  console.log(`  ${String(c).padStart(4)} convergências → convMult ×${m.toFixed(2)}  (= ${Math.log10(m).toFixed(2)} décadas)`);
}
