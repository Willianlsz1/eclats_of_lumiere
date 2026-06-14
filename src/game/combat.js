// Núcleo de combate — modelo de ONDAS, estilo Gaiadon (ADR 0002, revisado).
// - BASE = SINGLE-TARGET: cada ataque atinge 1 mob (o primeiro vivo). Vale a âncora
//   "máx 1 kill por ataque" → kill rate ≤ APS (ancora a economia base).
// - CLEAVE / AoE (atingir vários/todos) é DESBLOQUEÁVEL por passiva/mecânica na
//   progressão (estilo Gaiadon: começa em 1, libera multi-alvo lá na frente). Quando
//   ligado, `cleaveTargets()` retorna >1 e o ataque excede o teto de kills. ⏳ o
//   unlock real (qual passiva, como escala) será wirado num CP de passivas.
// - Mob morto NÃO respawna: fica na cena (apagado) e para de causar dano. Só
//   quando TODA a onda é limpa é que a próxima onda surge. Reset da onda só
//   acontece ao trocar de subárea ou morrer.
// - Dano ao jogador = Σ dano dos mobs VIVOS da onda (contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.
// - Boss (CP-D): após o kill threshold (oculto), a próxima onda é o Guardião
//   (sozinho); derrotá-lo abre o gate da próxima subárea e vira loop recorrente.

import { COMBAT, NUMBER_CAP, FATE } from '../data/constants.js';
import { spawnPack, spawnBoss, spawnMob, getCurrentMap } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax, critChance, critDamageMult, playerDefesa, postArmorDR, enemyDefesa } from './stats.js';
import { awardKill } from './economy.js';
import { eclatsDripPerSec } from './ascension.js';
import { effectiveDifficulty } from './difficulty.js';
import { gearBossDmgMult, gearRegenMult } from './gear.js';
import { memoireSurvivalMult, memoireBossDmgMult, memoireEclatsAllMult, memoireDiffRewardMult } from './memoires.js';
import { passiveMobBonus } from './passives.js';

// Regen efetivo (§4): COMBAT.regenPerSec × afixo Regen do gear × #11 de la Résistance
const regenFactor = (state) => gearRegenMult(state) * memoireSurvivalMult(state);

