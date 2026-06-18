// Tela de Gear / Equipment — REDESIGN paper-doll (alvo: tela de referência).
// Moldura do modal (vitrine dourada) + Armeiro ao centro com os 6 slots das
// peças de Éclat ao redor (3 esq + 3 dir). Cada slot tem Level Up INLINE
// (badge LVL + custo + ação). Multiplicador GLOBAL no rodapé. Stats à esquerda.
// Subir raridade NÃO fica aqui — vai pra Forja (só upgrade de nível aqui).
//
// Contrato: buildGearView(root, state) monta o DOM; renderGear(state) atualiza.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { GEAR, GEAR_RARITIES, GEAR_RARITY_LABELS, COMBAT } from '../data/constants.js';
import { apsBonus } from '../game/stats.js';
import {
  primaryMult, secondaryMult, critOf, critDmgOf, gildedOf, activeSecondaries,
  levelCost, atLevelCap, buyLevels,
} from '../game/gear.js';

const $ = (id) => document.getElementById(id);
const pieceDef = (key) => GEAR.pieces.find((p) => p.key === key);
const rarityName = (r) => GEAR_RARITIES[r];

const SLOT_EN = { Arma: 'Weapon', Elmo: 'Helm', Manto: 'Cloak', Manoplas: 'Gauntlets', Amuleto: 'Amulet', Anel: 'Ring' };
const SLOT_LAYOUT = { left: ['edge', 'vigil', 'veil'], right: ['grasp', 'reson', 'band'] };
const AFFIX_LABELS = {
  dmg: 'damage', hp: 'HP', gilded: 'gilded chance', crit: 'crit', critDmg: 'crit damage',
  aps: 'attack speed', regen: 'regen', bossDmg: 'boss damage', lumens: 'Lumens', xp: 'XP',
  materiais: 'materials', erosao: 'erosion',
};
// flat do afixo (CP-4): nível × flatPerLevel × rarityMult × (secundário? secondaryExp)
function affixFlat(type, level, rarity, isSec) {
  const per = GEAR.flatPerLevel[type] || 0;
  return level * per * GEAR.rarityMult[rarity] * (isSec ? GEAR.secondaryExp : 1);
}
// gain de um multiplicador em +% (sem ".0" sobrando), NUNCA "×1"
const affGain = (m) => `+${String(formatNumber((m - 1) * 100)).replace(/\.0$/, '')}%`;

// descritor "per N levels" (estilo Gaiadon): escolhe N pra o número ficar legível
function perN(ratePerLevel, suffix = '', prefix = '+') {
  for (const n of [1, 5, 25, 100, 1000, 10000, 100000]) {
    if (ratePerLevel * n >= 0.1) {
      const val = String(formatNumber(ratePerLevel * n)).replace(/\.0$/, '');
      return `${prefix}${val}${suffix} per ${n === 1 ? 'level' : `${formatNumber(n)} levels`}`;
    }
  }
  return `${prefix}${formatNumber(ratePerLevel * 1e6)}${suffix} per 1M levels`;
}

// Multiplicador GLOBAL de level-up (aplica a qualquer slot)
const MULTS = [1, 10, 100, 1000, 100000];
let mult = 100;

function slotMarkup(def) {
  return `
    <div class="gr-slot" data-key="${def.key}">
      <span class="gr-slot-box">
        <span class="gr-slot-lvl" id="gr-lvl-${def.key}"></span>
        <span class="gr-slot-art" id="gr-art-${def.key}"></span>
        <i class="gr-slot-frame"></i>
        <div class="gr-tip" id="gr-tip-${def.key}"></div>
      </span>
      <span class="gr-slot-actions">
        <button type="button" class="gr-slot-up" id="gr-up-${def.key}">Level up</button>
        <span class="gr-slot-cost" id="gr-cost-${def.key}"></span>
      </span>
    </div>`;
}

