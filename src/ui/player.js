// Tela do Player / Seeker (U-4) — FICHA do personagem + Convergence.
// Abas: Codex (ficha) | Convergence | Awakening.
// Codex: CARD do Seeker (evolui por tier) + lista de All Stats clicáveis (breakdown).
// Convergence (CP-3b): status (nº de converges, bônus +15%×N), barra de progresso
//   até o gate de NÍVEL, e o botão Converge real (gate por nível; reseta nível da
//   run + nível do gear, mantém raridade/mapa). A cerimônia usa o overlay existente.
//
// Contrato: buildPlayerView(root, state) monta o DOM uma vez;
//           renderPlayer(state) atualiza a cada exibição.

import { formatNumber, formatMult } from '../core/format.js';
import { picture } from '../data/assets.js';
import {
  runLevel, dps, playerHpMax, currentAPS, critChance, critChanceRaw, critDamageMult,
  convMult, damagePerHit, playerDefesa, veilFactor,
} from '../game/stats.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearCritDmgAdd, gearApsMult, gearLumensMult, gearXpMult } from '../game/gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveApsMult, passiveEcoMult } from '../game/passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult, memoireLumensMult, memoireXpMult } from '../game/memoires.js';
import { ascMult, despertarMult, currentRank } from '../game/ascension.js';
import { canConverge, doConverge, convGateLevel, convergeProgress } from '../game/convergence.js';
import { renderConvergence } from './convergence.js';
import { COMBAT, CRIT, LEVEL } from '../data/constants.js';
import { buildAwakenPane, renderAwakenPane } from './awaken.js';

// tier romano → número do card (seeker.card_tN). Espelha ascension.js.
const TIER_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const $ = (id) => document.getElementById(id);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
// ganho de um multiplicador em +% (×1.30 → "+30%") — mais agradável que "×1.30"
const gainPct = (mult) => `+${formatNumber((mult - 1) * 100).replace(/\.0$/, '')}%`;

// fatores de um breakdown — kind: base | active | idle (×1) | locked (pós-MVP).
// Mostra o GANHO em +% (×1.30 → "+30%"); ×1 vira "+0%".
const M = (label, v, postMvp = false) => {
  const one = Math.abs(v - 1) < 1e-9;
  return { label, disp: gainPct(v), kind: one ? (postMvp ? 'locked' : 'idle') : 'active' };
};
const ADDP = (label, frac) => ({ label, disp: `+${formatNumber(frac * 100)}%`, kind: frac > 1e-9 ? 'active' : 'idle' });

// base FLAT de dano/HP do nível (CP-3): baseDmg + nível×perLevel
const baseDamage = (s) => COMBAT.baseDmg + runLevel(s) * LEVEL.dmgPerLevel;
const baseHp = (s) => COMBAT.playerBaseHp + runLevel(s) * LEVEL.hpPerLevel;
const CONV_BONUS_PER = 0.15; // espelha CONVERGENCE.bonusPerConv (só display)

