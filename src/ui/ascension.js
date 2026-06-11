// Tela de Ascension (pós-MVP) — marcos da Ordre (GDD §8). Derrotar o boss final
// do mapa + pagar Vestiges → asc_mult (dano e HP), bolsa de Éclats, rank e o
// próximo mapa. A1 libera Éclats/Mémoires + o drip. Só A1 é completável no MVP.
//
// Contrato: buildAscensionView(root, state) monta o DOM; renderAscension(state) atualiza.

import { formatNumber } from '../core/format.js';
import { ASCENSIONS } from '../data/constants.js';
import {
  nextAscension, ascMult, reqMet, canAscend, doAscend, currentRank, eclatsDripPerSec,
} from '../game/ascension.js';

const $ = (id) => document.getElementById(id);

export function buildAscensionView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('ascension');
  root.innerHTML = `
    <header class="as-head">
      <div><span class="as-lbl">Rank da Ordre</span><b id="as-rank">Seeker · Tier I</b></div>
      <div><span class="as-lbl">Multiplicador de Ascension</span><b id="as-mult" class="t-gold">×1</b>
        <span class="as-sub">dano e HP</span></div>
      <div><span class="as-lbl">Drip de Éclats</span><b id="as-drip">0/h</b>
        <span class="as-sub">renda passiva (após A1)</span></div>
    </header>

    <div class="as-ladder" id="as-ladder"></div>
    <p class="as-note" id="as-note"></p>
  `;

  const ladder = $('as-ladder');
  ASCENSIONS.forEach((a, idx) => {
    const step = document.createElement('div');
    step.className = 'as-step';
    step.dataset.idx = idx;
    step.innerHTML = `
      <div class="as-step-id">A${a.id}</div>
      <div class="as-step-body">
        <b class="as-step-rank">${a.rank} · Tier ${a.tier}</b>
        <span class="as-step-req">Requer: ${a.req}</span>
        <span class="as-step-rew">${a.mult > 1 ? `×${a.mult} dano e HP · ` : ''}+${formatNumber(a.eclats)} Éclats${a.id === 1 ? ' · libera Éclats/Mémoires + drip' : ''}</span>
      </div>
      <div class="as-step-side">
        <span class="as-step-cost">${a.cost > 0 ? `${formatNumber(a.cost)} Vestiges` : 'grátis'}</span>
        <button type="button" class="as-step-btn" data-idx="${idx}" hidden>Ascender</button>
        <span class="as-step-state"></span>
      </div>
    `;
    step.querySelector('.as-step-btn').addEventListener('click', () => { doAscend(state); renderAscension(state); });
    ladder.appendChild(step);
  });
}

export function renderAscension(state) {
  const rank = currentRank(state);
  $('as-rank').textContent = `${rank.name} · Tier ${rank.tier}`;
  $('as-mult').textContent = `×${formatNumber(ascMult(state))}`;
  $('as-drip').textContent = `${formatNumber(eclatsDripPerSec(state) * 3600)}/h`;

  const next = nextAscension(state);
  const met = reqMet(state);
  const able = canAscend(state);

  ASCENSIONS.forEach((a, idx) => {
    const step = $('as-ladder').children[idx];
    const done = idx < state.ascensions;
    const isNext = next && idx === state.ascensions;
    step.classList.toggle('done', done);
    step.classList.toggle('next', !!isNext);
    step.classList.toggle('locked', !done && !isNext);
    const btn = step.querySelector('.as-step-btn');
    const stateEl = step.querySelector('.as-step-state');
    btn.hidden = !isNext;
    if (isNext) {
      btn.disabled = !able;
      stateEl.textContent = met ? '' : 'Requisito pendente';
    } else {
      btn.hidden = true;
      stateEl.textContent = done ? '✓ concluída' : '🔒 mapas futuros';
    }
  });

  $('as-note').textContent = next
    ? (met
        ? (able ? 'Pronto para ascender.' : `Junte ${formatNumber(next.cost)} Vestiges para a A${next.id}.`)
        : `Derrote o Guardião final do mapa para liberar a A${next.id}.`)
    : 'Todas as Ascensions concluídas — você é Lumière.';
}
