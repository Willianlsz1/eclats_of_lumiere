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

  // ---------- estrutura de inimigos (ENEMY_STRUCTURE_V1) ----------
  // helpers de threshold/chance — leem placeholders de data.balance + passivas Fracture.
  areaHasMiniBoss(area) { return !!(area.miniBoss || area.miniBossRandom); },
  areaHasElite(area) { return area.id !== 1; }, // Área 1 só Common/Rare/Boss

  // kills até o Mini Boss (reduzido pela passiva Fracture "miniBossThreshold")
  miniBossRequired() {
    const base = G.data.balance.miniBossKillsRequired;
    const red = G.passives ? (G.passives.effect("miniBossThreshold") || 0) / 100 : 0;
    return Math.max(1, Math.ceil(base * Math.max(0, 1 - red)));
  },
  bossRespawnRequired() { return Math.max(1, G.data.balance.bossRespawnKillsRequired); },
  // chance de Elite (somada pela passiva Fracture "eliteChance")
  eliteChance() {
    const base = G.data.balance.eliteChance || 0;
    const add = G.passives ? (G.passives.effect("eliteChance") || 0) / 100 : 0;
    return G.util.clamp(base + add, 0, 1);
  },

  // decide o TIPO do próximo encontro (boss > miniBoss > elite > common/rare).
  // thresholds/chances são placeholders — nenhum número é final.
  chooseEncounter(area, atCap, rng) {
    rng = rng || Math.random;
    const d = G.state.data;
    if (atCap && area.boss && !d.bossOnCooldown) return "boss";
    if (this.areaHasMiniBoss(area) && (d.miniBossProgress || 0) >= this.miniBossRequired()) return "miniBoss";
    if (this.areaHasElite(area) && rng() < this.eliteChance()) return "elite";
    return "common"; // (Rare é decidido dentro do ramo common)
  },

  // Mini Boss da área (Área 9: sorteia entre os Mini Bosses das áreas anteriores)
  pickMiniBoss(area, rng) {
    if (area.miniBossRandom) {
      const pool = [];
      for (const a of G.data.areas) if (a.miniBoss) pool.push(a.miniBoss);
      if (pool.length) return rng ? pool[Math.floor(rng() * pool.length)] : G.util.pick(pool);
      return area.boss || { name: "Mini Boss", sprite: "🔱" };
    }
    return area.miniBoss;
  },

  // ----- cria o próximo inimigo (vida exponencial no nível do MOB) -----
  spawn() {
    const b = G.data.balance;
    const area = G.data.currentArea();
    // nível do mob = SEU nível (sobe junto com o player), limitado à faixa da área
    const level = G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
    const atCap = G.state.data.level >= area.levelRange[1];

    // contadores de threshold são por SESSÃO de área: zeram ao trocar de área
    if (this._lastAreaIndex !== G.state.data.areaIndex) {
      this._lastAreaIndex = G.state.data.areaIndex;
      G.state.data.miniBossProgress = 0;
      G.state.data.bossProgress = 0;
      G.state.data.bossOnCooldown = false;
    }
    // segurança (legado): área sem boss no teto libera a próxima
    if (atCap && !area.boss) this.unlockNext();

    const type = this.chooseEncounter(area, atCap);

    // HP em DOIS NÍVEIS: curva interna da área atual; ATK global no nível do mob.
    const hp = G.data.mobHpAt(level, area);
    const atk = b.mobAtkBase * Math.pow(b.mobAtkGrowth, level - 1);

    let def, maxHp = hp, dmg = atk, xp = b.baseXp * level, rarity = null;
    let isBoss = false, isElite = false, isMiniBoss = false, name;

    if (type === "boss") {
      def = area.boss; isBoss = true;
      maxHp = hp * b.bossHpMult; dmg = atk * b.bossDmgMult; xp *= b.bossRewardMult;
      name = def.name;
    } else if (type === "miniBoss") {
      def = this.pickMiniBoss(area); isMiniBoss = true;
      maxHp = hp * b.miniBossHpMult; dmg = atk * b.miniBossDmgMult; xp *= b.miniBossRewardMult;
      name = def.name;
      rarity = { tag: "Mini Boss", color: b.miniBossColor };
    } else if (type === "elite") {
      def = G.util.pick(this.enemyPool()); isElite = true;
      maxHp = hp * b.eliteHpMult; dmg = atk * b.eliteDmgMult; xp *= b.eliteRewardMult;
      name = def.name;
      rarity = { tag: "Elite", color: b.eliteColor };
    } else {
      // common pool, com chance de RARO / RARO+ (mais forte, nome de lore)
      def = G.util.pick(this.enemyPool());
      name = def.name;
      const rm = G.data.rareMobs;
      if (rm && G.util.chance(rm.chance)) {
        const r = G.util.chance(rm.plusChance) ? rm.plus : rm.rare;
        maxHp *= r.hpMult; dmg *= r.dmgMult; xp *= r.rewardMult;
        name = G.util.pick(r.names);
        rarity = { tag: r.tag, color: r.color };
      }
    }
    // gold-base ANCORADO à vida do mob (tipos mais fortes dão mais via HP maior)
    const lumens = maxHp * b.goldRatio;
    this.spawnCount++;

    this.enemy = {
      name,
      sprite: def.sprite,
      img: def.img,
      level,
      isBoss, isElite, isMiniBoss,
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
  // dano extra por TIPO de alvo (passivas Éclat: Boss Damage / Elite Damage)
  typeDamageMult() {
    if (!G.passives || !this.enemy) return 1;
    let m = 1;
    if (this.enemy.isBoss) m += (G.passives.effect("bossDmg") || 0) / 100;
    if (this.enemy.isElite) m += (G.passives.effect("eliteDmg") || 0) / 100;
    return m;
  },

  applyHitToEnemy(dmg, crit) {
    if (!this.enemy) return; // o mob já morreu antes do bolt chegar
    const m = this.typeDamageMult();
    if (m !== 1) dmg = Math.ceil(dmg * m);
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
    d.totalKills = (d.totalKills || 0) + 1; // acumulado (requisito de Awaken)
    if (e.isBoss) d.runBosses = (d.runBosses || 0) + 1;
    if ((d.runMaxAreaIndex || 0) < d.areaIndex) d.runMaxAreaIndex = d.areaIndex;

    // thresholds de encontro (ENEMY_STRUCTURE_V1) — infra; números placeholders
    if (e.isBoss) {
      // Boss derrotado: entra em cooldown e inicia novo threshold de respawn
      d.bossOnCooldown = true;
      d.bossProgress = 0;
    } else if (e.isMiniBoss) {
      // Mini Boss derrotado: o threshold reinicia
      d.miniBossProgress = 0;
    } else {
      // kills normais (common/rare/elite) avançam os thresholds
      d.miniBossProgress = (d.miniBossProgress || 0) + 1;
      if (d.bossOnCooldown) {
        d.bossProgress = (d.bossProgress || 0) + 1;
        if (d.bossProgress >= this.bossRespawnRequired()) d.bossOnCooldown = false; // boss volta a aparecer
      }
    }

    if (G.ui && G.ui.log)
      G.ui.log(
        (e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`,
        e.isBoss ? "boss" : "good"
      );

    // drops de materiais (fundação econômica — tabela/quantidades placeholders).
    // Alimenta gearMaterials/awakenMaterials; passivas Vestige/Fracture modulam.
    if (G.economy) G.economy.rollDrops(e);

    // descoberta de Mémoires (CP-2B — infra; chances placeholder, sem outra consequência)
    if (G.memoires) {
      const found = G.memoires.rollDiscovery({ enemy: e });
      if (found) G.memoires.find(found);
    }

    // fôlego: cura uma fração do HP a cada kill
    const heal = G.state.maxHp() * G.data.balance.healOnKillFrac;
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + heal);

    // loot DESLIGADO por enquanto (gear agora é 6 peças fixas que sobem de
    // nível com ouro). O sistema de drop/inventário fica reservado p/ futuro.
    // (O Awaken Material agora vem do sistema de drop — Mini Boss/Boss via
    //  economy.rollDrops; a antiga "Awakening Essence" por kill foi removida.)

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
