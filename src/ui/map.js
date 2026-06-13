// Tela de Mapa (U-3) — Mapa-Múndi + Continente, lendo o state real.
// Dois níveis: mundo (5 mapas, só Map 1 jogável no MVP) → continente (5
// sub-áreas do Map 1). "Entrar" numa sub-área liga o motor (enterSubarea) e
// devolve à tela de Combate.
//
// Contrato: buildMapView(root, state, goToCombat) monta o DOM uma vez;
//           renderMap(state) atualiza estados a cada exibição.

import { picture, bg } from '../data/assets.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { enterSubarea, travelToMap } from '../game/combat.js';

const $ = (id) => document.getElementById(id);

// Nomes canônicos dos mapas (Art Direction §2). O desbloqueio é por progressão:
// um mapa abre quando você ascende até ele (mapId ≤ state.map). Pinos no atlas —
// coords provisórias. TODO(canon): posição exata dos pinos no worldmap.
// Pinos posicionados sobre os reinos da arte nova (worldmap.png — árvore
// celestial com 5 reinos): verde topo-esq · azul topo-dir · dourado
// esq-baixo · violeta dir-baixo · carmesim base central.
const WORLD = [
  { id: 1, name: 'The Dreaming Wood',   pin: { x: 31, y: 26 } },
  { id: 2, name: 'Cavernes Luminis',    pin: { x: 70, y: 25 } },
  { id: 3, name: 'The Ashen Ruins',     pin: { x: 22, y: 60 } },
  { id: 4, name: 'The Fractured Peaks', pin: { x: 81, y: 62 } },
  { id: 5, name: 'Nil Aeternum',        pin: { x: 50, y: 86 } },
];

// Posições das 5 sub-áreas sobre o continente (à esquerda do painel direito,
// que começa em ~78%). Trilha em diagonal subindo, do começo (baixo-esq) ao
// fundo do bosque (topo).
const SUB_NODES = [
  { x: 14, y: 80 }, { x: 30, y: 60 }, { x: 45, y: 76 }, { x: 58, y: 52 }, { x: 70, y: 70 },
];

// Sub-áreas por mapa: imagem + nome temático. Mapas sem arte ainda caem no
// fallback numérico (icon=null). Caminho Vite direto (assets.js é gerado).
const SUBAREAS = {
  1: [
    { icon: 'eclats/enemies/map1/lanternroot_glade',  name: 'Lanternroot Glade' },
    { icon: 'eclats/enemies/map1/glimmercap_hollow',  name: 'Glimmercap Hollow' },
    { icon: 'eclats/enemies/map1/lightfall_stair',    name: 'The Lightfall Stair' },
    { icon: 'eclats/enemies/map1/dreaming_gate',      name: 'The Dreaming Gate' },
    { icon: 'eclats/enemies/map1/verdant_deep',       name: 'The Verdant Deep' },
  ],
};
// Fundo do continente por mapa (sobrepõe map.continent quando há arte dedicada)
const CONTINENT_BG = { 1: 'eclats/enemies/map1/wooding' };

// Lore curta POR MAPA (condensada da lore bible, em inglês — cada mapa "conta"
// o seu capítulo do mundo). Sem travessões. TODO(canon): revisar textos 2-5
// com o Willian / lore bible final.
const MAP_LORE = {
  1: 'A night forest of bioluminescent mushrooms, veined by a stream of teal-violet light. Far above, a dark vortex turns in the sky, and no one below seems to notice. The first chapter of the world: the Éclats carry something more.',
  2: 'Caves of blue and violet crystals that shine with their own light, where time itself seems to slow. The crystals are Éclats that tried to reunite alone, far from any witness, and came out beautiful and empty. The light learns it cannot mend itself.',
  3: 'The colossal ruins of the first civilization: broken columns, black thorns veined with ember gold, embers that never die. A whole world of light has already fallen here. The lesson the present buries is simple: this has happened before.',
  4: 'The world breaking in slow motion. Shattered peaks float in the air and fissures bleed the golden light of the world itself. La Fracture was never a single event. It is still happening, slow and endless, and now the wounds leak dark.',
  5: 'The territory of the Nothing: a moon fixed red, crimson clouds, a river of red light pouring from the castle gate. No gold survives in this place. Here the world reaches its last page, and asks only to be carried.',
};

