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
      "res-lumens", "res-eclats", "res-area",
      "hero-tier", "hero-level", "xp-fill", "xp-label",
      "stats-list", "btn-upgrade", "upgrade-cost",
      "enemy-art", "enemy-name", "enemy-level", "enemy-atk",
      "enemy-hp-fill", "enemy-hp-label", "floaters",
      "hero-card-level", "hero-hp-fill", "hero-hp-label", "log",
      "gear-stats", "gear-slots", "gear-mult", "gear-tooltip", "wmap-nodes", "wmap-trail",
      "wmap-info", "wmap-info-art", "wmap-info-name", "wmap-info-lore", "wmap-info-level",
      "wmap-info-enemies", "wmap-info-status", "wmap-info-res", "wmap-info-travel", "wmap-info-close",
      "conv-points", "conv-count", "conv-highest", "conv-pending", "conv-current", "conv-return", "btn-converge",
      "awaken-essence", "awaken-list", "awaken-preview", "memoires-list",
      "pv-points", "pv-tabs", "pv-body", "pv-lock",
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
    // painel de info da área no World Map
    if (this.el["wmap-info-close"])
      this.el["wmap-info-close"].addEventListener("click", () => {
        this.el["wmap-info"].hidden = true;
      });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => {
        if (this._infoArea != null) this.travelTo(this._infoArea);
      });
    // World Map: "◀ World" sai do mapa
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
    // Awaken: selecionar entry (sidebar esquerda)
    if (this.el["awaken-list"])
      this.el["awaken-list"].addEventListener("click", (e) => {
        const entry = e.target.closest("[data-id]");
        if (!entry) return;
        this._selectedAwaken = entry.dataset.id;
        this.el["awaken-list"].querySelectorAll(".awk-entry").forEach(el =>
          el.classList.toggle("is-active", el.dataset.id === this._selectedAwaken)
        );
        this.renderAwakenPreview(this._selectedAwaken);
      });
    // Awaken: desbloquear (botão no painel de preview direito)
    if (this.el["awaken-preview"])
      this.el["awaken-preview"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-awaken]");
        if (!btn) return;
        if (G.awaken.unlock(btn.dataset.awaken)) this.renderAwaken();
      });
    // Passivas (Árvore-Mundo): trocar de aba / comprar nó (clique delegado na tela)
    const pscreen = document.getElementById("modal-passives");
    if (pscreen)
      pscreen.addEventListener("click", (e) => {
        const tab = e.target.closest(".pv-tab");
        if (tab) { this.passivesTab = tab.dataset.tree; this.renderPassives(); return; }
        const node = e.target.closest(".pv-node");
        if (node) {
          if (G.passives.buy(this.passivesTab || "eclat", +node.dataset.i)) this.renderPassives();
        }
      });
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
    // o World Map só renderiza ao abrir (não a cada tick); painel começa fechado
    if (id === "modal-worldmap") {
      this.renderWorldMap();
      if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
    }
    if (id === "modal-convergence") this.renderConvergence();
    if (id === "modal-awaken") this.renderAwaken();
    if (id === "modal-passives") this.renderPassives();
    if (id === "modal-codex") this.renderMemoires();
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
    const b = G.data.balance;
    return Math.ceil(b.forgeCostBase * Math.pow(b.forgeCostGrowth, G.state.data.weaponUpgrades));
  },

  doUpgrade() {
    const cost = this.upgradeCost();
    if (G.state.data.lumens < cost) {
      this.log("Not enough Lumens to reforge.", "bad");
      return;
    }
    G.state.data.lumens -= cost;
    G.state.data.weaponUpgrades += 1;
    G.state.invalidateStats();
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

  // Árvore-Mundo de passivas — 3 árvores, nós posicionados sobre a arte
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
    const deferred = P.isDeferred(tree, i); // nó adiado ao Mapa 2 (indisponível)
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
        <p class="pv-tip-eff">${this._pvEffect(tree, i, level)}</p>${foot}
      </div>
    </button>`;
  },
  _pvEffect(tree, i) {
    const P = G.passives, key = P.trees[tree].list[i][1];
    return (P.EFFECT_DESC && P.EFFECT_DESC[key]) || "Effect pending balancing.";
  },

  // Codex — Mémoires (CP-2B descoberta + CP-2C restauração). Mínimo: ??? →
  // Encontrada → Restaurada (Lv 1) + botão Restore quando há Éclats.
  renderMemoires() {
    const wrap = this.el["memoires-list"];
    if (!wrap || !G.memoires) return;
    const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
    const memoireLi = (id) => {
      const m = G.memoires.get(id);
      if (m.state === "notFound")
        return `<li class="codex-memoire is-notFound" style="opacity:.45">???</li>`;
      const restored = m.state === "restored";
      const maxed = restored && m.level >= G.memoires.maxLevel();
      const lvl = restored ? ` <span class="codex-lvl">Lv ${m.level}${maxed ? " (max)" : ""}</span>` : "";
      const stLabel = restored ? "Restaurada" : "Encontrada";
      let btn = "";
      if (G.memoires.canRestore(id))
        btn = ` <button class="gear-levelup" data-restore="${id}">Restore (${G.memoires.RESTORE_COST} Éclat)</button>`;
      else if (G.memoires.canLevel(id))
        btn = ` <button class="gear-levelup" data-upgrade="${id}">Upgrade (${G.memoires.upgradeCost(id)} Éclat)</button>`;
      return `<li class="codex-memoire is-${m.state}">
        <b>${m.name}</b>${lvl} · <span class="codex-state">${stLabel}</span>${btn}
      </li>`;
    };
    let html = "";
    for (const era of Object.keys(G.memoires.ERAS)) {
      const p = G.memoires.eraProgress(+era);
      const done = G.memoires.isEraRestored(+era);
      const hdr = done ? `Era ${ROMAN[era]} Restaurada` : `Era ${ROMAN[era]} — ${p.completed} / ${p.total}`;
      html += `<li class="codex-era${done ? " is-done" : ""}" style="margin-top:6px;opacity:.85"><b>${hdr}</b></li>`;
      for (const id of G.memoires.eraIds(+era)) html += memoireLi(id);
    }
    // Ascension I (CP-3E): status + botão quando todos os requisitos estão prontos
    if (G.ascension) {
      const done = G.ascension.count() >= 1;
      const reqs = G.ascension.requirements()
        .map((r) => `${r.met ? "✓" : "✗"} ${r.label}`).join(" · ");
      const btn = G.ascension.canAscend()
        ? ` <button class="gear-levelup" data-ascend="1">Ascend → Illuminate</button>` : "";
      html += `<li class="codex-ascension" style="margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px">
        <b>Ascension I — ${done ? "Illuminate ✓" : "Seeker"}</b><br><span style="opacity:.7;font-size:.9em">${reqs}</span>${btn}
      </li>`;
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-restore]").forEach((b) => {
      b.addEventListener("click", () => this.doMemoireRestore(b.dataset.restore));
    });
    wrap.querySelectorAll("[data-upgrade]").forEach((b) => {
      b.addEventListener("click", () => this.doMemoireUpgrade(b.dataset.upgrade));
    });
    wrap.querySelectorAll("[data-ascend]").forEach((b) => {
      b.addEventListener("click", () => this.doAscend());
    });
  },

  doAscend() {
    if (G.ascension && G.ascension.ascend()) {
      this.log(`✦ Ascension I complete — you are now ${G.ascension.rank()}.`, "boss");
    } else {
      this.log("Cannot ascend — requirements not met.", "bad");
    }
    this.renderMemoires();
  },

  doMemoireRestore(id) {
    if (G.memoires.restore(id)) {
      this.log(`Restored ${G.memoires.get(id).name}.`, "good");
      G.state.save();
    } else {
      this.log(`Cannot restore — need ${G.memoires.RESTORE_COST} Éclat.`, "bad");
    }
    this.renderMemoires();
  },

  doMemoireUpgrade(id) {
    if (G.memoires.upgrade(id)) {
      this.log(`${G.memoires.get(id).name} → Lv ${G.memoires.level(id)}.`, "good");
      G.state.save();
    } else {
      this.log("Cannot upgrade — not enough Éclats or max level.", "bad");
    }
    this.renderMemoires();
  },

  // sidebar esquerda: lista compacta de awakens
  renderAwaken() {
    const d = G.state.data;
    if (this.el["awaken-essence"])
      this.el["awaken-essence"].textContent = G.util.fmt((d.awakenMaterials && d.awakenMaterials.firstLight) || 0);
    const wrap = this.el["awaken-list"];
    if (!wrap) return;

    // auto-select: mantém seleção ou escolhe o primeiro pendente
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
        b.lumensBonus ? `Gold +${b.lumensBonus}%` : null,
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

  // painel direito: preview completo do awakening selecionado
  renderAwakenPreview(id) {
    const panel = this.el["awaken-preview"];
    if (!panel) return;
    const a = G.data.awakens.find((x) => x.id === id);
    if (!a) { panel.innerHTML = ""; return; }

    const unlocked = G.awaken.isUnlocked(a.id);
    const can = G.awaken.canUnlock(a.id);
    const d = G.state.data;
    const s = G.state.stats();
    const b = a.bonus;

    // linhas de preview de stat: before → after
    const statRows = [
      b.atkMult  ? { label: "ATK",       before: G.util.fmt(s.atk),                     after: G.util.fmt(Math.round(s.atk * b.atkMult)),  active: unlocked } : null,
      b.hpMult   ? { label: "HP",        before: G.util.fmt(s.hp),                      after: G.util.fmt(Math.round(s.hp  * b.hpMult)),   active: unlocked } : null,
      b.crit     ? { label: "Crit",      before: `${s.crit.toFixed(1)}%`,               after: `${Math.min(100, s.crit + b.crit).toFixed(1)}%`,  active: unlocked } : null,
      b.critDmg  ? { label: "Crit Dmg",  before: `${s.critDmg.toFixed(0)}%`,            after: `${(s.critDmg + b.critDmg).toFixed(0)}%`,   active: unlocked } : null,
      b.lumensBonus ? { label: "Gold Bonus", before: `${s.lumensBonus.toFixed(0)}%`,    after: `${(s.lumensBonus + b.lumensBonus).toFixed(0)}%`, active: unlocked } : null,
      b.xpBonus  ? { label: "XP Bonus",  before: `${s.xpBonus.toFixed(0)}%`,            after: `${(s.xpBonus + b.xpBonus).toFixed(0)}%`,   active: unlocked } : null,
    ].filter(Boolean);

    // checklist de requisitos (AWAKEN_V1 — configurável: area/level/kills/conv/materiais)
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
        <img class="awk-emblem" src="assets/ui/icon_awaken.svg" alt="">
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

  // painel da Convergence (prestige) — renderiza ao abrir o modal
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

  // posições dos 9 nós no mapa (% x,y) — fonte única p/ nós E trilha
  // posicionadas pelo usuário sobre a arte mapa1.png (atualizado conforme marcações)
  mapNodePos: [
    [10, 23], // 1 — The Dreaming Wood (extrema esquerda, árvore alta)
    [36, 18], // 2 — The Lantern Mire (centro-esquerda, alto)
    [66, 17], // 3 — The Whispering Hollows (centro-direita, cascata)
    [82, 27], // 4 — The Moonlit Canopy (extrema direita, alto)
    [61, 42], // 5 — The Sunken Grove (centro-direita, meio)
    [35, 51], // 6 — The Gilded Thicket (centro-esquerda, lotus pool)
    [10, 64], // 7 — The Hollow Cathedral (extrema esquerda, baixo)
    [28, 71], // 8 — The Weeping Roots (centro-esquerda, baixo)
    [71, 64], // 9 — The Hollow Sanctum (direita, cristais)
  ],

  // ---- World Map: nós das áreas + trilha sobre a ilustração do mapa ----
  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d = G.state.data;
    const pos = this.mapNodePos;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);

    // trilha: ribbon curvo Catmull-Rom (curva passa PELOS nós, não perto)
    const trail = this.el["wmap-trail"];
    if (trail) {
      // Catmull-Rom → cubic bezier. tension=0.5 = curvatura natural
      const crPath = (pts, tension = 0.5) => {
        if (pts.length < 2) return '';
        const p = [pts[0], ...pts, pts[pts.length - 1]]; // duplica extremos
        let d = `M${p[1][0]},${p[1][1]}`;
        for (let i = 1; i < p.length - 2; i++) {
          const c1x = +(p[i][0] + (p[i+1][0] - p[i-1][0]) * tension / 3).toFixed(2);
          const c1y = +(p[i][1] + (p[i+1][1] - p[i-1][1]) * tension / 3).toFixed(2);
          const c2x = +(p[i+1][0] - (p[i+2][0] - p[i][0]) * tension / 3).toFixed(2);
          const c2y = +(p[i+1][1] - (p[i+2][1] - p[i][1]) * tension / 3).toFixed(2);
          d += ` C${c1x},${c1y} ${c2x},${c2y} ${p[i+1][0]},${p[i+1][1]}`;
        }
        return d;
      };

      const allPath  = crPath(pos);
      const donePath = crPath(pos.slice(0, maxU + 1));
      const vne = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';

      trail.innerHTML =
        // Caminho futuro (bloqueado) — ribbon prata discreto
        `<path d="${allPath}" ${vne} stroke="rgba(30,40,100,0.30)" stroke-width="8"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(110,125,200,0.22)" stroke-width="4"/>` +
        `<path d="${allPath}" ${vne} stroke="rgba(180,190,240,0.18)" stroke-width="1.5"/>` +
        // Caminho desbloqueado — ribbon dourado luminoso (3 camadas limpas)
        `<path d="${donePath}" ${vne} stroke="rgba(0,0,0,0.55)" stroke-width="10"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(210,155,20,0.88)" stroke-width="5.5"/>` +
        `<path d="${donePath}" ${vne} stroke="rgba(255,242,170,0.65)" stroke-width="1.8"/>`;
    }

    wrap.innerHTML = G.data.areas
      .map((a, i) => {
        const locked = i > maxU;
        const cur = i === d.areaIndex;
        const [x, y] = pos[i] || [50, 50];
        const cls = `wmap-node${locked ? " is-locked" : ""}${cur ? " is-current" : ""}`;
        return `<button class="${cls}" style="left:${x}%;top:${y}%" data-area="${i}" title="${a.name}"${locked ? " disabled" : ""}>
          <img src="assets/ui/node_${i + 1}.png" alt="" onerror="this.remove()" />
          <span class="wmap-node__name">${a.name}</span>
        </button>`;
      })
      .join("");
    wrap.querySelectorAll("[data-area]").forEach((b) => {
      b.addEventListener("click", () => this.openAreaInfo(+b.dataset.area));
    });
  },

  // painel dockado de info da área (arte + name·N/9 + lore + stats + resources + CTA)
  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d = G.state.data;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const locked = i > maxU;
    const isCurrent = i === d.areaIndex;

    // arte da área como header + cor temática
    const art = this.el["wmap-info-art"];
    if (art)
      art.style.backgroundImage = a.img
        ? `linear-gradient(180deg, rgba(7,10,22,0.05), rgba(7,10,22,0.55)), url('${a.img}')`
        : "none";
    const tints = ["#5ee0d2", "#e8b54a", "#9d7bff", "#7fb0ff", "#5ee0d2", "#e8b54a", "#cdb06a", "#c46a8a", "#e8d24a"];
    this.el["wmap-info"].style.setProperty("--area-tint", tints[i % tints.length]);

    this.el["wmap-info-name"].textContent = `${a.name} · ${i + 1}/${total}`;
    this.el["wmap-info-lore"].textContent = a.blurb || "";

    // stats
    this.el["wmap-info-level"].textContent = `${a.levelRange[0]}–${a.levelRange[1]}`;
    const pack = i < 2 ? 1 : i < 5 ? 2 : 3; // packs: áreas 1-2=1 · 3-5=2 · 6-9=3
    this.el["wmap-info-enemies"].textContent = `${pack} per wave`;
    this.el["wmap-info-status"].textContent = locked ? "Locked" : isCurrent ? "Current" : "Unlocked";

    // resources: Lumens/kill (estimado pela vida do mob na entrada) + Essência (Área 7+) + XP
    const lumPerKill = Math.ceil(G.data.mobHpAt(a.levelRange[0], a) * G.data.balance.goldRatio);
    const res = [`<li><span>Lumens</span><b>+${G.util.fmt(lumPerKill)}</b></li>`];
    res.push(`<li><span>XP</span><b>+${G.util.fmt(Math.ceil(G.data.balance.baseXp * a.levelRange[0]))}</b></li>`);
    if (i >= 5) res.push(`<li><span>Awaken Material</span><b>Mini Boss / Boss</b></li>`);
    this.el["wmap-info-res"].innerHTML = res.join("");

    // CTA: você está aqui / travado (mostra o nível) / viajar
    const tbtn = this.el["wmap-info-travel"];
    if (isCurrent) { tbtn.disabled = true; tbtn.textContent = "You are here"; }
    else if (locked) { tbtn.disabled = true; tbtn.textContent = `🔒 Reach Lv ${a.levelRange[0]}`; }
    else { tbtn.disabled = false; tbtn.textContent = "Travel here"; }

    this.el["wmap-info"].hidden = false;
  },

  // viaja pra uma área específica (se desbloqueada) e fecha o mapa
  travelTo(i) {
    const d = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    if (i < 0 || i > maxU || i === d.areaIndex) {
      const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true;
      return;
    }
    d.areaIndex = i;
    G.combat.enemy = null;
    G.combat.pendingHits = []; // projéteis em voo não vazam pra nova área
    G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
    const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true;
  },

  // o jogador navega entre as sub-áreas DESBLOQUEADAS (setas do banner)
  goToArea(delta) {
    const d = G.state.data;
    const maxUnlocked = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const ni = G.util.clamp(d.areaIndex + delta, 0, maxUnlocked);
    if (ni === d.areaIndex) return;
    d.areaIndex = ni;
    G.combat.enemy = null; // o próximo mob já nasce na nova área
    G.combat.pendingHits = []; // projéteis em voo não vazam pra nova área
    G.combat.respawnTimer = G.data.balance.respawnDelay;
    this.onAreaChange();
  },

  // chamado quando muda de sub-área
  onAreaChange() {
    this._lastArt = null; // força recriar a arte do próximo mob
    this.renderResources();
  },

  renderResources() {
    this.el["res-lumens"].textContent = G.util.fmt(G.state.data.lumens);
    if (this.el["res-eclats"]) // Éclats: somente leitura (fundação CP-2A)
      this.el["res-eclats"].textContent = G.util.fmt(G.economy ? G.economy.getEclats() : 0);
    const d = G.state.data;
    const area = G.data.currentArea();
    this.el["res-area"].textContent = area.name;
    // mantém o fundo do mundo sincronizado com a área atual
    const wimg = document.querySelector(".world-img");
    if (wimg && area.img && wimg.getAttribute("src") !== area.img) wimg.src = area.img;
    // setas: ‹ se não é a primeira; › se a próxima já foi desbloqueada
    const maxUnlocked = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const prev = document.getElementById("area-prev");
    const next = document.getElementById("area-next");
    if (prev) prev.classList.toggle("is-disabled", d.areaIndex <= 0);
    if (next) next.classList.toggle("is-disabled", d.areaIndex >= maxUnlocked);
  },

  currentTier() {
    // rank por ASCENSION (CANON_V2 §4): Endormi (pré-Awaken) → Seeker → Illuminate …
    // A escada de nomes vive em G.ascension (data.tiers foi removido).
    return G.ascension ? G.ascension.rankInfo() : { code: "—", name: "Endormi" };
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
  fmtStat(v, _pct = false) {
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
  // o card foca no ÍCONE (grande); os stats vão pro tooltip no hover.
  renderGear() {
    if (!this.el["gear-slots"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl = item.level || 1;
      const cap = G.gear.cap(item);
      const maxed = G.gear.isMaxed(item);
      const icon = slot.icon || "❔";
      let action;
      if (maxed && G.gear.promotable(item)) {
        // no cap e há raridade acima: oferece PROMOÇÃO (custo em materiais)
        const cost = G.gear.promotionCost(item);
        const costStr = Object.keys(cost).map((k) => `${G.util.fmt(cost[k])} ${k}`).join(" · ");
        const can = G.gear.canPromote(item);
        action = `<span class="gear-slot__cost">⬆ ${costStr}</span>
           <button class="gear-levelup gear-promote" data-promote="${slot.id}"${can ? "" : " disabled"}>Promote</button>`;
      } else if (maxed) {
        action = `<span class="gear-max">MAX</span>`;
      } else {
        action = `<span class="gear-slot__cost">✦ ${G.util.fmt(G.gear.cost(item))}</span>
           <button class="gear-levelup" data-levelup="${slot.id}">Level up</button>`;
      }
      return `<div class="gear-slot pos-${slot.id}" data-tip="${slot.id}" style="--rar:${item.color}">
        <span class="gear-slot__rar" style="color:${item.color}">${item.rarityName}</span>
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
    node.querySelectorAll(".gear-slot[data-tip]").forEach((s) => {
      s.addEventListener("mouseenter", () => this.showGearTip(s));
      s.addEventListener("mousemove", () => this.showGearTip(s));
      s.addEventListener("mouseleave", () => this.hideGearTip());
    });
  },

  // ---- tooltip de item (stats detalhados) ----
  gearTipHtml(item) {
    const lvl = item.level || 1;
    const cap = G.gear.cap(item);
    const affixes = item.affixes
      .map((a) => {
        const v = G.gear.affixValue(item, a);
        const sign = a.pct ? "%" : "";
        const kind = a.layer === "pct" ? "Bonus" : "Primary";
        const perLv = a.perLevel
          ? `<span class="tip-perlv">+${this.fmtStat(a.perLevel)}${sign} per level</span>`
          : "";
        return `<div class="tip-affix"><span class="tip-affix__main">+${this.fmtStat(v)}${sign} ${a.label} ${kind}</span>${perLv}</div>`;
      })
      .join("");
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
    // tooltip aparece pro lado de DENTRO (em direção ao centro/NPC)
    let left = isLeft ? sr.right - mr.left + 12 : sr.left - mr.left - tr.width - 12;
    let top = sr.top - mr.top;
    left = G.util.clamp(left, 8, mr.width - tr.width - 8);
    top = G.util.clamp(top, 8, mr.height - tr.height - 8);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
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
    this.renderAll();
  },

  doGearPromote(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    if (G.gear.promote(item)) {
      const np = G.state.data.equipped[slotId];
      this.log(`${np.name} promoted to ${np.rarityName}! (cap ${G.util.fmt(G.gear.cap(np))})`, "good");
    } else {
      this.log("Cannot promote yet — reach the cap and gather materials.", "bad");
    }
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
      // nome + raridade (raro/raro+ ganham cor e tag; boss ganha coroa)
      this.el["enemy-name"].textContent = e.rarity ? `${e.name} · ${e.rarity.tag}` : (e.name + (e.isBoss ? " 👑" : ""));
      this.el["enemy-name"].style.color = e.rarity ? e.rarity.color : "";
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
