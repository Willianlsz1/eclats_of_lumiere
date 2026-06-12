// Overlay cerimonial AWAKENING (Despertar) — NÃO é uma tela de navegação.
// Cerimônia full-stage ao vencer o Guardião da Sub 3 do mapa: a luz interna
// converge a um novo limiar (tier T2→T5). Partículas DOURADAS (luz fragmentada)
// convergindo no halo BRANCO-AZUL (luz reunida). Sobreposto à tela ativa.
//
// Uso: openAwakening(data?) monta e mostra; closeAwakening() fecha.
// ⚠️ Sem lógica de jogo: QUEM dispara e o CÁLCULO dos ganhos vêm depois.
// TODO(lógica): chamar openAwakening(dadosReais) ao detectar o Despertar.

import './awakening.css';

// Moldura do tier (PNG-only, fora do manifesto auto-gerado).
const frameSrc = (tier) => `eclats/awakening/frames/t${tier}_alpha.png`;

// Dados PLACEHOLDER (mockup v4) — substituir pelos reais no disparo.
const PLACEHOLDER = {
  tier: 2,
  prevRank: 'Seeker',
  rank: 'Illuminate',
  index: 2, total: 5,         // Awakening II of V
  oldGlyph: 'S', newGlyph: 'I',
  gains: [
    { label: 'Damage', value: '×5' },
    { label: 'Vitality', value: '×5' },
    { label: 'New frame', value: '✦', gold: true },
  ],
  lore: '"In every other vessel, the fragments sleep apart. In you, they found each other — and what finds itself, burns brighter."',
};

// Partículas estáticas do mockup (douradas nas bordas → branco-azuis no centro)
const PARTICLES = [
  { c: 's', x: 14, y: 22 }, { c: '', x: 9, y: 58 }, { c: 'b', x: 20, y: 78 },
  { c: 's', x: 27, y: 36 }, { c: '', x: 84, y: 26 }, { c: 's', x: 90, y: 62 },
  { c: 'b', x: 78, y: 80 }, { c: 's', x: 71, y: 14 },
  { c: 'c s', x: 40, y: 30 }, { c: 'c', x: 59, y: 34 }, { c: 'c s', x: 44, y: 60 }, { c: 'c', x: 57, y: 64 },
];

let host = null;

function overlayHost() {
  return document.getElementById('overlay-host') || document.getElementById('stage') || document.body;
}

export function openAwakening(data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  closeAwakening(); // garante instância única

  host = document.createElement('div');
  host.className = 'aw-overlay';
  host.innerHTML = `
    <div class="aw-combat-bg"></div>
    <div class="aw-veil"></div>
    <div class="aw-beam"></div>
    ${PARTICLES.map((p) => `<span class="aw-p ${p.c}" style="left:${p.x}%;top:${p.y}%"></span>`).join('')}

    <div class="aw-stack">
      <div class="aw-small-rite">The light within you converges</div>

      <div class="aw-rite">
        <div class="aw-halo"></div>
        <div class="aw-halo-arc"></div>
        <div class="aw-old"><span class="aw-ph">${d.oldGlyph}</span></div>
        <div class="aw-card">
          <div class="aw-inner"><span class="aw-ph">${d.newGlyph}</span></div>
          <img class="aw-frame" src="${frameSrc(d.tier)}" alt="">
        </div>
      </div>

      <div class="aw-reveal">
        <div class="aw-you-are">You awaken as</div>
        <h1>${d.rank.toUpperCase()}</h1>
        <div class="aw-was"><b>${d.prevRank}</b> &nbsp;→&nbsp; <i>${d.rank}</i> · Awakening ${roman(d.index)} of ${roman(d.total)}</div>
      </div>

      <div class="aw-gains">
        ${d.gains.map((g) => `<div class="aw-gain ${g.gold ? 'gld' : ''}"><div class="aw-g-l">${g.label}</div><div class="aw-g-v">${g.value}</div></div>`).join('')}
      </div>

      <p class="aw-lore">${d.lore}</p>
      <button type="button" class="aw-continue">Continue</button>
    </div>
  `;
  overlayHost().appendChild(host);

  host.querySelector('.aw-continue').addEventListener('click', closeAwakening);
  // Esc também fecha (conveniência de teste).
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => host && host.classList.add('show'));
  return host;
}

export function closeAwakening() {
  document.removeEventListener('keydown', onKey);
  if (host && host.parentNode) host.parentNode.removeChild(host);
  host = null;
}

function onKey(e) { if (e.key === 'Escape') closeAwakening(); }

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const roman = (n) => ROMAN[n - 1] || String(n);
