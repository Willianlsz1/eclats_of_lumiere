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

function logMsg(msg, cls) {
  const el = $("log");
  el.textContent = msg;
  el.className = "log" + (cls ? " " + cls : "");
}

function renderResources(s) {
  $("gold").textContent = fmt(s.gold);
  $("shards").textContent = fmt(s.shards);
  $("level").textContent = s.level;
  $("essence").textContent = fmt(s.essence);
  $("ascMult").textContent = "x" + ascMultiplier(s).toFixed(2);
}

function renderCombat(s) {
  $("regionName").textContent = regionFor(s.zone).name;
  $("zone").textContent = s.zone;
  if (s.enemy) {
    $("enemyName").textContent = s.enemy.name;
    $("enemyName").className = "enemy-name" + (s.enemy.isBoss ? " boss" : "");
    const pct = Math.max(0, (s.enemy.hp / s.enemy.maxHp) * 100);
    $("enemyHpFill").style.width = pct + "%";
    $("enemyHpFill").className = "hpfill" + (s.enemy.isBoss ? " boss" : "");
    $("enemyHpText").textContent = fmt(Math.max(0, s.enemy.hp)) + "/" + fmt(s.enemy.maxHp);
  }
  const needed = (s.enemy && s.enemy.isBoss) ? 1 : CONFIG.enemy.killsToClear;
  $("kills").textContent = s.killsInZone;
  $("killsNeeded").textContent = needed;

  // Barra de HP do jogador (agora o dano dos inimigos é visível).
  const maxHp = playerMaxHp(s);
  const hp = Math.max(0, s.playerHp == null ? maxHp : s.playerHp);
  $("playerHpFill").style.width = Math.max(0, (hp / maxHp) * 100) + "%";
  $("playerHpText").textContent = fmt(hp) + "/" + fmt(maxHp);

  // Navegação de zone: entre 1 e a fronteira (maxZone+1).
  $("prevZone").disabled = s.zone <= 1;
  $("nextZone").disabled = s.zone >= s.maxZone + 1;
}

function renderHero(s) {
  $("heroLevel").textContent = s.level;
  const need = xpToNext(s);
  $("xpFill").style.width = Math.min(100, (s.xp / need) * 100) + "%";
  $("xpText").textContent = fmt(s.xp) + " / " + fmt(need) + " XP";
  $("statDamage").textContent = fmt(playerDamage(s));
  $("statHealth").textContent = fmt(playerMaxHp(s));
  $("statSpeed").textContent = attackSpeed(s).toFixed(2) + "/s";
  $("statGold").textContent = "+" + Math.round((goldBonus(s) - 1) * 100) + "%";
  $("statDps").textContent = fmt(playerDps(s));
  const P = CONFIG.player;
  $("heroFoot").textContent = `Each level grants +${P.damagePerLevel} damage and +${P.hpPerLevel} health.`;
}

function renderNextGoal(s) {
  const isBoss = s.enemy && s.enemy.isBoss;
  const needed = isBoss ? 1 : CONFIG.enemy.killsToClear;
  const left = Math.max(0, needed - s.killsInZone);
  if (!isBoss && s.zone <= s.maxZone) {
    $("nextGoal").textContent = `Farming Zone ${s.zone} (cleared) · deepest: ${s.maxZone}`;
    return;
  }
  const target = isBoss ? `Defeat the Zone ${s.zone} Boss` : `Break through Zone ${s.zone}`;
  $("nextGoal").textContent = `Next: ${target} — ${left} kill${left === 1 ? "" : "s"} left`;
}

