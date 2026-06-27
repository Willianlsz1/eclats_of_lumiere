// state.js — estado do jogo, stats derivados, save/load

G.state = {
  data: null,
  _cache: null,

  SAVE_KEY: "eclats_v4",

  fresh() {
    return {
      level:           1,
      xp:              0,
      lumens:          0,
      hp:              0,
      areaIndex:       0,
      maxAreaUnlocked: 0,
      mapOneCleared:   false,
      highestLevel:    1,
      totalKills:      0,
      // ---- Convergence (prestige) ----
      convergencePoints: 0,
      convergences:      0,
      // contadores da RUN (resetam na Convergence) — fórmula de Pontos
      runKills:          0,
      runBosses:         0,
      runMaxAreaIndex:   0,
      // ---- Awaken ----
      awakens:           [],
      awakensUnlocked:   [],
      awakenTier:        0,
      // ---- Passivas (3 árvores) ----
      passives:          { eclat: Array(15).fill(0), vestige: Array(15).fill(0), fracture: Array(15).fill(0) },
      // ---- Materiais (fundação econômica) ----
      gearMaterials:     { common: 0, uncommon: 0 },
      awakenMaterials:   { firstLight: 0 },
      equipped:        G.gear.freshSet(),
      lastSeen:        Date.now(),
    };
  },

  invalidateStats() { this._cache = null; },

  // flat × (1 + pct/100) × mult
  stats() {
    if (this._cache) return this._cache;
    const d = this.data;
    const L = {};
    const BD = {};   // breakdown: BD[stat] = [{ source, type, amount }]
    const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));
    const add = (stat, type, amount, source) => {
      const lay = layer(stat);
      if (type === "mult") { if (amount === 1) return; lay.mult *= amount; }
      else { if (!amount) return; lay[type] += amount; }
      (BD[stat] || (BD[stat] = [])).push({ source, type, amount });
    };

    // base + nível (separados p/ o breakdown: Base Game vs Character Level)
    add("atk", "flat", 1000, "Base");
    add("atk", "flat", (d.level - 1) * 5, "Character Level");
    add("hp",  "flat", 1000, "Base");
    add("hp",  "flat", (d.level - 1) * 2, "Character Level");
    add("crit", "flat", 5, "Base");
    add("critDmg", "flat", 50, "Base");
    add("atkSpeed", "flat", G.data.balance.atkSpeedBase, "Base");
    add("lumensBonus", "flat", 10, "Base");
    add("lumensBonus", "flat", d.level * 0.15, "Character Level");

    // equipment
    for (const slot of G.data.slots) {
      const item = d.equipped[slot.id];
      if (!item) continue;
      for (const af of item.affixes)
        add(af.stat, af.layer || "flat", G.gear.affixValue(item, af), "Equipment");
    }

    // Awaken (inerte na slice; sem breakdown por enquanto)
    if (G.awaken) G.awaken.applyTo(layer);

    // Passivas — efeitos LIVE somam nas camadas; demais expostos via effect()
    let passEff = null;
    if (G.passives) {
      passEff = G.passives.effects();
      add("atk", "flat", passEff.atkFlat  || 0, "Passives");
      add("atk", "pct",  passEff.atkPct   || 0, "Passives");
      add("hp",  "pct",  passEff.hpPct    || 0, "Passives");
      add("crit", "flat", passEff.critRate || 0, "Passives");
      add("critDmg", "flat", passEff.critDmg || 0, "Passives");
      add("lumensBonus", "flat", passEff.lumensPct || 0, "Passives");
      add("xpBonus", "flat", passEff.xpPct || 0, "Passives");
      add("atk", "mult", 1 + (passEff.capstoneEclat || 0) / 100, "Passives");
      add("hp",  "mult", 1 + (passEff.capstoneEclat || 0) / 100, "Passives");
      add("lumensBonus", "mult", 1 + (passEff.capstoneVestige || 0) / 100, "Passives");
      add("xpBonus", "mult", 1 + (passEff.capstoneVestige || 0) / 100, "Passives");
    }

    const fin = (k) => { const x = layer(k); return x.flat * (1 + x.pct / 100) * x.mult; };

    // HP → Dano (Éclat): injeta uma fração do HP final no ATK antes de finalizar
    if (passEff && passEff.hpToDamage)
      add("atk", "flat", fin("hp") * (passEff.hpToDamage / 100), "Passives");

    this._cache = {
      atk:              Math.round(fin("atk")),
      hp:               Math.round(fin("hp")),
      crit:             G.util.clamp(fin("crit"), 0, 100),
      critDmg:          fin("critDmg"),
      critMult:         1 + fin("critDmg") / 100,
      atkSpeed:         G.util.clamp(fin("atkSpeed"), 0, this.currentAtkSpeedCap()),
      xpBonus:          fin("xpBonus"),
      lumensBonus:      fin("lumensBonus"),
      damageReduction:  G.util.clamp(fin("damageReduction"), 0, 75),
      eliteDmg:         fin("eliteDmg"),
      healOnKill:       fin("healOnKill"),
      _layers:          L,
      _breakdown:       BD,
    };
    return this._cache;
  },

  maxHp()              { return this.stats().hp; },
  currentAtkSpeedCap() { return this.data.mapOneCleared ? G.data.balance.atkSpeedCap : G.data.balance.map1AtkSpeedCap; },
  attackInterval()     { return G.util.clamp(1 / this.stats().atkSpeed, 1 / this.currentAtkSpeedCap(), 5); },
  xpToNext()           { return Math.ceil(14 * Math.pow(this.data.level, 1.5)); },

  // save/load — fallback em memória quando localStorage está bloqueado (file://)
  _mem: {},
  _hasLS: null,

  storageOk() {
    if (this._hasLS !== null) return this._hasLS;
    try { localStorage.setItem("__t__", "1"); localStorage.removeItem("__t__"); this._hasLS = true; }
    catch (e) { this._hasLS = false; }
    return this._hasLS;
  },

  save() {
    this.data.lastSeen = Date.now();
    const json = JSON.stringify(this.data);
    if (this.storageOk()) try { localStorage.setItem(this.SAVE_KEY, json); } catch (e) {}
    else this._mem[this.SAVE_KEY] = json;
  },

  load() {
    let loaded = null;
    try {
      const raw = this.storageOk()
        ? localStorage.getItem(this.SAVE_KEY)
        : this._mem[this.SAVE_KEY];
      if (raw) loaded = JSON.parse(raw);
    } catch (e) { loaded = null; }

    this.data = Object.assign(this.fresh(), loaded || {});
    this.data.equipped = G.gear.reconcile(this.data.equipped);
    if (G.economy) G.economy.reconcile(this.data);

    // Awaken: garante a lista canônica e o tier em saves antigos
    if (!Array.isArray(this.data.awakens)) this.data.awakens = [];
    this.data.awakensUnlocked = this.data.awakens;
    if (typeof this.data.awakenTier !== "number" || this.data.awakenTier < this.data.awakens.length)
      this.data.awakenTier = this.data.awakens.length;

    // Passivas: preserva níveis salvos por índice, clampando ao teto atual do nó
    if (G.passives) {
      const fresh = G.passives.freshSet();
      const saved = this.data.passives;
      if (saved && typeof saved === "object") {
        for (const tree of Object.keys(fresh))
          if (Array.isArray(saved[tree]))
            fresh[tree] = fresh[tree].map((_, i) => Math.min(saved[tree][i] || 0, G.passives.nodeMax(tree, i)));
      }
      this.data.passives = fresh;
    }

    this.invalidateStats();
    if (this.data.hp <= 0) this.data.hp = this.maxHp();
    return !!loaded;
  },

  reset() {
    if (this.storageOk()) try { localStorage.removeItem(this.SAVE_KEY); } catch (e) {}
    delete this._mem[this.SAVE_KEY];
    this.data = this.fresh();
    this.data.hp = this.maxHp();
  },
};