// ───── catálogo de stats da ficha (modelo CP-3) ─────
const STATS = {
  dmg: {
    label: 'Damage / hit',
    value: (s) => formatNumber(damagePerHit(s)),
    note: 'The damage of a single hit. The base scales with your Level (flat).',
    breakdown: (s) => [
      { label: `Base + Level ${formatNumber(runLevel(s))}`, disp: formatNumber(baseDamage(s)), kind: 'base' },
      M('Convergence', convMult(s)),
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
    note: 'Your real damage per second, crits included.',
    breakdown: (s) => {
      const critBonus = 1 + critChance(s) * (critDamageMult(s) - 1);
      return [
        { label: 'Damage / hit', disp: formatNumber(damagePerHit(s)), kind: 'base' },
        { label: 'Attack Speed', disp: `×${currentAPS(s).toFixed(2)}`, kind: 'active' },
        M('Crit bonus', critBonus),
      ];
    },
  },
  aps: {
    label: 'Attack Speed',
    value: (s) => currentAPS(s).toFixed(2),
    note: `How many times you attack each second. Capped at ${COMBAT.apsCap}/s.`,
    breakdown: (s) => {
      const resonance = 1 + 0.3 * Math.log10(Math.max(1, gearApsMult(s)));
      return [
        { label: 'Base', disp: COMBAT.baseAPS.toFixed(2), kind: 'base' },
        M('Fracture Pulse', passiveApsMult(s), true),
        M('Resonance (Gear)', resonance, true),
      ];
    },
  },
  critRate: {
    label: 'Critical Rate',
    value: (s) => pct(critChance(s)),
    note: 'Your chance to crit. Past 100% turns into extra Critical Damage. Comes from Gear & Passives.',
    breakdown: (s) => [
      { label: 'Base', disp: pct(CRIT.baseChance), kind: 'base' },
      ADDP('Gear (Grasp)', gearCritAdd(s)),
      ADDP('Passives', passiveCritAdd(s)),
    ],
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
    note: 'Your maximum health. The base scales with your Level (flat).',
    breakdown: (s) => [
      { label: `Base + Level ${formatNumber(runLevel(s))}`, disp: formatNumber(baseHp(s)), kind: 'base' },
      M('Convergence', convMult(s)),
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
    note: 'Reduces the damage you take. Granted by the Veil affix on your Gear.',
    breakdown: (s) => [
      { label: 'HP Max', disp: formatNumber(playerHpMax(s)), kind: 'base' },
      M('Veil mitigation', veilFactor(s), true),
    ],
  },
  lumensMult: {
    label: 'Lumens / kill',
    value: (s) => gainPct(convMult(s) * gearLumensMult(s) * passiveEcoMult(s) * memoireLumensMult(s)),
    note: 'Multiplier on the Lumens you earn from each kill.',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      M('Convergence', convMult(s)),
      M('Gear', gearLumensMult(s), true),
      M('Passives', passiveEcoMult(s), true),
      M('Mémoires', memoireLumensMult(s), true),
    ],
  },
  xpMult: {
    label: 'XP / kill',
    value: (s) => gainPct(convMult(s) * gearXpMult(s) * passiveEcoMult(s) * memoireXpMult(s)),
    note: 'Multiplier on the XP you earn from each kill.',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      M('Convergence', convMult(s)),
      M('Gear', gearXpMult(s), true),
      M('Passives', passiveEcoMult(s), true),
      M('Mémoires', memoireXpMult(s), true),
    ],
  },
  level: {
    label: 'Level',
    value: (s) => formatNumber(runLevel(s)),
    note: 'Your current Level, from this run’s XP. Each level gives flat Damage and HP. Resets on Convergence.',
    breakdown: (s) => [
      { label: 'Run XP', disp: formatNumber(s.xpRun), kind: 'base' },
      ADDP('Damage / level', LEVEL.dmgPerLevel / 100),
      ADDP('HP / level', LEVEL.hpPerLevel / 100),
    ],
  },
  convergence: {
    label: 'Convergence',
    value: (s) => gainPct(convMult(s)),
    note: 'A permanent boost to Damage, HP, XP and Lumens. +15% per Convergence.',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      ADDP(`Convergences (${formatNumber(s.convergences)})`, CONV_BONUS_PER * s.convergences),
    ],
  },
};

const STAT_GROUPS = [
  { title: 'Combat', ids: ['dmg', 'dps', 'aps', 'critRate', 'critDmg', 'hpMax', 'defense'] },
  { title: 'Economy', ids: ['lumensMult', 'xpMult'] },
  { title: 'Progression', ids: ['level', 'convergence'] },
];

let openStatId = null;
let activePane = 'codex'; // codex | converge | awaken

