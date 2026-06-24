// gear.js — 6 peças fixas: level-up com Lumens

G.gear = {
  // retorna valor de um afixo no nível atual da peça
  affixValue(item, af) {
    return af.base + af.perLevel * ((item.level || 1) - 1);
  },

  // teto de nível pela raridade
  cap(item) {
    const r = G.data.rarities.find((r) => r.id === item.rarity);
    return r ? r.cap : 10;
  },

  isMaxed(item) { return (item.level || 1) >= this.cap(item); },

  // custo geométrico: base × growth^(nível-1)
  cost(item) {
    const b = G.data.balance;
    return Math.ceil(b.gearCostBase * Math.pow(b.gearCostGrowth, (item.level || 1) - 1));
  },

  // sobe 1 nível; devolve true se conseguiu
  levelUp(item) {
    if (this.isMaxed(item)) return false;
    const cost = this.cost(item);
    if (G.state.data.lumens < cost) return false;
    G.state.data.lumens -= cost;
    item.level = (item.level || 1) + 1;
    G.state.invalidateStats();
    return true;
  },

  // sobe N níveis de uma vez (n pode ser "max")
  levelUpTimes(item, n) {
    const times = n === "max" ? this.cap(item) - (item.level || 1) : n;
    let done = 0;
    for (let i = 0; i < times; i++) {
      if (this.levelUp(item)) done++;
      else break;
    }
    return done;
  },

  // monta uma peça a partir de gearBase + raridade
  buildPiece(slotId, rarityId) {
    const base   = G.data.gearBase[slotId];
    const slot   = G.data.slots.find((s) => s.id === slotId);
    const rarity = G.data.rarities.find((r) => r.id === rarityId) || G.data.rarities[0];
    const DISP_PCT = ["crit", "critDmg", "xpBonus", "lumensBonus"];
    return {
      slot:       slotId,
      slotLabel:  slot ? slot.label : slotId,
      name:       base.name,
      rarity:     rarity.id,
      rarityName: rarity.name,
      color:      rarity.color,
      level:      1,
      affixes:    base.affixes.map((a) => ({
        id:       a.id,
        label:    a.label,
        stat:     a.stat,
        layer:    a.layer || "flat",
        pct:      a.layer === "pct" || DISP_PCT.indexOf(a.stat) !== -1,
        base:     a.base,
        perLevel: a.perLevel,
      })),
    };
  },

  // conjunto inicial: todas as 6 peças no Lv.1, raridade Common
  freshSet() {
    const set = {};
    for (const slot of G.data.slots) set[slot.id] = this.buildPiece(slot.id, "common");
    return set;
  },

  // reconstrói as peças do save preservando nível (migra saves antigos)
  reconcile(saved) {
    const out = {};
    for (const slot of G.data.slots) {
      const prev   = saved && saved[slot.id];
      const rarity = (prev && prev.rarity && G.data.rarities.find((r) => r.id === prev.rarity))
        ? prev.rarity : "common";
      const piece  = this.buildPiece(slot.id, rarity);
      if (prev && prev.level) piece.level = Math.min(prev.level, this.cap(piece));
      out[slot.id] = piece;
    }
    return out;
  },
};
