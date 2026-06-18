// RELATÓRIO COMPLETO DO MAP 1 — todos os stats: player, mobs (HP/dano) por área 1-9,
// gear (afixos + custos), níveis de unlock, Convergence e Despertar. Os mobs são
// RELATIVOS ao player, então tiramos um SNAPSHOT de cada área no momento em que o
// jogador (sensato) a alcança numa run real do combate. Uso: node tools/sim/map1_report.mjs
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, resetPack, bossActive } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel, damagePerHit, critChance, critDamageMult, playerDefesa } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp, levelCapFor,
  critOf, critDmgOf, gildedOf, activeSecondaries, gearGildedChance } from '../../src/game/gear.js';
import { canConverge, doConverge, convGateLevel, convergeProgress } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, GEAR_RARITY_LABELS, ENEMY, COMBAT, LEVEL, CONVERGENCE, MAPS, DESPERTAR, DESPERTAR_REQ, GILDED, CRAFT } from '../../src/data/constants.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { formatNumber as f } from '../../src/core/format.js';

const DT = 0.1, MAP = MAPS[0];
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const gearAvg = (s) => GEAR.pieces.reduce((a, d) => a + s.gear[d.key].level, 0) / 6;
const minRar = (s) => Math.min(...GEAR.pieces.map((d) => s.gear[d.key].rarity));

// jogador sensato (igual game_harness): farma a área mais funda sustentável, compra guloso, converge/desperta
function buyGearGreedy(s){ let g=0; while(g++<5000){ let best=null,bc=Infinity; for(const d of GEAR.pieces){const p=s.gear[d.key]; if(atLevelCap(p,s))continue; const c=levelCost(p); if(c<bc){bc=c;best=d.key;}} if(!best||s.lumens<bc)break; if(!buyLevel(s,best))break; } }
function rarityUp(s){ let d=true; while(d){d=false; for(const def of GEAR.pieces) if(canRarityUp(s,def.key)){doRarityUp(s,def.key);d=true;}} }
function bestArea(s){ const map=getCurrentMap(s); const d=dps(s),hp=playerHpMax(s),lvl=runLevel(s); const bD=COMBAT.baseDmg+lvl*LEVEL.dmgPerLevel;
  for(let a=s.unlockedSubarea;a>=1;a--){ const mhp=bD*ENEMY.hitsToKill*ENEMY.areaHp[a-1]; const sz=map.packSizes[a-1]; const t=(sz*mhp)/d; const pk=hp*ENEMY.dmgFrac*ENEMY.areaDmg[a-1]; const taken=pk*(t/2)-hp*0.01*(t/2); if(taken<hp*0.8)return a; } return 1; }

const snap = {}; // área → snapshot
const s = createInitialState();
s.player.hp = playerHpMax(s); resetPack(s);
let t = 0, reTick = 0;
while (t < 60 * 3600) {
  if (reTick-- <= 0) { const tg = bestArea(s); if (tg !== s.subarea) enterSubarea(s, tg); reTick = 30; }
  combatTick(s, DT); t += DT;
  buyGearGreedy(s); rarityUp(s);
  if (canConverge(s)) doConverge(s);
  if (canDespertar(s)) doDespertar(s);
  // snapshot da área atual (1ª vez que farma, com mob vivo)
  const a = s.subarea, mob = s.enemies.find((m) => !m.isBoss && m.hp > 0);
  if (mob && !snap[a]) {
    const wave = s.enemies.reduce((x, m) => x + (m.hp > 0 ? m.dmg : 0), 0);
    snap[a] = { t, mobHp: mob.hpMax, mobLvl: mob.level, waveDmg: wave, pack: MAP.packSizes[a-1],
      pl: runLevel(s), dmg: damagePerHit(s), hp: playerHpMax(s), aps: currentAPS(s), dps: dps(s),
      gear: gearAvg(s), rar: minRar(s), conv: s.convergences, crit: critChance(s), critD: critDamageMult(s),
      gild: gearGildedChance(s), desp: s.despertares || 0 };
  }
  // Wall (boss área 9)
  if (a === 9 && bossActive(s) && !snap.wall) {
    const b = s.enemies.find((m) => m.isBoss);
    snap.wall = { mobHp: b.hpMax, dmg: b.dmg, pl: runLevel(s), pdmg: damagePerHit(s), php: playerHpMax(s), dps: dps(s), conv: s.convergences, desp: s.despertares||0 };
  }
  if (s.bossDefeated[8]) break;
}

