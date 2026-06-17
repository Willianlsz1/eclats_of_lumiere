// HARNESS DE VERIFICAÇÃO — roda o COMBATE REAL do jogo (importa os módulos de src/)
// pra conferir que a recalibração "em branco" produz o feel desejado NO JOGO (não no
// modelo abstrato do sim). Política do "jogador": fica na sub-área mais funda liberada,
// compra gear na peça mais barata sempre que dá, e converge assim que o gate abre.
// Uso: node tools/sim/game_harness.mjs

import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, bossActive, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel } from '../../src/game/stats.js';
import { buyLevel } from '../../src/game/gear.js';
import { canConverge, doConverge, convGateLevel } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, DESPERTAR_REQ, ENEMY, ECONOMY, LEVEL, COMBAT } from '../../src/data/constants.js';
import { levelCost, atLevelCap } from '../../src/game/gear.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { playerDefesa, damagePerHit } from '../../src/game/stats.js';

const DT = 0.1;
if (process.env.GCOST) GEAR.levelCostBase = +process.env.GCOST; // sweep do custo de gear
if (process.env.XPRATIO) ECONOMY.xpRatio = +process.env.XPRATIO; // XP = mobHp × xpRatio
if (process.env.LUMBASE) ECONOMY.lumBase = +process.env.LUMBASE;
if (process.env.CDIV) LEVEL.curveDiv = +process.env.CDIV;
if (process.env.DFRAC) ENEMY.dmgFrac = +process.env.DFRAC;
if (process.env.DKILLS) DESPERTAR_REQ[1].kills = +process.env.DKILLS; // sweep do gate do Despertar
if (process.env.DLEVEL) DESPERTAR_REQ[1].level = +process.env.DLEVEL;
if (process.env.DT1) DESPERTAR_REQ[1].t1 = +process.env.DT1;
const fmtT = (s) => s == null ? '  —  ' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : s < 86400*2 ? `${(s/3600).toFixed(1)}h` : `${(s/86400).toFixed(2)}d`;
const fmt = (n) => n >= 1e9 ? (n/1e9).toFixed(2)+'bi' : n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.round(n).toString();

// compra gulosa: gasta lumens na peça mais barata que não está no cap, até não dar mais
function buyGearGreedy(state) {
  let guard = 0;
  while (guard++ < 5000) {
    let best = null, bestCost = Infinity;
    for (const def of GEAR.pieces) {
      const p = state.gear[def.key];
      if (atLevelCap(p, state)) continue;
      const c = levelCost(p);
      if (c < bestCost) { bestCost = c; best = def.key; }
    }
    if (!best || state.lumens < bestCost) break;
    if (!buyLevel(state, best)) break;
  }
}
const totalGearLevel = (state) => GEAR.pieces.reduce((s, d) => s + state.gear[d.key].level, 0);
const avgGearLevel = (state) => totalGearLevel(state) / GEAR.pieces.length;

// Jogador sensato: farma a sub-área mais funda LIBERADA onde ele (a) mata o mob
// representativo rápido o bastante e (b) sobrevive à onda. Mob/dano representativos =
// nível médio-geométrico da faixa da sub-área. Sobrevivência ≈ dano levado p/ limpar < HP.
function bestFarmArea(state) {
  const map = getCurrentMap(state);
  const d = dps(state), hp = playerHpMax(state), def = playerDefesa(state), lvl = runLevel(state);
  const bDmg = COMBAT.baseDmg + lvl * LEVEL.dmgPerLevel;             // baseline do nível (sem multiplicadores)
  const bHp = COMBAT.playerBaseHp + lvl * LEVEL.hpPerLevel;
  for (let s = state.unlockedSubarea; s >= 1; s--) {
    const mobHp = bDmg * ENEMY.hitsToKill * ENEMY.areaHp[s - 1];     // baseline → gear/conv/despertar matam mais rápido
    const size = map.packSizes[s - 1];
    const tClear = (size * mobHp) / d;              // tempo p/ limpar a onda (dps REAL do player)
    const packDps = hp * ENEMY.dmgFrac * ENEMY.areaDmg[s - 1];       // onda inteira (HP REAL → perigo persiste)
    const armored = (packDps * packDps) / (def + packDps);
    const taken = armored * (tClear / 2) - hp * 0.01 * (tClear / 2); // ~metade da onda viva, menos regen
    if (taken < hp * 0.8) return s;                  // sobrevive com folga
  }
  return 1;
}

