// Tela de Combate (U-2) — liga o motor real (combatTick) à cena do mockup.
// Card do Seeker à esquerda; pack de inimigos espalhado à direita; alvo atual
// com borda dourada; números de dano flutuantes; HUD no rodapé + setas de
// navegação entre sub-áreas (respeitando o gate do boss).
//
// Contrato: buildCombatView(root, state) monta o DOM uma vez;
//           renderCombat(state) atualiza a cada tick.
// Lê o state REAL: state.enemies, state.fx, state.player, stats derivados.

import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { heroLevel, playerHpMax, currentAPS } from '../game/stats.js';
import { changeSubarea } from '../game/combat.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { currentRank } from '../game/ascension.js';

// tier romano → número do card (seeker.card_tN)
const TIER_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const $ = (id) => document.getElementById(id);

// A arte de cada inimigo/boss vem do mapa (mob.art, definido em enemies.js a
// partir de MAPS em constants). Fallback caso falte.
const ENEMY_ART_FALLBACK = 'enemies.map1.deer_spirit';

// Pontos de spawn fixos dentro da arena (%) — pack ≤ 8 (packSizes do GDD),
// então renderizamos todos, sem badge "+N".
// Grade 4×2 com espaçamento horizontal de 17% (≥217px no palco mais estreito,
// 1280) e cards de 190px (285 de altura) — NUNCA há sobreposição entre mobs.
// Verticalmente a arena útil (topbar→HUD, ~100..988px) comporta exatamente
// 3 bandas de 285px com ~17px de folga: linha de cima (y 22.5%), faixa
// exclusiva do boss no meio (y 50.5%) e linha de baixo (y 78%).
// Packs grandes (9..12, GDD packSizes=[2,4,6,9,12]) usam grade 6×2 com cards
// menores (140px) — TODOS os mobs do pack aparecem, nunca menos.
const GRID_COLS_4 = [30, 47, 64, 81];                      // espaçamento 17%
const GRID_COLS_6 = [28, 39.6, 51.2, 62.8, 74.4, 86];      // espaçamento 11.6%
const BOSS_POINT = { x: 55, y: 50.5 };

// Posição do i-ésimo mob num pack de `total` (linha de cima → linha de baixo).
// Sem boss em cena: 2 fileiras altas (cards grandes, y 30/70.5). Com boss: as
// fileiras abrem a faixa do meio pra ele (y 22.5/78) e os cards encolhem.
function spawnPos(i, total, bossOut) {
  const cols = total > 8 ? GRID_COLS_6 : GRID_COLS_4;
  const top = i < cols.length;
  const y = bossOut ? (top ? 22.5 : 78) : (top ? 30 : 70.5);
  return { x: cols[i % cols.length], y };
}

// Janela de suavização das taxas do HUD (EMA simples)
let rates = null;

// Troca o retrato e a moldura do Seeker conforme o tier (só quando muda)
function updateSeekerCard(seekerEl, cardId) {
  const art = seekerEl.querySelector('.scard-art');
  if (!art) return;
  if (seekerEl.dataset.card !== cardId) {
    seekerEl.dataset.card = cardId;
    art.innerHTML = picture(cardId, { className: 'scard-art-img', alt: 'The Seeker' });
  }
  // imagens absolutas não disparam lazy-load — força carregamento imediato
  seekerEl.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
}

