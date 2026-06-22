// =============================================================
// economy.js — FUNDAÇÃO ECONÔMICA: materiais + sistema de drop configurável
// =============================================================
// Conforme docs/ECONOMY_FOUNDATION_V1.md. Apenas INFRAESTRUTURA — nenhum
// balanceamento. Probabilidades, quantidades e gates de área abaixo são
// PLACEHOLDERS configuráveis (não finais).
//
// Recursos novos (armazenados em G.state.data):
//   gearMaterials:   { common, uncommon }   → futuras promoções de raridade
//   awakenMaterials: { firstLight }          → futuro First Light / Awakens
// (Lumens/XP permanecem onde estão. awakenEssence legado fica intacto — o
//  rework de First Light está fora de escopo.)
//
// Consumo desses materiais (promoção, First Light) está FORA DE ESCOPO — aqui
// só criamos armazenamento, persistência, drop e a conexão com as passivas.

G.economy = {
  // chaves canônicas
  GEAR_MATERIALS: ["common", "uncommon"],
  AWAKEN_MATERIALS: ["firstLight"],

  // estrutura inicial dos materiais (fonte única p/ fresh e reconciliação)
  freshMaterials() {
    return {
      gearMaterials: { common: 0, uncommon: 0 },
      awakenMaterials: { firstLight: 0 },
    };
  },

  // garante os campos em saves antigos, inicializando NOVOS materiais com zero.
  // nunca sobrescreve valores já existentes.
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
  //   chance       — prob. base de cair (0..1)            [PLACEHOLDER]
  //   min/max      — faixa de quantidade                  [PLACEHOLDER]
  //   minAreaIndex — área mínima onde o material aparece   [PLACEHOLDER de introdução]
  // Tipos elite/miniBoss já estão definidos para quando esses inimigos existirem
  // (hoje os spawns produzem apenas common/rare/boss).
  dropTable: {
    common:   { commonMaterial: { chance: 1, min: 1, max: 1, minAreaIndex: 0 } },
    rare:     { commonMaterial: { chance: 1, min: 1, max: 2, minAreaIndex: 0 } },
    elite:    {
      commonMaterial:   { chance: 1,   min: 1, max: 2, minAreaIndex: 0 },
      uncommonMaterial: { chance: 0.5, min: 1, max: 1, minAreaIndex: 4 }, // Área 5 (placeholder)
    },
    miniBoss: {
      commonMaterial:   { chance: 1,   min: 2, max: 4, minAreaIndex: 0 },
      uncommonMaterial: { chance: 1,   min: 1, max: 2, minAreaIndex: 4 },
      awakenMaterial:   { chance: 0.5, min: 1, max: 1, minAreaIndex: 5 }, // Área 6 (placeholder)
    },
    boss:     {
      commonMaterial:   { chance: 1,   min: 2, max: 4, minAreaIndex: 0 },
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
  //   Vestige: matQuantity, matGeneralPct/matPct (gerais), matCommonPct/matUncommonPct
  //   Fracture: awakenMatPct
  passiveQtyMult(materialKey) {
    if (!G.passives) return 1;
    const e = G.passives.effects();
    const general = (e.matGeneralPct || 0) + (e.matPct || 0);
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
  // opts.rng / opts.areaIndex / opts.type permitem injeção determinística em testes.
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
      if (areaIndex < (d.minAreaIndex || 0)) continue;       // gate de introdução
      const chance = Math.min(1, (d.chance || 0) * chanceMult);
      if (rng() >= chance) continue;                          // não caiu
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
