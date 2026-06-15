// Aba AWAKENING da tela Seeker — a "mudança de classe" (estilo Grand Chase).
// Formato Gear/Forge: cena full-bleed (câmara de despertar) + resumo (esq) +
// palco central com o CARD do tier + trilha dos 5 tiers (dir).
// Gate = CHECKLIST (§8 redesign 14/jun): Nível + Material T1 + Oferenda (Nitzotzot)
// + Tributo (Vestiges), lógica E. Botão "Awaken" → doDespertar + cerimônia (splash).
//
// Contrato: buildAwakenPane(root, state) monta uma vez; renderAwakenPane(state) por tick.

import './awaken.css';
import { formatNumber } from '../core/format.js';
import { picture, url } from '../data/assets.js';
import { SEEKER_RANKS, DESPERTAR } from '../data/constants.js';
import {
  despertarTier, despertarMult, despertarRequirements,
  canDespertar, doDespertar,
} from '../game/ascension.js';
import { damagePerHit, playerHpMax } from '../game/stats.js';

const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const roman = (n) => ROMAN[n] || String(n + 1);

// Arte por índice de tier (0..4)
const cardId = (t) => `seeker.card_t${t + 1}`;
const splashSrc = (t) => `eclats/awakening/splash_t${t + 1}.webp`; // fora do manifesto
const tierPower = (t) => DESPERTAR.mult ** t;

let selectedTier = null; // tier em preview no palco (default = atual)
let lastHeroSig = '';    // evita reconstruir o card (e recarregar a img) a cada tick

// Verdade do mundo revelada a cada despertar (índice = tier alcançado 1..4).
// Escala da inocência à verdade sombria (a Ordre serve ao Nada; só a Semente converge).
const RITE_LORE = [
  '',
  'In every other vessel the light sleeps caged. In you, it answered.',
  'The Order names what it cannot do. In you, the scattered fragments remember each other.',
  'Every Éclat they gather is a light caged to die slowly. You are the only place it converges instead.',
  "The Ordre des Éclairés is the Void's quiet furnace. You are its single repair. Tikkun Olam begins in you.",
];

function tierState(t, cur) {
  if (t < cur) return 'awakened';
  if (t === cur) return 'current';
  if (t === cur + 1) return 'next';
  return 'locked';
}

// Barra de gate (label + fração sobreposta + estado ok)
function gateRow(label, ok, frac, pct) {
  return `
    <div class="awk-gate ${ok ? 'ok' : ''}">
      <span class="awk-glabel">${label}</span>
      <span class="awk-bar"><i style="width:${Math.min(100, Math.max(0, pct))}%"></i><em>${frac}</em></span>
    </div>`;
}

export function buildAwakenPane(root, state) {
  root.classList.add('awaken');
  root.innerHTML = `
    <div class="awk-screen"></div>

    <aside class="awk-summary">
      <h3>Awakening</h3>
      <div class="awk-now">
        <div class="awk-now-rank" id="awk-now-rank">Seeker</div>
        <div class="awk-now-tier" id="awk-now-tier">Tier I of V</div>
      </div>
      <dl class="awk-totals">
        <div><dt>Damage</dt><dd id="awk-t-dmg">×1</dd></div>
        <div><dt>Vitality</dt><dd id="awk-t-hp">×1</dd></div>
        <div><dt>Nitzotzot</dt><dd id="awk-t-nitz">0</dd></div>
      </dl>
      <p class="awk-note">Awakening is the Seeker's change of class — gathering the
        scattered light (Nitzotzot) to converge to a new threshold. Its power is
        permanent: it survives every reset, Ascension included.</p>
    </aside>

    <section class="awk-stage" id="awk-stage"></section>

    <aside class="awk-rail">
      <div class="awk-rail-head">The Five Tiers</div>
      <div class="awk-rlist" id="awk-rlist"></div>
    </aside>

    <!-- cerimônia absorvida (overlay dentro do palco) -->
    <div class="awk-rite" id="awk-rite" hidden></div>
  `;

  const rlist = $('awk-rlist');
  SEEKER_RANKS.forEach((rank, t) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'awk-tier';
    row.dataset.tier = t;
    row.innerHTML = `
      <span class="awk-th">${picture(cardId(t), { alt: rank.name })}</span>
      <span class="awk-meta">
        <span class="awk-nm">${rank.name}</span>
        <span class="awk-sub">Tier ${roman(t)}</span>
      </span>
      <span class="awk-st" id="awk-st-${t}"></span>`;
    row.addEventListener('click', () => { selectedTier = t; renderAwakenPane(state); });
    rlist.appendChild(row);
  });

  // Delegação no palco (estável): o botão Awaken é reconstruído, o listener não.
  $('awk-stage').addEventListener('click', (e) => {
    const b = e.target.closest('#awk-do');
    if (!b || b.disabled) return;
    if (doDespertar(state)) {
      selectedTier = despertarTier(state);
      lastHeroSig = ''; // força rebuild do card pro novo tier
      playRite(despertarTier(state));
    }
    renderAwakenPane(state);
  });

  renderAwakenPane(state);
}