export function buildCombatView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('combat');
  root.innerHTML = `
    <div class="cb-backdrop" id="cb-backdrop"></div>

    <aside class="cb-seeker scard" id="cb-seeker">
      <div class="scard-bg"></div>
      <div class="scard-art">
        ${picture('seeker.card_t1', { className: 'scard-art-img', alt: 'The Seeker' })}
      </div>
      <div class="scard-inner">
        <div class="scard-name">The Seeker</div>
        <div class="scard-tier" id="cb-tier">Seeker · Tier I</div>
        <div class="scard-div"></div>
        <div class="scard-hpbar"><i id="cb-hp-fill"></i>
          <span id="cb-hp-text">—</span></div>
        <div class="scard-lvbar"><i></i>
          <span id="cb-lv-text">LVL 1</span></div>
        <div class="cb-status" id="cb-status" hidden></div>
      </div>
    </aside>

    <div class="cb-arena" id="cb-arena"><!-- enemy cards (JS) --></div>

    <!-- camada de FX: cortes de luz do Seeker voando até o alvo -->
    <div class="cb-fx" id="cb-fx" aria-hidden="true"></div>

    <footer class="cb-hud">
      <div class="cb-nav">
        <button type="button" class="cb-arrow" id="cb-prev" title="Previous sub-area">◀</button>
        <div class="cb-zone">
          <b id="cb-zone-name">The Dreaming Wood</b>
          <span id="cb-zone-sub">Sub-area 1/5</span>
        </div>
        <button type="button" class="cb-arrow" id="cb-next" title="Next sub-area">▶</button>
      </div>
      <div class="cb-progress">
        <span class="cb-progress-label" id="cb-progress-label">Toward the Guardian</span>
        <div class="cb-progress-bar"><i id="cb-progress-fill"></i></div>
      </div>
      <dl class="cb-metrics">
        <div><dt>Kills/min</dt><dd id="cb-kpm">0</dd></div>
        <div><dt>Lumens/min</dt><dd id="cb-lpm">0</dd></div>
        <div><dt>Vestiges/min</dt><dd id="cb-vpm">0</dd></div>
        <div><dt>Kills</dt><dd id="cb-kills">0</dd></div>
      </dl>
    </footer>
  `;

  // Setas de navegação entre sub-áreas (gate do boss respeitado em changeSubarea)
  $('cb-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('cb-next').addEventListener('click', () => changeSubarea(state, +1));

  // Fundo nítido do mapa atual (atualizado também no render, em troca de mapa)
  $('cb-backdrop').style.backgroundImage = bg(getCurrentMap(state).bg);
}

