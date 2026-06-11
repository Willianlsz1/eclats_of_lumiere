// Malha geométrica — GDD §3.
// Bounds de level por subárea: lvl_lo × r^s, com r = (lvl_hi/lvl_lo)^(1/5).
// HP e dano interpolados geometricamente no log do level.

import { MAPS, COMBAT } from '../data/constants.js';

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
  const id = nextEnemyId++;
  const k = id % map.enemyNames.length; // trio do mapa
  return {
    id,
    name: map.enemyNames[k],
    art: map.enemyArts[k],
    level,
    hpMax,
    hp: hpMax,
    dmg: dmgForLevel(map, level), // dano por segundo causado ao jogador
  };
}

// Boss da subárea (GDD §3/§4): level máximo da subárea, HP ×15, dano ×3.
// Sub 5 = boss final do mapa (arte/nome canônicos); subs 1-4 = Guardião (placeholder).
export function spawnBoss(map, subarea) {
  const level = Math.round(subareaLevelRange(map, subarea).hi);
  const hpMax = hpForLevel(map, level) * COMBAT.bossHpMult;
  const isFinal = subarea === map.subareaCount;
  return {
    id: nextEnemyId++,
    name: isFinal ? map.bossName : `Guardião — Subárea ${subarea}`,
    art: isFinal ? map.bossArt : map.guardianArt,
    isBoss: true,
    isFinalBoss: isFinal,
    level,
    hpMax,
    hp: hpMax,
    dmg: dmgForLevel(map, level) * COMBAT.bossDmgMult,
  };
}

// Pack completo da subárea atual (tamanhos do GDD §4)
export function spawnPack(map, subarea) {
  const size = map.packSizes[subarea - 1];
  return Array.from({ length: size }, () => spawnMob(map, subarea));
}

// Mapa atual conforme state.map (1-indexado). Aceita state ou nada (default Map 1).
export function getCurrentMap(state) {
  const id = state && state.map ? state.map : 1;
  return MAPS[id - 1] || MAPS[0];
}
