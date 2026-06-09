// ============================================================================
// sim-engine.js  —  Simulação que DIRIGE A ENGINE REAL (game.js et al.)
// ----------------------------------------------------------------------------
// Carrega os módulos reais no escopo global e roda o tick() de verdade.
// Um robô COMPETENTE joga sozinho: equilibra dano × sobrevivência, compra
// upgrades com as funções reais, converge/ascende quando bate em QUALQUER muro
// (DPS ou sobrevivência). Mede o pacing real e onde/por que o jogo trava.
//
//   node tests/sim-engine.js
// ============================================================================

'use strict';

// ─── Carrega a engine real no escopo global (padrão dos testes) ─────────────
const data = require('../js/data.js');
Object.assign(global, data);
for (const f of ['../js/progression.js', '../js/passives.js', '../js/loot.js',
                 '../js/zones.js', '../js/game.js']) {
  Object.assign(global, require(f));
}

// ─── Parâmetros do robô / da medição ────────────────────────────────────────
const WALL_SECONDS   = 12;      // kill-time do mob regular acima disto = muro de DPS
const STUCK_HOURS    = 12;      // sem novo recorde de profundidade por X h = softlock
const MAX_GAME_HOURS = 3000;    // teto de tempo de jogo ATIVO simulado
const MAX_TICKS      = 8e6;     // backstop de segurança
const DEATHS_TO_SOFTLOCK = 400; // mortes sem avançar (e sem prestígio possível) = softlock
const BUY_ONLY_REAL_PASSIVES = true;

// ─── Estimativas (read-only) ────────────────────────────────────────────────
function regularKillTime(s) {
  const stats = enemyStatsFor(s.map, s.subarea);
  const ascM  = Math.pow(CONFIG.enemy.ascGrowth, s.ascensions || 0);
  return (stats.hp * ascM) / Math.max(1e-300, playerDps(s));
}
function packIncomingPerSec(s) {
  const reduction = defenseReduction(playerDefense(s));
  let inc = 0;
  for (const e of (s.enemies || [])) inc += e.dmg * CONFIG.enemy.damageFactor * (1 - reduction);
  return inc;
}
// Segundos que o jogador aguenta o pack atual (∞ se regen ≥ dano recebido).
function survivalMargin(s) {
  const net = packIncomingPerSec(s) - hpRegenPerSec(s);
  if (net <= 0) return Infinity;
  return playerMaxHp(s) / net;
}
// Quanto tempo o robô PRECISA aguentar pra limpar um pack (packSize × killtime).
function timeToClearPack(s) {
  return packSizeFor(s.subarea, false) * Math.max(0.1, regularKillTime(s));
}
// Margem-alvo: aguentar com folga o tempo de limpar o pack.
function targetMargin(s) { return 3 * timeToClearPack(s); }

// ─── Política de compra (robô competente) ───────────────────────────────────
const DEF_EFFECTS = new Set(['enemyHpReduct', 'enemyDmgReduct', 'voidEndurance']);

function spendMaterials(s) { for (const slot of SLOTS) { while (rarityUpItem(s, slot.id)) {} } }

// Compra a opção de Lumens mais barata dentro do pool escolhido (survival ou dano).
function _lumensOptions(s, pool) {
  // pool: 'survival' → vit + Armor + Helmet | 'damage' → resto + economia
  const opts = [];
  const push = (kind, id) => {
    let c;
    if (kind === 'stat') c = goldStatCost(id, (s.goldStats && s.goldStats[id]) || 0);
    else { const it = s.equipped[id]; if (it.level >= rarityCap(it)) return; c = levelCostAt(it.level); }
    opts.push({ kind, id, c });
  };
  if (pool === 'survival') { push('stat', 'vit'); push('gear', 'Armor'); push('gear', 'Helmet'); }
  else {
    push('stat', 'str'); push('stat', 'agi'); push('stat', 'lck');
    push('stat', 'frt'); push('stat', 'wis');
    push('gear', 'Weapon'); push('gear', 'Gloves'); push('gear', 'Amulet'); push('gear', 'Ring');
  }
  return opts.sort((a, b) => a.c - b.c);
}
function spendLumens(s) {
  let guard = 0;
  while (guard++ < 200000) {
    const pool = survivalMargin(s) < targetMargin(s) ? 'survival' : 'damage';
    let opts = _lumensOptions(s, pool);
    if (!opts.length || s.lumens < opts[0].c) {
      // pool escolhido esgotou/caro → tenta o outro pra não desperdiçar Lumens
      opts = _lumensOptions(s, pool === 'survival' ? 'damage' : 'survival');
      if (!opts.length || s.lumens < opts[0].c) break;
    }
    const o = opts[0];
    if (o.kind === 'stat') buyGoldStat(s, o.id); else levelUpItem(s, o.id);
  }
}