export function renderCombat(state) {
  const map = getCurrentMap(state);
  const hpMax = playerHpMax(state);

  // ── Card do Seeker ──
  const rank = currentRank(state);
  $('cb-tier').textContent = `${rank.name} · Tier ${rank.tier}`;
  updateSeekerCard($('cb-seeker'), `seeker.card_t${TIER_NUM[rank.tier] || 1}`);
  $('cb-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('cb-hp-text').textContent =
    `HP: ${formatNumber(Math.max(0, state.player.hp))}/${formatNumber(hpMax)}`;
  $('cb-lv-text').textContent = `LVL ${formatNumber(heroLevel(state.xpTotal))}`;

  const status = $('cb-status');
  const seeker = $('cb-seeker');
  if (state.player.dead) {
    status.textContent = `Fallen — returns in ${Math.ceil(state.player.respawnTimer)}s`;
    status.hidden = false;
    seeker.classList.add('dead');
  } else {
    status.hidden = true;
    seeker.classList.remove('dead');
  }

  // ── Navegação / zona (segue o mapa atual) ──
  $('cb-zone-name').textContent = map.name;
  const bd = $('cb-backdrop');
  if (bd) bd.style.backgroundImage = bg(map.bg);
  const range = subareaLevelRange(map, state.subarea);
  $('cb-zone-sub').textContent =
    `LV ${formatNumber(Math.round(range.lo))}–${formatNumber(Math.round(range.hi))}`;
  const prev = $('cb-prev');
  const next = $('cb-next');
  prev.disabled = state.subarea <= 1;
  next.disabled = state.subarea >= state.unlockedSubarea;
  next.title = next.disabled && state.subarea < map.subareaCount
    ? "Defeat this sub-area's Guardian to advance"
    : 'Next sub-area';

  // ── Onda atual + progresso até o boss (modelo de ondas: limpa a onda → próxima;
  //    o Guardião entra na onda ao bater killsInSubarea/bossKillThreshold). ──
  const bossOut = state.enemies.some((m) => m.isBoss && m.hp > 0);
  const alive = state.enemies.reduce((n, m) => n + (m.hp > 0 ? 1 : 0), 0);
  const pct = Math.min(100, (state.killsInSubarea / map.bossKillThreshold) * 100);
  $('cb-progress-fill').style.width = `${pct}%`;
  $('cb-progress-label').textContent = bossOut
    ? `⚔ The Guardian has arrived · ${alive} in the wave`
    : `Wave ${state.wave} · ${alive} alive · Guardian ${Math.floor(pct)}%`;

  // ── HUD: taxas suavizadas ──
  renderRates(state);

  // ── Inimigos + dano flutuante ──
  // processa impactos cujo projétil já chegou ANTES de desenhar os cards
  processPending(performance.now());
  renderEnemies(state);
  renderDamageFloats(state);
}

// ── Inimigos: reconstrói os cards quando o pack muda; senão só atualiza ──
function renderEnemies(state) {
  const arena = $('cb-arena');

  const totalMobs = state.enemies.reduce((n, m) => n + (m.isBoss ? 0 : 1), 0);
  const bossPresent = state.enemies.some((m) => m.isBoss);
  arena.classList.toggle('with-boss', bossPresent);
  if (arena.children.length !== state.enemies.length) {
    arena.innerHTML = '';
    state.enemies.forEach((mob, i) => arena.appendChild(buildEnemyCard(mob, i, totalMobs, bossPresent)));
  }

  // limpa o HP exibido / impactos pendentes de mobs que saíram (troca de onda)
  const liveIds = new Set(state.enemies.map((m) => m.id));
  for (const id of shownHp.keys()) if (!liveIds.has(id)) shownHp.delete(id);
  if (pendingHits.length) pendingHits = pendingHits.filter((h) => liveIds.has(h.mobId));

  // Alvo do motor: o PRIMEIRO vivo na ordem da onda (frente → trás) recebe a borda dourada
  let targetId = null;
  for (const m of state.enemies) {
    if (m.hp > 0) { targetId = m.id; break; }
  }

  state.enemies.forEach((mob, i) => {
    let card = arena.children[i];
    if (!card || card.dataset.mobId !== String(mob.id)) {
      const fresh = buildEnemyCard(mob, i, totalMobs, bossPresent);
      if (card) arena.replaceChild(fresh, card); else arena.appendChild(fresh);
      card = fresh;
    }
    // HP EXIBIDO (bufferizado até o projétil chegar); o motor já aplicou o dano real.
    let vh = displayHp(mob);
    // reconciliação: motor já matou e não há projétil a caminho → morte visual imediata
    if (mob.hp <= 0 && !pendingHits.some((h) => h.mobId === mob.id)) { vh = 0; shownHp.set(mob.id, 0); }
    // Mob (visualmente) morto SOME — fica fora da cena até a onda virar.
    if (vh <= 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';
    const pct = Math.max(0, (vh / mob.hpMax) * 100);
    card.querySelector('.ecard-fill').style.width = `${pct}%`;
    card.querySelector('.ecard-hp').textContent = `HP: ${formatNumber(Math.max(0, vh))}`;
    card.classList.toggle('target', mob.id === targetId);
    if (!card.dataset.fitted) { fitEnemyName(card); card.dataset.fitted = '1'; }
  });
}

function buildEnemyCard(mob, i, total, bossOut) {
  const pos = mob.isBoss ? BOSS_POINT : spawnPos(i, total, bossOut);
  const dense = !mob.isBoss && total > 8; // pack grande → cards compactos
  const artId = mob.art || ENEMY_ART_FALLBACK; // arte vem do mapa (enemies.js)
  const card = document.createElement('article');
  card.className = mob.isBoss ? 'cb-enemy ecard boss' : `cb-enemy ecard${dense ? ' dense' : ''}`;
  card.dataset.mobId = mob.id;
  card.style.left = `${pos.x}%`;
  card.style.top = `${pos.y}%`;
  // 3 camadas: (1) janela de arte + faixa de nome · (2) moldura PNG (centro
  // transparente) · (3) ATK/HP + barra de vida · floats de dano por golpe.
  card.innerHTML = `
    <div class="ecard-bg"></div>
    <div class="ecard-art">
      ${picture(artId, { className: 'ecard-art-img', alt: mob.name })}
    </div>
    <div class="ecard-inner">
      <div class="ecard-name">${mob.isBoss ? '👑 ' : ''}${mob.name}</div>
      <div class="ecard-lvl">LVL ${formatNumber(mob.level)}${mob.isBoss ? ' · GUARDIAN' : ''}</div>
      <div class="ecard-div"></div>
      <div class="ecard-stats">
        <span class="ecard-atk">ATK: ${formatNumber(mob.dmg)}</span>
        <span class="ecard-hp">HP: ${formatNumber(mob.hp)}</span>
      </div>
      <div class="ecard-bar"><i class="ecard-fill"></i></div>
      <div class="ecard-sigil">⚔</div>
    </div>
    ${mob.frame && mob.frame.startsWith('frames.boss')
      ? picture(mob.frame, { className: 'ecard-frame', alt: '' })
      : '<img class="ecard-frame" src="eclats/frames/card_frame_alpha.png" alt="" aria-hidden="true">'}
    <div class="ecard-floats"></div>
  `;
  card.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
  return card;
}

// Auto-shrink do nome para não vazar a largura da janela de arte.
function fitEnemyName(card) {
  const el = card.querySelector('.ecard-name');
  if (!el || !el.clientWidth) return;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  let guard = 0;
  while (el.scrollWidth > el.clientWidth && size > 9 && guard++ < 24) {
    size -= 1; el.style.fontSize = `${size}px`;
  }
}

// Ângulo do "tip" na arte do corte (tail→tip ≈ 234° em coords de tela). Usado
// pra rotacionar o projétil de modo que a ponta aponte pro alvo.
const SLASH_NATURAL_ANGLE = 234;
const MAX_PROJ_PER_FRAME = 6; // teto de projéteis por render (evita pileup no APS alto)

// Escala atual do palco (o stage é transformado por scale no fit())
function stageScale() {
  const st = $('#stage') || document.getElementById('stage');
  if (!st) return 1;
  const w = parseFloat(st.style.width) || 1920;
  const rect = st.getBoundingClientRect();
  return rect.width / w || 1;
}
// Centro de um elemento nas coords (não-escaladas) da camada `layer`
function centerIn(layer, el, scale) {
  const r = el.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - l.left) / scale, y: (r.top + r.height / 2 - l.top) / scale };
}

