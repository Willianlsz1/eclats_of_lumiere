// Tela do Player / Seeker (U-4) — retrato + vitais à esquerda; à direita os
// painéis de Combate, Economia, Gold Stats e Convergence. Restaura os controles
// de interação que o U-1 tirou da casca: comprar Gold Stats (gasta Lumens) e
// Convergir (quando a parede de XP enche).
//
// Contrato: buildPlayerView(root, state) monta o DOM uma vez;
//           renderPlayer(state) atualiza a cada exibição.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import {
  heroLevel, dps, playerHpMax, currentAPS, critChance, critDamageMult,
  convFactor, damagePerHit, strTotal, vitTotal, frtTotal, wisTotal,
  statCostNext, buyStat, buyStatMax,
} from '../game/stats.js';
import { xpWall, canConverge, runPoints, doConverge } from '../game/convergence.js';
import { currentRank, seekerFrame, seekerPortrait } from '../game/ascension.js';

const $ = (id) => document.getElementById(id);

// Os 6 Gold Stats (§5) — rótulo + efeito derivado do state
const STAT_DEFS = [
  { key: 'str', label: 'STR', effect: (s) => `×${formatNumber(strTotal(s))} dano` },
  { key: 'vit', label: 'VIT', effect: (s) => `×${formatNumber(vitTotal(s))} HP` },
  { key: 'agi', label: 'AGI', effect: (s) => `${currentAPS(s).toFixed(2)} APS` },
  { key: 'lck', label: 'LCK', effect: (s) => `${(critChance(s) * 100).toFixed(1)}% crit` },
  { key: 'frt', label: 'FRT', effect: (s) => `×${formatNumber(frtTotal(s))} Lumens` },
  { key: 'wis', label: 'WIS', effect: (s) => `×${formatNumber(wisTotal(s))} XP` },
];

// Árvores pós-MVP — leitura placeholder (sempre 0/15 no MVP). TODO(canon).
const TREES = [
  { name: 'Éclat',       cls: 't-eclat' },
  { name: 'Vestige',     cls: 't-vest' },
  { name: 'Fracture',    cls: 't-frac' },
  { name: 'Convergence', cls: 't-gold' },
];

export function buildPlayerView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('player');
  root.innerHTML = `
    <aside class="pl-hero">
      <div class="pl-portrait">
        ${picture('seeker.t1', { alt: 'The Seeker' })}
        ${picture('frames.tier1', { className: 'pl-frame', alt: '' })}
      </div>
      <h2 class="pl-name">The Seeker</h2>
      <div class="pl-tier" id="pl-tier">Ordre des Veilleurs · Tier I</div>
      <p class="pl-lore">« Ele carrega a luz — ainda não é a luz. »</p>

      <div class="pl-vital">
        <span class="pl-vital-lbl">Nível <b id="pl-level">1</b></span>
        <div class="pl-bar hp"><i id="pl-hp-fill"></i><span id="pl-hp-text">—</span></div>
      </div>
      <div class="pl-vital">
        <span class="pl-vital-lbl">Parede de Convergence</span>
        <div class="pl-bar xp"><i id="pl-xp-fill"></i><span id="pl-xp-text">—</span></div>
      </div>
    </aside>

    <div class="pl-panels">
      <section class="pl-panel">
        <h3>Combate</h3>
        <dl class="pl-stats-grid">
          <div><dt>Dano/hit</dt><dd id="pl-dmg">0</dd></div>
          <div><dt>DPS</dt><dd id="pl-dps">0</dd></div>
          <div><dt>APS</dt><dd id="pl-aps">0</dd></div>
          <div><dt>Crit</dt><dd id="pl-crit">0%</dd></div>
          <div><dt>HP máx</dt><dd id="pl-hpmax">0</dd></div>
        </dl>
      </section>

      <section class="pl-panel">
        <h3>Economia</h3>
        <dl class="pl-stats-grid">
          <div><dt>Lumens</dt><dd id="pl-lumens" class="t-gold">0</dd></div>
          <div><dt>FRT · Lumens</dt><dd id="pl-frt">×1</dd></div>
          <div><dt>WIS · XP</dt><dd id="pl-wis">×1</dd></div>
        </dl>
      </section>

      <section class="pl-panel pl-goldstats">
        <h3>Gold Stats <span class="pl-sub">— gaste Lumens para evoluir</span></h3>
        <div class="pl-rows" id="pl-rows"></div>
      </section>

      <section class="pl-panel pl-convergence">
        <h3>Convergence</h3>
        <dl class="pl-stats-grid">
          <div><dt>Convergências</dt><dd id="pl-conv-count" class="t-eclat">0</dd></div>
          <div><dt>Pontos</dt><dd id="pl-conv-points" class="t-eclat">0</dd></div>
          <div><dt>Fator</dt><dd id="pl-conv-factor">×1.00</dd></div>
        </dl>
        <div class="pl-bar wall"><i id="pl-wall-fill"></i><span id="pl-wall-text">—</span></div>
        <button type="button" class="pl-converge" id="pl-converge">Convergir</button>
      </section>

      <section class="pl-panel pl-trees">
        <h3>Árvores <span class="pl-sub">— pós-MVP</span></h3>
        <div class="pl-trees-row">
          ${TREES.map((t) => `<div class="pl-tree"><b class="${t.cls}">${t.name}</b><span>0 / 15</span></div>`).join('')}
        </div>
      </section>
    </div>
  `;

  // Linhas dos Gold Stats (construídas uma vez; atualizadas no render)
  const rows = $('pl-rows');
  for (const def of STAT_DEFS) {
    const row = document.createElement('div');
    row.className = 'pl-row';
    row.innerHTML = `
      <span class="pl-s-label">${def.label} <b class="pl-s-level"></b></span>
      <span class="pl-s-effect"></span>
      <button type="button" class="pl-s-buy"></button>
      <button type="button" class="pl-s-max">Max</button>
    `;
    row.querySelector('.pl-s-buy').addEventListener('click', () => buyStat(state, def.key));
    row.querySelector('.pl-s-max').addEventListener('click', () => buyStatMax(state, def.key));
    rows.appendChild(row);
  }

  $('pl-converge').addEventListener('click', () => doConverge(state));
}

