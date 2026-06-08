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
// Afixos ativos de um item (DESIGN §27): Common=1 … Legendary=5.
// rarity é o índice (0=common … 4=legendary), então rarity+1 afixos ativos.
function itemAffixes(slotId, rarity) { return AFFIXES[slotId].slice(0, rarity + 1); }
// Valor de um afixo escala com o NÍVEL do item: base + perLevel × nível.
function affixValue(a, level) { return a.base + a.perLevel * level; }
// Retorna o afixo recém-revelado ao subir PARA newRarity (índice newRarity), ou null.
// Com a convenção rarity+1, subir para a raridade R revela o afixo de índice R.
function getNewAffix(slotId, newRarity) {
  const pool = AFFIXES[slotId];
  return pool && pool[newRarity] ? pool[newRarity] : null;
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
// Taxa bruta antes de cap — pode passar de 1.0 (o excesso vira critDmg via overflow).
function critRateRaw(s) {
  var base = affixTotals(s).critRate;
  if (typeof goldStatBonus === "function") base += goldStatBonus(s, "lck");
  // Luminal Edge (passiva Fase 3): contribuição adicional de crit rate.
  if (typeof passiveTotals === "function") base += passiveTotals(s).critRate;
  return base;
}
function critRate(s) { return Math.min(1, critRateRaw(s)); }
// Excesso de crit rate acima de 100% → bônus de Crit Damage (CRIT_OVERFLOW_TO_DMG = 1.0).
function critOverflow(s) { return Math.max(0, critRateRaw(s) - 1.0); }

// Gloves: itemPower contribui para Crit Damage. Overflow de crit rate também contribui.
// Or Ein Sof's Touch amplifica o fator de overflow; Shattered Light adiciona bônus por tier de overflow.
function critMult(s) {
  const overflow = critOverflow(s);
  const pt = typeof passiveTotals === "function" ? passiveTotals(s) : null;
  const overflowFactor = CONFIG.combat.critOverflowToDmg + (pt ? pt.critOverflowFactor : 0);
  const shatteredBonus = (pt && pt.shatteredLight > 0) ? Math.floor(overflow) * pt.shatteredLight : 0;
  return CONFIG.combat.baseCritMult
       + affixTotals(s).critDmg
       + slotPower(s, "Gloves") * CONFIG.itemStats.critDmgPerPower
       + overflow * overflowFactor
       + shatteredBonus;
}
// Crítico como valor esperado (sem RNG por tick): EV = 1 + rate × (mult − 1).
function critExpectedMult(s) {
  const rate = critRate(s);
  const mult = critMult(s);
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
  let lumens = s.lumens, level = item.level, count = 0, spent = 0;
  while (level < cap) {
    const cost = levelCostAt(level);
    if (lumens < cost) break;
    lumens -= cost; level++; count++; spent += cost;
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
  return item.level < rarityCap(item) && s.lumens >= levelUpCost(s, slotId);
}
function levelUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.level >= rarityCap(item)) return false; // travado no cap
  const cost = levelUpCost(s, slotId);
  if (s.lumens < cost) return false;
  s.lumens -= cost; item.level++;
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
      && s.vestiges >= rarityUpCost(s, slotId);
}
function rarityUpItem(s, slotId) {
  const item = s.equipped[slotId];
  if (item.rarity >= RARITIES.length - 1) return false;
  if (item.level < rarityCap(item)) return false; // precisa estar no cap
  const cost = rarityUpCost(s, slotId);
  if (s.vestiges < cost) return false;
  s.vestiges -= cost; item.rarity++; // nível mantém; cap agora é maior
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    itemPower, slotPower, rarityCap,
    itemAffixes, affixValue, getNewAffix, getDisplayAffixes, affixTotals,
    critRateRaw, critRate, critOverflow, critMult, critExpectedMult,
    levelCostAt, levelUpCost, levelUpMaxPreview, levelUpMax, canLevelUp, levelUpItem,
    rarityUpCost, canRarityUp, rarityUpItem,
  };
}