// Duração do voo escalada pelo APS: piso no APS 1 (velocidade base PROJ_BASE_MS);
// acima de 1 fica proporcionalmente mais curta (APS 2 = metade do tempo → dois
// projéteis em sequência), com piso pra não virar piscada no APS altíssimo.
const PROJ_BASE_MS = 360;
function projDuration(aps) {
  return Math.max(75, Math.min(PROJ_BASE_MS, PROJ_BASE_MS / Math.max(1, aps)));
}

// Dispara um corte de luz do card do Seeker até o card do mob alvo
function spawnProjectile(targetCard, isCrit, aps) {
  const fx = document.getElementById('cb-fx');
  const seeker = document.getElementById('cb-seeker');
  if (!fx || !seeker || !targetCard) return;
  const scale = stageScale();
  const fr = fx.getBoundingClientRect();
  const o = centerIn(fx, seeker, scale);
  // alvo pela POSIÇÃO % do card (style.left/top) — funciona mesmo se o mob morreu
  // no golpe e o card já está display:none (getBoundingClientRect daria zero → 0,0).
  const lx = parseFloat(targetCard.style.left) || 50;
  const ty = parseFloat(targetCard.style.top) || 50;
  const t = { x: (lx / 100) * (fr.width / scale), y: (ty / 100) * (fr.height / scale) };
  // origem na borda direita do card do Seeker (parece sair "dele")
  const sr = seeker.getBoundingClientRect();
  o.x = (sr.right - sr.width * 0.12 - fr.left) / scale;
  const ang = Math.atan2(t.y - o.y, t.x - o.x) * 180 / Math.PI;
  const proj = document.createElement('div');
  proj.className = isCrit ? 'cb-proj crit' : 'cb-proj';
  proj.style.left = `${o.x}px`;
  proj.style.top = `${o.y}px`;
  proj.style.setProperty('--dx', `${t.x - o.x}px`);
  proj.style.setProperty('--dy', `${t.y - o.y}px`);
  proj.style.animationDuration = `${projDuration(aps)}ms`;
  proj.innerHTML = `<i class="cb-proj-img" style="transform:rotate(${ang - SLASH_NATURAL_ANGLE}deg)"></i>`;
  proj.addEventListener('animationend', () => proj.remove());
  fx.appendChild(proj);
}

