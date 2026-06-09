'use strict';
// Game loop + tick logic — mirrors sim_full.py

let G = null;        // global game state (set by main.js)
let _loopId = null;
let _saveTimer = null;
const TICK_MS = 100;

function startLoop(state) {
  G = state;
  G.playerHpMax = calcHpMax(G);
  G.playerHp    = G.playerHpMax;
  if (_loopId) clearInterval(_loopId);
  _loopId = setInterval(() => {
    tick(TICK_MS / 1000);
    renderAll();
  }, TICK_MS);
  if (_saveTimer) clearInterval(_saveTimer);
  _saveTimer = setInterval(() => saveGame(G), 30000);
}

function stopLoop() {
  if (_loopId) { clearInterval(_loopId); _loopId = null; }
  if (_saveTimer) { clearInterval(_saveTimer); _saveTimer = null; }
}

// ────────────────────────────────────────────────────────────────────────────
// Core tick — dt in seconds
// ────────────────────────────────────────────────────────────────────────────
function tick(dt) {
  const m = G.map, s = G.sub;
  const L = subMeanLevel(m, s);
  const hp = mobHp(L);
  const dps = calcDps(G);
  const aps = playerAps(G.agi, G.passiveLevels);

  // Physical cap: 1 kill per attack swing
  const killTime = Math.max(hp / Math.max(dps, 1e-30), 1.0 / aps);
  const kills = dt / killTime;

  // ── Gold (Lumens) ────────────────────────────────────────────────────────
  const frtBonus = 1 + G.frt * CONFIG.frtPer;
  G.lumens += kills * hp * CONFIG.goldRatio * frtBonus;

  // ── XP ──────────────────────────────────────────────────────────────────
  const xpGain = kills * hp * CONFIG.xpRatio;
  G.xpRun  += xpGain;
  G.xpLife += xpGain;

  // ── Vestiges ─────────────────────────────────────────────────────────────
  const v = kills * vestPerKill(m, s);
  G.vestiges  += v * CONFIG.vestSave;   // 60% → ascension pool
  G.passPool  += v * (1 - CONFIG.vestSave); // 40% → passive pool

  // ── Boss logic ───────────────────────────────────────────────────────────
  if (G.bossActive) {
    G.bossHp -= dps * dt;
    if (G.bossHp <= 0) {
      _onBossKill(m);
    }
  } else {
    // Only count kills toward threshold at deepest frontier of current map
    if (m === _maxMap() && s === 4) {
      G.killsAtFrontier += kills;
      if (G.killsAtFrontier >= MAPS[m].killThreshold) {
        _spawnBoss(m);
      }
    }
  }

  // ── Player damage received ───────────────────────────────────────────────
  const incDps = G.bossActive ? bossDps(m) + incomingDps(m, s) : incomingDps(m, s);
  const regenRate = G.playerHpMax * CONFIG.regenPct
    + G.playerHpMax * CONFIG.regenOnKillPct * (kills / dt);
  G.playerHp = Math.min(G.playerHpMax, G.playerHp + (regenRate - incDps) * dt);
  G.playerHpMax = calcHpMax(G);

  if (G.playerHp <= 0) {
    G.playerHp = G.playerHpMax * 0.50; // knockback, no death loss
    _retreat();
  }

  // ── Éclats drip ──────────────────────────────────────────────────────────
  const deepestCleared = G.mapBossDefeated.lastIndexOf(true);
  if (deepestCleared >= 0) {
    const frontierBossHp = mobHp(MAPS[deepestCleared].lvl[1]) * CONFIG.bossHpMult;
    G.eclats += eclatDrip(frontierBossHp, dt);
  }

  // ── Ascension check ──────────────────────────────────────────────────────
  _checkAscension();

  // ── Convergence gate ─────────────────────────────────────────────────────
  const wall = xpWall(G.convergences);
  if (G.xpRun >= wall && G.bestGsub >= 1) {
    _converge();
  }

  // Update bestGsub
  const gsub = m * 5 + s;
  if (gsub > G.bestGsub) G.bestGsub = gsub;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function _maxMap() {
  return Math.min(G.ascensions, 4);
}

function _spawnBoss(m) {
  const bossHp = mobHp(MAPS[m].lvl[1]) * CONFIG.bossHpMult;
  G.bossActive  = true;
  G.bossHp      = bossHp;
  G.bossMaxHp   = bossHp;
  _logEvent(`Boss appeared: ${MAPS[m].name}!`);
}

function _onBossKill(m) {
  G.bossActive = false;
  G.bossHp     = 0;
  G.mapBossDefeated[m] = true;
  G.killsAtFrontier    = 0;

  // Boss drops: lumens × 5
  const bossHp = mobHp(MAPS[m].lvl[1]) * CONFIG.bossHpMult;
  G.lumens  += bossHp * CONFIG.goldRatio * 5;
  G.xpRun   += bossHp * CONFIG.xpRatio  * 5;
  G.xpLife  += bossHp * CONFIG.xpRatio  * 5;

  // Gear fragment drop
  const gIdx = m % GEAR_DEF.length;
  G.gear[gIdx].matFrags += 1;

  _logEvent(`${MAPS[m].name} boss defeated! Éclats incoming...`);
}

function _retreat() {
  if (G.sub > 0) { G.sub--; }
  else if (G.map > 0) { G.map--; G.sub = 4; }
  _logEvent('Knocked back to sub ' + (G.sub + 1) + ' of Map ' + (G.map + 1));
}

function _converge() {
  G.convergences++;
  G.convPoints += (G.bestGsub + 1);

  // Reset run resources
  G.lumens = 0; G.str = 0; G.vit = 0; G.agi = 0;
  G.lck = 0; G.frt = 0; G.wis = 0;
  G.map = 0; G.sub = 0; G.bestGsub = 0;
  G.xpRun = 0; G.killsAtFrontier = 0;
  G.bossActive = false; G.bossHp = 0;
  G.playerHpMax = calcHpMax(G);
  G.playerHp    = G.playerHpMax;
  G.passivesUnlocked = true;

  _logEvent(`Convergence ${G.convergences}! +${G.bestGsub + 1} pts → conv_factor ${convFactor(G.convPoints).toFixed(2)}×`);
}

function _checkAscension() {
  if (G.ascensions >= 5) return;
  const m = G.ascensions; // need to clear map index == ascensions
  if (!G.mapBossDefeated[m]) return;
  const cost = ASC_COST[G.ascensions];
  if (cost !== null && G.vestiges < cost) return;

  if (cost !== null) G.vestiges -= cost;
  G.eclats += ECLAT_LUMP[G.ascensions];
  G.ascensions++;

  _logEvent(`✦ ASCENSION ${G.ascensions}! asc_mult ×${ASC_MULT[G.ascensions-1]}`);
  if (G.ascensions === 5) {
    _logEvent('★ FIM — Nihel derrotado. O Vazio recua.');
  }
}

function _logEvent(msg) {
  const time = formatTime(G.xpLife > 0
    ? (G.convergences * 3600 + G.xpRun / Math.max(calcDps(G) * CONFIG.xpRatio, 1))
    : 0);
  G.eventLog.unshift(msg);
  if (G.eventLog.length > 40) G.eventLog.pop();
}

// ────────────────────────────────────────────────────────────────────────────
// Player actions (called by UI event listeners)
// ────────────────────────────────────────────────────────────────────────────
function buyStat(stat) {
  const perMap = { str: CONFIG.strPer, vit: CONFIG.vitPer, agi: CONFIG.agiPer,
                   lck: CONFIG.lckPer, frt: CONFIG.frtPer, wis: CONFIG.wisPer };
  const per  = perMap[stat];
  if (!per) return;
  const lv   = G[stat];
  const cost = statCostNext(lv);
  if (G.lumens < cost) return;
  G.lumens -= cost;
  G[stat]++;
  G.playerHpMax = calcHpMax(G);
}

function buyStatMax(stat) {
  const perMap = { str: CONFIG.strPer, vit: CONFIG.vitPer, agi: CONFIG.agiPer,
                   lck: CONFIG.lckPer, frt: CONFIG.frtPer, wis: CONFIG.wisPer };
  if (!perMap[stat]) return;
  // Buy as many levels as possible
  for (let i = 0; i < 10000; i++) {
    const cost = statCostNext(G[stat]);
    if (G.lumens < cost) break;
    G.lumens -= cost;
    G[stat]++;
  }
  G.playerHpMax = calcHpMax(G);
}

function buyPassive(name) {
  if (!G.passivesUnlocked) return;
  const lv      = G.passiveLevels[name] || 0;
  const cost    = CONFIG.passCostBase * Math.pow(CONFIG.passCostRamp, lv);
  if (G.passPool < cost) return;
  G.passPool -= cost;
  G.passiveLevels[name] = lv + 1;
}

function buyMemoire(idx) {
  const cost = CONFIG.memCostBase * Math.pow(CONFIG.memCostRamp, G.memoireLevels[idx]);
  if (G.eclats < cost) return;
  G.eclats -= cost;

  // Era 5 mémoires (idx 12,13,14): every 3rd level → Blessure instead of normal
  const isEra5 = MEMOIRES[idx].era === 5;
  if (isEra5 && (G.memoireLevels[idx] + G.blessureLv) % 3 === 2) {
    G.blessureLv++;
  } else {
    G.memoireLevels[idx]++;
  }
}

function upgradeGear(idx) {
  const piece = G.gear[idx];
  const def   = GEAR_DEF[idx];
  const rar   = RARITY[piece.rarity];
  const cap   = piece.rarity === 3 ? 25000 * Math.max(1, G.ascensions) : rar.cap;
  if (piece.level >= cap) return;
  const cost = gearUpgradeCost(piece.level);
  if (G.lumens < cost) return;
  G.lumens -= cost;
  piece.level++;
}

function upgradeGearRarity(idx) {
  const piece = G.gear[idx];
  if (piece.rarity >= 3) return; // max Legendary
  const fragsNeeded = 10 * (piece.rarity + 1);
  if (piece.matFrags < fragsNeeded) return;
  piece.matFrags -= fragsNeeded;
  piece.rarity++;
  piece.level = 0; // reset level on rarity upgrade
  _logEvent(`${GEAR_DEF[idx].name} promoted to ${RARITY[piece.rarity].label}!`);
}

// ────────────────────────────────────────────────────────────────────────────
// Offline progress
// ────────────────────────────────────────────────────────────────────────────
function offlineCalc(dtOffline) {
  const CHUNK = 30; // simulate in 30s chunks
  let remaining = Math.min(dtOffline, 86400 * 7); // cap at 7 days offline
  let ticks = 0;
  while (remaining > 0 && ticks < 10000) {
    const dt = Math.min(CHUNK, remaining);
    // Only advance if player is alive (sustainable zone)
    const incDps = G.bossActive ? bossDps(G.map) + incomingDps(G.map, G.sub)
                                : incomingDps(G.map, G.sub);
    const hpMax = calcHpMax(G);
    const regenRate = hpMax * CONFIG.regenPct;
    if (regenRate < incDps * 0.5) {
      // Not sustainable: retreat first
      if (G.sub > 0) G.sub--;
      else if (G.map > 0) { G.map--; G.sub = 4; }
      else break; // can't retreat further
    }
    tick(dt);
    remaining -= dt;
    ticks++;
  }
}
