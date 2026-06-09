// ============================================================================
// sim-redesign.js  —  PROTÓTIPO DESCARTÁVEL (não é parte do jogo)
// ----------------------------------------------------------------------------
// Valida a CURVA do redesign (docs/progression-redesign.md + implementation-plan.md)
// ANTES de tocar o código real. Todos os números aqui são os PLACEHOLDERS dos docs.
// Objetivo: ver que pacing esses números produzem e onde eles quebram.
//
//   node tests/sim-redesign.js
// ============================================================================

'use strict';

// ─── Parâmetros do redesign (placeholders dos docs) ─────────────────────────

// Eras: bandas de nível + âncoras de HP (implementation-plan.md, D3).
// Bandas são contíguas em HP: o fim de uma era = o começo da próxima.
const ERAS = [
  { name: 'Auroral',     lvl: [1, 50],          hp: [10,   1e3],  ratio: 0.12, spike: 10   },
  { name: 'Umbral',      lvl: [50, 500],        hp: [1e3,  1e7],  ratio: 0.08, spike: 50   },
  { name: 'Crystalline', lvl: [500, 50000],     hp: [1e7,  1e16], ratio: 0.05, spike: 200  },
  { name: 'Ashen',       lvl: [50000, 1e6],     hp: [1e16, 1e30], ratio: 0.035,spike: 1000 },
  { name: 'Pinnacle',    lvl: [1e6, 1e9],       hp: [1e30, 1e60], ratio: 0.025,spike: Infinity },
];

// Herói (BALANCE.md, constantes base).
const HERO = {
  baseDamage:  5,
  dmgPerLevel: 1.5,
  atkSpeed:    1.0,
  critMult:    1.25,   // ~25% crit × 2 dmg, placeholder
};

// Attunement — a fonte de poder geométrica suave (progression-redesign.md, Camada 1).
// +1 por Rebirth. Cada ponto: +2% poder base, +1% no valor de cada nível.
const ATT_BASE = 0.02;
const ATT_LVL  = 0.01;

// Alvos de pacing (build-plan.md, Fase 5).
const KILL_TARGET = 4.5;          // segundos pra matar um mob "no seu nível"
const WALL_MULT   = 2.5;          // killtime > 2.5× alvo → muro → sinal de Rebirth

// ─── Modelo ─────────────────────────────────────────────────────────────────

function eraAt(level) {
  for (const e of ERAS) if (level >= e.lvl[0] && level <= e.lvl[1]) return e;
  return ERAS[ERAS.length - 1];
}

// HP do mob no nível L: interpolação geométrica em espaço log-nível dentro da banda.
// "rápida no começo, gentil no fim" será afinado depois; v1 = geométrico puro.
function mobHP(level) {
  const e = eraAt(level);
  const [lo, hi]   = e.lvl;
  const [h0, h1]   = e.hp;
  if (hi === lo) return h0;
  const p = (Math.log(level) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
  return h0 * Math.pow(h1 / h0, p);
}

// Arma: stat primário ancorado ao HP do mob no nível em que foi forjada/upada (ratio × HP).
// É a "espinha" que mantém o killtime ~constante (equipment-redesign.md).
function weaponPrimary(craftLevel, rarityMult) {
  const e = eraAt(craftLevel);
  return e.ratio * mobHP(craftLevel) * rarityMult;
}

// Dano do personagem: linear no nível, amplificado por Attunement.
function heroChar(level, att) {
  const perLvl = HERO.dmgPerLevel * (1 + ATT_LVL * att);
  const base   = HERO.baseDamage + (level - 1) * perLvl;
  return base * (1 + ATT_BASE * att);
}

function dps(level, att, weapon, affixMult) {
  return (heroChar(level, att) + weapon) * HERO.atkSpeed * HERO.critMult * (1 + affixMult);
}

function killtime(level, att, weapon, affixMult) {
  return mobHP(level) / dps(level, att, weapon, affixMult);
}

// ─── Helpers de formatação ──────────────────────────────────────────────────

function fmt(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  if (exp >= 6 || exp <= -3) return n.toExponential(2);
  if (exp >= 3) return Math.round(n).toLocaleString('en-US');
  return n.toFixed(exp >= 1 ? 1 : 2);
}
function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }
function padL(s, n){ s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; }
function rule(c = '─', n = 78) { return c.repeat(n); }

