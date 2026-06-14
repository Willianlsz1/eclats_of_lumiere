// Verificação CP-3 — Nível (stat base) + Convergence nova. Importa as funções REAIS.
// Uso: node tools/sim/cp3.mjs
import { runLevel, convMult, damagePerHit, playerHpMax } from '../../src/game/stats.js';
import { convGateLevel, canConverge, doConverge } from '../../src/game/convergence.js';

const mockState = (over = {}) => ({
  xpRun: 0, xpTotal: 0, convergences: 0, ascensions: 0, despertares: 0,
  gear: { edge: { level: 5, rarity: 2 }, vigil: { level: 3, rarity: 1 }, veil: { level: 0, rarity: 0 },
    grasp: { level: 0, rarity: 0 }, reson: { level: 0, rarity: 0 }, band: { level: 0, rarity: 0 } },
  passives: { eclat: Array(15).fill(0), vestige: Array(15).fill(0), fracture: Array(15).fill(0) },
  memoires: Array(15).fill(0), materiais: [0, 0, 0, 0],
  player: { hp: 100, dead: false, respawnTimer: 0, attackTimer: 0 },
  map: 1, subarea: 3, unlockedSubarea: 3, bossDefeated: [true, true, false, false, false],
  killsInSubarea: 0, enemies: [], wave: 1, fx: [], difficulty: 0, auto: {}, lumens: 1000, vestiges: 50,
  ...over,
});

console.log('='.repeat(70));
console.log('CP-3 — verificação do modelo (Nível flat + Convergence aditiva)');
console.log('='.repeat(70));

console.log('\nGate de nível por Convergence (0..5):', [0, 1, 2, 3, 4, 5].map(convGateLevel));
console.log('convMult por nº de convergences (0..5):', [0, 1, 2, 3, 4, 5].map((c) => convMult({ convergences: c })));

console.log('\nNível e dano por xpRun (sem gear/passivas):');
for (const xp of [0, 1e3, 1e5, 1e7]) {
  const s = mockState({ xpRun: xp });
  console.log(`  xpRun ${xp.toExponential(0).padStart(8)} → nível ${String(runLevel(s)).padStart(6)} · dano ${damagePerHit(s).toExponential(2)}`);
}

console.log('\nConverge (nível alto o bastante):');
const s = mockState({ xpRun: 1e7, convergences: 0 });
console.log(`  antes: nível ${runLevel(s)} · gate ${convGateLevel(0)} · canConverge ${canConverge(s)} · convMult ${convMult(s)} · gear.edge`, s.gear.edge);
doConverge(s);
console.log(`  depois: convergences ${s.convergences} · xpRun ${s.xpRun} · convMult ${convMult(s)} · gear.edge`, s.gear.edge, '(raridade preservada?)');
console.log(`  mapa intacto? map=${s.map} subarea=${s.subarea} lumens=${s.lumens} (NÃO resetaram)`);
console.log('='.repeat(70));
