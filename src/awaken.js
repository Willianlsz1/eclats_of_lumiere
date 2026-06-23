// =============================================================
// awaken.js — AWAKEN: evolução permanente / marcos de progressão
// =============================================================
// Conforme docs/AWAKEN_V1.md. Apenas INFRAESTRUTURA — sem balanceamento.
// Requisitos são CONFIGURÁVEIS (data.awakens[].requirements); os números são
// placeholders. Cada Awaken encerra um capítulo (First Light = fim do Mapa 1).
//
// Estado persistente (state.js): awakens[] (ids concluídos), awakenTier (nº de
// awakens), awakenLevel (futuro). Requisitos suportados: area, level, kills,
// convergences e materials (consome awakenMaterials via economy.js).

G.awaken = {
  ALL() { return G.data.awakens; },
  def(id) { return G.data.awakens.find((a) => a.id === id); },

  // lista de awakens concluídos (canônico: data.awakens; alias legado: awakensUnlocked)
  done() { return G.state.data.awakens || G.state.data.awakensUnlocked || []; },
  isDone(id) { return this.done().indexOf(id) !== -1; },
  isUnlocked(id) { return this.isDone(id); }, // compat (UI antiga)

  // valor "alcançado" pelo jogador para cada chave de requisito
  playerValue(key) {
    const d = G.state.data;
    switch (key) {
      case "area": return (d.maxAreaUnlocked || 0) + 1;   // 1-based (área alcançada)
      case "level": return d.level || 1;
      case "kills": return d.totalKills || 0;             // acumulado (não reseta)
      case "convergences": return d.convergences || 0;
      default: return 0;
    }
  },

  // status detalhado dos requisitos (para a UI): [{ key, need, have, met }]
  requirements(id) {
    const a = this.def(id);
    if (!a || !a.requirements) return [];
    const r = a.requirements;
    const out = [];
    // passiva Fracture: awakenReqReduction reduz os LIMIARES numéricos (não a Área)
    const red = G.passives ? (G.passives.effect("awakenReqReduction") || 0) / 100 : 0;
    const factor = Math.max(0, 1 - red);
    for (const key of ["area", "level", "kills", "convergences"]) {
      if (r[key] == null) continue;
      const need = key === "area" ? r[key] : Math.ceil(r[key] * factor);
      const have = this.playerValue(key);
      out.push({ key, need, have, met: have >= need });
    }
    if (r.materials) {
      for (const mk of Object.keys(r.materials)) {
        const have = G.economy ? G.economy.getAwaken(mk) : 0;
        out.push({ key: "material:" + mk, need: r.materials[mk], have, met: have >= r.materials[mk] });
      }
    }
    return out;
  },

  meetsRequirements(id) { return this.requirements(id).every((r) => r.met); },
  canAwaken(id) { return !!this.def(id) && !this.isDone(id) && this.meetsRequirements(id); },
  canUnlock(id) { return this.canAwaken(id); }, // compat

  // realiza o Awaken: consome materiais, marca concluído, sobe tier
  awaken(id) {
    if (!this.canAwaken(id)) return false;
    const a = this.def(id), d = G.state.data;
    const mats = (a.requirements && a.requirements.materials) || {};
    for (const mk of Object.keys(mats)) if (G.economy) G.economy.addAwaken(mk, -mats[mk]);
    if (!Array.isArray(d.awakens)) d.awakens = [];
    d.awakens.push(id);
    d.awakensUnlocked = d.awakens;                 // mantém o alias legado em sincronia
    d.awakenTier = Math.max(d.awakenTier || 0, a.tier || d.awakens.length);
    G.state.invalidateStats();
    if (G.ui && G.ui.log) G.ui.log(`✦ Awakening: ${a.name} — the light stirs.`, "boss");
    if (G.ui && G.ui.renderAll) G.ui.renderAll();
    G.state.save();
    return true;
  },
  unlock(id) { return this.awaken(id); }, // compat (UI chama G.awaken.unlock)

  // injeta os bônus de TODOS os awakens concluídos nas camadas de stat.
  // (infra de bônus — magnitudes em data.awakens[].bonus são placeholders)
  applyTo(layer) {
    // passiva Fracture: awakenEfficiency amplifica os bônus (placeholder 0 → ×1)
    const eff = 1 + (G.passives ? (G.passives.effect("awakenEfficiency") || 0) / 100 : 0);
    for (const a of G.data.awakens) {
      if (!this.isDone(a.id)) continue;
      const b = a.bonus;
      if (!b) continue;
      if (b.atkMult) layer("atk").mult *= 1 + (b.atkMult - 1) * eff;
      if (b.hpMult) layer("hp").mult *= 1 + (b.hpMult - 1) * eff;
      if (b.critDmg) layer("critDmg").flat += b.critDmg * eff;
      if (b.crit) layer("crit").flat += b.crit * eff;
      if (b.lumensBonus) layer("lumensBonus").flat += b.lumensBonus * eff;
      if (b.xpBonus) layer("xpBonus").flat += b.xpBonus * eff;
    }
  },
};
