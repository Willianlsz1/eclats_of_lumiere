// Tela de Passivas — 3 árvores em ABAS sobre o FUNDO da Árvore-Mundo.
// Os 15 nós de cada aba são posicionados SOBRE os limbos da arte (POSITIONS):
// base = Grupo 1 → meio = Grupo 2 → copa central = Grupo 3 (motores).
// Redesign visual + apresentação (cartão "Passive", EN, sem jargão). Mecânica
// intacta: maximizar um grupo libera o próximo. Ícones recoloridos por CSS (mask).
//
// ⚙️ POSITIONS é o mapa fácil de afinar (left%/top% por índice) — ajustar no F5.
//
// Contrato: buildPassivesView(root, state); renderPassives(state).

import { formatNumber } from '../core/format.js';
import { url } from '../data/assets.js';
import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';
import {
  passivesUnlocked, nextCost, canBuy, buyPassive, groupUnlocked, isMax, treeProgress,
  passiveDmgMult, passiveEcoMult, passiveHpMult,
} from '../game/passives.js';

const $ = (id) => document.getElementById(id);
const GROUP_SIZE = 5;
let activeTab = 'eclat';

const TREE_SUB = { eclat: 'Combat · damage', vestige: 'Economy · gains', fracture: 'Utility · HP' };
// Árvores que já têm banner de arte próprio (aba com placa). Vestige/Fracture
// entram aqui quando os banners chegarem.
const HAS_BANNER = new Set(['eclat', 'vestige', 'fracture']);
const TREE_STAT = { eclat: 'damage', vestige: 'gains (Lumens & XP)', fracture: 'HP' };
const TREE_MULT = { eclat: passiveDmgMult, vestige: passiveEcoMult, fracture: passiveHpMult };

// Posição de cada nó (left%/top%) sobre a Árvore-Mundo. Índices 0-4 = Grupo 1
// (base), 5-9 = Grupo 2 (meio), 10-14 = Grupo 3 (copa central). ⚙️ AFINAR NO F5.
const POSITIONS = [
  { x: 31, y: 70 }, { x: 41, y: 65 }, { x: 50, y: 63 }, { x: 61, y: 63 }, { x: 73, y: 66 }, // G1 base
  { x: 25, y: 48 }, { x: 37, y: 42 }, { x: 50, y: 39 }, { x: 66, y: 39 }, { x: 79, y: 44 }, // G2 meio
  { x: 35, y: 26 }, { x: 43, y: 20 }, { x: 50, y: 16 }, { x: 59, y: 18 }, { x: 69, y: 23 }, // G3 copa
];

const isEngine = (tree, art) => PASSIVES.engines[tree].includes(art);
const leverOf = (art) => PASSIVES.levers[art];
const roleClass = (tree, art) => (isEngine(tree, art) ? 'role-engine' : leverOf(art) ? 'role-lever' : '');

const LEVER_TEXT = {
  crit: 'Increases your critical chance.',
  aps: 'Increases your attack speed.',
  mobCap: 'More enemies appear on screen at once.',
  material: 'Increases the materials you find.',
  enemyPen: 'Your hits ignore part of enemy defense.',
  enemyReduce: 'Weakens enemy defense.',
};
function effectText(tree, i, level) {
  const stat = TREE_STAT[tree];
  const art = PASSIVES.trees[tree].list[i][1];
  const lev = leverOf(art);
  if (lev) return LEVER_TEXT[lev] || 'A special effect.';
  if (isEngine(tree, art)) {
    return `Multiplies your ${stat}, compounding with every level — the strongest growth in the tree.`;
  }
  const pct = PASSIVES.groupAddPct[Math.floor(i / GROUP_SIZE)] * 100;
  return level > 0
    ? `Increases your ${stat} by ${formatNumber(level * pct)}%.`
    : `Increases your ${stat} by ${formatNumber(pct)}% per level.`;
}

const maskStyle = (tree, key) => {
  const u = url(`passives.${tree}.${key}`);
  return `-webkit-mask-image:url('${u}');mask-image:url('${u}')`;
};

