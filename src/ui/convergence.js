// Overlay cerimonial CONVERGENCE — NÃO é uma tela de navegação. Modal de
// dispersão (o inverso do Awaken): a luz branco-azul reunida se desfaz em
// fragmentos DOURADOS que voltam ao mundo. Compacto — acontece 5-10x por mapa.
//
// Uso: openConvergence(data?) monta e mostra; closeConvergence() fecha.
// ⚠️ Sem lógica de jogo: QUANDO dispara e o CÁLCULO de points/conv_factor vêm
// depois. TODO(lógica): "Converge" deve aplicar a dispersão real no state.

import './convergence.css';

const ornSrc = (n) => `eclats/convergence/ornaments/${n}.png`;

// Dados (o disparador passa os reais via openConvergence({...})).
const PLACEHOLDER = {
  convergences: 0,
  bonus: '+0%',                 // bônus permanente acumulado
  gateLabel: 'Level 1 / 40',
  progressPct: 0,
  able: false,                 // já pode convergir?
  gate: 40,
  grant: '+20%',
  grantTags: ['Damage', 'HP', '+0.5% Gold'],
  tribute: '0',                // Lumens pagos como tributo ao convergir
  returns: ['Your Level (run XP)'],
  keeps: ['Gear rarity', 'Map position', 'Lumens &amp; Vestiges', 'Passives &amp; Mémoires'],
  lore: 'To keep the world, you let it go. Each new threshold lets the Seed disperse the light it gathered — and remember the pattern stronger.',
  note: 'Auto-Convergence available after Ascension I — the Rhythm will carry this rite for you.',
};

// Fragmentos da dispersão (branco-azul no centro → dourado nas bordas)
const PARTICLES = [
  { c: 'c s', x: 46, y: 44 }, { c: 'c', x: 53, y: 56 }, { c: '', x: 34, y: 36 }, { c: 's', x: 64, y: 32 },
  { c: '', x: 70, y: 62 }, { c: 's', x: 28, y: 64 }, { c: '', x: 16, y: 48 }, { c: 's', x: 82, y: 46 },
  { c: '', x: 22, y: 18 }, { c: 's', x: 76, y: 14 }, { c: '', x: 80, y: 84 }, { c: 's', x: 18, y: 84 },
];

// Agora é uma TELA (pane), não overlay: renderConvergence(host, data) preenche um
// container — usado como conteúdo da aba "Convergence" na tela do Seeker.
export function renderConvergence(host, data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  host.classList.add('cv-pane');
  host.innerHTML = `
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
          <div class="cv-l">Permanent bonus</div>
          <div class="cv-v">${d.bonus}</div>
        </div>
      </div>

      <div class="cv-threshold">
        <div class="cv-thr-top">
          <span class="cv-l">Next threshold</span>
          <span class="cv-thr-v"><b>${d.gateLabel}</b> · ${d.progressPct}%</span>
        </div>
        <div class="cv-bar"><i style="width:${d.progressPct}%"></i></div>
      </div>

      <div class="cv-effect">
        <div class="cv-effect-head">
          <span class="cv-effect-l">Each Convergence grants</span>
          <b class="cv-effect-v">${d.grant}</b>
        </div>
        <div class="cv-effect-chips">${d.grantTags.map((t) => `<span class="cv-chip">${t}</span>`).join('')}</div>
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
        <button type="button" class="cv-converge" ${d.able ? '' : 'disabled'}>${d.able ? 'Converge' : `Reach Level ${d.gate}`}</button>
      </div>
    </div>
  `;
  host.querySelector('.cv-converge').addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;         // ainda não atingiu o threshold
    if (typeof d.onConverge === 'function') d.onConverge();
  });
}
