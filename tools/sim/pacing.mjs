// SIMULADOR DE PACING end-to-end (2026-06-14) — o que faltava (ver playtime.mjs).
// Mapeia nossas fórmulas no MODELO DE COLUNAS do Gaiadon (as 3 prints do Willian):
//
//   STAT = Primary(Σflat) × (1+Bonus%) × Multiplier(Σ×) × (1+Mastery%)
//
//   Coluna      | fonte no Éclats                                   | papel
//   ------------|--------------------------------------------------|---------------------
//   Primary     | baseDmg + Nível×dmgPerLevel + GEAR flat (afixo 1) | base que sobe linear
//   Bonus%      | GEAR %dano (afixo 2)                              | 1ª camada % (gear)
//   Multiplier  | Convergence × Ascension × Despertar              | meta-mult por mapa
//   Mastery%    | Passivas + Mémoires (Clarté)                      | motor profundo (late)
//
// GEAR NOVO (decisão Willian 14/jun): tier 1 = 2 AFIXOS por peça (flat + %),
// SEM a 3ª camada ×Multiplier (era cópia do Gaiadon). Raridade = mapa.
//
// O sim roda a ESPIRAL econômica real: matar → renda → comprar gear → mais dano →
// avançar sub-área. Mede TEMPO POR MAPA. Uso: node tools/sim/pacing.mjs

import { MAPS, COMBAT, ECONOMY, LEVEL } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// ───────── SEMENTES AJUSTÁVEIS (é isto que a gente varre) ─────────
const SEED = {
  // GEAR — 2 afixos por peça de dano (a arma): flat + %
  flatDmgPerLevel: 50,    // afixo 1 (Primary): +flat dano por nível da arma
  pctDmgPerLevel:  0.02,  // afixo 2 (Bonus%): +2%/nível da arma (fração)
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  costBase: 5,
  // ✅ ACHADO DO SIM: o custo precisa deixar a arma CHEGAR aos ~1e15 níveis que o late
  // exige. Com renda ~1e43/s no M5, costMult[4]~1e16 (não 1e39, que CONGELAVA tudo).
  costMult: [1, 1e4, 1e8, 1e12, 1e16],
  // META-MULT (coluna Multiplier) que o jogador CARREGA ao chegar em cada mapa.
  // Conv (~run) × Asc (×2/asc) × Despertar (×5/tier). ~1.5 década/mapa no late.
  metaMult: [1, 30, 300, 3000, 3e6],     // índice = mapa-1
  // MASTERY% (Passivas+Mémoires) por mapa. Back-loaded: Mémoires (18 déc) são late.
  masteryPct: [0, 2, 200, 5e4, 1e9],     // (1+x): ~0…9 décadas no M5
};

// ───────── modelo de poder (colunas) ─────────
function dpsOf(p, mapIdx) {
  const rm = SEED.rarityMult[p.rarity];
  const primary = COMBAT.baseDmg + p.level * LEVEL.dmgPerLevel + p.wlevel * SEED.flatDmgPerLevel * rm;
  const bonus = 1 + p.wlevel * SEED.pctDmgPerLevel * rm;
  const mult = SEED.metaMult[mapIdx];
  const mastery = 1 + SEED.masteryPct[mapIdx];
  const dmgHit = primary * bonus * mult * mastery;
  return dmgHit * COMBAT.apsCap; // crit≈1; APS no teto quando one-shota
}
const weaponCost = (p) => SEED.costBase * (p.wlevel + 1) * SEED.costMult[p.rarity];

const geomean = (lo, hi) => Math.sqrt(lo * hi);
const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(1)}h` : `${(s/86400).toFixed(1)}d`;

// ───────── espiral econômica por mapa ─────────
function runMap(p, mapIdx) {
  const map = MAPS[mapIdx];
  p.rarity = mapIdx; // raridade = mapa (Faded→Converged)
  let mapTime = 0;
  const subTimes = [];
  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const mobHp = hpForLevel(map, geomean(lo, hi));
    const bossHp = hpForLevel(map, Math.round(hi)) * COMBAT.bossHpMult;
    let kills = 0, subTime = 0;
    const need = map.bossKillThreshold;
    let guard = 0;
    while (guard++ < 1e7) {
      const dps = dpsOf(p, mapIdx);
      // tempo por kill: teto de APS OU limitado pelo dano (single-target)
      const tpk = Math.max(1 / COMBAT.apsCap, mobHp / dps);
      // passo adaptativo: avança ~1 compra de cada vez
      const dt = Math.max(tpk, 1);
      const k = dt / tpk;
      kills += k; subTime += dt; mapTime += dt;
      // renda (escala com HP do mob): lumens + xp
      p.lumens += k * mobHp * ECONOMY.goldRatio;
      p.xpRun += k * mobHp * ECONOMY.xpRatio;
      p.level = Math.max(1, Math.floor((p.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
      // gasta lumens na ARMA (driver de dano), 1 nível por vez enquanto puder
      let buys = 0;
      while (p.lumens >= weaponCost(p) && buys++ < 5000) { p.lumens -= weaponCost(p); p.wlevel++; }
      // gate de avanço: matou o suficiente E o boss cai em ≤10s
      if (kills >= need && dpsOf(p, mapIdx) >= bossHp / 10) break;
      if (subTime > 30 * 86400) break; // trava de segurança (30d)
    }
    subTimes.push(subTime);
  }
  return { mapTime, subTimes, p };
}

// ───────── playthrough completo ─────────
console.log('='.repeat(92));
console.log('PACING end-to-end — gear NOVO (2 afixos: flat + %) · modelo de colunas (Gaiadon-mapeado)');
console.log('='.repeat(92));
console.log(`SEED: flat=${SEED.flatDmgPerLevel}/nv · pct=${(SEED.pctDmgPerLevel*100)}%/nv · metaMult=[${SEED.metaMult}] · mastery=[${SEED.masteryPct}]`);
console.log('-'.repeat(92));
console.log('mapa | raridade   | HP mobs            | tempo do mapa | arma lvl fim | nível fim | décadas dano');
console.log('-'.repeat(92));

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const p = { lumens: 0, xpRun: 0, level: 1, wlevel: 0, rarity: 0 };
let totalTime = 0;
for (let m = 0; m < 5; m++) {
  const map = MAPS[m];
  const before = dpsOf(p, m) / COMBAT.apsCap;
  const r = runMap(p, m);
  totalTime += r.mapTime;
  const decadesDmg = Math.log10((dpsOf(p, m) / COMBAT.apsCap) / COMBAT.baseDmg);
  console.log(
    `  ${map.id}  | ${RAR[m].padEnd(10)} | ${map.hpLo.toExponential(0)}–${map.hpHi.toExponential(0)} | ${fmtT(r.mapTime).padStart(13)} | ${p.wlevel.toExponential(2).padStart(12)} | ${p.level.toExponential(2).padStart(9)} | ${decadesDmg.toFixed(1).padStart(12)}`
  );
}
console.log('-'.repeat(92));
console.log(`TEMPO TOTAL (5 mapas, ativo): ${fmtT(totalTime)}  (${(totalTime/3600).toFixed(1)}h)`);
console.log('\nLEITURA: começo (M1) pode ser lento; M2+ deve acelerar. Nada de mapa em segundos');
console.log('(rápido demais) nem em dias (lento demais). Varrer SEED.* pra achar o ritmo.');
