// Inimigos — CP-3 (redesign Mapa 1): força RELATIVA ao player.
//   HP do mob = HP_player × fatorÁrea × rand(1.3–1.9)
//   Dano/s    = HP_player × 0.03 × fatorÁrea  (por mob)
// Elite: chance baixa (+ Faro), +HP/+dano. Boss: invocado pelo combat ao bater o threshold.

import { MAPS, ENEMY_REL, COMBAT } from '../data/constants.js';
import { playerHpMax, runLevel } from './stats.js';

let nextId = 1;
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

// Mapa atual (1-indexado). Aceita state ou nada (default Map 1).
export function getCurrentMap(state) {
  const id = state && state.map ? state.map : 1;
  return MAPS[id - 1] || MAPS[0];
}

// Fator de força da área (1.1 → 1.9). Índice = área − 1.
export const areaFactor = (map, subarea) => (map.areaFactor && map.areaFactor[subarea - 1]) || 1;

// Faixa de nível p/ exibição (gate da área .. gate da próxima).
export function subareaLevelRange(map, subarea) {
  const g = map.gates || [];
  return { lo: g[subarea - 1] ?? 1, hi: g[subarea] ?? map.lvlHi };
}

// Nome/arte do trio do mapa (por id).
function flavor(map, id) {
  const k = id % map.enemyNames.length;
  return { name: map.enemyNames[k], art: map.enemyArts[k] };
}

// Mob comum (ou elite) — força relativa ao player atual.
export function spawnMob(state, map, subarea, { elite = false } = {}) {
  const hpP = playerHpMax(state);
  const f = areaFactor(map, subarea);
  const hpMax = hpP * f * rnd(ENEMY_REL.hpFactorMin, ENEMY_REL.hpFactorMax) * (elite ? ENEMY_REL.eliteHpMult : 1);
  const dmg = hpP * ENEMY_REL.dmgFrac * f * (elite ? ENEMY_REL.eliteDmgMult : 1);
  const id = nextId++;
  const { name, art } = flavor(map, id);
  return {
    id,
    name: elite ? `Elite ${name}` : name,
    art,
    frame: 'frames.enemy_universal',
    level: runLevel(state),
    hpMax, hp: hpMax, dmg,
    isElite: elite,
  };
}

// Boss — HP/dano multiplicados (COMBAT.bossHpMult/bossDmgMult).
export function spawnBoss(state, map, subarea) {
  const m = spawnMob(state, map, subarea);
  m.hpMax *= COMBAT.bossHpMult; m.hp = m.hpMax;
  m.dmg *= COMBAT.bossDmgMult;
  m.isBoss = true;
  m.name = map.bossName || 'Guardian';
  m.art = map.bossArt || m.art;
  m.frame = `frames.boss_m${map.id}`;
  return m;
}

// Chance de o mob ser elite (base + bônus de Faro; passiva ainda stub → 0).
function rollElite(state) {
  const chance = ENEMY_REL.eliteChance + (state.eliteBonus || 0);
  return Math.random() < chance;
}

// Pack da área (tamanho por packSizes; cada mob rola elite independente).
export function spawnPack(state, map, subarea) {
  const size = (map.packSizes && map.packSizes[subarea - 1]) || 1;
  const pack = [];
  for (let i = 0; i < size; i++) pack.push(spawnMob(state, map, subarea, { elite: rollElite(state) }));
  return pack;
}