const L = (...a) => console.log(...a);
L('══════════════════════════════════════════════════════════════════');
L('  RELATÓRIO COMPLETO — MAP 1 (The Dreaming Wood)  ·  snapshot de uma run real');
L('══════════════════════════════════════════════════════════════════');

L('\n### 1. PLAYER — base ###');
L(`  Dano base ........ ${f(COMBAT.baseDmg)}   (+${f(LEVEL.dmgPerLevel)}/nível)`);
L(`  HP base .......... ${f(COMBAT.playerBaseHp)}   (+${f(LEVEL.hpPerLevel)}/nível)`);
L(`  Atk Speed base ... ${COMBAT.baseAPS}  (teto ${COMBAT.apsCap})`);
L(`  Crit rate base ... ${pct(0)}   ·  Crit damage base ... ×1 (crit = dano normal até ganhar crit dmg)`);
L(`  Regen ............ ${pct(COMBAT.regenPerSec)}/s do HP máx   ·  morte: recua 1 área, respawn ${COMBAT.deathRespawnSeconds}s`);

L('\n### 2. ÁREAS 1-9 — mobs (relativos ao player) + estado do player ao alcançar ###');
L('  área | unlock LV | mob HP    | dano onda/s | mobs | mob LV || player LV | dano/hit | HP máx   | APS  | DPS     | gear(rar) | conv');
L('  -----+-----------+-----------+-------------+------+--------++----------+----------+----------+------+---------+-----------+-----');
for (let a = 1; a <= 9; a++) {
  const u = MAP.unlockLevels[a-1], k = snap[a];
  if (!k) { L(`   ${a}   | ${String(u).padStart(7)}   |    (não farmada no snapshot)`); continue; }
  L(`   ${a}   | ${String(u).padStart(7)}   | ${f(k.mobHp).padStart(8)}  | ${f(k.waveDmg).padStart(10)}  |  ${k.pack}   | ${String(k.mobLvl).padStart(5)}  || ${String(k.pl).padStart(7)}  | ${f(k.dmg).padStart(7)}  | ${f(k.hp).padStart(7)}  | ${k.aps.toFixed(2)} | ${f(k.dps).padStart(6)}  | ${String(Math.round(k.gear)).padStart(4)} ${GEAR_RARITY_LABELS[k.rar].slice(0,4)} | ${k.conv}`);
}
if (snap.wall) { const w = snap.wall; L(`  WALL (boss área 9): HP ${f(w.mobHp)} · dano/s ${f(w.dmg)} || no 1º encontro: player LV ${w.pl} · dano/hit ${f(w.pdmg)} · HP ${f(w.php)} · DPS ${f(w.dps)} · conv ${w.conv} · despertares ${w.desp}`); }
L(`  (fatores por área — areaHp ${JSON.stringify(ENEMY.areaHp)}, areaDmg ${JSON.stringify(ENEMY.areaDmg)}, areaReward ${JSON.stringify(ENEMY.areaReward)})`);
L(`  mob HP = (baseDmg + LV×${LEVEL.dmgPerLevel}) × ${ENEMY.hitsToKill} hits × areaHp[área] · dano onda = HP_player × ${ENEMY.dmgFrac} × areaDmg[área] · Wall = mob × ${ENEMY.bossHpMult} HP, × ${ENEMY.bossDmgMult} dano`);