export function renderAwakenPane(state) {
  const cur = despertarTier(state);
  if (selectedTier == null) selectedTier = cur;

  // Resumo (esquerda) — tier ATUAL + estoque de Nitzotzot
  $('awk-now-rank').textContent = SEEKER_RANKS[cur].name;
  $('awk-now-tier').textContent = `Tier ${roman(cur)} of V`;
  const power = `×${formatNumber(despertarMult(state))}`;
  $('awk-t-dmg').textContent = power;
  $('awk-t-hp').textContent = power;
  $('awk-t-nitz').textContent = formatNumber(Math.floor(state.nitzotzot || 0));

  // Trilha (direita) — estado por tier + seleção
  SEEKER_RANKS.forEach((rank, t) => {
    const row = document.querySelector(`.awk-tier[data-tier="${t}"]`);
    if (!row) return;
    const st = tierState(t, cur);
    row.className = `awk-tier s-${st}` + (t === selectedTier ? ' sel' : '');
    const stEl = $(`awk-st-${t}`);
    if (stEl) {
      stEl.textContent = st === 'awakened' ? '✓'
        : st === 'current' ? 'Current'
        : st === 'next' ? 'Next' : 'Locked';
    }
  });

  renderStage(state, cur);
}

// Esqueleto do rodapé por estado (montado 1× por tier; o BOTÃO é estável).
function footSkeleton(t, st) {
  if (st === 'awakened') {
    return `<div class="awk-foot ok"><span class="awk-badge">✓ Awakened</span>
      <p class="awk-flavor">The light has already taken this shape in you.</p></div>`;
  }
  if (st === 'current') {
    return `<div class="awk-foot cur"><span class="awk-badge">Current standing</span>
      <p class="awk-flavor">"He carries the light, he is not the light yet."</p></div>`;
  }
  if (st === 'next') {
    return `
      <div class="awk-foot next">
        <div class="awk-gains" id="awk-gains"></div>
        <div class="awk-gates" id="awk-gates"></div>
        <button type="button" class="awk-btn" id="awk-do">Awaken to ${SEEKER_RANKS[t].name}</button>
      </div>`;
  }
  return `<div class="awk-foot locked"><span class="awk-badge">Locked</span>
    <p class="awk-req">Awaken <b>${SEEKER_RANKS[t - 1].name}</b> first.</p></div>`;
}

// Rótulos de exibição da checklist (por chave de requisito de despertarRequirements).
const GATE_LABEL = {
  level: 'Threshold · Level',
  material: 'Materials · Tier I',
  nitzotz: 'Offering · Nitzotzot',
  vestiges: 'Tribute · Vestiges',
};

// Atualiza só os VALORES do rodapé 'next' por tick (sem recriar o botão).
function updateNextFoot(state) {
  const dmgB = damagePerHit(state), hpB = playerHpMax(state), m = DESPERTAR.mult;
  const gains = $('awk-gains');
  if (gains) {
    gains.innerHTML = `
      <div><span>Damage</span><b>${formatNumber(dmgB)} <i>→</i> ${formatNumber(dmgB * m)}</b></div>
      <div><span>HP Max</span><b>${formatNumber(hpB)} <i>→</i> ${formatNumber(hpB * m)}</b></div>`;
  }
  const gates = $('awk-gates');
  if (gates) {
    gates.innerHTML = despertarRequirements(state).map((g) =>
      gateRow(GATE_LABEL[g.key] || g.label, g.ok,
        `${formatNumber(g.have)} / ${formatNumber(g.need)}`,
        g.need > 0 ? (g.have / g.need) * 100 : 100)
    ).join('');
  }
  const btn = $('awk-do');
  if (btn) btn.disabled = !canDespertar(state);
}

// Palco central — card + rodapé estável (cacheados por tier) + valores por tick.
function renderStage(state, cur) {
  const t = selectedTier;
  const rank = SEEKER_RANKS[t];
  const st = tierState(t, cur);
  const stage = $('awk-stage');
  if (!stage) return;

  const heroSig = `${t}|${st}`;
  if (lastHeroSig !== heroSig) {
    lastHeroSig = heroSig;
    stage.className = `awk-stage s-${st}`;
    stage.innerHTML = `
      <div class="awk-hero">
        <div class="awk-hero-art">${picture(cardId(t), { alt: rank.name })}</div>
      </div>
      <div class="awk-hero-id">
        <h2 class="awk-hero-name">${rank.name}</h2>
        <div class="awk-hero-tier">Tier ${roman(t)} of V · <b>×${formatNumber(tierPower(t))}</b> power</div>
      </div>
      ${footSkeleton(t, st)}`;
  }
  if (st === 'next') updateNextFoot(state); // só valores; botão permanece estável
}

// Cerimônia absorvida — splash do tier + revelação do novo rank.
function playRite(tier) {
  const rite = $('awk-rite');
  if (!rite) return;
  const rank = SEEKER_RANKS[tier];
  // splash do tier; se não existir ainda, cai pro CARD daquele tier (centro nunca vazio)
  const fallback = url(cardId(tier));
  rite.innerHTML = `
    <div class="awk-rite-veil"></div>
    <div class="awk-rite-inner">
      <img class="awk-rite-splash" src="${splashSrc(tier)}" alt=""
           onerror="this.onerror=null;this.src='${fallback}'">
      <div class="awk-rite-text">
        <p class="awk-rite-lore">${RITE_LORE[tier] || 'The light within you converges.'}</p>
        <h1>${rank.name.toUpperCase()}</h1>
        <div class="awk-rite-sub">You awaken · Tier ${roman(tier)} of V · ×${formatNumber(DESPERTAR.mult ** tier)} power</div>
        <button type="button" class="awk-rite-close" id="awk-rite-close">Continue</button>
      </div>
    </div>`;
  rite.hidden = false;
  requestAnimationFrame(() => rite.classList.add('show'));
  $('awk-rite-close').addEventListener('click', () => {
    rite.classList.remove('show');
    rite.hidden = true;
  }, { once: true });
}
