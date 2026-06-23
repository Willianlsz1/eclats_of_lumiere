// =============================================================
// convergence.js — PRESTIGE (rebirth) + Pontos de Convergence
// =============================================================
// Conforme docs/CONVERGENCE_FINAL.md. Convergence NÃO concede poder direto:
// concede apenas Pontos de Convergence, gastos nas Árvores de Passivas.
//
// Fórmula de pontos (estrutura canônica): Pontos = Área + Bosses + Nível + Kills.
// Importância relativa ALVO: Área > Bosses > Nível > Kills.
//
// ⚠️ BALANCEAMENTO PENDENTE: os pesos abaixo são PLACEHOLDERS configuráveis.
// Por padrão, apenas o componente de NÍVEL está ativo e reproduz a economia de
// pontos atual (curva legacy C·(nível/gate)^k); Área/Bosses/Kills entram com
// peso 0 (presentes na estrutura, sem efeito) até o balanceamento. Ligar/ajustar
// = editar `weights` e, se quiser, `legacy`. Nada aqui deve ser tido como final.
//
// Reseta: nível, XP, progresso/área da run e os contadores da run.
// Mantém: gear, raridades, materiais, passivas, awaken, áreas, Pontos, recordes.

G.convergence = {
  gateLevel: 80,   // PLACEHOLDER (desbloqueio canônico = Área 3; balanceamento pendente)

  // pesos da fórmula Área + Bosses + Nível + Kills (PLACEHOLDERS configuráveis)
  weights: { area: 0, boss: 0, level: 1, kills: 0 },
  // curva do componente de NÍVEL (placeholder = economia atual)
  legacy: { C: 80, k: 1.25 },

  // entradas da run usadas pela fórmula
  inputs() {
    const d = G.state.data;
    return {
      area: ((d.runMaxAreaIndex != null ? d.runMaxAreaIndex : d.areaIndex) || 0) + 1, // 1-based
      boss: d.runBosses || 0,
      level: d.level || 1,
      kills: d.runKills || 0,
    };
  },

  // componente de nível (placeholder): curva legacy, 0 abaixo do gate
  levelTerm(level) {
    if (level < this.gateLevel) return 0;
    return Math.floor(this.legacy.C * Math.pow(level / this.gateLevel, this.legacy.k));
  },

  // detalhamento dos pontos por componente (para UI/debug)
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

  // pontos finais (aplica modificadores de passiva — placeholders, hoje inertes)
  points() {
    let p = this.rawPoints();
    if (G.passives) {
      p *= 1 + G.passives.effect("convPointsPct") / 100;     // Fracture: + % de pontos
      p *= 1 + G.passives.effect("convEfficiency") / 100;    // Fracture: eficiência
      p *= 1 + G.passives.effect("capstoneFracture") / 100;  // Fracture: capstone híbrido (meta)
      p = Math.max(p, G.passives.effect("convPointsMin"));   // Fracture: mínimo garantido
    }
    return Math.floor(p);
  },

  // compat: estimativa de pontos por um nível (usa o componente legacy)
  pointsFor(level) { return this.weights.level * this.levelTerm(level); },

  pending() { return this.canConverge() ? this.points() : 0; },
  canConverge() { return G.state.data.level >= this.gateLevel; },

  // renasce: zera nível/XP/área e contadores da run, credita Pontos
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
    // contadores da run resetam
    d.runKills = 0;
    d.runBosses = 0;
    d.runMaxAreaIndex = 0;
    // thresholds de encontro também reiniciam
    d.miniBossProgress = 0;
    d.bossProgress = 0;
    d.bossOnCooldown = false;

    G.state.invalidateStats(); // nível zerou → stats recomputam antes de maxHp()
    d.hp = G.state.maxHp();

    G.combat.enemy = null;
    G.combat.pendingHits = []; // descarta projéteis em voo
    G.combat.respawnTimer = G.data.balance.respawnDelay;

    if (G.ui && G.ui.log)
      G.ui.log(
        `✦ Convergence — the Seeker breaks and begins anew. +${G.util.fmt(gained)} Convergence Points.`,
        "boss"
      );
    if (G.ui) {
      if (G.ui.onAreaChange) G.ui.onAreaChange();
      if (G.ui.renderAll) G.ui.renderAll();
    }
    G.state.save();
    return true;
  },
};
