// Tela The Forge — redesign A+C: cena full-bleed da forja (Maël) + "Altar da
// Transformação" central com PREVIEW antes→depois do salto de raridade.
// Identidade: rito solene e permanente; o peso vem da atmosfera + do preview.
//
// LIGADA AO MOTOR (src/game/gear.js + economy.js): refino 12:1 (com qty/Max) e
// subir raridade (gate duplo: nível no cap + 40 materiais do tier). Drops já
// caem no combate. Motor intocado — esta tela só consome e mostra.
//
// Contrato: buildForgeView(root, state) monta uma vez; renderForge(state) por tick.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { GEAR, GEAR_RARITIES, GEAR_RARITY_LABELS, CRAFT } from '../data/constants.js';
import {
  canRefino, doRefino, canRarityUp, doRarityUp,
  levelCapFor, atLevelCap, rarityUpTier,
  primaryMult, secondaryMult, critOf, critDmgOf,
} from '../game/gear.js';

// Arte: cena full-bleed + materiais (PNG-only, fora do manifesto auto-gerado).
const SCREEN = 'eclats/forge/forge_screen.webp';
const NAMEPLATE = 'eclats/gear/nameplate.webp';
const MAT_IMG = [
  'eclats/forge/t1_kindled.png',
  'eclats/forge/t2_luminous.png',
  'eclats/forge/t3_radiant.png',
  'eclats/forge/t4_converged.png',
];

const MAT_LABELS = ['Kindled', 'Luminous', 'Radiant', 'Converged'];
const MATS = MAT_LABELS.map((label, i) => ({ key: label.toLowerCase(), label, img: MAT_IMG[i] }));
const RLETTER = ['f', 'k', 'l', 'r', 'c'];      // classe de cor por raridade 0..4
const RAR_COLOR = ['#6b7280', '#c96a2a', '#d9a441', '#f0d9a0', '#aac8ff']; // faded..converged
const matColor = (tier) => RAR_COLOR[tier + 1]; // material tier 0..3 = Kindled..Converged
const MAXR = GEAR_RARITIES.length - 1;          // 4 (Converged)

const AFFIX_LABELS = {
  dmg: 'Damage', hp: 'HP', defesa: 'Defense', crit: 'Crit', critDmg: 'Crit dmg',
  aps: 'Attack speed', regen: 'Regen', bossDmg: 'Boss dmg', lumens: 'Lumens',
  xp: 'XP', materiais: 'Materials', erosao: 'Erosion',
};

const FLAVOR = {
  veil: '"The veil was woven from what remained of a fire. Feed it, and it remembers being flame."',
};

// Trilho: grupo MATERIALS (4 materiais, hover = estoque + usos; refino ao
// selecionar) + grupo GEAR (6 peças, próximo tier + requisito).
const MATERIALS = [0, 1, 2, 3].map((t) => ({
  id: `mat_${t}`, type: 'material', group: 'Materials', tier: t,
  name: MAT_LABELS[t], iconImg: MAT_IMG[t],
}));
const RAISES = GEAR.pieces.map((p) => ({ id: p.key, type: 'rarity', group: 'Gear', key: p.key, name: p.name }));
const RECIPES = [...MATERIALS, ...RAISES];

const $ = (id) => document.getElementById(id);
const fmt = (n) => formatNumber(Math.floor(n || 0));

let selectedId = 'edge';
let refineQty = 1;
let S = null;
let lastSig = '';

// Valor textual de um afixo num nível/raridade (primário ou secundário a 30%).
function affixVal(type, level, rarity, isSec) {
  const w = isSec ? 0.30 : 1;
  if (type === 'crit') return `+${(critOf(level, rarity) * w * 100).toFixed(2)}%`;
  if (type === 'critDmg') return `+${(critDmgOf(level, rarity) * w * 100).toFixed(0)}%`;
  const m = isSec ? secondaryMult(level, rarity) : primaryMult(level, rarity);
  return `×${formatNumber(m)}`;
}

// Linhas de delta antes→depois ao subir R→R+1 (primário + secundários + o NOVO).
function deltaLines(def, level, rar) {
  const lines = [{
    label: AFFIX_LABELS[def.primary],
    before: affixVal(def.primary, level, rar, false),
    after: affixVal(def.primary, level, rar + 1, false),
    isNew: false,
  }];
  for (let i = 0; i < rar; i++) {
    const sec = def.secondary[i];
    lines.push({ label: AFFIX_LABELS[sec], before: affixVal(sec, level, rar, true), after: affixVal(sec, level, rar + 1, true), isNew: false });
  }
  if (def.secondary.length > rar) {
    const sec = def.secondary[rar];
    lines.push({ label: AFFIX_LABELS[sec], before: '—', after: affixVal(sec, level, rar + 1, true), isNew: true });
  }
  return lines;
}

