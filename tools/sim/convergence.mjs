// Camada 7 — CONVERGENCE (revisada) + DIFICULDADES. Orçamento Convergence = ~4 décadas.
// Suspeita: conv_factor aditivo (1+0.15×pts) não chega lá. Uso: node tools/sim/convergence.mjs

const dec = (x) => Math.log10(x).toFixed(2);
const LIFE_CONVERGENCES = 81;     // §14B (soft)
const ptsPerConv = 3;             // pontos médios por Convergence (f(xp_run) diminishing + bônus boss)
const totalPts = LIFE_CONVERGENCES * ptsPerConv;

console.log('CONVERGENCE — conv_factor (multiplica dano E HP). Orçamento ~4 décadas.\n');
console.log(`Pontos na vida ≈ ${LIFE_CONVERGENCES} convergências × ${ptsPerConv} = ${totalPts} pontos\n`);

console.log('modelo                         | conv_factor | décadas | veredito');
console.log('-'.repeat(66));
// ADITIVO (atual): 1 + 0.15 × pts
const add = 1 + 0.15 * totalPts;
console.log(`ADITIVO 1+0.15×pts (atual)     | ${('×'+add.toFixed(0)).padStart(11)} | ${dec(add).padStart(7)} | ${dec(add) < 3 ? 'MORRE (não chega a 4)' : 'ok'}`);
// COMPOSTO: base^pts
for (const base of [1.03, 1.04, 1.05]) {
  const f = base ** totalPts;
  console.log(`COMPOSTO ${base}^pts             | ${('×'+f.toExponential(1)).padStart(11)} | ${dec(f).padStart(7)} | ${Math.abs(dec(f)-4) < 1 ? '✅ ~4 décadas' : ''}`);
}

console.log('\nDIFICULDADES (re-roda mapas limpos; insp. Gaiadon/Grand Chase):');
console.log(' tier      | ×HP e ×dano dos mobs | ×recompensa (mat/Éclats) | teto alcançável');
console.log(' '.repeat(1) + '-'.repeat(70));
const diffs = [
  ['Normal',    '×1',    '×1',  'até 1e100 (base)'],
  ['Difícil',   '×1e5',  '×3',  'estende dentro de 1e100'],
  ['Nightmare', '×1e15', '×10', '⚠️ passa de 1e100 → break_infinity (CP futuro)'],
  ['Tormento',  '×1e30', '×30', '⚠️ break_infinity (CP futuro)'],
];
for (const [t, hp, rw, ceil] of diffs)
  console.log(`  ${t.padEnd(9)} | ${hp.padEnd(20)} | ${rw.padEnd(24)} | ${ceil}`);
console.log('\nNota: a renda já sobe naturalmente com o ×HP; o ×recompensa é BÔNUS por cima.');
console.log('Escolha por sub-área (A2 abre o sistema). Tiers altos = território break_infinity.');
