// Combate — orquestra o tick: ataque por APS, kill+prêmio, regen, morte/respawn, gate.
import { PLAYER, AREAS } from '../data/constants.js';
import { playerDano, playerAPS, playerHpMax, levelFromXp } from './player.js';
import { spawnEnemy } from './enemy.js';
import { goldForKill, xpForKill } from './economy.js';

export function combatTick(state, dt) {
  const hpMax = playerHpMax(state);

  // Respawn sem punição (mantém XP/gold/áreas).
  if (state.player.dead) {
    state.player.respawnTimer -= dt;
    if (state.player.respawnTimer <= 0) {
      state.player.dead = false;
      state.player.hp = hpMax;
    }
    return;
  }

  if (!state.enemy) state.enemy = spawnEnemy(state);
  const e = state.enemy;

  // Ataques do player na cadência do APS (guard contra dt patológico).
  state.player.attackTimer += dt;
  const interval = 1 / playerAPS(state);
  let guard = 0;
  while (state.player.attackTimer >= interval && e.hp > 0 && guard < 1000) {
    state.player.attackTimer -= interval;
    guard += 1;
    const dmg = playerDano(state);
    e.hp -= dmg;
    state.fx.push({ kind: 'hit', amount: dmg });
    if (e.hp <= 0) {
      onKill(state, e);
      break;
    }
  }

  // Regen contínuo.
  state.player.hp = Math.min(hpMax, state.player.hp + hpMax * PLAYER.regenPerSec * dt);

  // Dano do mob (se vivo).
  if (state.enemy && state.enemy.hp > 0) {
    state.player.hp -= state.enemy.dmg * dt;
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.player.dead = true;
      state.player.respawnTimer = PLAYER.respawnSeconds;
    }
  }
}

function onKill(state, e) {
  const gold = goldForKill(e);
  state.gold += gold;
  state.xpTotal += xpForKill(e);
  state.killsTotal += 1;
  state.fx.push({ kind: 'gold', amount: gold });
  const hpMax = playerHpMax(state);
  state.player.hp = Math.min(hpMax, state.player.hp + hpMax * PLAYER.regenOnKill);
  state.enemy = null; // próximo spawna no próximo tick

  // Gate por nível: bater o cap destrava a próxima área (v0 = marca "Área 1 limpa").
  const area = AREAS[state.area - 1];
  if (levelFromXp(state.xpTotal) >= area.lvlCap && state.unlockedArea < state.area + 1) {
    state.unlockedArea = state.area + 1;
  }
}