// Monta a onda da subárea. Se já bateu o threshold, o Guardião entra JUNTO,
// substituindo 1 mob do pack (§4); na Sub 1 (pack de 1) ele vem sozinho.
function makeWave(state) {
  const map = getCurrentMap(state);
  const pack = spawnPack(map, state.subarea);
  // +cap de mobs: Fate Keeper A4 + passiva Void Awareness (rumo ao teto ~24)
  const extra = (state.ascensions >= 4 ? FATE.a4MobBonus : 0) + passiveMobBonus(state);
  for (let i = 0; i < extra; i++) pack.push(spawnMob(map, state.subarea));
  if (state.killsInSubarea >= map.bossKillThreshold) {
    pack[0] = spawnBoss(map, state.subarea);
  }
  // Dificuldade (§8): ×HP e ×dano nos mobs da onda
  const d = effectiveDifficulty(state);
  if (d.hpMult !== 1) {
    for (const m of pack) { m.hpMax *= d.hpMult; m.hp = m.hpMax; m.dmg *= d.hpMult; }
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

  // --- Ataques do jogador (só com alvo VIVO; senão pausa — não desperdiça golpes
  //     nem acumula timer durante o beat de troca de onda). ---
  const hasLive = state.enemies.some((m) => m.hp > 0);
  if (hasLive) {
    const interval = 1 / currentAPS(state);
    player.attackTimer += dt;
    while (player.attackTimer >= interval) {
      player.attackTimer -= interval;
      playerAttack(state, hpMax);
    }
  }

  // --- Onda limpa (todos mortos) → próxima onda APÓS um beat. Sem o beat, o novo
  //     mob substituía na hora o que ainda estava morrendo (projétil no ar) → parecia
  //     que "o mob virou outro". O beat deixa a morte animar e a posição esvaziar. ---
  if (state.enemies.length > 0 && !hasLive) {
    state.waveClearT = (state.waveClearT || 0) + dt;
    if (state.waveClearT >= COMBAT.waveClearDelay) {
      state.waveClearT = 0;
      nextWave(state);
    }
  } else {
    state.waveClearT = 0;
  }

  // --- Dano só dos mobs VIVOS (mortos ficam apagados até a onda virar) ---
  // Mitigação por razão/armadura (§4): dano_recebido = Σdano² / (defesa + Σdano).
  // Sem defesa (early, def=0) → Σdano²/Σdano = Σdano = comportamento original.
  // Camada % à parte (postArmorDR) aplicada DEPOIS da armadura.
  const packDps = state.enemies.reduce((sum, m) => sum + (m.hp > 0 ? m.dmg : 0), 0);
  const def = playerDefesa(state);
  const armored = packDps > 0 ? (packDps * packDps) / (def + packDps) : 0;
  player.hp -= armored * postArmorDR(state) * dt;

  // --- Regen contínuo de 1% HP máx/s (× afixo Regen do gear × #11 Résistance) ---
  player.hp = Math.min(hpMax, player.hp + hpMax * COMBAT.regenPerSec * regenFactor(state) * dt);

  // --- Drip de Éclats (§10): renda passiva após a A1, escala com o frontier ---
  // §8 dificuldade ×rewardMult · #13 du Vide amplia a recompensa · #12 du Temps Brisé = todos os Éclats
  const drip = eclatsDripPerSec(state)
    * effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireEclatsAllMult(state);
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

// Quantos mobs um ataque atinge. BASE = 1 (single-target — âncora "1 kill/ataque").
// O CLEAVE/AoE é DESBLOQUEÁVEL (passiva/mecânica); quando ligado, retorna >1 e o
// ataque limpa vários alvos. ⏳ TODO(CP passivas): ler o unlock real (qual passiva /
// como escala — ex.: +1 alvo por nível, ou "todos"). Hoje sempre 1 = base correto.
function cleaveTargets() {
  return 1;
}

// Um ataque: atinge os primeiros `cleaveTargets()` mobs vivos da onda (frente → trás).
// BASE = 1 (single-target). Cada mob atingido morre quando seu HP zera. SEM respawn —
// os mortos ficam na cena (apagados) até a onda inteira ser limpa.
function playerAttack(state, hpMax) {
  // Crit ⏳ provisório (GDD §16.6): rola UMA vez por ataque; vale pro golpe inteiro
  // (se/quando o cleave atingir vários, todos herdam o mesmo crit).
  const isCrit = Math.random() < critChance(state);
  const base = damagePerHit(state) * (isCrit ? critDamageMult(state) : 1);

  let remaining = cleaveTargets(); // BASE 1; >1 quando o AoE estiver desbloqueado
  for (const target of state.enemies) {
    if (remaining <= 0) break;
    if (target.hp <= 0) continue; // pula mortos (mantém a ordem frente → trás)
    remaining -= 1;
    // Dano em boss (§13/§11): afixo bossDmg do gear × #7 de la Chute — só no boss
    const bossMult = target.isBoss ? gearBossDmgMult(state) * memoireBossDmgMult(state) : 1;
    const raw = base * bossMult;
    // Defesa de INIMIGOS (§4, razão virada): hit = raw² / (def_inimigo + raw).
    // Early (def_inimigo=0) → hit = raw = comportamento original.
    const edef = enemyDefesa(state, target);
    const hit = edef > 0 ? (raw * raw) / (edef + raw) : raw;
    target.hp -= hit;
    // Fila dos números flutuantes (a UI consome; teto evita acúmulo em background)
    if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
    if (target.hp <= 0) {
      awardKill(state, target);
      // Regen on-kill: 2% do HP máx por kill (× afixo Regen × #11 Résistance)
      state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill * regenFactor(state));
      if (target.isBoss) onBossKill(state);
      else state.killsInSubarea += 1;
    }
  }
}

// Derrota do boss: abre o gate da próxima subárea e reinicia o ciclo
// (loop recorrente de recompensa — o boss volta a cada threshold).
function onBossKill(state) {
  const map = getCurrentMap(state);
  state.bossDefeated[state.subarea - 1] = true;
  state.unlockedSubarea = Math.max(state.unlockedSubarea, Math.min(map.subareaCount, state.subarea + 1));
  state.killsInSubarea = 0;
  // §8 redesign: vencer o Guardião da Sub 3 só DESTRAVA a Prova (bossDefeated[2]);
  // o Despertar agora é ato do jogador na tela (doDespertar, gasta Nitzotzot+Vestiges).
}

// Viagem entre mapas já alcançados (id ≤ maxMap). Guarda o progresso do mapa
// atual em mapProgress e restaura o do destino; mapas anteriores à fronteira
// já foram concluídos → entram com tudo liberado por padrão.
export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.mapProgress[state.map] = {
    subarea: state.subarea,
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
  };
  state.map = dest;
  const map = getCurrentMap(state);
  const saved = state.mapProgress[dest];
  const cleared = dest < state.maxMap; // mapa já concluído (a fronteira passou dele)
  state.unlockedSubarea = saved ? saved.unlockedSubarea : (cleared ? map.subareaCount : 1);
  // CP-2: bossDefeated com o comprimento do mapa destino (normaliza saves de 5 → 8)
  state.bossDefeated = Array.from({ length: map.subareaCount },
    (_, i) => (saved ? !!(saved.bossDefeated && saved.bossDefeated[i]) : cleared));
  state.subarea = Math.min(saved ? saved.subarea : 1, state.unlockedSubarea);
  state.killsInSubarea = saved ? saved.killsInSubarea : 0;
  state.bestSubareaRun = Math.max(state.bestSubareaRun, state.subarea);
  if (!state.player.dead) resetPack(state);
  return true;
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
