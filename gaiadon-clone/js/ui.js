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
}

function renderCombat(s) {
  $("regionName").textContent = regionFor(s.zone).name;
  $("zone").textContent = s.zone;
  const pack = s.enemies || [];
  const target = pack[0]; // o inimigo que você está focando (frente do pack)
  if (target) {
    $("enemyName").textContent = target.name;
    $("enemyName").className = "enemy-name" + (target.isBoss ? " boss" : "");
    const pct = Math.max(0, (target.hp / target.maxHp) * 100);
    $("enemyHpFill").style.width = pct + "%";
    $("enemyHpFill").className = "hpfill" + (target.isBoss ? " boss" : "");
    $("enemyHpText").textContent = fmt(Math.max(0, target.hp)) + "/" + fmt(target.maxHp);
  }
  // Pack: o espaço é reservado pelo TAMANHO da zona (não some ao matar até o último),
  // evitando o "pula-pula" visual. Mini-barras só dos inimigos ainda vivos.
  if (packSize(s.zone) > 1) {
    $("packInfo").innerHTML = `<small>👥 Pack of ${packSize(s.zone)} — all attacking!</small>` +
      pack.map((e, i) => {
        const p = Math.max(0, (e.hp / e.maxHp) * 100);
        return `<div class="pack-mini${i === 0 ? " target" : ""}"><div style="width:${p}%"></div></div>`;
      }).join("");
  } else {
    $("packInfo").innerHTML = "";
  }
  const needed = (target && target.isBoss) ? 1 : killsToClear(s.zone);
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
  $("statCritRate").textContent = Math.round(critRate(s) * 100) + "%";
  $("statCritDmg").textContent = "×" + critMult(s).toFixed(2);
  $("statDps").textContent = fmt(playerDps(s));
  $("statXp").textContent = "×" + xpMultiplier(s).toFixed(2);
  const dpl = damagePerLevel(s), hpl = hpPerLevel(s);
  const f1 = n => n < 100 ? n.toFixed(1) : fmt(n);
  const tier = heroTier(s);
  const t = TIERS[tier];
  const tierColor = ["common","uncommon","rare","epic","legendary"][tier];
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

function renderNextGoal(s) {
  const isBoss = s.enemy && s.enemy.isBoss;
  const needed = isBoss ? 1 : killsToClear(s.zone);
  const left = Math.max(0, needed - s.killsInZone);
  if (!isBoss && s.zone <= s.maxZone) {
    $("nextGoal").textContent = `Farming Zone ${s.zone} (cleared) · deepest: ${s.maxZone}`;
    return;
  }
  const target = isBoss ? `Defeat the Zone ${s.zone} Boss` : `Break through Zone ${s.zone}`;
  $("nextGoal").textContent = `Next: ${target} — ${left} kill${left === 1 ? "" : "s"} left`;
}

// Nome amigável de cada afixo para a UI.
const AFFIX_NAMES = { critRate: "Crit Rate", critDmg: "Crit Dmg", dmgMult: "Damage", hpMult: "Health", goldMult: "Gold", xpMult: "XP" };
// Valor do afixo já escalado pelo nível do item (cresce ao subir o nível).
function affixLabel(a, level) {
  const pct = affixValue(a, level) * 100;
  const shown = pct >= 100 ? Math.round(pct) : pct.toFixed(1);
  return `+${shown}% ${AFFIX_NAMES[a.stat]}`;
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

    return `<div class="equip-slot rar-edge-${rarity.name}">
      <div class="equip-head">
        <span class="slot-name"><small>${slot.id}</small> <span class="rar-${rarity.name}">${slot.defaultName} · ${rarity.name}</span></span>
        <span class="slot-power">⚙️ ${fmt(itemPower(it))}</span>
      </div>
      <div class="equip-sub">Level ${fmt(it.level)} / ${fmtCap(cap)} · gives ${slot.stats.join(" + ")}</div>
      ${itemAffixes(slot.id, it.rarity).length
        ? `<div class="equip-affixes">${itemAffixes(slot.id, it.rarity).map(a => `<span class="affix">${affixLabel(a, it.level)}</span>`).join("")}</div>`
        : `<div class="equip-affixes empty"><small>No affixes — raise rarity to unlock</small></div>`}
      <div class="equip-actions">${lvBtn}${maxBtn}</div>
      <div class="equip-actions">${rrBtn}</div>
    </div>`;
  }).join("");

  // Cliques tratados por delegação (ver bindButtons) — robusto a re-renders.
}

// Painel de Ascensão: tier atual, barra de progresso, próximo tier e botão de ascender.
function renderAscend(s) {
  const tier   = heroTier(s);
  const t      = TIERS[tier];
  const nextT  = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;

  $("ascCount").textContent = "×" + s.ascensions;

  // Progresso dentro do tier atual.
  const inTier   = s.ascensions - t.minAsc;
  const tierSize = nextT ? nextT.minAsc - t.minAsc : null;
  const pct      = tierSize ? Math.min(100, (inTier / tierSize) * 100) : 100;

  // Cor do tier (reutiliza as classes de raridade de equipamento — temática similar).
  const tierColor = ["common", "uncommon", "rare", "epic", "legendary"][tier];

  let html = `
    <div class="asc-tier-name rar-${tierColor}">${t.name}</div>
    <div class="asc-bar-wrap">
      <div class="asc-bar-fill rar-fill-${tierColor}" style="width:${pct.toFixed(1)}%"></div>
      <span class="asc-bar-text">
        ${nextT ? `${inTier} / ${tierSize} ascensions` : `${inTier} ascensions — MAX TIER`}
      </span>
    </div>`;

  if (nextT) {
    html += `<div class="asc-next-tier">
      Next tier: <b class="rar-${["common","uncommon","rare","epic","legendary"][tier+1]}">${nextT.name}</b>
      at ${fmt(nextT.minAsc)} ascensions
      <span class="asc-spike">→ Power Spike ×${fmt(nextT.spike)}</span>
    </div>`;
  }

  html += `<div class="asc-mult-info">Each ascension: <b>×${t.mult.toFixed(2)}</b> to all stats · Current power: <b>×${fmt(ascMultiplier(s))}</b></div>`;

  $("ascTierDisplay").innerHTML = html;

  const unlocked = canAscend(s);
  $("ascendBtn").disabled = !unlocked;

  const nextAsc = s.ascensions + 1;
  const isTierPromo = nextT && nextAsc === nextT.minAsc;
  if (unlocked) {
    $("ascInfo").innerHTML = isTierPromo
      ? `<b class="milestone-text">🎉 TIER UP! You're becoming ${nextT.name}! Spike ×${fmt(nextT.spike)} awaits!</b>`
      : `Ready to ascend #${nextAsc}. Keeps equipment; resets gold, zones &amp; level.`;
  } else {
    $("ascInfo").innerHTML = `Reach <b>Level ${fmt(ascLevelReq(s))}</b> to ascend (you're Level ${fmt(s.level)}).`;
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