export function buildPassivesView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('passives');
  root.innerHTML = `
    <div class="pv-screen" aria-hidden="true"></div>
    <div class="pv-tabs" id="pv-tabs"></div>
    <div class="pv-body" id="pv-body"></div>
    <div class="pv-lock" id="pv-lock" hidden>
      <div class="glyph">✦</div>
      <h2>The passives sleep</h2>
      <p>The Seed awakens at your <b>first Convergence</b>. Fill the XP wall and converge to open the three trees.</p>
    </div>
  `;

  const tabs = $('pv-tabs');
  for (const tree of PASSIVE_TREES) {
    const t = PASSIVES.trees[tree];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pv-tab ${t.cls}`;
    btn.dataset.tree = tree;
    btn.innerHTML = `
      <span class="pv-emblem"><img class="pv-fruit" src="eclats/passives/fruit_${tree}.webp" alt=""></span>
      <span class="pv-tab-name">${t.label}</span>`;
    btn.addEventListener('click', () => switchTab(state, tree));
    tabs.appendChild(btn);
  }

  switchTab(state, activeTab);
}

// Um nó posicionado sobre a árvore (com cartão-tooltip embutido)
function nodeHtml(tree, i) {
  const [name, key] = PASSIVES.trees[tree].list[i];
  const p = POSITIONS[i];
  const below = i >= 10 ? ' tip-below' : ''; // copa: cartão abre pra baixo
  return `
    <button type="button" class="pv-node ${roleClass(tree, key)}${below}" data-i="${i}"
            style="left:${p.x}%;top:${p.y}%">
      <span class="pv-disc">
        <span class="pv-icon" style="${maskStyle(tree, key)}"></span>
        <i class="pv-ring"></i>
      </span>
      <span class="pv-node-name">${name}</span>
      <span class="pv-node-lvl" id="pv-lvl-${i}"></span>
      <div class="pv-tip">
        <div class="pv-tip-head">
          <span class="pv-tip-icon"><span class="pv-icon" style="${maskStyle(tree, key)}"></span></span>
          <div class="pv-tip-htext">
            <div class="pv-tip-name">${name} <span class="pv-tip-tag">Passive</span></div>
            <div class="pv-tip-lvl" id="pv-tlvl-${i}"></div>
          </div>
        </div>
        <p class="pv-tip-eff" id="pv-teff-${i}"></p>
        <div class="pv-tip-foot" id="pv-tfoot-${i}"></div>
      </div>
    </button>`;
}

function switchTab(state, tree) {
  activeTab = tree;
  document.querySelectorAll('.pv-tab').forEach((b) => b.classList.toggle('active', b.dataset.tree === tree));

  const t = PASSIVES.trees[tree];
  const body = $('pv-body');
  body.className = `pv-body ${t.cls}`;

  let nodes = '';
  for (let i = 0; i < 15; i++) nodes += nodeHtml(tree, i);
  body.innerHTML = `
    <div class="pv-summary" id="pv-summary"></div>
    <div class="pv-tree" id="pv-tree">${nodes}</div>`;

  // clique compra (desbloqueia/evolui) — delegação no palco
  $('pv-tree').addEventListener('click', (e) => {
    const node = e.target.closest('.pv-node');
    if (!node) return;
    buyPassive(state, activeTab, Number(node.dataset.i));
    updateCards(state);
  });

  renderPassives(state);
}

export function renderPassives(state) {
  const unlocked = passivesUnlocked(state);
  $('pv-lock').hidden = unlocked;
  $('pv-tabs').style.visibility = unlocked ? '' : 'hidden';
  $('pv-body').style.visibility = unlocked ? '' : 'hidden';
  if (!unlocked) return;

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
  const stat = TREE_STAT[tree];

  const summary = $('pv-summary');
  if (summary) {
    summary.innerHTML = `<span class="pv-sum-orb"></span>`
      + `<span class="pv-sum-l">${t.label} bonus</span>`
      + `<span class="pv-sum-div"></span>`
      + `<span class="pv-total">×${formatNumber(TREE_MULT[tree](state))}</span>`
      + `<span class="pv-sum-stat">${stat}</span>`;
  }

  document.querySelectorAll('#pv-tree .pv-node').forEach((node) => {
    const i = Number(node.dataset.i);
    const level = state.passives[tree][i];
    const maxed = isMax(state, tree, i);
    const locked = !groupUnlocked(state, tree, Math.floor(i / GROUP_SIZE));
    node.classList.toggle('maxed', maxed);
    node.classList.toggle('buyable', canBuy(state, tree, i));
    node.classList.toggle('owned', level > 0 && !maxed);
    node.classList.toggle('locked', locked && level === 0);
    node.style.setProperty('--p', (level / PASSIVES.maxLevel).toFixed(3));

    const lvlEl = $(`pv-lvl-${i}`);
    if (lvlEl) lvlEl.textContent = maxed ? '✦' : (level > 0 ? `${level}/${PASSIVES.maxLevel}` : '');

    const tlvl = $(`pv-tlvl-${i}`);
    if (tlvl) tlvl.textContent = `Level ${level}/${PASSIVES.maxLevel}`;
    const teff = $(`pv-teff-${i}`);
    if (teff) teff.textContent = effectText(tree, i, level);
    const tfoot = $(`pv-tfoot-${i}`);
    if (tfoot) {
      tfoot.className = 'pv-tip-foot' + (maxed ? ' max' : locked ? ' locked' : ' cost');
      tfoot.textContent = maxed ? 'Max Level'
        : locked ? 'Locked — max the tier below'
        : `${level === 0 ? 'Unlock' : 'Upgrade'} · ${formatNumber(nextCost(state, tree, i))} Vestiges`;
    }
  });
}
