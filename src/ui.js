// ui.js — renderização e eventos. Nenhuma regra de jogo aqui.

G.ui = {
  el: {},
  gearMult: 1,

  cache() {
    const ids = [
      "res-lumens", "res-area",
      "hero-card-level", "hero-hp-fill", "hero-hp-label", "hero-xp-fill", "hero-xp-label",
      "enemies-container", "log",
      "gear-stats", "gear-slots", "gear-mult", "gear-tooltip", "gear-materials",
      "forge-mats", "forge-convert", "forge-promote", "forge-anvil",
      // World Map
      "wmap-nodes", "wmap-trail", "wmap-info", "wmap-info-art", "wmap-info-name",
      "wmap-info-lore", "wmap-info-level", "wmap-info-enemies", "wmap-info-status",
      "wmap-info-boss-row", "wmap-info-boss", "wmap-info-unlock-row", "wmap-info-unlock",
      "wmap-info-res", "wmap-info-travel", "wmap-info-close",
      // Convergence
      "conv-points", "conv-count", "conv-highest", "conv-pending", "conv-current", "conv-return", "btn-converge",
      // Awaken
      "awaken-essence", "awaken-list", "awaken-preview",
      // Passives
      "pv-points", "pv-tabs", "pv-body", "pv-lock",
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
  },

  bind() {
    if (this.el["gear-mult"]) {
      this.el["gear-mult"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-mult]");
        if (!btn) return;
        const raw = btn.dataset.mult;
        this.gearMult = raw === "max" ? "max" : +raw;
        this.el["gear-mult"].querySelectorAll("button").forEach((b) =>
          b.classList.toggle("is-active", b === btn)
        );
      });
    }
    // breakdown de stats: clicar numa linha abre a matriz Fonte × Camada
    const gs = document.getElementById("gear-stats");
    if (gs) gs.addEventListener("click", (e) => {
      const row = e.target.closest(".stat-row");
      if (row) this.openStatPop(row.dataset.stat);
    });
    const pop = document.getElementById("stat-pop");
    if (pop) pop.addEventListener("click", (e) => {
      if (e.target === pop || e.target.closest("[data-close]")) this.closeStatPop();
    });

    const tabs = document.getElementById("log-tabs");
    if (tabs) tabs.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab")) return;
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      e.target.classList.add("is-active");
    });

    // World Map: painel de info (fechar / viajar) e botão "◀ World"
    if (this.el["wmap-info-close"])
      this.el["wmap-info-close"].addEventListener("click", () => { this.el["wmap-info"].hidden = true; });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => {
        if (this._infoArea != null) this.travelTo(this._infoArea);
      });
    const wback = document.getElementById("wmap-back");
    if (wback) wback.addEventListener("click", () => { document.getElementById("modal-worldmap").hidden = true; });

    // Convergence (prestige): confirma e renasce
    if (this.el["btn-converge"])
      this.el["btn-converge"].addEventListener("click", () => {
        if (!G.convergence.canConverge()) return;
        const pts = G.convergence.pending();
        if (confirm(`Converge now for ${G.util.fmt(pts)} Convergence Points? Your level resets to 1.`)) {
          G.convergence.converge();
          this.renderConvergence();
        }
      });

    // Awaken: selecionar entry (sidebar) / desbloquear (botão do preview)
    if (this.el["awaken-list"])
      this.el["awaken-list"].addEventListener("click", (e) => {
        const entry = e.target.closest("[data-id]");
        if (!entry) return;
        this._selectedAwaken = entry.dataset.id;
        this.el["awaken-list"].querySelectorAll(".awk-entry").forEach((el) =>
          el.classList.toggle("is-active", el.dataset.id === this._selectedAwaken)
        );
        this.renderAwakenPreview(this._selectedAwaken);
      });
    if (this.el["awaken-preview"])
      this.el["awaken-preview"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-awaken]");
        if (!btn) return;
        if (G.awaken.unlock(btn.dataset.awaken)) this.renderAwaken();
      });

    // Passivas (Árvore-Mundo): trocar de aba / comprar nó (clique delegado)
    const pscreen = document.getElementById("modal-passives");
    if (pscreen)
      pscreen.addEventListener("click", (e) => {
        const tab = e.target.closest(".pv-tab");
        if (tab) { this.passivesTab = tab.dataset.tree; this.renderPassives(); return; }
        const node = e.target.closest(".pv-node");
        if (node && G.passives.buy(this.passivesTab || "eclat", +node.dataset.i)) this.renderPassives();
      });
  },

  openModal(id) {
    this.renderAll();
    // World Map renderiza só ao abrir (não a cada tick); painel começa fechado
    if (id === "modal-worldmap") {
      this.renderWorldMap();
      if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
    }
    if (id === "modal-forge") this.renderForge();
    if (id === "modal-convergence") this.renderConvergence();
    if (id === "modal-awaken") this.renderAwaken();
    if (id === "modal-passives") this.renderPassives();
    const m = document.getElementById(id);
    if (m) m.hidden = false;
  },

  resetGame() {
    if (confirm("Restart the game? All progress will be lost.")) { G.state.reset(); location.reload(); }
  },

  togglePause(btn) {
    G.combat.paused = !G.combat.paused;
    if (btn) { btn.classList.toggle("icon-btn--active", G.combat.paused); btn.textContent = G.combat.paused ? "▶" : "⏸"; }
  },

  // ---------- RENDER ----------

  renderAll() {
    this.renderResources();
    this.renderHeroHp();
    this.renderStats();
    this.renderGear();
    this.renderHud();
  },

  renderResources() {
    this.el["res-lumens"].textContent = G.util.fmt(G.state.data.lumens);
    const area = G.data.currentArea();
    this.el["res-area"].textContent = area.name;
    const wimg = document.querySelector(".world-img");
    if (wimg && area.img && wimg.getAttribute("src") !== area.img) wimg.src = area.img;
    const d = G.state.data;
    const maxUnlocked = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const prev = document.getElementById("area-prev");
    const next = document.getElementById("area-next");
    if (prev) prev.classList.toggle("is-disabled", d.areaIndex <= 0);
    if (next) next.classList.toggle("is-disabled", d.areaIndex >= maxUnlocked);
    this.el["hero-card-level"].textContent = d.level;
  },

  renderHeroHp() {
    const max = G.state.maxHp();
    const pct = G.util.clamp((G.state.data.hp / max) * 100, 0, 100);
    this.el["hero-hp-fill"].style.width  = pct + "%";
    this.el["hero-hp-label"].textContent = `HP ${G.util.fmt(Math.max(0, G.state.data.hp))} / ${G.util.fmt(max)}`;
    const xp = G.state.data.xp;
    const xpNext = G.state.xpToNext();
    if (this.el["hero-xp-fill"]) this.el["hero-xp-fill"].style.width = G.util.clamp((xp / xpNext) * 100, 0, 100) + "%";
    if (this.el["hero-xp-label"]) this.el["hero-xp-label"].textContent = `XP ${G.util.fmt(xp)} / ${G.util.fmt(xpNext)}`;
  },

  fmtStat(v) {
    const r = Math.round(v * 1000) / 1000;
    if (Number.isInteger(r)) return G.util.fmt(r);
    if (Math.abs(r) < 1000) return String(parseFloat(r.toFixed(3)));
    return G.util.fmt(v);
  },

  renderStats() {
    const s = G.state.stats();
    const rows = [
      ["atk",         "ATK"],
      ["hp",          "Max HP"],
      ["crit",        "Crit"],
      ["critDmg",     "Crit Dmg"],
      ["atkSpeed",    "Atk Speed"],
      ["xpBonus",     "XP Bonus"],
      ["lumensBonus", "Lumens Bonus"],
    ];
    const html = rows.map(([key, k]) =>
      `<li class="stat-row" data-stat="${key}"><span>${k}</span><b>${this.statValueText(key, s)}</b></li>`).join("");
    if (this.el["gear-stats"]) this.el["gear-stats"].innerHTML = html;
  },

  statValueText(key, s) {
    s = s || G.state.stats();
    switch (key) {
      case "atk": case "hp":  return G.util.fmt(s[key]);
      case "crit":            return s.crit.toFixed(2) + "%";
      case "critDmg":         return "+" + this.fmtStat(s.critDmg) + "%";
      case "atkSpeed":        return s.atkSpeed.toFixed(3) + " /s";
      case "xpBonus":         return "+" + this.fmtStat(s.xpBonus) + "%";
      case "lumensBonus":     return "+" + s.lumensBonus.toFixed(0) + "%";
      default:                return "";
    }
  },

  // matriz Fonte × Camada (Primary / Bonus / Multiplier) de uma stat
  statMatrixHtml(key) {
    const s = G.state.stats();
    const bd = (s._breakdown || {})[key] || [];
    const LABELS = { atk: "ATTACK", hp: "MAX HEALTH", crit: "CRITICAL RATE", critDmg: "CRITICAL DAMAGE",
      atkSpeed: "ATTACK SPEED", xpBonus: "XP BONUS", lumensBonus: "LUMENS BONUS" };
    const ORDER = ["Base", "Character Level", "Equipment", "Passives", "Awaken"];
    const sources = [];
    for (const src of ORDER) if (bd.some((e) => e.source === src)) sources.push(src);
    bd.forEach((e) => { if (!sources.includes(e.source)) sources.push(e.source); });

    const sumF  = (src) => bd.filter((e) => e.source === src && e.type === "flat").reduce((a, e) => a + e.amount, 0);
    const sumP  = (src) => bd.filter((e) => e.source === src && e.type === "pct").reduce((a, e) => a + e.amount, 0);
    const prodM = (src) => bd.filter((e) => e.source === src && e.type === "mult").reduce((a, e) => a * e.amount, 1);
    const cF = (v) => v ? `+${G.util.fmt(Math.round(v))}` : "";
    const cP = (v) => v ? `+${+v.toFixed(2)}%` : "";
    const cM = (v) => (v && v !== 1) ? `×${+v.toFixed(2)}` : "";

    const body = sources.map((src) =>
      `<tr><th>${src}</th><td>${cF(sumF(src))}</td><td>${cP(sumP(src))}</td><td>${cM(prodM(src))}</td></tr>`).join("");
    const tF = bd.filter((e) => e.type === "flat").reduce((a, e) => a + e.amount, 0);
    const tP = bd.filter((e) => e.type === "pct").reduce((a, e) => a + e.amount, 0);
    const tM = bd.filter((e) => e.type === "mult").reduce((a, e) => a * e.amount, 1);

    return `<div class="sbd">
      <button class="sbd__x" data-close title="Close">✕</button>
      <div class="sbd__title">${LABELS[key] || key}</div>
      <div class="sbd__sub">Total ${(LABELS[key] || key).toLowerCase()} of your hero</div>
      <div class="sbd__grand"><span>Total</span><b>${this.statValueText(key, s)}</b></div>
      <table class="sbd__t">
        <thead><tr><th></th><th>Primary</th><th>Bonus</th><th>Multiplier</th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr><th>Total</th><td>${cF(tF)}</td><td>${cP(tP)}</td><td>${cM(tM) || "×1"}</td></tr></tfoot>
      </table>
    </div>`;
  },

  openStatPop(key) {
    const pop = document.getElementById("stat-pop");
    if (!pop) return;
    pop.innerHTML = this.statMatrixHtml(key);
    pop.hidden = false;
  },
  closeStatPop() { const pop = document.getElementById("stat-pop"); if (pop) pop.hidden = true; },

  renderHud() {
    const s   = G.state.stats();
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const dps = Math.round(s.atk / G.state.attackInterval());

    const r = G.combat.getRates();
    set("rate-gold",  G.util.fmt(Math.round(r.lumens)));
    set("rate-xp",    G.util.fmt(Math.round(r.xp)));
    set("rate-kills", (r.kills || 0).toFixed(1));
    set("rate-dmg",   G.util.fmt(dps));
  },

  toggleLog() {
    const p = document.getElementById("log-panel");
    const b = document.getElementById("log-toggle");
    if (!p) return;
    const collapsed = p.classList.toggle("collapsed");
    if (b) { b.textContent = collapsed ? "+" : "—"; b.title = collapsed ? "Expand" : "Minimize"; }
  },

  // ---- GEAR MODAL ----

  renderGear() {
    if (!this.el["gear-slots"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl   = item.level || 1;
      const cap   = G.gear.cap(item);
      const maxed = G.gear.isMaxed(item);
      const icon  = slot.icon || "❔";
      let action;
      if (maxed) {
        action = `<button class="gear-max" disabled>Max</button>`;
      } else {
        action = `<span class="gear-slot__cost">✦ ${G.util.fmt(G.gear.cost(item))}</span>
                  <button class="gear-levelup" data-levelup="${slot.id}">Level up</button>`;
      }
      return `<div class="gear-slot pos-${slot.id}" data-tip="${slot.id}" style="--rar:${item.color}">
        <span class="gear-slot__lvl">LVL ${lvl}/${G.util.fmt(cap)}</span>
        <div class="gear-slot__icon">
          <span class="ico-ph">${icon}</span>
          <img class="ico-img" src="assets/gear/${slot.id}.png" alt="" onerror="this.remove()" />
        </div>
        <div class="gear-slot__action">${action}</div>
      </div>`;
    };
    const node = this.el["gear-slots"];
    node.innerHTML = G.data.slots.map(slotCard).join("");
    node.querySelectorAll("[data-levelup]").forEach((b) => {
      b.addEventListener("click", () => this.doGearLevelUp(b.dataset.levelup));
    });
    node.querySelectorAll("[data-promote]").forEach((b) => {
      b.addEventListener("click", () => this.doGearPromote(b.dataset.promote));
    });
    if (this.el["gear-materials"]) this.el["gear-materials"].innerHTML = "";
    node.querySelectorAll(".gear-slot[data-tip]").forEach((s) => {
      s.addEventListener("mouseenter", () => this.showGearTip(s));
      s.addEventListener("mousemove",  () => this.showGearTip(s));
      s.addEventListener("mouseleave", () => this.hideGearTip());
    });
  },

  // ---- FORGE MODAL ----

  renderForge() {
    if (!this.el["forge-mats"]) return;
    const fmt = G.util.fmt;

    const mat = (kind, qty, label, color) =>
      `<div class="forge-mat" style="--c:${color}">
        <img class="forge-mat__icon" src="assets/materials/${kind}.png" alt="" onerror="this.replaceWith(document.createTextNode('⬡'))">
        <span class="forge-mat__qty">${fmt(qty)}</span>
        <span class="forge-mat__label">${label}</span>
      </div>`;
    this.el["forge-mats"].innerHTML =
      mat("common",     G.economy.getGear("common"),       "Common",      "#9aa7bd") +
      mat("uncommon",   G.economy.getGear("uncommon"),     "Uncommon",    "#7ec8a0") +
      mat("firstLight", G.economy.getAwaken("firstLight"), "First Light", "#d4b4ff");

    this.el["forge-convert"].innerHTML = G.economy.CONVERSIONS.map((c, i) => {
      const rate = G.economy.conversionRate(c);
      const max  = G.economy.maxConversions(c);
      return `<div class="forge-recipe">
        <span class="forge-recipe__line">${rate} ${c.fromLabel} <b>→</b> 1 ${c.toLabel}</span>
        <span class="forge-recipe__avail">Can make: ${fmt(max)}</span>
        <button class="forge-btn" data-convert="${i}" ${max > 0 ? "" : "disabled"}>Convert all</button>
      </div>`;
    }).join("");

    this.el["forge-promote"].innerHTML = G.data.slots.map((slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const next = G.gear._nextRarity(item.rarity);
      if (!next) {
        return `<div class="forge-prom forge-prom--max">
          <span class="forge-prom__name">${item.slotLabel}</span>
          <span class="forge-prom__state" style="color:${item.color}">${item.rarityName} · Max rarity</span></div>`;
      }
      const nextRar = G.data.rarities.find((r) => r.id === next);
      const maxed   = G.gear.isMaxed(item);
      const cost    = G.gear.promoteCost(item);
      const have    = G.economy.getGear(cost.kind);
      const costLabel = cost.kind === "uncommon" ? "Uncommon" : "Common";
      const sel = this._forgeSel === slot.id ? " is-selected" : "";
      const action = !maxed
        ? `<span class="forge-prom__note">Reach max level first</span>`
        : `<span class="forge-prom__cost ${have >= cost.amount ? "ok" : "short"}">${fmt(have)} / ${cost.amount} ${costLabel}</span>
           <span class="forge-prom__sel">View ›</span>`;
      return `<div class="forge-prom forge-prom--click${sel}" data-select="${slot.id}">
        <span class="forge-prom__name">${item.slotLabel}</span>
        <span class="forge-prom__rar"><b style="color:${item.color}">${item.rarityName}</b> → <b style="color:${nextRar.color}">${nextRar.name}</b></span>
        <div class="forge-prom__action">${action}</div></div>`;
    }).join("");

    this.el["forge-convert"].querySelectorAll("[data-convert]").forEach((b) =>
      b.addEventListener("click", () => this.doForgeConvert(+b.dataset.convert)));
    this.el["forge-promote"].querySelectorAll("[data-select]").forEach((row) =>
      row.addEventListener("click", () => { this._forgeSel = row.dataset.select; this.renderForge(); this.renderForgeAnvil(row.dataset.select); }));

    if (this._forgeSel) this.renderForgeAnvil(this._forgeSel);
    else if (this.el["forge-anvil"]) this.el["forge-anvil"].hidden = true;
  },

  renderForgeAnvil(slotId) {
    const anvil = this.el["forge-anvil"];
    if (!anvil) return;
    const item = G.state.data.equipped[slotId];
    const next = item && G.gear._nextRarity(item.rarity);
    if (!item || !next) { anvil.hidden = true; this._forgeSel = null; return; }
    const nextRar  = G.data.rarities.find((r) => r.id === next);
    const newPiece = G.gear.buildPiece(item.slot, next);
    newPiece.level = item.level || 1;
    const curById  = {};
    item.affixes.forEach((a) => { curById[a.id] = a; });

    const rows = newPiece.affixes.map((na) => {
      const sign = na.pct ? "%" : "";
      const newV = this.fmtStat(G.gear.affixValue(newPiece, na));
      const cur  = curById[na.id];
      if (cur) {
        const curV = this.fmtStat(G.gear.affixValue(item, cur));
        return `<div class="anvil-affix">
          <span class="anvil-affix__lbl">${na.label}</span>
          <span class="anvil-affix__val"><i>+${curV}${sign}</i> <em>→</em> <b>+${newV}${sign}</b></span></div>`;
      }
      return `<div class="anvil-affix anvil-affix--new">
        <span class="anvil-affix__lbl">${na.label}</span>
        <span class="anvil-affix__val"><b>+${newV}${sign}</b> <em class="tag-new">NEW</em></span></div>`;
    }).join("");

    const cost = G.gear.promoteCost(item);
    const have = G.economy.getGear(cost.kind);
    const can  = G.gear.canPromote(item);
    const costLabel = cost.kind === "uncommon" ? "Uncommon" : "Common";
    const icon = (G.data.slots.find((s) => s.id === item.slot) || {}).icon || "❔";

    anvil.innerHTML = `<div class="anvil-icon" style="--rar:${nextRar.color}">
        <span class="ico-ph">${icon}</span>
        <img src="assets/gear/${item.slot}.png" alt="" onerror="this.remove()">
      </div>
      <div class="anvil-card">
      <div class="anvil-name">${item.slotLabel}</div>
      <div class="anvil-rar"><b style="color:${item.color}">${item.rarityName}</b> <em>→</em> <b style="color:${nextRar.color}">${nextRar.name}</b></div>
      <div class="anvil-affixes">${rows}</div>
      <div class="anvil-cost ${have >= cost.amount ? "ok" : "short"}">${G.util.fmt(have)} / ${cost.amount} ${costLabel}</div>
      <button class="forge-btn forge-btn--up" data-promote="${item.slot}" ${can ? "" : "disabled"}>Promote</button>
    </div>`;
    anvil.hidden = false;
    anvil.querySelectorAll("[data-promote]").forEach((b) =>
      b.addEventListener("click", () => this.doForgePromote(b.dataset.promote)));
  },

  doForgeConvert(i) {
    const c = G.economy.CONVERSIONS[i];
    if (c && G.economy.convertGear(c) > 0) { G.state.save(); this.renderForge(); }
  },

  doForgePromote(slotId) {
    const item = G.state.data.equipped[slotId];
    if (item && G.gear.promote(item)) {
      G.state.invalidateStats();
      G.state.save();
      this.renderForge();
      this.renderGear();
      this.renderStats();
    }
  },

  gearTipHtml(item) {
    const lvl = item.level || 1;
    const cap = G.gear.cap(item);
    const affixes = item.affixes.map((a) => {
      const v    = G.gear.affixValue(item, a);
      const sign = a.pct ? "%" : "";
      const kind = a.layer === "pct" ? "Bonus" : "Primary";
      const perLv = a.perLevel
        ? `<span class="tip-perlv">+${this.fmtStat(a.perLevel)}${sign} per level</span>` : "";
      return `<div class="tip-affix"><span class="tip-affix__main">+${this.fmtStat(v)}${sign} ${a.label} ${kind}</span>${perLv}</div>`;
    }).join("");
    return `<div class="tip-name" style="color:${item.color}">${item.name}</div>
      <div class="tip-sub" style="color:${item.color}">${item.rarityName} ${item.slotLabel}</div>
      <div class="tip-lvl">Level ${lvl} / ${cap}</div>
      <div class="tip-affixes">${affixes}</div>`;
  },

  showGearTip(slot) {
    const tip = this.el["gear-tooltip"];
    if (!tip) return;
    const item = G.state.data.equipped[slot.dataset.tip];
    if (!item) return;
    tip.innerHTML = this.gearTipHtml(item);
    tip.hidden = false;
    const modal = slot.closest(".modal--gear");
    if (!modal) return;
    const mr = modal.getBoundingClientRect();
    const sr = slot.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    const isLeft = sr.left + sr.width / 2 < mr.left + mr.width / 2;
    let left = isLeft ? sr.right - mr.left + 12 : sr.left - mr.left - tr.width - 12;
    let top  = sr.top - mr.top;
    left = G.util.clamp(left, 8, mr.width - tr.width - 8);
    top  = G.util.clamp(top,  8, mr.height - tr.height - 8);
    tip.style.left = left + "px";
    tip.style.top  = top  + "px";
  },

  hideGearTip() {
    const tip = this.el["gear-tooltip"];
    if (tip) tip.hidden = true;
  },

  doGearLevelUp(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    const done = G.gear.levelUpTimes(item, this.gearMult);
    if (done > 0) this.log(`${item.name} → Lv. ${item.level}`, "good");
    else this.log("Not enough Lumens.", "bad");
    G.state.save();
    this.renderAll();
  },

  doGearPromote(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    if (G.gear.promote(item)) {
      const promoted = G.state.data.equipped[slotId];
      this.log(`✦ ${promoted.name} promoted to ${promoted.rarityName}!`, "good");
    } else {
      this.log("Not enough materials to promote.", "bad");
    }
    G.state.save();
    this.renderAll();
  },

  // Area navigation
  goToArea(delta) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const ni   = G.util.clamp(d.areaIndex + delta, 0, maxU);
    if (ni === d.areaIndex) return;
    d.areaIndex = ni;
    G.combat.enemy = null; G.combat.pendingHits = []; G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
  },

  travelTo(i) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const close = () => { const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true; };
    if (i < 0 || i > maxU || i === d.areaIndex) { close(); return; }
    d.areaIndex = i;
    G.combat.enemy = null; G.combat.pendingHits = []; G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
    close();
  },

  onAreaChange() { this._lastArt = null; this.renderResources(); },

  // Combat
  _lastArt: null,

  renderEnemy() {
    const container = this.el["enemies-container"];
    if (!container) return;

    const alive = G.combat.enemies.filter(e => !e.dead);

    if (!alive.length) {
      if (container.innerHTML) container.innerHTML = "";
      container.className = "enemies-container";
      this._enemySig = "";
      return;
    }

    // renderiza a onda INTEIRA (mortos inclusos, greyed) → posições não mudam quando 1 morre,
    // e os índices enemy-art-{i} batem com os índices do combat (projéteis/floaters certos).
    const list = G.combat.enemies;
    const sig  = list.map(e => e.name + (e.rarity ? e.rarity.tag : "") + (e.isBoss ? "B" : "")).join("|");

    if (this._enemySig !== sig) {
      this._enemySig = sig;
      container.className = `enemies-container pack-${Math.min(list.length, 3)}`;
      container.innerHTML = list.map((e, i) => {
        const nameHtml  = e.rarity ? `${e.name} · ${e.rarity.tag}` : (e.name + (e.isBoss ? " 👑" : ""));
        const nameColor = e.rarity ? ` style="color:${e.rarity.color}"` : "";
        return `<div class="enemy-card${e.isBoss ? " boss" : ""}" data-idx="${i}">
          <span class="enemy-name"${nameColor}>${nameHtml}</span>
          <div class="enemy-figure${e.isBoss ? " boss" : ""}" id="enemy-art-${i}">
            <span class="art-ph">${e.sprite}</span>
            ${e.img ? `<img class="art-img" src="${e.img}" alt="" onerror="this.remove()" />` : ""}
            <div class="floaters" id="floaters-enemy-${i}"></div>
          </div>
          <div class="enemy-info">
            <span class="card-sub">Lv. <b>${e.level}</b> · ATK <b>${G.util.fmt(e.dmg)}</b></span>
            <div class="bar enemy-bar">
              <div class="bar-fill enemy-fill" id="enemy-hp-fill-${i}"></div>
              <span class="bar-label" id="enemy-hp-label-${i}"></span>
            </div>
          </div>
        </div>`;
      }).join("");
    }

    // por tick: HP + classes morto/ativo (sem rebuild → nada se reposiciona)
    const firstAlive = list.findIndex(e => !e.dead);
    list.forEach((e, i) => {
      const card = container.children[i];
      if (card) {
        card.classList.toggle("enemy-dead", !!e.dead);
        card.classList.toggle("enemy-active", i === firstAlive);
      }
      const fill  = document.getElementById(`enemy-hp-fill-${i}`);
      const label = document.getElementById(`enemy-hp-label-${i}`);
      if (fill)  fill.style.width = G.util.clamp((e.hp / e.maxHp) * 100, 0, 100) + "%";
      if (label) label.textContent = `HP ${G.util.fmt(Math.max(0, e.hp))} / ${G.util.fmt(e.maxHp)}`;
    });
  },

  floater(amount, type) {
    const target = type === "enemy"
      ? document.getElementById("floaters-hero") : document.getElementById("floaters-enemy-0");
    if (!target) return;
    const f = document.createElement("span");
    f.className = "floater " + type;
    f.textContent = (type === "enemy" ? "-" : "") + G.util.fmt(amount) + (type === "crit" ? "!" : "");
    f.style.left = G.util.randInt(20, 80) + "%";
    target.appendChild(f);
    setTimeout(() => f.remove(), 800);
  },

  projectile(type, idx) {
    const enemyEl = "enemy-art-" + (idx || 0);
    const fromEl = document.getElementById(type === "mob" ? enemyEl : "hero-art");
    const toEl   = document.getElementById(type === "mob" ? "hero-art" : enemyEl);
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2, y1 = a.top + a.height * 0.42;
    const x2 = b.left + b.width / 2, y2 = b.top + b.height * 0.42;
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 32;
    const img = document.createElement("img");
    img.className = "projectile" + (type === "mob" ? " projectile--mob" : "");
    img.src       = type === "mob" ? "assets/fx/bolt_mob.png" : "assets/fx/bolt_seeker.png";
    const dur = type === "mob" ? 0.9 : 0.5;   // bolt do mob mais lento/telegrafado
    img.style.cssText = `left:${x1}px;top:${y1}px;transform:translate(-50%,-50%) rotate(${ang}deg)`;
    img.style.transitionDuration = dur + "s";
    document.body.appendChild(img);
    void img.offsetWidth;
    img.style.left = x2 + "px"; img.style.top = y2 + "px"; img.style.opacity = "0.7";
    setTimeout(() => img.remove(), dur * 1000 + 80);
  },

  // ---------- PASSIVES (Árvore-Mundo) ----------
  renderPassives() {
    const P = G.passives;
    if (!this.passivesTab) this.passivesTab = "eclat";
    const tab = this.passivesTab;
    if (this.el["pv-points"]) this.el["pv-points"].textContent = G.util.fmt(G.state.data.convergencePoints || 0);
    const unlocked = P.unlocked();
    if (this.el["pv-lock"]) this.el["pv-lock"].hidden = unlocked;
    const tabs = this.el["pv-tabs"];
    if (tabs) {
      tabs.style.visibility = unlocked ? "" : "hidden";
      tabs.innerHTML = P.TREES.map((t) => {
        const tr = P.trees[t];
        return `<button class="pv-tab ${tr.cls}${t === tab ? " active" : ""}" data-tree="${t}">
          <span class="pv-emblem"><img class="pv-fruit" src="assets/passives/fruit_${t}.webp" alt="" onerror="this.style.display='none'"></span>
          <span class="pv-tab-name">${tr.label}</span>
          <span class="pv-tab-count">${this._pvCount(t)}</span>
        </button>`;
      }).join("");
    }
    const body = this.el["pv-body"];
    if (body) {
      body.style.visibility = unlocked ? "" : "hidden";
      body.className = `pv-body ${P.trees[tab].cls}`;
      body.innerHTML = unlocked ? this._pvTreeHtml(tab) : "";
    }
  },

  _pvCount(tree) {
    const pr = G.passives.treeProgress(tree);
    return `${pr.unlocked}/${pr.total}${pr.maxed ? ` · ✦${pr.maxed}` : ""}`;
  },

  _pvTreeHtml(tree) {
    const P = G.passives, tr = P.trees[tree];
    const summary = `<div class="pv-summary">
      <span class="pv-sum-orb"></span><span class="pv-sum-l">${tr.label} bonus</span>
      <span class="pv-sum-div"></span><span class="pv-total">×${(() => { const m = P.treeMult(tree); return m < 100 ? m.toFixed(2) : G.util.fmt(m); })()}</span>
      <span class="pv-sum-stat">${tr.stat}</span></div>`;
    let nodes = "";
    for (let i = 0; i < 15; i++) nodes += this._pvNode(tree, i);
    return summary + `<div class="pv-tree">${nodes}</div>`;
  },

  _pvNode(tree, i) {
    const P = G.passives;
    const [name, key] = P.trees[tree].list[i];
    const pos = P.POSITIONS[i];
    const level = P.level(tree, i);
    const maxed = P.isMax(tree, i);
    const deferred = P.isDeferred(tree, i);
    const locked = deferred || (!P.groupUnlocked(tree, P.groupOf(i)) && level === 0);
    const role = P.isEngine(tree, key) ? "role-engine" : (P.leverOf(key) ? "role-lever" : "");
    const cls = ["pv-node", role, i >= 10 ? "tip-below" : "", maxed ? "maxed" : "",
      P.canBuy(tree, i) ? "buyable" : "", level > 0 && !maxed ? "owned" : "", locked ? "locked" : ""]
      .filter(Boolean).join(" ");
    const m = `assets/passives/${tree}/${key}.webp`;
    const mc = `-webkit-mask-image:url('${m}');mask-image:url('${m}')`;
    const nmax = P.nodeMax(tree, i);
    const lvlText = deferred ? "M2" : (maxed ? "✦" : (level > 0 ? `${level}/${nmax}` : ""));
    const foot = deferred ? `<div class="pv-tip-foot locked">Map 2 — coming later</div>`
      : maxed ? `<div class="pv-tip-foot max">Max Level</div>`
      : locked ? `<div class="pv-tip-foot locked">Locked — max the tier below</div>`
      : `<div class="pv-tip-foot cost">${level === 0 ? "Unlock" : "Upgrade"} · ${G.util.fmt(P.nextCost(tree, i))} pts</div>`;
    return `<button class="${cls}" data-i="${i}" style="left:${pos.x}%;top:${pos.y}%;--p:${(level / nmax).toFixed(3)}">
      <span class="pv-disc"><span class="pv-icon" style="${mc}"></span><i class="pv-ring"></i></span>
      <span class="pv-node-name">${name}</span>
      <span class="pv-node-lvl">${lvlText}</span>
      <div class="pv-tip">
        <div class="pv-tip-head"><span class="pv-tip-icon"><span class="pv-icon" style="${mc}"></span></span>
          <div class="pv-tip-htext"><div class="pv-tip-name">${name} <span class="pv-tip-tag">Passive</span></div>
            <div class="pv-tip-lvl">Level ${level}/${nmax}</div></div></div>
        <p class="pv-tip-eff">${this._pvEffect(tree, i)}</p>${foot}
      </div>
    </button>`;
  },

  _pvEffect(tree, i) {
    const P = G.passives, key = P.trees[tree].list[i][1];
    const desc = (P.EFFECT_DESC && P.EFFECT_DESC[key]) || "Effect pending balancing.";
    const m = P.magnitude(tree, i);
    if (!m) return desc;
    const now = m.current ? ` · now <b>${m.current}</b>` : "";
    return `${desc}<br><b>${m.perLevel}</b> / level${now}`;
  },

  // ---------- AWAKEN ----------
  renderAwaken() {
    const d = G.state.data;
    if (this.el["awaken-essence"])
      this.el["awaken-essence"].textContent = G.util.fmt((d.awakenMaterials && d.awakenMaterials.firstLight) || 0);
    const wrap = this.el["awaken-list"];
    if (!wrap) return;

    if (!this._selectedAwaken) {
      const first = G.data.awakens.find((a) => !G.awaken.isUnlocked(a.id)) || G.data.awakens[0];
      if (first) this._selectedAwaken = first.id;
    }

    wrap.innerHTML = G.data.awakens.map((a) => {
      const unlocked = G.awaken.isUnlocked(a.id);
      const can = G.awaken.canUnlock(a.id);
      const state = unlocked ? "done" : can ? "ready" : "locked";
      const badge = unlocked ? "Awakened" : can ? "Ready" : "Locked";
      const b = a.bonus;
      const shortFx = [
        b.atkMult ? `ATK ×${b.atkMult}` : null,
        b.hpMult ? `HP ×${b.hpMult}` : null,
        b.crit ? `Crit +${b.crit}%` : null,
        b.lumensBonus ? `Lumens +${b.lumensBonus}%` : null,
        b.xpBonus ? `XP +${b.xpBonus}%` : null,
      ].filter(Boolean).slice(0, 2).join(" · ");
      const active = this._selectedAwaken === a.id ? " is-active" : "";
      return `<li class="awk-entry is-${state}${active}" data-id="${a.id}">
        <div class="awk-entry__top">
          <span class="awk-entry__name">${a.name}</span>
          <span class="awk-entry__badge">${badge}</span>
        </div>
        <span class="awk-entry__fx">${shortFx}</span>
      </li>`;
    }).join("");

    this.renderAwakenPreview(this._selectedAwaken);
  },

  renderAwakenPreview(id) {
    const panel = this.el["awaken-preview"];
    if (!panel) return;
    const a = G.data.awakens.find((x) => x.id === id);
    if (!a) { panel.innerHTML = ""; return; }

    const unlocked = G.awaken.isUnlocked(a.id);
    const can = G.awaken.canUnlock(a.id);
    const s = G.state.stats();
    const b = a.bonus;

    const statRows = [
      b.atkMult  ? { label: "ATK",       before: G.util.fmt(s.atk),          after: G.util.fmt(Math.round(s.atk * b.atkMult)), active: unlocked } : null,
      b.hpMult   ? { label: "HP",        before: G.util.fmt(s.hp),           after: G.util.fmt(Math.round(s.hp  * b.hpMult)),  active: unlocked } : null,
      b.crit     ? { label: "Crit",      before: `${s.crit.toFixed(1)}%`,    after: `${Math.min(100, s.crit + b.crit).toFixed(1)}%`,  active: unlocked } : null,
      b.critDmg  ? { label: "Crit Dmg",  before: `${s.critDmg.toFixed(0)}%`, after: `${(s.critDmg + b.critDmg).toFixed(0)}%`,   active: unlocked } : null,
      b.lumensBonus ? { label: "Lumens Bonus", before: `${s.lumensBonus.toFixed(0)}%`, after: `${(s.lumensBonus + b.lumensBonus).toFixed(0)}%`, active: unlocked } : null,
      b.xpBonus  ? { label: "XP Bonus",  before: `${s.xpBonus.toFixed(0)}%`,  after: `${(s.xpBonus + b.xpBonus).toFixed(0)}%`,   active: unlocked } : null,
    ].filter(Boolean);

    const reqName = { area: "Area", level: "Lv", kills: "Kills", convergences: "Convergences" };
    const reqs = G.awaken.requirements(a.id).map((r) => {
      const base = r.key.indexOf("material:") === 0 ? "Awaken Mat" : (reqName[r.key] || r.key);
      return { label: `${base} ${G.util.fmt(r.have)}/${G.util.fmt(r.need)}`, met: r.met };
    });

    const stateClass = unlocked ? " is-done" : can ? " is-ready" : "";
    const action = unlocked
      ? `<div class="awk-preview__done">✦ Awakened — the light endures</div>`
      : `<button class="btn btn-ornate awk-preview__btn" data-awaken="${a.id}"${can ? "" : " disabled"}>${can ? "◈ Awaken" : "Requirements not met"}</button>`;

    panel.innerHTML = `<div class="awk-preview__inner${stateClass}">
      <div class="awk-preview__head">
        <img class="awk-emblem" src="assets/ui/icon_awaken.png" alt="" onerror="this.remove()">
        <h3 class="awk-preview__title">${a.name}</h3>
        ${a.lore ? `<p class="awk-preview__lore">"${a.lore}"</p>` : ""}
      </div>
      <div class="awk-preview__stats">
        ${statRows.map((r) => `<div class="awk-stat-row">
          <span class="awk-stat-row__label">${r.label}</span>
          <div class="awk-stat-row__right">
            <span class="awk-stat-row__before">${r.before}</span>
            ${r.active
              ? `<span class="awk-stat-row__active">Active ✓</span>`
              : `<span class="awk-stat-row__arrow">→</span><span class="awk-stat-row__after">${r.after}</span>`}
          </div>
        </div>`).join("")}
      </div>
      <div class="awk-preview__reqs">
        <span class="awk-preview__reqs-label">Requirements</span>
        <div class="awk-reqs-grid">
          ${reqs.map((r) => `<div class="awk-req${r.met ? " is-met" : ""}">
            <span class="awk-req__icon">${r.met ? "✓" : "✗"}</span>
            <span class="awk-req__label">${r.label}</span>
          </div>`).join("")}
        </div>
      </div>
      <div class="awk-preview__action">${action}</div>
    </div>`;
  },

  // ---------- CONVERGENCE ----------
  renderConvergence() {
    const d = G.state.data;
    if (this.el["conv-points"]) this.el["conv-points"].textContent = G.util.fmt(d.convergencePoints || 0);
    if (this.el["conv-count"]) this.el["conv-count"].textContent = d.convergences || 0;
    if (this.el["conv-highest"]) this.el["conv-highest"].textContent = G.util.fmt(d.highestLevel || d.level);
    if (this.el["conv-pending"]) this.el["conv-pending"].textContent = G.util.fmt(G.convergence.pending());
    if (this.el["conv-current"]) this.el["conv-current"].textContent = `Lv ${G.util.fmt(d.level)} · ${G.data.currentArea().name}`;
    if (this.el["conv-return"]) this.el["conv-return"].textContent = `Lv 1 · ${G.data.areas[0].name}`;
    const btn = this.el["btn-converge"];
    if (btn) {
      const ok = G.convergence.canConverge();
      btn.disabled = !ok;
      btn.textContent = ok ? "Converge" : `Reach Lv ${G.convergence.gateLevel}`;
    }
  },

  // ---------- WORLD MAP ----------
  // posições dos 9 nós no mapa (% x,y) — fonte única p/ nós E trilha
  mapNodePos: [
    [10, 23], [36, 18], [66, 17], [82, 27], [61, 42],
    [35, 51], [10, 64], [28, 71], [71, 64],
  ],

  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d = G.state.data;
    const pos = this.mapNodePos;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);

    const trail = this.el["wmap-trail"];
    if (trail) {
      const crPath = (pts, tension = 0.5) => {
        if (pts.length < 2) return "";
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        let s = `M${p[1][0]},${p[1][1]}`;
        for (let i = 1; i < p.length - 2; i++) {
          const c1x = +(p[i][0] + (p[i+1][0] - p[i-1][0]) * tension / 3).toFixed(2);
          const c1y = +(p[i][1] + (p[i+1][1] - p[i-1][1]) * tension / 3).toFixed(2);
          const c2x = +(p[i+1][0] - (p[i+2][0] - p[i][0]) * tension / 3).toFixed(2);
          const c2y = +(p[i+1][1] - (p[i+2][1] - p[i][1]) * tension / 3).toFixed(2);
          s += ` C${c1x},${c1y} ${c2x},${c2y} ${p[i+1][0]},${p[i+1][1]}`;
        }
        return s;
      };
      const allPath  = crPath(pos);
      const donePath = crPath(pos.slice(0, maxU + 1));
      const vne = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
      trail.innerHTML =
        `<path d="${allPath}" ${vne} stroke="rgba(30,40,100,0.30)" stroke-width="8"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(110,125,200,0.22)" stroke-width="4"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(180,190,240,0.18)" stroke-width="1.5"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(0,0,0,0.55)" stroke-width="10"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(210,155,20,0.88)" stroke-width="5.5"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(255,242,170,0.65)" stroke-width="1.8"/>`;
    }

    wrap.innerHTML = G.data.areas.map((a, i) => {
      const locked = i > maxU;
      const cur = i === d.areaIndex;
      const [x, y] = pos[i] || [50, 50];
      const cls = `wmap-node${locked ? " is-locked" : ""}${cur ? " is-current" : ""}`;
      return `<button class="${cls}" style="left:${x}%;top:${y}%" data-area="${i}" title="${a.name}">
        <img src="assets/ui/node_${i + 1}.png" alt="" onerror="this.remove()" />
        <span class="wmap-node__name">${a.name}</span>
      </button>`;
    }).join("");
    wrap.querySelectorAll("[data-area]").forEach((b) => {
      b.addEventListener("click", () => this.openAreaInfo(+b.dataset.area));
    });
  },

  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d = G.state.data;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const locked = i > maxU;
    const isCurrent = i === d.areaIndex;

    const art = this.el["wmap-info-art"];
    if (art)
      art.style.backgroundImage = a.img
        ? `linear-gradient(180deg, rgba(7,10,22,0.05), rgba(7,10,22,0.55)), url('${a.img}')`
        : "none";
    const tints = ["#5ee0d2", "#e8b54a", "#9d7bff", "#7fb0ff", "#5ee0d2", "#e8b54a", "#cdb06a", "#c46a8a", "#e8d24a"];
    this.el["wmap-info"].style.setProperty("--area-tint", tints[i % tints.length]);

    this.el["wmap-info-name"].textContent = `${a.name} · ${i + 1}/${total}`;
    this.el["wmap-info-lore"].textContent = a.blurb || "";
    this.el["wmap-info-level"].textContent = `${a.levelRange[0]}–${a.levelRange[1]}`;
    const pack = i < 2 ? 1 : i < 5 ? 2 : 3;
    this.el["wmap-info-enemies"].textContent = pack + " per wave";
    if (a.boss) {
      this.el["wmap-info-boss-row"].hidden = false;
      this.el["wmap-info-boss"].textContent = a.boss.name;
    } else {
      this.el["wmap-info-boss-row"].hidden = true;
    }
    this.el["wmap-info-status"].textContent = locked ? "🔒 Locked" : isCurrent ? "Current" : "Unlocked";
    if (locked) {
      this.el["wmap-info-unlock-row"].hidden = false;
      this.el["wmap-info-unlock"].textContent = `Reach level ${a.levelRange[0]}`;
    } else {
      this.el["wmap-info-unlock-row"].hidden = true;
    }

    const lumPerKill = Math.ceil(G.data.mobHpAt(a.levelRange[0], a) * G.data.balance.goldRatio);
    const res = [`<li><span>Lumens</span><b>+${G.util.fmt(lumPerKill)}</b></li>`];
    res.push(`<li><span>XP</span><b>+${G.util.fmt(Math.ceil(G.data.balance.baseXp * a.levelRange[0]))}</b></li>`);
    if (i >= 5) res.push(`<li><span>Awaken Material</span><b>Boss</b></li>`);
    this.el["wmap-info-res"].innerHTML = res.join("");

    const tbtn = this.el["wmap-info-travel"];
    if (isCurrent) { tbtn.disabled = true; tbtn.textContent = "You are here"; }
    else if (locked) { tbtn.disabled = true; tbtn.textContent = `🔒 Reach Lv ${a.levelRange[0]}`; }
    else { tbtn.disabled = false; tbtn.textContent = "Travel here"; }

    this.el["wmap-info"].hidden = false;
  },

  materialDrop(drops) {
    const container = document.getElementById("mat-drops");
    if (!container) return;
    const SINK   = G.economy ? G.economy.MATERIAL_SINK : {};
    const LABELS = { common: "Common", uncommon: "Uncommon", firstLight: "First Light" };
    for (const [matKey, qty] of Object.entries(drops)) {
      if (!qty) continue;
      const sink = SINK[matKey];
      if (!sink) continue;
      const kind = sink.kind;
      const el = document.createElement("div");
      el.className = `mat-drop mat-drop--${kind}`;
      el.innerHTML = `<img src="assets/materials/${kind}.png" class="mat-drop__icon" alt="" onerror="this.remove()"><span>+${qty} ${LABELS[kind] || kind}</span>`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  },

  log(msg, cls) {
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    line.textContent = msg;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
  },
};
