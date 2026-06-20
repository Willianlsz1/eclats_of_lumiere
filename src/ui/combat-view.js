// Cena de combate do v0: Seeker à esquerda, 1 mob ao centro, floaties de dano/gold,
// painel de upgrades à direita, barra "próximo unlock" no rodapé.
import { picture, bg } from '../data/assets.js';
import { formatNumber } from '../core/format.js';
import { UPGRADES, AREAS } from '../data/constants.js';
import {
  playerDano,
  playerHpMax,
  playerAPS,
  levelFromXp,
  xpForLevel,
  xpToNext,
} from '../game/player.js';
import { upgradeCost, buyUpgrade } from '../game/economy.js';

const SEEKER_ART = 'seeker.card_t1';

let els = {};
let mobArt = null;

export function buildCombatView(root, state) {
  const area = AREAS[state.area - 1];
  root.innerHTML = `
    <div class="cb-backdrop" id="cb-backdrop"></div>
    <div class="cb-vignette"></div>

    <div class="cb-seeker">
      <div class="cb-art">${picture(SEEKER_ART, { alt: 'Seeker' })}</div>
      <div class="cb-info">
        <div class="cb-name">O Seeker — <span id="seeker-lvl">LV 1</span></div>
        <div class="cb-bar hp"><i id="seeker-hp-fill"></i><span id="seeker-hp-text"></span></div>
        <div class="cb-bar xp"><i id="seeker-xp-fill"></i><span id="seeker-xp-text"></span></div>
        <div class="cb-stats" id="seeker-stats"></div>
      </div>
    </div>

    <div class="cb-arena" id="cb-arena"></div>
    <div class="cb-fx" id="cb-fx"></div>

    <aside class="upgrade-panel" id="upgrade-panel">
      <h3 class="upg-title">Forja</h3>
    </aside>

    <div class="cb-progress">
      <div class="cb-progress-label" id="area-label">${area.name}</div>
      <div class="cb-progress-bar"><i id="area-fill"></i><span id="area-text"></span></div>
    </div>
  `;
  document.getElementById('cb-backdrop').style.backgroundImage = bg(area.bg);

  els = {
    lvl: root.querySelector('#seeker-lvl'),
    hpFill: root.querySelector('#seeker-hp-fill'),
    hpText: root.querySelector('#seeker-hp-text'),
    xpFill: root.querySelector('#seeker-xp-fill'),
    xpText: root.querySelector('#seeker-xp-text'),
    stats: root.querySelector('#seeker-stats'),
    arena: root.querySelector('#cb-arena'),
    fx: root.querySelector('#cb-fx'),
    panel: root.querySelector('#upgrade-panel'),
    areaLabel: root.querySelector('#area-label'),
    areaFill: root.querySelector('#area-fill'),
    areaText: root.querySelector('#area-text'),
  };

  // Botões de upgrade.
  els.panel.insertAdjacentHTML(
    'beforeend',
    ['dano', 'vida']
      .map(
        (k) =>
          `<button class="upg-btn" data-kind="${k}">` +
          `<span class="upg-main"><b>${UPGRADES[k].label}</b>` +
          `<small id="upg-lvl-${k}"></small></span>` +
          `<span class="upg-cost" id="upg-cost-${k}"></span></button>`
      )
      .join('')
  );
  els.panel.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.upg-btn');
    if (btn) buyUpgrade(state, btn.dataset.kind);
  });
  mobArt = null;
}

export function renderCombat(state) {
  const hpMax = playerHpMax(state);
  const lvl = levelFromXp(state.xpTotal);
  const area = AREAS[state.area - 1];

  // Seeker.
  els.lvl.textContent = `LV ${lvl}`;
  els.hpFill.style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  els.hpText.textContent = `${formatNumber(Math.max(0, state.player.hp))} / ${formatNumber(hpMax)}`;
  const into = state.xpTotal - xpForLevel(lvl);
  const need = xpToNext(lvl);
  els.xpFill.style.width = `${Math.min(100, (into / need) * 100)}%`;
  els.xpText.textContent = `XP ${formatNumber(into)} / ${formatNumber(need)}`;
  els.stats.innerHTML =
    `<span>⚔ ${formatNumber(playerDano(state))}</span>` +
    `<span>⚡ ${playerAPS(state).toFixed(2)} APS</span>`;

  // Barra "próximo unlock" (progresso de nível até o cap da área).
  const capPct = Math.min(100, (lvl / area.lvlCap) * 100);
  els.areaFill.style.width = `${capPct}%`;
  els.areaText.textContent =
    state.unlockedArea > state.area
      ? 'Área 1 limpa ✦'
      : `LV ${lvl} / ${area.lvlCap}`;

  // Mob (1 só).
  const e = state.enemy;
  if (e) {
    if (mobArt !== e.art) {
      els.arena.innerHTML =
        `<div class="cb-enemy" id="mob">` +
        `<div class="emob-label"><span class="emob-name">${e.name}</span>` +
        `<span class="emob-lvl">LV ${e.level}</span></div>` +
        `<div class="emob-art">${picture(e.art, { alt: e.name })}</div>` +
        `<div class="emob-bar"><i id="mob-hp-fill"></i></div>` +
        `<div class="emob-floats" id="mob-floats"></div>` +
        `</div>`;
      mobArt = e.art;
    }
    const fill = els.arena.querySelector('#mob-hp-fill');
    if (fill) fill.style.width = `${Math.max(0, (e.hp / e.hpMax) * 100)}%`;
  } else if (mobArt !== null) {
    els.arena.innerHTML = '';
    mobArt = null;
  }

  // Floaties.
  const floats = document.getElementById('mob-floats');
  while (state.fx.length) {
    const f = state.fx.shift();
    const span = document.createElement('span');
    if (f.kind === 'hit' && floats) {
      span.className = 'float-dmg';
      span.textContent = '-' + formatNumber(f.amount);
      span.style.left = `${40 + Math.random() * 20}%`;
      floats.appendChild(span);
    } else {
      span.className = 'float-gold';
      span.textContent = '+' + formatNumber(f.amount);
      els.fx.appendChild(span);
    }
    setTimeout(() => span.remove(), 750);
  }

  // Custos / níveis dos upgrades.
  for (const k of ['dano', 'vida']) {
    const c = document.getElementById(`upg-cost-${k}`);
    const l = document.getElementById(`upg-lvl-${k}`);
    if (!c) continue;
    const cost = upgradeCost(k, state.upgrades[k]);
    c.textContent = formatNumber(cost);
    if (l) l.textContent = `Nv ${state.upgrades[k]}`;
    const btn = c.closest('.upg-btn');
    if (btn) btn.classList.toggle('affordable', state.gold >= cost);
  }
}