function rarityInfo(state, key) {
  const p = state.gear[key];
  const rar = p.rarity;
  const tier = rarityUpTier(p);
  return {
    def: GEAR.pieces.find((d) => d.key === key), p, rar, tier,
    maxed: rar >= MAXR,
    cap: levelCapFor(p, state),
    atCap: atLevelCap(p, state),
    held: Math.floor(state.materiais[tier] || 0),
    need: CRAFT.rarityUpMaterial,
    ready: canRarityUp(state, key),
  };
}

const maxRefines = (state, tier) => Math.floor((state.materiais[tier] || 0) / CRAFT.refinoRatio);

export function buildForgeView(root, state) {
  S = state;
  root.classList.remove('placeholder');
  root.classList.add('forge');

  const groups = [];
  for (const r of RECIPES) {
    let g = groups.find((x) => x.name === r.group);
    if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
    g.items.push(r);
  }
  const railHTML = groups.map((g) => `
    <div class="fg-rgroup">${g.name}</div>
    ${g.items.map((r) => `
      <button type="button" class="fg-recipe" data-id="${r.id}">
        <span class="fg-ic" id="fg-ic-${r.id}"></span>
        <span class="fg-meta"><span class="fg-nm">${r.name}</span><span class="fg-sub" id="fg-sub-${r.id}"></span></span>
        <span class="fg-st" id="fg-st-${r.id}"></span>
      </button>`).join('')}
  `).join('');

  const matsHTML = MATS.map((m) => `
    <div class="fg-chip ${m.key}" id="fg-chip-${m.key}">
      <div class="fg-th"><img src="${m.img}" alt=""></div>
      <div><b id="fg-mat-${m.key}">0</b><span>${m.label}</span></div>
    </div>`).join('');

  root.innerHTML = `
    <div class="fg-screen"></div>

    <!-- nameplate do Maël (mesma moldura do Lucius) -->
    <div class="fg-mael-id">
      <div class="fg-mael-text">
        <div class="fg-mael-name">Maël</div>
        <div class="fg-mael-title">Blacksmith of the Ordre</div>
      </div>
    </div>

    <!-- materiais -->
    <aside class="fg-mats"><div class="fg-matrow">${matsHTML}</div></aside>

    <!-- altar central (preview antes→depois / refino) -->
    <section class="fg-altar" id="fg-altar"></section>

    <!-- trilho de receitas (direita) -->
    <aside class="fg-rail">
      <div class="fg-tabs">
        <button type="button" class="on">Forge</button>
        <button type="button" class="locked" disabled title="Reserved — coming later">Reliquats</button>
      </div>
      <div class="fg-rlist" id="fg-rlist">${railHTML}</div>
    </aside>
  `;

  $('fg-rlist').addEventListener('click', (e) => {
    const btn = e.target.closest('.fg-recipe');
    if (!btn) return;
    selectedId = btn.dataset.id;
    refineQty = 1;
    lastSig = '';
    if (S) renderForge(S);
  });

  // Ações do altar (delegação): forjar / refinar / stepper qty / max.
  $('fg-altar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled || !S) return;
    const r = RECIPES.find((x) => x.id === selectedId);
    if (!r) return;
    const act = b.dataset.act;
    const ft = r.type === 'material' ? r.tier : -1; // refino CONSOME este material → próximo tier
    if (act === 'qminus') { refineQty = Math.max(1, refineQty - 1); lastSig = ''; }
    else if (act === 'qplus') { refineQty = Math.min(Math.max(1, maxRefines(S, ft)), refineQty + 1); lastSig = ''; }
    else if (act === 'refine') { for (let i = 0; i < refineQty && doRefino(S, ft); i++) { /* */ } refineQty = 1; lastSig = ''; }
    else if (act === 'refineMax') { let g = 1000; while (g-- > 0 && doRefino(S, ft)) { /* */ } refineQty = 1; lastSig = ''; }
    else if (act === 'forge') { doRarityUp(S, r.key); lastSig = ''; }
    renderForge(S);
  });

  renderForge(state);
}

