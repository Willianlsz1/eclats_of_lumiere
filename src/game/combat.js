// Núcleo de combate — GDD §4.
// - Jogador ataca um mob por vez (o de menor HP atual).
// - Cap físico: máximo de 1 kill por ataque — o hit atinge um único mob e o
//   excedente de dano se perde; kill rate nunca excede o APS atual.
// - Todos os mobs ativos causam dano ao jogador (Σ dano do pack, contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.
// - Boss (CP-D): após o kill threshold (oculto) entra no pack substituindo
//   1 mob; derrotá-lo abre o gate da próxima subárea e vira loop recorrente.

import { COMBAT } from '../data/constants.js';
import { spawnMob, spawnPack, spawnBoss, getCurrentMap } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax, critChance, critDamageMult } from './stats.js';
import { awardKill } from './economy.js';

// Reconstrói o pack da subárea atual (usado no boot, troca de subárea e respawn)
export function resetPack(state) {
  state.enemies = spawnPack(getCurrentMap(), state.subarea);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss);
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

  // --- Boss: atingiu o threshold oculto → substitui 1 mob do pack ---
  const map = getCurrentMap();
  if (!bossActive(state) && state.killsInSubarea >= map.bossKillThreshold) {
    state.enemies[0] = spawnBoss(map, state.subarea);
  }

  // --- Ataques do jogador (acumulador respeita o intervalo do APS) ---
  const interval = 1 / currentAPS(state);
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
    state.killsInSubarea = 0; // boss some; o muro exige farmar de novo
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

  // Crit ⏳ provisório (GDD §16.6): rola por ataque, multiplica o hit
  const isCrit = Math.random() < critChance(state);
  target.hp -= damagePerHit(state) * (isCrit ? critDamageMult(state) : 1);
  if (target.hp <= 0) {
    awardKill(state, target);
    // Regen on-kill: 2% do HP máx
    state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill);
    if (target.isBoss) {
      onBossKill(state);
    } else {
      state.killsInSubarea += 1;
    }
    // Respawn imediato: substitui o morto por um mob normal da subárea
    const idx = state.enemies.indexOf(target);
    state.enemies[idx] = spawnMob(getCurrentMap(), state.subarea);
  }
}

// Derrota do boss: abre o gate da próxima subárea e reinicia o ciclo
// (loop recorrente de recompensa — o boss volta a cada threshold).
function onBossKill(state) {
  const map = getCurrentMap();
  state.bossDefeated[state.subarea - 1] = true;
  state.unlockedSubarea = Math.max(state.unlockedSubarea, Math.min(map.subareaCount, state.subarea + 1));
  state.killsInSubarea = 0;
}

// Navegação entre subáreas, respeitando o gate (boss abre a próxima)
export function changeSubarea(state, delta) {
  const next = Math.min(state.unlockedSubarea, Math.max(1, state.subarea + delta));
  if (next === state.subarea) return;
  state.subarea = next;
  state.killsInSubarea = 0; // threshold conta kills na subárea atual
  if (!state.player.dead) resetPack(state);
}