export function renderPlayer(state) {
  const hpMax = playerHpMax(state);
  const rank = currentRank(state);

  // Vitais
  $('pl-tier').textContent = `${rank.name} · Tier ${rank.tier}`;
  // retrato + moldura conforme o tier (só trocam quando mudam)
  const port = document.querySelector('#view-player .pl-portrait');
  if (port) {
    const portraitId = seekerPortrait(state);
    if (port.dataset.portrait !== portraitId) {
      port.dataset.portrait = portraitId;
      const img = port.querySelector('picture:not(.pl-frame)');
      if (img) img.outerHTML = picture(portraitId, { alt: 'The Seeker' });
    }
    const frameId = seekerFrame(state);
    if (port.dataset.frame !== frameId) {
      port.dataset.frame = frameId;
      const old = port.querySelector('.pl-frame');
      if (old) old.remove();
      port.insertAdjacentHTML('beforeend', picture(frameId, { className: 'pl-frame', alt: '' }));
    }
  }
  $('pl-level').textContent = formatNumber(heroLevel(state.xpTotal));
  $('pl-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('pl-hp-text').textContent = `${formatNumber(Math.max(0, state.player.hp))} / ${formatNumber(hpMax)}`;

  // Parede de Convergence (mesma barra em dois lugares: vital + painel)
  const wall = xpWall(state.convergences);
  const pct = Math.min(100, (state.xpRun / wall) * 100);
  const wallText = `${formatNumber(state.xpRun)} / ${formatNumber(wall)} XP`;
  $('pl-xp-fill').style.width = `${pct}%`;
  $('pl-xp-text').textContent = wallText;
  $('pl-wall-fill').style.width = `${pct}%`;
  $('pl-wall-text').textContent = wallText;

  // Combate
  $('pl-dmg').textContent = formatNumber(damagePerHit(state));
  $('pl-dps').textContent = formatNumber(dps(state));
  $('pl-aps').textContent = currentAPS(state).toFixed(2);
  $('pl-crit').textContent = `${(critChance(state) * 100).toFixed(1)}% ×${critDamageMult(state).toFixed(2)}`;
  $('pl-hpmax').textContent = formatNumber(hpMax);

  // Economia
  $('pl-lumens').textContent = formatNumber(state.lumens);
  $('pl-frt').textContent = `×${formatNumber(frtTotal(state))}`;
  $('pl-wis').textContent = `×${formatNumber(wisTotal(state))}`;

  // Gold Stats
  const rows = $('pl-rows').children;
  STAT_DEFS.forEach((def, i) => {
    const row = rows[i];
    const level = state.stats[def.key];
    const cost = statCostNext(level);
    const afford = state.lumens >= cost;
    row.querySelector('.pl-s-level').textContent = `Lv ${formatNumber(level)}`;
    row.querySelector('.pl-s-effect').textContent = def.effect(state);
    const buy = row.querySelector('.pl-s-buy');
    buy.textContent = `+1 (${formatNumber(cost)})`;
    buy.disabled = !afford;
    row.querySelector('.pl-s-max').disabled = !afford;
  });

  // Convergence
  $('pl-conv-count').textContent = formatNumber(state.convergences);
  $('pl-conv-points').textContent = formatNumber(state.convPoints);
  $('pl-conv-factor').textContent = `×${convFactor(state).toFixed(2)}`;
  const ready = canConverge(state);
  const btn = $('pl-converge');
  btn.disabled = !ready;
  btn.classList.toggle('ready', ready);
  btn.textContent = ready
    ? `Convergir · +${formatNumber(runPoints(state))} pontos`
    : `Convergir · parede em ${pct.toFixed(0)}%`;
}