export function renderForge(state) {
  S = state;
  const m = state.materiais || [0, 0, 0, 0];

  MATS.forEach((mat, i) => {
    const el = $(`fg-mat-${mat.key}`);
    if (el) el.textContent = fmt(m[i]);
    const chip = $(`fg-chip-${mat.key}`);
    if (chip) chip.classList.toggle('empty', !(m[i] > 0));
  });

  for (const r of RECIPES) {
    const btn = document.querySelector(`.fg-recipe[data-id="${r.id}"]`);
    if (!btn) continue;
    const stEl = $(`fg-st-${r.id}`), subEl = $(`fg-sub-${r.id}`), icEl = $(`fg-ic-${r.id}`);
    let status, letter, subText;

    if (r.type === 'material') {
      const t = r.tier;
      status = { cls: 'no', text: '' }; // sem status no material (clicar abre o refino)
      letter = RLETTER[t + 1]; // cor da raridade do material
      subText = `${fmt(m[t])} held`; // quantidade em estoque
      if (icEl && !icEl.dataset.done) { icEl.innerHTML = `<img src="${r.iconImg}" alt="">`; icEl.dataset.done = '1'; }
    } else {
      const info = rarityInfo(state, r.key);
      if (info.maxed) { status = { cls: 'no', text: 'Max' }; subText = `${GEAR_RARITY_LABELS[info.rar]} · top`; }
      else {
        if (info.ready) status = { cls: 'ok', text: 'Ready' };
        else if (!info.atCap) status = { cls: 'no', text: `Lv ${fmt(info.p.level)}/${fmt(info.cap)}` };
        else status = { cls: 'no', text: `Need ${fmt(info.need - info.held)}` };
        subText = `${GEAR_RARITY_LABELS[info.rar]} → ${GEAR_RARITY_LABELS[info.rar + 1]}`;
      }
      letter = RLETTER[info.rar];
      const rarName = GEAR_RARITIES[info.rar];
      if (icEl && icEl.dataset.rar !== rarName) { icEl.dataset.rar = rarName; icEl.innerHTML = picture(`gear.${r.key}_${rarName}`, { alt: r.name }); }
    }
    if (subEl) subEl.textContent = subText;
    if (stEl) { stEl.textContent = status.text; stEl.className = `fg-st ${status.cls}`; }
    btn.className = `fg-recipe r-${letter}` + (r.id === selectedId ? ' sel' : '');
  }

  renderAltar(state, m);
}

// Rebuild do altar só quando a assinatura muda (evita flicker das imagens).
function renderAltar(state, m) {
  const r = RECIPES.find((x) => x.id === selectedId) || RECIPES[0];
  let sig;
  if (r.type === 'material') {
    const above = r.tier < 3 ? Math.floor(m[r.tier + 1] || 0) : 0;
    sig = `M|${r.id}|${Math.floor(m[r.tier] || 0)}|${above}|${refineQty}`;
  } else {
    const i = rarityInfo(state, r.key);
    sig = `G|${r.id}|${i.rar}|${i.p.level}|${i.cap}|${i.held}`;
  }
  if (sig === lastSig) return;
  lastSig = sig;
  const altar = $('fg-altar');
  if (!altar) return;
  if (r.type === 'material') altar.innerHTML = r.tier < 3 ? refineAltar(state, r.tier) : materialInfoAltar(state, r.tier);
  else altar.innerHTML = rarityAltar(state, r);
}

// Linha de requisito: ÍCONE real (diz o que é) + barra grande na cor do material
// com a fração sobreposta + selo ✓/✕. Sem label de texto (o ícone já identifica).
function gateRow(ok, icHTML, frac, pct, tone) {
  const fill = `linear-gradient(90deg, color-mix(in srgb, ${tone} 62%, #000), ${tone})`;
  return `
    <div class="fg-gate ${ok ? 'ok' : 'no'}">
      <span class="fg-gic" style="--tint:${tone}">${icHTML}</span>
      <span class="fg-gbar"><i style="width:${Math.min(100, pct)}%; background:${fill}"></i><em>${frac}</em></span>
      <span class="fg-gseal"><img src="eclats/ui/${ok ? 'seal_ok' : 'seal_no'}.webp" alt=""></span>
    </div>`;
}

