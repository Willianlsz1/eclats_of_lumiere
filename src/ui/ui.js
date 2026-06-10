// UI — skin branco/azul (CP-G), segue docs/eclats_ui_mockup_v2_branco_azul.html.
// Card do Seeker à esquerda, grade de inimigos à direita, contadores no topo,
// medidor de Convergence fixo no rodapé.

import { formatNumber } from '../core/format.js';
import {
  heroLevel, dps, playerHpMax, currentAPS,
  critChance, critDamageMult, convFactor,
  strTotal, vitTotal, frtTotal, wisTotal,
  statCostNext, buyStat, buyStatMax,
} from '../game/stats.js';
import { changeSubarea } from '../game/combat.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { xpWall, canConverge, runPoints, doConverge } from '../game/convergence.js';

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

// Glyph placeholder por criatura (arte real entra via assets/ quando aprovada)
const GLYPHS = {
  'Candlewisp Shade': 'wisp',
  'Mothlight Herald': 'frag',
  'Dreamhorn Warden': 'shroom',
};

export function setupUI(state) {
  $('btn-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('btn-next').addEventListener('click', () => changeSubarea(state, +1));
  $('btn-converge').addEventListener('click', () => doConverge(state));

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

// Banner de retorno: resumo do progresso offline (§15)
export function showOfflineSummary(summary) {
  const hours = summary.seconds / 3600;
  const time = hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(summary.seconds / 60)}min`;
  const retreat = summary.retreated ? ' Recuou até o ponto sustentável.' : '';
  $('offline-text').textContent =
    `Enquanto você esteve fora (${time}): ${formatNumber(summary.kills)} kills, ` +
    `+${formatNumber(summary.lumens)} Lumens, +${formatNumber(summary.xp)} XP, ` +
    `+${formatNumber(summary.vestiges)} Vestiges.${retreat}`;
  $('offline-banner').hidden = false;
  $('offline-close').addEventListener('click', () => { $('offline-banner').hidden = true; }, { once: true });
}

export function renderUI(state) {
  const map = getCurrentMap();
  const hpMax = playerHpMax(state);

  // Topo
  $('top-lumens').textContent = formatNumber(state.lumens);
  $('top-vestiges').textContent = formatNumber(state.vestiges);
  const range = subareaLevelRange(map, state.subarea);
  const mapDone = state.bossDefeated.every(Boolean) ? ' · ✓' : '';
  $('top-zone-sub').textContent =
    `Sub-área ${state.subarea}/${map.subareaCount} · Lv ${Math.round(range.lo)}–${Math.round(range.hi)}${mapDone}`;

  // Gate: avançar só até a subárea desbloqueada (boss abre a próxima)
  const next = $('btn-next');
  next.disabled = state.subarea >= state.unlockedSubarea;
  next.title = next.disabled && state.subarea < map.subareaCount
    ? 'Derrote o boss desta sub-área para avançar'
    : 'Avançar sub-área';
  $('btn-prev').disabled = state.subarea <= 1;

  // Card do Seeker
  $('p-level').textContent = formatNumber(heroLevel(state.xpTotal));
  $('p-hp-text').textContent = `${formatNumber(Math.max(0, state.player.hp))} / ${formatNumber(hpMax)}`;
  $('p-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('p-dps').textContent = formatNumber(dps(state));
  $('p-aps').textContent = currentAPS(state).toFixed(2);
  $('p-crit').textContent = `${(critChance(state) * 100).toFixed(1)}% ×${critDamageMult(state).toFixed(2)}`;
  $('c-count').textContent = formatNumber(state.convergences);
  $('c-points').textContent = formatNumber(state.convPoints);
  $('c-factor').textContent = `×${convFactor(state).toFixed(2)}`;

  const status = $('p-status');
  if (state.player.dead) {
    status.textContent = `Morto — respawn em ${Math.ceil(state.player.respawnTimer)}s (recuou uma sub-área)`;
    status.hidden = false;
  } else {
    status.hidden = true;
  }

  renderStats(state);
  renderConvergence(state);
  renderEnemies(state);
  renderDamageFloats(state);
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

function renderConvergence(state) {
  const wall = xpWall(state.convergences);
  const pct = Math.min(100, (state.xpRun / wall) * 100);
  const ready = canConverge(state);

  // Barra "Parede da run" do card (violeta, como no mockup)
  $('p-xp-fill').style.width = `${pct}%`;
  $('p-xp-text').textContent = `${formatNumber(state.xpRun)} / ${formatNumber(wall)} XP`;

  // Medidor fixo do rodapé
  $('g-cap').innerHTML = ready
    ? `A luz se reuniu — <b>Convergir: +${formatNumber(runPoints(state))} pontos</b>`
    : `A luz se reúne — <b>Convergence em ${pct.toFixed(0)}%</b>`;
  $('g-fill').style.width = `${pct}%`;
  $('g-pct').textContent = `${formatNumber(state.xpRun)} / ${formatNumber(wall)} XP`;
  const seed = $('btn-converge');
  seed.disabled = !ready;
  seed.classList.toggle('ready', ready);
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
  card.className = mob.isBoss ? 'enemy boss' : 'enemy';
  card.dataset.mobId = mob.id;
  const glyph = mob.isBoss ? 'gold' : (GLYPHS[mob.name] ?? 'frag');
  card.innerHTML = `
    <div class="art"><span class="glyph ${glyph}"></span></div>
    <h3 class="name"></h3>
    <span class="lvl"></span>
    <div class="row"><span>ATK <b class="e-atk"></b></span><span>HP <b class="e-hp-text"></b></span></div>
    <div class="ebar"><i class="e-hp-fill"></i></div>
  `;
  card.querySelector('.name').textContent = mob.isBoss ? `👑 ${mob.name}` : mob.name;
  card.querySelector('.lvl').textContent = `The Fragmented · Lv ${formatNumber(mob.level)}${mob.isBoss ? ' · BOSS' : ''}`;
  card.querySelector('.e-atk').textContent = formatNumber(mob.dmg);
  return card;
}

// Números de dano flutuantes em branco-ciano (interface fria — mockup).
// Consome a fila state.fx preenchida pelo combate.
function renderDamageFloats(state) {
  if (state.fx.length === 0) return;
  for (const hit of state.fx) {
    const card = document.querySelector(`[data-mob-id="${hit.mobId}"] .art`);
    if (!card) continue; // mob já substituído — descarta silenciosamente
    const el = document.createElement('span');
    el.className = hit.isCrit ? 'dmg crit' : 'dmg';
    el.textContent = `${hit.isCrit ? 'CRIT ' : ''}−${formatNumber(hit.amount)}`;
    card.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }
  state.fx.length = 0;
}
