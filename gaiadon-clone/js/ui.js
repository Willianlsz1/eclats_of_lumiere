// ===== Renderização (DOM) =====
// A UI só LÊ o estado e desenha. Nunca decide regra de jogo.
const $ = id => document.getElementById(id);

// fmt() e fmtMult() vêm de data.js (global). Usar aquelas versões.
const fmtCap = cap => (cap === Infinity ? "∞" : fmt(cap));

// Helpers de acesso a assets — usam a região como objeto.
function emojiFor(region, enemyName) {
  // Procura o emoji na lista de inimigos da região.
  var enemies = region.enemies || [];
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].name === enemyName) return enemies[i].emoji;
  }
  // Fallback: boss
  if (region.boss && region.boss.name === enemyName) return region.boss.emoji;
  return "👾";
}
function cssFor(region) { return region.cssClass || ""; }
function enemyAssetFor(region, enemyName) {
  const path = ASSETS.enemies[enemyName];
  return path && assetExists(path) ? path : null;
}
function regionBgFor(region) {
  const path = ASSETS.backgrounds[region.id];
  return path && assetExists(path) ? path : null;
}
function equipAssetFor(slotId) {
  const path = ASSETS.equipment[slotId];
  return path && assetExists(path) ? path : null;
}
function heroPortraitFor(tierColor) {
  const path = ASSETS.hero[tierColor];
  return path && assetExists(path) ? path : null;
}

// Log multi-linha
const _logLines = [];
function logMsg(msg, cls) {
  _logLines.unshift({ msg, cls });
  if (_logLines.length > 4) _logLines.pop();
  $("combatLog").innerHTML = _logLines.map((l, i) =>
    `<p class="log${l.cls ? " " + l.cls : ""}" style="opacity:${(1 - i * 0.22).toFixed(2)}">${l.msg}</p>`
  ).join("");
}

function renderResources(s) {
  $("gold").textContent = fmt(s.gold);
  $("shards").textContent = fmt(s.shards);
  $("level").textContent = s.level;
}

