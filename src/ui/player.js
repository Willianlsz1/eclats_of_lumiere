// Tela do Player / Seeker (U-4) — FICHA do personagem.
// Esquerda: retrato (identidade) + Level + parede de Convergence.
// Direita: build summary (números-manchete) · All Stats agrupadas e clicáveis
// (abrem o breakdown de COMO a stat é calculada, com as fontes reais do GDD) ·
// Gold Stats (única ação: comprar com Lumens) · Convergence.
//
// Contrato: buildPlayerView(root, state) monta o DOM uma vez;
//           renderPlayer(state) atualiza a cada exibição.

import { formatNumber, formatMult } from '../core/format.js';
import { picture } from '../data/assets.js';
import {
  heroLevel, dps, playerHpMax, currentAPS, critChance, critChanceRaw, critDamageMult,
  convFactor, damagePerHit, levelBonus, playerDefesa, veilFactor,
  strTotal, vitTotal, frtTotal, wisTotal,
  statCostNext, buyStat, buyStatMax,
} from '../game/stats.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearCritDmgAdd, gearApsMult } from '../game/gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveApsMult } from '../game/passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult } from '../game/memoires.js';
import { ascMult, despertarMult } from '../game/ascension.js';
import { currentRank, seekerFrame, seekerPortrait } from '../game/ascension.js';
import { COMBAT, CRIT, GOLD_STATS } from '../data/constants.js';

const $ = (id) => document.getElementById(id);

// ───── helpers de formatação dos fatores ─────
const pct = (x) => `${(x * 100).toFixed(1)}%`;

// produto dos milestones de Gold Stats atingidos pelo nível (espelha stats.js)
function milestoneMult(level) {
  let m = 1;
  for (const [at, x] of GOLD_STATS.milestones) if (level >= at) m *= x;
  return m;
}

// fatores de um breakdown — kind: base | active | idle (×1 agora) | locked (pós-MVP)
// MUL: fator multiplicativo em % total (×3.89 → "389%"). 100% = sem efeito.
const M = (label, v, postMvp = false) => {
  const one = Math.abs(v - 1) < 1e-9;
  return { label, disp: formatMult(v), kind: one ? (postMvp ? 'locked' : 'idle') : 'active' };
};
// ADDP: contribuição aditiva a um multiplicador, em % (fração 3.17 → "+317%")
const ADDP = (label, frac) => ({ label, disp: `+${formatNumber(frac * 100)}%`, kind: frac > 1e-9 ? 'active' : 'idle' });

