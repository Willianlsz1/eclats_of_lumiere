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
      mapOneCleared: false,  // Continente 1 concluído (Boss Final da Área 20 derrotado ao menos 1x)
      guardianDefeated: false, // Guardião (Área 9 / fim do Mapa 1) derrotado — gate do Awaken
      vestiges: 0,           // moeda das passivas, gerada pela Convergence (CANON_V2 §5)
      convergences: 0,       // quantas vezes renasceu
      highestLevel: 1,       // recorde de nível (não reseta na Convergence)
      totalKills: 0,         // kills acumuladas (NÃO reseta) — requisito de Awaken
      awakenEssence: 0,      // material legado (migrado p/ awakenMaterials.firstLight)
      awakensUnlocked: [],   // alias legado da lista de awakens concluídos
      awakens: [],           // ids de Awakens concluídos (canônico — AWAKEN_V1)
      awakenTier: 0,         // nº de Awakens concluídos / tier atual
      awakenLevel: 0,        // nível do Awaken (futuro; placeholder)
      ascensions: 0,         // nº de Ascensions realizadas (rank da Ordre — CP-3E)
      // ---- materiais (fundação econômica — ver economy.js) ----
      gearMaterials: { common: 0, uncommon: 0 },   // promoções de raridade (futuro)
      awakenMaterials: { firstLight: 0 },          // First Light / Awakens (futuro)
      eclats: 0,                                   // moeda das Mémoires (fundação — ver economy.js)
      // Mémoires (CP-2B descoberta + CP-2C restauração) — estado + nível (Era I)
      memoires: {
        premierMatin: { state: "notFound", level: 0 },
        desRires: { state: "notFound", level: 0 },
        deLaMarche: { state: "notFound", level: 0 },
      },
      // contadores da RUN (resetam na Convergence) — alimentam a fórmula de
      // Pontos = Área + Bosses + Nível + Kills (ver convergence.js)
      runKills: 0,           // kills nesta run
      runBosses: 0,          // bosses derrotados nesta run
      runMaxAreaIndex: 0,    // maior sub-área alcançada nesta run
      // ---- thresholds de encontro (ENEMY_STRUCTURE_V1) — por sessão de área ----
      miniBossProgress: 0,   // kills acumuladas rumo ao Mini Boss
      bossProgress: 0,       // kills rumo ao respawn do Boss
      bossOnCooldown: false, // Boss já derrotado (aguardando respawn por threshold)
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
    // atk speed em ATAQUES POR SEGUNDO: base 0.9 atk/s (teto 15 — ver stats()).
    // gear soma valores tipo +0.05. intervalo = 1 / atkSpeed.
    layer("atkSpeed").flat += G.data.balance.atkSpeedBase;
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
      // capstones híbridos (multiplicadores da própria árvore)
      const capE = 1 + (passEff.capstoneEclat || 0) / 100;   // Éclat: ATK + HP
      layer("atk").mult *= capE; layer("hp").mult *= capE;
      const capV = 1 + (passEff.capstoneVestige || 0) / 100;  // Vestige: Lumens + XP
      layer("lumensBonus").mult *= capV; layer("xpBonus").mult *= capV;
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
      atkSpeed: G.util.clamp(fin("atkSpeed"), 0, G.data.balance.atkSpeedCap),
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
    return G.util.clamp(1.0 / aps, 1 / G.data.balance.atkSpeedCap, 5);
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
    // migração CANON_V2: a moeda das passivas foi renomeada convergencePoints -> vestiges
    if (this.data.convergencePoints != null) {
      this.data.vestiges = (this.data.vestiges || 0) + this.data.convergencePoints;
      delete this.data.convergencePoints;
    }
    // reconcilia as 6 peças fixas com a definição atual (stats/afixos novos),
    // preservando nível e raridade salvos
    this.data.equipped = G.gear.reconcile(this.data.equipped);
    // garante os campos de materiais em saves antigos (inicializa novos com zero)
    if (G.economy) G.economy.reconcile(this.data);
    // garante a descoberta das Mémoires em saves antigos (CP-2B)
    if (G.memoires) G.memoires.reconcile(this.data);
    // migração do Awaken (AWAKEN_V1): consolida o estado antigo
    if (!Array.isArray(this.data.awakens)) this.data.awakens = [];
    if (!this.data.awakens.length && Array.isArray(this.data.awakensUnlocked) && this.data.awakensUnlocked.length)
      this.data.awakens = this.data.awakensUnlocked.slice();   // antigo -> canônico
    this.data.awakensUnlocked = this.data.awakens;             // alias sincronizado
    if (typeof this.data.awakenTier !== "number" || this.data.awakenTier < this.data.awakens.length)
      this.data.awakenTier = this.data.awakens.length;
    // dobra a essência legada no material canônico do Awaken (uma vez)
    if (this.data.awakenEssence && this.data.awakenMaterials) {
      this.data.awakenMaterials.firstLight = (this.data.awakenMaterials.firstLight || 0) + this.data.awakenEssence;
      this.data.awakenEssence = 0;
    }
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