function rarityAltar(state, r) {
  const info = rarityInfo(state, r.key);
  const rarName = GEAR_RARITIES[info.rar];
  const flavor = FLAVOR[r.key] || '« The light remembers the shape it is given. »';

  if (info.maxed) {
    return `
      <div class="fg-altar-head"><h3>${r.name}</h3>
        <div class="fg-path"><span class="r-${RLETTER[info.rar]}">${GEAR_RARITY_LABELS[info.rar]}</span></div></div>
      <div class="fg-morph solo">
        <div class="fg-piece r-${RLETTER[info.rar]}">${picture(`gear.${r.key}_${rarName}`, { alt: r.name })}</div>
      </div>
      <p class="fg-altar-note">Already at the highest rarity. The light has fully converged.</p>
      <p class="fg-flavor">${flavor}</p>`;
  }

  const nextName = GEAR_RARITIES[info.rar + 1];
  const lines = deltaLines(info.def, info.p.level, info.rar).map((l) => `
    <div class="fg-dl ${l.isNew ? 'new' : ''}">
      <span class="fg-dlk">${l.label}${l.isNew ? ' <em>NEW</em>' : ''}</span>
      <span class="fg-dlb">${l.before}</span><span class="fg-dla">→</span><span class="fg-dlv">${l.after}</span>
    </div>`).join('');

  return `
    <div class="fg-altar-head"><h3>${r.name}</h3>
      <div class="fg-path">
        <span class="r-${RLETTER[info.rar]}">${GEAR_RARITY_LABELS[info.rar]}</span>
        <span class="fg-fa">→</span>
        <span class="r-${RLETTER[info.rar + 1]}">${GEAR_RARITY_LABELS[info.rar + 1]}</span>
      </div></div>

    <div class="fg-preview">
      <div class="fg-morph">
        <div class="fg-piece r-${RLETTER[info.rar]}">${picture(`gear.${r.key}_${rarName}`, { alt: '' })}</div>
        <div class="fg-spark">➜</div>
        <div class="fg-piece next r-${RLETTER[info.rar + 1]}">${picture(`gear.${r.key}_${nextName}`, { alt: '' })}</div>
      </div>
      <div class="fg-delta">${lines}</div>
    </div>

    <div class="fg-gates">
      ${gateRow(info.atCap, picture(`gear.${r.key}_${rarName}`, { alt: '' }), `Lv ${fmt(info.p.level)} / ${fmt(info.cap)}`, (info.p.level / info.cap) * 100, RAR_COLOR[info.rar])}
      ${gateRow(info.held >= info.need, `<img src="${MAT_IMG[info.tier]}" alt="">`, `${fmt(info.held)} / ${info.need}`, (info.held / info.need) * 100, matColor(info.tier))}
    </div>

    <button type="button" class="fg-forgebtn" data-act="forge" ${info.ready ? '' : 'disabled'}>Forge to ${GEAR_RARITY_LABELS[info.rar + 1]}</button>
    <p class="fg-flavor">${flavor}</p>`;
}

function refineAltar(state, fromTier) {
  const from = MAT_LABELS[fromTier], to = MAT_LABELS[fromTier + 1];
  const held = Math.floor(state.materiais[fromTier] || 0);
  const maxN = maxRefines(state, fromTier);
  const qty = Math.min(Math.max(1, refineQty), Math.max(1, maxN));
  const cost = CRAFT.refinoRatio * qty;
  const ok = held >= cost && maxN >= 1;

  return `
    <div class="fg-altar-head"><h3>Refine ${to}</h3>
      <div class="fg-path"><span class="r-${RLETTER[fromTier]}">${from}</span><span class="fg-fa">→</span><span class="r-${RLETTER[fromTier + 1]}">${to}</span></div></div>

    <div class="fg-morph mat">
      <div class="fg-mpiece">
        <div class="fg-mbox r-${RLETTER[fromTier + 1]}"><img src="${MAT_IMG[fromTier]}" alt=""></div>
        <b>${CRAFT.refinoRatio * qty}</b>
      </div>
      <div class="fg-spark">➜</div>
      <div class="fg-mpiece">
        <div class="fg-mbox r-${RLETTER[fromTier + 2]}"><img src="${MAT_IMG[fromTier + 1]}" alt=""></div>
        <b>${qty}</b>
      </div>
    </div>

    <div class="fg-qty">
      <button type="button" data-act="qminus" ${qty <= 1 ? 'disabled' : ''}>−</button>
      <span class="fg-qn">${qty}</span>
      <button type="button" data-act="qplus" ${qty >= maxN ? 'disabled' : ''}>+</button>
      <button type="button" class="fg-maxq" data-act="refineMax" ${maxN < 1 ? 'disabled' : ''}>Max (${maxN})</button>
    </div>

    <div class="fg-gates">
      ${gateRow(ok, `<img src="${MAT_IMG[fromTier]}" alt="">`, `${fmt(held)} / ${cost}`, (held / cost) * 100, matColor(fromTier))}
    </div>

    <button type="button" class="fg-forgebtn" data-act="refine" ${ok ? '' : 'disabled'}>Refine ${qty} ${to}</button>`;
}

// Altar do material do TOPO (Converged): não há tier acima pra converter.
function materialInfoAltar(state, t) {
  const held = Math.floor(state.materiais[t] || 0);
  return `
    <div class="fg-altar-head"><h3>${MAT_LABELS[t]}</h3>
      <div class="fg-path"><span class="r-${RLETTER[t + 1]}">Highest material</span></div></div>

    <div class="fg-morph mat">
      <div class="fg-mpiece big">
        <div class="fg-mbox r-${RLETTER[t + 1]}"><img src="${MAT_IMG[t]}" alt=""></div>
        <b>${fmt(held)}</b>
      </div>
    </div>`;
}
