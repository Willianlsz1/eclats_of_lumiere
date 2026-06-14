// Verificação CP-4 — Gear: custo linear, bulk-buy fechado (milhões), afixo flat.
// Uso: node tools/sim/cp4.mjs
import { GEAR } from '../../src/data/constants.js';
import { levelCost, buyLevels, gearDamageFlat, gearHpFlat, gearApsFlat, levelCapFor } from '../../src/game/gear.js';

const mk = (over = {}) => ({
  lumens: 0, ascensions: 0,
  gear: { edge: { level: 0, rarity: 0 }, vigil: { level: 0, rarity: 0 }, veil: { level: 0, rarity: 0 },
    grasp: { level: 0, rarity: 0 }, reson: { level: 0, rarity: 0 }, band: { level: 0, rarity: 0 } },
  ...over,
});
const fmt = (x) => (Math.abs(x) >= 1e6 ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 2 }));

console.log('='.repeat(72));
console.log('CP-4 — Gear: custo linear + bulk-buy fechado + afixo flat');
console.log('='.repeat(72));

console.log('\nCusto de 1 nível (linear) — peça edge, raridade 0 (Faded):');
for (const L of [0, 100, 10000, 1e6]) console.log(`  nível ${String(L).padStart(8)} → custo ${fmt(levelCost({ level: L, rarity: 0 }))}`);

console.log('\nCaps de nível por raridade:', GEAR.levelCap.map((_, r) => `${['Faded','Kindled','Luminous','Radiant','Converged'][r]}=${fmt(levelCapFor({ rarity: r, level: 0 }, { ascensions: 0 }))}`).join(' · '));

console.log('\nBulk-buy (MAX) com orçamentos crescentes — edge Faded:');
for (const budget of [1e4, 1e7, 1e10, 1e13]) {
  const s = mk({ lumens: budget });
  const bought = buyLevels(s, 'edge', 1e12); // n enorme = MAX
  console.log(`  lumens ${fmt(budget).padStart(9)} → comprou ${fmt(bought).padStart(9)} níveis · sobrou ${fmt(s.lumens)}`);
}

console.log('\nAfixo FLAT escala com nível e raridade (gearDamageFlat):');
for (const [lvl, rar] of [[100, 0], [10000, 1], [1e6, 3], [20e6, 4]]) {
  const s = mk({ gear: { ...mk().gear, edge: { level: lvl, rarity: rar } } });
  console.log(`  edge nível ${fmt(lvl).padStart(8)} raridade ${rar} → +dano flat ${fmt(gearDamageFlat(s))} · +HP flat ${fmt(gearHpFlat(s))} · +APS flat ${fmt(gearApsFlat(s))}`);
}
console.log('='.repeat(72));
