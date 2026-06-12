// Camada 3 (abertura) — ORÇAMENTO DE PODER.
// Quantas décadas (potências de 10) de multiplicador o dano precisa crescer no
// jogo todo, e como distribuí-las entre os andares. Uso: node tools/sim/budget.mjs

import { COMBAT, MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// Para one-shotar o mob mais fundo (M5 sub5 representativo), o dano por hit
// precisa alcançar ~ HP desse mob. Décadas = log10(alvo / baseDmg).
const m5 = MAPS[4];
const deepLevel = Math.sqrt(subareaLevelRange(m5, 5).lo * subareaLevelRange(m5, 5).hi);
const deepHp = hpForLevel(m5, deepLevel);
const decadesNeeded = Math.log10(deepHp / COMBAT.baseDmg);

console.log(`Mob mais fundo (M5 sub5) HP ≈ ${deepHp.toExponential(2)}`);
console.log(`baseDmg = ${COMBAT.baseDmg}`);
console.log(`→ DÉCADAS de dano necessárias no jogo todo ≈ ${decadesNeeded.toFixed(1)}\n`);

// asc_mult conhecido: ×10 (A1) × ×5^4 (A2-5) = ×6250
// ✅ CALIBRADO (Bloco 1, 2026-06-12): asc_mult ×2/Ascension (×16) + Despertar ×5/tier (×625).
const ascDecades = Math.log10(2 ** 4);       // ×16 = 1.2 déc
const despertarDecades = Math.log10(5 ** 4); // ×625 = 2.8 déc

const budget = [
  ['Mémoires (Clarté, motor)',     70, 'engrenagem principal do late'],
  ['Gear',                         10, 'estável, nunca morre (× flavor)'],
  ['Passivas',                      8, 'mecânicas + poder'],
  ['Gold Stats',                    4, 'rodinhas do early (depois somem)'],
  ['Convergence',                   4, 'bola de neve composta'],
  ['Despertar',  +despertarDecades.toFixed(1), 'mudança de classe ×5/tier (×625)'],
  ['Ascension',  +ascDecades.toFixed(1), 'marco de mapa ×2 (×16)'],
  ['Level bonus',                 3.8, 'heroLevel CAPADO em 1e9 (§3) → satura ~3.8 déc constante'],
];

let total = 0;
console.log('ANDAR                         | décadas | papel');
console.log('-'.repeat(72));
for (const [name, dec, role] of budget) {
  total += Number(dec);
  console.log(`${name.padEnd(29)} | ${String(dec).padStart(7)} | ${role}`);
}
console.log('-'.repeat(72));
console.log(`${'TOTAL'.padEnd(29)} | ${total.toFixed(1).padStart(7)} | (alvo ≈ ${decadesNeeded.toFixed(0)})`);
console.log(`\nHP do jogador segue o MESMO orçamento (via vit/gear_hp/passive_hp/memoire_hp).`);
