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
import { passiveRegenAdd, passiveBossDmgMult } from './passives.js';

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
  armBossTimer(state);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss && m.hp > 0);
}

// Mecânica Tapper: arma o cronômetro quando há boss em cena; zera quando não há.
export function armBossTimer(state) {
  state.bossTimer = bossActive(state) ? COMBAT.bossTimeLimit : 0;
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
      playerAttack(state);
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
      armBossTimer(state);
    }
  } else {
    state.waveClearT = 0;
  }

  // Timer do boss (mecânica Tapper): se estourar sem matá-lo, o boss some e você
  // volta a farmar o pack da MESMA subárea (re-bate o threshold). Nunca vai pra trás.
  if (bossActive(state)) {
    state.bossTimer -= dt;
    if (state.bossTimer <= 0) {
      state.bossFails = (state.bossFails || 0) + 1;
      state.killsInSubarea = 0;
      state.wave = 1;
      state.enemies = makeWave(state);
      armBossTimer(state);
    }
  }

  // Dano dos mobs VIVOS → mitigado pela Defesa (veilFactor; stub gear = 0).
  const packDps = state.enemies.reduce((s, m) => s + (m.hp > 0 ? m.dmg : 0), 0);
  if (packDps > 0) player.hp -= packDps * (1 - veilFactor(state)) * dt;

  // Regen contínuo (1% HP máx/s + afixo Regen do gear).
  player.hp = Math.min(hpMax, player.hp + hpMax * (COMBAT.regenPerSec + gearRegenBonus(state) + passiveRegenAdd(state)) * dt);

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
// dmgMult: 1 no ataque automático; COMBAT.tapDmgMult no tap ativo.
function playerAttack(state, dmgMult = 1) {
  const target = state.enemies.find((m) => m.hp > 0);
  if (!target) return;
  const isCrit = Math.random() < critChance(state);
  const bossMult = target.isBoss ? gearBossDmgMult(state) * passiveBossDmgMult(state) : 1;
  const hit = damagePerHit(state) * dmgMult * (isCrit ? critDamageMult(state) : 1) * bossMult;
  target.hp -= hit;
  if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
  if (target.hp <= 0) {
    awardKill(state, target);
    rollDrop(state, target); // CP-4: chance de drop por kill
    if (target.isBoss) onBossKill(state);
    else state.killsInSubarea += 1;
  }
}

// Tap ativo (mecânica Tapper): um ataque manual extra no alvo atual, com crit próprio.
// Acionado pela UI (toque/segurar) por cima do combate automático.
export function tapAttack(state) {
  if (state.player.dead) return;
  if (!state.enemies.some((m) => m.hp > 0)) return;
  playerAttack(state, COMBAT.tapDmgMult);
}

function onBossKill(state) {
  state.killsInSubarea = 0;
  state.bossFails = 0; // venceu o boss: zera as falhas
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
