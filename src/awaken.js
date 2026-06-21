// =============================================================
// awaken.js — AWAKEN: 3ª fonte de poder (desbloqueia na Área 7+)
// =============================================================
// Cada Awaken é um PACOTE de bônus que você DESBLOQUEIA (uma vez) gastando
// nível + Awakening Essence + Lumens. Uma vez aberto, os bônus são
// PERMANENTES (injetados nas camadas de stat; sobrevivem à Convergence).
// É o empurrão que cobre a reta final do Mapa 1, junto com gear + convergence.

G.awaken = {
  def(id) { return G.data.awakens.find((a) => a.id === id); },
  isUnlocked(id) { return (G.state.data.awakensUnlocked || []).indexOf(id) !== -1; },

  // requisitos atendidos p/ desbloquear este Awaken?
  canUnlock(id) {
    const a = this.def(id);
    const d = G.state.data;
    if (!a || this.isUnlocked(id)) return false;
    return (d.maxAreaUnlocked || 0) >= a.areaIndex &&
      d.level >= a.level &&
      (d.awakenEssence || 0) >= a.essence &&
      (d.lumens || 0) >= a.lumens;
  },

  unlock(id) {
    if (!this.canUnlock(id)) return false;
    const a = this.def(id);
    const d = G.state.data;
    d.awakenEssence -= a.essence;
    d.lumens -= a.lumens;
    if (!d.awakensUnlocked) d.awakensUnlocked = [];
    d.awakensUnlocked.push(id);
    G.state.invalidateStats();
    if (G.ui && G.ui.log) G.ui.log(`✦ Awakening: ${a.name} — the light stirs.`, "boss");
    if (G.ui && G.ui.renderAll) G.ui.renderAll();
    G.state.save();
    return true;
  },

  // injeta os bônus de TODOS os awakens desbloqueados nas camadas de stat.
  // chamado por state.stats() — `layer(stat)` devolve {flat,pct,mult}.
  applyTo(layer) {
    for (const a of G.data.awakens) {
      if (!this.isUnlocked(a.id)) continue;
      const b = a.bonus;
      if (b.atkMult) layer("atk").mult *= b.atkMult;
      if (b.hpMult) layer("hp").mult *= b.hpMult;
      if (b.critDmg) layer("critDmg").flat += b.critDmg;
      if (b.crit) layer("crit").flat += b.crit;
      if (b.lumensBonus) layer("lumensBonus").flat += b.lumensBonus;
      if (b.xpBonus) layer("xpBonus").flat += b.xpBonus;
    }
  },
};