// Afixos exibíveis: cada um vira { val, label, per (descritor por nível), primary }.
// Afixos de stat (dano/HP/APS/defesa/regen) viram 2 linhas: FLAT (base) e % (multiplicador).
function affixEntries(def, piece, state) {
  const lvl = piece.level, rar = piece.rarity, rm = GEAR.rarityMult[rar];
  const out = [];
  // Cada afixo vira 1+ linhas no estilo da referência: VALOR + label + "+x per N levels".
  // bonus:true = camada multiplicativa/bônus (cor verde); false = base/flat/chance (branco).
  const add = (type, isSec) => {
    const w = isSec ? GEAR.secondaryExp : 1;
    const prim = !isSec;
    if (type === 'aps') {
      // APS: mostra o GANHO REAL de velocidade (% mais rápido). Só no primário (Amuleto).
      if (!prim) return;
      const pctFaster = state ? (apsBonus(state) / COMBAT.baseAPS) * 100 : 0;
      out.push({ val: `+${pctFaster.toFixed(0)}%`, label: 'attack speed', per: '', primary: true, bonus: false });
      return;
    }
    // Chances planas (crit / gilded) — valor base (branco)
    if (type === 'crit') {
      out.push({ val: `+${formatNumber(critOf(lvl, rar) * w * 100)}%`, label: 'crit rate',
        per: perN(GEAR.critPerLevel * rm * w * 100, '%'), primary: prim, bonus: false });
      return;
    }
    if (type === 'gilded') {
      out.push({ val: `+${formatNumber(gildedOf(lvl, rar) * w * 100)}%`, label: 'gilded chance',
        per: perN(GEAR.gildedPerLevel * rm * w * 100, '%'), primary: prim, bonus: false });
      return;
    }
    if (type === 'critDmg') {
      out.push({ val: `+${formatNumber(critDmgOf(lvl, rar) * w * 100)}%`, label: 'crit dmg',
        per: perN(GEAR.critDmgPerLevel * rm * w * 100, '%'), primary: prim, bonus: true });
      return;
    }
    // FARM (Lumens/XP/Materiais): % linear (afixPctRate). Primário branco · secundário verde.
    if (type === 'lumens' || type === 'xp' || type === 'materiais') {
      out.push({ val: `+${formatNumber(lvl * GEAR.affixPctRate * rm * w * 100)}%`, label: AFFIX_LABELS[type],
        per: perN(GEAR.affixPctRate * rm * w * 100, '%'), primary: prim, bonus: isSec });
      return;
    }
    const label = AFFIX_LABELS[type];
    // 1) FLAT (base, branco) — se a peça tiver flat nesse tipo
    if ((GEAR.flatPerLevel[type] || 0) > 0) {
      out.push({ val: `+${formatNumber(affixFlat(type, lvl, rar, isSec))}`, label,
        per: perN(GEAR.flatPerLevel[type] * rm * w), primary: prim, bonus: false });
    }
    if (isSec) {
      // SECUNDÁRIO: bônus % combinado (verde)
      out.push({ val: `+${formatNumber((secondaryMult(lvl, rar) - 1) * 100)}%`, label: `${label} bonus`, per: '', primary: false, bonus: true });
    } else {
      // 2) BÔNUS % (verde)
      out.push({ val: `+${formatNumber(lvl * GEAR.bonusRate * rm * 100)}%`, label: `${label} bonus`,
        per: perN(GEAR.bonusRate * rm * 100, '%'), primary: true, bonus: true });
      // 3) MULTIPLIER × (verde) — só INCOMUM+ (rar≥1) e nos tipos multiplicativos consumidos
      if (rar >= 1 && (type === 'dmg' || type === 'hp')) {
        const m = 1 + lvl * GEAR.multRate * rm;
        out.push({ val: `×${formatNumber(m)}`, label: `${label} multiplier`,
          per: perN(GEAR.multRate * rm * 100, '%'), primary: true, bonus: true });
      }
    }
  };
  add(def.primary, false);
  // Mostra SÓ os afixos já LIBERADOS (ativos pela raridade); os bloqueados aparecem
  // conforme a raridade sobe (sem listar os travados).
  for (const sec of activeSecondaries(def, rar)) add(sec, true);
  return out;
}
const multLabel = (m) => (m >= 100000 ? '×100K' : `×${m}`);

