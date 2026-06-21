// =============================================================
// gear.js — level-up de equipamento (custo GEOMÉTRICO, estilo Gaiadon)
// =============================================================
// Cada peça equipada tem um nível. Subir o nível dá +% nos afixos
// daquela peça. Custo cresce GEOMÉTRICO com o nível (acompanha a
// renda exponencial do jogador — ver gearCostBase/Growth em data.balance).
// O teto (cap) é por raridade, definido em data.js.

G.gear = {
  // valor EFETIVO de um afixo no nível atual da peça:
  //   base + perLevel × (nível - 1)
  // (o multiplicador de raridade já está embutido em base/perLevel — ver buildPiece)
  affixValue(item, af) {
    const lvl = item.level || 1;
    return af.base + af.perLevel * (lvl - 1);
  },

  // ---- construção das 6 peças FIXAS ----
  // monta uma peça a partir da definição base + raridade (default Comum).
  // o valor de cada afixo já entra escalado pela raridade (como no loot).
  buildPiece(slotId, rarityId) {
    const base = G.data.gearBase[slotId];
    const slot = G.data.slots.find((s) => s.id === slotId);
    const rarity = G.data.rarities.find((r) => r.id === rarityId) || G.data.rarities[0];
    // raridade determina quantos afixos a peça tem (Common=1 … Legendary=5)
    const afxCount = Math.min(rarity.affixes || 1, base.affixes.length);
    return {
      slot: slotId,
      slotLabel: slot ? slot.label : slotId,
      name: base.name,
      rarity: rarity.id,
      rarityName: rarity.name,
      color: rarity.color,
      level: 1,
      affixes: base.affixes.slice(0, afxCount).map((a) => ({
        id: a.id,
        label: a.label,
        stat: a.stat,
        layer: a.layer || "flat",
        pct: (a.layer === "pct") || G.data.pctStats.indexOf(a.stat) !== -1,
        // raridade escala tanto o valor base quanto o ganho por nível
        base: a.base * rarity.mult,
        perLevel: a.perLevel * rarity.mult,
      })),
    };
  },

  // conjunto inicial: as 6 peças fixas no nível 1, raridade Comum
  freshSet() {
    const set = {};
    for (const slot of G.data.slots) set[slot.id] = this.buildPiece(slot.id, "common");
    return set;
  },

  // RECONCILIA o equipamento salvo com a definição atual em data.js:
  // reconstrói cada peça (pega stats/afixos novos) mas preserva nível e
  // raridade do save. Garante que mudanças de balanceamento valham em saves
  // antigos e corrige saves de versões anteriores das peças.
  reconcile(saved) {
    const out = {};
    for (const slot of G.data.slots) {
      const prev = saved && saved[slot.id];
      const rarity = (prev && prev.rarity) || "common";
      const piece = this.buildPiece(slot.id, rarity);
      if (prev && prev.level) piece.level = Math.min(prev.level, this.cap(piece));
      out[slot.id] = piece;
    }
    return out;
  },

  // sobe N níveis de uma vez (x10 / Max). Devolve quantos subiu de fato.
  // mult "max" sobe até o teto ou até acabar o ouro.
  levelUpTimes(item, n) {
    const times = n === "max" ? this.cap(item) - (item.level || 1) : n;
    let done = 0;
    for (let i = 0; i < times; i++) {
      if (this.levelUp(item)) done++;
      else break;
    }
    return done;
  },

  // teto de nível da peça (por raridade — ajuste em data.js)
  cap(item) {
    const rarity = G.data.rarities.find((r) => r.id === item.rarity);
    return rarity && rarity.cap ? rarity.cap : 10;
  },

  // custo p/ subir do nível atual (GEOMÉTRICO — acopla à renda exponencial)
  //   custo = gearCostBase × gearCostGrowth^(nível-1)
  cost(item) {
    const b = G.data.balance;
    const lvl = item.level || 1;
    return Math.ceil(b.gearCostBase * Math.pow(b.gearCostGrowth, lvl - 1));
  },

  isMaxed(item) {
    return (item.level || 1) >= this.cap(item);
  },

  // sobe 1 nível gastando Lumens; devolve true se conseguiu
  levelUp(item) {
    if (this.isMaxed(item)) return false;
    const cost = this.cost(item);
    if (G.state.data.lumens < cost) return false;
    G.state.data.lumens -= cost;
    item.level = (item.level || 1) + 1;
    G.state.invalidateStats(); // gear afixo aumentou → stats mudam
    return true;
  },
};
