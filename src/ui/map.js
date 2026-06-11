// Tela de Mapa (U-3) — Mapa-Múndi + Continente, lendo o state real.
// Dois níveis: mundo (5 mapas, só Map 1 jogável no MVP) → continente (5
// sub-áreas do Map 1). "Entrar" numa sub-área liga o motor (enterSubarea) e
// devolve à tela de Combate.
//
// Contrato: buildMapView(root, state, goToCombat) monta o DOM uma vez;
//           renderMap(state) atualiza estados a cada exibição.

import { picture, bg } from '../data/assets.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { enterSubarea } from '../game/combat.js';

const $ = (id) => document.getElementById(id);

// Nomes canônicos dos mapas (Art Direction §2). Só Map 1 é MVP; 2-5 ficam
// bloqueados (visual). Pinos posicionados no atlas — coords provisórias.
// TODO(canon): posição exata dos pinos no worldmap.
const WORLD = [
  { id: 1, name: 'The Dreaming Wood',   bgId: 'worldmap.continent1', pin: { x: 30, y: 64 } },
  { id: 2, name: 'Cavernes Luminis',    bgId: 'worldmap.continent2', pin: { x: 47, y: 44 }, locked: true },
  { id: 3, name: 'The Ashen Ruins',     bgId: 'worldmap.continent3', pin: { x: 62, y: 60 }, locked: true },
  { id: 4, name: 'The Fractured Peaks', bgId: 'worldmap.continent4', pin: { x: 75, y: 38 }, locked: true },
  { id: 5, name: 'Nil Aeternum',        bgId: 'worldmap.continent5', pin: { x: 86, y: 66 }, locked: true },
];

// Posições das 5 sub-áreas sobre o crop do continente — provisórias.
// TODO(canon): trilha/coords reais das sub-áreas no Map 1.
const SUB_NODES = [
  { x: 22, y: 74 }, { x: 38, y: 56 }, { x: 53, y: 66 }, { x: 70, y: 46 }, { x: 84, y: 60 },
];

let goToCombatFn = null;

export function buildMapView(root, state, goToCombat) {
  goToCombatFn = goToCombat;
  root.classList.remove('placeholder');
  root.classList.add('map');
  root.innerHTML = `
    <!-- Nível 1: mundo -->
    <section class="map-world" id="map-world">
      <div class="map-bg" id="world-bg"></div>
      <div class="map-pins" id="world-pins"></div>
      <div class="map-title"><b>Le Monde Fracturé</b><span>Escolha um reino</span></div>
    </section>

    <!-- Nível 2: continente -->
    <section class="map-continent" id="map-continent" hidden>
      <div class="map-bg" id="cont-bg"></div>
      <button type="button" class="map-back" id="map-back">◀ Mundo</button>
      <div class="map-nodes" id="cont-nodes"></div>
      <aside class="map-panel" id="cont-panel"></aside>
    </section>
  `;

  // Fundo + pinos do mundo
  $('world-bg').style.backgroundImage = bg('worldmap.atlas');
  const pins = $('world-pins');
  for (const m of WORLD) {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'map-pin' + (m.locked ? ' locked' : '');
    pin.style.left = `${m.pin.x}%`;
    pin.style.top = `${m.pin.y}%`;
    pin.innerHTML = `<span class="dot"></span><span class="lbl">${m.name}${m.locked ? ' 🔒' : ''}</span>`;
    if (!m.locked) pin.addEventListener('click', () => openContinent(state, m));
    pins.appendChild(pin);
  }

  $('map-back').addEventListener('click', () => {
    $('map-continent').hidden = true;
    $('map-world').hidden = false;
  });
}

// Abre a visão de continente de um mapa (MVP: só Map 1)
function openContinent(state, m) {
  $('map-world').hidden = true;
  $('map-continent').hidden = false;
  $('cont-bg').style.backgroundImage = bg(m.bgId);

  const map = getCurrentMap();
  const nodes = $('cont-nodes');
  nodes.innerHTML = '';
  for (let i = 1; i <= map.subareaCount; i++) {
    const pos = SUB_NODES[i - 1];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'sub-node';
    node.dataset.sub = i;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.innerHTML = `<span class="ring"></span><span class="num">${i}</span>`;
    node.addEventListener('click', () => selectSub(state, i));
    nodes.appendChild(node);
  }
  panelSig = '';                         // força reconstrução do painel
  selectSub(state, state.subarea);       // foca a sub-área atual
  renderMap(state);
}

// Seleciona uma sub-área e mostra seus dados no painel.
let selectedSub = 1;
function selectSub(state, n) {
  selectedSub = n;
  document.querySelectorAll('.sub-node').forEach((el) =>
    el.classList.toggle('selected', Number(el.dataset.sub) === n));
  renderPanel(state);
}

// Reconstrói o painel só quando muda algo relevante (evita rebuild por tick).
let panelSig = '';
function renderPanel(state) {
  const panel = $('cont-panel');
  if (!panel) return;
  const map = getCurrentMap();
  const n = selectedSub;
  const accessible = n <= state.unlockedSubarea;
  const cleared = !!state.bossDefeated[n - 1];
  const sig = `${n}|${accessible}|${cleared}`;
  if (sig === panelSig) return;
  panelSig = sig;

  const range = subareaLevelRange(map, n);
  const packSize = map.packSizes[n - 1];
  panel.innerHTML = `
    <div class="cover" id="cont-cover"></div>
    <h2>${map.name}</h2>
    <div class="sub-name">Sub-área ${n} / ${map.subareaCount}${cleared ? ' · ✓ Guardião derrotado' : ''}</div>
    <dl class="facts">
      <div><dt>Nível</dt><dd>${Math.round(range.lo)}–${Math.round(range.hi)}</dd></div>
      <div><dt>Inimigos</dt><dd>${packSize} por onda</dd></div>
      <div><dt>Estado</dt><dd>${accessible ? (cleared ? 'Liberada' : 'Em aberto') : 'Bloqueada'}</dd></div>
    </dl>
    <button type="button" class="enter-btn" id="enter-btn" ${accessible ? '' : 'disabled'}>
      ${accessible ? 'Entrar na sub-área' : '🔒 Derrote o Guardião anterior'}
    </button>
    <p class="hint">Sub-áreas avançam ao derrotar o Guardião de cada uma.</p>
  `;
  $('cont-cover').style.backgroundImage = bg('backgrounds.map1');
  if (accessible) {
    $('enter-btn').addEventListener('click', () => {
      enterSubarea(state, n);
      if (goToCombatFn) goToCombatFn();
    });
  }
}

export function renderMap(state) {
  const map = getCurrentMap();
  // Estados dos nós da sub-área (se o continente estiver montado)
  document.querySelectorAll('.sub-node').forEach((el) => {
    const i = Number(el.dataset.sub);
    el.classList.toggle('current', i === state.subarea);
    el.classList.toggle('cleared', !!state.bossDefeated[i - 1]);
    el.classList.toggle('locked', i > state.unlockedSubarea);
  });
  // Mantém o painel coerente com o gate (ex.: boss recém-derrubado libera nó)
  if (!$('map-continent')?.hidden) renderPanel(state);
}
