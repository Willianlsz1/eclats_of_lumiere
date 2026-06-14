// Exploração SEM CAP — modelo Gaiadon (3 camadas lineares que multiplicam).
// Mostra até onde cada número vai conforme o nível sobe livre. Uso: node tools/sim/gearflow.mjs
//
// Modelo (por peça, por afixo de stat):
//   Primary (flat)  = level × primaryRate × rarityMult           → soma à base
//   Bonus%          = 1 + level × bonusRate   × rarityMult       → camada %
//   ×Multiplier     = 1 + level × multRate    × rarityMult       → camada ×
//   contribuição da peça ao DANO = (base + Primary) × Bonus% × Multiplier
// Total cresce ~ nível³ (polinomial), não exponencial.

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const RARMULT = [1, 1.5, 2.25, 3.5, 5];

// taxas-semente (estilo Gaiadon — a print: Primary +50/nv, Mult +0.01/nv, Mastery +0.006%/nv)
const primaryRate = 50;     // flat por nível
const multRate = 0.01;      // +0.01 ao ×Multiplier por nível
const bonusRate = 6e-5;     // +0.006% por nível (×Mastery)
const baseRef = 1007;       // base sem gear (baseDmg + nível-run ~100 × dmgPerLevel)

const fmt = (x) => (Math.abs(x) >= 1e5 || (x !== 0 && Math.abs(x) < 0.01) ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 2 }));

const levels = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];

for (const r of [0, 4]) { // Faded e Converged (extremos)
  const rm = RARMULT[r];
  console.log('\n' + '='.repeat(92));
  console.log(`${RAR[r]} (rarityMult ${rm}) — UMA peça de dano, sem cap. baseRef=${baseRef}`);
  console.log('='.repeat(92));
  console.log('nível      | Primary(flat) | Bonus%      | ×Multiplier | dano c/ peça | décadas');
  console.log('-'.repeat(92));
  for (const L of levels) {
    const primary = L * primaryRate * rm;
    const bonus = 1 + L * bonusRate * rm;     // ex.: ×1140 = +114k%
    const mult = 1 + L * multRate * rm;       // ex.: ×191k
    const dmg = (baseRef + primary) * bonus * mult;
    const dec = Math.log10(dmg / baseRef);
    console.log(
      `${L.toExponential(0).padStart(9)} | ${fmt(primary).padStart(13)} | ${fmt(bonus).padStart(11)} | ${fmt(mult).padStart(11)} | ${dmg.toExponential(2).padStart(12)} | ${dec.toFixed(1).padStart(6)}`
    );
  }
}
console.log('\nLEITURA: veja em que NÍVEL cada raridade chega na fatia de ~13 décadas do gear.');
console.log('Isso vira o "alcance natural" de níveis por raridade (sem cravar cap antes).');
