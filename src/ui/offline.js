// Modal de boas-vindas OFFLINE — "the light did not sleep". Aparece ao abrir o
// jogo (modal de ENTRADA, não overlay cerimonial): tempo fora + eficiência,
// ganhos acumulados (via componente reward-row), teaser do Echo (pré-A3) e
// botão Collect. Monta em #modal-host (separado do #overlay-host).
//
// Uso: openOffline(data?) monta e mostra; closeOffline() fecha. Esc e Collect fecham.
// ⚠️ Sem lógica de jogo: cálculo dos ganhos, regra de eficiência, gatilho na
// inicialização e o resultado da caçada do Echo (pós-A3) são TODO(lógica).
// Os valores abaixo são PLACEHOLDERS do mockup.

import './offline.css';
import { rewardList } from './components/reward-row.js';

const icon = (n) => `eclats/offline/icons/${n}.png`;
const orn = (n) => `eclats/offline/ornaments/${n}.png`;
const ECHO_IMG = 'eclats/offline/echo.png';

// Dados PLACEHOLDER (mockup v2) — substituir pelos reais no disparo.
const PLACEHOLDER = {
  rank: 'Seeker',
  awayText: '7h 24m',
  efficiency: '60%',
  rewards: [
    { icon: icon('lumens'),      name: 'Lumens',            source: 'From The Dreaming Wood · Sub-area III', value: '+3.2B', variant: 'gold' },
    { icon: icon('mat_kindled'), name: 'Kindled materials', source: 'Gathered along the way',               value: '+38',   variant: 'ember' },
    { icon: icon('eclats'),      name: 'Éclats drip',       source: 'The Seed’s steady pull',               value: '+2',    variant: 'eclat' },
  ],
  echo: {
    unlocked: false, asc: 3,
    title: 'The Echo slept.',
    desc: 'After Ascension III, an echo of you will keep hunting while you are gone.',
  },
  lore: '"You closed your eyes. The light counted every moment you were gone — and kept them for you."',
};

const PARTICLES = [
  { c: '', x: 30, y: 24 }, { c: 's', x: 24, y: 60 }, { c: '', x: 72, y: 30 }, { c: 's', x: 78, y: 66 },
  { c: 's', x: 50, y: 14 }, { c: '', x: 64, y: 82 }, { c: 's', x: 36, y: 84 },
];

let host = null;
let onCollect = null;

function modalHost() {
  return document.getElementById('modal-host')
    || document.getElementById('overlay-host')
    || document.getElementById('stage')
    || document.body;
}

export function openOffline(data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  const echo = { ...PLACEHOLDER.echo, ...(data && data.echo ? data.echo : {}) };
  onCollect = d.onCollect || null;
  closeOffline(); // instância única

  host = document.createElement('div');
  host.className = 'of-modal-wrap';
  host.innerHTML = `
    <div class="of-combat-bg"></div>
    <div class="of-veil"></div>
    ${PARTICLES.map((p) => `<span class="of-p ${p.c}" style="left:${p.x}%;top:${p.y}%"></span>`).join('')}

    <div class="of-modal">
      <div class="of-orn crest"><img src="${orn('crest')}" alt=""></div>
      <div class="of-orn tl"><img src="${orn('tl')}" alt=""></div>
      <div class="of-orn tr"><img src="${orn('tr')}" alt=""></div>
      <div class="of-orn bl"><img src="${orn('bl')}" alt=""></div>
      <div class="of-orn br"><img src="${orn('br')}" alt=""></div>

      <div class="of-eyebrow">The light did not sleep</div>
      <h1 class="of-title">Welcome back, ${d.rank}</h1>
      <div class="of-away">You were away for <b>${d.awayText}</b> · gathered at <b>${d.efficiency}</b> efficiency</div>

      <div class="of-gains" id="of-gains"></div>

      <div class="of-echo ${echo.unlocked ? 'unlocked' : ''}">
        <div class="of-echo-ic"><img src="${ECHO_IMG}" alt=""></div>
        <div class="of-echo-meta">
          <div class="of-echo-nm">${echo.title}</div>
          <div class="of-echo-sub">${echo.desc}</div>
        </div>
        <div class="of-echo-lk">${echo.unlocked ? '✦' : `🔒 A${echo.asc}`}</div>
      </div>

      <button type="button" class="of-collect">Collect</button>
      <p class="of-lore">${d.lore}</p>
    </div>
  `;

  // Ganhos via componente reutilizável (reward-row)
  host.querySelector('#of-gains').appendChild(rewardList(d.rewards));

  modalHost().appendChild(host);

  host.querySelector('.of-collect').addEventListener('click', () => {
    // TODO(lógica): creditar os ganhos offline calculados no state ao coletar.
    if (typeof onCollect === 'function') onCollect();
    closeOffline();
  });
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => host && host.classList.add('show'));
  return host;
}

export function closeOffline() {
  document.removeEventListener('keydown', onKey);
  if (host && host.parentNode) host.parentNode.removeChild(host);
  host = null;
  onCollect = null;
}

function onKey(e) { if (e.key === 'Escape') closeOffline(); }
