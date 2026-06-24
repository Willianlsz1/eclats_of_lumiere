// ui.js — renderização e eventos. Nenhuma regra de jogo aqui.

G.ui = {
  el: {},
  gearMult: 1,

  cache() {
    const ids = [
      "res-lumens", "res-area",
      "hero-tier", "hero-level", "xp-fill", "xp-label",
      "stats-list", "btn-upgrade", "upgrade-cost",
      "enemy-art", "enemy-name", "enemy-level", "enemy-atk",
      "enemy-hp-fill", "enemy-hp-label", "floaters",
      "hero-card-level", "hero-hp-fill", "hero-hp-label", "log",
      "gear-stats", "gear-slots", "gear-mult", "gear-tooltip",
      "wmap-nodes", "wmap-trail",
      "wmap-info", "wmap-info-art", "wmap-info-name", "wmap-info-lore",
      "wmap-info-level", "wmap-info-enemies", "wmap-info-status",
      "wmap-info-res", "wmap-info-travel", "wmap-info-close",
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
  },

  bind() {
    this.el["btn-upgrade"].addEventListener("click", () => this.doUpgrade());

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

    if (this.el["wmap-info-close"])
      this.el["wmap-info-close"].addEventListener("click", () => { this.el["wmap-info"].hidden = true; });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => { if (this._infoArea != null) this.travelTo(this._infoArea); });

    const wback = document.getElementById("wmap-back");
    if (wback) wback.addEventListener("click", () => { document.getElementById("modal-worldmap").hidden = true; });

    const tabs = document.getElementById("log-tabs");
    if (tabs) tabs.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab")) return;
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      e.target.classList.add("is-active");
    });
  },

  openModal(id) {
    this.renderAll();
    if (id === "modal-worldmap") {
      this.renderWorldMap();
      if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
    }
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

  // Forge
  upgradeCost() {
    const b = G.data.balance;
    return Math.ceil(b.forgeCostBase * Math.pow(b.forgeCostGrowth, G.state.data.weaponUpgrades));
  },

  doUpgrade() {
    const cost = this.upgradeCost();
    if (G.state.data.lumens < cost) { this.log("Not enough Lumens to reforge.", "bad"); return; }
    G.state.data.lumens -= cost;
    G.state.data.weaponUpgrades += 1;
    G.state.invalidateStats();
    this.log("Forge: weapon reforged (+4% ATK).", "good");
    this.renderAll();
  },

  // ---------- RENDER ----------
  renderAll() {
    this.renderResources();
    this.renderHero();
    this.renderStats();
    this.renderGear();
    this.renderUpgrade();
    this.renderHeroHp();
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
  },

  currentTier() {
    const lvl = G.state.data.level;
    let t = G.data.tiers[0];
    for (const tier of G.data.tiers) if (lvl >= tier.level) t = tier;
    return t;
  },

  renderHero() {
    const t = this.currentTier();
    this.el["hero-tier"].textContent      = `${t.code} · ${t.name}`;
    this.el["hero-level"].textContent     = G.state.data.level;
    this.el["hero-card-level"].textContent= G.state.data.level;
    const need = G.state.xpToNext();
    const pct  = G.util.clamp((G.state.data.xp / need) * 100, 0, 100);
    this.el["xp-fill"].style.width   = pct + "%";
    this.el["xp-label"].textContent  = `${G.util.fmt(G.state.data.xp)} / ${G.util.fmt(need)} XP`;
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
      ["ATK",          G.util.fmt(s.atk)],
      ["Max HP",       G.util.fmt(s.hp)],
      ["Crit",         s.crit.toFixed(0) + "%"],
      ["Crit Dmg",     "+" + this.fmtStat(s.critDmg) + "%"],
      ["Atk Speed",    s.atkSpeed.toFixed(2) + " /s"],
      ["XP Bonus",     "+" + this.fmtStat(s.xpBonus) + "%"],
      ["Lumens Bonus", "+" + s.lumensBonus.toFixed(0) + "%"],
    ];
    const html = rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
    if (this.el["stats-list"]) this.el["stats-list"].innerHTML = html;
    if (this.el["gear-stats"]) this.el["gear-stats"].innerHTML = html;
  },

  renderGear() {
    if (!this.el["gear-slots"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl   = item.level || 1;
      const cap   = G.gear.cap(item);
      const maxed = G.gear.isMaxed(item);
      const action = maxed
        ? `<span class="gear-max">MAX</span>`
        : `<span class="gear-slot__cost">✦ ${G.util.fmt(G.gear.cost(item))}</span>
           <button class="gear-levelup" data-levelup="${slot.id}">Level up</button>`;
      return `<div class="gear-slot pos-${slot.id}" data-tip="${slot.id}" style="--rar:${item.color}">
        <span class="gear-slot__rar" style="color:${item.color}">${item.rarityName}</span>
        <span class="gear-slot__lvl">LVL ${lvl}/${G.util.fmt(cap)}</span>
        <div class="gear-slot__icon">
          <span class="ico-ph">${slot.icon}</span>
          <img class="ico-img" src="assets/gear/${slot.id}.png" alt="" onerror="this.remove()" />
        </div>
        <div class="gear-slot__action">${action}</div>
      </div>`;
    };
    const node = this.el["gear-slots"];
    node.innerHTML = G.data.slots.map(slotCard).join("");
    node.querySelectorAll("[data-levelup]").forEach((b) =>
      b.addEventListener("click", () => this.doGearLevelUp(b.dataset.levelup))
    );
    node.querySelectorAll(".gear-slot[data-tip]").forEach((s) => {
      s.addEventListener("mouseenter", () => this.showGearTip(s));
      s.addEventListener("mousemove",  () => this.showGearTip(s));
      s.addEventListener("mouseleave", () => this.hideGearTip());
    });
  },

  gearTipHtml(item) {
    const lvl = item.level || 1;
    const affixes = item.affixes.map((a) => {
      const v    = G.gear.affixValue(item, a);
      const sign = a.pct ? "%" : "";
      const kind = a.layer === "pct" ? "Bonus" : "Primary";
      const perLv= a.perLevel
        ? `<span class="tip-perlv">+${this.fmtStat(a.perLevel)}${sign} per level</span>` : "";
      return `<div class="tip-affix"><span class="tip-affix__main">+${this.fmtStat(v)}${sign} ${a.label} ${kind}</span>${perLv}</div>`;
    }).join("");
    return `<div class="tip-name" style="color:${item.color}">${item.name}</div>
      <div class="tip-sub" style="color:${item.color}">${item.rarityName} ${item.slotLabel}</div>
      <div class="tip-lvl">Level ${lvl} / ${G.gear.cap(item)}</div>
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
    const mr = modal.getBoundingClientRect(), sr = slot.getBoundingClientRect(), tr = tip.getBoundingClientRect();
    const isLeft = sr.left + sr.width / 2 < mr.left + mr.width / 2;
    let left = isLeft ? sr.right - mr.left + 12 : sr.left - mr.left - tr.width - 12;
    let top  = sr.top  - mr.top;
    tip.style.left = G.util.clamp(left, 8, mr.width  - tr.width  - 8) + "px";
    tip.style.top  = G.util.clamp(top,  8, mr.height - tr.height - 8) + "px";
  },

  hideGearTip() { const t = this.el["gear-tooltip"]; if (t) t.hidden = true; },

  doGearLevelUp(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    const done = G.gear.levelUpTimes(item, this.gearMult);
    if (done > 0) this.log(`${item.name} → Lv. ${item.level}`, "good");
    else          this.log("Not enough Lumens.", "bad");
    this.renderAll();
  },

  renderUpgrade() {
    if (this.el["upgrade-cost"])
      this.el["upgrade-cost"].textContent = `Cost: ${G.util.fmt(this.upgradeCost())} ✦`;
  },

  // World Map
  mapNodePos: [
    [10, 23], [36, 18], [66, 17], [82, 27], [61, 42],
    [35, 51], [10, 64], [28, 71], [71, 64],
  ],

  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d    = G.state.data;
    const pos  = this.mapNodePos;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);

    const trail = this.el["wmap-trail"];
    if (trail) {
      const crPath = (pts, tension = 0.5) => {
        if (pts.length < 2) return "";
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        let path = `M${p[1][0]},${p[1][1]}`;
        for (let i = 1; i < p.length - 2; i++) {
          const c1x = +(p[i][0]   + (p[i+1][0] - p[i-1][0]) * tension / 3).toFixed(2);
          const c1y = +(p[i][1]   + (p[i+1][1] - p[i-1][1]) * tension / 3).toFixed(2);
          const c2x = +(p[i+1][0] - (p[i+2][0] - p[i][0])   * tension / 3).toFixed(2);
          const c2y = +(p[i+1][1] - (p[i+2][1] - p[i][1])   * tension / 3).toFixed(2);
          path += ` C${c1x},${c1y} ${c2x},${c2y} ${p[i+1][0]},${p[i+1][1]}`;
        }
        return path;
      };
      const vne      = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
      const allPath  = crPath(pos);
      const donePath = crPath(pos.slice(0, maxU + 1));
      trail.innerHTML =
        `<path d="${allPath}" ${vne} stroke="rgba(30,40,100,0.30)"  stroke-width="8"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(110,125,200,0.22)" stroke-width="4"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(180,190,240,0.18)" stroke-width="1.5"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(0,0,0,0.55)"      stroke-width="10"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(210,155,20,0.88)" stroke-width="5.5"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(255,242,170,0.65)" stroke-width="1.8"/>`;
    }

    wrap.innerHTML = G.data.areas.map((a, i) => {
      const locked = i > maxU, cur = i === d.areaIndex;
      const [x, y] = pos[i] || [50, 50];
      return `<button class="wmap-node${locked ? " is-locked" : ""}${cur ? " is-current" : ""}"
        style="left:${x}%;top:${y}%" data-area="${i}" title="${a.name}"${locked ? " disabled" : ""}>
        <img src="assets/ui/node_${i + 1}.png" alt="" onerror="this.remove()" />
        <span class="wmap-node__name">${a.name}</span>
      </button>`;
    }).join("");
    wrap.querySelectorAll("[data-area]").forEach((b) =>
      b.addEventListener("click", () => this.openAreaInfo(+b.dataset.area))
    );
  },

  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d     = G.state.data;
    const maxU  = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const tints = ["#5ee0d2","#e8b54a","#9d7bff","#7fb0ff","#5ee0d2","#e8b54a","#cdb06a","#c46a8a","#e8d24a"];

    const art = this.el["wmap-info-art"];
    if (art) art.style.backgroundImage = a.img
      ? `linear-gradient(180deg,rgba(7,10,22,0.05),rgba(7,10,22,0.55)),url('${a.img}')` : "none";
    this.el["wmap-info"].style.setProperty("--area-tint", tints[i % tints.length]);
    this.el["wmap-info-name"].textContent    = `${a.name} · ${i + 1}/${G.data.areas.length}`;
    this.el["wmap-info-lore"].textContent    = a.blurb || "";
    this.el["wmap-info-level"].textContent   = `${a.levelRange[0]}–${a.levelRange[1]}`;
    const pack = i < 2 ? 1 : i < 5 ? 2 : 3;
    this.el["wmap-info-enemies"].textContent = `${pack} per wave`;
    this.el["wmap-info-status"].textContent  = i > maxU ? "Locked" : i === d.areaIndex ? "Current" : "Unlocked";

    const lumPerKill = Math.ceil(G.data.mobHpAt(a.levelRange[0], a) * G.data.balance.goldRatio);
    this.el["wmap-info-res"].innerHTML =
      `<li><span>Lumens</span><b>+${G.util.fmt(lumPerKill)}</b></li>` +
      `<li><span>XP</span><b>+${G.util.fmt(Math.ceil(G.data.balance.baseXp * a.levelRange[0]))}</b></li>`;

    const tbtn = this.el["wmap-info-travel"];
    if (i === d.areaIndex) { tbtn.disabled = true;  tbtn.textContent = "You are here"; }
    else if (i > maxU)     { tbtn.disabled = true;  tbtn.textContent = `🔒 Defeat the boss first`; }
    else                   { tbtn.disabled = false; tbtn.textContent = "Travel here"; }

    this.el["wmap-info"].hidden = false;
  },

  travelTo(i) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    if (i < 0 || i > maxU || i === d.areaIndex) {
      const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true; return;
    }
    d.areaIndex = i;
    G.combat.enemy = null; G.combat.pendingHits = []; G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
    const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true;
  },

  goToArea(delta) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const ni   = G.util.clamp(d.areaIndex + delta, 0, maxU);
    if (ni === d.areaIndex) return;
    d.areaIndex = ni;
    G.combat.enemy = null; G.combat.pendingHits = []; G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
  },

  onAreaChange() { this._lastArt = null; this.renderResources(); },

  // Combat
  _lastArt: null,

  renderEnemy() {
    const e = G.combat.enemy;
    if (!e) {
      if (this._lastArt !== null) {
        this._lastArt = null;
        this.el["enemy-art"].innerHTML = "";
        const be = document.querySelector(".battle-enemy");
        if (be) be.classList.add("enemy-hidden");
      }
      return;
    }
    if (this._lastArt !== e.name) {
      const be = document.querySelector(".battle-enemy");
      if (be) be.classList.remove("enemy-hidden");
      this._lastArt = e.name;
      this.el["enemy-art"].innerHTML =
        `<span class="art-ph">${e.sprite}</span>` +
        (e.img ? `<img class="art-img" src="${e.img}" alt="" onerror="this.remove()" />` : "");
      this.el["enemy-art"].classList.toggle("boss", e.isBoss);
      this.el["enemy-name"].textContent = e.rarity
        ? `${e.name} · ${e.rarity.tag}` : (e.name + (e.isBoss ? " 👑" : ""));
      this.el["enemy-name"].style.color = e.rarity ? e.rarity.color : "";
      this.el["enemy-level"].textContent = e.level;
      this.el["enemy-atk"].textContent   = G.util.fmt(e.dmg);
    }
    const pct = G.util.clamp((e.hp / e.maxHp) * 100, 0, 100);
    this.el["enemy-hp-fill"].style.width = pct + "%";
    this.el["enemy-hp-label"].textContent = `${G.util.fmt(Math.max(0, e.hp))} / ${G.util.fmt(e.maxHp)}`;
  },

  renderHeroHp() {
    const max = G.state.maxHp();
    const pct = G.util.clamp((G.state.data.hp / max) * 100, 0, 100);
    this.el["hero-hp-fill"].style.width   = pct + "%";
    this.el["hero-hp-label"].textContent  = `${G.util.fmt(Math.max(0, G.state.data.hp))} / ${G.util.fmt(max)}`;
  },

  renderHud() {
    const s   = G.state.stats();
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("hud-atk",  G.util.fmt(s.atk));
    set("hud-dps",  G.util.fmt(Math.round(s.atk / G.state.attackInterval())));
    set("hud-crit", s.crit.toFixed(0) + "%");
  },

  floater(amount, type) {
    const target = type === "enemy"
      ? document.getElementById("floaters-hero") : this.el["floaters"];
    if (!target) return;
    const f = document.createElement("span");
    f.className = "floater " + type;
    f.textContent = (type === "enemy" ? "-" : "") + G.util.fmt(amount) + (type === "crit" ? "!" : "");
    f.style.left = G.util.randInt(20, 80) + "%";
    target.appendChild(f);
    setTimeout(() => f.remove(), 800);
  },

  projectile(type) {
    const fromEl = document.getElementById(type === "mob" ? "enemy-art" : "hero-art");
    const toEl   = document.getElementById(type === "mob" ? "hero-art"  : "enemy-art");
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2, y1 = a.top + a.height * 0.42;
    const x2 = b.left + b.width / 2, y2 = b.top + b.height * 0.42;
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 32;
    const img = document.createElement("img");
    img.className = "projectile" + (type === "mob" ? " projectile--mob" : "");
    img.src       = type === "mob" ? "assets/fx/bolt_mob.png" : "assets/fx/bolt_seeker.png";
    img.style.cssText = `left:${x1}px;top:${y1}px;transform:translate(-50%,-50%) rotate(${ang}deg)`;
    document.body.appendChild(img);
    void img.offsetWidth;
    img.style.left = x2 + "px"; img.style.top = y2 + "px"; img.style.opacity = "0.7";
    setTimeout(() => img.remove(), 540);
  },

  log(msg, cls) {
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    line.textContent = msg;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
  },
};
