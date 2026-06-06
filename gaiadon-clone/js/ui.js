// ===== Renderização (DOM) =====
// A UI só LÊ o estado e desenha. Nunca decide regra de jogo.
const $ = id => document.getElementById(id);

const fmt = n => {
  n = Math.floor(n);
  if (n < 1000) return "" + n;
  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(1) + units[i];
};
const fmtCap = cap => (cap === Infinity ? "∞" : fmt(cap));

// Formata um MULTIPLICADOR de forma legível em qualquer escala:
//   <10     → ×2.34   (2 casas decimais)
//   ≥10     → ×2.3K, ×1.5M … (usa fmt para abreviar)
// Padroniza todos os stats que escalam multiplicativamente.
const fmtMult = x => x < 10 ? x.toFixed(2) : fmt(Math.round(x));

// Emoji e CSS de região agora vivem em REGIONS (data.js) — fonte única.
// Helpers de acesso: emojiFor(region, name), cssFor(region), enemyAsset(region, name).
function emojiFor(region, enemyName) {
  return (region.emojis && region.emojis[enemyName]) || "👾";
}
function cssFor(region) {
  return region.cssClass || "";
}
// Retorna o path da imagem do inimigo, ou null se não existir.
function enemyAssetFor(region, enemyName) {
  const regionKey = (region.cssClass || "").replace("region-", "");
  const enemies = ASSETS.enemies[regionKey];
  const path = enemies && enemies[enemyName];
  return path && assetExists(path) ? path : null;
}
// Retorna o path do background da região, ou null.
function regionBgFor(region) {
  const path = ASSETS.regions[region.cssClass];
  return path && assetExists(path) ? path : null;
}
// Retorna o path da imagem do equipamento, ou null.
function equipAssetFor(slotId) {
  const path = ASSETS.equipment[slotId];
  return path && assetExists(path) ? path : null;
}
// Retorna o path do retrato do herói para o tier atual, ou null.
function heroPortraitFor(tierColor) {
  const path = ASSETS.hero[tierColor];
  return path && assetExists(path) ? path : null;
}

// Log multi-linha: mostra as últimas 4 mensagens com fade nas antigas
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