// ═══════════════════════════════════════════════════════════════════════
// Combat View — 2-panel layout: hero card + enemy grid + wave progress
// ═══════════════════════════════════════════════════════════════════════
function renderCombat(s) {
  const region = REGIONS[s.region];
  const diff   = DIFFICULTIES[s.difficulty];
  const pack   = s.enemies || [];
  const target = pack[0];
  const waves  = totalWaves(s.difficulty);
  const boss   = isBossWave(s.wave, s.difficulty);

  // ── Top bar: region + difficulty + wave ──
  $("regionName").textContent = region.name;
  $("navDifficulty").textContent = diff.name;
  $("navDifficulty").className = "nav-difficulty " + diff.cssClass;
  $("navWave").textContent = boss ? `Boss Wave` : `Wave ${s.wave}/${waves}`;

  // ── Hero card (left panel) ──
  const tier = heroTier(s);
  const t = TIERS[tier];
  const tierColor = ["common","uncommon","rare","epic","legendary"][tier];
  const maxHp = playerMaxHp(s);
  const hp = Math.max(0, s.playerHp == null ? maxHp : s.playerHp);
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const need = xpToNext(s);
  const xpPct = Math.min(100, (s.xp / need) * 100);
  const portraitPath = heroPortraitFor(tierColor);
  const portrait = portraitPath
    ? `<img class="hc-portrait tier-${tierColor}" src="${portraitPath}" alt="${t.name}">`
    : `<div class="hc-portrait-emoji">🦸</div>`;

  $("heroCard").innerHTML = `
    ${portrait}
    <div class="hc-name rar-${tierColor}">${t.name}</div>
    <div class="hc-level">Lv. ${s.level}</div>
    <div class="hc-stats">
      <div class="hc-stat"><span class="hc-stat-icon">⚔️</span><span>${fmt(playerDamage(s))}</span></div>
      <div class="hc-stat"><span class="hc-stat-icon">❤️</span><span>${fmt(maxHp)}</span></div>
      <div class="hc-stat"><span class="hc-stat-icon">⚡</span><span>${fmt(playerDps(s))} DPS</span></div>
    </div>
    <div class="hc-bar-group">
      <small class="hc-bar-label">HP ${fmt(hp)}/${fmt(maxHp)}</small>
      <div class="hc-bar hp"><div class="hc-bar-fill hp" style="width:${hpPct}%"></div></div>
      <small class="hc-bar-label">XP ${fmt(s.xp)}/${fmt(need)}</small>
      <div class="hc-bar xp"><div class="hc-bar-fill xp" style="width:${xpPct}%"></div></div>
    </div>`;

  // ── Enemy grid (right panel) ──
  if (target) {
    const isBossEnemy = !!target.isBoss;
    const regionCls = cssFor(region);
    const regionBg = regionBgFor(region);
    const bgCls = regionBg ? " region-bg" : "";
    $("enemyCard").className = "enemy-card" + (isBossEnemy ? " boss-card" : "") + (regionCls ? " " + regionCls : "") + bgCls;
    $("enemyCard").style.backgroundImage = regionBg ? `url('${regionBg}')` : "";

    const isSolo = pack.length === 1;
    const gridHtml = pack.map((e, i) => {
      const isTarget  = i === 0;
      const dead      = e.hp <= 0;
      const eIsBoss   = !!e.isBoss;
      const eIsElite  = e.tier === "elite";
      const eIsChamp  = e.tier === "champion";
      const eHpPct    = Math.max(0, (e.hp / e.maxHp) * 100);
      const tierLabel = eIsChamp ? "Champion " : eIsElite ? "Elite " : "";
      const unitCls = "enemy-unit"
        + (isSolo   ? " solo"     : "")
        + (isTarget ? " target"   : "")
        + (dead     ? " dead"     : "")
        + (eIsBoss  ? " boss"     : eIsChamp ? " champion" : eIsElite ? " elite" : "");
      const eImg = enemyAssetFor(region, e.name);
      const spriteId = isTarget ? ' id="enemySprite"' : '';
      const visual = eImg
        ? `<img class="enemy-unit-img"${spriteId} src="${eImg}" alt="${e.name}">`
        : `<div class="enemy-unit-emoji"${spriteId}>${
            eIsBoss ? "👑" : eIsChamp ? "💀" : eIsElite ? "⚔️" : emojiFor(region, e.name)
          }</div>`;
      const nameId = isTarget ? ' id="enemyName"' : '';
      return `<div class="${unitCls}">
        <div class="enemy-unit-visual">${visual}</div>
        <div class="enemy-unit-name"${nameId}>${tierLabel}${e.name}</div>
        <div class="enemy-unit-hpbar">
          <div class="enemy-unit-hpfill${eIsBoss ? ' boss' : ''}" style="width:${eHpPct}%"></div>
          <span>${fmt(Math.max(0, e.hp))}/${fmt(e.maxHp)}</span>
        </div>
      </div>`;
    }).join("");
    $("enemyGrid").innerHTML = gridHtml;
  }

  // ── Wave progress bar ──
  const needed = boss ? 1 : killsPerWave();
  const killPct = needed > 0 ? Math.min(100, (s.killsInWave / needed) * 100) : 0;
  $("kills").textContent = s.killsInWave;
  $("killsNeeded").textContent = needed;
  $("killProgressFill").style.width = killPct + "%";
}

