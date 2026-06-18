// DEMO DA MURALHA — mostra o ritmo "bate na parede → grinda → fura → parede nova" com HP FIXO.
// Para cada área registra: hits pra matar ao ENTRAR (a muralha) e ao SAIR (você furou).
// Uso: node tools/sim/wall_demo.mjs   (CDIV=500 ajusta o pace do nível p/ o modelo fixo)
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel, damagePerHit } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp } from '../../src/game/gear.js';
import { canConverge, doConverge } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, ENEMY, COMBAT, LEVEL } from '../../src/data/constants.js';
import { getCurrentMap, mobWallHp } from '../../src/game/enemies.js';
import { formatNumber as f } from '../../src/core/format.js';

LEVEL.curveDiv = +process.env.CDIV || 500; // pace do nível p/ o HP fixo (mob não infla mais o XP)
const DT = 0.1, MAP = getCurrentMap({ map: 1 });
const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : `${(s/3600).toFixed(1)}h`;
const hits = (hp, d) => Math.max(1, Math.ceil(hp / d));
function buyGreedy(s){ let g=0; while(g++<5000){ let best=null,bc=Infinity; for(const d of GEAR.pieces){const p=s.gear[d.key]; if(atLevelCap(p,s))continue; const c=levelCost(p); if(c<bc){bc=c;best=d.key;}} if(!best||s.lumens<bc)break; if(!buyLevel(s,best))break; } }
function rarityUp(s){ let d=true; while(d){d=false; for(const def of GEAR.pieces) if(canRarityUp(s,def.key)){doRarityUp(s,def.key);d=true;}} }
// farma a área mais funda que (a) sobrevive e (b) mata em tempo razoável (a muralha = lento mas viável)
function bestArea(s){ const d=dps(s),hp=playerHpMax(s);
  for(let a=s.unlockedSubarea;a>=1;a--){ const mhp=mobWallHp(a); const sz=MAP.packSizes[a-1]; const t=(sz*mhp)/d; const pk=hp*ENEMY.dmgFrac*ENEMY.areaDmg[a-1]; const taken=pk*(t/2)-hp*0.01*(t/2); if(taken<hp*0.8 && t<45) return a; } return 1; }

const s = createInitialState(); s.player.hp = playerHpMax(s); resetPack(s);
const W = {}; let maxF = 0, t = 0, reTick = 0;
while (t < 60 * 3600 && !s.bossDefeated[8]) {
  if (reTick-- <= 0) { const tg = bestArea(s); if (tg !== s.subarea) enterSubarea(s, tg); reTick = 30; }
  combatTick(s, DT); t += DT;
  buyGreedy(s); rarityUp(s);
  if (canConverge(s)) doConverge(s);
  if (canDespertar(s)) doDespertar(s);
  const a = s.subarea;
  if (a > maxF) { // entrou de fato numa área nova (a muralha)
    if (W[maxF]) { W[maxF].exitDmg = damagePerHit(s); W[maxF].exitT = t; } // saiu da anterior
    W[a] = { entryDmg: damagePerHit(s), entryT: t, conv: s.convergences, gear: Math.round(GEAR.pieces.reduce((x,d)=>x+s.gear[d.key].level,0)/6), desp: s.despertares||0 };
    maxF = a;
  }
}
if (W[maxF]) { W[maxF].exitDmg = damagePerHit(s); W[maxF].exitT = t; }

console.log('═══ DEMO DA MURALHA (HP FIXO por área) — o ritmo bate-na-parede → fura ═══');
console.log(`hpWallBase ${f(ENEMY.hpWallBase)} · ×${ENEMY.hpWallRatio}/área · curveDiv ${LEVEL.curveDiv}\n`);
console.log('área | HP FIXO do mob | dano ao ENTRAR | HITS p/ matar (entra) → ao SAIR | quando | conv/gear/desp');
console.log('-----+----------------+----------------+--------------------------------+--------+---------------');
for (let a = 1; a <= 9; a++) {
  const w = W[a]; const hp = mobWallHp(a);
  if (!w) { console.log(`  ${a}  | ${f(hp).padStart(12)}   |  (não alcançada)`); continue; }
  const he = hits(hp, w.entryDmg), hx = w.exitDmg ? hits(hp, w.exitDmg) : he;
  const bar = '█'.repeat(Math.min(40, he));
  console.log(`  ${a}  | ${f(hp).padStart(12)}   | ${f(w.entryDmg).padStart(12)}   |  ${String(he).padStart(3)} → ${String(hx).padStart(2)} hits  ${bar.padEnd(20)} | ${fmtT(w.entryT).padStart(6)} | ${w.conv}c/${w.gear}g/${w.desp}d`);
}
console.log(`\nMap 1 limpo: ${s.bossDefeated[8] ? fmtT(t) : 'não (>60h)'} · convergences ${s.convergences} · gear ${Math.round(GEAR.pieces.reduce((x,d)=>x+s.gear[d.key].level,0)/6)}`);
console.log('LEITURA: "HITS p/ matar (entra)" alto = MURALHA (você mal arranha). "→ ao SAIR" baixo = você FUROU. Próxima área = muralha de novo.');
