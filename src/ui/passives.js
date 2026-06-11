// Tela de Passivas (pós-MVP) — 3 árvores × 15 (3 grupos de 5), upadas com
// Vestiges. Desbloqueia na 1ª Convergence. Gate: maximizar os 5 do grupo
// anterior libera o próximo. ⏳ efeitos provisórios (ver PASSIVES/constants).
//
// Contrato: buildPassivesView(root, state) monta o DOM; renderPassives(state) atualiza.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';
import {
  passivesUnlocked, nextCost, canBuy, buyPassive, groupUnlocked, isMax, treeProgress,
} from '../game/passives.js';

const $ = (id) => document.getElementById(id);
const GROUP_SIZE = 5;
let activeTab = 'eclat';

export function buildPassivesView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('passives');
  root.innerHTML = `
    <div class="pv-tabs" id="pv-tabs"></div>
    <div class="pv-body" id="pv-body"></div>
    <div class="pv-lock" id="pv-lock" hidden>
      <div class="glyph">✦</div>
      <h2>As Passivas dormem</h2>
      <p>A Semente desperta na <b>1ª Convergence</b>. Encha a parede de XP e convirja para abrir as três árvores.</p>
    </div>
  `;

  const tabs = $('pv-tabs');
  for (const tree of PASSIVE_TREES) {
    const t = PASSIVES.trees[tree];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pv-tab ${t.cls}`;
    btn.dataset.tree = tree;
    btn.innerHTML = `<b>${t.label}</b><span class="pv-tab-sub">${t.sub}</span><span class="pv-tab-count" id="pv-count-${tree}">0/15</span>`;
    btn.addEventListener('click', () => switchTab(state, tree));
    tabs.appendChild(btn);
  }

  switchTab(state, activeTab);
}

// (Re)constrói as 15 cartas (3 grupos) da árvore ativa
function switchTab(state, tree) {
  activeTab = tree;
  document.querySelectorAll('.pv-tab').forEach((b) => b.classList.toggle('active', b.dataset.tree === tree));

  const t = PASSIVES.trees[tree];
  const body = $('pv-body');
  body.className = `pv-body ${t.cls}`;
  body.innerHTML = '';

  for (let g = 0; g < 3; g++) {
    const group = document.createElement('div');
    group.className = 'pv-group';
    group.dataset.group = g;
    group.innerHTML = `<div class="pv-group-head"><span>Grupo ${g + 1}</span><span class="pv-group-lock" id="pv-glock-${tree}-${g}"></span></div><div class="pv-cards"></div>`;
    const cards = group.querySelector('.pv-cards');
    for (let p = 0; p < GROUP_SIZE; p++) {
      const i = g * GROUP_SIZE + p;
      const [name, key] = t.list[i];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pv-card';
      card.dataset.i = i;
      card.innerHTML = `
        <span class="pv-art">${picture(`passives.${tree}.${key}`, { alt: name })}</span>
        <span class="pv-name">${name}</span>
        <span class="pv-lvl"></span>
        <span class="pv-cost"></span>
      `;
      card.addEventListener('click', () => { buyPassive(state, activeTab, i); updateCards(state); });
      cards.appendChild(card);
    }
    body.appendChild(group);
  }
  renderPassives(state);
}

export function renderPassives(state) {
  const unlocked = passivesUnlocked(state);
  $('pv-lock').hidden = unlocked;
  $('pv-tabs').style.visibility = unlocked ? '' : 'hidden';
  $('pv-body').style.visibility = unlocked ? '' : 'hidden';
  if (!unlocked) return;

  // contadores das abas
  for (const tree of PASSIVE_TREES) {
    const pr = treeProgress(state, tree);
    const el = $(`pv-count-${tree}`);
    if (el) el.textContent = `${pr.unlocked}/${pr.total}${pr.maxed ? ` · ✦${pr.maxed}` : ''}`;
  }
  updateCards(state);
}

function updateCards(state) {
  const tree = activeTab;
  const t = PASSIVES.trees[tree];
  document.querySelectorAll('#pv-body .pv-group').forEach((groupEl) => {
    const g = Number(groupEl.dataset.group);
    const gUnlocked = groupUnlocked(state, tree, g);
    groupEl.classList.toggle('locked', !gUnlocked);
    const glock = $(`pv-glock-${tree}-${g}`);
    if (glock) glock.textContent = gUnlocked ? '' : '🔒 maximize o grupo anterior';
  });

  document.querySelectorAll('#pv-body .pv-card').forEach((card) => {
    const i = Number(card.dataset.i);
    const level = state.passives[tree][i];
    const maxed = isMax(state, tree, i);
    const buyable = canBuy(state, tree, i);
    card.classList.toggle('maxed', maxed);
    card.classList.toggle('buyable', buyable);
    card.classList.toggle('owned', level > 0 && !maxed);
    card.querySelector('.pv-lvl').textContent = maxed
      ? `✦ Máx (${PASSIVES.maxLevel})`
      : (level > 0 ? `Nível ${level}/${PASSIVES.maxLevel}` : 'Bloqueada');
    card.querySelector('.pv-cost').textContent = maxed
      ? ''
      : `${level === 0 ? 'Desbloquear' : 'Evoluir'} · ${formatNumber(nextCost(state, tree, i))} Vestiges`;
  });
}
