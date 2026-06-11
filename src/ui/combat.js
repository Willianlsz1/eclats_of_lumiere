// Tela de Combate (U-2) — liga o motor real (combatTick) à cena do mockup.
// Card do Seeker à esquerda; pack de inimigos espalhado à direita; alvo atual
// com borda dourada; números de dano flutuantes; HUD no rodapé + setas de
// navegação entre sub-áreas (respeitando o gate do boss).
//
// Contrato: buildCombatView(root, state) monta o DOM uma vez;
//           renderCombat(state) atualiza a cada tick.
// Lê o state REAL: state.enemies, state.fx, state.player, stats derivados.

import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import {
  heroLevel, dps, playerHpMax, currentAPS, critChance, critDamageMult,
} from '../game/stats.js';
import { changeSubarea } from '../game/combat.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { currentRank } from '../game/ascension.js';

const $ = (id) => document.getElementById(id);

// A arte de cada inimigo/boss vem do mapa (mob.art, definido em enemies.js a
// partir de MAPS em constants). Fallback caso falte.
const ENEMY_ART_FALLBACK = 'enemies.map1.deer_spirit';

// Pontos de spawn fixos dentro da arena (%) — pack ≤ 8 (packSizes do GDD),
// então renderizamos todos, sem badge "+N".
const SPAWN_POINTS = [
  { x: 44, y: 32 }, { x: 63, y: 24 }, { x: 81, y: 36 },
  { x: 37, y: 58 }, { x: 58, y: 55 }, { x: 78, y: 62 },
  { x: 49, y: 80 }, { x: 71, y: 81 },
];
const BOSS_POINT = { x: 60, y: 50 };

// Janela de suavização das taxas do HUD (EMA simples)
let rates = null;

export function buildCombatView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('combat');
  root.innerHTML = `
    <div class="cb-backdrop" id="cb-backdrop"></div>

    <aside class="cb-seeker" id="cb-seeker">
      <div class="cb-portrait">
        ${picture('seeker.t1', { alt: 'The Seeker' })}
        ${picture('frames.tier1', { className: 'cb-frame', alt: '' })}
      </div>
      <h2 class="cb-name">The Seeker</h2>
      <div class="cb-tier" id="cb-tier">Ordre des Veilleurs · Tier I</div>
      <div class="cb-hpbar"><i class="cb-hp-fill" id="cb-hp-fill"></i>
        <span class="cb-hp-text" id="cb-hp-text">—</span></div>
      <div class="cb-status" id="cb-status" hidden></div>
      <dl class="cb-mini">
        <div><dt>Lv</dt><dd id="cb-level">1</dd></div>
        <div><dt>DPS</dt><dd id="cb-dps">0</dd></div>
        <div><dt>APS</dt><dd id="cb-aps">0</dd></div>
        <div><dt>Crit</dt><dd id="cb-crit">0%</dd></div>
      </dl>
    </aside>

    <div class="cb-arena" id="cb-arena"><!-- enemy cards (JS) --></div>

    <footer class="cb-hud">
      <div class="cb-nav">
        <button type="button" class="cb-arrow" id="cb-prev" title="Sub-área anterior">◀</button>
        <div class="cb-zone">
          <b id="cb-zone-name">The Dreaming Wood</b>
          <span id="cb-zone-sub">Sub-área 1/5</span>
        </div>
        <button type="button" class="cb-arrow" id="cb-next" title="Próxima sub-área">▶</button>
      </div>
      <div class="cb-progress">
        <span class="cb-progress-label" id="cb-progress-label">Rumo ao Guardião</span>
        <div class="cb-progress-bar"><i id="cb-progress-fill"></i></div>
      </div>
      <dl class="cb-metrics">
        <div><dt>Kills/min</dt><dd id="cb-kpm">0</dd></div>
        <div><dt>Lumens/min</dt><dd id="cb-lpm">0</dd></div>
        <div><dt>Vestiges/min</dt><dd id="cb-vpm">0</dd></div>
        <div><dt>Kills</dt><dd id="cb-kills">0</dd></div>
      </dl>
    </footer>
  `;

  // Setas de navegação entre sub-áreas (gate do boss respeitado em changeSubarea)
  $('cb-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('cb-next').addEventListener('click', () => changeSubarea(state, +1));

  // Fundo nítido do mapa atual (atualizado também no render, em troca de mapa)
  $('cb-backdrop').style.backgroundImage = bg(getCurrentMap(state).bg);
}

