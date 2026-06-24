// combat.js — loop central: ataque automático, kill, death, áreas

G.combat = {
  enemy:           null,
  atkTimer:        0,
  enemyTimer:      0,
  respawnTimer:    0,
  pendingHits:     [],
  paused:          false,
  projectileTravel: 0.5,  // deve casar com a transição CSS (.projectile)
  enemyInterval:   0.99,
  spawnCount:      0,
  _lastAreaIndex:  -1,

  // pool de mobs da área atual (acumula mobs de todas as áreas anteriores)
  enemyPool() {
    const idx  = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    const pool = [], seen = {};
    for (let i = 0; i <= idx; i++)
      for (const e of G.data.areas[i].enemies)
        if (!seen[e.name]) { seen[e.name] = 1; pool.push(e); }
    return pool;
  },

  // spawna o próximo inimigo
  spawn() {
    const b    = G.data.balance;
    const area = G.data.currentArea();
    const level= G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
    const atCap= G.state.data.level >= area.levelRange[1];

    const hp  = G.data.mobHpAt(level, area);
    const atk = b.mobAtkBase * Math.pow(b.mobAtkGrowth, level - 1);

    let def, maxHp = hp, dmg = atk, xp = b.baseXp * level;
    let isBoss = false, name, rarity = null;

    if (atCap && area.boss) {
      // boss no teto de nível da área
      def = area.boss; isBoss = true;
      maxHp *= b.bossHpMult; dmg *= b.bossDmgMult; xp *= b.bossRewardMult;
      name = def.name;
    } else {
      // mob comum, com chance de variante rara
      def  = G.util.pick(this.enemyPool());
      name = def.name;
      const rm = G.data.rareMobs;
      if (rm && G.util.chance(rm.chance)) {
        const r = G.util.chance(rm.plusChance) ? rm.plus : rm.rare;
        maxHp *= r.hpMult; dmg *= r.dmgMult; xp *= r.rewardMult;
        name = G.util.pick(r.names);
        rarity = { tag: r.tag, color: r.color };
      }
    }

    const lumens = maxHp * b.goldRatio;
    this.spawnCount++;

    this.enemy = {
      name,
      sprite: def.sprite,
      img:    def.img,
      level,
      isBoss,
      rarity: rarity ? { tag: rarity.tag, color: rarity.color } : null,
      maxHp:  Math.ceil(maxHp),
      hp:     Math.ceil(maxHp),
      dmg:    Math.max(1, Math.ceil(dmg)),
      lumens: Math.ceil(lumens),
      xp:     Math.ceil(xp),
    };
    this.enemyTimer = 0;
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // ataque do Seeker — enfileira projétil ou aplica na hora (idle)
  playerHit() {
    if (!this.enemy) return;
    const s    = G.state.stats();
    const crit = G.util.chance(s.crit / 100);
    const dmg  = Math.ceil(s.atk * (crit ? s.critMult : 1));
    if (G.ui && G.ui.projectile) {
      G.ui.projectile("seeker");
      this.pendingHits.push({ side: "player", dmg, crit, travel: this.projectileTravel });
    } else {
      this.applyHitToEnemy(dmg, crit);
    }
  },

  // ataque do mob
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

  // resolve projéteis que chegaram ao alvo
  resolvePending(dt) {
    if (!this.pendingHits.length) return;
    const still = [];
    for (const h of this.pendingHits) {
      h.travel -= dt;
      if (h.travel > 0) { still.push(h); continue; }
      if (h.side === "player") this.applyHitToEnemy(h.dmg, h.crit);
      else                     this.applyHitToHero(h.dmg);
    }
    this.pendingHits = still;
  },

  applyHitToEnemy(dmg, crit) {
    if (!this.enemy) return;
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

  // Seeker morreu: cura total, inimigo volta com HP cheio
  onDeath() {
    G.state.data.hp = G.state.maxHp();
    if (G.ui && G.ui.log) G.ui.log("☠ The Seeker fell — recovered and returned.", "bad");
    this.pendingHits = [];
    this.enemy = null;
    this.respawnTimer = G.data.balance.respawnDelay;
  },

  // inimigo morreu: recompensas, cura, progressão
  onKill() {
    const e  = this.enemy;
    const s  = G.state.stats();
    const lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));
    const xp     = Math.round(e.xp    * (1 + s.xpBonus    / 100));

    G.state.data.lumens    += lumens;
    G.state.data.xp        += xp;
    G.state.data.totalKills = (G.state.data.totalKills || 0) + 1;

    if (G.ui && G.ui.log)
      G.ui.log((e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`, e.isBoss ? "boss" : "good");

    // cura por fôlego
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + G.state.maxHp() * G.data.balance.healOnKillFrac);

    if (e.isBoss) this.markBossCleared();
    this.checkLevelUp();
    this.enemy = null;
    this.respawnTimer = G.data.balance.respawnDelay;
    if (G.ui && G.ui.renderAll) G.ui.renderAll();
  },

  // boss derrotado: libera próxima área (ou conclui o Mapa 1 se é a última)
  markBossCleared() {
    const d = G.state.data;
    if (d.areaIndex < G.data.areas.length - 1) {
      this.unlockNext();
    } else if (!d.mapOneCleared) {
      d.mapOneCleared = true;
      if (G.ui && G.ui.log) {
        G.ui.log("✦ The Dreaming Wood falls silent. The Gilded Hollow is undone — Map 1 complete.", "boss");
        G.ui.log("✦ In the hush, a cold crystalline call echoes from deep below. Something deeper begins to wake.", "boss");
      }
    }
  },

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

  checkLevelUp() {
    while (G.state.data.xp >= G.state.xpToNext()) {
      G.state.data.xp -= G.state.xpToNext();
      G.state.data.level += 1;
      if (G.state.data.level > (G.state.data.highestLevel || 0)) G.state.data.highestLevel = G.state.data.level;
      G.state.invalidateStats();
      G.state.data.hp = G.state.maxHp();
      if (G.ui && G.ui.log) G.ui.log(`★ Level ${G.state.data.level}!`, "level");
    }
  },

  // avança o tempo (chamado pelo setInterval do main)
  tick(dt) {
    this.resolvePending(dt);

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

  // simula tempo offline de forma simplificada (sem UI)
  simulateIdle(seconds) {
    if (seconds < 5) return null;
    const capped = Math.min(seconds, 8 * 3600);
    const step   = Math.max(G.state.attackInterval(), G.data.balance.respawnDelay);
    const ticks  = Math.floor(capped / step);
    if (ticks <= 0) return null;

    const realUi = G.ui;
    G.ui = null;
    let done = 0;
    try { for (; done < ticks && done < 50000; done++) this.tick(step); }
    finally { G.ui = realUi; }
    return { seconds: done * step };
  },
};
