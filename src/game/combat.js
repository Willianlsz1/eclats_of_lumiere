// [VISUAL-ONLY] Motor de combate REMOVIDO. Stubs neutros só para a UI navegar e
// renderizar. Sem tick, sem dano, sem morte, sem boss. A navegação entre sub-áreas
// e mapas apenas repovoa a cena com mobs estáticos (pra tela não ficar vazia).

import { spawnPack, getCurrentMap, subareaLevelRange } from './enemies.js';

// Repovoa a onda com mobs estáticos da sub-área atual (sem combate)
export function resetPack(state) {
  state.wave = 1;
  state.enemies = spawnPack(getCurrentMap(state), state.subarea);
}

export function combatTick() {}
export function bossActive() { return false; }

// Nível de unlock da sub-área (cálculo puro de geometria — só pra exibição)
export function subareaUnlockLevel(map, n) {
  if (n <= 1) return 0;
  return Math.max(1, Math.round(subareaLevelRange(map, n).lo));
}

export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

export function enterSubarea(state, n) {
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  resetPack(state);
}

export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.map = dest;
  resetPack(state);
  return true;
}