// ═══════════════════════════════════════════════════════════════════════
// World Map View — regiões selecionáveis com dificuldades
// ═══════════════════════════════════════════════════════════════════════
function renderMap(s) {
  const grid = $("mapGrid");
  if (!grid) return;

  grid.innerHTML = REGIONS.map((region, idx) => {
    const unlocked = isRegionUnlocked(s, idx);
    const active   = s.region === idx;
    const mastered = isRegionMastered(s, idx);

    if (!unlocked) {
      const prevName = idx > 0 ? REGIONS[idx - 1].name : "";
      return `<div class="map-region locked">
        <div class="map-region-icon">🔒</div>
        <div class="map-region-name">${region.name}</div>
        <div class="map-region-desc">Clear ${prevName} to unlock</div>
      </div>`;
    }

    const diffBtns = DIFFICULTIES.map((d, di) => {
      const isUnlocked = isDifficultyUnlocked(s, idx, di);
      const isCleared  = isDifficultyCleared(s, idx, di);
      const isCurrent  = active && s.difficulty === di;
      const cls = "map-diff-btn " + d.cssClass
        + (isCleared ? " cleared" : "")
        + (isCurrent ? " current" : "");
      return `<button class="${cls}"
        data-region="${idx}" data-diff="${di}"
        ${isUnlocked ? "" : "disabled"}>
        ${d.name} ${isCleared ? "✓" : isUnlocked ? "" : "🔒"}
      </button>`;
    }).join("");

    const clearedCount = (s.regionProgress[idx] || []).length;
    const starStr = DIFFICULTIES.map((d, di) =>
      isDifficultyCleared(s, idx, di) ? "★" : isDifficultyUnlocked(s, idx, di) ? "☆" : "·"
    ).join(" ");

    return `<div class="map-region ${active ? "active" : ""} ${mastered ? "mastered" : ""}">
      <div class="map-region-header">
        <span class="map-region-icon">${region.icon}</span>
        <span class="map-region-name">${region.name}</span>
        ${mastered ? '<span class="map-mastered-badge">⭐ Mastered</span>' : ""}
      </div>
      <div class="map-region-desc">${region.description}</div>
      <div class="map-region-stars">${starStr}</div>
      <div class="map-region-power">Base Power: ${fmt(region.startPower)}</div>
      <div class="map-difficulties">${diffBtns}</div>
    </div>`;
  }).join("");
}

// ═══════════════════════════════════════════════════════════════════════
// Gold Stats View (Train)
// ═══════════════════════════════════════════════════════════════════════
function renderGoldStats(s) {
  var el = $("goldStatsGrid");
  if (!el) return;

  el.innerHTML = GOLD_STATS.map(function(def) {
    var level = (s.goldStats && s.goldStats[def.id]) || 0;
    var cost = goldStatCost(def.id, level);
    var canBuy = s.gold >= cost;
    var bonus = goldStatBonus(s, def.id);
    var preview = buyGoldStatMaxPreview(s, def.id);

    // Formata o bônus conforme o tipo de stat.
    var bonusStr;
    if (def.stat === "critRate")   bonusStr = "+" + (bonus * 100).toFixed(1) + "% crit";
    else if (def.stat === "goldMult" || def.stat === "xpMult")
      bonusStr = "+" + (bonus * 100).toFixed(0) + "%";
    else if (def.stat === "atkSpeed") bonusStr = "+" + bonus.toFixed(2) + " speed";
    else bonusStr = "+" + fmt(bonus);

    return '<div class="gs-card">'
      + '<div class="gs-header">'
      +   '<span class="gs-icon">' + def.icon + '</span>'
      +   '<span class="gs-name">' + def.name + '</span>'
      +   '<span class="gs-level">Lv. ' + level + '</span>'
      + '</div>'
      + '<div class="gs-desc">' + def.desc + '</div>'
      + '<div class="gs-bonus">Current: ' + bonusStr + '</div>'
      + '<div class="gs-actions">'
      +   '<button class="gs-buy-btn" onclick="buyGoldStat(state,\'' + def.id + '\');renderAfterBuy()"'
      +     (canBuy ? '' : ' disabled') + '>'
      +     'Buy +1<span class="gs-cost">💰 ' + fmt(cost) + '</span>'
      +   '</button>'
      +   '<button class="gs-buy-btn" onclick="buyGoldStatMax(state,\'' + def.id + '\');renderAfterBuy()"'
      +     (preview.count > 0 ? '' : ' disabled') + '>'
      +     'Buy Max (' + preview.count + ')<span class="gs-cost">💰 ' + fmt(preview.spent) + '</span>'
      +   '</button>'
      + '</div>'
      + '</div>';
  }).join("");
}

// Helper: re-render tudo que importa após compra de gold stat.
function renderAfterBuy() {
  scheduleRender(new Set(["resources", "goldStats", "hero"]), state);
}


