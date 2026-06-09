'use strict';
// All pure functions — mirror sim_full.py exactly.

function subBounds(m, s) {
  const [l0, l1] = MAPS[m].lvl;
  const r = Math.pow(l1/l0, 1/NSUB);
  return [l0 * Math.pow(r, s), l0 * Math.pow(r, s+1)];
}

function subMeanLevel(m, s) {
  const [a, b] = subBounds(m, s);
  return Math.sqrt(a * b);
}

function mobHp(L) {
  for (const map of MAPS) {
    const [l0, l1] = map.lvl;
    const [h0, h1] = map.hp;
    if (L <= l1) {
      const t = Math.max(0, Math.min(1,
        (Math.log10(L) - Math.log10(l0)) / (Math.log10(l1) - Math.log10(l0))
      ));
      return h0 * Math.pow(h1/h0, t);
    }
  }
  return MAPS[MAPS.length-1].hp[1];
}

function mobDmg(L) {
  for (const map of MAPS) {
    const [l0, l1] = map.lvl;
    const [d0, d1] = map.dmg;
    if (L <= l1) {
      const t = Math.max(0, Math.min(1,
        (Math.log10(L) - Math.log10(l0)) / (Math.log10(l1) - Math.log10(l0))
      ));
      return d0 * Math.pow(d1/d0, t);
    }
  }
  return MAPS[MAPS.length-1].dmg[1];
}

function milMult(level) {
  let p = 1.0;
  for (const [k, v] of MILESTONES) {
    if (level >= k) p *= v;
  }
  return p;
}

function statCostNext(level) {
  return CONFIG.statCostBase * Math.pow(CONFIG.statCostRamp, level);
}

// Total gold cost to go from level n0 to n1 (geometric sum)
function statCostRange(n0, n1) {
  if (n1 <= n0) return 0;
  const r = CONFIG.statCostRamp;
  return CONFIG.statCostBase * (Math.pow(r, n1) - Math.pow(r, n0)) / (r - 1);
}

function statTotal(level, per) {
  return (1 + level * per) * milMult(level);
}

function convFactor(pts) {
  return 1 + CONFIG.convPointBonus * pts;
}

function ascMultiplier(asc) {
  let f = 1.0;
  for (let i = 0; i < asc; i++) f *= ASC_MULT[i];
  return f;
}

// Combined gear bonus to damage (product of all dmg-stat pieces)
function gearDmgBonus(gear) {
  let bonus = 1.0;
  for (let i = 0; i < gear.length; i++) {
    const def = GEAR_DEF[i];
    if (def.stat !== 'dmg' && def.stat !== 'aps') continue;
    const { level, rarity } = gear[i];
    const rate = RARITY[rarity].rate;
    bonus *= (1 + def.base * level * rate);
  }
  return bonus;
}

function gearHpBonus(gear) {
  let bonus = 1.0;
  for (let i = 0; i < gear.length; i++) {
    const def = GEAR_DEF[i];
    if (def.stat !== 'hp') continue;
    const { level, rarity } = gear[i];
    const rate = RARITY[rarity].rate;
    bonus *= (1 + def.base * level * rate);
  }
  return bonus;
}

// Total passive damage multiplier (aggregate envelope)
function passiveDmgMult(passiveLevels) {
  let total = 0;
  for (const lv of Object.values(passiveLevels)) total += lv;
  return 1 + CONFIG.passDmgPer * total;
}

function passiveEconMult(passiveLevels) {
  let total = 0;
  for (const lv of Object.values(passiveLevels)) total += lv;
  return 1 + 0.03 * total; // economy passive envelope
}

// Mémoires Clarté multiplier: 1.07^(sum of all memoir levels) * 1.10^blessureLv
function memoiresMult(memoireLevels, blessureLv) {
  const sum = memoireLevels.reduce((a, b) => a + b, 0);
  return Math.pow(CONFIG.clarte, sum) * Math.pow(1.10, blessureLv);
}

function levelBonus(hero) {
  return 1 + Math.sqrt(hero) * 0.20;
}

function strTotal(strLv) {
  return statTotal(strLv, CONFIG.strPer);
}

function vitTotal(vitLv) {
  return statTotal(vitLv, CONFIG.vitPer);
}

function playerAps(agiLv, passiveLevels) {
  // fracture tree passives boost APS
  const fractureBoost = _fractureApsBoost(passiveLevels);
  return Math.min(CONFIG.apsCap * (1 + fractureBoost),
    CONFIG.baseAPS * (1 + agiLv * CONFIG.agiPer) * (1 + fractureBoost));
}

function _fractureApsBoost(passiveLevels) {
  // Passives in fracture tree that give APS: Swift Fracture, Shatter Step, Phase Shift, Eternal Phase, Apex Speed
  const apsPassives = ['Swift Fracture','Shatter Step','Phase Shift','Eternal Phase','Apex Speed'];
  let total = 0;
  for (const name of apsPassives) {
    total += (passiveLevels[name] || 0);
  }
  return 0.03 * total;
}

function calcDps(s) {
  const str    = strTotal(s.str);
  const lvlB   = levelBonus(s.xpLife > 0 ? seekerLevel(s.xpLife) : 1);
  const convF  = convFactor(s.convPoints);
  const ascF   = ascMultiplier(s.ascensions);
  const gearD  = gearDmgBonus(s.gear);
  const passD  = passiveDmgMult(s.passiveLevels);
  const memM   = memoiresMult(s.memoireLevels, s.blessureLv);
  const aps    = playerAps(s.agi, s.passiveLevels);
  return CONFIG.baseDmg * str * lvlB * convF * ascF * gearD * passD * memM * aps;
}

function calcHpMax(s) {
  const vit   = vitTotal(s.vit);
  const lvlB  = levelBonus(s.xpLife > 0 ? seekerLevel(s.xpLife) : 1);
  const convF = convFactor(s.convPoints);
  const ascF  = ascMultiplier(s.ascensions);
  const gearH = gearHpBonus(s.gear);
  const passH = 1 + 0.03 * _hpPassiveTotal(s.passiveLevels);
  return CONFIG.playerBaseHp * vit * lvlB * convF * ascF * gearH * passH;
}

function _hpPassiveTotal(passiveLevels) {
  const hpPassives = ['Null Armor','Fracture Skin','Endurance','Stillness'];
  let t = 0;
  for (const n of hpPassives) t += (passiveLevels[n] || 0);
  return t;
}

function vestPerKill(m, sub) {
  return Math.ceil((sub + 1) * 0.5) * Math.pow(3, m);
}

// XP required to reach next Convergence wall
function xpWall(conv) {
  let wall = 1500;
  for (let i = 0; i < conv; i++) {
    wall *= 1.5 * Math.pow(1.06, i);
  }
  return wall;
}

function seekerLevel(xpLife) {
  return Math.pow(xpLife / 10, 0.4);
}

// Éclats drip per dt seconds, based on frontier boss HP
function eclatDrip(frontierBossHp, dt) {
  return CONFIG.dripBase * Math.pow(frontierBossHp, 0.9) * dt / 3600;
}

// Incoming DPS from a pack of mobs at map m, sub s
function incomingDps(m, s) {
  const L = subMeanLevel(m, s);
  return PACK_SIZE[m][s] * mobDmg(L);
}

// Incoming DPS from boss at map m
function bossDps(m) {
  const L = MAPS[m].lvl[1];
  return mobDmg(L) * CONFIG.bossDmgMult;
}

function gearUpgradeCost(level) {
  return CONFIG.gearUpgCostBase * Math.pow(CONFIG.gearUpgCostRamp, level);
}
