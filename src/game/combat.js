// Núcleo de combate — GDD §4.
// - Jogador ataca um mob por vez (o de menor HP atual).
// - Cap físico: máximo de 1 kill por ataque — o hit atinge um único mob e o
//   excedente de dano se perde; kill rate nunca excede o APS atual.
// - Todos os mobs ativos causam dano ao jogador (Σ dano do pack, contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.

import { COMBAT } from '../data/constants.js';
import { spawnMob, spawnPack, getCurrentMap } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax } from './stats.js';
import { awardKill } from './economy.js';

// Reconstrói o pack da subárea atual (usado no boot, troca de subárea e respawn)
export function resetPack(state) {
  state.enemies = spawnPack(getCurrentMap(), state.subarea);
}

export function combatTick(state, dt) {
  const player = state.player;
  const hpMax = playerHpMax(state);

  // --- Morto: só conta o timer de respawn ---
  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.dead = false;
      player.hp = hpMax; // HP cheio, sem perdas
      player.attackTimer = 0;
      resetPack(state);
    }
    return;
  }

  // --- Ataques do jogador (acumulador respeita o intervalo do APS) ---
  const interval = 1 / currentAPS();
  player.attackTimer += dt;
  while (player.attackTimer >= interval) {
    player.attackTimer -= interval;
    playerAttack(state, hpMax);
  }

  // --- Dano dos mobs ativos (soma do pack, aplicado por segundo) ---
  const packDps = state.enemies.reduce((sum, m) => sum + m.dmg, 0);
  player.hp -= packDps * dt;

  // --- Regen contínuo de 1% HP máx/s ---
  player.hp = Math.min(hpMax, player.hp + hpMax * COMBAT.regenPerSec * dt);

  // --- Morte ---
  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = COMBAT.deathRespawnSeconds;
    state.subarea = Math.max(1, state.subarea - 1); // recua uma subárea
    state.enemies = [];
  }
}

// Um ataque: alvo único (menor HP), no máximo 1 kill, respawn imediato.
function playerAttack(state, hpMax) {
  if (state.enemies.length === 0) return;

  let target = state.enemies[0];
  for (const m of state.enemies) {
    if (m.hp < target.hp) target = m;
  }

  target.hp -= damagePerHit(state);
  if (target.hp <= 0) {
    awardKill(state, target);
    // Regen on-kill: 2% do HP máx
    state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill);
    // Respawn imediato: substitui o mob morto por um novo da subárea atual
    const idx = state.enemies.indexOf(target);
    state.enemies[idx] = spawnMob(getCurrentMap(), state.subarea);
  }
}

// Navegação provisória entre subáreas (a lógica real de boss/gate é CP-D)
export function changeSubarea(state, delta) {
  const map = getCurrentMap();
  const next = Math.min(map.subareaCount, Math.max(1, state.subarea + delta));
  if (next === state.subarea) return;
  state.subarea = next;
  if (!state.player.dead) resetPack(state);
}
