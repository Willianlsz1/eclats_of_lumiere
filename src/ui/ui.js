// UI provisória (sem arte — skin final é CP-G).
// Card do jogador à esquerda, grade de inimigos à direita, contadores no topo.

import { formatNumber } from '../core/format.js';
import { heroLevel, dps, playerHpMax } from '../game/stats.js';
import { changeSubarea } from '../game/combat.js';
import { getCurrentMap } from '../game/enemies.js';

const $ = (id) => document.getElementById(id);

export function setupUI(state) {
  $('btn-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('btn-next').addEventListener('click', () => changeSubarea(state, +1));
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

  const status = $('p-status');
  if (state.player.dead) {
    status.textContent = `Morto — respawn em ${Math.ceil(state.player.respawnTimer)}s (recuou uma subárea)`;
    status.hidden = false;
  } else {
    status.hidden = true;
  }

  renderEnemies(state);
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
