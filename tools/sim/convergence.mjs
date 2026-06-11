// Camada 7 — CONVERGENCE (prestige ANINHADO) + DIFICULDADES.
// A Ascension ZERA os pontos de Convergence mas AMPLIFICA a base composta (§8).
// Logo conv_factor = base(ascensions)^convPoints, e o orçamento ~4 décadas é o
// PICO da era final. Uso: node tools/sim/convergence.mjs

const dec = (x) => Math.log10(x).toFixed(2);
const PEAK_POINTS = 50;            // pontos de pico numa era (entre 2 Ascensions)
// base sobe por Ascension: base = 1 + b0 × growth^asc  (o "amplifica a Convergence")
const b0 = 0.04, growth = 1.38;
const baseFor = (asc) => 1 + b0 * growth ** asc;

console.log('CONVERGENCE (aninhada) — conv_factor = base(asc)^pontos. Reset por Ascension.\n');
console.log(' era (após A) | base composta | pico conv_factor | décadas (pico)');
console.log(' ' + '-'.repeat(62));
for (let asc = 0; asc <= 5; asc++) {
  const base = baseFor(asc);
  const peak = base ** PEAK_POINTS;
  console.log(`   A${asc}          | ${base.toFixed(3).padStart(9)}     | ${('×'+peak.toExponential(1)).padStart(11)}      | ${dec(peak).padStart(6)}`);
}
console.log(`\nb0=${b0}, growth=${growth}/Ascension, pico ~${PEAK_POINTS} pontos/era.`);
console.log('→ Era inicial ~0.85 déc (snowball modesto); era FINAL ~4 décadas (orçamento). ✅');
console.log('Cada Ascension: pontos→0 mas base sobe → "perde os multiplicadores, mas agora são maiores".');

console.log('\nDIFICULDADES (re-roda mapas; A2 abre; escolha por sub-área):');
console.log(' tier      | ×HP/×dano | ×recompensa | teto');
console.log(' ' + '-'.repeat(58));
for (const [t, hp, rw, c] of [
  ['Normal','×1','×1','1e100 (base)'],
  ['Difícil','×1e5','×3','dentro de 1e100'],
  ['Nightmare','×1e15','×10','⚠️ break_infinity (futuro)'],
  ['Tormento','×1e30','×30','⚠️ break_infinity (futuro)'],
]) console.log(`  ${t.padEnd(9)} | ${hp.padEnd(9)} | ${rw.padEnd(11)} | ${c}`);
