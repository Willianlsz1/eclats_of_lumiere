// FRAMEWORK do orçamento de poder (redesign 2026-06-14).
// Quantas décadas o dano cresce no Jogo base (Normal) e como distribuí-las entre os
// sistemas NOVOS. O alvo do Normal é ~1e45 (dificuldades estendem até ~1e308 por cima).
// Os números do split são o NORTE; o lock-in por sistema acontece nos CPs 5-10 + CP-12.
// Uso: node tools/sim/budget.mjs

import { COMBAT, MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// Mob mais fundo do Normal = sub-área mais funda do Map 5 (boss = ×bossHpMult).
const m5 = MAPS[4];
const deepLevel = Math.round(subareaLevelRange(m5, m5.subareaCount).hi);
const deepHp = hpForLevel(m5, deepLevel) * COMBAT.bossHpMult;
const decadesNeeded = Math.log10(deepHp / COMBAT.baseDmg);

console.log(`Boss final do Normal (M5) HP ≈ ${deepHp.toExponential(2)}`);
console.log(`baseDmg = ${COMBAT.baseDmg}`);
console.log(`→ DÉCADAS de dano no Jogo base (Normal) ≈ ${decadesNeeded.toFixed(1)}\n`);
console.log('Dificuldades (endgame) multiplicam por cima: ~1e70 → ~1e190 → ~1e280 (float ~1e308).');
console.log('break_infinity só acima de 1e308.\n');

// ── SPLIT proposto (norte) — soma ≈ décadas do Normal ──
const budget = [
  ['Mémoires (Artifacts ×todo dano)', 18, 'engrenagem profunda do late (Éclats)'],
  ['Gear (flat + % + níveis altos + raridade)', 13, 'agora pesa muito (milhões de níveis)'],
  ['Passivas (alavancas)',             4, 'crit/APS/dano-em-boss + motores do grupo 3'],
  ['Ascension (multiplica Conv+Awaken)', 3, 'meta-multiplicador por mapa'],
  ['Despertar/Awaken (×poder/tier)',   2.5, 'mudança de classe'],
  ['Nível (flat/nível, reseta na conv)', 2, 'base por-run (limitada)'],
  ['Convergence (+15% aditivo)',       1.5, 'dial inicial, bola-de-neve leve'],
];

let total = 0;
console.log('SISTEMA                                  | décadas | papel');
console.log('-'.repeat(82));
for (const [name, dec, role] of budget) {
  total += Number(dec);
  console.log(`${name.padEnd(40)} | ${String(dec).padStart(7)} | ${role}`);
}
console.log('-'.repeat(82));
console.log(`${'TOTAL'.padEnd(40)} | ${total.toFixed(1).padStart(7)} | (alvo ≈ ${decadesNeeded.toFixed(0)})`);
console.log(`\nO HP do jogador segue o MESMO orçamento (gear_hp/passive_hp/memoire_hp/etc.).`);
console.log('⏳ Cada fatia é calibrada quando o sistema é reimplementado (CP-5..CP-10); CP-12 junta.');
