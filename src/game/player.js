// Player — lógica PURA (entrada → saída, sem DOM). §3.2 (motor de stat) e §3.5.
import { PLAYER, UPGRADES, LEVEL } from '../data/constants.js';

// XP para ir de `level` → `level+1` (geométrico).
export function xpToNext(level) {
  return Math.round(LEVEL.base * LEVEL.growth ** (level - 1));
}

// XP acumulado para ALCANÇAR `level` (level 1 = 0).
export function xpForLevel(level) {
  let total = 0;
  for (let L = 1; L < level; L++) total += xpToNext(L);
  return total;
}

// Nível atual a partir do XP acumulado.
export function levelFromXp(xp) {
  let L = 1;
  while (xp >= xpForLevel(L + 1)) L++;
  return L;
}

// Stats derivados: base(Nível) + upgrades(gold). Aditivo no v0.
export function playerDano(state) {
  const lvl = levelFromXp(state.xpTotal);
  return (
    PLAYER.baseDano +
    (lvl - 1) * PLAYER.danoPerLevel +
    state.upgrades.dano * UPGRADES.dano.perLevel
  );
}

export function playerHpMax(state) {
  const lvl = levelFromXp(state.xpTotal);
  return (
    PLAYER.baseHp +
    (lvl - 1) * PLAYER.hpPerLevel +
    state.upgrades.vida * UPGRADES.vida.perLevel
  );
}

export function playerAPS() {
  return PLAYER.baseAPS; // constante no v0
}

export function dps(state) {
  return playerDano(state) * playerAPS(state);
}
