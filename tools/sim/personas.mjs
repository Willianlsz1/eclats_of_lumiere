// SIM DE PERSONAS — quanto tempo REAL cada perfil leva pra limpar o Map 1, modelando
// sessões ativas (compra/converge/desperta) + tempo OFFLINE (combate roda em poder
// ESTAGNADO, sem comprar, até logar de novo). Uso: node tools/sim/personas.mjs
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp } from '../../src/game/gear.js';
import { canConverge, doConverge } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, ENEMY, COMBAT, LEVEL } from '../../src/data/constants.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { formatNumber as f } from '../../src/core/format.js';

const gearAvg = (s) => GEAR.pieces.reduce((a, d) => a + s.gear[d.key].level, 0) / 6;
function buyGreedy(s){ let g=0; while(g++<5000){ let best=null,bc=Infinity; for(const d of GEAR.pieces){const p=s.gear[d.key]; if(atLevelCap(p,s))continue; const c=levelCost(p); if(c<bc){bc=c;best=d.key;}} if(!best||s.lumens<bc)break; if(!buyLevel(s,best))break; } }
function rarityUp(s){ let d=true; while(d){d=false; for(const def of GEAR.pieces) if(canRarityUp(s,def.key)){doRarityUp(s,def.key);d=true;}} }
function bestArea(s){ const map=getCurrentMap(s); const d=dps(s),hp=playerHpMax(s),lvl=runLevel(s); const bD=COMBAT.baseDmg+lvl*LEVEL.dmgPerLevel;
  for(let a=s.unlockedSubarea;a>=1;a--){ const mhp=bD*ENEMY.hitsToKill*ENEMY.areaHp[a-1]; const sz=map.packSizes[a-1]; const t=(sz*mhp)/d; const pk=hp*ENEMY.dmgFrac*ENEMY.areaDmg[a-1]; const taken=pk*(t/2)-hp*0.01*(t/2); if(taken<hp*0.8)return a; } return 1; }

// SESSÃO ATIVA: joga "bem" por `secs` (compra guloso, converge, desperta, re-escolhe área)
function active(s, secs, DT=0.1){ let t=0,reTick=0; while(t<secs){ if(reTick--<=0){const tg=bestArea(s); if(tg!==s.subarea)enterSubarea(s,tg); reTick=30;} combatTick(s,DT); t+=DT; buyGreedy(s); rarityUp(s); if(canConverge(s))doConverge(s); if(canDespertar(s))doDespertar(s); if(s.bossDefeated[8])return; } }
// OFFLINE: só combate, poder ESTAGNADO (sem comprar/converger), na área atual. Antes, o login
// "spend" é feito no active() seguinte. dt maior p/ velocidade (aproximação).
// OFFCAP_H (h) e OFFEFF (0..1): se setados, limitam o offline (modelo "intencional" 8h×40%).
const OFFCAP = process.env.OFFCAP_H ? +process.env.OFFCAP_H * 3600 : Infinity;
const OFFEFF = process.env.OFFEFF ? +process.env.OFFEFF : 1;
function offline(s, secs, DT=0.5){ const eff = Math.min(secs, OFFCAP) * OFFEFF; let t=0; while(t<eff){ combatTick(s,DT); t+=DT; if(s.bossDefeated[8])return; } }

function persona(name, activeHrs, sessions){
  const s = createInitialState(); s.player.hp = playerHpMax(s); resetPack(s);
  const offHrs = 24 - activeHrs;
  const actPerSession = (activeHrs*3600)/sessions, offPerSession = (offHrs*3600)/sessions;
  let day=0;
  while(day<40 && !s.bossDefeated[8]){
    day++;
    for(let k=0;k<sessions && !s.bossDefeated[8];k++){
      active(s, actPerSession);                 // loga: gasta o banco + joga
      if(!s.bossDefeated[8]) { const tg=bestArea(s); if(tg!==s.subarea) enterSubarea(s,tg); offline(s, offPerSession); } // fecha numa área sustentável
    }
  }
  const cleared = s.bossDefeated[8];
  return { name, activeHrs, sessions, day: cleared?day:null, conv:s.convergences, gear:Math.round(gearAvg(s)), lvl:runLevel(s), desp:s.despertares||0, cleared };
}

console.log('SIM DE PERSONAS — dias REAIS p/ limpar o Map 1 (combate ativo ~11,5h no harness ótimo)');
console.log('offline = combate em poder ESTAGNADO (sem comprar), 100% efic., teto 30 dias (como no código)\n');
console.log('persona                     | ativo/dia | sessões | DIAS p/ limpar | conv | gear | desp');
console.log('----------------------------+-----------+---------+----------------+------+------+-----');
for(const p of [
  persona('PRO (no-lifer)', 10, 4),
  persona('CASUAL (1,5h/dia, 2 logins)', 1.5, 2),
  persona('LIGHT (só checa, 15min, 1x)', 0.25, 1),
]){
  console.log(`${p.name.padEnd(27)} |   ${String(p.activeHrs).padStart(4)}h   |    ${p.sessions}    |  ${(p.day?p.day+' dias':'>40 dias').padStart(9)}     |  ${p.conv}  | ${String(p.gear).padStart(4)} |  ${p.desp}`);
}
