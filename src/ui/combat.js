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
import { runLevel, playerHpMax, currentAPS, levelProgress, levelXpInfo } from '../game/stats.js';
import { changeSubarea, subareaUnlockLevel } from '../game/combat.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { currentRank } from '../game/ascension.js';

// tier romano → número do card (seeker.card_tN)
const TIER_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const $ = (id) => document.getElementById(id);

// Background POR SUB-ÁREA (caminho direto pro WebP). Map 1 tem arte dedicada das
// 9 áreas; mapas/áreas sem arte caem no fundo único do mapa (bg(map.bg)).
const SUBAREA_BG = {
  1: [
    'lanternroot_glade', 'glimmercap_hollow', 'lightfall_stair', 'dreaming_gate',
    'verdant_deep', 'gilded_mire', 'hollowed_grove', 'stillwatch', 'hollow_heart',
  ],
};
function subareaBg(state) {
  const slug = (SUBAREA_BG[state.map] || [])[state.subarea - 1];
  return slug
    ? `url('eclats/enemies/map${state.map}/${slug}_bg.webp')`
    : bg(getCurrentMap(state).bg);
}

// A arte de cada inimigo/boss vem do mapa (mob.art, definido em enemies.js a
// partir de MAPS em constants). Fallback caso falte.
const ENEMY_ART_FALLBACK = 'enemies.map1.candlewisp_shade';

// Pontos de spawn fixos dentro da arena (%) — pack ≤ 8 (packSizes do GDD),
// então renderizamos todos, sem badge "+N".
// Grade 4×2 com espaçamento horizontal de 17% (≥217px no palco mais estreito,
// 1280) e cards de 190px (285 de altura) — NUNCA há sobreposição entre mobs.
// Verticalmente a arena útil (topbar→HUD, ~100..988px) comporta exatamente
// 3 bandas de 285px com ~17px de folga: linha de cima (y 22.5%), faixa
// exclusiva do boss no meio (y 50.5%) e linha de baixo (y 78%).
// Packs grandes (9..12, GDD packSizes=[2,4,6,9,12]) usam grade 6×2 com cards
// menores (140px) — TODOS os mobs do pack aparecem, nunca menos.
const BOSS_POINT = { x: 55, y: 50.5 };
const ARENA_CX = 66; // centro horizontal da arena de mobs (à DIREITA do card do Seeker)

// Layout COUNT-AWARE: poucos mobs ficam grandes e centrados; muitos viram grade
// densa. Sempre deslocado pra direita (ARENA_CX) pra não encostar no Seeker.
//   ≤3 mobs  → 1 fileira centrada (cards grandes)
//   4-6 mobs → 2 fileiras (cards normais)
//   7-8 mobs → grade 4×2 (cards médios)
//   9-12     → grade 6×2 (cards densos)
function mobLayout(total) {
  if (total <= 3) return { perRow: total, rows: 1, spacing: 19 };
  if (total <= 6) return { perRow: Math.ceil(total / 2), rows: 2, spacing: 17 };
  if (total <= 8) return { perRow: 4, rows: 2, spacing: 13.5 };
  if (total <= 12) return { perRow: 6, rows: 2, spacing: 11.5 };
  // Packs grandes (13..20+): mais fileiras, sprites menores (.swarm). Distribui
  // em N fileiras pra caber na vertical sem colisão; colunas centradas.
  const rows = total <= 16 ? 3 : 4;
  const perRow = Math.ceil(total / rows);
  return { perRow, rows, spacing: Math.min(10.5, 60 / perRow) };
}

// Posição do i-ésimo mob (ordinal entre os NÃO-boss) num pack de `total`.
// Colunas centradas em ARENA_CX; a última fileira (se incompleta) também centra.
function spawnPos(i, total, bossOut) {
  const { perRow, rows, spacing } = mobLayout(total);
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const colsInRow = row === rows - 1 ? total - perRow * row : perRow;
  const x = ARENA_CX + spacing * (col - (colsInRow - 1) / 2);
  let y;
  if (rows === 1) {
    y = bossOut ? 22.5 : 50;
  } else if (rows === 2) {
    // 2 fileiras → bandas alta/baixa (mais separadas: sprites altos não colidem)
    y = bossOut ? (row === 0 ? 21 : 78) : (row === 0 ? 28 : 71);
  } else {
    // 3+ fileiras → distribui uniformemente entre o topo e a base da arena
    const top = 18, bot = 86;
    y = top + row * ((bot - top) / (rows - 1));
  }
  return { x, y };
}

