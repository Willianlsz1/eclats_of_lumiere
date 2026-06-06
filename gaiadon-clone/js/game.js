// ===== Game: estado, stats do jogador, loop de combate, ascensão =====
// Módulo de orquestração que combina progression.js + loot.js + zones.js.
// Depende de todos os módulos anteriores via scope global (sem import).

function defaultState() {
  return {
    gold: 0,
    shards: 0,             // material que sobe a raridade do equipamento
    level: 1,
    xp: 0,
    ascensions: 0,         // nº de ascensões totais (define tier e multiplicador)
    zone: 1,
    maxZone: 0,
    killsInZone: 0,
    totalKills: 0,
    // Equipamento: cada slot guarda { rarity: índice, level }.
    equipped: {
      Weapon: { rarity: 0, level: 1 },
      Armor:  { rarity: 0, level: 1 },
      Amulet: { rarity: 0, level: 1 },
      Ring:   { rarity: 0, level: 1 },
      Gloves: { rarity: 0, level: 1 },
      Helmet: { rarity: 0, level: 1 },
    },
    enemies: [],           // pack de inimigos atual (você foca o [0]; todos atacam)
    playerHp: null,
    lastSeen: null,
    // Zone Mastery: kills acumulados POR ZONA — persiste entre ascensões.
    // Chave: número da zona (como número). Valor: total de kills nessa zona.
    zoneMastery: {},
    // Zone Progress: kills de limpeza por zona NA RUN ATUAL.
    // Persiste entre mortes e navegação (morte sem punição).
    // Reseta na ascensão (nova run começa do zero).
    zoneProgress: {},
  };
}

// --- Stats do jogador (combinam equipment + progression) ---
function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + (s.level - 1) * damagePerLevel(s);
  base += slotPower(s, "Weapon"); // Weapon → Damage (1:1)
  base *= (1 + affixTotals(s).dmgMult); // afixo Damage %
  return Math.round(base * totalPowerMult(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + (s.level - 1) * hpPerLevel(s);
  base += slotPower(s, "Armor") * CONFIG.itemStats.healthPerPower; // Armor → Health
  base *= (1 + affixTotals(s).hpMult); // afixo Health %
  return Math.round(base * totalPowerMult(s));
}
function attackSpeed(s) {
  // Amulet → Attack Speed (+ também Gold Find em goldBonus).
  return CONFIG.player.baseAttackSpeed + slotPower(s, "Amulet") * CONFIG.itemStats.attackSpeedPerPower;
}
// DPS efetivo inclui o crítico (valor esperado).
function playerDps(s) { return playerDamage(s) * attackSpeed(s) * critExpectedMult(s); }
function goldBonus(s) {
  let b = 1 + slotPower(s, "Amulet") * CONFIG.itemStats.goldFindPerPower; // Amulet → Gold Find
  b *= (1 + affixTotals(s).goldMult); // afixo Gold %
  return b * totalPowerMult(s) * zoneMasteryBonus(s); // Zone Mastery bônus de farming
}
// Multiplicador de XP: o multiplicador do Power × afixo XP % × Zone Mastery.
function xpMultiplier(s) {
  return totalPowerMult(s) * (1 + affixTotals(s).xpMult) * zoneMasteryBonus(s);
}
// Ring: Shard Find — multiplica shards de cada abate (base stat + afixos + poder total + mastery).
function shardBonus(s) {
  let b = 1 + slotPower(s, "Ring") * CONFIG.itemStats.shardFindPerPower;
  b *= (1 + affixTotals(s).shardMult);
  return b * totalPowerMult(s) * zoneMasteryBonus(s);
}
// Helmet: Boss Damage — multiplicador de dano apenas contra bosses.
function bossDmgMult(s) {
  return 1 + slotPower(s, "Helmet") * CONFIG.itemStats.bossDmgPerPower + affixTotals(s).bossDmg;
}

// --- XP / nível do Hero ---
function xpToNext(s) { return Math.round(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, s.level - 1)); }
function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) { s.xp -= xpToNext(s); s.level++; leveled = true; }
  return leveled;
}