// Lore por SUB-ÁREA (Map 1 — segue a trilha até o Guardião). Mapas sem texto
// próprio caem na lore do mapa. TODO(canon): escrever as sub-áreas dos Maps 2-5.
const SUBAREA_LORE = {
  1: [
    'Where the forest begins. A great lantern tree drips slow drops of golden light, and the Fragmented gather beneath it as if they still remembered warmth.',
    'A hollow of giant glowing caps, humming with spores of light. The deeper glow is not the mushrooms. Something underneath them is dreaming.',
    'A stairway climbs beside a fall of pure light. Those who built the steps are gone, but the light still comes down to meet whoever dares to climb.',
    'An arch of stone and vine, flooded with teal light. It is not a door out of the forest. It is the forest deciding who may go deeper.',
    'The oldest grove, an emerald deep where the canopy closes like a vault. At its heart waits the Gilded Hollow, the first mirror of the journey.',
  ],
};

// Recursos por mapa: tipos reais (economy.js). O tier de materiais escala com
// o mapa (T1..T4). Quantidades por área ainda não definidas no GDD.
// TODO(balance): definir taxas/quantidades de drop por sub-área.
function mapResources(map) {
  const tier = Math.min(map.id, 4); // map1→T1 ... map4/5→T4 (4 tiers de craft)
  return [
    { name: 'Lumens', amount: '—' },
    { name: 'Vestiges', amount: '—' },
    { name: `Materials · T${tier}`, amount: '—' },
  ];
}

let goToCombatFn = null;