function renderCombat(s) {
  const region = regionFor(s.zone);
  $("regionName").textContent = region.name;
  $("zone").textContent = s.zone;
  $("zoneName").textContent = zoneName(s.zone);
  const pack = s.enemies || [];
  const target = pack[0];

  if (target) {
    // Enemy card: ilustração (ou emoji fallback), nome e HP
    const isBoss = !!target.isBoss;
    const isElite    = target.tier === "elite";
    const isChampion = target.tier === "champion";

    // Tenta usar asset de imagem; fallback para emoji
    const enemyImg = enemyAssetFor(region, target.name);
    const visualEl = $("enemyVisual");
    if (enemyImg) {
      const imgCls = "enemy-img" + (isBoss ? " boss-img" : isElite ? " elite-img" : isChampion ? " champion-img" : "");
      visualEl.innerHTML = `<img src="${enemyImg}" alt="${target.name}" class="${imgCls}" id="enemySprite">`;
    } else {
      const emoji = isBoss ? "👑" : isChampion ? "💀" : isElite ? "⚔️" : emojiFor(region, target.name);
      visualEl.innerHTML = `<div class="enemy-emoji" id="enemySprite">${emoji}</div>`;
    }

    // Prefixo de tier no nome
    const tierLabel = isChampion ? "Champion " : isElite ? "Elite " : "";
    $("enemyName").textContent = tierLabel + target.name;
    $("enemyName").className = "enemy-name" + (isBoss ? " boss" : isChampion ? " champion" : isElite ? " elite" : "");

    // Classe do card: boss / elite / champion + cor de região + background image
    const regionCls = cssFor(region);
    const tierCardCls = isChampion ? " champion-card" : isElite ? " elite-card" : "";
    const regionBg = regionBgFor(region);
    const bgCls = regionBg ? " region-bg" : "";
    $("enemyCard").className = "enemy-card" + (isBoss ? " boss-card" : tierCardCls) + (regionCls ? " " + regionCls : "") + bgCls;
    if (regionBg) {
      $("enemyCard").style.backgroundImage = `url('${regionBg}')`;
    } else {
      $("enemyCard").style.backgroundImage = "";
    }

    // HP do inimigo
    const hpPct = Math.max(0, (target.hp / target.maxHp) * 100);
    $("enemyHpFill").style.width = hpPct + "%";
    $("enemyHpFill").className = "hpfill" + (isBoss ? " boss" : "");
    $("enemyHpText").textContent = fmt(Math.max(0, target.hp)) + "/" + fmt(target.maxHp);
  }

  // Pack: mini-barras dos inimigos que atacam juntos
  const ps = packSize(s.zone);
  if (ps > 1) {
    const packLabel = ps >= 7 ? `🔥 Horde of ${ps} — all attacking!`
                    : ps >= 5 ? `⚠️ Pack of ${ps} — all attacking!`
                    :           `👥 Pack of ${ps} — all attacking!`;
    $("packInfo").innerHTML =
      `<small class="pack-label${ps >= 7 ? ' horde' : ps >= 5 ? ' large' : ''}">${packLabel}</small>` +
      pack.map((e, i) => {
        const p = Math.max(0, (e.hp / e.maxHp) * 100);
        const tierCls = e.tier === "champion" ? " champion" : e.tier === "elite" ? " elite" : "";
        return `<div class="pack-mini${i === 0 ? " target" : ""}${tierCls}"><div style="width:${p}%"></div></div>`;
      }).join("");
  } else {
    $("packInfo").innerHTML = "";
  }

  // Barra de progresso da zone
  const needed = (target && target.isBoss) ? 1 : killsToClear(s.zone);
  const killPct = needed > 0 ? Math.min(100, (s.killsInZone / needed) * 100) : 0;
  $("kills").textContent = s.killsInZone;
  $("killsNeeded").textContent = needed;
  $("killProgressFill").style.width = killPct + "%";

  // Zone Mastery progress para a zona atual
  renderMastery(s);

  // HP do jogador
  const maxHp = playerMaxHp(s);
  const hp = Math.max(0, s.playerHp == null ? maxHp : s.playerHp);
  $("playerHpFill").style.width = Math.max(0, (hp / maxHp) * 100) + "%";
  $("playerHpText").textContent = fmt(hp) + "/" + fmt(maxHp);

  // Indicador de perigo: compara DPS do inimigo com HP do jogador.
  // (maxHp já foi calculado acima para a barra de HP do jogador)
  const packDps  = (pack.reduce((a, e) => a + e.dmg, 0)) * CONFIG.enemy.damageFactor;
  const survSec  = maxHp / Math.max(1, packDps);
  const isFrontier = s.zone > accessibleDepth(s);
  let dangerHtml = "";
  if (packDps > 0) {
    let label, cls;
    if      (survSec < 15)  { label = "⚠️ Lethal — you'll die in under 15s"; cls = "danger-lethal"; }
    else if (survSec < 60)  { label = "🔥 Dangerous — survive ~" + Math.round(survSec) + "s";  cls = "danger-high"; }
    else if (survSec < 300) { label = "⚡ Moderate — survive ~" + Math.round(survSec) + "s"; cls = "danger-mid"; }
    else                    { label = isFrontier ? "✅ Safe frontier" : "💤 Farming zone"; cls = "danger-low"; }
    dangerHtml = `<span class="danger-badge ${cls}">${label}</span>`;
  }
  $("zoneDanger").innerHTML = dangerHtml;

  // Navegação de zone: entre 1 e a fronteira (accessibleDepth+1).
  $("prevZone").disabled = s.zone <= 1;
  $("nextZone").disabled = s.zone >= accessibleDepth(s) + 1;
}

