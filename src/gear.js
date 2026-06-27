// gear.js — 6 peças fixas: level-up com Lumens

G.gear = {
  // retorna valor de um afixo no nível atual da peça
  // af.step (opcional): ganho em DEGRAUS — só pula a cada `step` níveis (breakpoints).
  // A média é idêntica ao ganho liso; muda só a sensação (pop perceptível vs gota invisível).
  affixValue(item, af) {
    const r = G.data.rarities.find(r => r.id === item.rarity);
    const mult = r ? (r.statMult || 1) : 1;
    const lv = (item.level || 1) - 1;
    const eff = af.step ? Math.floor(lv / af.step) * af.step : lv;
    return af.base + af.perLevel * mult * eff;
  },

  // teto de nível pela raridade
  cap(item) {
    const r = G.data.rarities.find((r) => r.id === item.rarity);
    return r ? r.cap : 10;
  },

  isMaxed(item) { return (item.level || 1) >= this.cap(item); },

  // custo geométrico: base × growth^(nível-1) × multiplicador da raridade
  cost(item) {
    const b = G.data.balance;
    const r = G.data.rarities.find(r => r.id === item.rarity);
    const costMult = r ? (r.costMult || 1) : 1;
    return Math.ceil(b.gearCostBase * Math.pow(b.gearCostGrowth, (item.level || 1) - 1) * costMult);
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

  // rarity helpers
  _nextRarity(rarityId) {
    const idx = G.data.rarities.findIndex(r => r.id === rarityId);
    return (idx >= 0 && idx < G.data.rarities.length - 1) ? G.data.rarities[idx + 1].id : null;
  },

  // returns { kind, amount } for the promote cost of an item, or null if not promotable
  promoteCost(item) {
    if (item.rarity === 'common')   return { kind: 'common',   amount: G.data.balance.promoteCommonCost };
    if (item.rarity === 'uncommon') return { kind: 'uncommon', amount: G.data.balance.promoteUncommonCost };
    return null;
  },

  canPromote(item) {
    if (!this.isMaxed(item)) return false;
    if (!this._nextRarity(item.rarity)) return false;
    const cost = this.promoteCost(item);
    return cost ? G.economy.getGear(cost.kind) >= cost.amount : false;
  },

  // consumes materials, promotes piece to next rarity keeping current level
  promote(item) {
    if (!this.isMaxed(item)) return false;
    const nextId = this._nextRarity(item.rarity);
    if (!nextId) return false;
    const cost = this.promoteCost(item);
    if (!cost) return false;
    if (G.economy.getGear(cost.kind) < cost.amount) return false;
    G.economy.addGear(cost.kind, -cost.amount);
    const currentLevel = item.level || 1;
    const newPiece = this.buildPiece(item.slot, nextId);
    newPiece.level = currentLevel;
    G.state.data.equipped[item.slot] = newPiece;
    G.state.invalidateStats();
    return true;
  },

  // monta uma peça a partir de gearBase + raridade (inclui afixos exclusivos da raridade)
  buildPiece(slotId, rarityId) {
    const base   = G.data.gearBase[slotId];
    const slot   = G.data.slots.find((s) => s.id === slotId);
    const rarity = G.data.rarities.find((r) => r.id === rarityId) || G.data.rarities[0];
    const DISP_PCT = ["crit", "critDmg", "xpBonus", "lumensBonus"];
    const rarityExtras = base[rarityId + "Affixes"] || [];
    const allAffixes = [...base.affixes, ...rarityExtras];
    return {
      slot:       slotId,
      slotLabel:  slot ? slot.label : slotId,
      name:       base.name,
      rarity:     rarity.id,
      rarityName: rarity.name,
      color:      rarity.color,
      level:      1,
      affixes:    allAffixes.map((a) => ({
        id:       a.id,
        label:    a.label,
        stat:     a.stat,
        layer:    a.layer || "flat",
        pct:      a.layer === "pct" || DISP_PCT.indexOf(a.stat) !== -1,
        base:     a.base,
        perLevel: a.perLevel,
        step:     a.step,
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
