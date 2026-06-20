// Tela de Forja — CP-5b (redesign Mapa 1): forjar peça nova (material + Lumens) + refino 15:1.
// Subir raridade de uma peça existente fica na tela de Gear (Improve). Aqui = criar do zero.
// Contrato: buildForgeView(root, state) monta; renderForge(state) atualiza.

import { formatNumber } from '../core/format.js';
import { SLOTS, RARITY_NAMES, forgeCost, canForge, forgeItem, canRefineMat, refineMat } from '../game/gear.js';

const SLOT_NAME = { edge: 'Weapon', grasp: 'Gauntlets', reson: 'Amulet', vigil: 'Helm', veil: 'Cloak', band: 'Ring' };
const TIER_NAME = ['T1', 'T2', 'T3', 'T4'];
const FORGE_TIERS = [0, 1, 2]; // Mapa 1: Common/Uncommon/Rare

let selSlot = 'edge';
let selTier = 0;

export function buildForgeView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('forgex');
  root.innerHTML = `
    <div class="fg-wrap">
      <section class="fg-col">
        <h3>Materials</h3>
        <div class="fg-mats" id="fg-mats"></div>
        <h4>Refine (15 → 1)</h4>
        <div class="fg-refine" id="fg-refine"></div>
      </section>

      <section class="fg-col">
        <h3>Forge a piece</h3>
        <div class="fg-pick">
          <div class="fg-row" id="fg-slots">${SLOTS.map((s) => `<button type="button" data-slot="${s}">${SLOT_NAME[s]}</button>`).join('')}</div>
          <div class="fg-row" id="fg-tiers">${FORGE_TIERS.map((t) => `<button type="button" data-tier="${t}">${RARITY_NAMES[t]}</button>`).join('')}</div>
        </div>
        <div class="fg-cost" id="fg-cost"></div>
        <button type="button" class="fg-do" id="fg-do">Forge</button>
        <p class="fg-note">A peça forjada vai para o inventário (tela Gear), com afixos sorteados.</p>
      </section>
    </div>`;

  root.querySelector('#fg-slots').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]'); if (!b) return;
    selSlot = b.dataset.slot; renderForge(state);
  });
  root.querySelector('#fg-tiers').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tier]'); if (!b) return;
    selTier = Number(b.dataset.tier); renderForge(state);
  });
  root.querySelector('#fg-do').addEventListener('click', () => { forgeItem(state, selSlot, selTier); renderForge(state); });
  root.querySelector('#fg-refine').addEventListener('click', (e) => {
    const b = e.target.closest('[data-from]'); if (!b) return;
    refineMat(state, Number(b.dataset.from)); renderForge(state);
  });

  renderForge(state);
}

export function renderForge(state) {
  const mats = document.getElementById('fg-mats');
  if (mats) {
    mats.innerHTML = state.materiais.map((q, t) => `<div class="fg-mat"><span>${TIER_NAME[t]}</span><b>${formatNumber(q)}</b></div>`).join('');
  }

  const ref = document.getElementById('fg-refine');
  if (ref) {
    ref.innerHTML = state.materiais.slice(0, -1).map((q, t) => {
      const ok = canRefineMat(state, t);
      return `<button type="button" data-from="${t}" ${ok ? '' : 'disabled'}>${TIER_NAME[t]} → ${TIER_NAME[t + 1]}</button>`;
    }).join('');
  }

  document.querySelectorAll('#fg-slots [data-slot]').forEach((b) => b.classList.toggle('active', b.dataset.slot === selSlot));
  document.querySelectorAll('#fg-tiers [data-tier]').forEach((b) => b.classList.toggle('active', Number(b.dataset.tier) === selTier));

  const costEl = document.getElementById('fg-cost');
  const c = forgeCost(selTier);
  if (costEl) costEl.innerHTML = `Cost: <b>${formatNumber(c.mat)} ${TIER_NAME[selTier]}</b> + <b>${formatNumber(c.lum)}◆</b>`;
  const doBtn = document.getElementById('fg-do');
  if (doBtn) doBtn.disabled = !canForge(state, selSlot, selTier);
}
