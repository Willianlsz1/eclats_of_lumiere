// MAP 1 — pacing do GATE POR NÍVEL (sem guardião). Farma a maior área liberada,
// sobe de nível, libera as 9 (área n exige level = lvlLo×r^(n-1)), e bate o boss.
// Tuna curveDiv pra bater ~8h. Uso: node tools/sim/map1_pace.mjs
const BASE = 3500, DMG_PER_LVL = 5000, GOLD = 0.10, XP = 0.08, EXP = 0.4, GOLD_PER_LVL = 1500, LUM_FLOOR = 30000;
const N = 9, hpLo = 5000, hpHi = 5e8, BOSSMULT = 15, lvlLo = 1, lvlHi = 1000, KILLGATE = 100;
const CAP = 1000, COSTBASE = 700000, APS0 = 0.90, APS_FLAT = 2e-4, CRIT_PER = 3e-4, DMG_FLAT = 30000, PCT = 0.02, APSCAP = 5;
const R = (lvlHi / lvlLo) ** (1 / N);
const unlockLvl = (n) => n <= 1 ? 0 : Math.round(lvlLo * R ** (n - 1)); // = subareaLevelRange(.lo)
const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
const bossHp = () => hpLo * (hpHi / hpLo) ** 1 * BOSSMULT;

function pace(DIV, COSTX = 1) {
  const p = { xpRun: 0, level: 1, wl: 0, lumens: 0, unlocked: 1, t: 0, kills9: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * DMG_FLAT) * (1 + Math.min(p.wl, CAP) * PCT);
  const aps = () => Math.min(APSCAP, (APS0 + Math.min(p.wl, CAP) * APS_FLAT) * (1 + 0.3 * Math.log10(1 + Math.min(p.wl, CAP) * PCT)));
  const crit = () => Math.min(1, Math.min(p.wl, CAP) * CRIT_PER);
  const cost = () => COSTBASE * COSTX * (p.wl + 1);
  let guard = 0;
  while (guard++ < 5e7) {
    const area = p.unlocked;
    const onBoss = area === N && p.kills9 >= KILLGATE;
    const mobHp = onBoss ? bossHp() : mobHpOf(area);
    const dps = dmgHit() * aps() * (1 + crit());
    const tpk = Math.max(1 / aps(), mobHp / dps);
    const dt = Math.max(tpk, 0.5), k = dt / tpk;
    p.t += dt;
    p.lumens += k * (mobHpOf(area) * GOLD + LUM_FLOOR + p.level * GOLD_PER_LVL);
    p.xpRun += k * mobHpOf(area) * XP;
    p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
    if (area === N) p.kills9 += k;
    while (p.unlocked < N && p.level >= unlockLvl(p.unlocked + 1)) p.unlocked++;
    let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 20000) { p.lumens -= cost(); p.wl++; }
    if (onBoss && dps >= bossHp() / 13) break; // boss derrotável → Map 1 limpo
    if (p.t > 60 * 86400) break;
  }
  return { t: p.t, lvl: p.level, wl: p.wl, unlocked: p.unlocked };
}

const fmtT = (s) => s < 5400 ? `${(s / 60).toFixed(1)}min` : `${(s / 3600).toFixed(2)}h`;
console.log('unlock levels:', Array.from({ length: N }, (_, i) => unlockLvl(i + 1)).join(' '));
console.log('curveDiv | cost× | tempo Map1 | level fim | gear wl');
for (const COSTX of [0.6, 0.75]) {
  for (const DIV of [11000, 13000, 15000, 18000, 22000, 26000]) {
    const r = pace(DIV, COSTX);
    console.log(`${String(DIV).padStart(8)} | ${String(COSTX).padStart(4)} | ${fmtT(r.t).padStart(10)} | ${String(r.lvl).padStart(8)} | ${r.wl}`);
  }
}
