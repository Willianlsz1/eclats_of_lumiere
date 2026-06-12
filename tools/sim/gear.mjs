// Camada 3 — GEAR. Calibra o multiplicador AGREGADO do Gear p/ ~10 décadas, NUNCA
// morre, com salto por mapa. Uso: node tools/sim/gear.mjs
//
// 🔧 CORREÇÃO DE AUDITORIA 2026-06-11 (orçamento por peça vs PRODUTO de peças):
//   gear_dano é o PRODUTO dos afixos de DANO, e no catálogo novo (§13) o Dano aparece
//   como PRIMÁRIO na arma (Edge) e SECUNDÁRIO em Grasp e Resonance. Logo as 10 décadas
//   são o TOTAL AGREGADO das 3 peças, não de 1 peça. Split: primário carrega o grosso,
//   secundário = 30% das décadas do primário (faixa de design 25-35%).
//
// Modelo (por afixo de dano):
//   linear (% flavor, toda raridade):  1 + L × pctRate × rarityMult[R]
//   expo   (× flavor, Luminous+):      multBase ^ L     ← MOTOR SEM-TETO

const RARITY = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const rarityMult = [1, 1.5, 2.25, 3.5, 5];     // §13 (código)
const baseCaps   = [25, 50, 100, 175, 300];    // teto de nível por raridade

// ── constantes a calibrar (PRIMÁRIO) ──
const pctRate   = 0.02;    // % por nível (× rarityMult)
const multBase  = 1.0039;  // × por nível (Luminous+) — ajustado p/ o AGREGADO bater ~10 déc
const multFromRarity = 2;  // idx da raridade que destrava o sabor × (Luminous)
const capPerAsc = 500;     // a Ascension soma isto ao teto de nível (sem-teto)

// SPLIT do orçamento entre afixos de dano (§13):
const secondaryWeight = 0.30;   // secundário (Grasp/Resonance) = 30% das décadas do primário
const N_SECONDARY = 2;          // Grasp + Resonance têm Dano como secundário

// décadas do afixo PRIMÁRIO (Edge) num nível/raridade
function primaryDec(L, rIdx) {
  const linear = 1 + L * pctRate * rarityMult[rIdx];
  const expo = rIdx >= multFromRarity ? multBase ** L : 1;
  return Math.log10(linear * expo);
}
// AGREGADO = primário + N×(secundário). Secundário = 30% das décadas do primário (peças multiplicam → décadas somam)
function aggregateDec(L, rIdx) {
  const p = primaryDec(L, rIdx);
  return p * (1 + N_SECONDARY * secondaryWeight);   // ×1.6
}

const f = (d) => d.toFixed(2);

console.log('JORNADA do gear_dano AGREGADO (Edge primário + Grasp/Resonance secundário 30%)\n');
console.log('marco                         | nível | déc PRIMÁRIO | déc AGREGADO');
console.log('-'.repeat(66));
for (let r = 0; r < 5; r++) {
  const L = baseCaps[r];
  console.log(`${RARITY[r].padEnd(12)} (cap base)       | ${String(L).padStart(5)} |     ${f(primaryDec(L, r)).padStart(6)}   |    ${f(aggregateDec(L, r)).padStart(6)}`);
}
console.log('-'.repeat(66));
for (let a = 1; a <= 5; a++) {
  const L = 300 + a * capPerAsc;
  console.log(`Converged pós-A${a}            | ${String(L).padStart(5)} |     ${f(primaryDec(L, 4)).padStart(6)}   |    ${f(aggregateDec(L, 4)).padStart(6)}`);
}
console.log('-'.repeat(66));
console.log('CHECK nunca-morre: AGREGADO sobe sempre (monotônico).');
console.log('ALVO do orçamento (§14B): AGREGADO ~10 décadas no endgame (Converged pós-A4).');
console.log(`SPLIT: primário ~${f(primaryDec(2300,4))} déc · cada secundário ~${f(secondaryWeight*primaryDec(2300,4))} déc × ${N_SECONDARY} = total ~${f(aggregateDec(2300,4))} déc.`);

// ── Veil (defesa) — alvo Camada 2: def ≈ 1-4× packDps ──
console.log('\nVEIL (defesa) — def = hp_max × veilFactor; alvo def/packDps ∈ [1,4]:');
for (const vf of [0.02, 0.045, 0.09, 0.18]) {
  const ratio = 22.5 * vf;
  console.log(`  veilFactor=${String(vf).padEnd(5)} → def ≈ ${ratio.toFixed(1)}× packDps (mit ${(ratio/(ratio+1)*100).toFixed(0)}%)`);
}
