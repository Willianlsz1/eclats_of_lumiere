// Tela de Ascension (pós-MVP) — marcos da Ordre (GDD §8). Layout v5: PALCO
// full-bleed (salão cerimonial da Ordre) + Séraphine, a Doyenne, por cima ·
// rank/comissão/Gatekeepers flutuam sobre a arte (sem caixas pesadas, no estilo
// Mémoires/Passivas). Derrotar o boss final do mapa + pagar Vestiges → asc_mult
// (dano e HP), bolsa de Éclats, rank e o próximo mapa. A1 libera Éclats/Mémoires
// + o drip. Só A1 é completável no MVP.
//
// ⚠️ O seletor de Difficulty saiu desta tela (relocado para o painel de entrada
// de sub-área do Nível 2). Aqui só restam rank, comissão e Gatekeepers.
//
// Arte (caminho direto, fora do manifesto — cena única, estilo Maël/Lucius):
//   eclats/ascension/hall.webp → o salão COM a Séraphine embutida (NPC + fundo juntos)
//
// Contrato: buildAscensionView(root, state) monta o DOM; renderAscension(state) atualiza.

import { formatNumber } from '../core/format.js';
import { ASCENSIONS, MAPS } from '../data/constants.js';
import {
  nextAscension, ascMult, reqMet, canAscend, doAscend, currentRank, eclatsDripPerSec,
} from '../game/ascension.js';
import { resetPack } from '../game/combat.js';

const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const roman = (n) => ROMAN[n - 1] || String(n);

// Arte (fora do manifesto — referência por caminho Vite). Cena única: o salão
// JÁ com a Séraphine embutida (NPC + fundo numa imagem só, como Maël/Lucius).
const HALL = 'eclats/ascension/hall.webp';
const glyphSrc = (g) => `eclats/ascension/glyphs/${g}.png`;

// Os 5 Gatekeepers — a Semente aprende a guardar o que você deixa para trás.
// `asc` = Ascension que o desperta. `type`:
//   toggle  → controle real (liga/desliga); bind = chaves de state.auto.
//   always  → passivo "Always on" quando desbloqueado.
//   soon    → desbloqueia na Ascension `asc`, mas o controle real vive noutro
//             lugar / ainda não existe → TODO(lógica).
const GATEKEEPERS = [
  { glyph: 'rhythm', name: 'The Rhythm', asc: 1, type: 'toggle', bind: ['stats', 'converge'],
    desc: 'Auto-converges and tends your Gold Stats. The light breathes on its own.' },
  { glyph: 'vigil', name: 'The Vigil', asc: 2, type: 'always',
    desc: 'Opens difficulties — the court’s tides reflood the regions you reclaimed.' },
  { glyph: 'echo', name: 'The Echo', asc: 3, type: 'soon',
    desc: 'Deploy an echo of yourself to farm a cleared region while you press on.' },
  { glyph: 'pull', name: 'The Pull', asc: 4, type: 'soon',
    desc: 'You pulse like a great Éclat — the corrupted are drawn to you in greater numbers.' },
  { glyph: 'transcendence', name: 'Transcendence', asc: 5, type: 'soon',
    desc: 'The final waking of the Seed. Sealed beyond the frontier.' },
];

export function buildAscensionView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('ascension');
  root.innerHTML = `
    <div class="as-stage" id="as-stage" style="--art:url('${HALL}')"></div>

    <div class="as-rank">
      <div class="as-rk-lbl" id="as-rk-lbl">Current standing</div>
      <h1 id="as-rk-name">Seeker</h1>
      <div class="as-rk-map" id="as-rk-map"></div>
      <div class="as-rk-pips" id="as-rk-pips">
        ${SEEKER_PIPS()}
      </div>
      <div class="as-rk-stats">
        <span>Ascension power <b id="as-mult" class="t-gold">×1</b></span>
        <span>Éclats drip <b id="as-drip">0/h</b></span>
      </div>
    </div>

    <aside class="as-commission" id="as-commission"></aside>

    <section class="as-gk">
      <div class="as-gk-head">
        <h2 class="as-title">Gatekeepers</h2>
        <span class="as-gk-sub">The Seed learns to guard what you leave behind</span>
      </div>
      <div class="as-gk-ladder" id="as-gk-ladder"></div>
    </section>
  `;

  // Escada de Gatekeepers
  const ladder = $('as-gk-ladder');
  GATEKEEPERS.forEach((g, idx) => {
    const step = document.createElement('div');
    step.className = 'as-gk-step';
    step.dataset.idx = idx;
    step.innerHTML = `
      <div class="as-gk-em"><img src="${glyphSrc(g.glyph)}" alt=""></div>
      <div class="as-gk-body">
        <div class="as-gk-nm">${g.name} <em>· Ascension ${roman(g.asc)}</em></div>
        <div class="as-gk-desc">${g.desc}</div>
      </div>
      <div class="as-gk-side" data-side="${idx}"></div>
    `;
    // Rhythm: toggle real ligado a state.auto (stats + converge juntos).
    if (g.type === 'toggle') {
      const side = step.querySelector('.as-gk-side');
      side.innerHTML = `<label class="as-gk-toggle">Active <span class="as-sw"></span></label>`;
      side.querySelector('.as-gk-toggle').addEventListener('click', () => {
        if (state.ascensions < g.asc) return; // travado
        const on = !(state.auto[g.bind[0]] && state.auto[g.bind[1]]);
        for (const k of g.bind) state.auto[k] = on;
        renderAscension(state);
      });
    }
    ladder.appendChild(step);
  });

  buildCommission(state);
  renderAscension(state);
}

