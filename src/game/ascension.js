// [VISUAL-ONLY] Motor de Ascension/Despertar REMOVIDO. Leituras de dados (rank,
// marco, requisito) permanecem para exibição; mutadores e bônus são neutros.

import { ASCENSIONS, SEEKER_RANKS, DESPERTAR_REQ } from '../data/constants.js';

export const nextAscension = (state) =>
  state.ascensions < ASCENSIONS.length ? ASCENSIONS[state.ascensions] : null;

export const ascMult = () => 1;
export const reqMet = () => false;
export const canAscend = () => false;
export function doAscend() { return false; }

export const despertarTier = (state) => Math.min(SEEKER_RANKS.length - 1, state.despertares || 0);
export const currentRank = (state) => SEEKER_RANKS[despertarTier(state)];
export const despertarMult = () => 1;

export function despertarTarget(state) {
  const t = (state.despertares || 0) + 1;
  return t <= SEEKER_RANKS.length - 1 ? t : null;
}
export function despertarReq(state) {
  const t = despertarTarget(state);
  return t == null ? null : DESPERTAR_REQ[t];
}
export const despertarProvaMet = () => false;
export const canDespertar = () => false;
export function doDespertar() { return false; }

export const eclatsDripPerSec = () => 0;
