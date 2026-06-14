// Motor de Ascension — GDD §8. Marco por mapa: derrotar o boss final + custo
// em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank, próximo mapa.
// A1 também libera o drip de Éclats (§10). Persiste sempre. Só Map 1 existe
// no MVP → só A1 é completável; A2-A5 exigem Maps 2-5.

import { ASCENSIONS, ECLATS_DRIP, MAPS, SEEKER_RANKS, DESPERTAR, DESPERTAR_REQ } from '../data/constants.js';
import { hpForLevel, subareaLevelRange, getCurrentMap } from './enemies.js';
import { memoireEclatsAllMult } from './memoires.js';

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
  state.eclats += a.eclats * memoireEclatsAllMult(state); // bolsa da cerimônia (§10) × #12 (todos os Éclats)
  // Avança para o próximo mapa (§8) e reinicia o progresso do mapa. A onda é
  // recriada pelo chamador (resetPack) — evita ciclo de import com combat.js.
  if (a.mapBoss < MAPS.length) {
    state.map = a.mapBoss + 1;
    state.maxMap = Math.max(state.maxMap || 1, state.map); // fronteira avança
    delete state.mapProgress[state.map]; // mapa novo começa zerado
    state.subarea = 1;
    state.unlockedSubarea = 1;
    state.bossDefeated = state.bossDefeated.map(() => false);
    state.killsInSubarea = 0;
  }
  return true;
}

// ───── Despertar / Tier (§8, Passo 7) — DESACOPLADO das ascensions ─────

// Índice de tier = nº de Despertares (0..4). Tier T1..T5 = SEEKER_RANKS[idx].
export const despertarTier = (state) => Math.min(SEEKER_RANKS.length - 1, state.despertares || 0);

// Rank/tier atual da Ordre — lê o tier de DESPERTAR (não as ascensions).
export const currentRank = (state) => SEEKER_RANKS[despertarTier(state)];

// ×poder permanente do Despertar (dano E HP): mult^despertares.
export const despertarMult = (state) => DESPERTAR.mult ** (state.despertares || 0);

// ── Gate do Despertar em 3 camadas (§8 redesign, 13/jun) — ATO DO JOGADOR ──
// Não dispara mais sozinho: vencer o Guardião só destrava a Prova.

// Tier alvo do próximo despertar (despertares+1), ou null se já é Lumière (T5).
export function despertarTarget(state) {
  const t = (state.despertares || 0) + 1;
  return t <= SEEKER_RANKS.length - 1 ? t : null;
}

// Requisito (Oferenda Nitzotzot + Tributo Vestiges) do próximo despertar, ou null.
export function despertarReq(state) {
  const t = despertarTarget(state);
  return t == null ? null : DESPERTAR_REQ[t];
}

// Prova: vencer o Guardião da Sub 3 do mapa do tier alvo (bossDefeated[2] = Sub3).
export function despertarProvaMet(state) {
  const t = despertarTarget(state);
  if (t == null) return false;
  return state.map >= t && Array.isArray(state.bossDefeated) && state.bossDefeated[2] === true;
}

// Pode despertar? Prova + Oferenda + Tributo, todos atendidos.
export function canDespertar(state) {
  const req = despertarReq(state);
  if (!req || !despertarProvaMet(state)) return false;
  return (state.nitzotzot || 0) >= req.nitzotz && (state.vestiges || 0) >= req.vestiges;
}

// Executa o despertar (gasta Nitzotzot + Vestiges, sobe o tier). Idempotente/seguro.
export function doDespertar(state) {
  if (!canDespertar(state)) return false;
  const req = despertarReq(state);
  state.nitzotzot -= req.nitzotz;
  state.vestiges -= req.vestiges;
  state.despertares = despertarTarget(state);
  return true;
}

// §10 — drip de Éclats por segundo (0 antes da A1). Escala com a HP do frontier
// (boss da subárea mais funda desbloqueada do mapa atual).
export function eclatsDripPerSec(state) {
  if (state.ascensions < 1) return 0;
  const map = getCurrentMap(state);
  const frontierLevel = subareaLevelRange(map, state.unlockedSubarea).hi;
  const hpFrontier = hpForLevel(map, frontierLevel);
  return (ECLATS_DRIP.coef * hpFrontier ** ECLATS_DRIP.exp) / 3600;
}
