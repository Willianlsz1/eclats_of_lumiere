// Núcleo de combate — GDD §4 (modelo de ONDAS, estilo Gaiadon).
// - Jogador ataca um mob por vez (o vivo de menor HP atual).
// - Cap físico: máximo de 1 kill por ataque — o hit atinge um único mob e o
//   excedente de dano se perde; kill rate nunca excede o APS atual.
// - Mob morto NÃO respawna: fica na cena (apagado) e para de causar dano. Só
//   quando TODA a onda é limpa é que a próxima onda surge. Reset da onda só
//   acontece ao trocar de subárea ou morrer.
// - Dano ao jogador = Σ dano dos mobs VIVOS da onda (contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.
// - Boss (CP-D): após o kill threshold (oculto), a próxima onda é o Guardião
//   (sozinho); derrotá-lo abre o gate da próxima subárea e vira loop recorrente.

import { COMBAT, NUMBER_CAP } from '../data/constants.js';
import { spawnPack, spawnBoss, getCurrentMap } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax, critChance, critDamageMult, playerDefesa, postArmorDR, enemyDefesa } from './stats.js';
import { awardKill } from './economy.js';
import { eclatsDripPerSec } from './ascension.js';

// Monta a onda da subárea. Se já bateu o threshold, o Guardião entra JUNTO,
// substituindo 1 mob do pack (§4); na Sub 1 (pack de 1) ele vem sozinho.
function makeWave(state) {
  const map = getCurrentMap(state);
  const pack = spawnPack(map, state.subarea);
  if (state.killsInSubarea >= map.bossKillThreshold) {
    pack[0] = spawnBoss(map, state.subarea);
  }
  return pack;
}

// Reinicia a onda (boot, troca de subárea, respawn) — zera a contagem de ondas.
export function resetPack(state) {
  state.wave = 1;
  state.enemies = makeWave(state);
}

// Próxima onda (após limpar a atual) — incrementa o contador.
function nextWave(state) {
  state.wave += 1;
  state.enemies = makeWave(state);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss && m.hp > 0);
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
  const interval = 1 / currentAPS(state);
  player.attackTimer += dt;
  while (player.attackTimer >= interval) {
    player.attackTimer -= interval;
    playerAttack(state, hpMax);
  }

  // --- Onda limpa (todos mortos) → próxima onda. NÃO há respawn individual. ---
  if (state.enemies.length > 0 && state.enemies.every((m) => m.hp <= 0)) {
    nextWave(state);
  }

  // --- Dano só dos mobs VIVOS (mortos ficam apagados até a onda virar) ---
  // Mitigação por razão/armadura (§4): dano_recebido = Σdano² / (defesa + Σdano).
  // Sem defesa (early, def=0) → Σdano²/Σdano = Σdano = comportamento original.
  // Camada % à parte (postArmorDR) aplicada DEPOIS da armadura.
  const packDps = state.enemies.reduce((sum, m) => sum + (m.hp > 0 ? m.dmg : 0), 0);
  const def = playerDefesa(state);
  const armored = packDps > 0 ? (packDps * packDps) / (def + packDps) : 0;
  player.hp -= armored * postArmorDR(state) * dt;

  // --- Regen contínuo de 1% HP máx/s ---
  player.hp = Math.min(hpMax, player.hp + hpMax * COMBAT.regenPerSec * dt);

  // --- Drip de Éclats (§10): renda passiva após a A1, escala com o frontier ---
  const drip = eclatsDripPerSec(state);
  if (drip > 0) state.eclats = Math.min(NUMBER_CAP, state.eclats + drip * dt);

  // --- Morte: recua uma subárea e a onda reinicia ---
  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = COMBAT.deathRespawnSeconds;
    state.subarea = Math.max(1, state.subarea - 1); // recua uma subárea
    state.killsInSubarea = 0; // boss some; o muro exige farmar de novo
    state.wave = 1;
    state.enemies = [];
  }
}

// Um ataque: alvo único = o mob VIVO de menor HP. Máx 1 kill. SEM respawn —
// o mob morto fica na cena (apagado) até a onda inteira ser limpa.
function playerAttack(state, hpMax) {
  let target = null;
  for (const m of state.enemies) {
    if (m.hp > 0 && (target === null || m.hp < target.hp)) target = m;
  }
  if (!target) return; // onda toda morta (será trocada no tick)

  // Crit ⏳ provisório (GDD §16.6): rola por ataque, multiplica o hit
  const isCrit = Math.random() < critChance(state);
  const raw = damagePerHit(state) * (isCrit ? critDamageMult(state) : 1);
  // Defesa de INIMIGOS (§4, razão virada): hit = raw² / (def_inimigo + raw).
  // Early (def_inimigo=0) → hit = raw = comportamento original.
  const edef = enemyDefesa(state, target);
  const hit = edef > 0 ? (raw * raw) / (edef + raw) : raw;
  target.hp -= hit;
  // Fila dos números flutuantes (a UI consome; teto evita acúmulo em background)
  if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
  if (target.hp <= 0) {
    awardKill(state, target);
    // Regen on-kill: 2% do HP máx
    state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill);
    if (target.isBoss) {
      onBossKill(state);
    } else {
      state.killsInSubarea += 1;
    }
    // sem respawn individual — o morto permanece até a onda limpar (nextWave)
  }
}

// Derrota do boss: abre o gate da próxima subárea e reinicia o ciclo
// (loop recorrente de recompensa — o boss volta a cada threshold).
function onBossKill(state) {
  const map = getCurrentMap(state);
  state.bossDefeated[state.subarea - 1] = true;
  state.unlockedSubarea = Math.max(state.unlockedSubarea, Math.min(map.subareaCount, state.subarea + 1));
  state.killsInSubarea = 0;
}

// Navegação entre subáreas, respeitando o gate (boss abre a próxima)
export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

// Entra direto numa subárea n (1-indexada), respeitando o gate da maior
// desbloqueada. Usado pela tela de Mapa (U-3) e pelas setas do Combate.
export function enterSubarea(state, n) {
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  state.killsInSubarea = 0; // threshold conta kills na subárea atual
  state.bestSubareaRun = Math.max(state.bestSubareaRun, next); // pontos da run (§6)
  if (!state.player.dead) resetPack(state);
}
