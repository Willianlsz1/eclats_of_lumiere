// DURAÇÃO DO JOGO por arquétipo de jogador. Estimativa com premissas explícitas.
// Relógio-mestre = custos de Ascension em Vestiges (§8); + overhead do "climb" de
// poder; + offline capado 24h (≤ ativo). Uso: node tools/sim/playtime.mjs

import { ASCENSIONS } from '../../src/data/constants.js';

// ── relógio-mestre: Vestiges p/ cada Ascension (custo) e renda por mapa ──
// vestiges/kill no farm de sub-5 do mapa N ≈ ceil(5×0.5)×3^(N-1) = 3^N
const ascCost = [500000, 1900000, 4000000, 8000000]; // A1-A4 (A5 = grátis, só vencer Nihel)
const vestPerKill = (mapN) => 3 ** mapN;             // Map1=3 … Map4=81
const EFF_KILLS_PER_SEC = 5;   // média no climb (cap 15, mas boa parte sob-poder em vários hits)
const CLIMB_OVERHEAD = 6.0;    // o grosso do tempo é SUBIR as ~95 décadas (Mémoires/Conv/Gear),
                               // não farmar Vestige — fator sobre o relógio-mestre.
                               // 6.0 reproduz o orçamento do GDD §9 (~14d ótimo / ~41d realista) = cross-check

// horas ATIVAS-equivalentes p/ completar (floor do relógio × overhead do climb)
let vestHours = 0;
for (let n = 1; n <= 4; n++) vestHours += ascCost[n - 1] / (EFF_KILLS_PER_SEC * vestPerKill(n) * 3600);
const map5Hours = 8; // climb p/ vencer Nihel (sem custo de Vestige)
const TOTAL_ACTIVE_H = (vestHours + map5Hours) * CLIMB_OVERHEAD;

// ── offline: ≤ ativo, generoso mas não 100%; cap 24h por retorno ──
const OFFLINE_EFF = 0.7;   // offline rende 70% do ativo (Willian: "não deixe fraco", mas ≤ ativo)
const OFFLINE_CAP_H = 24;

// efetivo de horas de progresso por dia, dado: horas com aba aberta + ausência capada
function effHoursPerDay({ activeH, hoursBetweenLogin }) {
  // num de logins por dia e ausência média por login
  const loginsPerDay = 24 / hoursBetweenLogin;
  const offlinePerLogin = Math.min(OFFLINE_CAP_H, hoursBetweenLogin - activeH / loginsPerDay);
  const offlineEffPerDay = loginsPerDay * offlinePerLogin * OFFLINE_EFF;
  return Math.min(24, activeH + offlineEffPerDay);
}

const archetypes = {
  'INTENSO (botão muito ativo)': { activeH: 6,   hoursBetweenLogin: 8 },   // ~6h/dia aba aberta, loga 3×/dia
  'CASUAL (alvo do game)':       { activeH: 1.5, hoursBetweenLogin: 24 },  // ~1.5h/dia, loga 1×/dia (pega offline)
  'LEVE (entra pouco)':          { activeH: 1.5, hoursBetweenLogin: 84 },  // ~2 logins/semana (a cada 3.5d)
};

console.log('DURAÇÃO TOTAL DO JOGO BASE (A1→A5, vencer Nihel) — estimativa\n');
console.log(`Premissas: ${TOTAL_ACTIVE_H.toFixed(0)}h ativas-equiv. p/ completar`);
console.log(`  (relógio Vestige ${vestHours.toFixed(0)}h + Map5 ${map5Hours}h, × overhead climb ${CLIMB_OVERHEAD})`);
console.log(`  offline = ${OFFLINE_EFF*100}% do ativo, cap ${OFFLINE_CAP_H}h/retorno.\n`);
console.log('arquétipo                      | aba/dia | login | h efetivas/dia | DURAÇÃO');
console.log('-'.repeat(78));
for (const [name, p] of Object.entries(archetypes)) {
  const eff = effHoursPerDay(p);
  const days = TOTAL_ACTIVE_H / eff;
  const dur = days < 14 ? `${days.toFixed(0)} dias` : days < 60 ? `${(days/7).toFixed(1)} semanas` : `${(days/30).toFixed(1)} meses`;
  console.log(`${name.padEnd(30)} | ${(p.activeH+'h').padStart(6)} | ${(p.hoursBetweenLogin+'h').padStart(5)} | ${eff.toFixed(1).padStart(11)}   | ${dur} (${days.toFixed(0)}d)`);
}
console.log('\nINSIGHT: o offline generoso (24h, 70%) faz o CASUAL quase acompanhar o INTENSO');
console.log('(bom p/ o alvo do game). O LEVE perde tempo: o cap de 24h desperdiça ausências longas.');
console.log('Ajuste premissas (overhead, offline%, horas) p/ ver sensibilidade.');
