// Tela de Gear (pós-MVP) — 6 peças fixas, cada uma com nível + raridade,
// upadas com Lumens. ⏳ valores PROVISÓRIOS (ver GEAR em constants.js).
// Layout: resumo dos afixos à esquerda · grade de 6 slots no centro ·
// detalhe + controles (multiplicadores x1..MAX, upar, subir raridade) à direita.
//
// Contrato: buildGearView(root, state) monta o DOM; renderGear(state) atualiza.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { GEAR, GEAR_RARITIES, GEAR_RARITY_LABELS, CRAFT } from '../data/constants.js';
import {
  primaryMult, secondaryMult, critOf, critDmgOf, activeSecondaries, levelCapFor,
  levelCost, atLevelCap, rarityUpCost, rarityUpTier, canRarityUp,
  buyLevels, doRarityUp, canRefino, doRefino, gearDamageMult, gearHpMult, gearLumensMult, gearCritAdd,
  gearDefesaMult, gearApsMult,
} from '../game/gear.js';

// Rótulos dos tiers de material (§13B): materiais[r] paga a raridade r→r+1
const MAT_LABELS = ['T1 · Kindled', 'T2 · Luminous', 'T3 · Radiant', 'T4 · Converged'];
const MAT_SHORT = ['T1', 'T2', 'T3', 'T4'];

const $ = (id) => document.getElementById(id);
const pieceDef = (key) => GEAR.pieces.find((p) => p.key === key);
const rarityName = (r) => GEAR_RARITIES[r];

// Rótulos dos tipos de afixo do pool (§10.5.5)
const AFFIX_LABELS = {
  dmg: 'dano', hp: 'HP', defesa: 'defesa', crit: 'crit', critDmg: 'crit dmg',
  aps: 'APS', regen: 'regen', bossDmg: 'dano boss', lumens: 'Lumens', xp: 'XP',
  materiais: 'materiais', erosao: 'erosão',
};
// Descrição de UM afixo (primário ou secundário a 30%)
function affixDesc(type, level, rarity, isSec) {
  const w = isSec ? 0.30 : 1;
  if (type === 'crit') return `+${(critOf(level, rarity) * w * 100).toFixed(2)}% crit`;
  if (type === 'critDmg') return `+${(critDmgOf(level, rarity) * w * 100).toFixed(0)}% crit dmg`;
  const m = isSec ? secondaryMult(level, rarity) : primaryMult(level, rarity);
  return `×${formatNumber(m)} ${AFFIX_LABELS[type]}`;
}
// Efeito de uma peça = primário + secundários ATIVOS (destravados pela raridade)
function affixText(def, piece) {
  const parts = [affixDesc(def.primary, piece.level, piece.rarity, false)];
  for (const sec of activeSecondaries(def, piece.rarity)) {
    parts.push(affixDesc(sec, piece.level, piece.rarity, true));
  }
  return parts.join(' · ');
}

const MULTS = [1, 10, 100, 1000];
let selectedKey = 'edge';
let mult = 10;

export function buildGearView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('gear');
  root.innerHTML = `
    <aside class="gr-summary">
      <h3>Afixos ativos</h3>
      <dl class="gr-totals">
        <div><dt>Dano</dt><dd id="gr-t-dmg">×1</dd></div>
        <div><dt>HP</dt><dd id="gr-t-hp">×1</dd></div>
        <div><dt>Defesa</dt><dd id="gr-t-defesa">×1</dd></div>
        <div><dt>Crit</dt><dd id="gr-t-crit">+0%</dd></div>
        <div><dt>APS</dt><dd id="gr-t-aps">×1</dd></div>
        <div><dt>Lumens</dt><dd id="gr-t-lumens">×1</dd></div>
      </dl>
      <p class="gr-note">⏳ Valores provisórios — recalibram na malha v2.</p>

      <h3 class="gr-forja-h">Forja — Materiais</h3>
      <dl class="gr-mats" id="gr-mats"></dl>
      <div class="gr-refino" id="gr-refino">
        ${[0, 1, 2].map((t) => `<button type="button" class="gr-ref" data-t="${t}">Refinar 12 ${MAT_SHORT[t]} → 1 ${MAT_SHORT[t + 1]}</button>`).join('')}
      </div>
    </aside>

    <div class="gr-slots" id="gr-slots"></div>

    <aside class="gr-detail" id="gr-detail"></aside>
  `;

  const slots = $('gr-slots');
  for (const def of GEAR.pieces) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'gr-slot';
    slot.dataset.key = def.key;
    slot.innerHTML = `
      <span class="gr-art"></span>
      <span class="gr-lvl"></span>
      <span class="gr-pname">${def.name}</span>
      <span class="gr-prar"></span>
    `;
    slot.addEventListener('click', () => selectPiece(state, def.key));
    slots.appendChild(slot);
  }

  // Refino (§13B): 12 Tn → 1 Tn+1
  $('gr-refino').querySelectorAll('.gr-ref').forEach((b) =>
    b.addEventListener('click', () => doRefino(state, Number(b.dataset.t))));

  selectPiece(state, selectedKey);
}