// Registra um abate de UM inimigo: recompensas + progressão de zone. NÃO cura
// (a cura acontece ao limpar o pack inteiro — packs maiores são mais perigosos).
function registerKill(s, e) {
  e = e || s.enemies[0];
  const zoneAtKill = s.zone; // captura antes de advanced mudar s.zone
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward * xpMultiplier(s));
  s.totalKills++;
  const sh = Math.round(shardsOnKill(s.zone, e.isBoss) * shardBonus(s) * (e.shardMult || 1));
  s.shards += sh;
  s.killsInZone++;

  // ── Zone Mastery: acumula kills permanentes nesta zona ───────────────────
  const justMastered = recordMasteryKill(s, zoneAtKill);

  const needed = e.isBoss ? 1 : killsToClear(s.zone);
  let advanced = false, walledCleared = false;
  if (s.killsInZone >= needed) {
    clearZoneProgress(s, zoneAtKill);
    if (s.zone > s.maxZone) {            // limpou uma FRONTEIRA nova
      s.maxZone = s.zone; walledCleared = true;
      s.zone = s.maxZone + 1; advanced = true; // segue empurrando
    }
    // farmando uma zone já limpa (zone <= maxZone): fica, não é empurrado.
  }
  // Avisa quando o tamanho do pack aumenta ao entrar em nova zona.
  const packIncreased = advanced && packSize(s.zone) > packSize(zoneAtKill);
  return { type: "kill", name: e.name, tier: e.tier || "normal", gold: g, shards: sh, leveled, advanced, walledCleared, packIncreased, zone: s.zone, wasBoss: e.isBoss, justMastered, masteredZone: justMastered ? zoneAtKill : null };
}

// Navegação manual de zone: entre a Zone 1 e a fronteira (accessibleDepth + 1).
// accessibleDepth garante que o player possa navegar até sua fronteira real
// mesmo que maxZone esteja baixo por bug de save.
function changeZone(s, dir) {
  const target = s.zone + dir;
  if (target < 1 || target > accessibleDepth(s) + 1) return false;
  saveZoneProgress(s);
  s.zone = target;
  restoreZoneProgress(s, target);
  spawnPack(s);
  s.playerHp = playerMaxHp(s);
  return true;
}

// Morte: SEM PUNIÇÃO DE PROGRESSO. Recua para a zone segura mais próxima,
// mas PRESERVA os kills acumulados em zoneProgress — o jogador retoma de onde parou.
// Filosofia: morte é um "tente de novo", não uma punição que apaga esforço.
// "Segura" = a zone anterior à parede. Se morrer de novo, recua mais 1.
// Caso extremo (pós-ascensão em zona alta): recua até zone 1 se preciso.
function handleDeath(s) {
  const wallZone = s.zone;
  saveZoneProgress(s);
  // Recua 1 zona abaixo da parede (não fica preso repetindo a mesma zona letal).
  // Mínimo zone 1 para evitar ficar stuck quando o jogador está fraco demais.
  s.zone = Math.max(1, s.zone - 1);
  restoreZoneProgress(s, s.zone);
  s.enemies = [];
  s.playerHp = playerMaxHp(s);
  return { type: "death", wallZone, zone: s.zone };
}

// Processa dt segundos de combate. Retorna lista de eventos para a UI.
function tick(s, dt) {
  if (!s.enemies || s.enemies.length === 0) spawnPack(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);
  const events = [];

  // Você FOCA o inimigo da frente.
  const target = s.enemies[0];
  // Helmet: Boss Damage multiplier applies only against boss enemies.
  let dmgToEnemy = playerDps(s) * dt;
  if (target.isBoss) dmgToEnemy *= bossDmgMult(s);
  target.hp -= dmgToEnemy;
  events.push({ type: "hit", amount: dmgToEnemy });

  // TODOS os inimigos vivos do pack te atacam ao mesmo tempo.
  const incoming = s.enemies.reduce((a, e) => a + e.dmg, 0) * CONFIG.enemy.damageFactor * dt;
  s.playerHp -= incoming;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnPack(s); return events; }

  if (target.hp <= 0) {
    const ev = registerKill(s, target);
    events.push(ev);
    s.enemies.shift(); // remove o morto
    if (ev.advanced) s.enemies = []; // mudou de zone: descarta o pack antigo
    if (s.enemies.length === 0) { s.playerHp = playerMaxHp(s); spawnPack(s); } // cura ao limpar o pack
  }
  return events;
}

