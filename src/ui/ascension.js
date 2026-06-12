// Tela de Ascension (pós-MVP) — marcos da Ordre (GDD §8). Derrotar o boss final
// do mapa + pagar Vestiges → asc_mult (dano e HP), bolsa de Éclats, rank e o
// próximo mapa. A1 libera Éclats/Mémoires + o drip. Só A1 é completável no MVP.
//
// Contrato: buildAscensionView(root, state) monta o DOM; renderAscension(state) atualiza.

import { formatNumber } from '../core/format.js';
import { ASCENSIONS, DIFFICULTIES, MAPS } from '../data/constants.js';
import {
  nextAscension, ascMult, reqMet, canAscend, doAscend, currentRank, eclatsDripPerSec,
} from '../game/ascension.js';
import { resetPack } from '../game/combat.js';
import { difficultyAvailable, setDifficulty } from '../game/difficulty.js';

const $ = (id) => document.getElementById(id);

// Fate Keeper mínimo p/ cada automação (A1 = stats/converge, A2 = progress)
const AUTO_FK = { stats: 1, converge: 1, progress: 2 };

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

    <section class="as-fate">
      <h3>Fate Keepers — Automação</h3>
      <div class="as-autos" id="as-autos">
        <label><input type="checkbox" data-auto="stats"> Auto Gold Stats <i class="as-fk">A1</i></label>
        <label><input type="checkbox" data-auto="converge"> Auto Convergir <i class="as-fk">A1</i></label>
        <label><input type="checkbox" data-auto="progress"> Auto-progressão <i class="as-fk">A2</i></label>
      </div>
      <h3>Dificuldade <i class="as-fk">abre na A2</i></h3>
      <div class="as-diffs" id="as-diffs">
        ${DIFFICULTIES.map((d, i) => `<button type="button" data-diff="${i}">${d.name}</button>`).join('')}
      </div>
      <h3>Eco do Seeker <i class="as-fk">A3</i></h3>
      <div class="as-diffs" id="as-eco">
        <button type="button" data-eco="0">Desligado</button>
        ${MAPS.map((m) => `<button type="button" data-eco="${m.id}">Map ${m.id}</button>`).join('')}
      </div>
    </section>
  `;

  $('as-autos').querySelectorAll('input[data-auto]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const k = cb.dataset.auto;
      if (state.ascensions >= AUTO_FK[k]) state.auto[k] = cb.checked; else cb.checked = false;
    }));
  $('as-diffs').querySelectorAll('button[data-diff]').forEach((b) =>
    b.addEventListener('click', () => { setDifficulty(state, Number(b.dataset.diff)); renderAscension(state); }));
  $('as-eco').querySelectorAll('button[data-eco]').forEach((b) =>
    b.addEventListener('click', () => {
      const m = Number(b.dataset.eco);
      if (state.ascensions >= 3 && m <= state.map) state.ecoMap = m;
      renderAscension(state);
    }));

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
    step.querySelector('.as-step-btn').addEventListener('click', () => {
      if (doAscend(state)) resetPack(state); // respawna a onda do novo mapa
      renderAscension(state);
    });
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

  // Fate Keepers — automação (toggles) + dificuldade
  $('as-autos').querySelectorAll('input[data-auto]').forEach((cb) => {
    const k = cb.dataset.auto;
    const unlocked = state.ascensions >= AUTO_FK[k];
    cb.disabled = !unlocked;
    cb.checked = unlocked && state.auto[k];
    cb.closest('label').classList.toggle('locked', !unlocked);
  });
  $('as-diffs').querySelectorAll('button[data-diff]').forEach((b) => {
    const i = Number(b.dataset.diff);
    const d = DIFFICULTIES[i];
    const avail = difficultyAvailable(state, i);
    b.disabled = !avail;
    b.classList.toggle('active', state.difficulty === i);
    b.textContent = d.breakInf ? `${d.name} 🔒` : d.name;
    b.title = d.breakInf ? 'Requer break_infinity (futuro)' : `×${formatNumber(d.hpMult)} HP/dano · ×${d.rewardMult} recompensa`;
  });
  // Eco do Seeker (A3): só mapas já alcançados (≤ map atual) selecionáveis
  const ecoOn = state.ascensions >= 3;
  $('as-eco').querySelectorAll('button[data-eco]').forEach((b) => {
    const m = Number(b.dataset.eco);
    b.disabled = !ecoOn || (m > state.map);
    b.classList.toggle('active', state.ecoMap === m);
  });
}
