// Estado central do v0. Único objeto mutável compartilhado. Mínimo e plano.
import { SCHEMA_VERSION } from '../data/constants.js';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos / progressão persistida
    gold: 0,
    xpTotal: 0, // XP acumulado → nível (derivado em game/player.js)
    upgrades: { dano: 0, vida: 0 },
    area: 1,
    unlockedArea: 1, // maior área destravada (bater o cap destrava a próxima)
    killsTotal: 0,

    // Runtime (não persistido)
    player: { hp: 0, attackTimer: 0, dead: false, respawnTimer: 0 },
    enemy: null, // mob atual (1 por vez no v0)
    fx: [], // fila de números flutuantes p/ a UI
  };
}

export const state = createInitialState();

// Só o que persiste (runtime é reconstruído no load).
export function toSnapshot() {
  return {
    schemaVersion: state.schemaVersion,
    gold: state.gold,
    xpTotal: state.xpTotal,
    upgrades: { ...state.upgrades },
    area: state.area,
    unlockedArea: state.unlockedArea,
    killsTotal: state.killsTotal,
  };
}

export function applySnapshot(s) {
  state.gold = s.gold ?? 0;
  state.xpTotal = s.xpTotal ?? 0;
  state.upgrades = { dano: s.upgrades?.dano ?? 0, vida: s.upgrades?.vida ?? 0 };
  state.area = s.area ?? 1;
  state.unlockedArea = s.unlockedArea ?? 1;
  state.killsTotal = s.killsTotal ?? 0;
}
