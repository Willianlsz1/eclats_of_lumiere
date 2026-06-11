// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION } from '../data/constants.js';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos
    lumens: 0,
    xpTotal: 0, // XP acumulado da vida — alimenta o level de display (§6 do GDD)
    xpRun: 0,   // XP da run — enche a parede de Convergence, reseta ao convergir

    // Vestiges (§7) — nunca resetam
    vestiges: 0,

    // Éclats (§10) — moeda-relíquia; fonte é a Ascension (A1). Nunca resetam.
    eclats: 0,
    ascensions: 0, // marcos de Ascension concluídos (§9) — gate das Mémoires por era
    memoires: new Array(15).fill(0), // níveis das 15 Mémoires (§11); 0 = bloqueada. PERSISTE.

    // Convergence (§6) — persistem para sempre
    convergences: 0,
    convPoints: 0,
    bestSubareaRun: 1, // subárea mais funda alcançada na run (vira pontos)

    // Gold Stats (§5) — resetam na Convergence (CP-E)
    stats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    // Passivas (§7) — 3 árvores × 15 níveis (0 = bloqueada). PERSISTE sempre;
    // desbloqueia na 1ª Convergence. Índice = ordem canônica do GDD.
    passives: {
      eclat:    new Array(15).fill(0),
      vestige:  new Array(15).fill(0),
      fracture: new Array(15).fill(0),
    },

    // Gear (§13) — 6 peças fixas, cada uma com nível + raridade. PERSISTE sempre
    // (não reseta na Convergence). rarity = índice em GEAR_RARITIES (0=Faded).
    gear: {
      edge:  { level: 0, rarity: 0 },
      vigil: { level: 0, rarity: 0 },
      veil:  { level: 0, rarity: 0 },
      grasp: { level: 0, rarity: 0 },
      reson: { level: 0, rarity: 0 },
      band:  { level: 0, rarity: 0 },
    },

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

    // Onda ativa de inimigos (runtime, não persistido). Mobs mortos ficam na
    // cena (apagados) até a onda ser limpa — sem respawn individual.
    enemies: [],
    wave: 1, // número da onda atual na subárea (runtime)

    // Fila de efeitos visuais (runtime) — hits para os números flutuantes
    fx: [],

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
  state.vestiges = snapshot.vestiges ?? 0;
  state.convergences = snapshot.convergences ?? 0;
  state.convPoints = snapshot.convPoints ?? 0;
  state.bestSubareaRun = snapshot.bestSubareaRun ?? state.subarea;
  // Éclats / Ascension / Mémoires persistem
  state.eclats = snapshot.eclats ?? 0;
  state.ascensions = snapshot.ascensions ?? 0;
  if (Array.isArray(snapshot.memoires)) {
    for (let i = 0; i < state.memoires.length; i++) state.memoires[i] = snapshot.memoires[i] ?? 0;
  }
  // Passivas persistem; saves antigos (sem passives) mantêm tudo bloqueado
  if (snapshot.passives) {
    for (const tree of Object.keys(state.passives)) {
      const arr = snapshot.passives[tree];
      if (Array.isArray(arr)) {
        for (let i = 0; i < state.passives[tree].length; i++) state.passives[tree][i] = arr[i] ?? 0;
      }
    }
  }
  // Gear persiste; saves antigos (sem gear) mantêm o default (tudo Faded nível 0)
  if (snapshot.gear) {
    for (const key of Object.keys(state.gear)) {
      const g = snapshot.gear[key];
      if (g) state.gear[key] = { level: g.level ?? 0, rarity: g.rarity ?? 0 };
    }
  }
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
    vestiges: state.vestiges,
    convergences: state.convergences,
    convPoints: state.convPoints,
    bestSubareaRun: state.bestSubareaRun,
    gear: JSON.parse(JSON.stringify(state.gear)),         // persiste sempre (§13)
    passives: JSON.parse(JSON.stringify(state.passives)), // persiste sempre (§7)
    eclats: state.eclats,                                 // §10
    ascensions: state.ascensions,                         // §9
    memoires: [...state.memoires],                        // §11
  };
}