function spendVestiges(s) {
  const savingForAsc = (s.convsSinceAsc || 0) >= CONFIG.ascension.convPerAsc;
  const reserve = savingForAsc ? ascCost(s) : 0;
  const wantDef = survivalMargin(s) < targetMargin(s);
  let guard = 0;
  while (guard++ < 100000) {
    let best = null, bestCost = Infinity;
    // 1ª passada: pool preferido (defensivo se precisa de sobrevivência).
    for (const p of PASSIVES) {
      if (BUY_ONLY_REAL_PASSIVES && p.effect === 'stub') continue;
      const isDef = DEF_EFFECTS.has(p.effect);
      if (wantDef ? !isDef : isDef) continue;          // filtra pelo pool preferido
      if (!canBuyPassive(s, p.id)) continue;
      const c = passiveCost(p.id, passiveLevel(s, p.id));
      if (c < bestCost) { bestCost = c; best = p.id; }
    }
    // 2ª passada: qualquer passiva real (se o pool preferido não tem nada).
    if (best === null) {
      for (const p of PASSIVES) {
        if (BUY_ONLY_REAL_PASSIVES && p.effect === 'stub') continue;
        if (!canBuyPassive(s, p.id)) continue;
        const c = passiveCost(p.id, passiveLevel(s, p.id));
        if (c < bestCost) { bestCost = c; best = p.id; }
      }
    }
    if (best === null || (s.vestiges - bestCost) < reserve) break;
    buyPassive(s, best);
  }
}

function spendAll(s) { spendMaterials(s); spendVestiges(s); spendLumens(s); }

// ─── Muro & prestígio ───────────────────────────────────────────────────────
// Dois muros: DPS (kill-time alto) e SOBREVIVÊNCIA (não aguenta limpar um pack).
function dpsWall(s)      { return regularKillTime(s) > WALL_SECONDS; }
function survivalWall(s) { return survivalMargin(s) < timeToClearPack(s); }
function walled(s)       { return dpsWall(s) || survivalWall(s); }

// Convergir é PROATIVO só em conteúdo confortável (kill-time baixo + margem boa):
// converge reseta o nível, então só vale quando dá pra recuperá-lo rápido.
function comfortable(s) {
  return !walled(s) && regularKillTime(s) < WALL_SECONDS * 0.5 && survivalMargin(s) > targetMargin(s);
}
// Predicado puro: há prestígio útil disponível agora? (sem efeitos colaterais)
function prestigeAvailable(s) {
  if (canAscend(s)) return true;
  const savingForAsc = (s.convsSinceAsc || 0) >= CONFIG.ascension.convPerAsc;
  return !savingForAsc && comfortable(s) && convergenceRecommended(s) && canConverge(s);
}
// Executa o prestígio disponível. Ascender: power-up puro, sempre que puder.
// Convergir: NUNCA como resposta a um muro (resetaria o nível e pioraria tudo).
function maybePrestige(s) {
  if (canAscend(s)) { const before = ascMultiplier(s); ascend(s); spendAll(s); return { kind: 'ASCEND', mult: ascMultiplier(s), from: before }; }
  const savingForAsc = (s.convsSinceAsc || 0) >= CONFIG.ascension.convPerAsc;
  if (!savingForAsc && comfortable(s) && convergenceRecommended(s) && canConverge(s)) { converge(s); spendAll(s); return { kind: 'CONVERGE' }; }
  return null;
}

