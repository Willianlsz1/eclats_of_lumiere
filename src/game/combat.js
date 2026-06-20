// Combate — CP-2 (redesign Mapa 1): navegação de áreas por NÍVEL.
// O tick de combate (dano/kills/boss) ainda é stub (CP-3 preenche). Aqui só:
// - gate de área por nível (área n libera quando runLevel ≥ gate[n]);
// - navegação entre áreas (respeitando o gate);
// - repovoamento da cena (mobs estáticos até o CP-3).

import { spawnPack, getCurrentMap, subareaLevelRange } from './enemies.js';
import { runLevel } from './stats.js';

// Repovoa a onda com mobs da área atual (estáticos até o CP-3).
export function resetPack(state) {
  state.wave = 1;
  state.enemies = spawnPack(getCurrentMap(state), state.subarea);
}

export function combatTick() {}        // CP-3
export function bossActive() { return false; } // CP-3

// Nível mínimo p/ entrar na área n (1ª sempre aberta). Usa os gates do design.
export function subareaUnlockLevel(map, n) {
  if (n <= 1) return 0;
  const gates = map.gates;
  if (gates && gates[n - 1] != null) return gates[n - 1];
  return Math.max(1, Math.round(subareaLevelRange(map, n).lo)); // fallback geométrico
}

// Avança o high-water de áreas liberadas conforme o nível sobe. unlockedSubarea
// é persistente (não recua na Convergence mesmo que o nível da run zere).
export function updateUnlockByLevel(state) {
  const map = getCurrentMap(state);
  const lvl = runLevel(state);
  let u = state.unlockedSubarea || 1;
  while (u < map.subareaCount && lvl >= subareaUnlockLevel(map, u + 1)) u += 1;
  if (u !== state.unlockedSubarea) state.unlockedSubarea = u;
}

export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

// Entra numa área n (1-indexada), respeitando o gate da maior desbloqueada.
export function enterSubarea(state, n) {
  updateUnlockByLevel(state);
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  state.bestSubareaRun = Math.max(state.bestSubareaRun || 1, next);
  resetPack(state);
}

// Viagem entre mapas (Map 1 só, no redesign — mantém compat de assinatura).
export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.map = dest;
  resetPack(state);
  return true;
}
