// ===== Renderização (DOM) =====
const $ = id => document.getElementById(id);
const fmt = n => {
  n = Math.floor(n);
  if (n < 1000) return "" + n;
  const units = ["", "K", "M", "B", "T"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(1) + units[i];
};

function logMsg(msg) {
  $("log").textContent = msg;
}

function renderResources(s) {
  $("gold").textContent = fmt(s.gold);
  $("level").textContent = s.level;
  $("essence").textContent = fmt(s.essence);
  $("ascMult").textContent = "x" + ascMultiplier(s).toFixed(2);
}

function renderCombat(s) {
  $("zoneName").textContent = ZONES[s.zone].name;
  $("zone").textContent = s.zone + 1;
  if (s.enemy) {
    $("enemyName").textContent = s.enemy.name;
    const pct = Math.max(0, (s.enemy.hp / s.enemy.maxHp) * 100);
    $("enemyHpFill").style.width = pct + "%";
    $("enemyHpText").textContent = fmt(Math.max(0, s.enemy.hp)) + "/" + fmt(s.enemy.maxHp);
  }
  $("kills").textContent = s.killsInZone;
  $("dmg").textContent = fmt(playerDamage(s));
  $("hp").textContent = fmt(playerMaxHp(s));
  $("dps").textContent = fmt(playerDamage(s) * attackSpeed(s));
  $("prevZone").disabled = s.zone <= 0;
  $("nextZone").disabled = !canAdvance(s);
  $("nextZone").textContent = canAdvance(s)
    ? "Próxima zona ▶"
    : `Próxima (${s.killsInZone}/10) ▶`;
}

function itemLabel(it) {
  return `<span class="rar-${it.rarity}"><span class="item-name">${it.name}</span> · ${it.rarity} · +${it.power}</span>`;
}

function renderGear(s) {
  const eq = $("equipped");
  eq.innerHTML = SLOTS.map(slot => {
    const it = s.equipped[slot];
    return `<div class="slot"><small>${slot}</small><br>${it ? itemLabel(it) : "<i>vazio</i>"}</div>`;
  }).join("");

  $("invCount").textContent = `(${s.inventory.length}/24)`;
  const inv = $("inventory");
  if (!s.inventory.length) {
    inv.innerHTML = "<i style='color:var(--muted)'>Mochila vazia — derrote inimigos para dropar itens.</i>";
    return;
  }
  inv.innerHTML = s.inventory.map(it =>
    `<div class="inv-item" data-id="${it.id}"><small>${it.slot}</small>${itemLabel(it)}<small>clique p/ equipar</small></div>`
  ).join("");
  inv.querySelectorAll(".inv-item").forEach(el => {
    el.onclick = () => {
      equipItem(s, el.dataset.id);
      renderGear(s); renderCombat(s);
    };
  });
}

function renderShop(s) {
  $("shop").innerHTML = SHOP_UPGRADES.map(u => {
    const cost = shopCost(s, u.id);
    const afford = s.gold >= cost;
    return `<div class="shop-item">
      <span class="info">${u.name} <span class="lvl">Nv ${s.shop[u.id]}</span></span>
      <button data-id="${u.id}" ${afford ? "" : "disabled"}>💰 ${fmt(cost)}</button>
    </div>`;
  }).join("");
  $("shop").querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      if (buyUpgrade(s, b.dataset.id)) { renderShop(s); renderResources(s); renderCombat(s); }
    };
  });
}

function renderAscend(s) {
  $("essenceGain").textContent = fmt(essenceOnAscend(s));
}

function renderAll(s) {
  renderResources(s);
  renderCombat(s);
  renderGear(s);
  renderShop(s);
  renderAscend(s);
}