// (Re)constrói o painel de detalhe ao trocar de peça (controles + listeners)
function selectPiece(state, key) {
  selectedKey = key;
  const def = pieceDef(key);
  const detail = $('gr-detail');
  detail.innerHTML = `
    <div class="gr-d-art" id="gr-d-art"></div>
    <h2 id="gr-d-name">${def.name}</h2>
    <div class="gr-d-slot">${def.slot} · <b id="gr-d-rar"></b></div>
    <div class="gr-d-bar"><i id="gr-d-fill"></i><span id="gr-d-lvl"></span></div>
    <dl class="gr-d-facts">
      <div><dt>Efeito</dt><dd id="gr-d-eff"></dd></div>
      <div><dt>Próximo nível</dt><dd id="gr-d-next"></dd></div>
    </dl>
    <div class="gr-mults" id="gr-mults">
      ${MULTS.map((m) => `<button type="button" data-m="${m}">×${m}</button>`).join('')}
      <button type="button" data-m="max">MAX</button>
    </div>
    <button type="button" class="gr-up" id="gr-up">Upar nível</button>
    <button type="button" class="gr-rarity" id="gr-rarity">Subir raridade</button>
    <p class="gr-d-lore">« Afixo fixo da peça — efeito final aguarda cânon. »</p>
  `;
  // multiplicadores
  detail.querySelectorAll('.gr-mults button').forEach((b) => {
    b.classList.toggle('active', String(mult) === b.dataset.m);
    b.addEventListener('click', () => {
      mult = b.dataset.m === 'max' ? 'max' : Number(b.dataset.m);
      detail.querySelectorAll('.gr-mults button').forEach((x) => x.classList.toggle('active', x === b));
      updateDetail(state);
    });
  });
  $('gr-up').addEventListener('click', () => {
    buyLevels(state, selectedKey, mult === 'max' ? 1e9 : mult);
  });
  $('gr-rarity').addEventListener('click', () => doRarityUp(state, selectedKey));

  document.querySelectorAll('.gr-slot').forEach((el) =>
    el.classList.toggle('selected', el.dataset.key === key));
  updateDetail(state);
}

export function renderGear(state) {
  // Resumo
  $('gr-t-dmg').textContent = `×${formatNumber(gearDamageMult(state))}`;
  $('gr-t-hp').textContent = `×${formatNumber(gearHpMult(state))}`;
  $('gr-t-defesa').textContent = `×${formatNumber(gearDefesaMult(state))}`;
  $('gr-t-crit').textContent = `+${(gearCritAdd(state) * 100).toFixed(2)}%`;
  $('gr-t-aps').textContent = `×${formatNumber(gearApsMult(state))}`;
  $('gr-t-lumens').textContent = `×${formatNumber(gearLumensMult(state))}`;

  // Forja — materiais T1-T4 + estado dos botões de refino
  $('gr-mats').innerHTML = MAT_LABELS.map((lbl, i) =>
    `<div><dt>${lbl}</dt><dd>${formatNumber(Math.floor(state.materiais[i]))}</dd></div>`).join('');
  $('gr-refino').querySelectorAll('.gr-ref').forEach((b) => {
    b.disabled = !canRefino(state, Number(b.dataset.t));
  });

  // Slots
  for (const def of GEAR.pieces) {
    const slot = document.querySelector(`.gr-slot[data-key="${def.key}"]`);
    if (!slot) continue;
    const piece = state.gear[def.key];
    const rar = rarityName(piece.rarity);
    slot.className = `gr-slot r-${rar}` + (def.key === selectedKey ? ' selected' : '');
    const art = slot.querySelector('.gr-art');
    if (art.dataset.rar !== rar) {
      art.dataset.rar = rar;
      art.innerHTML = picture(`gear.${def.key}_${rar}`, { alt: def.name });
    }
    slot.querySelector('.gr-lvl').textContent = `Lv ${piece.level}`;
    slot.querySelector('.gr-prar').textContent = GEAR_RARITY_LABELS[piece.rarity];
  }

  updateDetail(state);
}

// Atualiza só os números do painel de detalhe (sem reconstruir/relistar)
function updateDetail(state) {
  if (!$('gr-detail') || !$('gr-d-name')) return;
  const def = pieceDef(selectedKey);
  const piece = state.gear[selectedKey];
  const rar = rarityName(piece.rarity);
  const capped = atLevelCap(piece, state);

  const art = $('gr-d-art');
  if (art.dataset.rar !== rar) {
    art.dataset.rar = rar;
    art.innerHTML = picture(`gear.${def.key}_${rar}`, { alt: def.name });
  }
  const rarEl = $('gr-d-rar');
  rarEl.textContent = GEAR_RARITY_LABELS[piece.rarity];
  rarEl.className = `r-${rar}`;

  const cap = levelCapFor(piece, state);
  $('gr-d-fill').style.width = `${(piece.level / cap) * 100}%`;
  $('gr-d-lvl').textContent = `Nível ${piece.level} / ${cap}`;
  $('gr-d-eff').textContent = affixText(def, piece);
  $('gr-d-next').textContent = capped ? '— no máximo desta raridade' : `${formatNumber(levelCost(piece))} Lumens`;

  const up = $('gr-up');
  up.disabled = capped || state.lumens < levelCost(piece);
  up.textContent = capped ? 'Nível máximo' : `Upar ${mult === 'max' ? 'MAX' : '×' + mult}`;

  const rb = $('gr-rarity');
  const top = piece.rarity >= GEAR_RARITIES.length - 1;
  rb.hidden = false;
  if (top) { rb.disabled = true; rb.textContent = 'Raridade máxima'; }
  else {
    rb.disabled = !canRarityUp(state, selectedKey);
    const tier = rarityUpTier(piece);
    rb.textContent = capped
      ? `Subir raridade (${CRAFT.rarityUpMaterial} ${MAT_SHORT[tier]})`
      : 'Maximize o nível para subir raridade';
  }
}
