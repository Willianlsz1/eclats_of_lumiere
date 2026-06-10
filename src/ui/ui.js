// UI provisória (sem arte — skin final é CP-G).
// Card do jogador à esquerda (com Gold Stats), grade de inimigos à direita,
// contadores no topo.

import { formatNumber } from '../core/format.js';
import {
  heroLevel, dps, playerHpMax, currentAPS,
  critChance, critDamageMult,
  strTotal, vitTotal, frtTotal, wisTotal,
  statCostNext, buyStat, buyStatMax,
} from '../game/stats.js';
import { changeSubarea } from '../game/combat.js';
import { getCurrentMap } from '../game/enemies.js';

const $ = (id) => document.getElementById(id);

// Rótulo e texto de efeito de cada Gold Stat (§5)
const STAT_DEFS = [
  { key: 'str', label: 'STR', effect: (s) => `×${formatNumber(strTotal(s))} dano` },
  { key: 'vit', label: 'VIT', effect: (s) => `×${formatNumber(vitTotal(s))} HP` },
  { key: 'agi', label: 'AGI', effect: (s) => `${currentAPS(s).toFixed(2)} APS` },
  { key: 'lck', label: 'LCK', effect: (s) => `${(critChance(s) * 100).toFixed(1)}% crit` },
  { key: 'frt', label: 'FRT', effect: (s) => `×${formatNumber(frtTotal(s))} Lumens` },
  { key: 'wis', label: 'WIS', effect: (s) => `×${formatNumber(wisTotal(s))} XP` },
];

export function setupUI(state) {
  $('btn-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('btn-next').addEventListener('click', () => changeSubarea(state, +1));

  const rows = $('stat-rows');
  for (const def of STAT_DEFS) {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <span class="s-label">${def.label} <b class="s-level"></b></span>
      <span class="s-effect"></span>
      <button type="button" class="s-buy"></button>
      <button type="button" class="s-max">Max</button>
    `;
    row.querySelector('.s-buy').addEventListener('click', () => buyStat(state, def.key));
    row.querySelector('.s-max').addEventListener('click', () => buyStatMax(state, def.key));
    rows.appendChild(row);
  }
}

export function renderUI(state) {
  const map = getCurrentMap();
  const hpMax = playerHpMax(state);

  // Topo
  $('top-lumens').textContent = formatNumber(state.lumens);
  $('top-kills').textContent = formatNumber(state.killsTotal);
  $('top-zone').textContent = `${map.name} · Subárea ${state.subarea}/${map.subareaCount}`;

  // Card do jogador
  $('p-level').textContent = formatNumber(heroLevel(state.xpTotal));
  $('p-hp-text').textContent = `${formatNumber(Math.max(0, state.player.hp))} / ${formatNumber(hpMax)}`;
  $('p-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('p-xp').textContent = formatNumber(state.xpTotal);
  $('p-dps').textContent = formatNumber(dps(state));
  $('p-aps').textContent = currentAPS(state).toFixed(2);
  $('p-crit').textContent = `${(critChance(state) * 100).toFixed(1)}% ×${critDamageMult(state).toFixed(2)}`;

  const status = $('p-status');
  if (state.player.dead) {
    status.textContent = `Morto — respawn em ${Math.ceil(state.player.respawnTimer)}s (recuou uma subárea)`;
    status.hidden = false;
  } else {
    status.hidden = true;
  }

  renderStats(state);
  renderEnemies(state);
}

function renderStats(state) {
  const rows = $('stat-rows').children;
  STAT_DEFS.forEach((def, i) => {
    const row = rows[i];
    const level = state.stats[def.key];
    const cost = statCostNext(level);
    row.querySelector('.s-level').textContent = `Lv ${formatNumber(level)}`;
    row.querySelector('.s-effect').textContent = def.effect(state);
    const buy = row.querySelector('.s-buy');
    buy.textContent = `+1 (${formatNumber(cost)})`;
    buy.disabled = state.lumens < cost;
    row.querySelector('.s-max').disabled = state.lumens < cost;
  });
}

function renderEnemies(state) {
  const grid = $('enemy-grid');

  // Reconstroi os cards quando o pack muda de tamanho/identidade
  if (grid.children.length !== state.enemies.length) {
    grid.innerHTML = '';
    for (const mob of state.enemies) grid.appendChild(buildEnemyCard(mob));
  }

  state.enemies.forEach((mob, i) => {
    const card = grid.children[i];
    if (card.dataset.mobId !== String(mob.id)) {
      grid.replaceChild(buildEnemyCard(mob), card);
      return;
    }
    card.querySelector('.e-hp-text').textContent =
      `${formatNumber(Math.max(0, mob.hp))} / ${formatNumber(mob.hpMax)}`;
    card.querySelector('.e-hp-fill').style.width = `${Math.max(0, (mob.hp / mob.hpMax) * 100)}%`;
  });
}

function buildEnemyCard(mob) {
  const card = document.createElement('article');
  card.className = 'enemy-card';
  card.dataset.mobId = mob.id;
  card.innerHTML = `
    <h3 class="e-name"></h3>
    <span class="e-level"></span>
    <div class="bar"><div class="bar-fill e-hp-fill"></div></div>
    <span class="e-hp-text"></span>
  `;
  card.querySelector('.e-name').textContent = mob.name;
  card.querySelector('.e-level').textContent = `Lv ${formatNumber(mob.level)}`;
  return card;
}