// ─── CHECK A — Curva de HP across eras ──────────────────────────────────────

function checkHpCurve() {
  console.log('\n' + rule('═'));
  console.log('CHECK A — Curva de HP (âncoras D3, interpolação geométrica)');
  console.log(rule('═'));
  console.log(pad('Era', 13) + pad('Nível', 12) + pad('HP', 14) + 'âncora?');
  console.log(rule());
  for (const e of ERAS) {
    const [lo, hi] = e.lvl;
    // amostra: piso, ~25%, ~50%, ~75%, teto (em log-nível)
    const samples = [0, 0.25, 0.5, 0.75, 1].map(p =>
      Math.round(Math.exp(Math.log(lo) + p * (Math.log(hi) - Math.log(lo)))));
    samples.forEach((L, i) => {
      const anchor = i === 0 ? `início (alvo ${fmt(e.hp[0])})`
                   : i === 4 ? `fim (alvo ${fmt(e.hp[1])})` : '';
      console.log(pad(i === 0 ? e.name : '', 13) + pad('Lv ' + fmt(L), 12) +
                  pad(fmt(mobHP(L)), 14) + anchor);
    });
    console.log(rule('·'));
  }
}

// ─── CHECK B — Spike de Ascensão vs salto de era ────────────────────────────
// A pergunta do doc: "o spike cobre o salto pra entrar na era nova?"
// Modelo: ao bater o gatekeeper (HP=hp_hi da era N) o jogador tinha poder P≈HP/killtime.
// A Ascensão RESETA gear+nível+attunement; sobra só baseline×spike×(gear novo common).
// O gear novo da era N+1 é ancorado ao HP novo (ratio×hp_lo) → killtime ~baseline sozinho.
// Então testamos: (1) entrar SÓ com o spike (sem gear) e (2) entrar com o common starter.

function checkSpikeCoverage() {
  console.log('\n' + rule('═'));
  console.log('CHECK B — Entrar na era seguinte pós-Ascensão (spike vs gear ancorado)');
  console.log(rule('═'));
  console.log('Pós-Ascensão: nível 1, attunement 0, gear resetado. Mob de entrada = topo da era anterior.');
  console.log(rule());
  console.log(pad('Transição', 22) + pad('HP entrada', 13) + pad('spike', 8) +
              pad('kt só-spike', 13) + 'kt c/ common starter');
  console.log(rule());

  let cumSpike = 1;
  for (let i = 0; i < ERAS.length - 1; i++) {
    const from = ERAS[i], to = ERAS[i + 1];
    cumSpike *= from.spike;                      // spikes acumulam (tier nunca zera)
    const entryLevel = to.lvl[0];
    const entryHP    = mobHP(entryLevel);        // = hp_hi(from) = hp_lo(to)

    // (1) Só o spike multiplicando o herói baseline (nível 1), SEM arma.
    const baselineChar = heroChar(1, 0);
    const dpsSpikeOnly = baselineChar * cumSpike * HERO.atkSpeed * HERO.critMult;
    const ktSpikeOnly  = entryHP / dpsSpikeOnly;

    // (2) Com o common starter da era nova (ancorado ao HP novo).
    const starter      = weaponPrimary(entryLevel, 1.0);   // common = ×1.0
    const dpsStarter   = (baselineChar * cumSpike + starter) * HERO.atkSpeed * HERO.critMult;
    const ktStarter    = entryHP / dpsStarter;

    console.log(
      pad(`${from.name}→${to.name}`, 22) +
      pad(fmt(entryHP), 13) +
      pad('×' + fmt(cumSpike), 8) +
      pad(ktSpikeOnly > 1e6 ? fmt(ktSpikeOnly)+'s' : ktSpikeOnly.toFixed(1)+'s', 13) +
      (ktStarter > 1e6 ? fmt(ktStarter)+'s' : ktStarter.toFixed(1)+'s'));
  }
  console.log(rule());
  console.log('Leitura: se "só-spike" explode mas "common starter" fica perto do alvo (~4.5s),');
  console.log('         então é o GEAR ANCORADO (não o spike) que sustenta a transição de era.');
}

