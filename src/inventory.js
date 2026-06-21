// =============================================================
// inventory.js — pegar itens, equipar, desequipar, vender
// =============================================================
// ⚠️ DORMENTE: com o gear de 6 peças fixas não há inventário ativo. Mantido
// junto com loot.js caso o sistema de itens volte no futuro.

G.inventory = {
  MAX: 40, // limite de slots no chão

  add(item) {
    const inv = G.state.data.inventory;
    if (inv.length >= this.MAX) {
      // inventário cheio: descarta o de menor poder se o novo for melhor
      inv.sort((a, b) => a.power - b.power);
      if (item.power > inv[0].power) inv.shift();
      else return false;
    }
    inv.push(item);
    return true;
  },

  // equipa um item do inventário; devolve o antigo pro inventário
  equip(uid) {
    const inv = G.state.data.inventory;
    const i = inv.findIndex((it) => it.uid === uid);
    if (i === -1) return;
    const item = inv.splice(i, 1)[0];
    const slot = item.slot;
    const old = G.state.data.equipped[slot];
    G.state.data.equipped[slot] = item;
    if (old) inv.push(old);
  },

  unequip(slotId) {
    const old = G.state.data.equipped[slotId];
    if (!old) return;
    G.state.data.equipped[slotId] = null;
    G.state.data.inventory.push(old);
  },

  // vende um item por lumens (valor ~ poder * raridade)
  sell(uid) {
    const inv = G.state.data.inventory;
    const i = inv.findIndex((it) => it.uid === uid);
    if (i === -1) return;
    const item = inv.splice(i, 1)[0];
    G.state.data.lumens += this.sellValue(item);
  },

  sellValue(item) {
    const rarity = G.data.rarities.find((r) => r.id === item.rarity);
    return Math.max(1, Math.floor(item.power * (rarity ? rarity.mult : 1)));
  },

  // vende todos os itens comuns de uma vez (limpeza rápida)
  sellAllCommon() {
    const inv = G.state.data.inventory;
    let gained = 0;
    for (let i = inv.length - 1; i >= 0; i--) {
      if (inv[i].rarity === "common") {
        gained += this.sellValue(inv[i]);
        inv.splice(i, 1);
      }
    }
    G.state.data.lumens += gained;
    return gained;
  },
};