function renderHero(s) {
  $("heroLevel").textContent = s.level;
  const need = xpToNext(s);
  $("xpFill").style.width = Math.min(100, (s.xp / need) * 100) + "%";
  $("xpText").textContent = fmt(s.xp) + " / " + fmt(need) + " XP";
  $("statDamage").textContent  = fmt(playerDamage(s));
  $("statHealth").textContent  = fmt(playerMaxHp(s));
  // Attack Speed: decimais só quando < 100 (evita "1234.56/s")
  const spd = attackSpeed(s);
  $("statSpeed").textContent   = (spd < 100 ? spd.toFixed(2) : fmt(Math.round(spd))) + "/s";
  $("statCritRate").textContent = Math.round(critRate(s) * 100) + "%";
  $("statCritDmg").textContent = "×" + fmtMult(critMult(s));
  $("statDps").textContent     = fmt(playerDps(s));
  // Multiplicadores de economia: todos no formato ×X para consistência visual
  $("statGold").textContent      = "×" + fmtMult(goldBonus(s));
  $("statShardFind").textContent = "×" + fmtMult(shardBonus(s));
  $("statXp").textContent        = "×" + fmtMult(xpMultiplier(s));
  // Boss Damage permanece em % (valor tipicamente <1000% e semanticamente é bônus)
  const bossPct = Math.round((bossDmgMult(s) - 1) * 100);
  $("statBossDmg").textContent   = "+" + fmt(bossPct) + "%";
  const dpl = damagePerLevel(s), hpl = hpPerLevel(s);
  const f1 = n => n < 100 ? n.toFixed(1) : fmt(n);
  const tier = heroTier(s);
  const t = TIERS[tier];
  const tierColor = ["common","uncommon","rare","epic","legendary"][tier];

  // Hero portrait (image or emoji fallback)
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

function renderMastery(s) {
  const el = $("masteryTrack");
  if (!el) return;
  const zone = s.zone;
  if (isBossZone(zone)) { el.innerHTML = ""; return; } // boss zones não têm mastery
  const kills  = masteryKills(s, zone);
  const needed = killsToMaster(zone);
  const mastered = kills >= needed;
  const total  = masteredZoneCount(s);
  const pct    = mastered ? 100 : Math.min(100, (kills / needed) * 100);
  const bonusPct = Math.round(total * CONFIG.mastery.bonusPerZone * 100);
  el.innerHTML = `
    <div class="mastery-row">
      <span class="mastery-label">${mastered ? "⭐ Mastered" : "📚 Mastery"}</span>
      <span class="mastery-count">${mastered ? "" : kills + " / " + needed}</span>
      <span class="mastery-total ${bonusPct > 0 ? "has-bonus" : ""}">${total > 0 ? "★ " + total + " zones · +" + bonusPct + "% econ" : "Master a zone for farming bonus"}</span>
    </div>
    ${mastered ? "" : `<div class="mastery-bar"><div class="mastery-fill" style="width:${pct.toFixed(1)}%"></div></div>`}`;
}

function renderNextGoal(s) {
  const isBoss = s.enemies && s.enemies[0] && s.enemies[0].isBoss;
  const needed = isBoss ? 1 : killsToClear(s.zone);
  const left = Math.max(0, needed - s.killsInZone);
  if (!isBoss && s.zone <= accessibleDepth(s)) {
    $("nextGoal").textContent = `Farming ${zoneName(s.zone)} (cleared) · deepest: ${zoneName(s.maxZone)}`;
    return;
  }
  const target = isBoss ? `Defeat the Boss of ${zoneName(s.zone)}` : `Break through ${zoneName(s.zone)}`;
  $("nextGoal").textContent = `Next: ${target} — ${left} kill${left === 1 ? "" : "s"} left`;
}

// Nome amigável de cada afixo para a UI.
const AFFIX_NAMES = { critRate: "Crit Rate", critDmg: "Crit Dmg", dmgMult: "Damage", hpMult: "Health", goldMult: "Gold", xpMult: "XP", shardMult: "Shard Find", bossDmg: "Boss Dmg" };
// Valor do afixo já escalado pelo nível do item (cresce ao subir o nível).
function affixLabel(a, level) {
  const pct = affixValue(a, level) * 100;
  // fmt() para valores ≥1000% (evita "+50000% Gold" em gear legendário alto nível)
  const shown = pct >= 1000 ? fmt(Math.round(pct)) : pct >= 100 ? Math.round(pct) : pct.toFixed(1);
  return `+${shown}% ${AFFIX_NAMES[a.stat]}`;
}

// Ícones temáticos por slot — visuais no header do card.
const SLOT_ICONS = { Weapon: "⚔️", Armor: "🛡️", Amulet: "📿", Ring: "💍", Gloves: "🧤", Helmet: "⛑️" };

// Painel de equipamento: 6 slots, cada um com level-up (gold) e rarity-up (shards).
// Redesenhado com progress bar, header compacto, seção de afixos e botões por tipo.
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

    // Botões de level-up (gold) — +1 e MAX
    const maxPrev = atCap ? { count: 0, spent: 0 } : levelUpMaxPreview(s, slot.id);
    const lvBtn = atCap
      ? `<button disabled title="Raise rarity to unlock more levels">Level cap</button>`
      : `<button class="lvl-btn" data-act="level" data-slot="${slot.id}" ${canLv ? "" : "disabled"}>💰 ${fmt(lvCost)} ▲1</button>`;
    const maxBtn = atCap
      ? ""
      : `<button class="lvl-btn" data-act="max" data-slot="${slot.id}" ${maxPrev.count > 0 ? "" : "disabled"}>MAX +${fmt(maxPrev.count)} (💰 ${fmt(maxPrev.spent)})</button>`;

    // Botão de rarity-up (shards)
    const rrBtn = maxRarity
      ? `<button disabled>Max rarity</button>`
      : `<button class="rarity-btn" data-act="rarity" data-slot="${slot.id}" ${canRr ? "" : "disabled"}>💎 ${fmt(rCost)}${atCap ? "" : " (reach cap)"}</button>`;

    // Affixes display
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

  // Cliques tratados por delegação (ver bindButtons) — robusto a re-renders.
}

