// ===== Loot: equipamento, afixos, crítico, level/rarity up =====
// Tudo sobre itens e suas operações. Depende de data.js (CONFIG, SLOTS, RARITIES,
// AFFIXES) e progression.js (totalPowerMult para rarityUpCost).

// --- Item Power ---
function itemPower(item) {
  if (!item) return 0;
  return Math.round(CONFIG.gear.powerPerLevel * item.level * RARITIES[item.rarity].mult);
}
function slotPower(s, slotId) { return itemPower(s.equipped[slotId]); }
function rarityCap(item) { return RARITIES[item.rarity].cap; }

// --- Afixos (sub-stats por raridade — ver docs/adr/0003) ---
// Afixos ativos de um item = os primeiros `rarity` da lista do slot.
function itemAffixes(slotId, rarity) { return AFFIXES[slotId].slice(0, rarity); }
// Valor de um afixo escala com o NÍVEL do item: base + perLevel × nível.
function affixValue(a, level) { return a.base + a.perLevel * level; }
// Retorna o afixo desbloqueado ao atingir a nova raridade, ou null se não houver.
// Esconde a indexação rarity-1 do array AFFIXES — callers não precisam saber a convenção.
function getNewAffix(slotId, newRarity) {
  const pool = AFFIXES[slotId];
  return pool && pool[newRarity - 1] ? pool[newRarity - 1] : null;
}
// Retorna os afixos de um item com valores pré-calculados (para renderização).
// Cada entrada: { stat, valuePct, raw } onde raw é o objeto afixo original.
function getDisplayAffixes(slotId, rarity, level) {
  return itemAffixes(slotId, rarity).map(a => ({
    stat: a.stat,
    valuePct: affixValue(a, level) * 100,
    raw: a,
  }));
}
// Soma todos os afixos dos itens equipados em modificadores globais.
function affixTotals(s) {
  const t = { critRate: 0, critDmg: 0, dmgMult: 0, hpMult: 0, goldMult: 0, xpMult: 0, shardMult: 0, bossDmg: 0 };
  for (const slot of SLOTS) {
    const it = s.equipped[slot.id];
    if (!it) continue; // guard: slots ausentes em saves antigos (migrate trata na carga)
    for (const a of itemAffixes(slot.id, it.rarity)) t[a.stat] += affixValue(a, it.level);
  }
  return t;
}
function critRate(s) { return Math.min(1, affixTotals(s).critRate); }
// Gloves: base stat adds Crit Damage directly via itemPower conversion.
function critMult(s) {
  return CONFIG.combat.baseCritMult + affixTotals(s).critDmg
       + slotPower(s, "Gloves") * CONFIG.itemStats.critDmgPerPower;
}
// Crítico como valor esperado (sem RNG por tick): multiplicador médio do DPS.
function critExpectedMult(s) {
  const t = affixTotals(s);
  const rate = Math.min(1, t.critRate);
  const mult = CONFIG.combat.baseCritMult + t.critDmg
             + slotPower(s, "Gloves") * CONFIG.itemStats.critDmgPerPower;
  return 1 + rate * (mult - 1);
}

// --- Custos e ações de equipamento ---
function levelCostAt(level) {
  return Math.round(CONFIG.gear.levelCostBase * Math.pow(CONFIG.gear.levelCostGrowth, level));
}
function levelUpCost(s, slotId) {
  return levelCostAt(s.equipped[slotId].level);
}
// Quantos níveis dá pra comprar agora (e o custo total), sem alterar o estado.
function levelUpMaxPreview(s, slotId) {
  const item = s.equipped[slotId];
  const cap = rarityCap(item);
  let gold = s.gold, level = item.level, count = 0, spent = 0;
  while (level < cap) {
    const cost = levelCostAt(level);
    if (gold < cost) break;
    gold -= cost; level++; count++; spent += cost;
    if (count > 1e6) break; // guard: impede loop infinito se levelCost retornar 0
  }
  return { count, spent };
}
// Compra o máximo de níveis possível de uma vez. Retorna quantos comprou.
function levelUpMax(s, slotId) {
  let count = 0;
  while (levelUpItem(s, slotId)) { if (++count > 1e6) break; } // guard: cap extra para segurança
  return count;
}
function canLevelUp(s, slotId) {
  const item = s.equipped[slotId];
  return item.level < rarityCap(item) && s.gold >= levelUpCost(s, slotId);
}
function levelUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.level >= rarityCap(item)) return false; // travado no cap
  const cost = levelUpCost(s, slotId);
  if (s.gold < cost) return false;
  s.gold -= cost; item.level++;
  return true;
}
function rarityUpCost(s, slotId) {
  const item = s.equipped[slotId];
  const base = CONFIG.gear.rarityCostBase * Math.pow(CONFIG.gear.rarityCostGrowth, item.rarity);
  // Escala com totalPowerMult (mesma progressão da renda de shards via shardBonus).
  // Resultado: "X kills para upar raridade" é CONSTANTE em qualquer estágio.
  // Só o Ring (Shard Find) e afixos de shardMult reduzem esse X — incentivo correto.
  return Math.round(base * totalPowerMult(s));
}
function canRarityUp(s, slotId) {
  const item = s.equipped[slotId];
  return item.rarity < RARITIES.length - 1
      && item.level >= rarityCap(item)        // precisa estar no cap atual
      && s.shards >= rarityUpCost(s, slotId);
}
function rarityUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.rarity >= RARITIES.length - 1) return false;
  if (item.level < rarityCap(item)) return false; // precisa estar no cap
  const cost = rarityUpCost(s, slotId);
  if (s.shards < cost) return false;
  s.shards -= cost; item.rarity++; // nível mantém; cap agora é maior
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    itemPower, slotPower, rarityCap,
    itemAffixes, affixValue, getNewAffix, getDisplayAffixes, affixTotals,
    critRate, critMult, critExpectedMult,
    levelCostAt, levelUpCost, levelUpMaxPreview, levelUpMax, canLevelUp, levelUpItem,
    rarityUpCost, canRarityUp, rarityUpItem,
  };
}
