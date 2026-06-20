// [VISUAL-ONLY] Motor de Convergence REMOVIDO. Gate de nível exibido (puro);
// checagem e ação são neutras.

import { CONVERGENCE } from '../data/constants.js';

export function convGateLevel(convergences) {
  return Math.round(CONVERGENCE.gateLevelBase * CONVERGENCE.gateLevelGrowth ** convergences);
}
export const canConverge = () => false;
export const convergeProgress = () => 0;
export function doConverge() { return false; }