export function buildPlayerView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('player');
  root.innerHTML = `
    <div class="pl-tabs">
      <button type="button" class="pl-tab on" data-tab="codex">Codex</button>
      <button type="button" class="pl-tab" data-tab="converge">Convergence</button>
      <button type="button" class="pl-tab" data-tab="awaken">Awakening</button>
    </div>

    <div class="pl-pane pl-codex-pane" data-pane="codex">
    <div class="pl-screen" aria-hidden="true"></div>
    <aside class="pl-hero">
      <div class="pl-hero-art">
        ${picture('seeker.card_t1', { className: 'pl-portrait-img', alt: 'The Seeker' })}
      </div>
      <div class="pl-hero-inner">
        <h2 class="pl-name">The Seeker</h2>
        <div class="pl-tier" id="pl-tier">Order of the Watchers · Tier I</div>
        <div class="pl-hero-vitals">
          <div class="pl-vital">
            <span class="pl-vital-lbl">Level</span>
            <b class="pl-vital-val" id="pl-level">1</b>
          </div>
        </div>
      </div>
    </aside>

    <div class="pl-sheet">
      <div class="pl-codex-panel">
        <h3 class="pl-codex-title"><span id="pl-codex-rank">Seeker</span> Codex</h3>
        <p class="pl-codex-motto">Carry the light onward. Through you, the world remembers how to mend.</p>
        <div class="pl-stats-list" id="pl-stats-list"></div>
      </div>
    </div>
    </div><!-- /pl-codex-pane -->

    <!-- Convergence: tela (pane) renderizada por renderConvergence -->
    <div class="pl-pane pl-conv-pane" data-pane="converge" hidden></div>

    <div class="pl-pane pl-awaken-pane" data-pane="awaken" hidden></div>

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

  $('pl-stats-list').innerHTML = STAT_GROUPS.map((g) =>
    `<div class="pl-section">
       <h4 class="pl-sec-h">${g.title}</h4>
       ${g.ids.map((id) =>
        `<button type="button" class="pl-stat" data-stat="${id}">
           <span class="pl-stat-l">${STATS[id].label}</span>
           <span class="pl-stat-v" id="plv-${id}">—</span>
         </button>`).join('')}
     </div>`).join('');

  root.querySelectorAll('[data-stat]').forEach((el) =>
    el.addEventListener('click', () => openStat(state, el.dataset.stat)));

  $('pl-modal-x').addEventListener('click', closeModal);
  $('pl-modal-back').addEventListener('click', closeModal);

  // Aba Awakening — pane no formato Gear/Forge (módulo próprio)
  buildAwakenPane(root.querySelector('.pl-awaken-pane'), state);

  // Troca de abas Codex | Convergence | Awakening
  root.querySelectorAll('.pl-tab').forEach((tab) =>
    tab.addEventListener('click', () => {
      activePane = tab.dataset.tab;
      root.querySelectorAll('.pl-tab').forEach((t) => t.classList.toggle('on', t === tab));
      root.querySelectorAll('.pl-pane').forEach((p) => { p.hidden = p.dataset.pane !== activePane; });
      if (activePane === 'awaken') renderAwakenPane(state);
      if (activePane === 'converge') renderConvergence(root.querySelector('.pl-conv-pane'), convData(state));
    }));
}

// "The Seed keeps": só o que está LIBERADO. Map 1 = só Gear; os sistemas Map 2+
// (posição no mapa multi, Vestiges, Passivas, Mémoires) entram quando desbloqueiam.
function convKeeps(state) {
  const list = ['Gear rarity &amp; levels'];
  if ((state.maxMap || state.map || 1) >= 2) list.push('Map position', 'Vestiges', 'Passives &amp; Mémoires');
  return list;
}

// Monta os dados reais do overlay de Convergence a partir do state.
function convData(state) {
  const lvl = runLevel(state);
  const gate = convGateLevel(state.convergences);
  return {
    convergences: formatNumber(state.convergences),
    bonus: `${formatNumber(state.convPoints)} pts`,         // Pontos acumulados
    gateLabel: `Level ${formatNumber(lvl)} / ${formatNumber(gate)}`,
    progressPct: Math.floor(convergeProgress(state) * 100),
    able: canConverge(state),
    gate: formatNumber(gate),
    grant: `+${formatNumber(lvl)} pts`,                     // Pontos = nível ao convergir
    grantTags: ['Passive points'],
    // RESETA ao convergir: LVL (nível da run) + Lumens + acesso às áreas fundas.
    returns: ['LVL', 'Lumens', 'Deep-area access'],
    keeps: convKeeps(state),
    lore: 'To keep the world, you let it go. Each new threshold lets the Seed disperse the light it gathered — and remember the pattern stronger.',
    note: 'Auto-Convergence available after Ascension I — the Rhythm will carry this rite for you.',
    onConverge: () => { doConverge(state); renderPlayer(state); },
  };
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
  if (activePane === 'awaken') renderAwakenPane(state);
  if (activePane === 'converge') {
    const cp = document.querySelector('#view-player .pl-conv-pane');
    if (cp) renderConvergence(cp, convData(state));
  }

  const rank = currentRank(state);
  $('pl-codex-rank').textContent = rank.name;
  const hero = document.querySelector('#view-player .pl-hero');
  if (hero) {
    const nm = hero.querySelector('.pl-name');
    if (nm) nm.textContent = rank.name;
    const tierEl = hero.querySelector('#pl-tier');
    if (tierEl) tierEl.textContent = `The Seeker · Tier ${rank.tier}`;
    const cardId = `seeker.card_t${TIER_NUM[rank.tier] || 1}`;
    const port = hero.querySelector('.pl-hero-art');
    if (port && port.dataset.card !== cardId) {
      port.dataset.card = cardId;
      port.innerHTML = picture(cardId, { className: 'pl-portrait-img', alt: 'The Seeker' });
    }
    hero.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; });
  }
  // Level exibido = o nível da RUN (que dá os stats e reseta na Convergence)
  $('pl-level').textContent = formatNumber(runLevel(state));

  for (const g of STAT_GROUPS) for (const id of g.ids) $(`plv-${id}`).textContent = STATS[id].value(state);

  if (openStatId) renderModal(state);
}
