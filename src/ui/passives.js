// Tela de Passivas — CP-7b (redesign Mapa 1): 12 nós menores em 3 ramos.
// Compra com Pontos de Convergence; custo sobe por rank. Notáveis/keystones = Mapa 3/4.
// Contrato: buildPassivesView(root, state) monta; renderPassives(state) atualiza.

import { formatNumber } from '../core/format.js';
import { NODES, NODE_IDS, RAMOS, nodeRank, nodeCost, canBuyNode, atNodeCap, buyNode, passivesUnlocked } from '../game/passives.js';

const LABEL = {
  dmg: 'Damage', critChance: 'Crit Chance', critDamage: 'Crit Damage', atkSpeed: 'Atk Speed',
  bossDmg: 'Boss Damage', hp: 'HP', defesa: 'Defense', regen: 'Regen',
  lumens: 'Lumens', xp: 'XP', materiais: 'Materials', faro: 'Elite Chance',
};

// Efeito total acumulado no rank atual.
function effectStr(id, rank) {
  const n = NODES[id];
  if (n.mode === 'mult') return `+${(((1 + n.per) ** rank - 1) * 100).toFixed(0)}%`;
  const v = rank * n.per;
  if (id === 'regen') return `+${(v * 100).toFixed(1)}%/s`;
  if (id === 'atkSpeed') return `+${(v * 100).toFixed(0)}%`;
  return `+${(v * 100).toFixed(1)}%`;
}

function nodeRow(state, id) {
  const rank = nodeRank(state, id);
  const capped = atNodeCap(state, id);
  const cap = NODES[id].cap === Infinity ? '∞' : NODES[id].cap;
  const cost = nodeCost(state, id);
  const can = canBuyNode(state, id);
  const btn = capped
    ? '<span class="pas-max">MAX</span>'
    : `<button type="button" class="pas-buy" data-id="${id}" ${can ? '' : 'disabled'}>${formatNumber(cost)} pts</button>`;
  return `<div class="pas-node">
    <div class="pas-node-top"><b>${LABEL[id]}</b><span class="pas-rank">${rank}/${cap}</span></div>
    <div class="pas-node-eff">${effectStr(id, rank)} ${LABEL[id]}</div>
    ${btn}
  </div>`;
}

export function buildPassivesView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('passivesx');
  root.innerHTML = `
    <div class="pas-wrap">
      <div class="pas-head">
        <h3>Passives</h3>
        <div class="pas-points">Convergence Points: <b id="pas-points">0</b></div>
      </div>
      <div class="pas-locked" id="pas-locked" hidden>Converge once to unlock the passive tree.</div>
      <div class="pas-cols" id="pas-cols"></div>
    </div>`;

  root.querySelector('#pas-cols').addEventListener('click', (e) => {
    const b = e.target.closest('.pas-buy'); if (!b) return;
    buyNode(state, b.dataset.id); renderPassives(state);
  });

  renderPassives(state);
}

export function renderPassives(state) {
  const pts = document.getElementById('pas-points');
  if (pts) pts.textContent = formatNumber(state.convPoints);

  const unlocked = passivesUnlocked(state);
  const lockEl = document.getElementById('pas-locked');
  if (lockEl) lockEl.hidden = unlocked;

  const cols = document.getElementById('pas-cols');
  if (cols) {
    cols.style.opacity = unlocked ? '1' : '.4';
    cols.innerHTML = Object.keys(RAMOS).map((ramo) => {
      const ids = NODE_IDS.filter((id) => NODES[id].ramo === ramo);
      return `<section class="pas-col">
        <h4>${RAMOS[ramo]}</h4>
        ${ids.map((id) => nodeRow(state, id)).join('')}
      </section>`;
    }).join('');
  }
}
