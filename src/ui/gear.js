// Tela de Gear / Equipment — CP-4b/5b (redesign Mapa 1): inventário + equipamento por afixos.
// Esquerda = 6 slots equipados (com Upgrade/Improve) + bônus totais. Direita = inventário.
// Contrato: buildGearView(root, state) monta o DOM; renderGear(state) atualiza.

import { formatNumber } from '../core/format.js';
import {
  SLOTS, RARITY_NAMES, MAX_RARITY, equipItem, discardItem,
  levelMult, atCap, itemLevelCost, upgradeItem, capLevelOf,
  canRarityUpItem, rarityUpMatCost, rarityUpItem,
  gearDamageMult, gearHpMult, gearDefesaMult, gearLumensMult, gearXpMult,
  gearCritAdd, gearCritDmgAdd, gearApsFlat, gearBossDmgMult,
} from '../game/gear.js';

const SLOT_NAME = { edge: 'Weapon', grasp: 'Gauntlets', reson: 'Amulet', vigil: 'Helm', veil: 'Cloak', band: 'Ring' };
const AFFIX_LABEL = {
  dmg: 'Damage', hp: 'HP', critChance: 'Crit Chance', critDamage: 'Crit Damage',
  atkSpeed: 'Atk Speed', bossDmg: 'Boss Damage', defesa: 'Defense', regen: 'Regen',
  lumens: 'Lumens', xp: 'XP', materiais: 'Materials',
};

// valor EFETIVO do afixo = base × levelMult(item)
function fmtAffix(a, lm) {
  const L = AFFIX_LABEL[a.type] || a.type;
  const v = a.value * lm;
  if (a.type === 'atkSpeed') return `+${v.toFixed(2)}/s ${L}`;
  if (a.type === 'regen') return `+${(v * 100).toFixed(2)}%/s ${L}`;
  return `+${(v * 100).toFixed(1)}% ${L}`;
}

function itemCard(it, state, { equipped = false } = {}) {
  const lm = levelMult(it);
  const affs = it.affixes.map((a) => `<li class="${a.secondary ? 'sec' : 'pri'}">${fmtAffix(a, lm)}</li>`).join('');
  let btns;
  if (equipped) {
    const capped = atCap(it);
    const upCost = itemLevelCost(it);
    const upOk = !capped && state.lumens >= upCost;
    const rrCost = rarityUpMatCost(it);
    const rrOk = canRarityUpItem(state, it.id);
    const upLabel = capped ? 'Max' : `Level up · ${formatNumber(upCost)}◆`;
    const rrLabel = it.rarity >= MAX_RARITY ? 'Top rarity' : `Improve · ${formatNumber(rrCost)} mat`;
    btns = `<div class="inv-btns">
      <button type="button" class="inv-up" data-id="${it.id}" ${upOk ? '' : 'disabled'}>${upLabel}</button>
      <button type="button" class="inv-rup" data-id="${it.id}" ${rrOk ? '' : 'disabled'}>${rrLabel}</button>
    </div>`;
  } else {
    btns = `<div class="inv-btns">
      <button type="button" class="inv-equip" data-id="${it.id}">Equip</button>
      <button type="button" class="inv-discard" data-id="${it.id}">Discard</button>
    </div>`;
  }
  const cap = capLevelOf(it);
  return `<div class="inv-card r-${it.rarity}">
    <div class="inv-card-h"><b>${SLOT_NAME[it.slot]}</b><span class="inv-rar">${RARITY_NAMES[it.rarity]} · Lv ${it.level}/${cap}</span></div>
    <ul class="inv-affs">${affs}</ul>${btns}
  </div>`;
}

export function buildGearView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('gearx');
  root.innerHTML = `
    <div class="gx-wrap">
      <section class="gx-col gx-equipped">
        <h3>Equipped</h3>
        <div class="gx-slots" id="gx-equipped"></div>
        <div class="gx-bonus" id="gx-bonus"></div>
      </section>
      <section class="gx-col gx-inv">
        <h3>Inventory (<span id="gx-invn">0</span>)</h3>
        <div class="gx-list" id="gx-inv"></div>
      </section>
    </div>`;

  // Equipados: Upgrade (Lumens) / Improve (material).
  root.querySelector('#gx-equipped').addEventListener('click', (e) => {
    const up = e.target.closest('.inv-up');
    const rup = e.target.closest('.inv-rup');
    if (up) { upgradeItem(state, Number(up.dataset.id)); renderGear(state); }
    else if (rup) { rarityUpItem(state, Number(rup.dataset.id)); renderGear(state); }
  });

  // Inventário: equipar / descartar.
  root.querySelector('#gx-inv').addEventListener('click', (e) => {
    const eq = e.target.closest('.inv-equip');
    const dc = e.target.closest('.inv-discard');
    if (eq) { equipItem(state, Number(eq.dataset.id)); renderGear(state); }
    else if (dc) { discardItem(state, Number(dc.dataset.id)); renderGear(state); }
  });

  renderGear(state);
}

export function renderGear(state) {
  const eqEl = document.getElementById('gx-equipped');
  if (eqEl) {
    eqEl.innerHTML = SLOTS.map((slot) => {
      const it = state.equipped[slot];
      return it
        ? itemCard(it, state, { equipped: true })
        : `<div class="inv-card empty"><div class="inv-card-h"><b>${SLOT_NAME[slot]}</b><span class="inv-rar">—</span></div><p class="inv-empty">empty</p></div>`;
    }).join('');
  }

  const invEl = document.getElementById('gx-inv');
  if (invEl) {
    const inv = [...state.inventory].sort((a, b) => b.rarity - a.rarity || a.slot.localeCompare(b.slot));
    invEl.innerHTML = inv.length
      ? inv.map((it) => itemCard(it, state)).join('')
      : '<p class="inv-empty">No items yet — kill mobs to find gear.</p>';
  }

  const n = document.getElementById('gx-invn');
  if (n) n.textContent = state.inventory.length;

  const bonus = document.getElementById('gx-bonus');
  if (bonus) {
    const rows = [
      ['Damage', `×${gearDamageMult(state).toFixed(2)}`],
      ['HP', `×${gearHpMult(state).toFixed(2)}`],
      ['Crit Chance', `+${(gearCritAdd(state) * 100).toFixed(1)}%`],
      ['Crit Damage', `+${(gearCritDmgAdd(state) * 100).toFixed(0)}%`],
      ['Atk Speed', `+${gearApsFlat(state).toFixed(2)}/s`],
      ['Defense', `+${((gearDefesaMult(state) - 1) * 100).toFixed(1)}%`],
      ['Lumens', `×${gearLumensMult(state).toFixed(2)}`],
      ['XP', `×${gearXpMult(state).toFixed(2)}`],
      ['Boss Dmg', `+${((gearBossDmgMult(state) - 1) * 100).toFixed(0)}%`],
    ];
    bonus.innerHTML = '<h4>Total bonuses</h4>' + rows.map(([k, v]) => `<div class="gx-brow"><span>${k}</span><b>${v}</b></div>`).join('');
  }
}