const state = createInitialState();
state.player.hp = playerHpMax(state);
resetPack(state); // boot da 1ª onda (o main.js faz isso no jogo)

const M = { lvl2: null, conv1: null, despertar: null, sub9: null, wallSpawn: null, wallKill: null };
let despSnap = null;
let t = 0, deaths = 0, wallAttempts = 0, prevDead = false;
let firstWallHp = null, firstWallSnap = null;
const CAP_T = 60 * 3600; // 60h de teto

let reTick = 0;
while (t < CAP_T) {
  // re-decide a área a cada ~3s (jogador sensato: mais funda sustentável)
  if (reTick-- <= 0) { const tgt = bestFarmArea(state); if (tgt !== state.subarea) enterSubarea(state, tgt); reTick = 30; }

  combatTick(state, DT);
  t += DT;

  buyGearGreedy(state);
  if (canConverge(state)) { doConverge(state); if (M.conv1 === null) M.conv1 = t; }
  if (canDespertar(state)) { doDespertar(state); if (M.despertar === null) { M.despertar = t; despSnap = { lvl: runLevel(state), gear: avgGearLevel(state), kills: state.killsTotal, sub: state.unlockedSubarea }; } }

  const lvl = runLevel(state);
  if (M.lvl2 === null && lvl >= 2) M.lvl2 = t;
  if (M.sub9 === null && state.unlockedSubarea >= 9) M.sub9 = t;

  // detecta o boss da Wall na cena
  if (state.subarea === 9 && bossActive(state)) {
    if (M.wallSpawn === null) {
      M.wallSpawn = t; wallAttempts++;
      firstWallHp = playerHpMax(state);
      firstWallSnap = { lvl, gear: avgGearLevel(state), aps: currentAPS(state), dps: dps(state), conv: state.convergences };
    }
  }
  // morte
  if (state.player.dead && !prevDead) { deaths++; if (state.subarea === 9) wallAttempts++; }
  prevDead = state.player.dead;

  // boss final derrotado?
  if (state.bossDefeated[8] && M.wallKill === null) { M.wallKill = t; break; }
}

const g = avgGearLevel(state);
console.log('=== HARNESS: combate REAL do jogo (recalibração "em branco") ===');
console.log(`nível 2 .............. ${fmtT(M.lvl2)}`);
console.log(`1ª Convergence ....... ${fmtT(M.conv1)}  (gate nível ${convGateLevel(0)})`);
console.log(`Despertar (T2) ....... ${fmtT(M.despertar)}${despSnap ? `  (Sub ${despSnap.sub} · nível ${despSnap.lvl} · gear ${despSnap.gear.toFixed(0)} · ${despSnap.kills} kills)` : ''}`);
console.log(`Sub 9 liberada ....... ${fmtT(M.sub9)}`);
console.log(`Wall (boss) surge .... ${fmtT(M.wallSpawn)}`);
console.log(`Wall derrotada ....... ${fmtT(M.wallKill)}  ${M.wallKill ? '✅ Map 1 limpo' : '(não limpou no teto de 60h)'}`);
console.log(`mortes totais ........ ${deaths}`);
console.log('--- estado no FIM ---');
console.log(`tempo ................ ${fmtT(t)}`);
console.log(`nível da run ......... ${runLevel(state)}  · convergences ${state.convergences}`);
console.log(`gear médio ........... ${g.toFixed(0)} / cap ${GEAR.levelCap[0]}`);
console.log(`APS .................. ${currentAPS(state).toFixed(2)}  · dps ${fmt(dps(state))}`);
console.log(`HP máx ............... ${fmt(playerHpMax(state))}`);
if (firstWallSnap) {
  console.log('--- 1º encontro com a Wall ---');
  console.log(`nível ${firstWallSnap.lvl} · gear ${firstWallSnap.gear.toFixed(0)} · conv ${firstWallSnap.conv} · APS ${firstWallSnap.aps.toFixed(2)} · dps ${fmt(firstWallSnap.dps)} · HP ${fmt(firstWallHp)}`);
}
