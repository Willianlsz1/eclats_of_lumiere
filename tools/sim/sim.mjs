// Simulador de calibração — Éclats of Lumière
// Importa as fórmulas REAIS (malha §3, combate §4, economia §12) e mostra os
// números que o jogo produz por mapa/sub-área. Uso: `node tools/sim/sim.mjs`.
//
// Objetivo da Camada 2 (Sobrevivência): ver dano dos mobs × HP × packDps e o
// "headroom" de sobrevivência, e comparar a curva de dano do CÓDIGO com a
// curva canônica do GDD §4 (que divergem nos Maps 2-5).

import { MAPS, COMBAT } from '../../src/data/constants.js';
import { hpForLevel, dmgForLevel, subareaLevelRange } from '../../src/game/enemies.js';

const fmt = (x) => {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 6) return x.toLocaleString('en', { maximumFractionDigits: 1 });
  return x.toExponential(2);
};

// Curva de dano CANÔNICA do GDD §4 (tabela "Dano dos mobs"), p/ comparar com o código.
const GDD_DMG = [
  { lo: 1, hi: 1e4 },     // M1
  { lo: 1e4, hi: 1e12 },  // M2
  { lo: 1e12, hi: 1e26 }, // M3
  { lo: 1e26, hi: 1e46 }, // M4
  { lo: 1e46, hi: 1e75 }, // M5
];

// (CP-2: o pack agora vem direto de map.packSizes — 8 sub-áreas.)

// Média geométrica = mob "representativo" do range (a malha sorteia no log)
const geomean = (lo, hi) => Math.sqrt(lo * hi);

console.log('='.repeat(78));
console.log('SIMULADOR — Camada 2 (Sobrevivência). Números reais da malha §3/§4.');
console.log('='.repeat(78));

for (const map of MAPS) {
  console.log(`\n### MAP ${map.id} — ${map.name}`);
  console.log(`    levels ${fmt(map.lvlLo)}–${fmt(map.lvlHi)} · HP ${fmt(map.hpLo)}–${fmt(map.hpHi)}`);
  console.log(`    dano CÓDIGO ${fmt(map.dmgLo)}–${fmt(map.dmgHi)}  |  dano GDD§4 ${fmt(GDD_DMG[map.id-1].lo)}–${fmt(GDD_DMG[map.id-1].hi)}`);
  console.log('    sub | mobHP(rep) | mobDmg(cod) | mobDmg(GDD) | pack | packDps(cod) | dmg/HP(cod)');

  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const repLevel = geomean(lo, hi);
    const mobHp = hpForLevel(map, repLevel);
    const mobDmgCode = dmgForLevel(map, repLevel);
    // dano GDD §4 interpolado na mesma malha (log do level)
    const t = (Math.log(repLevel) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
    const g = GDD_DMG[map.id - 1];
    const mobDmgGdd = g.lo * (g.hi / g.lo) ** t;
    const pack = map.packSizes[s - 1]; // CP-2: pack real do mapa (8 sub-áreas)
    const packDps = pack * mobDmgCode;
    const ratio = mobDmgCode / mobHp;
    console.log(
      `     ${s}  | ${fmt(mobHp).padStart(9)} | ${fmt(mobDmgCode).padStart(11)} | ${fmt(mobDmgGdd).padStart(11)} | ${String(pack).padStart(4)} | ${fmt(packDps).padStart(12)} | ${ratio.toExponential(1)}`
    );
  }
  // boss final do mapa (Sub 5)
  const bl = Math.round(subareaLevelRange(map, map.subareaCount).hi);
  const bossHp = hpForLevel(map, bl) * COMBAT.bossHpMult;
  const bossDmg = dmgForLevel(map, bl) * COMBAT.bossDmgMult;
  console.log(`    BOSS final: HP ${fmt(bossHp)} (×${COMBAT.bossHpMult}) · dano ${fmt(bossDmg)} (×${COMBAT.bossDmgMult})`);
}

console.log('\n' + '='.repeat(78));
console.log('LEITURA: dmg/HP(cod) mostra quão letal é o mob vs o próprio HP.');
console.log('No código M2-5 dmg≈HP×0.01..0.1 (alto); no GDD§4 o dano é MUITO menor.');
console.log('='.repeat(78));
