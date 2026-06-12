// Decomposição do dano endgame por ANDAR vs budget. Uso: node tools/sim/decompose.mjs
import { createInitialState } from '../../src/core/state.js';
import { COMBAT, PASSIVES, GOLD_STATS } from '../../src/data/constants.js';
import { strTotal, levelBonus, convFactor, damagePerHit } from '../../src/game/stats.js';
import { gearDamageMult } from '../../src/game/gear.js';
import { passiveDmgMult } from '../../src/game/passives.js';
import { memoireDmgMult, clarte } from '../../src/game/memoires.js';
import { ascMult, despertarMult } from '../../src/game/ascension.js';

const d = (x) => Math.log10(x);

// estado MAXADO (o que gerou as 121 déc) e um BALANCEADO (investimento "apropriado" ~budget)
function build(maxed) {
  const s = createInitialState();
  s.ascensions = 4; s.despertares = 4; s.convergences = 1;
  s.convPoints = maxed ? 200 : 50;                       // budget assume ~50 pico/era
  s.xpTotal = maxed ? 1e30 : 1e30;                       // level_bonus realista (não 0)
  for (const k of Object.keys(s.stats)) s.stats[k] = maxed ? 3200 : 800;
  for (const k of Object.keys(s.gear)) s.gear[k] = { level: maxed ? 2300 : 2300, rarity: 4 };
  for (const t of Object.keys(PASSIVES.trees)) s.passives[t] = Array(15).fill(12);
  s.memoires = s.memoires.map(() => 159);
  return s;
}

function rows(s) {
  const clt = d(clarte(s));
  const memTot = d(memoireDmgMult(s));
  return [
    ['baseDmg (×7)',        d(COMBAT.baseDmg),    '—'],
    ['Gold Stats (str)',    d(strTotal(s)),       4],
    ['Level bonus',         d(levelBonus(s.xpTotal)), 1],
    ['Convergence',         d(convFactor(s)),     4],
    ['Gear (dano)',         d(gearDamageMult(s)), 10],
    ['Passivas (Éclat)',    d(passiveDmgMult(s)), 8],
    ['Mémoires — Clarté',   clt,                  70],
    ['Mémoires — indiv. #1+#10', memTot - clt,    0],
    ['Ascension (×16)',     d(ascMult(s)),        1.2],
    ['Despertar (×625)',    d(despertarMult(s)),  2.8],
  ];
}

for (const [tag, maxed] of [['MAXADO (121 déc)', true], ['BALANCEADO (stats 800, conv 50)', false]]) {
  const s = build(maxed);
  console.log(`\n=== ${tag} ===  dano total = ${d(damagePerHit(s)).toFixed(1)} déc`);
  console.log('andar                        | medido | budget | extra');
  console.log('-'.repeat(58));
  let tot = 0, bud = 0;
  for (const [name, meas, b] of rows(s)) {
    tot += meas; if (typeof b === 'number') bud += b;
    const extra = typeof b === 'number' ? (meas - b).toFixed(1) : '—';
    console.log(`${name.padEnd(28)} | ${meas.toFixed(1).padStart(6)} | ${String(b).padStart(6)} | ${String(extra).padStart(5)}`);
  }
  console.log('-'.repeat(58));
  console.log(`${'TOTAL'.padEnd(28)} | ${tot.toFixed(1).padStart(6)} | ${(bud+0.85).toFixed(1).padStart(6)} | ${(tot-bud-0.85).toFixed(1).padStart(5)}`);
}
