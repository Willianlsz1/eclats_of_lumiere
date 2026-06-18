// Estado da CASCA VISUAL (reset "folha em branco" 2026-06-18).
// O motor de jogo foi removido — este arquivo NÃO contém lógica, só um estado de
// AMOSTRA estático com o shape que as telas (src/ui/*.js) leem para renderizar.
// Valores semeados (Lumens, Gear, HP, inimigos…) servem só para a casca não ficar
// vazia. A persistência (applySnapshot/toSnapshot) saiu junto com o save.

import { SCHEMA_VERSION, MAPS } from '../data/constants.js';

const subCountOf = (mapId) => (MAPS[(mapId || 1) - 1] || MAPS[0]).subareaCount;

// Pack de inimigos de amostra (Map 1) — só para a arena de combate aparecer povoada.
function sampleEnemies() {
  const map1 = MAPS[0];
  const n = Math.min(4, map1.enemyNames.length);
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: map1.enemyNames[i],
    art: map1.enemyArts[i],
    frame: 'frames.enemy_universal',
    level: 8 + i,
    hpMax: 1000,
    hp: 1000,
    dmg: 40 + i * 6,
    rewardMult: 1,
  }));
}

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos (amostra)
    lumens: 12_345,
    xpTotal: 48_000,
    xpRun: 6_500,

    vestiges: 820,
    eclats: 64,
    ascensions: 1,
    despertares: 1,
    nitzotzot: 12,
    memoires: [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    convergences: 2,
    convPoints: 0,
    bestSubareaRun: 3,

    // Gold Stats (mantidos no shape; o redesign os removerá no replanejamento)
    stats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    passives: {
      eclat:    [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      vestige:  [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      fracture: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },

    // Gear (amostra: alguns níveis/raridades para os cards aparecerem variados)
    gear: {
      edge:  { level: 42, rarity: 1 },
      vigil: { level: 30, rarity: 1 },
      veil:  { level: 18, rarity: 0 },
      grasp: { level: 25, rarity: 1 },
      reson: { level: 12, rarity: 0 },
      band:  { level: 20, rarity: 0 },
    },
    materiais: [120, 24, 0, 0],

    difficulty: 0,
    auto: { stats: false, converge: false, progress: false },
    ecoMap: 0,

    // Posição no mundo (Map 1, com fronteira no Map 2 p/ as moedas aparecerem)
    map: 1,
    maxMap: 2,
    subarea: 3,
    unlockedSubarea: 5,
    bossDefeated: Array.from({ length: subCountOf(1) }, (_, i) => i < 2),
    killsInSubarea: 35,
    mapProgress: {},

    // Jogador (amostra)
    player: {
      hp: 800,
      dead: false,
      respawnTimer: 0,
      attackTimer: 0,
    },

    // Onda ativa (amostra) + fila de FX
    enemies: sampleEnemies(),
    wave: 4,
    fx: [],

    killsTotal: 1_280,
  };
}

// Estado vivo da casca (singleton)
export const state = createInitialState();
