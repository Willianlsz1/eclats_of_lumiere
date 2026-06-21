// =============================================================
// ui.js — desenha o estado na tela e trata os cliques
// =============================================================
// Nenhuma regra de jogo aqui — só lê G.state/G.combat e mostra.

G.ui = {
  el: {},
  gearMult: 1, // multiplicador de level-up do gear (1 / 10 / "max")

  // pega os elementos uma vez
  cache() {
    const ids = [
      "res-lumens", "res-area",
      "hero-tier", "hero-level", "xp-fill", "xp-label",
      "stats-list", "btn-upgrade", "upgrade-cost",
      "enemy-art", "enemy-name", "enemy-level", "enemy-atk",
      "enemy-hp-fill", "enemy-hp-label", "floaters",
      "hero-card-level", "hero-hp-fill", "hero-hp-label", "log",
      "gear-stats", "gear-left", "gear-right", "gear-mult",
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
  },

  bind() {
    this.el["btn-upgrade"].addEventListener("click", () => this.doUpgrade());
    // multiplicador de level-up do gear (x1 / x10 / Max)
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
    // abas do log (cosmético por enquanto)
    const tabs = document.getElementById("log-tabs");
    if (tabs) tabs.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab")) return;
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      e.target.classList.add("is-active");
    });
  },

  // abre um modal e atualiza o conteúdo dele
  openModal(id) {
    this.renderAll();
    const m = document.getElementById(id);
    if (m) m.hidden = false;
  },

  // reinicia o jogo do zero (pra testar)
  resetGame() {
    if (confirm("Restart the game? All progress will be lost.")) {
      G.state.reset();
      location.reload();
    }
  },

  // pausa/retoma o jogo
  togglePause(btn) {
    G.combat.paused = !G.combat.paused;
    if (btn) {
      btn.classList.toggle("icon-btn--active", G.combat.paused);
      btn.textContent = G.combat.paused ? "▶" : "⏸";
    }
  },

  upgradeCost() {
    // mesma curva da vida do mob (1.064) => renda e custo andam juntos pra sempre
    return Math.ceil(20 * Math.pow(1.064, G.state.data.weaponUpgrades));
  },

  doUpgrade() {
    const cost = this.upgradeCost();
    if (G.state.data.lumens < cost) {
      this.log("Not enough Lumens to reforge.", "bad");
      return;
    }
    G.state.data.lumens -= cost;
    G.state.data.weaponUpgrades += 1;
    this.log(`Forge: weapon reforged (+4% ATK).`, "good");
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
  },

  renderResources() {
    this.el["res-lumens"].textContent = G.util.fmt(G.state.data.lumens);
    this.el["res-area"].textContent = `Area ${G.data.area.id} · ${G.data.area.name}`;
  },

  currentTier() {
    const lvl = G.state.data.level;
    let t = G.data.tiers[0];
    for (const tier of G.data.tiers) if (lvl >= tier.level) t = tier;
    return t;
  },

  renderHero() {
    const t = this.currentTier();
    this.el["hero-tier"].textContent = `${t.code} · ${t.name}`;
    this.el["hero-level"].textContent = G.state.data.level;
    this.el["hero-card-level"].textContent = G.state.data.level;
    const need = G.state.xpToNext();
    const pct = G.util.clamp((G.state.data.xp / need) * 100, 0, 100);
    this.el["xp-fill"].style.width = pct + "%";
    this.el["xp-label"].textContent = `${G.util.fmt(G.state.data.xp)} / ${G.util.fmt(need)} XP`;
  },

  // formata um valor de stat:
  //  - inteiro -> fmt (1.2K, etc.)
  //  - fracionário pequeno -> até 3 casas, sem zeros à toa (0.05, 0.025, 0.5)
  //  - número grande -> fmt
  fmtStat(v) {
    const r = Math.round(v * 1000) / 1000;
    if (Number.isInteger(r)) return G.util.fmt(r);
    if (Math.abs(r) < 1000) return String(parseFloat(r.toFixed(3)));
    return G.util.fmt(v);
  },

  renderStats() {
    const s = G.state.stats();
    const rows = [
      ["ATK", G.util.fmt(s.atk)],
      ["Max HP", G.util.fmt(s.hp)],
      ["Crit", s.crit.toFixed(0) + "%"],
      ["Crit Dmg", "+" + this.fmtStat(s.critDmg, true) + "%"],
      ["Atk Speed", s.atkSpeed.toFixed(2) + " /s"],
      ["XP Bonus", "+" + this.fmtStat(s.xpBonus, true) + "%"],
      ["Lumens Bonus", "+" + s.lumensBonus.toFixed(0) + "%"],
    ];
    const html = rows
      .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`)
      .join("");
    // a lista de stats aparece no modal do Seeker E no modal de Equipment
    if (this.el["stats-list"]) this.el["stats-list"].innerHTML = html;
    if (this.el["gear-stats"]) this.el["gear-stats"].innerHTML = html;
  },

  // ---- tela de Equipment: 6 peças fixas em torno do NPC ----
  renderGear() {
    if (!this.el["gear-left"] || !this.el["gear-right"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl = item.level || 1;
      const cap = G.gear.cap(item);
      const maxed = G.gear.isMaxed(item);
      // cada afixo: valor atual em destaque + "+X per level" apagado (estilo referência)
      const affixes = item.affixes
        .map((a) => {
          const v = G.gear.affixValue(item, a);
          const pctSign = a.pct ? "%" : "";
          const kind = a.layer === "pct" ? "Bonus" : "Primary";
          const perLv = a.perLevel
            ? `<span class="gear-affix__perlv">+${this.fmtStat(a.perLevel, a.pct)}${pctSign} per level</span>`
            : "";
          return `<div class="gear-affix">
            <span class="gear-affix__main">+${this.fmtStat(v, a.pct)}${pctSign} ${a.label} ${kind}</span>
            ${perLv}
          </div>`;
        })
        .join("");
      const icon = slot.icon || "❔";
      const btn = maxed
        ? `<button class="gear-levelup is-max" disabled>MAX</button>`
        : `<button class="gear-levelup" data-levelup="${slot.id}">Level up<br><small>✦ ${G.util.fmt(G.gear.cost(item))}</small></button>`;
      return `<div class="gear-slot" style="--rar:${item.color}">
        <div class="gear-slot__icon"><span class="ico-ph">${icon}</span></div>
        <div class="gear-slot__info">
          <div class="gear-slot__top">
            <span class="gear-slot__name" style="color:${item.color}">${item.name}</span>
            <span class="gear-slot__lvl">Lv. ${lvl}/${cap}</span>
          </div>
          <div class="gear-slot__affixes">${affixes}</div>
        </div>
        ${btn}
      </div>`;
    };
    const slots = G.data.slots;
    this.el["gear-left"].innerHTML = slots.slice(0, 3).map(slotCard).join("");
    this.el["gear-right"].innerHTML = slots.slice(3, 6).map(slotCard).join("");
    const wire = (node) =>
      node.querySelectorAll("[data-levelup]").forEach((b) => {
        b.addEventListener("click", () => this.doGearLevelUp(b.dataset.levelup));
      });
    wire(this.el["gear-left"]);
    wire(this.el["gear-right"]);
  },

  doGearLevelUp(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    const done = G.gear.levelUpTimes(item, this.gearMult);
    if (done > 0) this.log(`${item.name} → Lv. ${item.level}`, "good");
    else this.log("Not enough Lumens.", "bad");
    this.renderAll();
  },

  renderUpgrade() {
    this.el["upgrade-cost"].textContent = `Cost: ${G.util.fmt(this.upgradeCost())} ✦`;
  },

  _lastArt: null,

  renderEnemy() {
    const e = G.combat.enemy;
    if (!e) {
      // mob morto/ausente: esconde a info e limpa a arte (some até o próximo)
      if (this._lastArt !== null) {
        this._lastArt = null;
        this.el["enemy-art"].innerHTML = "";
        const be = document.querySelector(".battle-enemy");
        if (be) be.classList.add("enemy-hidden");
      }
      return;
    }
    // só reconstrói a arte quando o mob muda (evita piscar a 10fps)
    if (this._lastArt !== e.name) {
      const be = document.querySelector(".battle-enemy");
      if (be) be.classList.remove("enemy-hidden");
      this._lastArt = e.name;
      this.el["enemy-art"].innerHTML =
        `<span class="art-ph">${e.sprite}</span>` +
        (e.img ? `<img class="art-img" src="${e.img}" alt="" onerror="this.remove()" />` : "");
      this.el["enemy-art"].classList.toggle("boss", e.isBoss);
      this.el["enemy-name"].textContent = e.name + (e.isBoss ? " 👑" : "");
      this.el["enemy-level"].textContent = e.level;
      this.el["enemy-atk"].textContent = G.util.fmt(e.dmg);
    }
    const pct = G.util.clamp((e.hp / e.maxHp) * 100, 0, 100);
    this.el["enemy-hp-fill"].style.width = pct + "%";
    this.el["enemy-hp-label"].textContent = `${G.util.fmt(Math.max(0, e.hp))} / ${G.util.fmt(e.maxHp)}`;
  },

  renderHeroHp() {
    const max = G.state.maxHp();
    const pct = G.util.clamp((G.state.data.hp / max) * 100, 0, 100);
    this.el["hero-hp-fill"].style.width = pct + "%";
    this.el["hero-hp-label"].textContent = `${G.util.fmt(Math.max(0, G.state.data.hp))} / ${G.util.fmt(max)}`;
  },

  // texto de dano flutuante (dano no mob = card do mob; dano no herói = no herói)
  floater(amount, type) {
    const target = type === "enemy"
      ? document.getElementById("floaters-hero")
      : this.el["floaters"];
    if (!target) return;
    const f = document.createElement("span");
    f.className = "floater " + type;
    f.textContent = (type === "enemy" ? "-" : "") + G.util.fmt(amount) + (type === "crit" ? "!" : "");
    f.style.left = G.util.randInt(20, 80) + "%";
    target.appendChild(f);
    setTimeout(() => f.remove(), 800);
  },

  // projétil voando do atacante ao alvo (screen blend = preto some)
  // type 'seeker' = Seeker→mob (branco-azul) · 'mob' = mob→Seeker (dourado)
  projectile(type) {
    const fromEl = document.getElementById(type === "mob" ? "enemy-art" : "hero-art");
    const toEl = document.getElementById(type === "mob" ? "hero-art" : "enemy-art");
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2, y1 = a.top + a.height * 0.42;
    const x2 = b.left + b.width / 2, y2 = b.top + b.height * 0.42;
    // 32 = orientação base do bolt (a ponta aponta pra baixo-direita na arte)
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 32;

    const img = document.createElement("img");
    img.className = "projectile" + (type === "mob" ? " projectile--mob" : "");
    img.src = type === "mob" ? "assets/fx/bolt_mob.png" : "assets/fx/bolt_seeker.png";
    img.style.left = x1 + "px";
    img.style.top = y1 + "px";
    img.style.transform = `translate(-50%,-50%) rotate(${ang}deg)`;
    document.body.appendChild(img);
    void img.offsetWidth; // força reflow: commita a posição inicial antes de animar
    img.style.left = x2 + "px";
    img.style.top = y2 + "px";
    img.style.opacity = "0.7";
    setTimeout(() => img.remove(), 540);
  },

  // readout de stats do HUD (baixo centro)
  renderHud() {
    const s = G.state.stats();
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("hud-atk", G.util.fmt(s.atk));
    set("hud-dps", G.util.fmt(Math.round(s.atk / G.state.attackInterval())));
    set("hud-crit", s.crit.toFixed(0) + "%");
  },

  // linha no log de combate
  log(msg, cls, color) {
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    if (color) line.style.color = color;
    line.textContent = msg;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
  },
};
