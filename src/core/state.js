// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION } from '../data/constants.js';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos
    lumens: 0,
    xpTotal: 0, // XP acumulado da vida — alimenta o level de display (§6 do GDD)

    // Posição no mundo
    map: 1,
    subarea: 1, // 1..5

    // Jogador (valores derivados ficam em src/game/stats.js)
    player: {
      hp: 0,            // inicializado com hpMax no bootstrap
      dead: false,
      respawnTimer: 0,  // segundos até o respawn quando morto
      attackTimer: 0,   // acumulador do intervalo de ataque
    },

    // Pack ativo de inimigos (runtime, não persistido)
    enemies: [],

    // Métricas
    killsTotal: 0,
  };
}

// Estado vivo da sessão (singleton simples)
export const state = createInitialState();

// Aplica um snapshot persistido por cima do estado inicial (campos salvos apenas)
export function applySnapshot(snapshot) {
  state.lumens = snapshot.lumens ?? 0;
  state.xpTotal = snapshot.xpTotal ?? 0;
  state.map = snapshot.map ?? 1;
  state.subarea = snapshot.subarea ?? 1;
  state.killsTotal = snapshot.killsTotal ?? 0;
}

// Extrai só o que deve ser persistido (pack e timers são reconstruídos no load)
export function toSnapshot() {
  return {
    schemaVersion: state.schemaVersion,
    lumens: state.lumens,
    xpTotal: state.xpTotal,
    map: state.map,
    subarea: state.subarea,
    killsTotal: state.killsTotal,
  };
}