// Janela de suavização das taxas do HUD (EMA simples)
let rates = null;
let prevT1 = null;   // último total de material T1 (pra detectar o drop)
let lastDropAt = 0;  // quando dropou material pela última vez (pra sumir o box depois)
let dropAccum = 0;   // quanto DROPOU no burst atual (some/zera quando o box some)

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

    <aside class="cb-seeker sfig" id="cb-seeker">
      <div class="sfig-label">
        ${picture('seeker.nameplate', { className: 'sfig-banner', alt: '' })}
        <div class="sfig-nametext">
          <div class="scard-name">Seeker</div>
        </div>
      </div>
      <div class="scard-art sfig-art">
        ${picture('seeker.card_t1', { className: 'scard-art-img', alt: 'The Seeker' })}
      </div>
      <div class="sfig-info">
        <div class="scard-hpbar"><i id="cb-hp-fill"></i>
          <span id="cb-hp-text">—</span></div>
        <div class="scard-lvbar"><i id="cb-lv-fill"></i>
          <span id="cb-lv-text">LVL 1</span></div>
        <div class="cb-status" id="cb-status" hidden></div>
      </div>
    </aside>

    <div class="cb-arena" id="cb-arena"><!-- enemy cards (JS) --></div>

    <!-- Box de drops do mapa (T1) — bg = arte do material; mostra o que DROPOU -->
    <div class="cb-drops" id="cb-drops">
      <div class="cb-drop-info">
        <b class="cb-drop-val" id="cb-drop-t1">+0</b>
      </div>
    </div>

    <!-- camada de FX: cortes de luz do Seeker voando até o alvo -->
    <div class="cb-fx" id="cb-fx" aria-hidden="true"></div>

    <footer class="cb-hud">
      <div class="cb-nav">
        <button type="button" class="cb-arrow" id="cb-prev" title="Previous sub-area">◀</button>
        <div class="cb-zone">
          <span id="cb-zone-sub">LV 1</span>
        </div>
        <button type="button" class="cb-arrow" id="cb-next" title="Next sub-area">▶</button>
      </div>
      <div class="cb-progress">
        <span class="cb-progress-label" id="cb-progress-label">Wave 1</span>
        <div class="cb-progress-bar"><i id="cb-progress-fill"></i></div>
      </div>
      <dl class="cb-metrics">
        <div><dt>Kills /min</dt><dd id="cb-kpm">0</dd></div>
        <div><dt>Lumens /min</dt><dd id="cb-lpm">0</dd></div>
        <div><dt>Vestiges /min</dt><dd id="cb-vpm">0</dd></div>
        <div class="cb-metric-total"><dt>Total kills</dt><dd id="cb-kills">0</dd></div>
      </dl>
    </footer>
  `;

  // Setas de navegação entre sub-áreas (gate do boss respeitado em changeSubarea)
  $('cb-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('cb-next').addEventListener('click', () => changeSubarea(state, +1));

  // Fundo da sub-área atual (atualizado também no render, em troca de área/mapa)
  $('cb-backdrop').style.backgroundImage = subareaBg(state);
}

export function renderCombat(state) {
  const map = getCurrentMap(state);
  const hpMax = playerHpMax(state);

  // ── Card do Seeker ──
  const rank = currentRank(state);
  // tier removido do banner (vai pra outra tela); rank ainda escolhe o sprite do tier
  updateSeekerCard($('cb-seeker'), `seeker.card_t${TIER_NUM[rank.tier] || 1}`);
  $('cb-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('cb-hp-text').textContent =
    `HP: ${formatNumber(Math.max(0, state.player.hp))}/${formatNumber(hpMax)}`;
  const xpi = levelXpInfo(state);
  $('cb-lv-text').textContent =
    `LVL ${formatNumber(runLevel(state))} · ${formatNumber(xpi.into)}/${formatNumber(xpi.total)} XP`;
  $('cb-lv-fill').style.width = `${levelProgress(state) * 100}%`;

  // Box de drops T1: SÓ aparece ao dropar; mostra o QUANTO dropou (burst), não o
  // total guardado; some + zera após ~3.5s sem drop novo (não fixo).
  const t1 = state.materiais[0] || 0;
  const drops = $('cb-drops');
  if (prevT1 !== null && t1 > prevT1) {
    dropAccum += t1 - prevT1;
    lastDropAt = performance.now();
    drops.classList.add('show');
    drops.classList.remove('drop'); void drops.offsetWidth; drops.classList.add('drop');
  }
  if (lastDropAt && performance.now() - lastDropAt > 3500) { drops.classList.remove('show'); dropAccum = 0; }
  $('cb-drop-t1').textContent = `+${formatNumber(dropAccum)}`;
  prevT1 = t1;

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
  const bd = $('cb-backdrop');
  if (bd) bd.style.backgroundImage = subareaBg(state);
  const range = subareaLevelRange(map, state.subarea);
  $('cb-zone-sub').textContent =
    `LV ${formatNumber(Math.round(range.lo))}–${formatNumber(Math.round(range.hi))}`;
  const prev = $('cb-prev');
  const next = $('cb-next');
  prev.disabled = state.subarea <= 1;
  next.disabled = state.subarea >= state.unlockedSubarea;
  next.title = next.disabled && state.subarea < map.subareaCount
    ? `Reach level ${formatNumber(subareaUnlockLevel(map, state.subarea + 1))} to advance`
    : 'Next sub-area';

  // ── Onda atual + progresso. Sem Guardião: sub-áreas 1..N-1 mostram o avanço de
  //    NÍVEL até liberar a próxima; a última mostra o progresso até o boss. ──
  const isFinalArea = state.subarea === map.subareaCount;
  const bossOut = state.enemies.some((m) => m.isBoss && m.hp > 0);
  const alive = state.enemies.reduce((n, m) => n + (m.hp > 0 ? 1 : 0), 0);
  let pct, label;
  if (bossOut) {
    pct = 100;
    label = `⚔ ${map.bossName} · ${alive} in the wave`;
  } else if (isFinalArea) {
    pct = Math.min(100, (state.killsInSubarea / map.bossKillThreshold) * 100);
    label = `Wave ${state.wave} · ${alive} alive · ${Math.floor(pct)}% to ${map.bossName}`;
  } else if (state.unlockedSubarea < map.subareaCount) {
    // Progresso de NÍVEL até destravar a próxima área da fronteira (não a atual)
    const tgt = state.unlockedSubarea + 1;
    const lv = runLevel(state);
    const cur = subareaUnlockLevel(map, state.unlockedSubarea);
    const nxt = subareaUnlockLevel(map, tgt);
    const tgtName = (map.subareaNames || [])[tgt - 1] || `area ${tgt}`;
    pct = Math.max(0, Math.min(100, ((lv - cur) / Math.max(1, nxt - cur)) * 100));
    label = `Wave ${state.wave} · ${alive} alive · level ${formatNumber(lv)}/${formatNumber(nxt)} → ${tgtName}`;
  } else {
    pct = 100;
    label = `Wave ${state.wave} · ${alive} alive`;
  }
  $('cb-progress-fill').style.width = `${pct}%`;
  $('cb-progress-label').textContent = label;

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
  // ordinal entre os NÃO-boss (boss fica no slot 0 quando presente → mobs começam em 1)
  const ordOf = (i) => (bossPresent ? Math.max(0, i - 1) : i);
  if (arena.children.length !== state.enemies.length) {
    arena.innerHTML = '';
    state.enemies.forEach((mob, i) => arena.appendChild(buildEnemyCard(mob, ordOf(i), totalMobs, bossPresent)));
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
      const fresh = buildEnemyCard(mob, ordOf(i), totalMobs, bossPresent);
      if (card) arena.replaceChild(fresh, card); else arena.appendChild(fresh);
      card = fresh;
    }
    // HP EXIBIDO (bufferizado até o projétil chegar); o motor já aplicou o dano real.
    let vh = displayHp(mob);
    // reconciliação: motor já matou E não há projétil a caminho NEM impacto a agendar
    // (state.fx ainda não virou projétil — renderEnemies roda antes de renderDamageFloats).
    // Sem o check de state.fx, o mob morria ANTES do projétil sair → some antes do corte chegar.
    const projComing = pendingHits.some((h) => h.mobId === mob.id) || state.fx.some((h) => h.mobId === mob.id);
    if (mob.hp <= 0 && !projComing) { vh = 0; shownHp.set(mob.id, 0); }
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
  // tamanho por contagem: ≤3 grande · 4-6 normal · 7-8 médio · 9+ denso
  const size = mob.isBoss ? ' boss' : total <= 3 ? ' big' : total <= 6 ? '' : total <= 8 ? ' mid' : total <= 12 ? ' dense' : ' swarm';
  const artId = mob.art || ENEMY_ART_FALLBACK; // arte vem do mapa (enemies.js)
  const card = document.createElement('article');
  card.className = `cb-enemy emob${size}${mob.gilded ? ' gilded' : ''}`;
  card.dataset.mobId = mob.id;
  card.style.left = `${pos.x}%`;
  card.style.top = `${pos.y}%`;
  // SEM card: sprite de corpo inteiro (recorte transparente) · nome+LV acima ·
  // ATK/HP + barra abaixo · floats de dano sobre o sprite. Gilded = prefixo ✦ + nome dourado.
  card.innerHTML = `
    <div class="emob-label">
      <div class="ecard-name">${mob.isBoss ? '👑 ' : mob.gilded ? '✦ ' : ''}${mob.gilded ? `${mob.gilded} ` : ''}${mob.name}</div>
      <div class="ecard-lvl">LVL ${formatNumber(mob.level)}${mob.isBoss ? ' · BOSS' : mob.gilded ? ' · GILDED' : ''}</div>
    </div>
    <div class="emob-art">
      ${picture(artId, { className: 'emob-art-img', alt: mob.name })}
      <div class="ecard-floats"></div>
    </div>
    <div class="emob-info">
      <div class="emob-statline">
        <span class="ecard-atk">ATK: ${formatNumber(mob.dmg)}</span>
        <span class="ecard-hp">HP: ${formatNumber(mob.hp)}</span>
      </div>
      <div class="ecard-bar"><i class="ecard-fill"></i></div>
    </div>
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
// ⚠️ ligado a COMBAT.waveClearDelay: o beat de troca de onda deve cobrir este voo
// (senão a onda troca antes do projétil do último mob chegar). 200ms ↔ beat 0.3s.
const PROJ_BASE_MS = 200;
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
  // Fallback: garante a remoção mesmo se animationend NÃO disparar (aba oculta /
  // animação interrompida) — senão os projéteis pilham invisíveis (opacity 0) e vazam.
  setTimeout(() => proj.remove(), projDuration(aps) + 200);
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