// ───── catálogo de stats da ficha ─────
// value(s) → texto exibido · breakdown(s) → linhas de fatores · note opcional.
const STATS = {
  dmg: {
    label: 'Damage / hit',
    value: (s) => formatNumber(damagePerHit(s)),
    note: 'The damage of a single hit.',
    breakdown: (s) => [
      { label: 'Base', disp: String(COMBAT.baseDmg), kind: 'base' },
      M('STR', strTotal(s)),
      M('Level Bonus', levelBonus(s.xpTotal)),
      M('Convergence', convFactor(s)),
      M('Ascension', ascMult(s)),
      M('Despertar', despertarMult(s)),
      M('Gear', gearDamageMult(s), true),
      M('Passives', passiveDmgMult(s), true),
      M('Mémoires', memoireDmgMult(s), true),
    ],
  },
  dps: {
    label: 'DPS',
    value: (s) => formatNumber(dps(s)),
    breakdown: (s) => {
      const critBonus = 1 + critChance(s) * (critDamageMult(s) - 1);
      return [
        { label: 'Damage / hit', disp: formatNumber(damagePerHit(s)), kind: 'base' },
        { label: 'Attack Speed', disp: `×${currentAPS(s).toFixed(2)}`, kind: 'active' },
        M('Crit bonus', critBonus),
      ];
    },
    note: 'Your real damage per second, crits included.',
  },
  aps: {
    label: 'Attack Speed',
    value: (s) => currentAPS(s).toFixed(2),
    breakdown: (s) => {
      const agiFactor = Math.min(COMBAT.agiApsCap, 1 + s.stats.agi * GOLD_STATS.per.agi);
      const resonance = 1 + 0.3 * Math.log10(Math.max(1, gearApsMult(s)));
      return [
        { label: 'Base', disp: COMBAT.baseAPS.toFixed(2), kind: 'base' },
        M('AGI', agiFactor),
        M('Fracture Pulse', passiveApsMult(s), true),
        M('Resonance', resonance, true),
      ];
    },
    note: `How many times you attack each second. Capped at ${COMBAT.apsCap}/s.`,
  },
  critRate: {
    label: 'Critical Rate',
    value: (s) => pct(critChance(s)),
    breakdown: (s) => [
      { label: 'Base', disp: pct(CRIT.baseChance), kind: 'base' },
      ADDP('LCK', s.stats.lck * GOLD_STATS.per.lck),
      ADDP('Gear', gearCritAdd(s)),
      ADDP('Passives', passiveCritAdd(s)),
    ],
    note: 'Your chance to land a critical hit. Anything past 100% turns into extra Critical Damage.',
  },
  critDmg: {
    label: 'Critical Damage',
    value: (s) => formatMult(critDamageMult(s)),
    note: 'How hard your critical hits strike.',
    breakdown: (s) => {
      const overflow = Math.max(0, critChanceRaw(s) - 1);
      return [
        { label: 'Base', disp: formatMult(CRIT.baseDamageMult), kind: 'base' },
        ADDP('Crit overflow', overflow * CRIT.overflowFactor),
        ADDP('Gear', gearCritDmgAdd(s)),
        M('Mémoire de la Forme', memoireCritDmgMult(s), true),
      ];
    },
  },
  hpMax: {
    label: 'HP Max',
    value: (s) => formatNumber(playerHpMax(s)),
    note: 'Your maximum health.',
    breakdown: (s) => [
      { label: 'Base', disp: String(COMBAT.playerBaseHp), kind: 'base' },
      M('VIT', vitTotal(s)),
      M('Level Bonus', levelBonus(s.xpTotal)),
      M('Convergence', convFactor(s)),
      M('Ascension', ascMult(s)),
      M('Despertar', despertarMult(s)),
      M('Gear', gearHpMult(s), true),
      M('Passives', passiveHpMult(s), true),
      M('Mémoires', memoireHpMult(s), true),
    ],
  },
  defense: {
    label: 'Defense (Veil)',
    value: (s) => formatNumber(playerDefesa(s)),
    breakdown: (s) => [
      { label: 'HP Max', disp: formatNumber(playerHpMax(s)), kind: 'base' },
      M('Veil mitigation', veilFactor(s), true),
    ],
    note: 'Reduces the damage you take. Granted by the Veil affix on your Gear.',
  },
  lumensMult: {
    label: 'Lumens / kill',
    value: (s) => formatMult(frtTotal(s)),
    breakdown: (s) => {
      const lv = s.stats.frt;
      return [
        { label: 'Base', disp: formatMult(1), kind: 'base' },
        ADDP(`FRT (Lv ${formatNumber(lv)})`, lv * GOLD_STATS.per.frt),
        M('Milestones', milestoneMult(lv)),
      ];
    },
    note: 'Increases the Lumens you earn from each kill.',
  },
  xpMult: {
    label: 'XP / kill',
    value: (s) => formatMult(wisTotal(s)),
    breakdown: (s) => {
      const lv = s.stats.wis;
      return [
        { label: 'Base', disp: formatMult(1), kind: 'base' },
        ADDP(`WIS (Lv ${formatNumber(lv)})`, lv * GOLD_STATS.per.wis),
        M('Milestones', milestoneMult(lv)),
      ];
    },
    note: 'Increases the XP you earn from each kill.',
  },
  level: {
    label: 'Seeker Level',
    value: (s) => formatNumber(heroLevel(s.xpTotal)),
    breakdown: (s) => [
      { label: 'Lifetime XP', disp: formatNumber(s.xpTotal), kind: 'base' },
    ],
    note: 'Your overall progress. Higher levels raise your Level Bonus.',
  },
  levelBonus: {
    label: 'Level Bonus',
    value: (s) => formatMult(levelBonus(s.xpTotal)),
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      ADDP('From your Level', Math.sqrt(heroLevel(s.xpTotal)) * 0.20),
    ],
    note: 'A bonus to both Damage and HP that grows with your Level.',
  },
  convFactor: {
    label: 'Convergence Factor',
    value: (s) => formatMult(convFactor(s)),
    breakdown: (s) => {
      const base = 1 + 0.04 * 1.38 ** s.ascensions;
      return [
        { label: 'Bonus per point', disp: formatMult(base), kind: 'active' },
        { label: 'Convergence Points', disp: formatNumber(s.convPoints), kind: 'active' },
      ];
    },
    note: 'Boosts Damage and HP. Each Convergence adds points; Ascension resets them but makes every point stronger.',
  },
};

