// =============================================================
// economy.js — FUNDAÇÃO ECONÔMICA: materiais + sistema de drop configurável
// =============================================================
// Apenas INFRAESTRUTURA — nenhum balanceamento. Probabilidades, quantidades e
// gates de área abaixo são PLACEHOLDERS configuráveis (não finais).
//
// Recursos novos (em G.state.data):
//   gearMaterials:   { common, uncommon }   → futuras promoções de raridade
//   awakenMaterials: { firstLight }          → First Light / Awakens

G.economy = {
  GEAR_MATERIALS: ["common", "uncommon"],
  AWAKEN_MATERIALS: ["firstLight"],

  // estrutura inicial dos materiais (fonte única p/ fresh e reconciliação)
  freshMaterials() {
    return {
      gearMaterials: { common: 0, uncommon: 0 },
      awakenMaterials: { firstLight: 0 },
    };
  },

  // garante os campos em saves antigos; nunca sobrescreve valores existentes.
  reconcile(data) {
    const f = this.freshMaterials();
    data.gearMaterials = Object.assign({}, f.gearMaterials, data.gearMaterials || {});
    data.awakenMaterials = Object.assign({}, f.awakenMaterials, data.awakenMaterials || {});
  },

  // ---- acesso / armazenamento ----
  getGear(kind) { const m = G.state.data.gearMaterials; return (m && m[kind]) || 0; },
  getAwaken(kind) { const m = G.state.data.awakenMaterials; return (m && m[kind]) || 0; },
  addGear(kind, n) { const m = G.state.data.gearMaterials; m[kind] = (m[kind] || 0) + n; },
  addAwaken(kind, n) { const m = G.state.data.awakenMaterials; m[kind] = (m[kind] || 0) + n; },

  // ================= SISTEMA DE DROP (configurável) =================
  // dropTable POR TIPO de inimigo. Cada material: { chance, min, max, minAreaIndex }.
  dropTable: {
    common:   { commonMaterial: { chance: 0.03, min: 1, max: 1, minAreaIndex: 2 } },
    rare:     { commonMaterial: { chance: 0.10, min: 1, max: 2, minAreaIndex: 2 } },
    elite:    {
      commonMaterial:   { chance: 1,   min: 1, max: 2, minAreaIndex: 2 },
      uncommonMaterial: { chance: 0.5, min: 1, max: 1, minAreaIndex: 4 },
    },
    miniBoss: {
      commonMaterial:   { chance: 1,   min: 2, max: 4, minAreaIndex: 2 },
      uncommonMaterial: { chance: 1,   min: 1, max: 2, minAreaIndex: 4 },
      awakenMaterial:   { chance: 0.5, min: 1, max: 1, minAreaIndex: 5 },
    },
    boss:     {
      commonMaterial:   { chance: 1,   min: 2, max: 4, minAreaIndex: 2 },
      uncommonMaterial: { chance: 1,   min: 1, max: 2, minAreaIndex: 4 },
      awakenMaterial:   { chance: 1,   min: 1, max: 1, minAreaIndex: 5 },
    },
  },

  // roteia a chave da tabela para o campo de inventário correspondente
  MATERIAL_SINK: {
    commonMaterial:   { bucket: "gear",   kind: "common" },
    uncommonMaterial: { bucket: "gear",   kind: "uncommon" },
    awakenMaterial:   { bucket: "awaken", kind: "firstLight" },
  },

  // tipo de drop de um inimigo (deriva das flags do enemy; elite/miniBoss = futuro)
  enemyType(enemy) {
    if (!enemy) return "common";
    if (enemy.isMiniBoss) return "miniBoss";
    if (enemy.isBoss) return "boss";
    if (enemy.isElite) return "elite";
    if (enemy.rarity) return "rare";
    return "common";
  },

  // multiplicador de QUANTIDADE vindo das passivas (placeholders → 1.0 hoje)
  passiveQtyMult(materialKey) {
    if (!G.passives) return 1;
    const e = G.passives.effects();
    const general = e.matGeneralPct || 0;
    let mult = (1 + (e.matQuantity || 0) / 100) * (1 + general / 100);
    if (materialKey === "commonMaterial")   mult *= 1 + (e.matCommonPct || 0) / 100;
    if (materialKey === "uncommonMaterial") mult *= 1 + (e.matUncommonPct || 0) / 100;
    if (materialKey === "awakenMaterial")   mult *= 1 + (e.awakenMatPct || 0) / 100;
    return mult;
  },

  // multiplicador de CHANCE vindo das passivas (Vestige: dropRate) — placeholder → 1.0
  passiveChanceMult() {
    if (!G.passives) return 1;
    return 1 + (G.passives.effect("dropRate") || 0) / 100;
  },

  // rola os drops de um inimigo morto, aplica no inventário e devolve { matKey: qty }.
  rollDrops(enemy, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const areaIndex = (opts.areaIndex != null) ? opts.areaIndex : ((G.state.data && G.state.data.areaIndex) || 0);
    const type = opts.type || this.enemyType(enemy);
    const table = this.dropTable[type];
    const out = {};
    if (!table) return out;
    const chanceMult = this.passiveChanceMult();
    for (const matKey of Object.keys(table)) {
      const d = table[matKey];
      if (areaIndex < (d.minAreaIndex || 0)) continue;
      const chance = Math.min(1, (d.chance || 0) * chanceMult);
      if (rng() >= chance) continue;
      const span = (d.max - d.min);
      const baseQty = d.min + (span > 0 ? Math.floor(rng() * (span + 1)) : 0);
      const qty = Math.max(0, Math.round(baseQty * this.passiveQtyMult(matKey)));
      if (qty <= 0) continue;
      const sink = this.MATERIAL_SINK[matKey];
      if (!sink) continue;
      if (sink.bucket === "gear") this.addGear(sink.kind, qty);
      else this.addAwaken(sink.kind, qty);
      out[matKey] = (out[matKey] || 0) + qty;
    }
    return out;
  },
};
