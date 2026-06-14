// PACING DO MAP 1 (isolado) — 2026-06-14. Config ESCOLHIDA pelo Willian:
//   Base(Nível) × Gear(2 afixos, Faded) × Convergence(0) · APS REAL 0.90
//   custo arma = 5×(L+1)×1.006^L (geométrico) · HP do mob até 1e9 (climb visceral)
// Sem Despertar/Ascension/Mémoires/Passivas. ENTRADA = jogador novo. SAÍDA = boss Sub-5.
// "hits/mob" mostra o climb: >1 = mob aguenta vários golpes (você sente "preciso upar").
// Uso: node tools/sim/map1.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;

// ── parâmetros do Map 1 (a config aprovada) ──
const N = 5, hpLo = 10, hpHi = 1e9;
// HP 1e9 exige ~40k níveis de arma → custo LINEAR (ramp geométrico deadlocka aqui).
const FLAT = 50, PCT = 0.02, COST_BASE = 160, COST_RAMP = 1, KILLGATE = 100;
const GATE_DIV = 13; // avança quando o boss cai em ~bossHp/GATE_DIV → frontier ~5 hits (hits≈0.38×GATE_DIV)

const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * FLAT) * (1 + p.wl * PCT);
const dps = () => dmgHit() * APS;
const cost = () => COST_BASE * (p.wl + 1) * COST_RAMP ** p.wl;
const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : `${(s/3600).toFixed(2)}h`;

console.log('='.repeat(100));
console.log(`MAP 1 — config: custo ${COST_BASE}×(L+1)${COST_RAMP !== 1 ? `×${COST_RAMP}^L` : ' linear'} · HP até ${hpHi.toExponential(0)} · APS ${APS} · ${N} subs`);
console.log('='.repeat(100));
console.log(' sub | mob HP    | boss HP   | hits/mob entrada | tempo sub | arma lvl | nível | DPS');
console.log('-'.repeat(100));

let total = 0;
for (let s = 1; s <= N; s++) {
  const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
  const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
  const hitsEntry = Math.max(1, mobHp / dmgHit()); // quantos golpes p/ matar AO ENTRAR na sub
  let kills = 0, subTime = 0, guard = 0;
  while (guard++ < 5e6) {
    const tpk = Math.max(1 / APS, mobHp / dps());
    const dt = Math.max(tpk, 0.5);
    const k = dt / tpk;
    kills += k; subTime += dt; total += dt;
    p.lumens += k * mobHp * GOLD;
    p.xpRun += k * mobHp * XP;
    p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
    let b = 0;
    while (p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
    if (kills >= KILLGATE && dps() >= bossHp / GATE_DIV) break;
    if (subTime > 50 * 86400) break;
  }
  console.log(
    `  ${s}  | ${mobHp.toExponential(1).padStart(8)} | ${bossHp.toExponential(1).padStart(8)} | ${hitsEntry.toFixed(1).padStart(16)} | ${fmtT(subTime).padStart(9)} | ${p.wl.toExponential(2).padStart(8)} | ${p.level.toString().padStart(5)} | ${dps().toExponential(2)}`
  );
}
console.log('-'.repeat(100));
console.log(`TEMPO TOTAL Map 1 (1ª limpa, só na arma): ${fmtT(total)}`);
console.log(`SAÍDA → entrada M2: arma lvl ${p.wl.toExponential(2)} · nível ${p.level} · DPS ${dps().toExponential(2)}`);
console.log('\nhits/mob entrada >1 = você NÃO one-shota ao chegar na sub → precisa upar (climb visceral).');
