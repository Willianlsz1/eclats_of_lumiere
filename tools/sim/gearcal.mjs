// Calibração do GEAR à sua fatia do orçamento (~13 décadas no Normal).
// Mede a contribuição de dano do gear por raridade (set inteiro maximizado) vs uma
// base de referência, e mostra as décadas. Uso: node tools/sim/gearcal.mjs
import { GEAR, COMBAT, LEVEL } from '../../src/data/constants.js';
import { gearDamageFlat, gearDamageMult } from '../../src/game/gear.js';

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
// base de referência SEM gear: baseDmg + nível-de-run típico (~100) × dmgPerLevel
const baseRef = COMBAT.baseDmg + 100 * LEVEL.dmgPerLevel;

// set inteiro numa raridade r, todas as peças no cap daquela raridade
const setAt = (r) => {
  const lvl = GEAR.levelCap[r];
  const gear = {};
  for (const def of GEAR.pieces) gear[def.key] = { level: lvl, rarity: r };
  return { gear };
};

console.log('='.repeat(78));
console.log(`Gear — décadas de dano por raridade (set maximizado). baseRef = ${baseRef}`);
console.log('='.repeat(78));
console.log('Raridade   | +dano flat | ×dano (%)  | déc FLAT | déc % | DÉC total');
console.log('-'.repeat(78));
for (let r = 0; r < 5; r++) {
  const s = setAt(r);
  const flat = gearDamageFlat(s);
  const mult = gearDamageMult(s);
  const flatDec = Math.log10((baseRef + flat) / baseRef); // décadas que o flat dá (sobre a base)
  const pctDec = Math.log10(mult);                        // décadas que o % dá (multiplicativo)
  const total = flatDec + pctDec;
  console.log(
    `${RAR[r].padEnd(10)} | ${flat.toExponential(2).padStart(10)} | ${mult.toExponential(2).padStart(10)} | ${flatDec.toFixed(1).padStart(8)} | ${pctDec.toFixed(1).padStart(5)} | ${total.toFixed(1).padStart(6)}`
  );
}
console.log('-'.repeat(78));
console.log('ALVO: ~13 décadas no Converged (a fatia do gear). Ajustar flatPerLevel/affixPctRate/');
console.log('affixMultBase/levelCap até a linha Converged bater ~13.');