const STAT_GROUPS = [
  { title: 'Combat', ids: ['dmg', 'dps', 'aps', 'critRate', 'critDmg', 'hpMax', 'defense'] },
  { title: 'Economy', ids: ['lumensMult', 'xpMult'] },
  { title: 'Progression', ids: ['level', 'levelBonus', 'convFactor'] },
];

// Os 6 Gold Stats (§5) — rótulo + efeito derivado do state
const STAT_DEFS = [
  { key: 'str', label: 'STR', effect: (s) => `${formatMult(strTotal(s))} dmg` },
  { key: 'vit', label: 'VIT', effect: (s) => `${formatMult(vitTotal(s))} HP` },
  { key: 'agi', label: 'AGI', effect: (s) => `${currentAPS(s).toFixed(2)} APS` },
  { key: 'lck', label: 'LCK', effect: (s) => `${pct(critChance(s))} crit` },
  { key: 'frt', label: 'FRT', effect: (s) => `${formatMult(frtTotal(s))} Lumens` },
  { key: 'wis', label: 'WIS', effect: (s) => `${formatMult(wisTotal(s))} XP` },
];

let openStatId = null; // breakdown aberto (pra live-update)

export function buildPlayerView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('player');
  root.innerHTML = `
    <aside class="pl-hero">
      <div class="pl-hero-art">
        ${picture('seeker.t1', { className: 'pl-portrait-img', alt: 'The Seeker' })}
      </div>
      ${picture('frames.tier1', { className: 'pl-tierframe', alt: '' })}
      <div class="pl-hero-inner">
        <h2 class="pl-name">The Seeker</h2>
        <div class="pl-tier" id="pl-tier">Order of the Watchers · Tier I</div>
        <p class="pl-lore">“He carries the light, he is not the light yet.”</p>
        <div class="pl-hero-vitals">
          <div class="pl-vital">
            <span class="pl-vital-lbl">Level</span>
            <b class="pl-vital-val" id="pl-level">1</b>
          </div>
        </div>
        <p class="pl-codex">He entered the Order as any other initiate, with no destiny proclaimed. But the shard he carries is the Seed, the one fragment that still remembers the whole. In every other vessel the light sleeps, caged and silent. In him, it converges.</p>
      </div>
    </aside>

    <div class="pl-sheet">
      <div class="pl-codex-panel">
        <h3 class="pl-codex-title"><span id="pl-codex-rank">Seeker</span> Codex</h3>
        <p class="pl-codex-motto">Carry the light onward. Through you, the world remembers how to mend.</p>
        <div class="pl-stats-list" id="pl-stats-list"></div>

        <div class="pl-section">
          <h4 class="pl-sec-h">Gold Stats <span class="pl-sub">— spend Lumens to grow</span></h4>
          <div class="pl-rows" id="pl-rows"></div>
        </div>
      </div>
    </div>

    <!-- breakdown (modal) -->
    <div class="pl-modal" id="pl-modal" hidden>
      <div class="pl-modal-back" id="pl-modal-back"></div>
      <div class="pl-modal-card">
        <button type="button" class="pl-modal-x" id="pl-modal-x" aria-label="Close">×</button>
        <div class="pl-modal-head">
          <h3 id="pl-modal-title"></h3>
          <div class="pl-modal-total" id="pl-modal-total"></div>
        </div>
        <div class="pl-modal-rows" id="pl-modal-rows"></div>
        <p class="pl-modal-note" id="pl-modal-note"></p>
      </div>
    </div>
  `;

  // Lista única de stats (read-only), em seções sequenciais; cada linha clicável → breakdown
  $('pl-stats-list').innerHTML = STAT_GROUPS.map((g) =>
    `<div class="pl-section">
       <h4 class="pl-sec-h">${g.title}</h4>
       ${g.ids.map((id) =>
        `<button type="button" class="pl-stat" data-stat="${id}">
           <span class="pl-stat-l">${STATS[id].label}</span>
           <span class="pl-stat-v" id="plv-${id}">—</span>
         </button>`).join('')}
     </div>`).join('');

  // Clique em qualquer card/linha de stat → abre o breakdown
  root.querySelectorAll('[data-stat]').forEach((el) =>
    el.addEventListener('click', () => openStat(state, el.dataset.stat)));

  // Linhas dos Gold Stats (construídas uma vez; atualizadas no render)
  const rows = $('pl-rows');
  for (const def of STAT_DEFS) {
    const row = document.createElement('div');
    row.className = 'pl-row';
    row.innerHTML = `
      <span class="pl-s-label">${def.label} <b class="pl-s-level"></b></span>
      <span class="pl-s-effect"></span>
      <button type="button" class="pl-s-buy"></button>
      <button type="button" class="pl-s-max">Max</button>
    `;
    row.querySelector('.pl-s-buy').addEventListener('click', () => buyStat(state, def.key));
    row.querySelector('.pl-s-max').addEventListener('click', () => buyStatMax(state, def.key));
    rows.appendChild(row);
  }

  $('pl-modal-x').addEventListener('click', closeModal);
  $('pl-modal-back').addEventListener('click', closeModal);
}

