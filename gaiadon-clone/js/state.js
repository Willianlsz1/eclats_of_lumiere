'use strict';

function defaultState() {
  return {
    // ── Run (resets on Convergence) ──────────────────────────────────────
    map: 0, sub: 0,
    lumens: 0,
    str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0,
    xpRun: 0,
    killsAtFrontier: 0,
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 0,
    playerHp: 50,        // filled to hpMax on run start
    playerHpMax: 50,

    // ── Convergence (accumulates) ────────────────────────────────────────
    convergences: 0,
    convPoints: 0,
    xpLife: 0,
    bestGsub: 0,

    // ── Vestiges / Passives (never reset) ───────────────────────────────
    vestiges: 0,
    passPool: 0,         // vestiges queued for passive upgrades
    passiveLevels: {},   // { "Radiant Strike": 3, ... }
    passivesUnlocked: false,

    // ── Ascension (never reset) ──────────────────────────────────────────
    ascensions: 0,
    mapBossDefeated: [false, false, false, false, false],

    // ── Éclats / Mémoires (never reset) ─────────────────────────────────
    eclats: 0,
    memoireLevels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    blessureLv: 0,
    memNextCost: 2.0,    // cost to level next Mémoire (cumulative ramp)

    // ── Gear (never reset) ───────────────────────────────────────────────
    gear: [
      {level:0, rarity:0, matFrags:0},
      {level:0, rarity:0, matFrags:0},
      {level:0, rarity:0, matFrags:0},
      {level:0, rarity:0, matFrags:0},
      {level:0, rarity:0, matFrags:0},
      {level:0, rarity:0, matFrags:0},
    ],

    // ── Meta ─────────────────────────────────────────────────────────────
    lastSave: Date.now(),
    lastTick: Date.now(),

    // ── UI state (not saved) ─────────────────────────────────────────────
    eventLog: [],
    activeTab: 'combat',
  };
}

const SAVE_KEY = 'eclats_save';
const SAVE_VERSION = 1;

function saveGame(s) {
  const data = Object.assign({}, s, { _v: SAVE_VERSION });
  delete data.eventLog;   // transient
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return migrate(data);
  } catch(e) {
    console.warn('Load failed:', e);
    return null;
  }
}

function migrate(data) {
  // Always start with defaults and overlay saved data for forward compat
  const base = defaultState();
  const merged = Object.assign(base, data);
  // Ensure arrays have correct length
  if (!Array.isArray(merged.memoireLevels) || merged.memoireLevels.length !== 15)
    merged.memoireLevels = base.memoireLevels;
  if (!Array.isArray(merged.mapBossDefeated) || merged.mapBossDefeated.length !== 5)
    merged.mapBossDefeated = base.mapBossDefeated;
  if (!Array.isArray(merged.gear) || merged.gear.length !== 6)
    merged.gear = base.gear;
  // Ensure passiveLevels is object
  if (typeof merged.passiveLevels !== 'object') merged.passiveLevels = {};
  merged.eventLog = [];
  return merged;
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}