export function buildMapView(root, state, goToCombat) {
  goToCombatFn = goToCombat;
  root.classList.remove('placeholder');
  root.classList.add('map');
  root.innerHTML = `
    <!-- Nível 1: mundo -->
    <section class="map-world" id="map-world">
      <!-- moldura no aspect da arte (1456×819): a imagem INTEIRA aparece
           (raízes de Nil Aeternum incluídas) e os pinos ficam presos a ela -->
      <div class="map-frame">
        <div class="map-canvas">
          <div class="map-bg world" id="world-bg"></div>
          <div class="map-pins" id="world-pins"></div>
        </div>
      </div>
      <div class="map-title"><b>Le Monde Fracturé</b><span>Choose a realm</span></div>
    </section>

    <!-- Nível 2: continente -->
    <section class="map-continent" id="map-continent" hidden>
      <div class="map-bg" id="cont-bg"></div>
      <button type="button" class="map-back" id="map-back">◀ World</button>
      <svg class="cont-trail" id="cont-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
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
    pin.className = 'map-pin';
    pin.dataset.map = m.id;
    pin.style.left = `${m.pin.x}%`;
    pin.style.top = `${m.pin.y}%`;
    pin.innerHTML = `<span class="dot"></span><span class="lbl">${m.name}</span>`;
    // Mapa atual abre o continente; mapas já alcançados (≤ maxMap) viajam até lá
    pin.addEventListener('click', () => {
      if (m.id === state.map) { openContinent(state); return; }
      if (m.id <= (state.maxMap || state.map)) {
        travelToMap(state, m.id);
        openContinent(state);
      }
    });
    pins.appendChild(pin);
  }

  $('map-back').addEventListener('click', () => {
    $('map-continent').hidden = true;
    $('map-world').hidden = false;
  });
}

// Abre a visão de continente do mapa ATUAL
function openContinent(state) {
  $('map-world').hidden = true;
  $('map-continent').hidden = false;
  const map = getCurrentMap(state);
  // fundo: arte dedicada do continente (direct path) ou o crop genérico
  const contArt = CONTINENT_BG[map.id];
  $('cont-bg').style.backgroundImage = contArt ? `url('${contArt}.webp')` : bg(map.continent);
  const subs = SUBAREAS[map.id] || [];
  const nodes = $('cont-nodes');
  nodes.innerHTML = '';
  for (let i = 1; i <= map.subareaCount; i++) {
    const pos = SUB_NODES[i - 1];
    const info = subs[i - 1];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = info ? 'sub-node art' : 'sub-node';
    node.dataset.sub = i;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.innerHTML = info
      ? `<span class="ico"><img src="${info.icon}.webp" alt="" loading="eager"></span>`
        + `<span class="nm">${info.name}</span>`
      : `<span class="ring"></span><span class="num">${i}</span>`;
    node.addEventListener('click', () => selectSub(state, i));
    nodes.appendChild(node);
  }
  // Trilha: segmento i liga o nó i ao i+1 (ordem da jornada)
  const trail = $('cont-trail');
  trail.innerHTML = '';
  for (let i = 1; i < map.subareaCount; i++) {
    const a = SUB_NODES[i - 1];
    const b = SUB_NODES[i];
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
    ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
    ln.dataset.seg = i + 1; // o segmento "leva" ao nó i+1
    trail.appendChild(ln);
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
  const map = getCurrentMap(state);
  const n = selectedSub;
  const accessible = n <= state.unlockedSubarea;
  const cleared = !!state.bossDefeated[n - 1];
  const sig = `${n}|${accessible}|${cleared}`;
  if (sig === panelSig) return;
  panelSig = sig;

  const range = subareaLevelRange(map, n);
  const packSize = map.packSizes[n - 1];
  const subName = (SUBAREAS[map.id] || [])[n - 1]?.name || `Sub-area ${n}`;
  const status = !accessible ? 'Locked' : (cleared ? 'Cleared' : 'Open');
  const lore = (SUBAREA_LORE[map.id] || [])[n - 1] || MAP_LORE[map.id] || '';
  const resources = mapResources(map);
  panel.innerHTML = `
    <div class="cover" id="cont-cover"></div>
    <div class="panel-body">
      <h2>${map.name}</h2>
      <div class="sub-name">${subName} · ${n}/${map.subareaCount}${cleared ? ' ✓' : ''}</div>
      ${lore ? `<p class="lore">${lore}</p>` : ''}
      <dl class="facts">
        <div><dt>Level</dt><dd>${Math.round(range.lo)}–${Math.round(range.hi)}</dd></div>
        <div><dt>Enemies</dt><dd>${packSize} per wave</dd></div>
        <div><dt>Status</dt><dd>${status}</dd></div>
      </dl>
      <div class="rewards">
        <div class="rewards-h">Resources</div>
        <ul class="rewards-list">
          ${resources.map((r) => `<li><span>${r.name}</span><b>${r.amount}</b></li>`).join('')}
        </ul>
      </div>
      <div class="panel-foot">
        <button type="button" class="enter-btn" id="enter-btn" ${accessible ? '' : 'disabled'}>
          ${accessible ? 'Enter' : '🔒 Defeat the previous Guardian'}
        </button>
      </div>
    </div>
  `;
  $('cont-cover').style.backgroundImage = bg(map.bg);
  if (accessible) {
    $('enter-btn').addEventListener('click', () => {
      enterSubarea(state, n);
      if (goToCombatFn) goToCombatFn();
    });
  }
}

export function renderMap(state) {
  const map = getCurrentMap(state);
  // Pinos do mundo: liberado se mapId ≤ maxMap (fronteira); atual destacado; futuros 🔒
  const frontier = state.maxMap || state.map;
  document.querySelectorAll('.map-pin').forEach((pin) => {
    const id = Number(pin.dataset.map);
    pin.classList.toggle('locked', id > frontier);
    pin.classList.toggle('current', id === state.map);
    pin.classList.toggle('done', id !== state.map && id <= frontier);
  });
  // Estados dos nós da sub-área (se o continente estiver montado)
  document.querySelectorAll('.sub-node').forEach((el) => {
    const i = Number(el.dataset.sub);
    el.classList.toggle('current', i === state.subarea);
    el.classList.toggle('cleared', !!state.bossDefeated[i - 1]);
    el.classList.toggle('locked', i > state.unlockedSubarea);
  });
  // Trilha: segmento aceso até onde o jogador já chegou (nó destino liberado)
  document.querySelectorAll('.cont-trail line').forEach((ln) => {
    const dest = Number(ln.dataset.seg);
    ln.classList.toggle('open', dest <= state.unlockedSubarea);
    ln.classList.toggle('locked', dest > state.unlockedSubarea);
  });
  // Mantém o painel coerente com o gate (ex.: boss recém-derrubado libera nó)
  if (!$('map-continent')?.hidden) renderPanel(state);
}
