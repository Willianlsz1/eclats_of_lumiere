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
import './mobile.css';
import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { buildCombatView, renderCombat } from './combat.js';
import { buildMapView, renderMap } from './map.js';
import { buildPlayerView, renderPlayer, convData } from './player.js';
import { renderConvergence } from './convergence.js';
import { doConverge } from '../game/convergence.js';
import { buildGearView, renderGear } from './gear.js';
import { buildForgeView, renderForge } from './forge.js';
import { buildPassivesView, renderPassives } from './passives.js';
import { buildMemoiresView, renderMemoires } from './memoires.js';
import { buildAscensionView, renderAscension } from './ascension.js';
import { getCurrentMap } from '../game/enemies.js';

const $ = (sel, root = document) => root.querySelector(sel);

let gameState = null;       // ref do state (pra saber o mapa atual no chrome)
let backdropMap = null;     // último mapa pintado no backdrop (evita repintar por tick)

// Fundo desfocado do palco = mapa ATUAL do jogador (telas de menu)
function paintBackdrop() {
  if (!gameState) return;
  const map = getCurrentMap(gameState);
  if (backdropMap === map.id) return;
  backdropMap = map.id;
  $('#stage-backdrop').style.backgroundImage = bg(map.bg);
}

// moedas do topo — leem o state real
// 3ª moeda = Éclats (§10), fonte das Mémoires. Usa o ícone de convergence
// (branco-azul) como placeholder até haver ícone próprio. TODO(canon): ícone Éclats.
// ícones: PNGs dedicados das moedas (caminho Vite direto em public/)
const COINS = [
  { id: 'lumens',   src: 'eclats/offline/icons/lumens.png',   name: 'Lumens',   get: (s) => formatNumber(s.lumens) },
  // Vestiges: sink (Passivas/Ascension/Despertar) é Map 2+. Esconde no Map 1 — só
  // aparece quando o jogador alcança o Map 2. ⏳ TODO: tooltip da Vestige.
  { id: 'vestiges', src: 'eclats/offline/icons/vestiges.png', name: 'Vestiges', get: (s) => formatNumber(s.vestiges),
    visible: (s) => (s.maxMap || s.map || 1) >= 2 },
  // Éclats: fonte = Mémoires/Ascension (Map 2+). Esconde no Map 1 (igual Vestiges).
  { id: 'eclats',   src: 'eclats/offline/icons/eclats.png',   name: 'Éclats',   get: (s) => formatNumber(s.eclats),
    visible: (s) => (s.maxMap || s.map || 1) >= 2 },
];

// telas. icon = id de nav confirmado pelo Willian. locked = pós-MVP da main.
const VIEWS = [
  { id: 'combat',      label: 'Combate',     icon: 'icons.nav.2' },
  { id: 'map',         label: 'Mapa',        icon: 'icons.nav.5' },
  { id: 'player',      label: 'Seeker',      icon: 'icons.nav.1' },
  { id: 'convergence', label: 'Convergence', icon: 'icons.currency.convergence' },
  { id: 'gear',        label: 'Gear',        icon: 'icons.nav.4' },
  { id: 'forge',     label: 'The Forge', iconSrc: 'eclats/icons/nav/nav_forge.webp' },
  { id: 'passives',  label: 'Passivas',  icon: 'icons.nav.3' },
  { id: 'memoires',  label: 'Mémoires',  icon: 'icons.nav.6' },
  { id: 'ascension', label: 'Ascension', icon: 'icons.nav.7' },
];

let current = 'combat';

// Dados da tela de Convergence (reusa o builder do Seeker); ao convergir, refresca a casca.
function convergeData(state) {
  return { ...convData(state), onConverge: () => { doConverge(state); renderUI(state); } };
}

export function setupUI(state) {
  gameState = state;
  buildCoins();
  buildNav();
  buildViews(state);
  ensureOverlayHost();
  show('combat');
  fit();
  window.addEventListener('resize', fit);
}

// HUD de moedas (.chud): 3 pills agrupadas no vocabulário visual da navbar.
// Os spans #coin-<id> são atualizados pelo renderUI (fluxo de render existente).
function buildCoins() {
  $('.coins').innerHTML =
    `<div class="chud">` + COINS.map((c) =>
      `<div class="chud-pill chud-${c.id}" title="${c.name}">` +
      `<img class="chud-ico" src="${c.src}" alt="${c.name}">` +
      `<span class="chud-v" id="coin-${c.id}">0</span></div>`
    ).join('') + `</div>`;
}

