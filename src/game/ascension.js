// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de Ascension/Despertar foi removido. Multiplicadores neutros; as funções
// que devolvem "objeto" retornam as constantes reais (rank/marco/requisito) para o
// shape ficar correto nas telas. Gates fechados; ações no-op.

import { ASCENSIONS, SEEKER_RANKS, DESPERTAR_REQ } from '../data/constants.js';

const clampTier = (s) => Math.min(SEEKER_RANKS.length - 1, s?.despertares || 0);

// ── Ascension ──
export const ascMult       = () => 1;
export const currentRank   = (s) => SEEKER_RANKS[clampTier(s)];
export const nextAscension = (s) =>
  (s?.ascensions || 0) < ASCENSIONS.length ? ASCENSIONS[s.ascensions] : null;
export const reqMet         = () => false;
export const canAscend      = () => false;
export const doAscend       = () => false;
export const eclatsDripPerSec = () => 0;

// ── Despertar / Tier ──
export const despertarTier        = (s) => s?.despertares || 0;
export const despertarMult        = () => 1;
export const despertarCritRateAdd = () => 0;
export const despertarCritDmgAdd  = () => 0;
export const despertarLumensMult  = () => 1;
export const despertarXpMult      = () => 1;
export const despertarReq = (s) => DESPERTAR_REQ[(s?.despertares || 0) + 1] || null;
export const despertarProvaMet = () => false;
export const canDespertar      = () => false;
export const doDespertar       = () => false;
