// =============================================================
// combat.js — o LOOP central: ataque automático, crítico, kill, idle
// =============================================================
// Estado transitório (não é salvo): o inimigo atual e os timers.
// A "parede de dificuldade": se o Seeker morre antes de matar o
// inimigo, ele cura por completo MAS o inimigo volta com vida cheia.
// É isso que faz o loot importar — você precisa de gear melhor.

G.combat = {
  enemy: null,
  atkTimer: 0,
  enemyTimer: 0,
  respawnTimer: 0, // contagem regressiva até o próximo mob aparecer
  pendingHits: [], // projéteis em voo: o dano aplica quando chegam
  projectileTravel: 0.5, // s — DEVE casar com a transição do .projectile no CSS (0.5s)
  enemyInterval: 0.99, // inimigo ataca a cada 0.99s (atk speed do mob)
  spawnCount: 0,

  // pool de mobs comuns disponível na área atual: todos os mobs das áreas
  // 0..areaIndex, sem repetir (dedupe por nome). Área 1 só tem os da 1; cada
  // área seguinte herda os anteriores + os seus.
  enemyPool() {
    const idx = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    const pool = [];
    const seen = {};
    for (let i = 0; i <= idx; i++) {
      for (const e of G.data.areas[i].enemies) {
        if (!seen[e.name]) { seen[e.name] = 1; pool.push(e); }
      }
    }
    return pool;
  },

  // ----- cria o próximo inimigo (vida exponencial no nível do MOB) -----
  spawn() {
    const b = G.data.balance;
    const area = G.data.currentArea();
    // nível do mob = SEU nível (sobe junto com o player), limitado à faixa da área
    const level = G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
    // chegou no teto da área => boss da área (se a área TIVER boss)
    const atCap = G.state.data.level >= area.levelRange[1];
    const isBoss = atCap && !!area.boss;
    // área SEM boss: ao atingir o teto, libera a próxima automaticamente
    if (atCap && !area.boss) this.unlockNext();

    // HP em DOIS NÍVEIS: curva interna da área atual (ver G.data.mobHpAt);
    // ATK segue crescimento global no nível do mob.
    const hp = G.data.mobHpAt(level, area);
    const atk = b.mobAtkBase * Math.pow(b.mobAtkGrowth, level - 1);

    let def, maxHp, dmg, lumens, xp, name, rarity = null;
    if (isBoss) {
      def = area.boss;
      maxHp = hp * b.bossHpMult;
      dmg = atk * b.bossDmgMult;
      xp = b.baseXp * level * b.bossRewardMult;
      name = def.name;
    } else {
      // pool cumulativo: mobs de TODAS as áreas até a atual (sorteado aleatório)
      def = G.util.pick(this.enemyPool());
      maxHp = hp;
      dmg = atk;
      xp = b.baseXp * level;
      name = def.name;
      // chance de virar RARO / RARO+ (mais forte, nome de lore, mais recompensa)
      const rm = G.data.rareMobs;
      if (rm && G.util.chance(rm.chance)) {
        rarity = G.util.chance(rm.plusChance) ? rm.plus : rm.rare;
        maxHp *= rarity.hpMult;
        dmg *= rarity.dmgMult;
        xp *= rarity.rewardMult;
        name = G.util.pick(rarity.names);
      }
    }
    // gold-base ANCORADO à vida do mob (boss/raro dão mais automaticamente via HP maior)
    lumens = maxHp * b.goldRatio;
    this.spawnCount++;

    this.enemy = {
      name,
      sprite: def.sprite,
      img: def.img,
      level,
      isBoss,
      rarity: rarity ? { tag: rarity.tag, color: rarity.color } : null,
      maxHp: Math.ceil(maxHp),
      hp: Math.ceil(maxHp),
      dmg: Math.max(1, Math.ceil(dmg)),
      lumens: Math.ceil(lumens),
      xp: Math.ceil(xp),
    };
    this.enemyTimer = 0;
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // ----- um ataque automático do Seeker -----
  // Com UI: dispara o projétil e ENFILEIRA o dano (aplica quando o bolt chega).
  // Sem UI (idle): aplica na hora.
  playerHit() {
    if (!this.enemy) return;
    const s = G.state.stats();
    let dmg = s.atk;
    const crit = G.util.chance(s.crit / 100);
    if (crit) dmg *= s.critMult;
    dmg = Math.ceil(dmg);

    if (G.ui && G.ui.projectile) {
      G.ui.projectile("seeker");
      this.pendingHits.push({ side: "player", dmg, crit, travel: this.projectileTravel });
    } else {
      this.applyHitToEnemy(dmg, crit);
    }
  },

  // ----- ataque do mob -----
  enemyHit() {
    if (!this.enemy) return;
    const dmg = this.enemy.dmg;
    if (G.ui && G.ui.projectile) {
      G.ui.projectile("mob");
      this.pendingHits.push({ side: "mob", dmg, travel: this.projectileTravel });
    } else {
      this.applyHitToHero(dmg);
    }
  },

  // ----- aplica o dano no impacto (quando o projétil chega) -----
  applyHitToEnemy(dmg, crit) {
    if (!this.enemy) return; // o mob já morreu antes do bolt chegar
    if (G.ui && G.ui.floater) G.ui.floater(dmg, crit ? "crit" : "hit");
    this.enemy.hp -= dmg;
    if (this.enemy.hp <= 0) this.onKill();
    else if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  applyHitToHero(dmg) {
    if (G.ui && G.ui.floater) G.ui.floater(dmg, "enemy");
    G.state.data.hp -= dmg;
    if (G.state.data.hp <= 0) this.onDeath();
    if (G.ui && G.ui.renderHeroHp) G.ui.renderHeroHp();
  },

  // ----- resolve os projéteis que chegaram ao alvo -----
  resolvePending(dt) {
    if (!this.pendingHits.length) return;
    const still = [];
    for (const h of this.pendingHits) {
      h.travel -= dt;
      if (h.travel > 0) { still.push(h); continue; }
      if (h.side === "player") this.applyHitToEnemy(h.dmg, h.crit);
      else this.applyHitToHero(h.dmg);
    }
    this.pendingHits = still;
  },

  // ----- Seeker morreu: cura total e recomeça o encontro -----
  onDeath() {
    G.state.data.hp = G.state.maxHp();
    if (G.ui && G.ui.log) G.ui.log("☠ The Seeker fell — recovered and returned to the fight.", "bad");
    this.pendingHits = [];
    this.enemy = null;
    this.respawnTimer = G.data.balance.respawnDelay;
  },

  // ----- inimigo morreu: recompensas, cura, loot, próximo -----
  onKill() {
    const e = this.enemy;
    const s = G.state.stats(); // bônus de passiva já embutidos em lumensBonus/xpBonus
    const lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));
    G.state.data.lumens += lumens;
    G.state.data.xp += Math.round(e.xp * (1 + s.xpBonus / 100));

    // contadores da run (alimentam a fórmula de Pontos de Convergence)
    const d = G.state.data;
    d.runKills = (d.runKills || 0) + 1;
    if (e.isBoss) d.runBosses = (d.runBosses || 0) + 1;
    if ((d.runMaxAreaIndex || 0) < d.areaIndex) d.runMaxAreaIndex = d.areaIndex;

    if (G.ui && G.ui.log)
      G.ui.log(
        (e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`,
        e.isBoss ? "boss" : "good"
      );

    // drops de materiais (fundação econômica — tabela/quantidades placeholders).
    // Alimenta gearMaterials/awakenMaterials; passivas Vestige/Fracture modulam.
    if (G.economy) G.economy.rollDrops(e);

    // fôlego: cura uma fração do HP a cada kill
    const heal = G.state.maxHp() * G.data.balance.healOnKillFrac;
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + heal);

    // loot DESLIGADO por enquanto (gear agora é 6 peças fixas que sobem de
    // nível com ouro). O sistema de drop/inventário fica reservado p/ futuro.

    // Awakening Essence: dropa na Área 7+ (índice 6+) — alimenta o Awaken
    const matMult = G.passives ? G.passives.materialsMult() : 1;
    if (G.state.data.areaIndex >= 6 && G.util.chance(G.data.balance.awakenDropChance * matMult)) {
      G.state.data.awakenEssence = (G.state.data.awakenEssence || 0) + 1;
    }

    // boss derrotado => LIBERA a próxima sub-área (o jogador decide quando avançar)
    if (e.isBoss) this.markBossCleared();

    this.checkLevelUp(); // o nível do mob sobe junto com o player (via XP), não por kill
    // mob some da tela e espera o delay antes do próximo aparecer
    this.enemy = null;
    this.respawnTimer = G.data.balance.respawnDelay;
    if (G.ui && G.ui.renderAll) G.ui.renderAll();
  },

  // libera a próxima sub-área (uso comum: boss derrotado OU área sem boss no teto).
  // Não avança sozinho — o jogador navega quando quiser.
  unlockNext() {
    const d = G.state.data;
    if (typeof d.maxAreaUnlocked !== "number") d.maxAreaUnlocked = d.areaIndex;
    if (d.areaIndex < G.data.areas.length - 1 && d.areaIndex + 1 > d.maxAreaUnlocked) {
      d.maxAreaUnlocked = d.areaIndex + 1;
      if (G.ui && G.ui.log) {
        const next = G.data.areas[d.areaIndex + 1];
        G.ui.log(`✦ ${next.name} unlocked — advance when ready.`, "good");
      }
      if (G.ui && G.ui.renderResources) G.ui.renderResources();
    }
  },

  // boss derrotado: libera a próxima; no clímax (última área), fecha o Mapa 1.
  markBossCleared() {
    const d = G.state.data;
    if (d.areaIndex < G.data.areas.length - 1) {
      this.unlockNext();
    } else if (!d.mapOneCleared) {
      // última sub-área = clímax do Mapa 1 (gancho pro Mapa 2)
      d.mapOneCleared = true;
      if (G.ui && G.ui.log) {
        G.ui.log("✦ The Dreaming Wood falls silent. The Gilded Hollow is undone — Map 1 complete.", "boss");
        G.ui.log("✦ In the hush, a cold crystalline call echoes from deep below: fragments singing in the Cavernes Luminis. Something deeper begins to wake.", "boss");
      }
    }
  },

  checkLevelUp() {
    while (G.state.data.xp >= G.state.xpToNext()) {
      G.state.data.xp -= G.state.xpToNext();
      G.state.data.level += 1;
      if (G.state.data.level > (G.state.data.highestLevel || 0)) G.state.data.highestLevel = G.state.data.level;
      G.state.invalidateStats(); // nível mudou → stats mudam (atk/hp base)
      G.state.data.hp = G.state.maxHp();
      if (G.ui && G.ui.log) G.ui.log(`★ Reached level ${G.state.data.level}!`, "level");
    }
  },

  // ----- avança o tempo (chamado pelo loop principal) -----
  tick(dt) {
    // aplica o dano dos projéteis que chegaram ao alvo
    this.resolvePending(dt);

    // sem mob na tela = esperando o respawn (nenhum combate nesse intervalo)
    if (!this.enemy) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.spawn();
      return;
    }

    this.atkTimer += dt;
    const interval = G.state.attackInterval();
    while (this.atkTimer >= interval) {
      this.atkTimer -= interval;
      this.playerHit();
      if (!this.enemy) break;
    }

    this.enemyTimer += dt;
    while (this.enemyTimer >= this.enemyInterval) {
      this.enemyTimer -= this.enemyInterval;
      this.enemyHit();
      if (!this.enemy) break;
    }
  },

  // ----- progresso offline: simula tempo ausente de forma simplificada -----
  simulateIdle(seconds) {
    if (seconds < 5) return null;
    const capped = Math.min(seconds, 8 * 3600);
    const interval = G.state.attackInterval();
    // step mínimo = respawnDelay para não subamostrar a fase de respawn
    const step = Math.max(interval, G.data.balance.respawnDelay);
    const ticks = Math.floor(capped / step);
    if (ticks <= 0) return null;

    const realUi = G.ui;
    G.ui = null;
    let done = 0;
    try {
      for (; done < ticks && done < 50000; done++) this.tick(step);
    } finally {
      G.ui = realUi;
    }
    // retorna os segundos REALMENTE simulados (não o tempo total afastado)
    return { seconds: done * step };
  },
};
