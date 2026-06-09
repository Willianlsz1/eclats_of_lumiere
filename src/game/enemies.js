// Malha geométrica — GDD §3.
// Bounds de level por subárea: lvl_lo × r^s, com r = (lvl_hi/lvl_lo)^(1/5).
// HP e dano interpolados geometricamente no log do level.

import { MAP_1, MAP_1_ENEMY_NAMES } from '../data/constants.js';

let nextEnemyId = 1;

// Razão geométrica entre subáreas do mapa
function subareaRatio(map) {
  return (map.lvlHi / map.lvlLo) ** (1 / map.subareaCount);
}

// Range de level [lo, hi] da subárea (1-indexada)
export function subareaLevelRange(map, subarea) {
  const r = subareaRatio(map);
  return {
    lo: map.lvlLo * r ** (subarea - 1),
    hi: map.lvlLo * r ** subarea,
  };
}

// Interpolação geométrica no log do level: valor(L) = lo × (hi/lo)^t
// t = (log L − log lvl_lo) / (log lvl_hi − log lvl_lo)
function interp(map, level, lo, hi) {
  const t = (Math.log(level) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
  return lo * (hi / lo) ** t;
}

export function hpForLevel(map, level) {
  return interp(map, level, map.hpLo, map.hpHi);
}

export function dmgForLevel(map, level) {
  return interp(map, level, map.dmgLo, map.dmgHi);
}

// Level sorteado uniformemente no espaço log do range da subárea (malha geométrica)
function rollLevel(map, subarea) {
  const { lo, hi } = subareaLevelRange(map, subarea);
  const level = lo * (hi / lo) ** Math.random();
  return Math.max(1, Math.round(level));
}

export function spawnMob(map, subarea) {
  const level = rollLevel(map, subarea);
  const hpMax = hpForLevel(map, level);
  return {
    id: nextEnemyId++,
    name: MAP_1_ENEMY_NAMES[nextEnemyId % MAP_1_ENEMY_NAMES.length],
    level,
    hpMax,
    hp: hpMax,
    dmg: dmgForLevel(map, level), // dano por segundo causado ao jogador
  };
}

// Pack completo da subárea atual (tamanhos do GDD §4)
export function spawnPack(map, subarea) {
  const size = map.packSizes[subarea - 1];
  return Array.from({ length: size }, () => spawnMob(map, subarea));
}

export function getCurrentMap() {
  // MVP = Map 1 apenas; mapas 2-5 ficam fora do escopo
  return MAP_1;
}
