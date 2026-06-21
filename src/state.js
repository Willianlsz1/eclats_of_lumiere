// =============================================================
// state.js — ESTADO do jogo + atributos derivados + save/load + idle
// =============================================================
// Uma única "fonte da verdade" do que o jogador tem agora.
// Atributos finais = base + bônus do equipamento + forja.

G.state = {
  data: null, // o objeto salvo de fato (preenchido em init)

  SAVE_KEY: "eclats_save_v2",

  // estado inicial de um jogo novo
  fresh() {
    return {
      level: 1,              // nível de PERSONAGEM (o mob acompanha este nível)
      xp: 0,
      lumens: 0,
      weaponUpgrades: 0,     // quantas vezes reforçou a arma na forja
      hp: 0,                 // vida atual (0 = será preenchida com a máxima)
      inventory: [],         // (loot desligado por enquanto — mantido p/ futuro)
      equipped: G.gear.freshSet(), // 6 peças FIXAS (Nv.1, Comum) — ver gear.js
      lastSeen: Date.now(),  // p/ progresso offline
    };
  },

  // --- Atributos FINAIS, modelo Gaiadon em camadas ---
  // Cada stat acumula: flat (Primary), pct (Bonus%), mult (Multiplier).
  // Fórmula final = flat × (1 + pct/100) × mult.
  // Fontes hoje: base do jogo, nível, forja, equipamento.
  // (No futuro: Ascension/Divinity/etc. é só somar mais em cada camada.)
  stats() {
    const d = this.data;
    const L = {}; // L[stat] = { flat, pct, mult }
    const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));

    // ---- camada base (Base Game + Character Level) ----
    // Crescimento linear com o nível de personagem. Como a vida do mob é
    // EXPONENCIAL no nível do mob, o gap entre os dois é preenchido por gear
    // (a "treadmill de loot" do gênero).
    layer("atk").flat += 10 + (d.level - 1) * 4;
    layer("hp").flat += 40 + (d.level - 1) * 10;
    // Forja: cada reforço dá +4% de ATK (camada de bônus, sempre relevante).
    layer("atk").pct += d.weaponUpgrades * 4;
    layer("crit").flat += 5;
    // atk speed em ATAQUES POR SEGUNDO (estilo Gaiadon): base 1.0 atk/s.
    // gear soma valores tipo +0.05. intervalo = 1 / atkSpeed.
    layer("atkSpeed").flat += 1.0;
    // crit damage base: +50% (multiplicador ×1.5). Gear soma % em cima disso.
    layer("critDmg").flat += 50;
    // xp bonus base: 0% (só vem de gear por enquanto)
    layer("xpBonus").flat += 0;
    // bônus de gold no estilo Gaiadon: base +10% + 0,05% por nível de personagem
    layer("lumensBonus").flat += 10 + d.level * 0.05;

    // ---- camada de equipamento ----
    for (const slot of G.data.slots) {
      const item = this.data.equipped[slot.id];
      if (!item) continue;
      for (const af of item.affixes) {
        layer(af.stat)[af.layer || "flat"] += G.gear.affixValue(item, af);
      }
    }

    const fin = (k) => {
      const x = layer(k);
      return x.flat * (1 + x.pct / 100) * x.mult;
    };

    return {
      atk: Math.round(fin("atk")),
      hp: Math.round(fin("hp")),
      crit: G.util.clamp(fin("crit"), 0, 100),
      critDmg: fin("critDmg"),            // % de dano extra no crit (ex.: 50 = +50%)
      critMult: 1 + fin("critDmg") / 100, // multiplicador final do crit
      atkSpeed: fin("atkSpeed"),          // ataques por segundo (base 1.0)
      xpBonus: fin("xpBonus"),            // % de XP extra por kill
      lumensBonus: fin("lumensBonus"),
      _layers: L, // exposto p/ tooltip detalhado no futuro
    };
  },

  maxHp() {
    return this.stats().hp;
  },

  // intervalo entre ataques automáticos em segundos: 1 / (ataques por segundo)
  attackInterval() {
    const aps = this.stats().atkSpeed;
    return G.util.clamp(1.0 / aps, 0.1, 5);
  },

  // XP necessária para o próximo nível
  xpToNext() {
    return Math.floor(50 * Math.pow(this.data.level, 1.5));
  },

  // ------------- SAVE / LOAD -------------
  // Em file:// o navegador bloqueia o localStorage. Detectamos isso e caímos
  // num armazenamento em memória (o jogo roda na sessão, mas não persiste).
  // Rodando por um servidor (o atalho "Jogar Eclats"), o save funciona normal.
  _mem: {},
  _hasLS: null,

  storageOk() {
    if (this._hasLS !== null) return this._hasLS;
    try {
      const k = "__eclats_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      this._hasLS = true;
    } catch (e) {
      this._hasLS = false;
    }
    return this._hasLS;
  },

  save() {
    this.data.lastSeen = Date.now();
    const json = JSON.stringify(this.data);
    if (this.storageOk()) {
      try { localStorage.setItem(this.SAVE_KEY, json); } catch (e) {}
    } else {
      this._mem[this.SAVE_KEY] = json; // fallback em memória
    }
  },

  load() {
    let loaded = null;
    try {
      const raw = this.storageOk()
        ? localStorage.getItem(this.SAVE_KEY)
        : this._mem[this.SAVE_KEY];
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {
      loaded = null;
    }
    this.data = loaded || this.fresh();
    // garante campos novos em saves antigos
    this.data = Object.assign(this.fresh(), this.data);
    // reconcilia as 6 peças fixas com a definição atual (stats/afixos novos),
    // preservando nível e raridade salvos
    this.data.equipped = G.gear.reconcile(this.data.equipped);
    if (this.data.hp <= 0) this.data.hp = this.maxHp();
    return !!loaded;
  },

  reset() {
    if (this.storageOk()) {
      try { localStorage.removeItem(this.SAVE_KEY); } catch (e) {}
    }
    delete this._mem[this.SAVE_KEY];
    this.data = this.fresh();
    this.data.hp = this.maxHp();
  },
};
