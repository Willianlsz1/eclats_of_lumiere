'use strict';
// All DOM updates — called after every tick

let _lastTab = null;

function renderAll() {
  renderCombat();
  renderGoldStats();
  renderConvergence();
  renderAscension();
  renderRunInfo();
  if (G.activeTab === 'passives')  renderPassives();
  if (G.activeTab === 'memoires')  renderMemoires();
  if (G.activeTab === 'gear')      renderGear();
  renderTabVisibility();
}

// ────────────────────────────────────────────────────────────────────────────
// Combat panel
// ────────────────────────────────────────────────────────────────────────────
function renderCombat() {
  const m = G.map, s = G.sub;

  // Map / sub label
  _setText('combat-location', `${MAPS[m].name} — Sub ${s+1}/5`);

  // DPS
  _setText('combat-dps', formatNum(calcDps(G)) + ' DPS');

  // Kill time
  const L = subMeanLevel(m, s);
  const hp = mobHp(L);
  const dps = calcDps(G);
  const aps = playerAps(G.agi, G.passiveLevels);
  const kt = Math.max(hp / Math.max(dps, 1e-30), 1.0 / aps);
  _setText('combat-killtime', formatTime(kt) + '/kill');

  // Mob HP bar area
  _renderMobCard(m, s, hp);

  // Boss HP bar
  const bossBar = document.getElementById('boss-bar-wrap');
  if (bossBar) {
    bossBar.style.display = G.bossActive ? 'block' : 'none';
    if (G.bossActive) {
      const pct = Math.max(0, G.bossHp / G.bossMaxHp * 100);
      _setText('boss-hp-text', formatNum(G.bossHp) + ' / ' + formatNum(G.bossMaxHp));
      document.getElementById('boss-hp-fill').style.width = pct + '%';
      _setText('boss-name', MAPS[m].name + ' Boss');
    }
  }

  // Player HP bar
  const phf = document.getElementById('player-hp-fill');
  const pht = document.getElementById('player-hp-text');
  if (phf) {
    const pct = Math.max(0, Math.min(100, G.playerHp / G.playerHpMax * 100));
    phf.style.width = pct + '%';
  }
  if (pht) _setText('player-hp-text', formatNum(G.playerHp) + ' / ' + formatNum(G.playerHpMax));

  // Event log
  const log = document.getElementById('event-log');
  if (log) {
    log.innerHTML = G.eventLog.slice(0, 12).map(e =>
      `<div class="log-entry">${e}</div>`
    ).join('');
  }

  // Ascension badge
  const ascBadge = document.getElementById('asc-badge');
  if (ascBadge) {
    ascBadge.textContent = G.ascensions > 0 ? `A${G.ascensions}` : '';
    ascBadge.style.display = G.ascensions > 0 ? 'inline-block' : 'none';
  }
}

