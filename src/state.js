// state.js — estado do jogo, stats derivados, save/load

G.state = {
  data: null,
  _cache: null,

  SAVE_KEY: "eclats_v3",

  fresh() {
    return {
      level:           1,
      xp:              0,
      lumens:          0,
      weaponUpgrades:  0,
      hp:              0,
      areaIndex:       0,
      maxAreaUnlocked: 0,
      mapOneCleared:   false,
      highestLevel:    1,
      totalKills:      0,
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
    const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));

    // base + nível
    layer("atk").flat     += 1000 + (d.level - 1) * 2;
    layer("hp").flat      += 1000 + (d.level - 1) * 2;
    layer("atk").pct      += d.weaponUpgrades * 4;   // forge: +4% ATK cada
    layer("crit").flat    += 5;
    layer("critDmg").flat += 50;
    layer("atkSpeed").flat+= G.data.balance.atkSpeedBase;
    layer("lumensBonus").flat += 10 + d.level * 0.05;
    layer("xpBonus").flat += 0;

    // gear
    for (const slot of G.data.slots) {
      const item = d.equipped[slot.id];
      if (!item) continue;
      for (const af of item.affixes)
        layer(af.stat)[af.layer || "flat"] += G.gear.affixValue(item, af);
    }

    const fin = (k) => { const x = layer(k); return x.flat * (1 + x.pct / 100) * x.mult; };

    this._cache = {
      atk:         Math.round(fin("atk")),
      hp:          Math.round(fin("hp")),
      crit:        G.util.clamp(fin("crit"), 0, 100),
      critDmg:     fin("critDmg"),
      critMult:    1 + fin("critDmg") / 100,
      atkSpeed:    G.util.clamp(fin("atkSpeed"), 0, G.data.balance.atkSpeedCap),
      xpBonus:     fin("xpBonus"),
      lumensBonus: fin("lumensBonus"),
    };
    return this._cache;
  },

  maxHp()         { return this.stats().hp; },
  attackInterval(){ return G.util.clamp(1 / this.stats().atkSpeed, 1 / G.data.balance.atkSpeedCap, 5); },
  xpToNext()      { return Math.ceil(14 * this.data.level); },

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
