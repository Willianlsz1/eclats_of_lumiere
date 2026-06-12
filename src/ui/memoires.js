// Tela de Mémoires (pós-MVP) — galeria de 15 relíquias em 5 eras, compradas/
// evoluídas com Éclats. Clarté é o motor global (dano ×1.07^Σ níveis).
// Desbloqueio por era via Ascension (state.ascensions >= era).
//
// Contrato: buildMemoiresView(root, state) monta o DOM; renderMemoires(state) atualiza.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { MEMOIRES, MEMOIRE_ERAS } from '../data/constants.js';
import {
  nextCost, canBuy, buyMemoire, eraUnlocked, clarte, totalLevels, eraProgress,
} from '../game/memoires.js';

const $ = (id) => document.getElementById(id);

export function buildMemoiresView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('memoires');
  root.innerHTML = `
    <div class="mm-banner">
      <div class="mm-clarte"><span class="mm-lbl">Clarté</span>
        <b id="mm-clarte-val">×1.00</b><span class="mm-sub">dano global · 1.07^Σ níveis</span></div>
      <div class="mm-total"><span class="mm-lbl">Tikkun Olam</span>
        <b id="mm-total">0 / 15</b><span class="mm-sub">memórias reunidas</span></div>
    </div>
    <div class="mm-eras" id="mm-eras"></div>
  `;

  const eras = $('mm-eras');
  for (let era = 1; era <= 5; era++) {
    const band = document.createElement('section');
    band.className = 'mm-band';
    band.dataset.era = era;
    band.innerHTML = `
      <div class="mm-band-head"><b>Era ${era} · ${MEMOIRE_ERAS[era - 1]}</b>
        <span class="mm-band-prog" id="mm-prog-${era}"></span></div>
      <div class="mm-cards"></div>
      <div class="mm-band-lock" id="mm-lock-${era}">🔒 Desbloqueada na Ascension da Era ${era}</div>
    `;
    const cards = band.querySelector('.mm-cards');
    MEMOIRES.forEach((m, i) => {
      if (m.era !== era) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mm-card';
      card.dataset.i = i;
      card.innerHTML = `
        <span class="mm-art">${picture(`relics.${m.art}`, { alt: m.name })}</span>
        <span class="mm-name">Mémoire ${m.name}</span>
        <span class="mm-eff">${m.label}${m.wired ? '' : ' <i class="mm-prov">⏳</i>'}</span>
        <span class="mm-lvl"></span>
        <span class="mm-cost"></span>
      `;
      card.addEventListener('click', () => { buyMemoire(state, i); renderMemoires(state); });
      cards.appendChild(card);
    });
    eras.appendChild(band);
  }
}

export function renderMemoires(state) {
  $('mm-clarte-val').textContent = `×${formatNumber(clarte(state))}`;
  $('mm-total').textContent = `${state.memoires.filter((l) => l > 0).length} / 15`;

  for (let era = 1; era <= 5; era++) {
    const unlocked = eraUnlocked(state, era);
    const band = document.querySelector(`.mm-band[data-era="${era}"]`);
    band.classList.toggle('locked', !unlocked);
    $(`mm-lock-${era}`).style.display = unlocked ? 'none' : '';
    const pr = eraProgress(state, era);
    $(`mm-prog-${era}`).textContent = `${pr.unlocked}/${pr.total}`;
  }

  document.querySelectorAll('.mm-card').forEach((card) => {
    const i = Number(card.dataset.i);
    const level = state.memoires[i];
    const buyable = canBuy(state, i);
    card.classList.toggle('owned', level > 0);
    card.classList.toggle('buyable', buyable);
    card.querySelector('.mm-lvl').textContent = level > 0 ? `Nível ${formatNumber(level)}` : 'Bloqueada';
    card.querySelector('.mm-cost').textContent =
      `${level === 0 ? 'Reunir' : 'Evoluir'} · ${formatNumber(nextCost(state, i))} Éclats`;
  });
}
