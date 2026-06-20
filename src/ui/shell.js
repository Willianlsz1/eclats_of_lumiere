// Casca da UI do v0 — nav (1 botão), moedas (gold/Lumens), backdrop e fit() do palco.
import './tokens.css';
import './shell.css';
import './combat-view.css';
import { formatNumber } from '../core/format.js';
import { bg, picture } from '../data/assets.js';
import { AREAS } from '../data/constants.js';
import { buildCombatView, renderCombat } from './combat-view.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function setupUI(state) {
  const area = AREAS[state.area - 1];

  // Moedas: só Lumens (gold) no v0.
  $('.coins').innerHTML =
    `<div class="chud"><div class="chud-pill chud-lumens" title="Lumens">` +
    `${picture('icons.currency.lumens', { className: 'chud-ico', alt: 'Lumens' })}` +
    `<span class="chud-v" id="coin-gold">0</span></div></div>`;

  // Nav: só Combate (v0 é uma tela).
  $('.nav').innerHTML =
    `<button class="navbtn active" title="Combate">` +
    `<span class="ico">${picture('icons.nav.1', { alt: 'Combate' })}</span></button>`;

  // Backdrop borrado (telas de menu) — combate pinta o seu próprio fundo nítido.
  $('#stage-backdrop').style.backgroundImage = bg(area.bg);

  // Cena de combate.
  const view = document.createElement('div');
  view.id = 'view-combat';
  view.className = 'view combat active';
  $('.stage-main').appendChild(view);
  buildCombatView(view, state);

  fit();
  window.addEventListener('resize', fit);
}

export function renderUI(state) {
  const g = document.getElementById('coin-gold');
  if (g) g.textContent = formatNumber(state.gold);
  renderCombat(state);
}

// Escala o palco 1920×1080 para a janela (copiado do antigo ui.js).
function fit() {
  const W = window.innerWidth,
    H = window.innerHeight;
  const stageW = Math.max(1280, Math.min(2560, Math.round(1080 * (W / H))));
  const stage = $('#stage');
  stage.style.width = `${stageW}px`;
  document.documentElement.style.setProperty('--stage-w', `${stageW}px`);
  const s = Math.min(W / stageW, H / 1080);
  const x = (W - stageW * s) / 2;
  const y = (H - 1080 * s) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  $('#toosmall').style.display = s < 0.12 ? 'grid' : 'none';
}
