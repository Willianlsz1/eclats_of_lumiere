// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.
// CP-1 (redesign Mapa 1): núcleo + serialização de save (applySnapshot/toSnapshot).

import { SCHEMA_VERSION, MAPS } from '../data/constants.js';

// Nº de sub-áreas de um mapa (default Map 1). CP-2: 8 por mapa.
const subCountOf = (mapId) => (MAPS[(mapId || 1) - 1] || MAPS[0]).subareaCount;
// Normaliza um array de bossDefeated para o comprimento certo (pad false / trunca).
const normBossDefeated = (arr, mapId) =>
  Array.from({ length: subCountOf(mapId) }, (_, i) => !!(arr && arr[i]));

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
    nitzotzot: 0, // §8 (redesign 13/jun): material dedicado do Despertar (Oferenda). Dropa nas Sub 3+. PERSISTE.
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

    // Gear redesign (CP-4): inventário de peças dropadas + 1 equipada por slot.
    // item = { id, slot, rarity, level, affixes:[{type,value,secondary}] }.
    inventory: [],
    equipped: { edge: null, grasp: null, reson: null, vigil: null, veil: null, band: null },
    itemSeq: 0, // contador de ids de peça (persiste p/ ids estáveis)

    // §8 (Passo 5): dificuldade selecionada (índice em DIFFICULTIES) + automações dos Fate Keepers
    difficulty: 0,
    auto: { stats: false, converge: false, progress: false }, // toggl_es (default off; desbloqueiam por Ascension)
    ecoMap: 0, // §8 Eco do Seeker (A3): mapa que o eco farma em 2º plano (0 = nenhum)

    // Posição no mundo
    map: 1,
    maxMap: 1,          // fronteira: maior mapa já alcançado (permite voltar a anteriores)
    subarea: 1,         // 1..subareaCount (CP-2: 8)
    unlockedSubarea: 1, // gate: maior subárea acessível (abre ao derrotar o boss)
    bossDefeated: normBossDefeated([], 1), // 1ª derrota por subárea (comprimento = subareaCount)
    killsInSubarea: 0,  // contador oculto rumo ao threshold do boss
    mapProgress: {},    // progresso salvo por mapa {id: {subarea, unlockedSubarea, bossDefeated, killsInSubarea}}

    // Jogador (valores derivados ficam em src/game/stats.js)
    player: {
      hp: 0,            // inicializado com hpMax no bootstrap
      dead: false,
      respawnTimer: 0,  // segundos até o respawn quando morto
      attackTimer: 0,   // acumulador do intervalo de ataque
    },

    // Onda ativa de inimigos (runtime, não persistido).
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

// Campos persistidos (runtime como enemies/fx/timers do player são reconstruídos).
const PERSIST = [
  'lumens', 'xpTotal', 'xpRun', 'vestiges', 'eclats', 'ascensions', 'despertares',
  'nitzotzot', 'convergences', 'convPoints', 'bestSubareaRun', 'difficulty', 'ecoMap',
  'map', 'maxMap', 'subarea', 'unlockedSubarea', 'killsInSubarea', 'killsTotal', 'itemSeq',
];

const EQUIP_SLOTS = ['edge', 'grasp', 'reson', 'vigil', 'veil', 'band'];

// Aplica um snapshot persistido por cima do estado inicial.
export function applySnapshot(snap) {
  if (!snap || typeof snap !== 'object') return;
  for (const k of PERSIST) if (typeof snap[k] === 'number') state[k] = snap[k];
  if (Array.isArray(snap.memoires)) for (let i = 0; i < state.memoires.length; i++) state.memoires[i] = snap.memoires[i] ?? 0;
  if (Array.isArray(snap.materiais)) for (let i = 0; i < state.materiais.length; i++) state.materiais[i] = snap.materiais[i] ?? 0;
  if (snap.stats) Object.assign(state.stats, snap.stats);
  if (snap.auto) state.auto = { stats: !!snap.auto.stats, converge: !!snap.auto.converge, progress: !!snap.auto.progress };
  if (snap.passives) for (const tree of Object.keys(state.passives)) {
    const arr = snap.passives[tree];
    if (Array.isArray(arr)) for (let i = 0; i < state.passives[tree].length; i++) state.passives[tree][i] = arr[i] ?? 0;
  }
  if (snap.gear) for (const key of Object.keys(state.gear)) {
    const g = snap.gear[key];
    if (g) state.gear[key] = { level: g.level ?? 0, rarity: g.rarity ?? 0 };
  }
  if (Array.isArray(snap.inventory)) state.inventory = snap.inventory;
  if (snap.equipped) for (const slot of EQUIP_SLOTS) state.equipped[slot] = snap.equipped[slot] ?? null;
  state.bossDefeated = normBossDefeated(snap.bossDefeated, state.map);
  state.mapProgress = snap.mapProgress ?? {};
}

// Extrai só o que deve ser persistido.
export function toSnapshot() {
  const out = { schemaVersion: state.schemaVersion };
  for (const k of PERSIST) out[k] = state[k];
  out.memoires = [...state.memoires];
  out.materiais = [...state.materiais];
  out.stats = { ...state.stats };
  out.auto = { ...state.auto };
  out.passives = JSON.parse(JSON.stringify(state.passives));
  out.gear = JSON.parse(JSON.stringify(state.gear));
  out.inventory = JSON.parse(JSON.stringify(state.inventory));
  out.equipped = JSON.parse(JSON.stringify(state.equipped));
  out.bossDefeated = [...state.bossDefeated];
  out.mapProgress = JSON.parse(JSON.stringify(state.mapProgress));
  return out;
}