// ─── Loop principal ─────────────────────────────────────────────────────────
function run() {
  const s = defaultState();
  spawnPack(s); s.playerHp = playerMaxHp(s);

  let gameTime = 0, ticks = 0, kills = 0, deaths = 0;
  let bestGlobal = 0, lastBestTime = 0, deathsSinceBest = 0;
  const lastMap = REGIONS.length - 1, lastSub = lastSubarea();
  let completed = false, softlock = false, softReason = '';
  const milestones = [];
  let convCount = 0, ascCount = 0;

  function snapshot(tag, extra) {
    const stats = enemyStatsFor(s.map, s.subarea);
    milestones.push(Object.assign({
      tag, h: +(gameTime / 3600).toFixed(2),
      map: s.map, sub: s.subarea, lvl: s.level,
      asc: s.ascensions || 0, conv: s.convergences || 0,
      tier: TIERS[heroTier(s)].name,
      dps: playerDps(s), ehp: playerMaxHp(s),
      mobHp: stats.hp * Math.pow(CONFIG.enemy.ascGrowth, s.ascensions || 0),
      kt: +regularKillTime(s).toFixed(1),
      marg: +survivalMargin(s).toFixed(1),
      deaths,
    }, extra || {}));
  }
  snapshot('start');

  const MAX_SEC = MAX_GAME_HOURS * 3600, STUCK_SEC = STUCK_HOURS * 3600;

  while (gameTime < MAX_SEC && ticks < MAX_TICKS) {
    if (!s.enemies || s.enemies.length === 0) spawnPack(s);
    const target = s.enemies[0];

    const effDps = playerDps(s) * (target.isBoss ? bossDmgMult(s) : 1);
    const killTimeEst = target.hp / Math.max(1e-300, effDps);
    const net = packIncomingPerSec(s) - hpRegenPerSec(s);
    const hp = s.playerHp == null ? playerMaxHp(s) : s.playerHp;
    const timeToDie = net > 0 ? hp / net : Infinity;
    let dt = Math.min(killTimeEst / 30, timeToDie / 10);
    if (!isFinite(dt) || dt <= 0) dt = killTimeEst / 30 || 0.1;
    dt = Math.max(0.05, Math.min(dt, 3600));

    const preMap = s.map, preSub = s.subarea;
    const evs = tick(s, dt);
    ticks++; gameTime += dt;

    for (const e of evs) {
      if (e.type === 'kill') {
        kills++; spendAll(s);
        if (e.isFinalBoss && preMap === lastMap && preSub === lastSub) completed = true;
      } else if (e.type === 'death') {
        deaths++; deathsSinceBest++;
      }
    }

    const gi = s.map * subareasPerMap() + s.subarea;
    if (gi > bestGlobal) { bestGlobal = gi; lastBestTime = gameTime; deathsSinceBest = 0; snapshot('depth'); }

    if (kills % 4 === 0 || survivalWall(s)) {
      const p = maybePrestige(s);
      if (p) {
        if (p.kind === 'ASCEND') { ascCount++; snapshot('ASCEND', { note: 'mult ×' + fmt(p.mult) }); }
        else { convCount++; if (convCount % 10 === 0) snapshot('converge', { note: '#' + convCount }); }
      }
    }

    if (completed) break;
    // softlock por sobrevivência: morrendo muito, sem avançar, e prestígio não resolve
    if (deathsSinceBest > DEATHS_TO_SOFTLOCK && !prestigeAvailable(s) && walled(s)) {
      softlock = true; softReason = survivalWall(s) ? 'sobrevivência (glass cannon)' : 'DPS'; break;
    }
    if (gameTime - lastBestTime > STUCK_SEC) { softlock = true; softReason = walled(s) ? (survivalWall(s) ? 'sobrevivência' : 'DPS') : 'sem avanço'; break; }
  }
  snapshot('end');

  // ─── Relatório ─────────────────────────────────────────────────────────────
  const R = '─'.repeat(104);
  console.log('\n' + '═'.repeat(104));
  console.log('SIM DA ENGINE REAL — robô competente auto-joga, mede pacing real');
  console.log('═'.repeat(104));
  console.log(`Params: WALL=${WALL_SECONDS}s  STUCK=${STUCK_HOURS}h  maxAsc=${CONFIG.ascension.maxAscensions}  ` +
              `convPerAsc=${CONFIG.ascension.convPerAsc}  subareaRamp=×${CONFIG.map.subareaRamp}  enemyDmg=HP×${CONFIG.enemy.dmgRatio}`);
  console.log(R);
  const H = (x, n) => String(x).padEnd(n), Hr = (x, n) => String(x).padStart(n);
  console.log(H('tag', 9) + Hr('h', 8) + Hr('map', 4) + Hr('sub', 4) + Hr('lvl', 7) + Hr('asc', 5) + Hr('conv', 6) +
              H('  tier', 13) + Hr('dps', 11) + Hr('ehp', 11) + Hr('mobHP', 11) + Hr('kt', 7) + Hr('marg', 8) + Hr('dth', 6) + '  note');
  console.log(R);
  for (const m of milestones) {
    console.log(H(m.tag, 9) + Hr(m.h, 8) + Hr(m.map, 4) + Hr(m.sub, 4) + Hr(m.lvl, 7) + Hr(m.asc, 5) + Hr(m.conv, 6) +
      H('  ' + m.tier, 13) + Hr(fmt(m.dps), 11) + Hr(fmt(m.ehp), 11) + Hr(fmt(m.mobHp), 11) +
      Hr(m.kt, 7) + Hr(m.marg === Infinity ? '∞' : m.marg, 8) + Hr(m.deaths, 6) + (m.note ? '  ' + m.note : ''));
  }
  console.log(R);

  const fm = Math.floor(bestGlobal / subareasPerMap()), fs = bestGlobal % subareasPerMap();
  console.log('VEREDITO');
  console.log(R);
  console.log(`  jogo ATIVO simulado : ${(gameTime / 3600).toFixed(1)} h   (${ticks.toLocaleString()} ticks)`);
  console.log(`  kills ${kills.toLocaleString()}   mortes ${deaths.toLocaleString()}   conv ${s.convergences || 0}   asc ${s.ascensions || 0}   (ASCENDs ${ascCount}, CONVERGEs ${convCount})`);
  console.log(`  profundidade máx : Mapa ${fm} (${REGIONS[fm].name}) Subárea ${fs + 1}/5  [passo global ${bestGlobal}/24]`);
  if (completed) console.log(`  ✅ COMPLETÁVEL — chefe final de ${REGIONS[lastMap].name} em ${(gameTime / 3600).toFixed(1)}h de jogo ativo.`);
  else if (softlock) {
    console.log(`  ⛔ SOFTLOCK (${softReason}) — Mapa ${s.map} Subárea ${s.subarea + 1}.`);
    console.log(`     kill-time=${regularKillTime(s).toFixed(1)}s  margem-sobrev=${survivalMargin(s) === Infinity ? '∞' : survivalMargin(s).toFixed(1) + 's'}  (precisa ≥${timeToClearPack(s).toFixed(1)}s)`);
    console.log(`     dps=${fmt(playerDps(s))}  ehp=${fmt(playerMaxHp(s))}  mobHP=${fmt(enemyStatsFor(s.map, s.subarea).hp * Math.pow(CONFIG.enemy.ascGrowth, s.ascensions))}  mobDMG=${fmt(enemyStatsFor(s.map, s.subarea).dmg)}`);
    console.log(`     asc=${s.ascensions} (próxima: ${CONFIG.ascension.convPerAsc} conv + ${fmt(ascCost(s))} vestiges; tem ${fmt(s.vestiges)} vest, ${s.convsSinceAsc} conv desde asc).`);
  } else console.log(`  ⏳ NÃO COMPLETOU em ${MAX_GAME_HOURS}h. Parou em Mapa ${s.map} Subárea ${s.subarea + 1}.`);
  console.log('═'.repeat(104) + '\n');

  return { completed, softlock, softReason, gameHours: gameTime / 3600, kills, deaths,
           convergences: s.convergences || 0, ascensions: s.ascensions || 0, bestGlobal };
}

run();
