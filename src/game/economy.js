// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, LEVEL, NUMBER_CAP, BOSS_LUMEN_MULT, VESTIGES, CRAFT, NITZOTZ, ENEMY, mapMaterialTier } from '../data/constants.js';
import { convMult, runLevel, damagePerHit } from './stats.js';
import { gearLumensMult, gearXpMult, gearMaterialDropMult } from './gear.js';
import { passiveEcoMult, passiveMaterialMult } from './passives.js';
import { memoireLumensMult, memoireXpMult, memoireVestigeMult, memoireMateriaisMult, memoireDiffRewardMult } from './memoires.js';
import { effectiveDifficulty } from './difficulty.js';
import { getCurrentMap, subareaLevelRange, hpForLevel, areaReward } from './enemies.js';
import { despertarLumensMult, despertarXpMult } from './ascension.js';

// Multiplicador de YIELD de material (§13B): DIFICULDADE ×rewardMult (×3/×10/×30) ×
//   #13 du Vide (recompensa de dificuldade) × #5 du Façonnage (+% materiais, aditivo, sem motor ×).
// ⛓️ hooks reservados (= 1): Vestige Pull (passiva) · afixo Materiais do gear (⏳ amortecer a curva).
function materialYieldMult(state) {
  return effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireMateriaisMult(state) * gearMaterialDropMult(state)  // afixo Materiais (amortecido, Bloco 3)
    * passiveMaterialMult(state); // Vestige Pull (passiva, amortecido, Bloco 4)
}

// §13B: drop de materiais no kill. 1% do tier do MAPA + 0.1% do tier seguinte; boss = chunk garantido.
function awardMaterials(state, mob) {
  const tier = mapMaterialTier(state.map);
  const y = materialYieldMult(state);
  if (Math.random() < CRAFT.dropChance) state.materiais[tier] += y;
  if (tier < 3 && Math.random() < CRAFT.nextTierChance) state.materiais[tier + 1] += y;
  if (mob.isBoss) state.materiais[tier] += CRAFT.bossChunk * y; // Guardião/final: chunk garantido
}

// §8 redesign: drop de Nitzotzot (Oferenda do Despertar). Só nas Sub-áreas 3+
// (a região do Guardião); chunk garantido em boss. Acumula no mapa do tier.
function awardNitzotz(state, mob) {
  if (state.subarea < 3) return;
  if (mob.isBoss) state.nitzotzot += NITZOTZ.bossChunk;
  else if (Math.random() < NITZOTZ.dropChance) state.nitzotzot += 1;
}

// §7: vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa)
// Map 1 (índice 0): [1, 1, 2, 2, 3] nas Subs 1-5
export function vestigesPerKill(state) {
  return Math.ceil(state.subarea * 0.5) * 3 ** (state.map - 1);
}

// Estimativa de ganho POR MOB numa sub-área (para o painel do mapa). Usa o mob
// de nível "médio" da área (média geométrica do range) e os multiplicadores
// atuais do jogador (conv, gear, passivas, mémoires), espelhando awardKill.
// Materiais é drop-based: devolvemos a chance e o yield por drop.
export function perKillEstimate(state, subarea) {
  const map = getCurrentMap(state);
  // recompensa DESACOPLADA do HP: base fixa × areaReward × multiplicadores.
  const rew = areaReward(subarea);
  const eco = passiveEcoMult(state);
  const cm = convMult(state);
  const lumens = ECONOMY.lumBase * rew * cm * gearLumensMult(state) * eco * memoireLumensMult(state);
  const vestiges = Math.ceil(subarea * 0.5) * 3 ** (map.id - 1) * memoireVestigeMult(state);
  const tier = mapMaterialTier(state.map);
  const matPerDrop = materialYieldMult(state);
  return { lumens, vestiges, tier, matChance: CRAFT.dropChance, matPerDrop };
}

export function awardKill(state, mob) {
  // §12: o ×5 de boss só se aplica a Lumens; o XP já escala pelo HP ×15
  const bossMult = mob.isBoss ? BOSS_LUMEN_MULT : 1;
  const eco = passiveEcoMult(state); // §7 Vestige tree (Lumens/XP) — provisório
  const cm = convMult(state);        // CP-3: Convergence +15% em Lumens e XP (sem frt/wis)
  // Lumens base = HP×goldRatio + PISO fixo + nível×goldPerLevel. O piso (✅ Map 1) garante
  // que os primeiros níveis do gear sejam compráveis cedo (mob de HP baixo rende pouco).
  // recompensa: LUMENS = base fixa × areaReward (profundidade) × multiplicadores (p/ gear).
  // XP = HP do mob × xpRatio (acompanha SEU poder via mobHp = dano×3, sobe LISO com o nível;
  // SEM areaReward/convMult em cima — esses amplificadores causavam a bola-de-neve).
  const rew = mob.rewardMult || 1;
  const lumBase = ECONOMY.lumBase * rew;
  state.lumens = Math.min(NUMBER_CAP, state.lumens + lumBase * cm * bossMult * gearLumensMult(state) * eco * memoireLumensMult(state) * despertarLumensMult(state));
  const xp = mob.hpMax * ECONOMY.xpRatio * gearXpMult(state) * memoireXpMult(state) * despertarXpMult(state);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + xp); // vida (level display)
  state.xpRun = Math.min(NUMBER_CAP, state.xpRun + xp);     // run (parede de Convergence)
  // §7: Vestiges nunca resetam; boss paga ×10
  const vest = vestigesPerKill(state) * (mob.isBoss ? VESTIGES.bossMult : 1) * memoireVestigeMult(state);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + vest);
  awardMaterials(state, mob); // §13B (Passo 4)
  awardNitzotz(state, mob);   // §8 redesign (Oferenda do Despertar)
  state.killsTotal += 1;
}
