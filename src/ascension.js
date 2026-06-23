// =============================================================
// ascension.js — ASCENSION (CP-3E) — marco institucional / rank
// =============================================================
// Conforme CONTINENT1_CANON. A Ascension SUBSTITUI o rank por nível (data.tiers
// passa a ser indexado por ascensions na UI). No Continente 1 existe apenas a
// Ascension I: exige Awaken (First Light) + Boss Final (Área 20) + Era I
// Restaurada (3 Mémoires no Lv10) → concede o rank Illuminate.
// Sem novos recursos/camadas de poder: só registra o marco e o rank.

G.ascension = {
  // ranks da Ordre por nº de Ascensions (0 = Seeker, 1 = Illuminate, …)
  RANKS: ["Seeker", "Illuminate", "Éclairé", "L'Éveillé", "Lumière"],

  count() { return G.state.data.ascensions || 0; },
  rank() { return this.RANKS[G.util.clamp(this.count(), 0, this.RANKS.length - 1)]; },

  // requisitos da Ascension I (para a UI): [{ key, met }]
  requirements() {
    const d = G.state.data;
    return [
      { key: "awaken", label: "Awaken (First Light)", met: !!(G.awaken && G.awaken.isDone("first_light")) },
      { key: "bossFinal", label: "Boss Final (Área 20)", met: !!d.mapOneCleared },
      { key: "eraRestored", label: "Era I Restaurada", met: !!(G.memoires && G.memoires.isEraRestored(1)) },
    ];
  },

  // pode ascender? (só Ascension I no Continente 1; todos os requisitos atendidos)
  canAscend() {
    if (this.count() >= 1) return false;
    return this.requirements().every((r) => r.met);
  },

  // realiza a Ascension I → +1 ascension (rank Illuminate)
  ascend() {
    if (!this.canAscend()) return false;
    const d = G.state.data;
    d.ascensions = (d.ascensions || 0) + 1;
    if (G.ui && G.ui.log) G.ui.log("✦ Ascension I — the Ordre commissions you. Rank: Illuminate.", "boss");
    if (G.ui && G.ui.renderAll) G.ui.renderAll();
    G.state.save();
    return true;
  },
};
