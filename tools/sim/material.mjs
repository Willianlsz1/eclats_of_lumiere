// Camada 4 — CRAFT/MATERIAIS. Calibra custos/drops p/ o ritmo "~1 raridade por
// mapa" (Faded→Converged ao longo dos Maps 1-4). Uso: node tools/sim/material.mjs
//
// Materiais TIERED por raridade (§13B): T1 paga Faded→Kindled ... T4 paga Radiant→Converged.
// T1 cai de MOB; T2-4 só de BOSS (Guardião + boss final). Dificuldade multiplica.

const PIECES = 6;

// custo de material p/ subir 1 peça (por tier que paga o salto)
const upgradeCost = { T1: 20, T2: 50, T3: 120, T4: 300 };   // ~×2.5 geométrico

// drops por kill (do conteúdo do tier certo)
const dropMob     = 2;    // T1 por mob comum
const dropGuardian = 8;   // material do tier (médio) por Guardião de sub-área
const dropBoss    = 25;   // material (alto) por boss final + chance do próximo

const refino = 12;        // 12 de tier baixo → 1 de tier alto
const diffMult = { Normal: 1, Difícil: 3, Nightmare: 10, Tormento: 30 };

console.log('CUSTO p/ levar TODAS as 6 peças a uma raridade (Normal):\n');
console.log('salto (tier)              | total materiais | fonte    | kills p/ todas as 6');
console.log('-'.repeat(76));
const rows = [
  ['Faded→Kindled (T1)',  'T1', dropMob,      'mob comum'],
  ['Kindled→Luminous(T2)','T2', dropGuardian, 'Guardião'],
  ['Luminous→Radiant(T3)','T3', dropGuardian, 'Guardião'],
  ['Radiant→Converged(T4)','T4', dropBoss,    'boss final'],
];
for (const [label, tier, perKill, src] of rows) {
  const total = PIECES * upgradeCost[tier];
  const kills = Math.ceil(total / perKill);
  console.log(`${label.padEnd(25)} | ${String(total).padStart(15)} | ${src.padEnd(8)} | ${kills} kills de ${src}`);
}

console.log('\nRITMO esperado (1 raridade ≈ 1 mapa de farm):');
console.log('  T1: ~60 mob kills  → trivial (Map 1 sub 1-2)');
console.log('  T2/T3: ~38 Guardião kills cada → ~1 mapa cada (Map 1→2, 2→3)');
console.log('  T4: ~72 boss-final kills → Map 3-4 (Converged no late-mid)');

console.log(`\nRefino: ${refino} de Tn → 1 de Tn+1 (dá uso ao excedente de T1 do farm de mob).`);
console.log('Dificuldade (multiplica o YIELD e libera tier alto em mapa antigo):');
for (const [k, v] of Object.entries(diffMult)) console.log(`  ${k.padEnd(9)} ×${v}`);
