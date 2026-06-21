// =============================================================
// convergence.js — PRESTIGE (rebirth): zera o nível, ganha Pontos
// =============================================================
// O loop central do Mapa 1: você empurra fundo, CONVERGE (renasce),
// e os Pontos de Convergence compram passivas permanentes (tela própria,
// passada futura). Quanto mais fundo antes de convergir, mais pontos
// (curva super-linear, estilo Tap Titans 2 — "push before prestige").
//
// Reseta: nível da run (XP→0) + volta pra Área 1.
// Mantém: gear, materiais, Pontos, passivas, áreas desbloqueadas, recordes.

G.convergence = {
  gateLevel: 80, // nível mínimo p/ convergir (alinha com o stage 85 do TT2)
  C: 80,         // escala dos pontos (calibra na passada final de balanceamento)
  k: 1.25,       // expoente do "push" (1.1 = TT2 fiel · 1.25 = push médio escolhido)

  // pontos que você ganharia convergindo AGORA neste nível (0 abaixo do gate)
  pointsFor(level) {
    if (level < this.gateLevel) return 0;
    return Math.floor(this.C * Math.pow(level / this.gateLevel, this.k));
  },

  pending() { return this.pointsFor(G.state.data.level); },
  canConverge() { return G.state.data.level >= this.gateLevel; },

  // renasce: zera nível/XP/área, credita Pontos; o permanente fica
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
    G.state.invalidateStats(); // nível zerou → stats recomputam antes de maxHp()
    d.hp = G.state.maxHp();

    G.combat.enemy = null;
    G.combat.pendingHits = []; // descarta projéteis em voo (não vazam pro recomeço)
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