// ═══════════════════════════════════════════════════════════════════════
// Stats View (Character)
// ═══════════════════════════════════════════════════════════════════════
function renderHero(s) {
  $("heroLevel").textContent = s.level;
  const need = xpToNext(s);
  $("xpFill").style.width = Math.min(100, (s.xp / need) * 100) + "%";
  $("xpText").textContent = fmt(s.xp) + " / " + fmt(need) + " XP";
  $("statDamage").textContent  = fmt(playerDamage(s));
  $("statHealth").textContent  = fmt(playerMaxHp(s));
  const spd = attackSpeed(s);
  $("statSpeed").textContent   = (spd < 100 ? spd.toFixed(2) : fmt(Math.round(spd))) + "/s";
  $("statCritRate").textContent = Math.round(critRate(s) * 100) + "%";
  $("statCritDmg").textContent = "×" + fmtMult(critMult(s));
  $("statDps").textContent     = fmt(playerDps(s));
  $("statGold").textContent      = "×" + fmtMult(goldBonus(s));
  $("statShardFind").textContent = "×" + fmtMult(shardBonus(s));
  $("statXp").textContent        = "×" + fmtMult(xpMultiplier(s));
  const bossPct = Math.round((bossDmgMult(s) - 1) * 100);
  $("statBossDmg").textContent   = "+" + fmt(bossPct) + "%";
  const dpl = damagePerLevel(s), hpl = hpPerLevel(s);
  const f1 = n => n < 100 ? n.toFixed(1) : fmt(n);
  const tier = heroTier(s);
  const t = TIERS[tier];
  const tierColor = ["common","uncommon","rare","epic","legendary"][tier];

  const portraitPath = heroPortraitFor(tierColor);
  const portraitEl = $("heroPortrait");
  if (portraitEl) {
    portraitEl.innerHTML = `
      <div class="hero-portrait-wrap">
        ${portraitPath
          ? `<img class="hero-portrait tier-${tierColor}" src="${portraitPath}" alt="${t.name}">`
          : `<div class="hero-portrait-emoji">🦸</div>`}
        <div class="hero-portrait-info">
          <div class="hero-portrait-name">${t.name}</div>
          <div class="hero-portrait-tier rar-${tierColor}">${tierColor.toUpperCase()} TIER</div>
          <div class="hero-portrait-mult">Ascension bonus: ×${t.mult.toFixed(2)}</div>
        </div>
      </div>`;
  }

  $("heroFoot").innerHTML =
    `<div class="stats-header" style="margin-top:6px">GROWTH</div>
     <div class="hero-foot-row">
       <span class="hero-foot-label">Dmg / Level</span>
       <span>+${f1(dpl)}</span>
     </div>
     <div class="hero-foot-row">
       <span class="hero-foot-label">HP / Level</span>
       <span>+${f1(hpl)}</span>
     </div>
     <div class="hero-foot-row">
       <span class="hero-foot-label">Per ascension</span>
       <span class="rar-${tierColor}">×${t.mult.toFixed(2)} &nbsp;<small>(${t.name})</small></span>
     </div>`;
}

// Nome amigável de cada afixo para a UI.
const AFFIX_NAMES = { critRate: "Crit Rate", critDmg: "Crit Dmg", dmgMult: "Damage", hpMult: "Health", goldMult: "Gold", xpMult: "XP", shardMult: "Shard Find", bossDmg: "Boss Dmg" };
function affixLabel(a, level) {
  const pct = affixValue(a, level) * 100;
  const shown = pct >= 1000 ? fmt(Math.round(pct)) : pct >= 100 ? Math.round(pct) : pct.toFixed(1);
  return `+${shown}% ${AFFIX_NAMES[a.stat]}`;
}

const SLOT_ICONS = { Weapon: "⚔️", Armor: "🛡️", Amulet: "📿", Ring: "💍", Gloves: "🧤", Helmet: "⛑️" };

