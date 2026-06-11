// Motor de Ascension — GDD §8. Marco por mapa: derrotar o boss final + custo
// em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank, próximo mapa.
// A1 também libera o drip de Éclats (§10). Persiste sempre. Só Map 1 existe
// no MVP → só A1 é completável; A2-A5 exigem Maps 2-5.

import { ASCENSIONS, ECLATS_DRIP, MAPS } from '../data/constants.js';
import { hpForLevel, subareaLevelRange, getCurrentMap } from './enemies.js';

// Próximo marco de Ascension (ou null se já no fim)
export const nextAscension = (state) =>
  state.ascensions < ASCENSIONS.length ? ASCENSIONS[state.ascensions] : null;

// Multiplicador acumulado de Ascension (aplica a dano E HP — §8)
export function ascMult(state) {
  let m = 1;
  for (let i = 0; i < state.ascensions; i++) m *= ASCENSIONS[i].mult;
  return m;
}

// Requisito do próximo marco: boss final do mapa correspondente derrotado.
// (state.map só é 1 no MVP; bossDefeated é do mapa atual.)
export function reqMet(state) {
  const a = nextAscension(state);
  if (!a) return false;
  return a.mapBoss === state.map && state.bossDefeated[state.bossDefeated.length - 1];
}

export function canAscend(state) {
  const a = nextAscension(state);
  return !!a && reqMet(state) && state.vestiges >= a.cost;
}

export function doAscend(state) {
  if (!canAscend(state)) return false;
  const a = nextAscension(state);
  state.vestiges -= a.cost;
  state.ascensions += 1;
  state.eclats += a.eclats; // bolsa da cerimônia (§10)
  // Avança para o próximo mapa (§8) e reinicia o progresso do mapa. A onda é
  // recriada pelo chamador (resetPack) — evita ciclo de import com combat.js.
  if (a.mapBoss < MAPS.length) {
    state.map = a.mapBoss + 1;
    state.subarea = 1;
    state.unlockedSubarea = 1;
    state.bossDefeated = state.bossDefeated.map(() => false);
    state.killsInSubarea = 0;
  }
  return true;
}

// Rank/tier atual da Ordre (cerimônia §8). 0 = Seeker (Tier I).
export function currentRank(state) {
  if (state.ascensions === 0) return { name: 'Seeker', tier: 'I' };
  const a = ASCENSIONS[Math.min(state.ascensions, ASCENSIONS.length) - 1];
  return { name: a.rank, tier: a.tier };
}

// Moldura do card do Seeker conforme o tier. ⏳ T4 reusa a moldura radiante
// (981) até confirmar se ela é T4 ou T5. TODO(canon): tier exato de cada moldura.
const TIER_FRAME = { I: 'frames.tier1', II: 'frames.tier2', III: 'frames.tier3', IV: 'frames.tier5', V: 'frames.tier5' };
export const seekerFrame = (state) => TIER_FRAME[currentRank(state).tier] || 'frames.tier1';

// §10 — drip de Éclats por segundo (0 antes da A1). Escala com a HP do frontier
// (boss da subárea mais funda desbloqueada do mapa atual).
export function eclatsDripPerSec(state) {
  if (state.ascensions < 1) return 0;
  const map = getCurrentMap(state);
  const frontierLevel = subareaLevelRange(map, state.unlockedSubarea).hi;
  const hpFrontier = hpForLevel(map, frontierLevel);
  return (ECLATS_DRIP.coef * hpFrontier ** ECLATS_DRIP.exp) / 3600;
}