function buildNav() {
  const nav = $('.nav'); nav.innerHTML = '';
  for (const v of VIEWS) {
    const btn = document.createElement('button');
    btn.className = 'navbtn' + (v.locked ? ' locked' : '') + (v.glyph && !v.icon ? ' provisional' : '');
    btn.dataset.view = v.id;
    btn.title = v.locked ? `${v.label} — pós-MVP` : v.label;
    const ico = v.iconSrc
      ? `<img src="${v.iconSrc}" alt="${v.label}">`
      : (v.glyph ? v.glyph : picture(v.icon, { alt: v.label }));
    btn.innerHTML = `<span class="ico">${ico}</span><span class="lbl">${v.label}</span>`;
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
    // Convergence: tela própria (atalho do rito que também vive no Seeker).
    if (v.id === 'convergence') {
      view.className = 'view';
      main.appendChild(view);
      renderConvergence(view, convergeData(state));
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
// Também cria #modal-host (acima), para modais de ENTRADA não-cerimoniais
// (ex.: boas-vindas offline) — separado por design.
function ensureOverlayHost() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  if (!document.getElementById('overlay-host')) {
    const host = document.createElement('div');
    host.id = 'overlay-host';
    stage.appendChild(host);
  }
  if (!document.getElementById('modal-host')) {
    const modal = document.createElement('div');
    modal.id = 'modal-host';
    stage.appendChild(modal);
  }
}

function show(id) {
  current = id;
  document.querySelectorAll('.view').forEach((n) => n.classList.toggle('active', n.id === 'view-' + id));
  document.querySelectorAll('.navbtn').forEach((n) => n.classList.toggle('active', n.dataset.view === id));
  paintBackdrop();
  fit(); // re-avalia o modo (só o Gear reflui no mobile; o resto fica escalado)
}

function fit() {
  const W = window.innerWidth, H = window.innerHeight;
  const stage = $('#stage');
  // MODO MOBILE: janela estreita (celular, ex. Redmi Note 13 Pro). Decisão Willian:
  // só o GEAR precisava melhorar — o resto já é jogável escalado. Então SÓ a tela de
  // Gear reflui em lista fluida (body.m-flow); as outras telas seguem escaladas.
  const isMobile = W <= 920;
  const flow = isMobile && current === 'gear';
  document.body.classList.toggle('mobile', isMobile);
  document.body.classList.toggle('m-flow', flow);
  if (flow) {
    stage.style.transform = 'none';
    stage.style.width = '';
    document.documentElement.style.removeProperty('--stage-w');
    $('#toosmall').style.display = 'none';
    return;
  }
  // Palco com altura de referência fixa (1080) e LARGURA DINÂMICA seguindo a
  // proporção da janela: o jogo preenche a tela toda (sem letterbox) em
  // qualquer aspect ratio, sem distorcer nem cortar. Clamp de segurança para
  // proporções extremas (ultrawide / retrato).
  const stageW = Math.max(1280, Math.min(2560, Math.round(1080 * (W / H))));
  stage.style.width = `${stageW}px`;
  document.documentElement.style.setProperty('--stage-w', `${stageW}px`);
  const s = Math.min(W / stageW, H / 1080);
  // Centraliza explicitamente (origem top-left): evita o bug de centralização
  // via grid em telas menores que o palco (celular renderizava o palco fora da área).
  const x = (W - stageW * s) / 2;
  const y = (H - 1080 * s) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  $('#toosmall').style.display = s < 0.12 ? 'grid' : 'none';
}

export function renderUI(state) {
  gameState = state;
  paintBackdrop(); // mantém o backdrop no mapa atual (atualiza ao viajar/ascender)
  // moedas (state real) — algumas só aparecem quando desbloqueadas (ex.: Vestiges)
  for (const c of COINS) {
    const el = document.getElementById('coin-' + c.id);
    if (el) el.textContent = c.get(state);
    const pill = document.querySelector('.chud-' + c.id);
    if (pill) pill.style.display = (c.visible && !c.visible(state)) ? 'none' : '';
  }
  // só renderiza a tela ativa (por custo)
  if (current === 'combat') renderCombat(state);
  else if (current === 'map') renderMap(state);
  else if (current === 'player') renderPlayer(state);
  else if (current === 'convergence') renderConvergence(document.getElementById('view-convergence'), convergeData(state));
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
