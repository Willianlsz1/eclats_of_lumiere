// =============================================================
// loot.js — geração de itens (a parte "dopamina" do jogo)
// =============================================================
// ⚠️ DORMENTE: o gear agora são 6 peças FIXAS (ver gear.js/data.js), então
// nada chama mais este módulo. Mantido como referência caso o loot volte
// como sistema de material/upgrade no futuro.
// Rola raridade -> afixos -> valores escalados pelo estágio.

G.loot = {
  _id: 1,

  // sorteia uma raridade pelo peso
  rollRarity() {
    const entries = G.data.rarities.map((r) => ({ item: r, weight: r.weight }));
    return G.util.weightedPick(entries);
  },

  // gera um item completo, escalado pelo nível do mob
  rollItem(level) {
    const rarity = this.rollRarity();
    const slot = G.util.pick(G.data.slots);
    const namePool = G.data.itemNames[slot.id];
    const baseName = G.util.pick(namePool);

    // escala cresce devagar com o nível
    const scale = 1 + level * 0.12;

    // escolhe afixos únicos
    const pool = [...G.data.affixes];
    const chosen = [];
    const n = Math.min(rarity.affixes, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = G.util.randInt(0, pool.length - 1);
      const af = pool.splice(idx, 1)[0];
      const layer = af.layer || "flat";
      // só a camada flat de atk/hp escala com o estágio; % e stats-% não
      const scales = layer === "flat" && (af.stat === "atk" || af.stat === "hp");
      let v = G.util.randFloat(af.value[0], af.value[1]) * rarity.mult;
      if (scales) v *= scale;
      // exibe "%" se for camada de bônus OU um stat que já é porcentagem
      const showPct = layer === "pct" || G.data.pctStats.indexOf(af.stat) !== -1;
      chosen.push({
        id: af.id,
        label: af.label,
        stat: af.stat,
        layer: layer,
        pct: showPct,
        value: Math.round(v),
      });
    }

    return {
      uid: this._id++,
      name: baseName,
      slot: slot.id,
      slotLabel: slot.label,
      rarity: rarity.id,
      rarityName: rarity.name,
      color: rarity.color,
      level: 1,
      affixes: chosen,
      // "poder" só pra ordenar/comparar rapidamente
      power: chosen.reduce((s, a) => s + a.value, 0),
    };
  },

  // chamado quando um inimigo morre — pode ou não dropar
  maybeDrop(level, isBoss) {
    const chance = isBoss ? 1.0 : G.data.balance.dropChance;
    if (!G.util.chance(chance)) return null;
    return this.rollItem(level);
  },
};