// Painel de equipamento: 3 slots, cada um com level-up (gold) e rarity-up (shards).
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

    // Botão de +1 nível e botão MAX (compra tudo que dá). No cap, somem.
    const maxPrev = atCap ? { count: 0, spent: 0 } : levelUpMaxPreview(s, slot.id);
    const lvBtn = atCap
      ? `<button disabled title="Raise rarity to unlock more levels">Lv ${fmtCap(cap)} (cap)</button>`
      : `<button data-act="level" data-slot="${slot.id}" ${canLv ? "" : "disabled"}>💰 ${fmt(lvCost)} ▲1</button>`;
    const maxBtn = atCap
      ? ""
      : `<button data-act="max" data-slot="${slot.id}" ${maxPrev.count > 0 ? "" : "disabled"}>MAX +${fmt(maxPrev.count)} (💰 ${fmt(maxPrev.spent)})</button>`;
    const rrBtn = maxRarity
      ? `<button disabled>Max rarity</button>`
      : `<button class="rarity-btn" data-act="rarity" data-slot="${slot.id}" ${canRr ? "" : "disabled"}>💎 ${fmt(rCost)}${atCap ? "" : " (reach cap)"}</button>`;

    return `<div class="equip-slot">
      <div class="equip-head">
        <span class="slot-name"><small>${slot.id}</small> <span class="rar-${rarity.name}">${slot.defaultName} · ${rarity.name}</span></span>
        <span class="slot-power">⚙️ ${fmt(itemPower(it))}</span>
      </div>
      <div class="equip-sub">Level ${fmt(it.level)} / ${fmtCap(cap)} · gives ${slot.stats.join(" + ")}</div>
      <div class="equip-actions">${lvBtn}${maxBtn}</div>
      <div class="equip-actions">${rrBtn}</div>
    </div>`;
  }).join("");

  el.querySelectorAll("button[data-act]").forEach(b => {
    b.onclick = () => {
      const slot = b.dataset.slot, act = b.dataset.act;
      const ok = act === "level" ? levelUpItem(s, slot)
               : act === "max"   ? levelUpMax(s, slot) > 0
               : rarityUpItem(s, slot);
      if (ok) { renderEquipment(s); renderResources(s); renderCombat(s); renderHero(s); }
    };
  });
}

// Painel de Ascensão: ascend + upgrades permanentes comprados com Essence.
function renderAscend(s) {
  const unlocked = canAscend(s);
  $("ascendBtn").disabled = !unlocked;
  if (unlocked) {
    $("ascInfo").innerHTML = `Reset your run for <b>${fmt(essenceOnAscend(s))}</b> Essence (permanent). You keep Essence and these upgrades.`;
  } else {
    $("ascInfo").textContent = `Reach Zone ${CONFIG.ascension.unlockZone} to unlock Ascension (deepest: ${s.maxZone}).`;
  }

  $("ascUpgrades").innerHTML = ASCENSION_UPGRADES.map(u => {
    const maxed = u.maxLevel != null && s.asc[u.id] >= u.maxLevel;
    const cost = ascUpgradeCost(s, u.id);
    const afford = s.essence >= cost;
    const effect = u.percent ? `+${Math.round(u.value * 100)}% ${u.unit}`
                 : u.suffix  ? `+${u.value}${u.suffix} ${u.unit}`
                 : `+${u.value} ${u.unit}`;
    const btn = maxed
      ? `<button disabled class="maxed">MAX</button>`
      : `<button data-asc="${u.id}" ${afford ? "" : "disabled"}>🔮 ${fmt(cost)}</button>`;
    return `<div class="shop-item">
      <span class="info"><b>${u.name}</b> <span class="lvl">Lv ${s.asc[u.id]}</span><br><small class="effect">${effect} / level</small></span>
      ${btn}
    </div>`;
  }).join("");

  $("ascUpgrades").querySelectorAll("button[data-asc]").forEach(b => {
    b.onclick = () => {
      if (buyAscUpgrade(s, b.dataset.asc)) { renderAscend(s); renderResources(s); renderCombat(s); renderHero(s); }
    };
  });
}

// Número de dano que sobe e some — preenchido de verdade na Task 6 (game feel).
function spawnFloatingDamage(amount) {
  const stage = $("combatStage");
  if (!stage) return;
  const el = document.createElement("span");
  el.className = "floating-dmg";
  el.textContent = "-" + fmt(amount);
  stage.appendChild(el);
  setTimeout(() => el.remove(), 800);
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

function renderAll(s) {
  renderResources(s);
  renderCombat(s);
  renderHero(s);
  renderNextGoal(s);
  renderEquipment(s);
  renderAscend(s);
}
