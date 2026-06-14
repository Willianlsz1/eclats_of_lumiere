// Simulador — Camada 1 (Núcleo de combate CLEAVE, CP-1 / ADR 0002).
// Mostra como a RENDA passa a escalar sob cleave: cada ataque atinge a onda
// inteira, então os kills/s = (tamanho da onda) × APS quando você ONE-SHOTA, e
// caem quando o HP do mob passa do seu dano (= a Wall). Contrasta com o modelo
// ANTIGO (teto de 1 kill/ataque → renda limitada ao APS).
// Uso: `node tools/sim/cleave.mjs`

import { MAPS, COMBAT, ECONOMY } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

const fmt = (x) => {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 6) return x.toLocaleString('en', { maximumFractionDigits: 1 });
  return x.toExponential(2);
};
const geomean = (lo, hi) => Math.sqrt(lo * hi);

const APS = COMBAT.apsCap;              // teto de ataques/s (player forte)
const map = MAPS[0];                    // Map 1 (ilustrativo)

console.log('='.repeat(82));
console.log('CAMADA 1 — Combate CLEAVE. Map 1. APS=' + APS + ' · goldRatio=' + ECONOMY.goldRatio);
console.log('Cada ataque atinge a onda inteira; kills/s e Lumens/s escalam com o TAMANHO da onda.');
console.log('='.repeat(82));

// Para vários níveis de DANO POR HIT do jogador, ver kills/s e Lumens/s por sub-área.
const DMG_TIERS = [10, 100, 1e3, 1e4, 1e5, 1e6];

for (const dmg of DMG_TIERS) {
  console.log(`\n### dano/hit = ${fmt(dmg)}`);
  console.log('  sub | pack | mobHP(rep) | golpes p/ limpar | kills/s CLEAVE | kills/s ANTIGO | Lumens/s CLEAVE');
  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const mobHp = hpForLevel(map, geomean(lo, hi));
    const pack = map.packSizes[s - 1];
    const hitsToClear = Math.max(1, Math.ceil(mobHp / dmg)); // golpes p/ derrubar 1 mob (cleave derruba todos juntos)
    const killsCleave = (pack * APS) / hitsToClear;          // a onda toda cai em hitsToClear golpes
    const killsOld = Math.min(APS, killsCleave / pack * 1);  // antigo: teto de 1 kill/ataque (≤ APS)
    const lumensCleave = killsCleave * (mobHp * ECONOMY.goldRatio);
    const wall = hitsToClear > 1 ? (hitsToClear > 50 ? '  ← WALL DURA' : '  ← devagar') : '';
    console.log(
      `   ${s}  | ${String(pack).padStart(4)} | ${fmt(mobHp).padStart(10)} | ${String(hitsToClear).padStart(16)} | ${fmt(killsCleave).padStart(13)} | ${fmt(killsOld).padStart(13)} | ${fmt(lumensCleave).padStart(13)}${wall}`
    );
  }
}

console.log('\n' + '='.repeat(82));
console.log('LEITURA:');
console.log(' • Quando voce ONE-SHOTA (golpes=1): kills/s = pack × APS (renda escala com a onda).');
console.log('   No modelo ANTIGO isso era TRAVADO em APS (1 kill/ataque) — eis a re-ancoragem.');
console.log(' • Quando mobHP > dano (golpes>1): kills/s despenca = a WALL (vá farmar Hollow/Gear).');
console.log(' • Lumens/s = kills/s × (mobHP × goldRatio): farmar FUNDO (mobHP alto) e RÁPIDO paga mais.');
console.log('='.repeat(82));
