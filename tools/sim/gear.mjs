// Camada 3 — GEAR. Calibra o multiplicador do Gear p/ ~10 décadas, NUNCA morre,
// com salto por mapa, via o modelo multi-flavor. Uso: node tools/sim/gear.mjs
//
// Modelo (por afixo de dano, simplificado p/ a curva total gear_dano):
//   linear (% flavor, toda raridade):  1 + L × pctRate × rarityMult[R]
//   expo   (× flavor, Luminous+):      multBase ^ L     ← MOTOR SEM-TETO
// gear_dano = linear × expo. Sobe sempre porque a Ascension levanta o teto de L.

const RARITY = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const rarityMult = [1, 1.5, 2.25, 3.5, 5];     // §13 (código)
const baseCaps   = [25, 50, 100, 175, 300];    // teto de nível por raridade

// ── constantes a calibrar ──
const pctRate   = 0.02;   // % por nível (× rarityMult)
const multBase  = 1.008;  // × por nível (só Luminous+) — o motor sem-teto
const multFromRarity = 2; // idx da raridade que destrava o sabor × (Luminous)
const capPerAsc = 500;    // a Ascension soma isto ao teto de nível (sem-teto)

function gearDano(L, rIdx) {
  const linear = 1 + L * pctRate * rarityMult[rIdx];
  const expo = rIdx >= multFromRarity ? multBase ** L : 1;
  return linear * expo;
}

const dec = (x) => Math.log10(x).toFixed(2);

console.log('JORNADA do gear_dano (1 peça de dano) — décadas = log10(mult)\n');
console.log('marco                         | nível |  gear_dano  | décadas');
console.log('-'.repeat(64));
// dentro do 1º ciclo: maximizar cada raridade
for (let r = 0; r < 5; r++) {
  const L = baseCaps[r];
  const g = gearDano(L, r);
  console.log(`${RARITY[r].padEnd(12)} (cap base)       | ${String(L).padStart(5)} | ${g.toExponential(2).padStart(10)} | ${dec(g)}`);
}
// pós-Ascension: Converged com teto subindo (sem-teto)
console.log('-'.repeat(64));
for (let a = 1; a <= 5; a++) {
  const L = 300 + a * capPerAsc;
  const g = gearDano(L, 4);
  console.log(`Converged pós-A${a}            | ${String(L).padStart(5)} | ${g.toExponential(2).padStart(10)} | ${dec(g)}`);
}
console.log('-'.repeat(64));
console.log('CHECK nunca-morre: a coluna décadas tem que SUBIR sempre (monotônica).');
console.log(`ALVO do orçamento: ~10 décadas perto do endgame (Converged pós-A4).`);

// ── Veil (defesa) — alvo Camada 2: def ≈ 1-4× packDps ──
// Modelo: def = hp_max × veilFactor.  packDps(sub5) ≈ 0.24 × mobHp.  hp_max ≈ 5.4 × mobHp.
//   def/packDps = 5.4 × veilFactor / 0.24 = 22.5 × veilFactor.
console.log('\nVEIL (defesa) — def = hp_max × veilFactor; alvo def/packDps ∈ [1,4]:');
for (const vf of [0.02, 0.045, 0.09, 0.18]) {
  const ratio = 22.5 * vf;
  console.log(`  veilFactor=${String(vf).padEnd(5)} → def ≈ ${ratio.toFixed(1)}× packDps (mit ${(ratio/(ratio+1)*100).toFixed(0)}%)`);
}