// 5 pips de rank (preenchidos em render conforme o tier de Despertar)
function SEEKER_PIPS() {
  return [0, 1, 2, 3, 4].map((i) => `<i data-pip="${i}"></i>`).join('');
}

// (Re)constrói o painel de comissão — depende do próximo marco.
function buildCommission(state) {
  const host = $('as-commission');
  const a = nextAscension(state);

  if (!a) {
    host.innerHTML = `
      <div class="as-eyebrow">The Ordre has no further commission</div>
      <h3>You are <b>Lumière</b></h3>
      <div class="as-rew"><div class="r">Every fragment has found its place.</div></div>
      <div class="as-note">"The light promoted you long ago."</div>`;
    return;
  }

  // Nome da próxima fronteira: doAscend avança para o mapa a.mapBoss+1.
  const nextMap = MAPS[a.mapBoss]; // 0-indexed: id a.mapBoss+1
  const gk = GATEKEEPERS.find((g) => g.asc === a.id);

  // Recompensas derivadas dos dados reais (sem inventar cânon).
  const rew = [];
  rew.push('Open the next frontier &amp; its Hollows');
  if (gk) rew.push(`Awaken the next Gatekeeper — <b>${gk.name}</b>`);
  if (a.mult > 1) rew.push(`<b>×${a.mult}</b> damage &amp; vitality`);
  if (a.id === 1) rew.push('Unlocks <b>Éclats</b> / Mémoires &amp; the drip');

  host.innerHTML = `
    <div class="as-eyebrow">The Ordre commissions you onward</div>
    <h3>To <b>${nextMap ? nextMap.name : 'the next frontier'}</b></h3>
    <div class="as-rew">
      ${rew.map((r) => `<div class="r"><span class="k"></span>${r}</div>`).join('')}
      ${a.eclats > 0 ? `<div class="r g"><span class="k"></span>Bag of <b id="as-rew-eclats">${formatNumber(a.eclats)} Éclats</b></div>` : ''}
    </div>
    <div class="as-cost">
      <span class="cl">Tribute · Vestiges</span>
      <span class="cv">${a.cost > 0 ? formatNumber(a.cost) : 'Free'}</span>
    </div>
    <button type="button" class="as-btn" id="as-ascend">Ascend to ${a.rank}</button>
    <div class="as-note" id="as-note"></div>
    <!-- TODO(canon): fala da Semente por rank. Placeholder aprovado pelo mockup. -->
  `;
  $('as-ascend').addEventListener('click', () => {
    if (doAscend(state)) {
      resetPack(state);     // respawna a onda do novo mapa
      buildCommission(state); // o próximo marco mudou → reconstrói o painel
    }
    renderAscension(state);
  });
}

export function renderAscension(state) {
  const rank = currentRank(state);
  const tierIdx = ROMAN.indexOf(rank.tier); // 0..4

  // Banner de rank
  $('as-rk-lbl').textContent = `Current standing · Ascension ${roman(Math.max(1, state.ascensions))}`;
  $('as-rk-name').textContent = rank.name;
  const curMap = MAPS[Math.min(state.map, MAPS.length) - 1];
  $('as-rk-map').textContent = curMap ? `Frontier · ${curMap.name}` : '';
  $('as-rk-pips').querySelectorAll('i').forEach((pip) => {
    const i = Number(pip.dataset.pip);
    pip.classList.toggle('on', i < tierIdx);
    pip.classList.toggle('cur', i === tierIdx);
  });
  $('as-mult').textContent = `×${formatNumber(ascMult(state))}`;
  $('as-drip').textContent = `${formatNumber(eclatsDripPerSec(state) * 3600)}/h`;

  // Comissão — botão habilitado + nota de estado
  const a = nextAscension(state);
  const btn = $('as-ascend');
  const note = $('as-note');
  if (a && btn) {
    const met = reqMet(state);
    const able = canAscend(state);
    btn.disabled = !able;
    if (note) {
      note.textContent = met
        ? (able ? 'The rite is ready.' : `Gather ${formatNumber(a.cost)} Vestiges for Ascension ${roman(a.id)}.`)
        : `Defeat the map’s final boss to unlock Ascension ${roman(a.id)}.`;
    }
  }

  // Gatekeepers — estado por desbloqueio
  $('as-gk-ladder').querySelectorAll('.as-gk-step').forEach((step) => {
    const g = GATEKEEPERS[Number(step.dataset.idx)];
    const unlocked = state.ascensions >= g.asc;
    const side = step.querySelector('.as-gk-side');
    step.classList.toggle('locked', !unlocked);
    step.classList.remove('on', 'passive');

    if (!unlocked) {
      step.classList.add('locked');
      if (g.type === 'toggle') { // preserva o switch (montado no build), só desliga
        const sw = side.querySelector('.as-sw'); if (sw) sw.classList.remove('on');
      } else {
        side.textContent = 'Locked';
      }
      return;
    }

    if (g.type === 'toggle') {
      const on = state.auto[g.bind[0]] && state.auto[g.bind[1]];
      step.classList.toggle('on', on);
      const sw = side.querySelector('.as-sw');
      if (sw) sw.classList.toggle('on', on);
    } else if (g.type === 'always') {
      step.classList.add('on', 'passive');
      side.textContent = 'Always on';
    } else { // soon: desbloqueado mas controle ainda não existe aqui
      step.classList.add('passive');
      side.textContent = 'Active'; // TODO(lógica): controle real (Echo/Pull/Transcendência)
    }
  });
}