L('\n### 3. GEAR — 6 peças, afixos e custos ###');
L(`  Raridades no Map 1: Comum (Faded) → Incomum (Kindled). Cap de nível: Comum ${GEAR.levelCap[0]} · Incomum ${GEAR.levelCap[1]}.`);
L(`  Custo de 1 nível = ${f(GEAR.levelCostBase)} × ${GEAR.costRamp}^nível × (Comum ×${GEAR.costMult[0]} / Incomum ×${GEAR.costMult[1]})`);
L('  peça        | slot     | afixo primário     | afixos secundários (raridade destrava em ordem)');
L('  ------------+----------+--------------------+-----------------------------------------------');
const AFN = { dmg:'dano', hp:'HP', gilded:'gilded chance', crit:'crit rate', critDmg:'crit dmg', aps:'atk speed', regen:'regen', bossDmg:'dano boss', lumens:'Gold', xp:'XP', materiais:'materiais', erosao:'erosão' };
for (const d of GEAR.pieces) L(`  ${d.name.padEnd(24).slice(0,24)} | ${d.slot.padEnd(8)} | ${AFN[d.primary].padEnd(18)} | ${d.secondary.map(x=>AFN[x]).join(', ')}`);
L('\n  Valor agregado das 6 peças por NÍVEL (no fim ~170) e custo de 1 nível:');
L('  nível | custo Comum | custo Incomum');
L('  ------+-------------+--------------');
for (const lv of [1, 50, 100, 170, 300, 500, 1000, 1400]) {
  const cc = lv <= GEAR.levelCap[0] ? f(levelCost({level:lv,rarity:0})) : '— cap';
  L(`  ${String(lv).padStart(4)}  | ${cc.padStart(10)}  | ${f(levelCost({level:lv,rarity:1})).padStart(11)}`);
}
L(`  Subir raridade Comum→Incomum: ${CRAFT.rarityUpMaterial} materiais T1 por peça (lockstep) · drop ${pct(CRAFT.dropChance)}/mob + chunk de boss.`);

L('\n### 4. NÍVEL & XP ###');
L(`  nível = (xpRun / ${f(LEVEL.curveDiv)})^${LEVEL.curveExp}  ·  reseta na Convergence (head-start ${pct(CONVERGENCE.headstartFrac)})`);
L(`  cada nível: +${f(LEVEL.dmgPerLevel)} dano e +${f(LEVEL.hpPerLevel)} HP (flat)`);

L('\n### 5. CONVERGENCE — gate (LV p/ disparar) + reset + bônus ###');
L(`  +${pct(CONVERGENCE.bonusPerConv)} dano/HP e +${pct(CONVERGENCE.goldBonusPerConv)} Gold por conv · XP 0% · reseta LV/Gold, não a posição`);
L('  conv | precisa LV | reseta p/ LV | dano/HP acum | Gold acum');
L('  -----+------------+--------------+--------------+----------');
for (let n=1;n<=14;n++){ const g=convGateLevel(n-1); L(`   ${String(n).padStart(2)}  |   ${String(g).padStart(7)}  |    ${String(Math.max(1,Math.floor(CONVERGENCE.headstartFrac*g))).padStart(6)}    | ×${(1+CONVERGENCE.bonusPerConv*n).toFixed(2)} (+${(CONVERGENCE.bonusPerConv*n*100).toFixed(0)}%) | +${(CONVERGENCE.goldBonusPerConv*n*100).toFixed(1)}%`); }

L('\n### 6. DESPERTAR (área 7, 1 por mapa) ###');
const r = DESPERTAR_REQ[1];
L(`  gate: liberar Sub ${r.subarea} + ${f(r.kills)} kills + nível ${f(r.level)} + ${r.t1} materiais T1 (consumidos)`);
L(`  efeito: ×${DESPERTAR.mult} dano/HP · +${pct(DESPERTAR.critRateAdd)} crit rate · +${(DESPERTAR.critDmgAdd*100).toFixed(0)}% crit dmg · +${DESPERTAR.apsAdd} APS · +${pct(DESPERTAR.lumensBonus)} Gold · +${pct(DESPERTAR.xpBonus)} XP`);

L('\n### 7. GILDED (mob mais forte, afixo do Manto) ###');
const gt = GILDED.tiers[0];
L(`  chance: afixo do Manto (teto global ${pct(GILDED.chanceCap)}; ~5% no fim do Map 1) · tier 1 "${gt.name}": ×${gt.hpMult} HP, ×${gt.lumensMult} Gold, ×${gt.xpMult} XP`);
L('\n══════════════════════════════════════════════════════════════════');