function _renderMobCard(m, s, mobHpVal) {
  const pack = PACK_SIZE[m][s];
  const area = document.getElementById('mob-area');
  if (!area) return;
  const pct  = 100; // mobs always at full HP (they respawn; player attacks single target)
  area.innerHTML = `
    <div class="mob-card">
      <div class="mob-icon">☠</div>
      <div class="mob-info">
        <span class="mob-pack">×${pack} pack</span>
        <span class="mob-hp-val">${formatNum(mobHpVal)} HP</span>
      </div>
      <div class="mob-hp-bar-bg">
        <div class="mob-hp-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Gold Stats panel
// ────────────────────────────────────────────────────────────────────────────
function renderGoldStats() {
  _setText('lumens-val', formatNum(G.lumens) + ' Lumens');

  const stats = [
    { key:'str', label:'Strength',   per: CONFIG.strPer },
    { key:'vit', label:'Vitality',   per: CONFIG.vitPer },
    { key:'agi', label:'Agility',    per: CONFIG.agiPer },
    { key:'lck', label:'Luck',       per: CONFIG.lckPer },
    { key:'frt', label:'Fortune',    per: CONFIG.frtPer },
    { key:'wis', label:'Wisdom',     per: CONFIG.wisPer },
  ];

  for (const { key, label, per } of stats) {
    const lv   = G[key];
    const cost = statCostNext(lv);
    const btn  = document.getElementById(`btn-${key}`);
    const info = document.getElementById(`info-${key}`);
    if (btn)  btn.classList.toggle('can-afford', G.lumens >= cost);
    if (info) info.textContent = `${label} Lv ${lv}  |  next: ${formatNum(cost)} L`;
    // Milestone progress bar
    const bar = document.getElementById(`ms-bar-${key}`);
    if (bar) {
      const next = _nextMilestone(lv);
      if (next) {
        const prev = _prevMilestone(lv) || 0;
        const pct = Math.min(100, (lv - prev) / (next[0] - prev) * 100);
        bar.style.width = pct + '%';
        bar.title = `Next milestone: ×${next[1]} at Lv ${next[0]}`;
      } else {
        bar.style.width = '100%';
      }
    }
  }
}

function _nextMilestone(lv) {
  for (const [k, v] of MILESTONES) {
    if (lv < k) return [k, v];
  }
  return null;
}

function _prevMilestone(lv) {
  let prev = 0;
  for (const [k] of MILESTONES) {
    if (lv >= k) prev = k;
    else break;
  }
  return prev;
}

// ────────────────────────────────────────────────────────────────────────────
// Convergence panel
// ────────────────────────────────────────────────────────────────────────────
function renderConvergence() {
  const wall = xpWall(G.convergences);
  const pct  = Math.min(100, G.xpRun / wall * 100);

  const fill = document.getElementById('xp-fill');
  if (fill) fill.style.width = pct + '%';
  _setText('xp-text', formatNum(G.xpRun) + ' / ' + formatNum(wall));
  _setText('conv-count', `Convergences: ${G.convergences}`);
  _setText('conv-points', `Conv. Points: ${G.convPoints}  (×${convFactor(G.convPoints).toFixed(2)} dmg/hp)`);

  const seeker = G.xpLife > 0 ? seekerLevel(G.xpLife) : 1;
  _setText('seeker-level', `Seeker Lv ${formatNum(seeker)}`);

  const btn = document.getElementById('btn-converge');
  if (btn) {
    const canConv = G.xpRun >= wall && G.bestGsub >= 1;
    btn.disabled = !canConv;
    btn.classList.toggle('ready', canConv);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Passives panel
// ────────────────────────────────────────────────────────────────────────────
function renderPassives() {
  _setText('pass-pool-val', formatNum(G.passPool) + ' VP');

  const trees = ['eclat', 'vestige', 'fracture'];
  for (const tree of trees) {
    const container = document.getElementById(`tree-${tree}`);
    if (!container) continue;
    container.innerHTML = PASSIVES_DEF[tree].map(p => {
      const lv   = G.passiveLevels[p.name] || 0;
      const cost = CONFIG.passCostBase * Math.pow(CONFIG.passCostRamp, lv);
      const can  = G.passPool >= cost && G.passivesUnlocked;
      return `<div class="passive-row">
        <div class="passive-info">
          <b>${p.name}</b> Lv ${lv}
          <span class="passive-desc">${p.desc}</span>
        </div>
        <button class="btn-passive ${can ? 'can-afford' : ''}"
          onclick="buyPassive('${p.name}')"
          ${can ? '' : 'disabled'}>
          ${formatNum(cost)} VP
        </button>
      </div>`;
    }).join('');
  }

  // Unlock notice
  const notice = document.getElementById('passives-locked');
  if (notice) notice.style.display = G.passivesUnlocked ? 'none' : 'flex';
}

// ────────────────────────────────────────────────────────────────────────────
// Mémoires panel
// ────────────────────────────────────────────────────────────────────────────
function renderMemoires() {
  _setText('eclats-val', formatNum(G.eclats) + ' Éclats');
  _setText('blessure-val', `Blessure: ${G.blessureLv} (×${(Math.pow(1.10, G.blessureLv)).toFixed(3)})`);

  const total = G.memoireLevels.reduce((a,b)=>a+b,0) + G.blessureLv;
  _setText('clarte-val', `Clarté total: ×${formatNum(Math.pow(CONFIG.clarte, total))}`);

  const container = document.getElementById('memoires-list');
  if (!container) return;
  container.innerHTML = MEMOIRES.map((mem, i) => {
    const lv   = G.memoireLevels[i];
    const cost = CONFIG.memCostBase * Math.pow(CONFIG.memCostRamp, lv);
    const can  = G.eclats >= cost && G.ascensions >= 1;
    return `<div class="memoir-row era${mem.era}">
      <div class="memoir-info">
        <span class="memoir-name">${mem.name}</span>
        <span class="memoir-era">Era ${mem.era}</span>
        <span class="memoir-lv">Lv ${lv}</span>
        <span class="memoir-desc">${mem.desc}</span>
      </div>
      <button class="btn-memoir ${can ? 'can-afford' : ''}"
        onclick="buyMemoire(${i})"
        ${can ? '' : 'disabled'}>
        ${formatNum(cost)} Éclats
      </button>
    </div>`;
  }).join('');

  // Lock overlay until Ascension 1
  const locked = document.getElementById('memoires-locked');
  if (locked) locked.style.display = G.ascensions >= 1 ? 'none' : 'flex';
}

// ────────────────────────────────────────────────────────────────────────────
// Gear panel
// ────────────────────────────────────────────────────────────────────────────
function renderGear() {
  const container = document.getElementById('gear-list');
  if (!container) return;
  container.innerHTML = GEAR_DEF.map((def, i) => {
    const piece = G.gear[i];
    const rar   = RARITY[piece.rarity];
    const cap   = piece.rarity === 3 ? 25000 * Math.max(1, G.ascensions) : rar.cap;
    const upgCost = gearUpgradeCost(piece.level);
    const canUpg  = G.lumens >= upgCost && piece.level < cap;
    const fragsNeeded = 10 * (piece.rarity + 1);
    const canRar  = piece.matFrags >= fragsNeeded && piece.rarity < 3;
    const bonus   = def.base * piece.level * rar.rate;
    return `<div class="gear-row rarity-${rar.label.toLowerCase()}">
      <div class="gear-info">
        <span class="gear-name rarity-text-${rar.label.toLowerCase()}">${def.name}</span>
        <span class="gear-rarity">${rar.label}</span>
        <span class="gear-lv">Lv ${piece.level}/${cap === Infinity ? '∞' : cap}</span>
        <span class="gear-bonus">${def.stat.toUpperCase()} +${(bonus*100).toFixed(1)}%</span>
      </div>
      <div class="gear-actions">
        <button class="btn-gear ${canUpg ? 'can-afford' : ''}"
          onclick="upgradeGear(${i})"
          ${canUpg ? '' : 'disabled'}>
          +Lv (${formatNum(upgCost)} L)
        </button>
        ${piece.rarity < 3 ? `<button class="btn-gear-rar ${canRar ? 'can-afford' : ''}"
          onclick="upgradeGearRarity(${i})"
          ${canRar ? '' : 'disabled'}>
          ▲ ${RARITY[piece.rarity+1].label} (${piece.matFrags}/${fragsNeeded} frags)
        </button>` : '<span class="gear-maxrar">✦ Legendary</span>'}
      </div>
    </div>`;
  }).join('');

  // Lock overlay until Ascension 1
  const locked = document.getElementById('gear-locked');
  if (locked) locked.style.display = G.ascensions >= 1 ? 'none' : 'flex';
}

// ────────────────────────────────────────────────────────────────────────────
// Ascension dots
// ────────────────────────────────────────────────────────────────────────────
function renderAscension() {
  const dots = document.getElementById('asc-dots');
  if (!dots) return;
  const labels = ['A1','A2','A3','A4','A5'];
  const costs  = ASC_COST;
  dots.innerHTML = labels.map((lbl, i) => {
    const done   = G.ascensions > i;
    const isNext = G.ascensions === i;
    const cls    = done ? 'done' : isNext ? 'next' : 'locked';
    const cost   = costs[i] === null ? 'Free' : formatNum(costs[i]) + ' V';
    return `<span class="asc-dot ${cls}" title="${cost}">${lbl}</span>`;
  }).join('');
}

// ────────────────────────────────────────────────────────────────────────────
// Run info (right panel when on combat tab)
// ────────────────────────────────────────────────────────────────────────────
function renderRunInfo() {
  const gsub = G.bestGsub;
  const m    = Math.floor(gsub / 5);
  const s    = gsub % 5;
  _setText('best-gsub-val', `Map ${m+1} Sub ${s+1}`);
  _setText('vest-pool-val', formatNum(G.vestiges));
  _setText('pass-pool-val', formatNum(G.passPool) + ' VP');

  // Éclats drip estimate
  const deepestCleared = G.mapBossDefeated.lastIndexOf(true);
  if (deepestCleared >= 0) {
    const frontierBossHp = mobHp(MAPS[deepestCleared].lvl[1]) * CONFIG.bossHpMult;
    const dripPerH = eclatDrip(frontierBossHp, 3600);
    _setText('drip-val', formatNum(dripPerH) + '/h');
  } else {
    _setText('drip-val', '0/h');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tab visibility
// ────────────────────────────────────────────────────────────────────────────
function renderTabVisibility() {
  // Passives tab appears after 1st Convergence
  const tabPass = document.getElementById('tab-passives');
  if (tabPass) tabPass.style.display = G.passivesUnlocked ? 'inline-block' : 'none';

  // Mémoires and Gear tabs appear after Ascension 1
  const tabMem  = document.getElementById('tab-memoires');
  const tabGear = document.getElementById('tab-gear');
  if (tabMem)  tabMem.style.display  = G.ascensions >= 1 ? 'inline-block' : 'none';
  if (tabGear) tabGear.style.display = G.ascensions >= 1 ? 'inline-block' : 'none';

  // Mobile: show Upgrades button once passives or mémoires unlock
  const mobileUpgBtn = document.querySelector('.mobile-nav-btn[data-mobile="upgrades"]');
  if (mobileUpgBtn) {
    mobileUpgBtn.style.opacity = G.passivesUnlocked ? '1' : '0.4';
  }

  // Mobile: ensure correct panel visible (on first render)
  const isMobile = window.innerWidth <= 768;
  if (isMobile && !G.mobilePanel) {
    G.mobilePanel = 'combat';
    document.getElementById('panel-combat').classList.add('mobile-panel-active');
    document.querySelector('.mobile-nav-btn[data-mobile="combat"]')?.classList.add('active');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────────
function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ────────────────────────────────────────────────────────────────────────────
// Mobile panel switcher
// ────────────────────────────────────────────────────────────────────────────
function switchMobilePanel(mobileTab) {
  G.mobilePanel = mobileTab;

  // Hide all main panels
  ['panel-left', 'panel-combat', 'panel-right'].forEach(id => {
    document.getElementById(id).classList.remove('mobile-panel-active');
  });

  // Update bottom nav active state
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mobile === mobileTab);
  });

  const subtabs = document.getElementById('mobile-subtabs');

  if (mobileTab === 'combat') {
    document.getElementById('panel-combat').classList.add('mobile-panel-active');
    if (subtabs) subtabs.classList.remove('visible');
  } else if (mobileTab === 'stats') {
    document.getElementById('panel-left').classList.add('mobile-panel-active');
    if (subtabs) subtabs.classList.remove('visible');
  } else if (mobileTab === 'info') {
    document.getElementById('panel-right').classList.add('mobile-panel-active');
    if (subtabs) subtabs.classList.remove('visible');
    // Show run info sub-panel in right panel
    document.querySelectorAll('#right-tab-content .tab-content').forEach(el => el.style.display = 'none');
    const ri = document.getElementById('panel-combat-right');
    if (ri) ri.style.display = 'flex';
    G.activeTab = 'combat';
  } else if (mobileTab === 'upgrades') {
    document.getElementById('panel-right').classList.add('mobile-panel-active');
    if (subtabs) subtabs.classList.add('visible');
    // Default to first unlocked upgrade tab
    const defaultTab = G.passivesUnlocked ? 'passives' : (G.ascensions >= 1 ? 'memoires' : 'passives');
    _switchMobileSubtab(defaultTab);
  }

  renderAll();
}

function _switchMobileSubtab(subtab) {
  document.querySelectorAll('.mobile-subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subtab);
  });
  // Re-use desktop switchTab logic
  document.querySelectorAll('#right-tab-content .tab-content').forEach(el => el.style.display = 'none');
  const panel = document.getElementById('panel-' + subtab);
  if (panel) panel.style.display = 'flex';
  G.activeTab = subtab;
}

function switchTab(tab) {
  G.activeTab = tab;
  // Hide all right-panel tab contents
  document.querySelectorAll('#right-tab-content .tab-content').forEach(el => el.style.display = 'none');
  // Show the matching right panel (combat → panel-combat-right, others → panel-<tab>)
  const rightId = tab === 'combat' ? 'panel-combat-right' : 'panel-' + tab;
  const rightPanel = document.getElementById(rightId);
  if (rightPanel) rightPanel.style.display = 'flex';
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const btn = document.getElementById('tab-' + tab);
  if (btn) btn.classList.add('active');
  renderAll();
}
