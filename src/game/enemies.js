// Inimigos — ✅ RELATIVOS AO PLAYER (recalibração 2026-06-17, decisão Willian:
// "números grandes, mobs te seguem"). HP/dano/nível derivam do PODER ATUAL do player,
// passado como `ctx = { dmg, hp, level }` pelo combate ao gerar a onda. Coerente por
// construção e imune ao reset da Convergence (mobs reescalam junto). Ver ENEMY em constants.
// As funções da malha geométrica (subareaLevelRange/hpForLevel) ficam por compat (unlock + UI).

import { MAPS, ENEMY, COMBAT, LEVEL } from '../data/constants.js';

let nextEnemyId = 1;

// ── Fatores por sub-área (1-indexada → índice n−1), com clamp seguro ──
const aIdx = (sub, n) => Math.max(0, Math.min((sub || 1) - 1, n - 1));
const areaHp  = (sub) => ENEMY.areaHp[aIdx(sub, ENEMY.areaHp.length)];
const areaDmg = (sub) => ENEMY.areaDmg[aIdx(sub, ENEMY.areaDmg.length)];
export const areaReward = (sub) => ENEMY.areaReward[aIdx(sub, ENEMY.areaReward.length)];

// ── Escala pelo BASELINE DO NÍVEL (não pelo dano/HP já multiplicado) ──
// HP/dano do mob seguem só o que o NÍVEL dá (base + nível×perLevel). Assim os
// MULTIPLICADORES do player (gear/convergence/despertar) EXCEDEM o baseline → você mata
// em MENOS golpes e sobrevive MAIS conforme investe. Poder importa; e o mob fica no seu nível.
const baselineDmg = (lvl) => COMBAT.baseDmg + (lvl || 1) * LEVEL.dmgPerLevel;
const baselineHp  = (lvl) => COMBAT.playerBaseHp + (lvl || 1) * LEVEL.hpPerLevel;

const mobLevelOf = (ctx, sub) => Math.max(1, Math.round((ctx.level || 1) * (1 + ENEMY.levelPerArea * ((sub || 1) - 1))));
// ✅ MURALHA (18/jun): HP do mob é FIXO por área (não escala com o player) — a parede que seu dano
// tem que furar. Geométrico ×hpWallRatio por área. (O dano do mob segue relativo — mobDmgOf.)
export const mobWallHp = (sub) => (ENEMY.hpWall && ENEMY.hpWall[(sub || 1) - 1] != null)
  ? ENEMY.hpWall[(sub || 1) - 1]
  : ENEMY.hpWallBase * ENEMY.hpWallRatio ** ((sub || 1) - 1);
const mobHpOf    = (ctx, sub) => Math.max(1, mobWallHp(sub));
// DANO = % do seu HP REAL (atual) → perigo persiste (mobs sempre podem matar). A defesa real é
// matar rápido (ofensa). Onda inteira = HP_real × dmgFrac × areaDmg; por mob = /pack.
const packBaseOf = (map, sub) => Math.max(1, (map.packSizes[(sub || 1) - 1] || 1));
const mobDmgOf   = (ctx, map, sub) => Math.max(0, (ctx.hp || 1) * ENEMY.dmgFrac * areaDmg(sub) / packBaseOf(map, sub));

// ── Malha geométrica (LEGADO): bounds de level por sub-área — usada só pelo gate de
//    unlock por nível e por estimativas de UI. Não dita mais HP/dano dos mobs. ──
function subareaRatio(map) {
  return (map.lvlHi / map.lvlLo) ** (1 / map.subareaCount);
}
export function subareaLevelRange(map, subarea) {
  const r = subareaRatio(map);
  return { lo: map.lvlLo * r ** (subarea - 1), hi: map.lvlLo * r ** subarea };
}
function interp(map, level, lo, hi) {
  const t = (Math.log(level) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
  return lo * (hi / lo) ** t;
}
export function hpForLevel(map, level) { return interp(map, level, map.hpLo, map.hpHi); }
export function dmgForLevel(map, level) { return interp(map, level, map.dmgLo, map.dmgHi); }

// ── Spawns (player-relativo): recebem ctx = { dmg, hp, level } ──
const CTX0 = { dmg: 1, hp: 1, level: 1 };

export function spawnMob(map, subarea, ctx = CTX0) {
  const id = nextEnemyId++;
  const k = id % map.enemyNames.length; // trio do mapa
  const hpMax = mobHpOf(ctx, subarea);
  return {
    id,
    name: map.enemyNames[k],
    art: map.enemyArts[k],
    frame: 'frames.enemy_universal',
    level: mobLevelOf(ctx, subarea),
    hpMax,
    hp: hpMax,
    dmg: mobDmgOf(ctx, map, subarea),  // dano/s ao jogador (onda inteira ~ HP × dmgFrac × areaDmg)
    rewardMult: areaReward(subarea),   // XP/Lumens crescem com a profundidade (economia)
  };
}

// Boss da sub-área: mob × bossHpMult (HP) e × bossDmgMult (dano). Só a ÚLTIMA = boss final.
export function spawnBoss(map, subarea, ctx = CTX0) {
  const isFinal = subarea === map.subareaCount;
  const hpMax = mobHpOf(ctx, subarea) * ENEMY.bossHpMult;
  return {
    id: nextEnemyId++,
    name: isFinal ? map.bossName : `Guardian — Sub-area ${subarea}`,
    art: isFinal ? map.bossArt : map.guardianArt,
    frame: isFinal ? `frames.boss_m${map.id}` : 'frames.enemy_universal',
    isBoss: true,
    isFinalBoss: isFinal,
    level: mobLevelOf(ctx, subarea),
    hpMax,
    hp: hpMax,
    dmg: mobDmgOf(ctx, map, subarea) * ENEMY.bossDmgMult,  // boss ≈ bossDmgMult mobs
    rewardMult: areaReward(subarea),
  };
}

// Pack completo da sub-área atual (tamanhos do GDD §4)
export function spawnPack(map, subarea, ctx = CTX0) {
  const size = map.packSizes[subarea - 1];
  return Array.from({ length: size }, () => spawnMob(map, subarea, ctx));
}

// Mapa atual conforme state.map (1-indexado). Aceita state ou nada (default Map 1).
export function getCurrentMap(state) {
  const id = state && state.map ? state.map : 1;
  return MAPS[id - 1] || MAPS[0];
}
