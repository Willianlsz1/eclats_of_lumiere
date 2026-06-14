// Tela de Mémoires — LINHA DO TEMPO: UMA era por vez em tela cheia (respiro),
// com um seletor de timeline embaixo (os 5 marcos). A arte da era é a "janela
// da memória"; as relíquias daquela era ficam num espaço generoso ao lado.
// Reuni-las (Éclats) = o Tikkun Olam. Mecânica intacta (era abre na Ascension).
//
// Contrato: buildMemoiresView(root, state); renderMemoires(state).

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { MEMOIRES, MEMOIRE_ERAS } from '../data/constants.js';
import { nextCost, canBuy, buyMemoire, eraUnlocked, eraProgress } from '../game/memoires.js';

const $ = (id) => document.getElementById(id);

const ERA_ART = { // eras com arte própria
  1: 'eclats/memoires/era1.webp',
  2: 'eclats/memoires/era2.webp',
  3: 'eclats/memoires/era3.webp',
  4: 'eclats/memoires/era4.webp',
  5: 'eclats/memoires/era5.webp',
};
const ERA_BEAT = ['the first light, whole', 'the world takes form', 'the Shattering',
  'the wound of the Void', 'the convergence'];
// passagem de lore por era (visível na tela)
const ERA_LORE = [
  'Before the first word, there was only the Light. Or Ein Sof, whole and without end. Nothing had yet been broken.',
  'The Light poured into vessels, and the world took form: rivers, names, the first songs.',
  'The vessels could not hold so much light. They shattered in HaShevirah, and the Light scattered. Where it tore away, the Void remained: Nihel.',
  'The world bled light into the absence. The fragments wandered, half-asleep, forgetting they were ever one.',
  'One fragment still remembers the whole: the Seed you carry. To gather the scattered light is to repair the world. Tikkun Olam.',
];
// posições de scatter das 3 relíquias por era (left%/top%) — fragmentos perdidos.
// ⚙️ afinar quando a arte 16:9 chegar.
const SCATTER = [
  { x: 60, y: 24 }, { x: 76, y: 52 }, { x: 58, y: 78 },
];

let activeEra = 1;

export function buildMemoiresView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('memoires');
  root.innerHTML = `
    <div class="mm-stage" id="mm-stage"></div>
    <div class="mm-selector" id="mm-selector"></div>
  `;

  // seletor de timeline (5 marcos)
  const sel = $('mm-selector');
  for (let era = 1; era <= 5; era++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mm-mark era-${era}`;
    b.dataset.era = era;
    b.innerHTML = `<span class="mm-mark-dot"></span>
      <span class="mm-mark-lbl"><b>${MEMOIRE_ERAS[era - 1]}</b><i id="mm-mark-prog-${era}"></i></span>`;
    b.addEventListener('click', () => switchEra(state, era));
    sel.appendChild(b);
  }

  switchEra(state, activeEra);
}

function switchEra(state, era) {
  activeEra = era;
  document.querySelectorAll('.mm-mark').forEach((m) => m.classList.toggle('on', Number(m.dataset.era) === era));

  const stage = $('mm-stage');
  stage.className = `mm-stage era-${era}${ERA_ART[era] ? ' has-art' : ''}`;
  if (ERA_ART[era]) stage.style.setProperty('--art', `url('${ERA_ART[era]}')`);

  // relíquias da era, espalhadas (cada uma numa posição de scatter)
  let order = 0;
  const relics = MEMOIRES.map((m, i) => (m.era === era ? relicHtml(m, i, order++) : '')).join('');

  stage.innerHTML = `
    <div class="mm-stage-veil" id="mm-stage-veil"></div>
    <div class="mm-era-title">
      <span class="mm-era-num">Era ${era}</span>
      <b class="mm-era-name">${MEMOIRE_ERAS[era - 1]}</b>
      <span class="mm-era-beat">${ERA_BEAT[era - 1]}</span>
    </div>
    <p class="mm-lore">${ERA_LORE[era - 1]}</p>
    ${relics}
  `;

  stage.addEventListener('click', (e) => {
    const r = e.target.closest('.mm-relic');
    if (!r) return;
    buyMemoire(state, Number(r.dataset.i));
    renderMemoires(state);
  });

  renderMemoires(state);
}

// Relíquia "espalhada" — só ícone + texto (sem fundo), posicionada no scatter.
function relicHtml(m, i, order) {
  const p = SCATTER[order] || { x: 50, y: 50 };
  return `
    <button type="button" class="mm-relic" data-i="${i}" style="left:${p.x}%;top:${p.y}%">
      <span class="mm-relic-art">${picture(`relics.${m.art}`, { alt: m.name })}</span>
      <span class="mm-relic-text">
        <span class="mm-relic-name">Mémoire ${m.name}</span>
        <span class="mm-relic-eff">${m.label}</span>
        <span class="mm-relic-foot" id="mm-foot-${i}"></span>
      </span>
    </button>`;
}

export function renderMemoires(state) {
  // seletor: progresso + travado por era
  for (let era = 1; era <= 5; era++) {
    const unlocked = eraUnlocked(state, era);
    const mark = document.querySelector(`.mm-mark[data-era="${era}"]`);
    if (mark) mark.classList.toggle('locked', !unlocked);
    const pr = eraProgress(state, era);
    const pe = $(`mm-mark-prog-${era}`);
    if (pe) pe.textContent = unlocked ? `${pr.unlocked}/${pr.total}` : `🔒 Asc ${era}`;
  }

  // véu da era ativa se travada
  const unlockedNow = eraUnlocked(state, activeEra);
  const veil = $('mm-stage-veil');
  if (veil) {
    veil.style.display = unlockedNow ? 'none' : '';
    veil.innerHTML = unlockedNow ? '' : `<span class="mm-lock-i">🔒</span><span>Unlocks at Ascension ${activeEra}</span>`;
  }

  document.querySelectorAll('.mm-relic').forEach((r) => {
    const i = Number(r.dataset.i);
    const level = state.memoires[i];
    r.classList.toggle('owned', level > 0);
    r.classList.toggle('buyable', canBuy(state, i));
    const foot = $(`mm-foot-${i}`);
    if (foot) {
      foot.textContent = (level > 0 ? `Lv ${formatNumber(level)} · ` : '')
        + `${level === 0 ? 'Reunite' : 'Evolve'} · ${formatNumber(nextCost(state, i))} Éclats`;
    }
  });
}