function renderEquipment(s) {
  const el = $("equipment");
  el.innerHTML = SLOTS.map(slot => {
    const it = s.equipped[slot.id];
    const rarity = RARITIES[it.rarity];
    const cap = rarity.cap;
    const atCap = it.level >= cap;
    const lvCost = levelUpCost(s, slot.id);
    const canLv = canLevelUp(s, slot.id);
    const maxRarity = it.rarity >= RARITIES.length - 1;
    const rCost = rarityUpCost(s, slot.id);
    const canRr = canRarityUp(s, slot.id);
    const power = itemPower(it);
    const pct = cap === Infinity ? 100 : Math.min(100, (it.level / cap) * 100);

    const maxPrev = atCap ? { count: 0, spent: 0 } : levelUpMaxPreview(s, slot.id);
    const lvBtn = atCap
      ? `<button disabled title="Raise rarity to unlock more levels">Level cap</button>`
      : `<button class="lvl-btn" data-act="level" data-slot="${slot.id}" ${canLv ? "" : "disabled"}>💰 ${fmt(lvCost)} ▲1</button>`;
    const maxBtn = atCap
      ? ""
      : `<button class="lvl-btn" data-act="max" data-slot="${slot.id}" ${maxPrev.count > 0 ? "" : "disabled"}>MAX +${fmt(maxPrev.count)} (💰 ${fmt(maxPrev.spent)})</button>`;

    const rrBtn = maxRarity
      ? `<button disabled>Max rarity</button>`
      : `<button class="rarity-btn" data-act="rarity" data-slot="${slot.id}" ${canRr ? "" : "disabled"}>💎 ${fmt(rCost)}${atCap ? "" : " (reach cap)"}</button>`;

    const affixes = getDisplayAffixes(slot.id, it.rarity, it.level);
    const affixHtml = affixes.length
      ? `<div class="equip-affixes">${affixes.map(a => `<span class="affix">${affixLabel(a.raw, it.level)}</span>`).join("")}</div>`
      : `<div class="equip-affixes empty"><span class="affix-empty">No affixes — raise rarity</span></div>`;

    return `<div class="equip-slot rar-edge-${rarity.name}">
      <div class="equip-header">
        <div class="equip-identity">
          <span class="equip-slot-label">${slot.id}</span>
          <span class="equip-item-name rar-${rarity.name}">${(function() {
            const eqImg = equipAssetFor(slot.id);
            return eqImg
              ? `<img src="${eqImg}" alt="${slot.id}" class="equip-icon">`
              : `<span class="equip-icon-emoji">${SLOT_ICONS[slot.id] || "⚙️"}</span>`;
          })()} ${slot.defaultName} · ${rarity.name}</span>
          <span class="equip-stat-gives">gives ${slot.stats.join(" + ")}</span>
        </div>
        <span class="equip-power"><span class="equip-power-icon">⚙</span>${fmt(power)}</span>
      </div>
      <div class="equip-level-row">
        <span class="equip-level-text">Lv ${fmt(it.level)} / ${fmtCap(cap)}</span>
        <div class="equip-level-bar"><div class="equip-level-fill rarity-fill-${rarity.name}" style="width:${pct.toFixed(1)}%"></div></div>
        <span class="equip-level-pct">${cap === Infinity ? "∞" : Math.round(pct) + "%"}</span>
      </div>
      ${affixHtml}
      <div class="equip-actions">${lvBtn}${maxBtn}</div>
      <div class="equip-actions">${rrBtn}</div>
    </div>`;
  }).join("");
}

