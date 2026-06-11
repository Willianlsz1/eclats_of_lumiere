// Camada 6 — MÉMOIRES. PROBLEMA achado: custo 2×1.10^n é raso demais vs drip
// 0.1×HP^0.9 → maximiza instantâneo. Acha o RAMP de custo que paceia o leveling
// pela profundidade. Uso: node tools/sim/memoires.mjs

const CLARTE = 1.07;
const NM = 15;
const MEMOIRE_SHARE = 0.74;            // Mémoires carregam ~74% das décadas de dano
const dripPerHour = (H) => 0.1 * H ** 0.9;
const FARM_HOURS = 2;                  // Éclats acumulados em ~2h de drip na profundidade

// nível/Mémoire NECESSÁRIO p/ a fatia de décadas do mapa de HP frontier H
const neededLevel = (H) => (MEMOIRE_SHARE * Math.log10(H) / Math.log10(CLARTE)) / NM;
// nível/Mémoire AFORDÁVEL: maior L com 15×Σ(2×ramp^n) ≤ Éclats de FARM_HOURS
function affordableLevel(H, ramp) {
  const eclats = FARM_HOURS * dripPerHour(H);
  let cum = 0, L = 0;
  while (true) {
    const next = 2 * ramp ** (L + 1);
    if (15 * (cum + next) > eclats) break;
    cum += next; L++;
    if (L > 100000) break;
  }
  return L;
}

const maps = [['Map1', 1e6], ['Map2', 1e16], ['Map3', 1e34], ['Map4', 1e62], ['Map5', 1e100]];

for (const ramp of [1.10, 2.5, 3.0, 4.0]) {
  console.log(`\n=== RAMP de custo = ×${ramp}/nível ===`);
  console.log(' mapa  | nível necessário | nível afordável(2h) | veredito');
  console.log(' '.repeat(2) + '-'.repeat(58));
  for (const [m, H] of maps) {
    const need = neededLevel(H);
    const aff = affordableLevel(H, ramp);
    const verdict = aff > need * 3 ? 'QUEBRA (super afford)' : aff < need * 0.5 ? 'lento demais' : 'OK paceado';
    console.log(`  ${m}  |       ${need.toFixed(0).padStart(3)}        |        ${String(aff).padStart(4)}         | ${verdict}`);
  }
}
console.log('\nAlvo: nível afordável ≈ nível necessário (paceado pela profundidade).');
