// Combate — CP-3 (redesign Mapa 1): SINGLE-TARGET relativo + navegação por nível (CP-2).
// - Ataques no ritmo do Atk Speed; cada ataque atinge 1 mob (o 1º vivo) → máx 1 kill/ataque.
// - Dano do pack vivo bate no player (mitigado pela Defesa); regen 1%/s; morte → respawn 3s.
// - Onda limpa → próxima após um beat. Boss invocado ao bater o threshold de kills da área.

import { COMBAT } from '../data/constants.js';
import { spawnPack, spawnBoss, getCurrentMap, subareaLevelRange } from './enemies.js';
import {
  runLevel, playerHpMax, currentAPS, damagePerHit, critChance, critDamageMult, veilFactor,
} from './stats.js';
import { awardKill } from './economy.js';
import { rollDrop, gearRegenBonus, gearBossDmgMult } from './gear.js';

// Monta a onda da área: boss sozinho se bateu o threshold; senão o pack.
function makeWave(state) {
  const map = getCurrentMap(state);
  if (state.killsInSubarea >= map.bossKillThreshold) {
    return [spawnBoss(state, map, state.subarea)];
  }
  return spawnPack(state, map, state.subarea);
}

export function resetPack(state) {
  state.wave = 1;
  state.waveClearT = 0;
  state.enemies = makeWave(state);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss && m.hp > 0);
}

// ───── Tick de combate ─────
export function combatTick(state, dt) {
  const player = state.player;
  const hpMax = playerHpMax(state);

  // Morto: só conta o respawn.
  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.dead = false;
      player.hp = hpMax;
      player.attackTimer = 0;
      resetPack(state);
    }
    return;
  }

  // Ataques (só com alvo vivo).
  const hasLive = state.enemies.some((m) => m.hp > 0);
  if (hasLive) {
    const interval = 1 / currentAPS(state);
    player.attackTimer += dt;
    let guard = 0;
    while (player.attackTimer >= interval && guard < 200) {
      player.attackTimer -= interval;
      playerAttack(state, hpMax);
      guard += 1;
    }
  }

  // Onda limpa → próxima após um beat (deixa a morte animar).
  if (state.enemies.length > 0 && !hasLive) {
    state.waveClearT = (state.waveClearT || 0) + dt;
    if (state.waveClearT >= COMBAT.waveClearDelay) {
      state.waveClearT = 0;
      state.wave += 1;
      state.enemies = makeWave(state);
    }
  } else {
    state.waveClearT = 0;
  }

  // Dano dos mobs VIVOS → mitigado pela Defesa (veilFactor; stub gear = 0).
  const packDps = state.enemies.reduce((s, m) => s + (m.hp > 0 ? m.dmg : 0), 0);
  if (packDps > 0) player.hp -= packDps * (1 - veilFactor(state)) * dt;

  // Regen contínuo (1% HP máx/s + afixo Regen do gear).
  player.hp = Math.min(hpMax, player.hp + hpMax * (COMBAT.regenPerSec + gearRegenBonus(state)) * dt);

  // Morte: respawna na mesma área; o boss some (precisa farmar o threshold de novo).
  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = COMBAT.deathRespawnSeconds;
    state.killsInSubarea = 0;
    state.wave = 1;
    state.enemies = [];
  }
}

// Um ataque: atinge o 1º mob vivo (single-target). Máx 1 kill por ataque.
function playerAttack(state) {
  const target = state.enemies.find((m) => m.hp > 0);
  if (!target) return;
  const isCrit = Math.random() < critChance(state);
  const bossMult = target.isBoss ? gearBossDmgMult(state) : 1;
  const hit = damagePerHit(state) * (isCrit ? critDamageMult(state) : 1) * bossMult;
  target.hp -= hit;
  if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
  if (target.hp <= 0) {
    awardKill(state, target);
    rollDrop(state, target); // CP-4: chance de drop por kill
    if (target.isBoss) onBossKill(state);
    else state.killsInSubarea += 1;
  }
}

function onBossKill(state) {
  state.killsInSubarea = 0;
  if (Array.isArray(state.bossDefeated)) state.bossDefeated[state.subarea - 1] = true;
}

// ───── Navegação de áreas por NÍVEL (CP-2) ─────
export function subareaUnlockLevel(map, n) {
  if (n <= 1) return 0;
  const gates = map.gates;
  if (gates && gates[n - 1] != null) return gates[n - 1];
  return Math.max(1, Math.round(subareaLevelRange(map, n).lo));
}

export function updateUnlockByLevel(state) {
  const map = getCurrentMap(state);
  const lvl = runLevel(state);
  let u = state.unlockedSubarea || 1;
  while (u < map.subareaCount && lvl >= subareaUnlockLevel(map, u + 1)) u += 1;
  if (u !== state.unlockedSubarea) state.unlockedSubarea = u;
}

export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

export function enterSubarea(state, n) {
  updateUnlockByLevel(state);
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  state.killsInSubarea = 0;
  state.bestSubareaRun = Math.max(state.bestSubareaRun || 1, next);
  resetPack(state);
}

export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.map = dest;
  state.killsInSubarea = 0;
  resetPack(state);
  return true;
}
