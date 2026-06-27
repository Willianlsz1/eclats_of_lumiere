// combat.js — loop central: ataques automáticos, ondas de inimigos, kill, death
//
// Wave system: areas 0-1 = 1 enemy/wave, areas 2-4 = 2/wave, areas 5-8 = 3/wave.
// Boss (at level cap) is always solo. Each enemy in a wave attacks simultaneously.
// Player targets enemies[0] (front); on kill the next enemy auto-engages.

G.combat = {
  enemies:          [],     // current wave (array); enemy = enemies[0]
  enemy:            null,   // alias for enemies[0]; kept for ui/convergence compat
  atkTimer:         0,
  respawnTimer:     0,
  pendingHits:      [],
  paused:           false,
  projectileTravel: 0.5,
  enemyInterval:    0.99,
  spawnCount:       0,
  _lastAreaIndex:   -1,

  // pool de mobs da área atual (acumula mobs de todas as áreas anteriores)
  enemyPool() {
    const idx  = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    const pool = [], seen = {};
    for (let i = 0; i <= idx; i++)
      for (const e of G.data.areas[i].enemies)
        if (!seen[e.name]) { seen[e.name] = 1; pool.push(e); }
    return pool;
  },

  // quantos inimigos por onda (boss é sempre solo)
  _packSize() {
    const area  = G.data.currentArea();
    const atCap = G.state.data.level >= area.levelRange[1];
    if (atCap && area.boss) return 1;
    const idx = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    return idx < 2 ? 1 : idx < 5 ? 2 : 3;
  },

  // constrói um inimigo individual (boss ou mob comum)
  _buildOne(isBossSpawn, def) {
    const b     = G.data.balance;
    const area  = G.data.currentArea();
    const level = G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
    const hp    = G.data.mobHpAt(level, area);
    const aIdx  = G.util.clamp(G.state.data.areaIndex || 0, 0, b.mobAtkByArea.length - 1);
    const atk   = b.mobAtkByArea[aIdx];

    let maxHp = hp, dmg = atk, xp = b.baseXp * level;
    let isBoss = false, isElite = false, name, rarity = null;

    if (isBossSpawn) {
      isBoss = true;
      maxHp *= b.bossHpMult; dmg *= b.bossDmgMult; xp *= b.bossRewardMult;
      name = def.name;
    } else {
      name = def.name;
      const em = G.data.eliteMob, rm = G.data.rareMobs;
      const eliteBonus = G.passives ? (G.passives.effect("eliteChance") || 0) / 100 : 0;
      if (em && aIdx >= em.minAreaIndex && G.util.chance(em.chance * (1 + eliteBonus))) {
        maxHp *= em.hpMult; dmg *= em.dmgMult; xp *= em.rewardMult;
        name = G.util.pick(em.names);
        rarity = { tag: em.tag, color: em.color };
        isElite = true;
      } else if (rm && G.util.chance(rm.chance)) {
        const r = G.util.chance(rm.plusChance) ? rm.plus : rm.rare;
        maxHp *= r.hpMult; dmg *= r.dmgMult; xp *= r.rewardMult;
        name = G.util.pick(r.names);
        rarity = { tag: r.tag, color: r.color };
      }
    }

    let lumens = maxHp * b.goldRatio;
    if (isBoss) lumens *= b.bossLumenMult;
    this.spawnCount++;

    return {
      name, sprite: def.sprite, img: def.img,
      level, isBoss, isElite,
      rarity: rarity ? { tag: rarity.tag, color: rarity.color } : null,
      maxHp:  Math.ceil(maxHp), hp: Math.ceil(maxHp),
      dmg:    Math.max(1, Math.ceil(dmg)),
      lumens: Math.ceil(lumens), xp: Math.ceil(xp),
      atkTimer: 0,   // per-enemy attack timer
    };
  },

  // spawna a próxima onda
  spawn() {
    const area  = G.data.currentArea();
    const atCap = G.state.data.level >= area.levelRange[1];
    const n     = this._packSize();
    this.enemies = [];

    if (atCap && area.boss) {
      this.enemies.push(this._buildOne(true, area.boss));
    } else {
      const pool = this.enemyPool();
      for (let i = 0; i < n; i++)
        this.enemies.push(this._buildOne(false, G.util.pick(pool)));
    }

    this.enemy = this.enemies[0];
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // ataque do Seeker → primeiro inimigo VIVO
  playerHit() {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    const s    = G.state.stats();
    const crit = G.util.chance(s.crit / 100);
    let raw    = s.atk * (crit ? s.critMult : 1);
    // specialDmg: rares & bosses
    if ((target.isBoss || target.rarity) && G.passives)
      raw *= 1 + (G.passives.effect("specialDmg") || 0) / 100;
    // bossDmg: bosses only
    if (target.isBoss && G.passives)
      raw *= 1 + (G.passives.effect("bossDmg") || 0) / 100;
    // eliteDmg: elites only (gear stat / passive) — agora tem alvo de verdade
    if (target.isElite)
      raw *= 1 + (s.eliteDmg || 0) / 100;
    const dmg = Math.ceil(raw);
    if (G.ui && G.ui.projectile) {
      G.ui.projectile("seeker");
      this.pendingHits.push({ side: "player", dmg, crit, travel: this.projectileTravel });
    } else {
      this.applyHitToEnemy(dmg, crit);
    }
  },

  // ataque de um mob específico
  enemyHit(enemy) {
    if (!enemy) return;
    const dmg = enemy.dmg;
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
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    if (G.ui && G.ui.floater) G.ui.floater(dmg, crit ? "crit" : "hit");
    target.hp -= dmg;
    if (target.hp <= 0) this.onKill();
    else if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  applyHitToHero(dmg) {
    const s = G.state.stats();
    const reduced = Math.max(1, Math.ceil(dmg * (1 - (s.damageReduction || 0) / 100)));
    if (G.ui && G.ui.floater) G.ui.floater(reduced, "enemy");
    G.state.data.hp -= reduced;
    if (G.state.data.hp <= 0) this.onDeath();
    if (G.ui && G.ui.renderHeroHp) G.ui.renderHeroHp();
  },

  // Seeker morreu: cura total, limpa onda
  onDeath() {
    G.state.data.hp = G.state.maxHp();
    if (G.ui && G.ui.log) G.ui.log("☠ The Seeker fell — recovered and returned.", "bad");
    this.pendingHits = [];
    this.enemies = [];
    this.enemy   = null;
    this.respawnTimer = G.data.balance.respawnDelay;
  },

  // inimigo (primeiro vivo) morreu: recompensas, marca como morto, avança onda se limpa
  onKill() {
    const e = this.enemies.find(e => !e.dead);
    if (!e) return;
    const s = G.state.stats();
    const lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));
    const xp     = Math.round(e.xp    * (1 + s.xpBonus    / 100));

    const d = G.state.data;
    d.lumens    += lumens;
    d.xp        += xp;
    d.totalKills = (d.totalKills || 0) + 1;
    d.runKills   = (d.runKills  || 0) + 1;
    if ((d.runMaxAreaIndex || 0) < d.areaIndex) d.runMaxAreaIndex = d.areaIndex;

    if (G.ui && G.ui.log)
      G.ui.log((e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`, e.isBoss ? "boss" : "good");

    const drops = G.economy ? G.economy.rollDrops(e) : {};
    if (G.ui && G.ui.materialDrop && Object.keys(drops).length) G.ui.materialDrop(drops);
    const healFrac = G.data.balance.healOnKillFrac + (s.healOnKill || 0) / 100;
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + G.state.maxHp() * healFrac);

    if (e.isBoss) this.markBossCleared();
    this.checkLevelUp();

    // marca como morto (permanece visível mas greyed-out até a onda limpar)
    e.dead = true;
    e.hp   = 0;
    this.enemy = this.enemies.find(e => !e.dead) || null;

    const anyAlive = this.enemies.some(e => !e.dead);
    if (anyAlive) {
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      if (G.ui && G.ui.renderAll)   G.ui.renderAll();
    } else {
      // onda limpa: mantém mortos visíveis um tick, inicia respawn
      this.respawnTimer = G.data.balance.respawnDelay;
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      if (G.ui && G.ui.renderAll)   G.ui.renderAll();
    }
  },

  // boss derrotado: libera próxima área (ou conclui o Mapa 1)
  markBossCleared() {
    const d = G.state.data;
    d.runBosses = (d.runBosses || 0) + 1;
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

  // avança o tempo
  tick(dt) {
    this.resolvePending(dt);

    const anyAlive = this.enemies.length > 0 && this.enemies.some(e => !e.dead);

    if (!anyAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.spawn();
      return;
    }

    // player attacks first living enemy
    this.atkTimer += dt;
    const interval = G.state.attackInterval();
    while (this.atkTimer >= interval) {
      this.atkTimer -= interval;
      this.playerHit();
      if (!this.enemies.some(e => !e.dead)) return;
    }

    // each living enemy attacks player on its own timer
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e || e.dead) continue;
      e.atkTimer += dt;
      while (e.atkTimer >= this.enemyInterval) {
        e.atkTimer -= this.enemyInterval;
        this.enemyHit(e);
        if (!this.enemies.some(e => !e.dead)) return;
      }
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