export function renderCombat(state) {
  const map = getCurrentMap(state);
  const hpMax = playerHpMax(state);

  // ── Card do Seeker ──
  const rank = currentRank(state);
  $('cb-tier').textContent = `${rank.name} · Tier ${rank.tier}`;
  $('cb-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('cb-hp-text').textContent =
    `${formatNumber(Math.max(0, state.player.hp))} / ${formatNumber(hpMax)}`;
  $('cb-level').textContent = formatNumber(heroLevel(state.xpTotal));
  $('cb-dps').textContent = formatNumber(dps(state));
  $('cb-aps').textContent = currentAPS(state).toFixed(2);
  $('cb-crit').textContent =
    `${(critChance(state) * 100).toFixed(1)}% ×${critDamageMult(state).toFixed(2)}`;

  const status = $('cb-status');
  const seeker = $('cb-seeker');
  if (state.player.dead) {
    status.textContent = `Caído — retorna em ${Math.ceil(state.player.respawnTimer)}s`;
    status.hidden = false;
    seeker.classList.add('dead');
  } else {
    status.hidden = true;
    seeker.classList.remove('dead');
  }

  // ── Navegação / zona (segue o mapa atual) ──
  $('cb-zone-name').textContent = map.name;
  const bd = $('cb-backdrop');
  if (bd) bd.style.backgroundImage = bg(map.bg);
  const range = subareaLevelRange(map, state.subarea);
  $('cb-zone-sub').textContent =
    `Sub-área ${state.subarea}/${map.subareaCount} · Lv ${Math.round(range.lo)}–${Math.round(range.hi)}`;
  const prev = $('cb-prev');
  const next = $('cb-next');
  prev.disabled = state.subarea <= 1;
  next.disabled = state.subarea >= state.unlockedSubarea;
  next.title = next.disabled && state.subarea < map.subareaCount
    ? 'Derrote o Guardião desta sub-área para avançar'
    : 'Próxima sub-área';

  // ── Onda atual + progresso até o boss (modelo de ondas: limpa a onda → próxima;
  //    o Guardião entra na onda ao bater killsInSubarea/bossKillThreshold). ──
  const bossOut = state.enemies.some((m) => m.isBoss && m.hp > 0);
  const alive = state.enemies.reduce((n, m) => n + (m.hp > 0 ? 1 : 0), 0);
  const pct = Math.min(100, (state.killsInSubarea / map.bossKillThreshold) * 100);
  $('cb-progress-fill').style.width = `${pct}%`;
  $('cb-progress-label').textContent = bossOut
    ? `⚔ O Guardião chegou · ${alive} na onda`
    : `Onda ${state.wave} · ${alive} vivo${alive === 1 ? '' : 's'} · Guardião ${Math.floor(pct)}%`;

  // ── HUD: taxas suavizadas ──
  renderRates(state);

  // ── Inimigos + dano flutuante ──
  renderEnemies(state);
  renderDamageFloats(state);
}

// ── Inimigos: reconstrói os cards quando o pack muda; senão só atualiza ──
function renderEnemies(state) {
  const arena = $('cb-arena');

  if (arena.children.length !== state.enemies.length) {
    arena.innerHTML = '';
    state.enemies.forEach((mob, i) => arena.appendChild(buildEnemyCard(mob, i)));
  }

  // Alvo do motor: o vivo de menor HP recebe a borda dourada
  let targetId = null;
  let lowest = Infinity;
  for (const m of state.enemies) {
    if (m.hp > 0 && m.hp < lowest) { lowest = m.hp; targetId = m.id; }
  }

  state.enemies.forEach((mob, i) => {
    let card = arena.children[i];
    if (!card || card.dataset.mobId !== String(mob.id)) {
      const fresh = buildEnemyCard(mob, i);
      if (card) arena.replaceChild(fresh, card); else arena.appendChild(fresh);
      card = fresh;
    }
    // Mob morto SOME (sem respawn no lugar); fica fora da cena até a onda virar.
    if (mob.hp <= 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';
    const pct = Math.max(0, (mob.hp / mob.hpMax) * 100);
    card.querySelector('.cb-e-fill').style.width = `${pct}%`;
    card.querySelector('.cb-e-hp').textContent =
      `${formatNumber(Math.max(0, mob.hp))} / ${formatNumber(mob.hpMax)}`;
    card.classList.toggle('target', mob.id === targetId);
  });
}

function buildEnemyCard(mob, i) {
  const pos = mob.isBoss ? BOSS_POINT : SPAWN_POINTS[i % SPAWN_POINTS.length];
  const artId = mob.art || ENEMY_ART_FALLBACK; // arte vem do mapa (enemies.js)

  const card = document.createElement('article');
  card.className = mob.isBoss ? 'cb-enemy boss' : 'cb-enemy';
  card.dataset.mobId = mob.id;
  card.style.left = `${pos.x}%`;
  card.style.top = `${pos.y}%`;
  card.innerHTML = `
    <div class="cb-e-art">${picture(artId, { alt: mob.name })}</div>
    <div class="cb-e-name">${mob.isBoss ? '👑 ' : ''}${mob.name}</div>
    <div class="cb-e-meta">Lv ${formatNumber(mob.level)}${mob.isBoss ? ' · GUARDIÃO' : ''}</div>
    <div class="cb-e-bar"><i class="cb-e-fill"></i></div>
    <div class="cb-e-hp"></div>
  `;
  return card;
}

// Números de dano flutuantes — consome state.fx e a esvazia (a UI é a dona).
function renderDamageFloats(state) {
  if (state.fx.length === 0) return;
  for (const hit of state.fx) {
    const art = document.querySelector(`.cb-enemy[data-mob-id="${hit.mobId}"] .cb-e-art`);
    if (!art) continue; // mob já substituído — descarta
    const el = document.createElement('span');
    el.className = hit.isCrit ? 'cb-dmg crit' : 'cb-dmg';
    el.textContent = `${hit.isCrit ? 'CRIT ' : ''}−${formatNumber(hit.amount)}`;
    art.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
  state.fx.length = 0;
}

// Taxas do HUD: EMA das variações reais do state (verdade, não estimativa).
function renderRates(state) {
  const now = performance.now();
  if (!rates) {
    rates = { t: now, lumens: state.lumens, vest: state.vestiges, kills: state.killsTotal,
      lpm: 0, vpm: 0, kpm: 0 };
  } else {
    const dt = (now - rates.t) / 1000;
    if (dt >= 0.5) {
      const inst = 60 / dt;
      const a = 0.35;
      // max(0,…) absorve resets (Convergence zera Lumens/run)
      rates.lpm = rates.lpm * (1 - a) + Math.max(0, state.lumens - rates.lumens) * inst * a;
      rates.vpm = rates.vpm * (1 - a) + Math.max(0, state.vestiges - rates.vest) * inst * a;
      rates.kpm = rates.kpm * (1 - a) + Math.max(0, state.killsTotal - rates.kills) * inst * a;
      rates.t = now; rates.lumens = state.lumens; rates.vest = state.vestiges; rates.kills = state.killsTotal;
    }
  }
  $('cb-kpm').textContent = formatNumber(rates.kpm);
  $('cb-lpm').textContent = formatNumber(rates.lpm);
  $('cb-vpm').textContent = formatNumber(rates.vpm);
  $('cb-kills').textContent = formatNumber(state.killsTotal);
}