function renderAscend(s) {
  const asc = getAscensionStatus(s);
  const t = TIERS[asc.tier];
  $("ascCount").textContent = "×" + s.ascensions;

  const inTier   = s.ascensions - t.minAsc;
  const tierSize = asc.nextTier ? asc.nextTier.minAsc - t.minAsc : null;
  const pct      = tierSize ? Math.min(100, (inTier / tierSize) * 100) : 100;
  const tierColor = ["common", "uncommon", "rare", "epic", "legendary"][asc.tier];

  let html = `
    <div class="asc-tier-name rar-${tierColor}">${asc.tierName}</div>
    <div class="asc-bar-wrap">
      <div class="asc-bar-fill rarity-fill-${tierColor}" style="width:${pct.toFixed(1)}%"></div>
      <span class="asc-bar-text">
        ${asc.nextTier ? `${inTier} / ${tierSize} ascensions` : `${inTier} ascensions — MAX TIER`}
      </span>
    </div>`;

  if (asc.nextTier) {
    html += `<div class="asc-next-tier">
      Next tier: <b class="rar-${["common","uncommon","rare","epic","legendary"][asc.tier+1]}">${asc.nextTier.name}</b>
      at ${fmt(asc.nextTier.minAsc)} ascensions
      <span class="asc-spike">→ Power Spike ×${fmt(asc.nextTier.spike)}</span>
    </div>`;
  }

  html += `<div class="asc-mult-info">
    Each ascension: <b>×${asc.tierMult.toFixed(2)}</b> to all stats ·
    Current power: <b>×${fmt(asc.currentPowerMult)}</b>
    <small class="asc-compound-hint">(×${asc.compoundPreview.toFixed(1)} after 10 more)</small>
  </div>`;

  // Requisitos: nível + stages
  const levelOk  = s.level >= asc.levelReq;
  const stageOk  = asc.stagesCleared >= asc.stagesRequired;
  const levelGap = asc.levelReq - s.level;
  const stageGap = asc.stagesRequired - asc.stagesCleared;

  html += `<div class="asc-req-row">
    <span class="asc-req ${levelOk ? 'req-ok' : 'req-missing'}">
      ⭐ Level ${asc.levelReq}
      &nbsp;${levelOk ? '✓' : `— ${levelGap} level${levelGap > 1 ? 's' : ''} to go`}
    </span>
    <span class="asc-req ${stageOk ? 'req-ok' : 'req-missing'}">
      🗺️ ${asc.stagesCleared}/${asc.stagesRequired} stages cleared
      &nbsp;${stageOk ? '✓' : `— ${stageGap} more to clear`}
    </span>
  </div>`;

  $("ascTierDisplay").innerHTML = html;
  $("ascendBtn").disabled = !asc.canAscend;

  if (asc.canAscend) {
    $("ascInfo").innerHTML = asc.isTierPromo
      ? `<b class="milestone-text">🎉 TIER UP! You're becoming ${asc.nextTier.name}! Spike ×${fmt(asc.nextTier.spike)} awaits!</b>`
      : `<b>✓ KEEP</b> all equipment & map progress · <b>✗ RESET</b> gold, level &amp; wave · you'll rebuild faster!`;
  } else {
    $("ascInfo").innerHTML = `Clear more stages on the 🗺️ Map and reach level ${asc.levelReq} to unlock ascension #${asc.ascensionNumber}.`;
  }

  // ── Convergence panel ──
  const cv = getConvergenceStatus(s);
  const cvGainStr = cv.gainPct >= 0.1 ? `+${cv.gainPct.toFixed(1)}%` : "<0.1%";
  const nextSpike = CONFIG.convergence.spikeInterval - (cv.convergences % CONFIG.convergence.spikeInterval);
  $("cvCount").textContent   = cv.convergences;
  $("cvCurrent").textContent = "×" + fmt(cv.currentMult);
  $("cvNext").textContent    = "×" + fmt(cv.nextMult) + " (" + cvGainStr + ")";
  $("cvSpikeIn").textContent = nextSpike + (nextSpike === 1 ? " convergence" : " convergences");
  $("convergeBtn").className = cv.recommended ? "converge-btn converge-recommended" : "converge-btn";
  $("cvHint").textContent    = cv.recommended
    ? "⚡ Recommended — significant power spike incoming!"
    : "Converge any time to bank your current mult.";
}

// Floating damage number.
function spawnFloatingDamage(amount, isBoss, isCrit) {
  const stage = $("combatStage");
  if (!stage) return;
  const el = document.createElement("span");
  el.className = "floating-dmg" + (isBoss ? " boss" : "") + (isCrit ? " crit" : "");
  el.textContent = (isCrit ? "💥 " : "-") + fmt(amount);
  el.style.left = (40 + Math.random() * 20) + "%";
  stage.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function flashSlot(slotId) {
  const el = [...document.querySelectorAll(".equip-slot")].find(d => d.querySelector("small") && d.innerText.startsWith(slotId));
  if (el) { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 700); }
}

function renderSynergy(s) {
  const syn       = synergyLevel(s);
  const bonus     = synergyBonusMult(s);
  const surges    = synergySurgeCount(s);
  const surgeMult = synergySurgeMult(s);
  const total     = totalPowerMult(s);
  const interval  = CONFIG.synergy.surgeInterval;
  const nextSurge = (surges + 1) * interval;
  const pct       = ((syn % interval) / interval) * 100;

  $("synergyLevel").textContent     = fmt(syn);
  $("synergySurgeCount").textContent = surges;
  $("synergyBonusStat").textContent  = "+" + Math.round((bonus - 1) * 100) + "%";
  $("synergyTotalMult").textContent  = "×" + total.toFixed(2);
  $("synergySurgeMult").textContent  = "×" + surgeMult.toFixed(2);
  $("synergyProgressFill").style.width = pct.toFixed(1) + "%";
  $("synergyNextSurge").textContent  = surges === 0
    ? `First surge at level ${interval}`
    : `Next surge at level ${fmt(nextSurge)}`;
}

