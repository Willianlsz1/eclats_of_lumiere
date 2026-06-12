// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION, SEEKER_RANKS } from '../data/constants.js';

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
    despertares: 0, // §8 (Passo 7): tier de Despertar (0..4 = T1..T5), gate de poder no meio do mapa
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
    materiais: [0, 0, 0, 0], // §13B (Passo 4): T1-T4. materiais[r] paga a raridade r→r+1.

    // §8 (Passo 5): dificuldade selecionada (índice em DIFFICULTIES) + automações dos Fate Keepers
    difficulty: 0,
    auto: { stats: false, converge: false, progress: false }, // toggl_es (default off; desbloqueiam por Ascension)
    ecoMap: 0, // §8 Eco do Seeker (A3): mapa que o eco farma em 2º plano (0 = nenhum)

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
  // Materiais (§13B, schema v2): default 0 p/ saves antigos (sem materiais). Normaliza sempre.
  const mats = Array.isArray(snapshot.materiais) ? snapshot.materiais : [];
  for (let i = 0; i < state.materiais.length; i++) state.materiais[i] = mats[i] ?? 0;
  // §8 (schema v3): dificuldade + automações. Normaliza sempre (default p/ saves antigos).
  state.difficulty = snapshot.difficulty ?? 0;
  const a = snapshot.auto || {};
  state.auto = { stats: !!a.stats, converge: !!a.converge, progress: !!a.progress };
  state.ecoMap = snapshot.ecoMap ?? 0; // §8 Eco do Seeker (schema v5)
  // §8 (schema v4): tier de Despertar. MIGRA de saves antigos a partir das ascensions p/
  // NÃO regredir o tier — cada ascension passada implica um Despertar (você passou a Sub 3
  // do mapa p/ vencer o boss e ascender); +1 se já passou a Sub 3 do mapa ATUAL.
  state.despertares = snapshot.despertares ?? Math.min(
    SEEKER_RANKS.length - 1,
    state.ascensions + (state.unlockedSubarea > 3 ? 1 : 0),
  );
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
    materiais: [...state.materiais],                      // §13B (persiste sempre)
    difficulty: state.difficulty,                         // §8 (Passo 5)
    auto: { ...state.auto },                              // §8 automações
    ecoMap: state.ecoMap,                                 // §8 Eco do Seeker (A3)
    passives: JSON.parse(JSON.stringify(state.passives)), // persiste sempre (§7)
    eclats: state.eclats,                                 // §10
    ascensions: state.ascensions,                         // §9
    despertares: state.despertares,                       // §8 (Passo 7) tier de Despertar
    memoires: [...state.memoires],                        // §11
  };
}
