// =============================================================
// state.js — ESTADO do jogo + atributos derivados + save/load + idle
// =============================================================
// Uma única "fonte da verdade" do que o jogador tem agora.
// Atributos finais = base + bônus do equipamento + forja.

G.state = {
  data: null,         // o objeto salvo de fato (preenchido em init)
  _statsCache: null,  // cache de stats(); limpo por invalidateStats()

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
      areaIndex: 0,          // sub-área atual do Mapa 1 (0 = The Dreaming Wood)
      maxAreaUnlocked: 0,    // maior sub-área liberada (boss anterior derrotado)
      mapOneCleared: false,  // Mapa 1 concluído (boss final derrotado ao menos 1x)
      convergencePoints: 0,  // moeda de prestige (gasta nas passivas — ver convergence.js)
      convergences: 0,       // quantas vezes renasceu
      highestLevel: 1,       // recorde de nível (não reseta na Convergence)
      awakenEssence: 0,      // material do Awaken legado (First Light atual; rework futuro)
      awakensUnlocked: [],   // ids dos Awakens desbloqueados (permanentes)
      // ---- materiais (fundação econômica — ver economy.js) ----
      gearMaterials: { common: 0, uncommon: 0 },   // promoções de raridade (futuro)
      awakenMaterials: { firstLight: 0 },          // First Light / Awakens (futuro)
      // contadores da RUN (resetam na Convergence) — alimentam a fórmula de
      // Pontos = Área + Bosses + Nível + Kills (ver convergence.js)
      runKills: 0,           // kills nesta run
      runBosses: 0,          // bosses derrotados nesta run
      runMaxAreaIndex: 0,    // maior sub-área alcançada nesta run
      passives: G.passives.freshSet(), // árvores Éclat/Vestige/Fracture (ver passives.js)
      equipped: G.gear.freshSet(), // 6 peças FIXAS (Nv.1, Comum) — ver gear.js
      lastSeen: Date.now(),  // p/ progresso offline
    };
  },

  // --- Atributos FINAIS, modelo Gaiadon em camadas ---
  // Cada stat acumula: flat (Primary), pct (Bonus%), mult (Multiplier).
  // Fórmula final = flat × (1 + pct/100) × mult.
  // Fontes hoje: base do jogo, nível, forja, equipamento.
  // (No futuro: Ascension/Divinity/etc. é só somar mais em cada camada.)
  invalidateStats() { this._statsCache = null; },

  stats() {
    if (this._statsCache) return this._statsCache;
    const d = this.data;
    const L = {}; // L[stat] = { flat, pct, mult }
    const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));

    // ---- camada base (Base Game + Character Level) ----
    // Crescimento linear com o nível de personagem. Como a vida do mob é
    // EXPONENCIAL no nível do mob, o gap entre os dois é preenchido por gear
    // (a "treadmill de loot" do gênero).
    // Base alta (1000) e ganho por nível PEQUENO: o nível serve de relógio das
    // áreas; o PODER vem do gear (loot-driven). Mapa 1 vai do nível 1 ao 5000.
    layer("atk").flat += 1000 + (d.level - 1) * 2;
    layer("hp").flat += 1000 + (d.level - 1) * 2;
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

    // ---- camada Awaken (3ª fonte de poder; permanente) ----
    if (G.awaken) G.awaken.applyTo(layer);

    // ---- passivas (efeitos com alvo no motor de stats) ----
    // Efeitos LIVE somam nas camadas correspondentes; magnitudes vêm de
    // G.passives.UNIT (placeholders configuráveis). HP→Dano é aplicado depois
    // (precisa do HP final). Demais efeitos (Boss/Elite Damage, materiais,
    // convergence, etc.) são expostos por G.passives.effect() para sistemas
    // futuros e não tocam os stats agora.
    let passEff = null;
    if (G.passives) {
      passEff = G.passives.effects();
      layer("atk").pct += passEff.atkPct || 0;             // Éclat: ATK %
      layer("hp").pct += passEff.hpPct || 0;               // Éclat: HP %
      layer("crit").flat += passEff.critRate || 0;         // Éclat: Crit Rate
      layer("critDmg").flat += passEff.critDmg || 0;       // Éclat: Crit Damage
      layer("lumensBonus").flat += passEff.lumensPct || 0; // Vestige: Lumens %
      layer("xpBonus").flat += passEff.xpPct || 0;         // Vestige: XP %
    }

    const fin = (k) => {
      const x = layer(k);
      return x.flat * (1 + x.pct / 100) * x.mult;
    };

    // HP → Dano (Éclat): injeta uma fração do HP final no ATK antes de finalizar.
    if (passEff && passEff.hpToDamage) {
      layer("atk").flat += fin("hp") * (passEff.hpToDamage / 100);
    }

    this._statsCache = {
      atk: Math.round(fin("atk")),
      hp: Math.round(fin("hp")),
      crit: G.util.clamp(fin("crit"), 0, 100),
      critDmg: fin("critDmg"),
      critMult: 1 + fin("critDmg") / 100,
      atkSpeed: fin("atkSpeed"),
      xpBonus: fin("xpBonus"),
      lumensBonus: fin("lumensBonus"),
      _layers: L,
    };
    return this._statsCache;
  },

  maxHp() {
    return this.stats().hp;
  },

  // intervalo entre ataques automáticos em segundos: 1 / (ataques por segundo)
  attackInterval() {
    const aps = this.stats().atkSpeed;
    return G.util.clamp(1.0 / aps, 0.1, 5);
  },

  // XP necessária para o próximo nível.
  // LINEAR (14 × nível): com 5000 níveis no Mapa 1, a antiga curva ^1.5 faria o
  // mapa levar ~800h. Linear mantém ~1,4 kills por nível (xpToNext/baseXp) e o
  // mapa fecha em ~6h ativas.
  xpToNext() {
    return Math.ceil(14 * this.data.level);
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
    // garante campos escalares novos em saves antigos (shallow merge é suficiente
    // para primitivos; objetos aninhados são reconciliados individualmente abaixo)
    this.data = Object.assign(this.fresh(), this.data);
    // reconcilia as 6 peças fixas com a definição atual (stats/afixos novos),
    // preservando nível e raridade salvos
    this.data.equipped = G.gear.reconcile(this.data.equipped);
    // garante os campos de materiais em saves antigos (inicializa novos com zero)
    if (G.economy) G.economy.reconcile(this.data);
    // deep merge das passivas: preserva níveis salvos, garante novas árvores/índices
    {
      const fresh = G.passives.freshSet();
      const saved = this.data.passives;
      if (saved && typeof saved === "object") {
        for (const tree of Object.keys(fresh)) {
          if (Array.isArray(saved[tree]))
            // preserva os níveis salvos por índice, clampando ao novo teto do nó
            // (a arquitetura mudou o significado dos nós; o investimento é mantido)
            fresh[tree] = fresh[tree].map((_, i) => Math.min(saved[tree][i] || 0, G.passives.nodeMax(tree, i)));
        }
      }
      this.data.passives = fresh;
    }
    this.invalidateStats();
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
