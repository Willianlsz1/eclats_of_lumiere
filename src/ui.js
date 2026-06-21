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
      "gear-stats", "gear-slots", "gear-mult", "gear-tooltip", "wmap-nodes", "wmap-trail", "wmap-area-name",
      "wmap-area-range", "wmap-info", "wmap-info-name", "wmap-info-range", "wmap-info-lore",
      "wmap-info-mobs", "wmap-info-boss", "wmap-info-boss-wrap", "wmap-info-travel", "wmap-info-close",
      "conv-points", "conv-count", "conv-highest", "conv-pending", "btn-converge",
      "awaken-essence", "awaken-list",
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
      this.el["wmap-info-close"].addEventListener("click", () => { this.el["wmap-info"].hidden = true; });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => {
        if (this._infoArea != null) this.travelTo(this._infoArea);
      });
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
    // Awaken: desbloquear (clique delegado nos botões da lista)
    if (this.el["awaken-list"])
      this.el["awaken-list"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-awaken]");
        if (!btn) return;
        if (G.awaken.unlock(+btn.dataset.awaken)) this.renderAwaken();
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
    // o World Map só renderiza ao abrir (não a cada tick), e começa sem painel
    if (id === "modal-worldmap") {
      this.renderWorldMap();
      if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
    }
    if (id === "modal-convergence") this.renderConvergence();
    if (id === "modal-awaken") this.renderAwaken();
    if (id === "modal-passives") this.renderPassives();
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
    const locked = !P.groupUnlocked(tree, P.groupOf(i)) && level === 0;
    const role = P.isEngine(tree, key) ? "role-engine" : (P.leverOf(key) ? "role-lever" : "");
    const cls = ["pv-node", role, i >= 10 ? "tip-below" : "", maxed ? "maxed" : "",
      P.canBuy(tree, i) ? "buyable" : "", level > 0 && !maxed ? "owned" : "", locked ? "locked" : ""]
      .filter(Boolean).join(" ");
    const m = `assets/passives/${tree}/${key}.webp`;
    const mc = `-webkit-mask-image:url('${m}');mask-image:url('${m}')`;
    const lvlText = maxed ? "✦" : (level > 0 ? `${level}/${P.maxLevel}` : "");
    const foot = maxed ? `<div class="pv-tip-foot max">Max Level</div>`
      : locked ? `<div class="pv-tip-foot locked">Locked — max the tier below</div>`
      : `<div class="pv-tip-foot cost">${level === 0 ? "Unlock" : "Upgrade"} · ${G.util.fmt(P.nextCost(tree, i))} pts</div>`;
    return `<button class="${cls}" data-i="${i}" style="left:${pos.x}%;top:${pos.y}%;--p:${(level / P.maxLevel).toFixed(3)}">
      <span class="pv-disc"><span class="pv-icon" style="${mc}"></span><i class="pv-ring"></i></span>
      <span class="pv-node-name">${name}</span>
      <span class="pv-node-lvl">${lvlText}</span>
      <div class="pv-tip">
        <div class="pv-tip-head"><span class="pv-tip-icon"><span class="pv-icon" style="${mc}"></span></span>
          <div class="pv-tip-htext"><div class="pv-tip-name">${name} <span class="pv-tip-tag">Passive</span></div>
            <div class="pv-tip-lvl">Level ${level}/${P.maxLevel}</div></div></div>
        <p class="pv-tip-eff">${this._pvEffect(tree, i, level)}</p>${foot}
      </div>
    </button>`;
  },
  _pvEffect(tree, i, level) {
    const P = G.passives, stat = P.trees[tree].stat, key = P.trees[tree].list[i][1];
    const lev = P.leverOf(key);
    const T = { crit: "Increases your critical chance.", aps: "Increases your attack speed.",
      mobCap: "More enemies appear at once.", material: "Increases the materials you find.",
      enemyPen: "Your hits ignore part of enemy defense.", enemyReduce: "Weakens enemy defense." };
    if (lev) return T[lev] || "A special effect.";
    if (P.isEngine(tree, key)) return `Multiplies your ${stat}, compounding every level — the strongest growth in the tree.`;
    const pct = P.groupAddPct[P.groupOf(i)] * 100;
    return level > 0 ? `Increases your ${stat} by ${G.util.fmt(level * pct)}%.` : `Increases your ${stat} by ${pct}% per level.`;
  },

  // painel do Awaken — lista os pacotes, status e botão de desbloquear
  renderAwaken() {
    const d = G.state.data;
    if (this.el["awaken-essence"]) this.el["awaken-essence"].textContent = G.util.fmt(d.awakenEssence || 0);
    const wrap = this.el["awaken-list"];
    if (!wrap) return;
    wrap.innerHTML = G.data.awakens
      .map((a) => {
        const unlocked = G.awaken.isUnlocked(a.id);
        const can = G.awaken.canUnlock(a.id);
        const b = a.bonus;
        const fx = [
          b.atkMult ? `ATK ×${b.atkMult}` : null,
          b.hpMult ? `HP ×${b.hpMult}` : null,
          b.crit ? `Crit +${b.crit}%` : null,
          b.critDmg ? `Crit Dmg +${b.critDmg}%` : null,
          b.lumensBonus ? `Gold +${b.lumensBonus}%` : null,
          b.xpBonus ? `XP +${b.xpBonus}%` : null,
        ].filter(Boolean).join(" · ");
        const reqs = `Area ${a.areaIndex + 1} · Lv ${a.level} · ${a.essence} Essence · ${G.util.fmt(a.lumens)} ✦`;
        const action = unlocked
          ? `<span class="awaken-done">Awakened ✓</span>`
          : `<button class="btn attack-btn awaken-btn" data-awaken="${a.id}"${can ? "" : " disabled"}>Awaken</button>`;
        return `<li class="awaken-node${unlocked ? " is-done" : ""}">
          <div class="awaken-node__head"><b>${a.name}</b>${action}</div>
          <div class="awaken-node__fx">${fx}</div>
          <div class="awaken-node__req">${reqs}</div>
        </li>`;
      })
      .join("");
  },

  // painel da Convergence (prestige) — renderiza ao abrir o modal
  renderConvergence() {
    const d = G.state.data;
    if (this.el["conv-points"]) this.el["conv-points"].textContent = G.util.fmt(d.convergencePoints || 0);
    if (this.el["conv-count"]) this.el["conv-count"].textContent = d.convergences || 0;
    if (this.el["conv-highest"]) this.el["conv-highest"].textContent = G.util.fmt(d.highestLevel || d.level);
    if (this.el["conv-pending"]) this.el["conv-pending"].textContent = G.util.fmt(G.convergence.pending());
    const btn = this.el["btn-converge"];
    if (btn) {
      const ok = G.convergence.canConverge();
      btn.disabled = !ok;
      btn.textContent = ok ? "Converge" : `Converge (reach Lv ${G.convergence.gateLevel})`;
    }
  },

  // posições dos 9 nós no mapa (% x,y) — fonte única p/ nós E trilha
  mapNodePos: [
    [34, 8], [66, 12], [67, 28], [39, 27], [31, 54],
    [66, 53], [34, 74], [68, 76], [47, 88],
  ],

  // ---- World Map: nós das áreas + trilha sobre a ilustração do mapa ----
  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d = G.state.data;
    const pos = this.mapNodePos;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);

    const curArea = G.data.currentArea();
    if (this.el["wmap-area-name"]) this.el["wmap-area-name"].textContent = curArea.name;
    if (this.el["wmap-area-range"])
      this.el["wmap-area-range"].textContent = `Lv ${curArea.levelRange[0]}–${curArea.levelRange[1]}`;

    // trilha: linha ligando os nós na ordem (parte percorrida x bloqueada)
    const trail = this.el["wmap-trail"];
    if (trail) {
      const pts = pos.map((p) => p.join(",")).join(" ");
      const donePts = pos.slice(0, maxU + 1).map((p) => p.join(",")).join(" ");
      trail.innerHTML =
        `<polyline points="${pts}" fill="none" stroke="rgba(120,140,180,0.45)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-dasharray="5 6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<polyline points="${donePts}" fill="none" stroke="rgba(232,181,74,0.9)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-dasharray="5 6" stroke-linecap="round" stroke-linejoin="round"/>`;
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

  // abre o painel de info de uma área (lore + range + criaturas + boss)
  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const locked = i > maxU;

    this.el["wmap-info-name"].textContent = a.name;
    this.el["wmap-info-range"].textContent = `Levels ${a.levelRange[0]}–${a.levelRange[1]}`;
    this.el["wmap-info-lore"].textContent = a.blurb || "";

    // criaturas: nomes únicos definidos na área (boss listado à parte)
    const seen = {};
    const mobs = (a.enemies || []).filter((e) => !seen[e.name] && (seen[e.name] = 1));
    this.el["wmap-info-mobs"].innerHTML = mobs
      .map((e) => `<li>${e.name}</li>`)
      .join("");

    // boss (algumas áreas não têm)
    if (a.boss) {
      this.el["wmap-info-boss-wrap"].hidden = false;
      this.el["wmap-info-boss"].textContent = a.boss.name;
    } else {
      this.el["wmap-info-boss-wrap"].hidden = true;
    }

    // botão Travel: desabilitado se travada ou se já é a área atual
    const tbtn = this.el["wmap-info-travel"];
    if (i === d.areaIndex) { tbtn.disabled = true; tbtn.textContent = "You are here"; }
    else if (locked) { tbtn.disabled = true; tbtn.textContent = "Locked"; }
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
    const d = G.state.data;
    const area = G.data.currentArea();
    this.el["res-area"].textContent = `Area ${area.id} · ${area.name}`;
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
  // o card foca no ÍCONE (grande); os stats vão pro tooltip no hover.
  renderGear() {
    if (!this.el["gear-slots"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl = item.level || 1;
      const maxed = G.gear.isMaxed(item);
      const icon = slot.icon || "❔";
      const action = maxed
        ? `<span class="gear-max">MAX</span>`
        : `<span class="gear-slot__cost">✦ ${G.util.fmt(G.gear.cost(item))}</span>
           <button class="gear-levelup" data-levelup="${slot.id}">Level up</button>`;
      return `<div class="gear-slot pos-${slot.id}" data-tip="${slot.id}" style="--rar:${item.color}">
        <span class="gear-slot__lvl">LVL ${lvl}</span>
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