function openStat(state, id) {
  if (!STATS[id]) return;
  openStatId = id;
  renderModal(state);
  $('pl-modal').hidden = false;
}
function closeModal() {
  openStatId = null;
  $('pl-modal').hidden = true;
}
function renderModal(state) {
  if (!openStatId) return;
  const st = STATS[openStatId];
  $('pl-modal-title').textContent = st.label;
  $('pl-modal-total').textContent = st.value(state);
  $('pl-modal-rows').innerHTML = st.breakdown(state).map((r) =>
    `<div class="pl-mrow ${r.kind}">
       <span>${r.label}${r.kind === 'locked' ? ' <i class="pl-lock">🔒</i>' : ''}</span>
       <b>${r.disp}</b>
     </div>`).join('');
  const note = $('pl-modal-note');
  note.textContent = st.note || '';
  note.hidden = !st.note;
}

export function renderPlayer(state) {
  const rank = currentRank(state);

  // Identidade
  $('pl-tier').textContent = `${rank.name} · Tier ${rank.tier}`;
  $('pl-codex-rank').textContent = rank.name; // o Codex acompanha o tier atual
  const hero = document.querySelector('#view-player .pl-hero');
  if (hero) {
    // retrato (arte) conforme o tier
    const portraitId = seekerPortrait(state);
    const port = hero.querySelector('.pl-hero-art');
    if (port && port.dataset.portrait !== portraitId) {
      port.dataset.portrait = portraitId;
      port.innerHTML = picture(portraitId, { className: 'pl-portrait-img', alt: 'The Seeker' });
    }
    // moldura do card = moldura do TIER atual (evolui com a progressão)
    const frameId = seekerFrame(state);
    if (hero.dataset.frame !== frameId) {
      hero.dataset.frame = frameId;
      const old = hero.querySelector('.pl-tierframe');
      const fresh = picture(frameId, { className: 'pl-tierframe', alt: '' });
      if (old) old.outerHTML = fresh;
    }
    hero.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; });
  }
  $('pl-level').textContent = formatNumber(heroLevel(state.xpTotal));

  // Lista de stats (mesmo catálogo)
  for (const g of STAT_GROUPS) for (const id of g.ids) $(`plv-${id}`).textContent = STATS[id].value(state);

  // Gold Stats
  const rows = $('pl-rows').children;
  STAT_DEFS.forEach((def, i) => {
    const row = rows[i];
    const level = state.stats[def.key];
    const cost = statCostNext(level);
    const afford = state.lumens >= cost;
    row.querySelector('.pl-s-level').textContent = `Lv ${formatNumber(level)}`;
    row.querySelector('.pl-s-effect').textContent = def.effect(state);
    const buy = row.querySelector('.pl-s-buy');
    buy.textContent = `+1 (${formatNumber(cost)})`;
    buy.disabled = !afford;
    row.querySelector('.pl-s-max').disabled = !afford;
  });

  // breakdown aberto: live-update
  if (openStatId) renderModal(state);
}
