// Economia — lógica PURA. Gold/XP por kill (∝ HP do mob) + upgrades (custo escalado).
import { ECONOMY, UPGRADES } from '../data/constants.js';

export function goldForKill(enemy) {
  return enemy.hpMax * ECONOMY.goldPerKillRatio;
}
export function xpForKill(enemy) {
  return enemy.hpMax * ECONOMY.xpPerKillRatio;
}

export function upgradeCost(kind, owned) {
  const u = UPGRADES[kind];
  return Math.round(u.costBase * u.costGrowth ** owned);
}

// Compra 1 nível do upgrade `kind` ('dano'|'vida'). Retorna true se efetuou.
export function buyUpgrade(state, kind) {
  const cost = upgradeCost(kind, state.upgrades[kind]);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.upgrades[kind] += 1;
  return true;
}