// --- Ascensão (prestígio) ---
function canAscend(s) {
  return s.level  >= CONFIG.ascension.firstReqLevel
      && s.maxZone >= ascZoneReq(s);
}

// Snapshot de todo o status de ascensão — callers exibem, ninguém recalcula.
// Centraliza a lógica que antes estava espalhada em main.js e ui.js.
function getAscensionStatus(s) {
  const tier = heroTier(s);
  const t    = TIERS[tier];
  const nextT = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;
  const zoneReq = ascZoneReq(s);
  const isTierPromo = !!(nextT && s.ascensions + 1 === nextT.minAsc);
  return {
    tier,
    tierName: t.name,
    tierMult: t.mult,
    nextTier: nextT,
    isTierPromo,
    canAscend: canAscend(s),
    ascensionNumber: s.ascensions + 1,
    zoneReq,
    levelReq: CONFIG.ascension.firstReqLevel,
    currentPowerMult: ascMultiplier(s),
    compoundPreview: Math.pow(t.mult, 10), // ×X after 10 more
  };
}

// Ascender: incrementa ascensions, mantém equipamento e território limpo, reseta o resto.
// maxZone é PRESERVADO — a calibração de fronteira só se aplica a zonas acima dele.
// O jogador começa na zona 1: breezes pelas zonas triviais (power fantasy!)
// e reconstrui nível/gold naturalmente. Padrão de idles como Clicker Heroes.
// Retorna true em sucesso; false se os requisitos não foram atingidos.
function ascend(s) {
  if (!canAscend(s)) return false;
  const keepAscensions  = s.ascensions + 1;
  const keepEquipped    = s.equipped;
  const keepMaxZone     = s.maxZone;      // preserva território limpo
  const keepZoneMastery = s.zoneMastery || {}; // kills permanentes — nunca resetam
  Object.assign(s, defaultState());
  s.ascensions  = keepAscensions;
  s.equipped    = keepEquipped;
  s.maxZone     = keepMaxZone;
  s.zone        = 1;                   // recomeça do início — zonas triviais voam, fronteira = desafio
  s.zoneMastery = keepZoneMastery;     // bônus de farming sobrevivem à ascensão
  // zoneProgress NÃO é preservado — pertence à run atual, não ao progresso permanente
  return true;
}

// Estima os ganhos enquanto offline, de forma BARATA (fórmula, sem rodar ticks).
// Farma na zone segura (onde o jogador estava, no máximo até a maxZone).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const farmZone = Math.max(1, Math.min(s.zone, s.maxZone));
  const st = enemyStats(farmZone);
  // Inimigos offline também escalam com ascensões (mesma dificuldade do jogo ao vivo).
  const ascMult = Math.pow(CONFIG.enemy.ascGrowth, s.ascensions);
  const killsPerSec = playerDps(s) / Math.max(1, st.hp * ascMult);
  const kills = killsPerSec * seconds * efficiency;
  const gold = Math.round(kills * st.gold * goldBonus(s));
  const xp = Math.round(kills * st.xp * xpMultiplier(s));
  const shards = Math.round(kills * shardsOnKill(farmZone, false) * shardBonus(s));
  return { seconds, kills: Math.floor(kills), gold, xp, shards, farmZone };
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState,
    playerDamage, playerMaxHp, attackSpeed, playerDps,
    goldBonus, xpMultiplier, shardBonus, bossDmgMult,
    xpToNext, gainXp,
    registerKill, changeZone, handleDeath, tick,
    canAscend, getAscensionStatus, ascend,
    computeOfflineGains,
  };
}