// ─── CHECK C — Climb dentro de uma era com Rebirth (Attunement) ─────────────
// Modela o muro: a arma é upada em marcos discretos de raridade; entre upgrades o
// HP do mob ultrapassa a arma → killtime sobe → muro → Rebirth (+Attunement) → empurra.

const RARITY = [
  { name: 'common',    mult: 1.0 },
  { name: 'uncommon',  mult: 1.5 },
  { name: 'rare',      mult: 2.2 },
  { name: 'epic',      mult: 3.5 },
  { name: 'legendary', mult: 6.0 },
];

function checkEraClimb(eraIdx) {
  const e = ERAS[eraIdx];
  console.log('\n' + rule('═'));
  console.log(`CHECK C — Climb na era ${e.name} (Lv ${fmt(e.lvl[0])}–${fmt(e.lvl[1])}) com Rebirth`);
  console.log(rule('═'));
  console.log('Arma upa de raridade em marcos de nível (¼,½,¾ da banda); Rebirth no muro dá +Attunement.');
  console.log(rule());
  console.log(pad('Nível', 12) + pad('HP mob', 13) + pad('arma', 12) +
              pad('att', 6) + pad('killtime', 11) + 'evento');
  console.log(rule());

  const [lo, hi] = e.lvl;
  const logLo = Math.log(lo), logHi = Math.log(hi);
  // marcos de raridade em frações da banda (log-nível)
  const rarityMarks = [0, 0.25, 0.5, 0.75, 1.0];

  let att = 0;
  let rebirths = 0;
  let craftLevel = lo;
  let rarityIdx = 0;
  let level = lo;
  const step = (logHi - logLo) / 40;   // 40 passos log ao longo da banda

  for (let s = 0; s <= 40; s++) {
    level = Math.round(Math.exp(logLo + s * step));
    const frac = (Math.log(level) - logLo) / (logHi - logLo);

    // upa raridade ao cruzar um marco
    while (rarityIdx < rarityMarks.length - 1 && frac >= rarityMarks[rarityIdx + 1]) {
      rarityIdx++;
      craftLevel = level;
    }
    const weapon = weaponPrimary(craftLevel, RARITY[rarityIdx].mult);

    let kt = killtime(level, att, weapon, 0);
    let event = '';

    // muro: killtime passou do limiar → Rebirth (reseta nível do herói p/ o piso da era,
    // mas mantém gear/attunement e ganha +1 att). No modelo simplificado, o Rebirth
    // permite re-subir e o att acumulado empurra o killtime pra baixo.
    if (kt > KILL_TARGET * WALL_MULT) {
      rebirths++;
      att += 1;
      event = `⚡ MURO → Rebirth #${rebirths} (att→${att})`;
      kt = killtime(level, att, weapon, 0);     // recomputa com o att novo
    }

    // imprime só amostras-chave (marcos + muros) pra não poluir
    const isMark = rarityMarks.includes(rarityMarks.find(m => Math.abs(frac - m) < 0.02));
    if (s === 0 || s === 40 || event || (s % 8 === 0)) {
      if (!event && rarityIdx > 0 && Math.abs(frac - rarityMarks[rarityIdx]) < 0.03)
        event = `↑ ${RARITY[rarityIdx].name}`;
      console.log(pad('Lv ' + fmt(level), 12) + pad(fmt(mobHP(level)), 13) +
                  pad(fmt(weapon), 12) + pad(att, 6) +
                  pad(kt > 1e4 ? fmt(kt)+'s' : kt.toFixed(1)+'s', 11) + event);
    }
  }
  console.log(rule());
  console.log(`Resultado: ${rebirths} Rebirths pra atravessar ${e.name}. ` +
              `Attunement final: ${att}.`);
}

// ─── Run ────────────────────────────────────────────────────────────────────

checkHpCurve();
checkSpikeCoverage();
checkEraClimb(0);   // Auroral
checkEraClimb(1);   // Umbral

console.log('\n' + rule('═'));
console.log('Assunções v1 (a refinar): crit fixo 1.25, sem afixos, sem economia (Lumin/');
console.log('materiais), arma upa em marcos fixos, Rebirth = +1 att. A economia (renda vs');
console.log('custo de upgrade) é o próximo sim — é ela que define o nº REAL de Rebirths.');
console.log(rule('═'));
