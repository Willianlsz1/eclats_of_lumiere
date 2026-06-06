// ===== Renderização (DOM) =====
// A UI só LÊ o estado e desenha. Nunca decide regra de jogo.
const $ = id => document.getElementById(id);

// Formata números grandes: 1234 -> "1.2K", etc.
const fmt = n => {
  n = Math.floor(n);
  if (n < 1000) return "" + n;
  const units = ["", "K", "M", "B", "T"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(1) + units[i];
};

function logMsg(msg, cls) {
  const el = $("log");
  el.textContent = msg;
  el.className = "log" + (cls ? " " + cls : "");
}

function renderResources(s) {
  $("gold").textContent = fmt(s.gold);
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
  // Boss limpa em 1 abate; zone normal precisa de killsToClear.
  const needed = (s.enemy && s.enemy.isBoss) ? 1 : CONFIG.enemy.killsToClear;
  $("kills").textContent = s.killsInZone;
  $("killsNeeded").textContent = needed;
  $("dmg").textContent = fmt(playerDamage(s));
  $("hp").textContent = fmt(playerMaxHp(s));
  $("dps").textContent = fmt(playerDps(s));
}

// Barra "próximo objetivo" — sempre algo à vista (pacing).
function renderNextGoal(s) {
  const isBoss = s.enemy && s.enemy.isBoss;
  const needed = isBoss ? 1 : CONFIG.enemy.killsToClear;
  const left = Math.max(0, needed - s.killsInZone);
  let target;
  if (isBoss) target = `Defeat the Zone ${s.zone} Boss`;
  else if (s.zone > s.maxZone) target = `Break through Zone ${s.zone}`;
  else target = `Clear Zone ${s.zone}`;
  $("nextGoal").textContent = `Next: ${target} — ${left} kill${left === 1 ? "" : "s"} left`;
}

function itemLabel(it) {
  const stat = it.stat ? ` ${it.stat}` : "";
  return `<span class="rar-${it.rarity}"><span class="item-name">${it.name}</span> · ${it.rarity} · +${it.power}${stat}</span>`;
}

function renderGear(s) {
  const eq = $("equipped");
  eq.innerHTML = SLOTS.map(slot => {
    const it = s.equipped[slot];
    return `<div class="slot"><small>${slot}</small><br>${it ? itemLabel(it) : "<i>empty</i>"}</div>`;
  }).join("");

  $("invCount").textContent = `(${s.inventory.length}/${CONFIG.drops.inventoryMax})`;
  const inv = $("inventory");
  if (!s.inventory.length) {
    inv.innerHTML = "<i style='color:var(--muted)'>Backpack empty — defeat enemies to drop items.</i>";
    return;
  }
  inv.innerHTML = s.inventory.map(it =>
    `<div class="inv-item" data-id="${it.id}"><small>${it.slot}</small>${itemLabel(it)}<small>click to equip</small></div>`
  ).join("");
  inv.querySelectorAll(".inv-item").forEach(el => {
    el.onclick = () => {
      equipItem(s, el.dataset.id);
      renderGear(s); renderCombat(s);
    };
  });
}

// Descreve o que cada nível de um upgrade concede ao Hero.
function upgradeEffect(u) {
  if (u.percent) return `+${Math.round(u.value * 100)}% ${u.unit} / level`;
  if (u.suffix)  return `+${u.value}${u.suffix} ${u.unit} / level`;
  return `+${u.value} ${u.unit} / level`;
}

function renderShop(s) {
  $("shop").innerHTML = SHOP_UPGRADES.map(u => {
    const maxed = u.maxLevel != null && s.shop[u.id] >= u.maxLevel;
    const cost = shopCost(s, u.id);
    const afford = s.gold >= cost;
    const btn = maxed
      ? `<button disabled class="maxed">MAX</button>`
      : `<button data-id="${u.id}" ${afford ? "" : "disabled"}>💰 ${fmt(cost)}</button>`;
    return `<div class="shop-item">
      <span class="info">${u.name} <span class="lvl">Lv ${s.shop[u.id]}</span><br><small class="effect">${upgradeEffect(u)}</small></span>
      ${btn}
    </div>`;
  }).join("");
  $("shop").querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      if (buyUpgrade(s, b.dataset.id)) { renderShop(s); renderResources(s); renderCombat(s); }
    };
  });
}

function renderAscend(s) {
  const unlocked = canAscend(s);
  $("ascendBtn").disabled = !unlocked;
  if (unlocked) {
    $("ascInfo").innerHTML = `Essence on ascend now: <b id="essenceGain">${fmt(essenceOnAscend(s))}</b>`;
  } else {
    $("ascInfo").textContent = `Reach Zone ${CONFIG.ascension.unlockZone} to unlock Ascension (deepest: ${s.maxZone}).`;
  }
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

function renderAll(s) {
  renderResources(s);
  renderCombat(s);
  renderNextGoal(s);
  renderGear(s);
  renderShop(s);
  renderAscend(s);
}
