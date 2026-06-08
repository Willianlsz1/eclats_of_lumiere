// ===== Passivas: 3 árvores, 45 nós permanentes (nunca resetam) =====
// Desbloqueadas e evoluídas com Vestiges. Gate de kills + mapa.
// Depende de data.js (PASSIVES). Deve carregar antes de loot.js e game.js.

// Retorna a definição estática de uma passiva pelo seu id.
function passiveDef(id) {
  for (var i = 0; i < PASSIVES.length; i++) {
    if (PASSIVES[i].id === id) return PASSIVES[i];
  }
  return null;
}

// Retorna o nível atual de uma passiva no estado do jogador.
function passiveLevel(s, id) {
  return (s.passives && s.passives[id]) || 0;
}

// Retorna o custo em Vestiges para comprar o próximo nível da passiva.
// costBase × costGrowth^currentLevel, arredondado.
// Retorna Infinity se o nível máximo já foi atingido.
function passiveCost(id, currentLevel) {
  var def = passiveDef(id);
  if (!def) return Infinity;
  if (currentLevel >= def.maxLevel) return Infinity;
  return Math.round(def.costBase * Math.pow(def.costGrowth, currentLevel));
}

// Retorna true se a passiva está desbloqueada para o estado do jogador.
// mapReq 1 → sempre disponível (ascensions >= 0).
// mapReq N → ascensions >= N-1.
// Além disso, exige totalKills >= killsReq.
function passiveUnlocked(s, id) {
  var def = passiveDef(id);
  if (!def) return false;
  var ascRequired = def.mapReq - 1;
  return (s.ascensions >= ascRequired) && (s.totalKills >= def.killsReq);
}

// Retorna true se o jogador pode comprar o próximo nível da passiva.
function canBuyPassive(s, id) {
  if (!passiveUnlocked(s, id)) return false;
  var lv = passiveLevel(s, id);
  var def = passiveDef(id);
  if (!def) return false;
  if (lv >= def.maxLevel) return false;
  var cost = passiveCost(id, lv);
  return (s.vestiges >= cost);
}

// Compra o próximo nível da passiva, se possível.
// Subtrai vestiges, incrementa s.passives[id] e s.totalVestgesSpent.
// Retorna true em caso de sucesso, false caso contrário.
function buyPassive(s, id) {
  if (!canBuyPassive(s, id)) return false;
  var lv = passiveLevel(s, id);
  var cost = passiveCost(id, lv);
  s.vestiges -= cost;
  if (!s.passives) s.passives = {};
  s.passives[id] = lv + 1;
  s.totalVestgesSpent = (s.totalVestgesSpent || 0) + cost;
  return true;
}

// Agrega todos os bônus de passivas compradas num objeto de totais.
// Passivas com effect:"stub" contribuem 0 para tudo.
// voidEndurance é escalonada pelo número de bosses mortos neste mapa.
function passiveTotals(s) {
  var t = {
    dmgMult:            0,
    critRate:           0,
    critOverflowFactor: 0,
    shatteredLight:     0,
    lumensMult:         0,
    xpMult:             0,
    vestigeMult:        0,
    offlineEff:         0,
    enemyHpReduct:      0,
    rewardMult:         0,
    enemyDmgReduct:     0,
    lastLightDmg:       0,
    voidEnduranceBonus: 0,
  };

  if (!s.passives) return t;

  var bossKills = s.bossKills || 0;

  for (var i = 0; i < PASSIVES.length; i++) {
    var def = PASSIVES[i];
    var lv = passiveLevel(s, def.id);
    if (lv <= 0) continue;

    var bonus = lv * def.perLevel;

    switch (def.effect) {
      case "dmgMult":
        t.dmgMult += bonus;
        break;
      case "critRate":
        t.critRate += bonus;
        break;
      case "critOverflowFactor":
        t.critOverflowFactor += bonus;
        break;
      case "shatteredLight":
        t.shatteredLight += bonus;
        break;
      case "lumensMult":
        t.lumensMult += bonus;
        break;
      case "xpMult":
        t.xpMult += bonus;
        break;
      case "vestigeMult":
        t.vestigeMult += bonus;
        break;
      case "offlineEff":
        t.offlineEff += bonus;
        break;
      case "enemyHpReduct":
        t.enemyHpReduct += bonus;
        break;
      case "rewardMult":
        t.rewardMult += bonus;
        break;
      case "enemyDmgReduct":
        t.enemyDmgReduct += bonus;
        break;
      case "lastLightDmg":
        t.lastLightDmg += bonus;
        break;
      case "voidEndurance":
        t.voidEnduranceBonus += lv * def.perLevel * bossKills;
        break;
      // "stub" e quaisquer efeitos não implementados contribuem 0
      default:
        break;
    }
  }

  return t;
}


// ═══════════════════════════════════════════════════════════════════════
// Exports (Node.js para testes)
// ═══════════════════════════════════════════════════════════════════════
if (typeof module !== "undefined") {
  module.exports = {
    passiveDef,
    passiveLevel,
    passiveCost,
    passiveUnlocked,
    canBuyPassive,
    buyPassive,
    passiveTotals,
  };
}