export function buildGearView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('gear');
  root.innerHTML = `
    <div class="gr-screen"></div>

    <aside class="gr-summary">
      <h3>Equipment Bonuses</h3>
      <div class="gr-breakdown" id="gr-breakdown"></div>
      <p class="gr-note">Raise rarity at The Forge.</p>
    </aside>

    <div class="gr-slots-col side-left">${SLOT_LAYOUT.left.map((k) => slotMarkup(pieceDef(k))).join('')}</div>
    <div class="gr-slots-col side-right">${SLOT_LAYOUT.right.map((k) => slotMarkup(pieceDef(k))).join('')}</div>

    <!-- Identidade do Armeiro, fixada aos pés (mesmo estilo do nameplate do Maël) -->
    <div class="gr-npc-id">
      <div class="gr-npc-text">
        <div class="gr-npc-name">Lucius</div><!-- TODO(canon): ratificar nome no lore bible -->
        <div class="gr-npc-title">Armorer of the Ordre</div>
      </div>
    </div>

    <div class="gr-multbar">
      <span class="gr-multbar-l">Equipment level</span>
      <div class="gr-mults" id="gr-mults">
        ${MULTS.map((m) => `<button type="button" data-m="${m}">${multLabel(m)}</button>`).join('')}
        <button type="button" data-m="max" class="gr-max">LEVEL MAX</button>
      </div>
    </div>
  `;

  // o botão Level up de cada slot upa a peça com o multiplicador global
  root.querySelectorAll('.gr-slot').forEach((el) =>
    el.querySelector('.gr-slot-up').addEventListener('click', () => {
      buyLevels(state, el.dataset.key, mult === 'max' ? 1e9 : mult);
      renderGear(state);
    }));

  // barra de multiplicador (global)
  root.querySelectorAll('.gr-mults button').forEach((b) => {
    b.classList.toggle('active', String(mult) === b.dataset.m);
    b.addEventListener('click', () => {
      mult = b.dataset.m === 'max' ? 'max' : Number(b.dataset.m);
      root.querySelectorAll('.gr-mults button').forEach((x) => x.classList.toggle('active', x === b));
      renderGear(state);
    });
  });
}

export function renderGear(state) {
  // Breakdown POR PEÇA: lista cada afixo LIBERADO (primário flat+% + secundários
  // ativos) com seu valor. Mais detalhado que o agregado por stat.
  const bd = $('gr-breakdown');
  if (bd) {
    // estilo da referência: VALOR + label + "+x per N levels" (verde = camada bônus/multiplier)
    bd.innerHTML = GEAR.pieces.map((def) =>
      affixEntries(def, state.gear[def.key], state).map((e) =>
        `<li class="${e.bonus ? 'bonus' : ''}"><b>${e.val}</b> <span>${e.label}</span><i>${e.per || ''}</i></li>`).join('')
    ).join('');
  }

  for (const def of GEAR.pieces) {
    const slot = document.querySelector(`.gr-slot[data-key="${def.key}"]`);
    if (!slot) continue;
    const piece = state.gear[def.key];
    const rar = rarityName(piece.rarity);
    const capped = atLevelCap(piece, state);
    slot.className = `gr-slot tier-${rar}${capped ? ' capped' : ''}`;

    const art = $(`gr-art-${def.key}`);
    if (art && art.dataset.rar !== rar) {
      art.dataset.rar = rar;
      art.innerHTML = picture(`gear.${def.key}_${rar}`, { alt: def.name });
    }
    $(`gr-lvl-${def.key}`).textContent = `LVL ${formatNumber(piece.level)}`;
    const tip = $(`gr-tip-${def.key}`);
    if (tip) {
      tip.innerHTML = `
        <h4 class="gr-tip-name r-${rar}">${def.name}</h4>
        <div class="gr-tip-sub">${GEAR_RARITY_LABELS[piece.rarity]} ${SLOT_EN[def.slot]} · Lv ${formatNumber(piece.level)}</div>
        <div class="gr-tip-affixes">
          ${affixEntries(def, piece, state).map((e) => e.locked
            ? `<div class="gr-aff locked"><span class="gr-aff-v">🔒</span> <span class="gr-aff-l">${e.label}</span>`
              + `<i class="gr-aff-per">${e.unlock}</i></div>`
            : `<div class="gr-aff ${e.primary ? 'primary' : ''} ${e.bonus ? 'bonus' : ''}">`
              + `<span class="gr-aff-v">${e.val}</span> <span class="gr-aff-l">${e.label}</span>`
              + `<i class="gr-aff-per">${e.per}</i></div>`).join('')}
        </div>`;
    }
    const cost = levelCost(piece);
    const afford = state.lumens >= cost;
    const upBtn = $(`gr-up-${def.key}`);
    upBtn.textContent = capped ? 'Max' : 'Level up';
    upBtn.disabled = capped || !afford;
    const costEl = $(`gr-cost-${def.key}`);
    costEl.innerHTML = capped
      ? `<span class="gr-cost-max">${GEAR_RARITY_LABELS[piece.rarity]} max</span>`
      : `<img class="gr-cost-ic" src="eclats/offline/icons/lumens.png" alt=""><span>${formatNumber(cost)}</span>`;
    slot.classList.toggle('afford', afford && !capped);
    slot.classList.toggle('capped', capped);
  }
}
