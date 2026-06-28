// =============================================================
// convergence.js — PRESTIGE (rebirth) + Pontos de Convergence
// =============================================================
// Convergence concede DOIS ganhos (híbrido):
//  1. Pontos de Convergence — gastos nas Árvores de Passivas (poder indireto).
//  2. Legacy — +atk%/+hp% direto por convergence, empilha permanente (poder na hora).
//
// Fórmula de pontos: Pontos = Área + Bosses + Nível + Kills.
// ⚠️ BALANCEAMENTO PENDENTE: os pesos abaixo são PLACEHOLDERS. Por padrão só o
// componente de NÍVEL está ativo (curva legacy); Área/Bosses/Kills entram com
// peso 0 até o balanceamento.
//
// Reseta: nível, XP, Lumens, área da run e os contadores da run.
// Mantém: gear, materiais, passivas, awaken, áreas liberadas, Pontos, recordes.

G.convergence = {
  gateLevel: 80,   // PLACEHOLDER (desbloqueio canônico = Área 3; balanceamento pendente)

  weights: { area: 0, boss: 0, level: 1, kills: 0 },
  // C = pontos na 1ª Convergence (Lv 80). 400 ≈ ~3 nós + 1-2 níveis.
  // k = achatamento da curva por nível. k baixo evita que convergir em níveis altos
  // (400-1000) exploda a renda. Com k=0.4: tier 1 de UMA árvore ≈ 10-11 convergences,
  // as 3 árvores ≈ 30, forçando priorização. Subir k acelera; baixar desacelera.
  legacy: { C: 400, k: 0.4 },

  inputs() {
    const d = G.state.data;
    return {
      area: ((d.runMaxAreaIndex != null ? d.runMaxAreaIndex : d.areaIndex) || 0) + 1,
      boss: d.runBosses || 0,
      level: d.level || 1,
      kills: d.runKills || 0,
    };
  },

  levelTerm(level) {
    if (level < this.gateLevel) return 0;
    return Math.floor(this.legacy.C * Math.pow(level / this.gateLevel, this.legacy.k));
  },

  components() {
    const i = this.inputs(), w = this.weights;
    return {
      area: w.area * i.area,
      boss: w.boss * i.boss,
      level: w.level * this.levelTerm(i.level),
      kills: w.kills * i.kills,
    };
  },

  rawPoints() {
    const c = this.components();
    return c.area + c.boss + c.level + c.kills;
  },

  points() {
    let p = this.rawPoints();
    if (G.passives) {
      p *= 1 + G.passives.effect("convPointsPct") / 100;
      p *= 1 + G.passives.effect("convEfficiency") / 100;
      p *= 1 + G.passives.effect("capstoneFracture") / 100;
      p = Math.max(p, G.passives.effect("convPointsMin"));
    }
    return Math.floor(p);
  },

  pointsFor(level) { return this.weights.level * this.levelTerm(level); },

  // bônus DIRETO por convergence (parte "quente" do híbrido): cada convergence
  // empilha +atk%/+hp% permanente. Os Pontos (acima) seguem alimentando passivas.
  legacyAtkPct() { return (G.state.data.convergences || 0) * G.data.balance.convLegacyAtkPct; },
  legacyHpPct()  { return (G.state.data.convergences || 0) * G.data.balance.convLegacyHpPct; },

  pending() { return this.canConverge() ? this.points() : 0; },
  canConverge() { return G.state.data.level >= this.gateLevel; },

  // renasce: zera nível/XP/Lumens/área e contadores da run, credita Pontos
  converge() {
    if (!this.canConverge()) return false;
    const d = G.state.data;
    const gained = this.pending();
    d.convergencePoints = (d.convergencePoints || 0) + gained;
    d.convergences = (d.convergences || 0) + 1;

    d.level = 1;
    d.xp = 0;
    d.lumens = 0;
    d.areaIndex = 0;
    d.runKills = 0;
    d.runBosses = 0;
    d.runMaxAreaIndex = 0;

    G.state.invalidateStats();
    d.hp = G.state.maxHp();

    G.combat.enemies = [];
    G.combat.enemy = null;
    G.combat.pendingHits = [];
    G.combat.respawnTimer = G.data.balance.respawnDelay;

    if (G.ui && G.ui.log)
      G.ui.log(`✦ Convergence — the Seeker breaks and begins anew. +${G.util.fmt(gained)} Convergence Points.`, "boss");
    if (G.ui) {
      if (G.ui.onAreaChange) G.ui.onAreaChange();
      if (G.ui.renderAll) G.ui.renderAll();
    }
    G.state.save();
    return true;
  },
};