function showOfflineSummary(g) {
  const h = Math.floor(g.seconds / 3600);
  const m = Math.floor((g.seconds % 3600) / 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
  $("offlineText").innerHTML =
    `While you were away (<b>${time}</b>):<br>` +
    `💰 +${fmt(g.lumens)} Lumens · 💎 +${fmt(g.vestiges)} Vestiges · ⭐ +${fmt(g.xp)} XP<br>` +
    `<small>(${fmt(g.kills)} kills simulated)</small>`;
  $("offlineModal").classList.remove("hidden");
}

// renderAll lives in render.js (render dispatch module).

// ═══════════════════════════════════════════════════════════════════════
// Passives View — 3 árvores permanentes
// ═══════════════════════════════════════════════════════════════════════
function renderPassives(s) {
  var el = $("passivesPanel");
  if (!el) return;

  var TREE_META = {
    eclat:    { name: "Éclat",   icon: "⚔️",  desc: "Combat — Absorbing fragments of Or Ein Sof" },
    vestige:  { name: "Vestige", icon: "💜",  desc: "Economy — Power from defeated creatures" },
    fracture: { name: "Fracture",icon: "🌑",  desc: "Utility — Understanding the nature of Nihel" },
  };

  var byTree = { eclat: [], vestige: [], fracture: [] };
  PASSIVES.forEach(function(def) { if (byTree[def.tree]) byTree[def.tree].push(def); });

  el.innerHTML = Object.keys(TREE_META).map(function(treeKey) {
    var meta  = TREE_META[treeKey];
    var nodes = byTree[treeKey];

    var nodesHtml = nodes.map(function(def) {
      var lv       = passiveLevel(s, def.id);
      var unlocked = passiveUnlocked(s, def.id);
      var maxed    = lv >= def.maxLevel;
      var cost     = passiveCost(def.id, lv);
      var canBuy   = canBuyPassive(s, def.id);

      var reqParts = [];
      if (!unlocked) {
        if (def.mapReq > 1) reqParts.push('<span class="pn-req-tag">🗺️ Map ' + def.mapReq + '</span>');
        if (def.killsReq > 0) reqParts.push('<span class="pn-req-tag">⚔️ ' + def.killsReq.toLocaleString('en-US') + ' kills</span>');
      }
      var reqHtml = reqParts.length ? '<div class="pn-reqs">' + reqParts.join("") + '</div>' : "";

      var btnLabel = maxed
        ? "Maxed"
        : "Unlock +1 <span class='pn-cost'>💎 " + fmt(cost) + "</span>";
      var btnCls = "pn-btn" + (canBuy ? " can-buy" : "") + (maxed ? " maxed" : "");

      var nodeCls = "passive-node"
        + (lv > 0    ? " owned"    : "")
        + (!unlocked ? " locked"   : "")
        + (maxed     ? " maxed"    : "");

      return '<div class="' + nodeCls + '">'
        + '<div class="pn-header">'
        +   '<span class="pn-icon">'   + def.icon  + '</span>'
        +   '<span class="pn-name">'   + def.name  + '</span>'
        +   '<span class="pn-level">Lv ' + lv + '/' + def.maxLevel + '</span>'
        + '</div>'
        + '<div class="pn-desc">' + def.desc + '</div>'
        + reqHtml
        + '<button class="' + btnCls + '" data-passive-id="' + def.id + '"'
        +   (canBuy && !maxed ? '' : ' disabled') + '>'
        +   btnLabel
        + '</button>'
        + '</div>';
    }).join("");

    return '<div class="passive-tree">'
      + '<div class="tree-header">'
      +   '<span class="tree-icon">' + meta.icon + '</span>'
      +   '<div class="tree-title">' + meta.name + '</div>'
      +   '<div class="tree-desc">'  + meta.desc  + '</div>'
      + '</div>'
      + '<div class="tree-nodes">' + nodesHtml + '</div>'
      + '</div>';
  }).join("");
}
