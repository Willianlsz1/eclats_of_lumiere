// UI — casca Éclats (unificação). Mantém o contrato que src/main.js consome:
// setupUI / renderUI / showOfflineSummary.
// Chrome do mockup: nav (topo-esq) + moedas (topo-dir) + stage 1920×1080.
// Combate já é a cena real ligada ao motor (U-2, em src/ui/combat.js);
// Mapa e Player seguem placeholders até U-3/U-4. Moedas leem o state REAL.

import './tokens.css';
import './shell.css';
import './combat.css';
import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { buildCombatView, renderCombat } from './combat.js';

const $ = (sel, root = document) => root.querySelector(sel);

// moedas do topo — leem o state real
const COINS = [
  { id: 'lumens',      icon: 'icons.currency.lumens',      name: 'Lumens',      get: (s) => formatNumber(s.lumens) },
  { id: 'vestiges',    icon: 'icons.currency.vestiges',    name: 'Vestiges',    get: (s) => formatNumber(s.vestiges) },
  { id: 'convergence', icon: 'icons.currency.convergence', name: 'Convergence', get: (s) => formatNumber(s.convergences) },
];

// telas. icon = id de nav confirmado pelo Willian. locked = pós-MVP da main.
const VIEWS = [
  { id: 'combat',    label: 'Combate',   icon: 'icons.nav.2' },
  { id: 'map',       label: 'Mapa',      icon: 'icons.nav.5' },
  { id: 'player',    label: 'Seeker',    icon: 'icons.nav.1' },
  { id: 'gear',      label: 'Gear',      glyph: '🛡',         locked: true },
  { id: 'passives',  label: 'Passivas',  icon: 'icons.nav.3', locked: true },
  { id: 'memoires',  label: 'Mémoires',  icon: 'icons.nav.6', locked: true },
  { id: 'ascension', label: 'Ascension', icon: 'icons.nav.7', locked: true },
];

let current = 'combat';

export function setupUI(state) {
  buildCoins();
  buildNav();
  buildViews(state);
  show('combat');
  fit();
  window.addEventListener('resize', fit);
}

function buildCoins() {
  $('.coins').innerHTML = COINS.map((c) =>
    `<div class="coin ${c.id}">${picture(c.icon, { alt: c.name })}` +
    `<span class="meta"><span class="n">${c.name}</span><span class="v" id="coin-${c.id}">0</span></span></div>`
  ).join('');
}

function buildNav() {
  const nav = $('.nav'); nav.innerHTML = '';
  for (const v of VIEWS) {
    const btn = document.createElement('button');
    btn.className = 'navbtn' + (v.locked ? ' locked' : '') + (v.glyph && !v.icon ? ' provisional' : '');
    btn.dataset.view = v.id;
    btn.title = v.locked ? `${v.label} — pós-MVP` : v.label;
    btn.innerHTML = `<span class="ico">${v.glyph ? v.glyph : picture(v.icon, { alt: v.label })}</span>`;
    if (!v.locked) btn.addEventListener('click', () => show(v.id));
    nav.appendChild(btn);
  }
}

function buildViews(state) {
  const main = $('.stage-main'); main.innerHTML = '';
  for (const v of VIEWS) {
    const view = document.createElement('div');
    view.id = 'view-' + v.id;

    // Combate: cena real ligada ao motor (U-2). Map/Player ainda placeholders (U-3/U-4).
    if (v.id === 'combat') {
      view.className = 'view';
      main.appendChild(view);
      buildCombatView(view, state);
      continue;
    }

    view.className = 'view placeholder';
    const glyph = v.glyph
      ? `<div class="glyph" style="font-size:96px;display:grid;place-items:center;opacity:.5">${v.glyph}</div>`
      : `<div class="glyph">${picture(v.icon, { alt: v.label })}</div>`;
    const sub = v.locked ? 'pós-MVP' : 'em construção · U-3…U-4';
    view.innerHTML = `<div>${glyph}<h2>${v.label}</h2><div class="cp">${sub}</div></div>`;
    main.appendChild(view);
  }
}

function show(id) {
  current = id;
  document.querySelectorAll('.view').forEach((n) => n.classList.toggle('active', n.id === 'view-' + id));
  document.querySelectorAll('.navbtn').forEach((n) => n.classList.toggle('active', n.dataset.view === id));
  $('#stage-backdrop').style.backgroundImage = bg('backgrounds.map1');
}

function fit() {
  const W = window.innerWidth, H = window.innerHeight;
  const s = Math.min(W / 1920, H / 1080);
  // Centraliza explicitamente (origem top-left): evita o bug de centralização
  // via grid em telas menores que o palco (celular renderizava o palco fora da área).
  const x = (W - 1920 * s) / 2;
  const y = (H - 1080 * s) / 2;
  $('#stage').style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  // Corte baixo só para janelas realmente minúsculas — celulares (mesmo em
  // retrato, ~0.21) passam. Mobile é só para visualizar/testar; o alvo é desktop.
  $('#toosmall').style.display = s < 0.12 ? 'grid' : 'none';
}

export function renderUI(state) {
  // moedas (state real)
  for (const c of COINS) {
    const el = document.getElementById('coin-' + c.id);
    if (el) el.textContent = c.get(state);
  }
  // tela de combate ligada ao motor (só renderiza a ativa, por custo)
  if (current === 'combat') renderCombat(state);
}

// Resumo de progresso offline (§15) — toast simples sobre a casca
export function showOfflineSummary(summary) {
  const hours = summary.seconds / 3600;
  const time = hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(summary.seconds / 60)}min`;
  const retreat = summary.retreated ? ' Recuou até o ponto sustentável.' : '';
  let el = document.getElementById('offline-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'offline-toast';
    document.getElementById('screen').appendChild(el);
  }
  el.innerHTML =
    `<b>🌙 Enquanto você esteve fora (${time})</b><br>` +
    `${formatNumber(summary.kills)} kills · +${formatNumber(summary.lumens)} Lumens · ` +
    `+${formatNumber(summary.xp)} XP · +${formatNumber(summary.vestiges)} Vestiges.${retreat}` +
    `<button id="offline-close">OK</button>`;
  el.style.display = 'block';
  document.getElementById('offline-close').addEventListener('click', () => { el.style.display = 'none'; }, { once: true });
}
