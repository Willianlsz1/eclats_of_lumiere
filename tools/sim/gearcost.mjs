// Custo de upar gear vs renda do mapa — pra ver se o CUSTO é um freio natural (sem cap).
// Uso: node tools/sim/gearcost.mjs
import { GEAR, ECONOMY, MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// custo total p/ ir de 0 ao nível N (custo linear: base×(L+1)×costMult → soma quadrática)
const costToLevel = (N, rarity) => GEAR.levelCostBase * GEAR.costMult[rarity] * (N * (N + 1) / 2);
// Lumens por kill no mapa (base, convMult=1): mob_hp(rep mais fundo) × goldRatio
const lumensPerKill = (map) => hpForLevel(map, Math.round(subareaLevelRange(map, map.subareaCount).hi)) * ECONOMY.goldRatio;

const fmt = (x) => (Math.abs(x) >= 1e4 ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 0 }));
const KPS = 30; // kills/seg representativo (cleave: ~pack×APS). Só p/ estimar tempo.
const milestones = [1e4, 1e5, 1e6, 1e7];

// Map 1 = Faded · Map 2 = Kindled · ... (raridade = mapa-1, capada em Converged)
for (let m = 1; m <= 5; m++) {
  const map = MAPS[m - 1];
  const rarity = Math.min(m - 1, 4);
  const lpk = lumensPerKill(map);
  console.log('\n' + '='.repeat(86));
  console.log(`MAP ${m} — ${map.name} · raridade ${['Faded','Kindled','Luminous','Radiant','Converged'][rarity]} · Lumens/kill ≈ ${lpk.toExponential(2)}`);
  console.log('='.repeat(86));
  console.log('  nível | custo total (Lumens) | kills p/ pagar | tempo @30 kills/s');
  console.log('  ' + '-'.repeat(72));
  for (const N of milestones) {
    const cost = costToLevel(N, rarity);
    const kills = cost / lpk;
    const secs = kills / KPS;
    const t = secs < 90 ? `${secs.toFixed(0)}s` : secs < 5400 ? `${(secs/60).toFixed(0)}min` : secs < 1.3e5 ? `${(secs/3600).toFixed(1)}h` : `${(secs/86400).toFixed(1)}d`;
    console.log(`  ${N.toExponential(0).padStart(5)} | ${fmt(cost).padStart(20)} | ${fmt(kills).padStart(14)} | ${t.padStart(16)}`);
  }
}
console.log('\nLEITURA: se "kills p/ pagar" e o tempo crescem RÁPIDO com o nível, o custo é o freio');
console.log('natural — você para de upar quando fica caro demais, sem precisar de cap.');
