// Overlay cerimonial CONVERGENCE — NÃO é uma tela de navegação. Modal de
// dispersão (o inverso do Awaken): a luz branco-azul reunida se desfaz em
// fragmentos DOURADOS que voltam ao mundo. Compacto — acontece 5-10x por mapa.
//
// Uso: openConvergence(data?) monta e mostra; closeConvergence() fecha.
// ⚠️ Sem lógica de jogo: QUANDO dispara e o CÁLCULO de points/conv_factor vêm
// depois. TODO(lógica): "Converge" deve aplicar a dispersão real no state.

import './convergence.css';

const ornSrc = (n) => `eclats/convergence/ornaments/${n}.png`;

// Dados PLACEHOLDER (mockup v3) — substituir pelos reais no disparo.
const PLACEHOLDER = {
  points: '+12',
  pointsNote: 'peak XP · boss bonus ✓',
  factor: '×1.41',
  prevFactor: '×1.34',
  returns: ['Lumens · 8.4e12', 'Gold Stats levels', 'Hero progress this cycle'],
  keeps: ['<b>Passives</b> &amp; Vestiges', '<b>Gear</b> — levels, rarity, affixes', '<b>Mémoires</b> &amp; Éclats', '<b>Awakenings</b> &amp; map progress'],
  lore: '"To keep the world, you let it go. The Seed remembers the pattern — and every release teaches it to gather faster."',
  note: 'Auto-Convergence available after Ascension I — the Rhythm will carry this rite for you.',
};

// Fragmentos da dispersão (branco-azul no centro → dourado nas bordas)
const PARTICLES = [
  { c: 'c s', x: 46, y: 44 }, { c: 'c', x: 53, y: 56 }, { c: '', x: 34, y: 36 }, { c: 's', x: 64, y: 32 },
  { c: '', x: 70, y: 62 }, { c: 's', x: 28, y: 64 }, { c: '', x: 16, y: 48 }, { c: 's', x: 82, y: 46 },
  { c: '', x: 22, y: 18 }, { c: 's', x: 76, y: 14 }, { c: '', x: 80, y: 84 }, { c: 's', x: 18, y: 84 },
];

let host = null;
let onConverge = null; // callback opcional do disparador

function overlayHost() {
  return document.getElementById('overlay-host') || document.getElementById('stage') || document.body;
}

export function openConvergence(data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  closeConvergence();               // limpa um overlay anterior (zera onConverge)...
  onConverge = d.onConverge || null; // ...e SÓ ENTÃO registra o callback (bug fix CP-3b)

  host = document.createElement('div');
  host.className = 'cv-overlay';
  host.innerHTML = `
    <div class="cv-combat-bg"></div>
    <div class="cv-veil"></div>

    <div class="cv-burst">
      <div class="cv-core"></div>
      ${PARTICLES.map((p) => `<span class="cv-p ${p.c}" style="left:${p.x}%;top:${p.y}%"></span>`).join('')}
    </div>

    <div class="cv-modal">
      <div class="cv-orn crest"><img src="${ornSrc('crest')}" alt=""></div>
      <div class="cv-orn tl"><img src="${ornSrc('tl')}" alt=""></div>
      <div class="cv-orn tr"><img src="${ornSrc('tr')}" alt=""></div>
      <div class="cv-orn bl"><img src="${ornSrc('bl')}" alt=""></div>
      <div class="cv-orn br"><img src="${ornSrc('br')}" alt=""></div>

      <div class="cv-eyebrow">The rite of dispersal</div>
      <h1 class="cv-title">Convergence</h1>
      <p class="cv-lore">${d.lore}</p>

      <div class="cv-gain-strip">
        <div class="cv-g points">
          <div class="cv-l">Points this cycle</div>
          <div class="cv-v">${d.points}</div>
          <div class="cv-d">${d.pointsNote}</div>
        </div>
        <div class="cv-g">
          <div class="cv-l">Convergence factor</div>
          <div class="cv-v">${d.factor}</div>
          <div class="cv-d">was ${d.prevFactor}</div>
        </div>
      </div>

      <div class="cv-cols">
        <div class="cv-col lost">
          <h4>Returns to the world</h4>
          <ul>${d.returns.map((r) => `<li>${r}</li>`).join('')}</ul>
        </div>
        <div class="cv-col kept">
          <h4>The Seed keeps</h4>
          <ul>${d.keeps.map((k) => `<li>${k}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="cv-actions">
        <button type="button" class="cv-later">Not yet</button>
        <button type="button" class="cv-converge">Converge</button>
      </div>
      <div class="cv-note">${d.note}</div>
    </div>
  `;
  overlayHost().appendChild(host);

  host.querySelector('.cv-later').addEventListener('click', closeConvergence);
  host.querySelector('.cv-converge').addEventListener('click', () => {
    // TODO(lógica): aplicar a Convergência real (dispersar Lumens/Gold Stats/
    // progresso do ciclo; somar points; atualizar conv_factor) no state.
    if (typeof onConverge === 'function') onConverge();
    closeConvergence();
  });
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => host && host.classList.add('show'));
  return host;
}

export function closeConvergence() {
  document.removeEventListener('keydown', onKey);
  if (host && host.parentNode) host.parentNode.removeChild(host);
  host = null;
  onConverge = null;
}

function onKey(e) { if (e.key === 'Escape') closeConvergence(); }
