// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION } from '../data/constants.js';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos
    lumens: 0,
    xpTotal: 0, // XP acumulado da vida — alimenta o level de display (§6 do GDD)
    xpRun: 0,   // XP da run — enche a parede de Convergence, reseta ao convergir

    // Convergence (§6) — persistem para sempre
    convergences: 0,
    convPoints: 0,
    bestSubareaRun: 1, // subárea mais funda alcançada na run (vira pontos)

    // Gold Stats (§5) — resetam na Convergence (CP-E)
    stats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    // Posição no mundo
    map: 1,
    subarea: 1,         // 1..5
    unlockedSubarea: 1, // gate: maior subárea acessível (abre ao derrotar o boss)
    bossDefeated: [false, false, false, false, false], // 1ª derrota por subárea
    killsInSubarea: 0,  // contador oculto rumo ao threshold do boss

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
  // saves antigos (sem stats) entram com tudo zerado
  Object.assign(state.stats, snapshot.stats ?? {});
  // saves anteriores ao gate: herda a subárea atual como desbloqueada
  state.unlockedSubarea = snapshot.unlockedSubarea ?? state.subarea;
  state.bossDefeated = snapshot.bossDefeated ?? state.bossDefeated;
  state.killsInSubarea = snapshot.killsInSubarea ?? 0;
  state.subarea = Math.min(state.subarea, state.unlockedSubarea);
  state.xpRun = snapshot.xpRun ?? 0;
  state.convergences = snapshot.convergences ?? 0;
  state.convPoints = snapshot.convPoints ?? 0;
  state.bestSubareaRun = snapshot.bestSubareaRun ?? state.subarea;
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
    stats: { ...state.stats },
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
    xpRun: state.xpRun,
    convergences: state.convergences,
    convPoints: state.convPoints,
    bestSubareaRun: state.bestSubareaRun,
  };
}