// ── Dano sincronizado com o projétil ───────────────────────────────────────
// O motor aplica o dano e mata o mob na hora (economia/offline corretos), mas
// VISUALMENTE o HP só cai e o card só some quando o corte de luz chega. A UI
// mantém um HP "exibido" por mob (shownHp) e uma fila de impactos agendados.
const shownHp = new Map();   // mobId -> HP exibido (bufferizado)
let pendingHits = [];        // { mobId, amount, isCrit, impactAt }

// HP exibido do mob (inicia cheio na primeira vez que aparece em cena)
function displayHp(mob) {
  let v = shownHp.get(mob.id);
  if (v === undefined) { v = mob.hpMax; shownHp.set(mob.id, v); }
  return v;
}

// Aplica um hit ao visual: baixa o HP exibido e solta o número de dano no card.
function applyVisualHit(h) {
  const cur = shownHp.get(h.mobId);
  if (cur === undefined) return; // mob já saiu de cena
  shownHp.set(h.mobId, Math.max(0, cur - h.amount));
  const card = document.querySelector(`.cb-enemy[data-mob-id="${h.mobId}"]`);
  if (!card) return;
  const host = card.querySelector('.ecard-floats') || card;
  const el = document.createElement('span');
  el.className = h.isCrit ? 'ecard-dmg crit' : 'ecard-dmg';
  el.textContent = `-${formatNumber(h.amount)} HP`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

// Processa os impactos cujo projétil já chegou (chamado a cada frame).
function processPending(now) {
  if (pendingHits.length === 0) return;
  const rest = [];
  for (const h of pendingHits) {
    if (h.impactAt <= now) applyVisualHit(h); else rest.push(h);
  }
  pendingHits = rest;
}

// Consome state.fx: dispara o projétil e AGENDA o impacto (HP/número/morte) pra
// quando o corte chegar. Hits acima do teto de projéteis/frame aplicam na hora.
function renderDamageFloats(state) {
  if (state.fx.length === 0) return;
  let projCount = 0;
  const aps = currentAPS(state);
  const now = performance.now();
  for (const hit of state.fx) {
    const card = document.querySelector(`.cb-enemy[data-mob-id="${hit.mobId}"]`);
    if (!card) continue; // mob já substituído — descarta
    if (projCount < MAX_PROJ_PER_FRAME) {
      spawnProjectile(card, hit.isCrit, aps);
      projCount++;
      pendingHits.push({ mobId: hit.mobId, amount: hit.amount, isCrit: hit.isCrit, impactAt: now + projDuration(aps) });
    } else {
      applyVisualHit({ mobId: hit.mobId, amount: hit.amount, isCrit: hit.isCrit });
    }
  }
  state.fx.length = 0;
}

// Taxas do HUD: EMA das variações reais do state (verdade, não estimativa).
function renderRates(state) {
  const now = performance.now();
  if (!rates) {
    rates = { t: now, lumens: state.lumens, vest: state.vestiges, kills: state.killsTotal,
      lpm: 0, vpm: 0, kpm: 0 };
  } else {
    const dt = (now - rates.t) / 1000;
    if (dt >= 0.5) {
      const inst = 60 / dt;
      const a = 0.35;
      // max(0,…) absorve resets (Convergence zera Lumens/run)
      rates.lpm = rates.lpm * (1 - a) + Math.max(0, state.lumens - rates.lumens) * inst * a;
      rates.vpm = rates.vpm * (1 - a) + Math.max(0, state.vestiges - rates.vest) * inst * a;
      rates.kpm = rates.kpm * (1 - a) + Math.max(0, state.killsTotal - rates.kills) * inst * a;
      rates.t = now; rates.lumens = state.lumens; rates.vest = state.vestiges; rates.kills = state.killsTotal;
    }
  }
  $('cb-kpm').textContent = formatNumber(rates.kpm);
  $('cb-lpm').textContent = formatNumber(rates.lpm);
  $('cb-vpm').textContent = formatNumber(rates.vpm);
  $('cb-kills').textContent = formatNumber(state.killsTotal);
}