// Painel de Ascensão: tier atual, barra de progresso, próximo tier e botão de ascender.
// Usa getAscensionStatus(s) como snapshot — zero recálculo local.
function renderAscend(s) {
  const asc = getAscensionStatus(s);
  const t = TIERS[asc.tier];

  $("ascCount").textContent = "×" + s.ascensions;

  // Progresso dentro do tier atual.
  const inTier   = s.ascensions - t.minAsc;
  const tierSize = asc.nextTier ? asc.nextTier.minAsc - t.minAsc : null;
  const pct      = tierSize ? Math.min(100, (inTier / tierSize) * 100) : 100;

  // Cor do tier (reutiliza as classes de raridade de equipamento — temática similar).
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

  const zoneOk   = s.maxZone >= asc.zoneReq;
  const levelOk  = s.level  >= asc.levelReq;
  const zoneGap  = asc.zoneReq - s.maxZone;
  const levelGap = asc.levelReq - s.level;
  html += `<div class="asc-req-row">
    <span class="asc-req ${zoneOk ? 'req-ok' : 'req-missing'}">
      🗺️ Clear ${zoneName(asc.zoneReq)} <small class="zone-num-label">#${fmt(asc.zoneReq)}</small>
      &nbsp;${zoneOk ? '✓' : `— ${zoneGap} zone${zoneGap > 1 ? 's' : ''} to go`}
    </span>
    <span class="asc-req ${levelOk ? 'req-ok' : 'req-missing'}">
      ⭐ Level ${asc.levelReq}
      &nbsp;${levelOk ? '✓' : `— ${levelGap} level${levelGap > 1 ? 's' : ''} to go`}
    </span>
  </div>`;

  $("ascTierDisplay").innerHTML = html;
  $("ascendBtn").disabled = !asc.canAscend;

  if (asc.canAscend) {
    $("ascInfo").innerHTML = asc.isTierPromo
      ? `<b class="milestone-text">🎉 TIER UP! You're becoming ${asc.nextTier.name}! Spike ×${fmt(asc.nextTier.spike)} awaits!</b>`
      : `<b>✓ KEEP</b> all equipment · <b>✗ RESET</b> gold, zones &amp; level · you'll rebuild faster!`;
  } else {
    $("ascInfo").innerHTML = `Push to <b>${zoneName(asc.zoneReq)}</b> <small class="zone-num-label">#${fmt(asc.zoneReq)}</small> to unlock ascension #${asc.ascensionNumber}.`;
  }
}

// Número de dano que sobe e some sobre o palco de combate.
function spawnFloatingDamage(amount, isBoss, isCrit) {
  const stage = $("combatStage");
  if (!stage) return;
  const el = document.createElement("span");
  el.className = "floating-dmg" + (isBoss ? " boss" : "") + (isCrit ? " crit" : "");
  el.textContent = (isCrit ? "💥 " : "-") + fmt(amount);
  el.style.left = (40 + Math.random() * 20) + "%"; // leve variação horizontal
  stage.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Aplica um brilho rápido num slot de equipamento (ex.: ao subir raridade).
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

// "Bem-vindo de volta": mostra o resumo dos ganhos offline.
function showOfflineSummary(g) {
  const h = Math.floor(g.seconds / 3600);
  const m = Math.floor((g.seconds % 3600) / 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
  $("offlineText").innerHTML =
    `While you were away (<b>${time}</b>):<br>` +
    `💰 +${fmt(g.gold)} gold · 💎 +${fmt(g.shards)} shards · ⭐ +${fmt(g.xp)} XP<br>` +
    `<small>(${fmt(g.kills)} kills simulated)</small>`;
  $("offlineModal").classList.remove("hidden");
}

// renderAll lives in render.js (render dispatch module).
