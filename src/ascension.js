// =============================================================
// ascension.js — ASCENSION (CP-3E) — marco institucional / rank
// =============================================================
// Conforme CONTINENT1_CANON. A Ascension SUBSTITUI o rank por nível (data.tiers
// passa a ser indexado por ascensions na UI). No Continente 1 existe apenas a
// Ascension I: exige Awaken (First Light) + Boss Final (Área 20) + Era I
// Restaurada (3 Mémoires no Lv10) → concede o rank Illuminate.
// Sem novos recursos/camadas de poder: só registra o marco e o rank.

G.ascension = {
  // ranks da Ordre por nº de Ascensions (0 = Seeker, 1 = Illuminate, …).
  // Antes do Awaken o herói é "Endormi" (CANON_V2 §3-4) — estado pré-escada.
  RANKS: ["Seeker", "Illuminate", "Éclairé", "L'Éveillé", "Lumière"],

  count() { return G.state.data.ascensions || 0; },
  // herói desperto? (First Light concluído) — o Awaken é o que o torna um Seeker
  isAwakened() { return !!(G.awaken && G.awaken.isDone("first_light")); },
  rankIndex() { return G.util.clamp(this.count(), 0, this.RANKS.length - 1); },
  rank() { return this.isAwakened() ? this.RANKS[this.rankIndex()] : "Endormi"; },
  // código curto p/ a UI (T1…T5); "—" enquanto Endormi
  rankCode() { return this.isAwakened() ? "T" + (this.rankIndex() + 1) : "—"; },
  rankInfo() { return { code: this.rankCode(), name: this.rank() }; },

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
