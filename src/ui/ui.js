// UI — casca Éclats (unificação). Mantém o contrato que src/main.js consome:
// setupUI / renderUI / showOfflineSummary.
// Chrome do mockup: nav (topo-esq) + moedas (topo-dir) + stage 1920×1080.
// Todas as 7 telas (Combate, Mapa, Player, Gear, Passivas, Mémoires, Ascension)
// são reais e ligadas ao motor. Nenhuma nav fica mais bloqueada.

import './tokens.css';
import './shell.css';
import './combat.css';
import './map.css';
import './player.css';
import './gear.css';
import './forge.css';
import './passives.css';
import './memoires.css';
import './ascension.css';
import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { buildCombatView, renderCombat } from './combat.js';
import { buildMapView, renderMap } from './map.js';
import { buildPlayerView, renderPlayer } from './player.js';
import { buildGearView, renderGear } from './gear.js';
import { buildForgeView, renderForge } from './forge.js';
import { buildPassivesView, renderPassives } from './passives.js';
import { buildMemoiresView, renderMemoires } from './memoires.js';
import { buildAscensionView, renderAscension } from './ascension.js';

const $ = (sel, root = document) => root.querySelector(sel);

// moedas do topo — leem o state real
// 3ª moeda = Éclats (§10), fonte das Mémoires. Usa o ícone de convergence
// (branco-azul) como placeholder até haver ícone próprio. TODO(canon): ícone Éclats.
const COINS = [
  { id: 'lumens',   icon: 'icons.currency.lumens',      name: 'Lumens',   get: (s) => formatNumber(s.lumens) },
  { id: 'vestiges', icon: 'icons.currency.vestiges',    name: 'Vestiges', get: (s) => formatNumber(s.vestiges) },
  { id: 'eclats',   icon: 'icons.currency.convergence', name: 'Éclats',   get: (s) => formatNumber(s.eclats) },
];

// telas. icon = id de nav confirmado pelo Willian. locked = pós-MVP da main.
const VIEWS = [
  { id: 'combat',    label: 'Combate',   icon: 'icons.nav.2' },
  { id: 'map',       label: 'Mapa',      icon: 'icons.nav.5' },
  { id: 'player',    label: 'Seeker',    icon: 'icons.nav.1' },
  { id: 'gear',      label: 'Gear',      icon: 'icons.nav.4' },
  // The Forge: sem nav_8 dedicado ainda → glyph provisório (ferreiro Maël).
  // TODO(assets): ícone de nav próprio para a Forge.
  { id: 'forge',     label: 'The Forge', glyph: '⚒' },
  { id: 'passives',  label: 'Passivas',  icon: 'icons.nav.3' },
  { id: 'memoires',  label: 'Mémoires',  icon: 'icons.nav.6' },
  { id: 'ascension', label: 'Ascension', icon: 'icons.nav.7' },
];

let current = 'combat';

export function setupUI(state) {
  buildCoins();
  buildNav();
  buildViews(state);
  ensureOverlayHost();
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

    // Combate: cena real ligada ao motor (U-2).
    if (v.id === 'combat') {
      view.className = 'view';
      main.appendChild(view);
      buildCombatView(view, state);
      continue;
    }
    // Mapa: mundo + continente lendo o state (U-3). Entrar → volta ao Combate.
    if (v.id === 'map') {
      view.className = 'view';
      main.appendChild(view);
      buildMapView(view, state, () => show('combat'));
      continue;
    }
    // Player: retrato + Gold Stats + Convergence lendo o state (U-4).
    if (v.id === 'player') {
      view.className = 'view';
      main.appendChild(view);
      buildPlayerView(view, state);
      continue;
    }
    // Gear: 6 peças upáveis com Lumens (pós-MVP, valores provisórios).
    if (v.id === 'gear') {
      view.className = 'view';
      main.appendChild(view);
      buildGearView(view, state);
      continue;
    }
    // The Forge: estação de craft do ferreiro Maël (só a tela; lógica TODO).
    if (v.id === 'forge') {
      view.className = 'view';
      main.appendChild(view);
      buildForgeView(view, state);
      continue;
    }
    // Passivas: 3 árvores upáveis com Vestiges (pós-MVP, efeitos provisórios).
    if (v.id === 'passives') {
      view.className = 'view';
      main.appendChild(view);
      buildPassivesView(view, state);
      continue;
    }
    // Mémoires: 15 relíquias upáveis com Éclats; Clarté é o motor (pós-MVP).
    if (v.id === 'memoires') {
      view.className = 'view';
      main.appendChild(view);
      buildMemoiresView(view, state);
      continue;
    }
    // Ascension: marcos da Ordre — boss + Vestiges → asc_mult + Éclats (pós-MVP).
    if (v.id === 'ascension') {
      view.className = 'view';
      main.appendChild(view);
      buildAscensionView(view, state);
      continue;
    }

    // (todas as telas têm implementação real; nada cai mais no placeholder)
    view.className = 'view placeholder';
    const glyph = v.glyph
      ? `<div class="glyph" style="font-size:96px;display:grid;place-items:center;opacity:.5">${v.glyph}</div>`
      : `<div class="glyph">${picture(v.icon, { alt: v.label })}</div>`;
    view.innerHTML = `<div>${glyph}<h2>${v.label}</h2><div class="cp">pós-MVP</div></div>`;
    main.appendChild(view);
  }
}

// Host único para overlays cerimoniais (Awakening, Convergence). Fica dentro
// de #stage para escalar junto com o fit() do palco 1920×1080. Os módulos de
// overlay (awakening.js / convergence.js) montam sua raiz aqui.
function ensureOverlayHost() {
  const stage = document.getElementById('stage');
  if (stage && !document.getElementById('overlay-host')) {
    const host = document.createElement('div');
    host.id = 'overlay-host';
    stage.appendChild(host);
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
  // só renderiza a tela ativa (por custo)
  if (current === 'combat') renderCombat(state);
  else if (current === 'map') renderMap(state);
  else if (current === 'player') renderPlayer(state);
  else if (current === 'gear') renderGear(state);
  else if (current === 'forge') renderForge(state);
  else if (current === 'passives') renderPassives(state);
  else if (current === 'memoires') renderMemoires(state);
  else if (current === 'ascension') renderAscension(state);
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
