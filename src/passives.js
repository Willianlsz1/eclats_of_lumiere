// =============================================================
// passives.js — Árvores de Passivas (Éclat · Vestige · Fracture)
// =============================================================
// Arquitetura conforme docs/CONVERGENCE_FINAL.md. 3 árvores × 15 nós.
// Cada nó declara um EFEITO (chave semântica). A MAGNITUDE de cada efeito é
// um PLACEHOLDER configurável (ver UNIT) — o balanceamento final virá depois.
//
// Efeitos "LIVE" (atkPct/hpPct/critRate/critDmg/lumensPct/xpPct/hpToDamage) já
// têm alvo no motor de stats (state.stats()). Os demais efeitos existem
// estruturalmente e são expostos por effect(key) para os sistemas futuros
// (materiais, promoção, elite, mini boss, awaken, convergence) consumirem —
// hoje com magnitude placeholder 0 (sem impacto no jogo).
//
// O modelo de GATING (3 grupos de 5; maximizar o grupo libera o próximo) e o
// modelo de CUSTO (unlockLadder × groupMult, evolução geométrica) são mantidos
// do sistema anterior — são placeholders já existentes, não alteram a economia.

G.passives = {
  TREES: ["eclat", "vestige", "fracture"],
  GROUP_SIZE: 5,
  maxLevel: 12,             // teto PADRÃO de nós multi-nível (placeholder)

  // ---- gating / custo (placeholders herdados — economia de pontos inalterada) ----
  unlockLadder: [100, 500, 2500, 12500, 62500],
  groupMult: [1, 10, 100],
  evoFactor: 0.3, evoRamp: 1.3,

  // ================= MAGNITUDE POR NÍVEL (1ª passagem — ajustável na Fase 3) =====
  // Magnitude por nível, por tipo de efeito. Já são valores FUNCIONAIS (não 0):
  // comprar um nó FAZ algo. Mecânicas "dinâmicas" (dmgPerKill/dmgPerArea/…) usam
  // estas magnitudes × um fator do estado do jogo (kills/áreas/convergences).
  PLACEHOLDER_PER_LEVEL: 1,
  UNIT: {
    // --- Éclat (combate) ---
    atkPct: 3, hpPct: 3, critRate: 0.5, critDmg: 5,
    hpToDamage: 0.5,        // Iron Body: +0,5% do HP final vira ATK / nível
    bossDmg: 4, eliteDmg: 4, capstoneEclat: 10,
    dmgPerKill: 0.02,       // Bloodlust: +0,02% dano por kill na run / nível
    // --- Vestige (economia) ---
    lumensPct: 4, xpPct: 4,
    matCommonPct: 4, matUncommonPct: 4, matGeneralPct: 3, dropRate: 2,
    matQuantity: 3, capstoneVestige: 10,
    upgradeCostReduction: 2, promotionCostReduction: 2,
    lumensPerArea: 2,       // Deep Explorer: +2% Lumens por área alcançada / nível
    // --- Fracture (meta / longo prazo) ---
    convPointsPct: 5, convPointsMin: 0, convEfficiency: 3,
    awakenMatPct: 5, awakenReqReduction: 2, awakenEfficiency: 4, capstoneFracture: 10,
    eliteChance: 1, miniBossThreshold: 3,
    atkPerConvergence: 0.5, // Ancient Memory: +0,5% ATK por Convergence / nível
    dmgPerArea: 1,          // Fractured Destiny: +1% dano por área alcançada / nível
    globalPerCycle: 5,      // Perfect Cycle: +5% global a cada 10 Convergences / nível
    resonancePerConv: 0.1,  // Fragment Resonance: amplifica TODAS as passivas / nível × Convergences
    // --- adiados ao Mapa 2 (sistemas inexistentes) — sem efeito ---
    moreEnemies: 0, gearXp: 0,
    _default: 0,
  },
  // efeitos ADIADOS para o Mapa 2 (exigem sistemas inexistentes: combate
  // multi-inimigo / XP de gear). Seus nós ficam INDISPONÍVEIS (não compráveis e
  // fora do gating de grupo) — nenhum nó comprável fica sem efeito.
  MAP2: ["moreEnemies", "gearXp"],
  // efeitos que o motor de stats consome agora (para estilo/roteamento)
  LIVE: ["atkPct", "hpPct", "critRate", "critDmg", "lumensPct", "xpPct"],
  // efeitos DINÂMICOS: escalam com o estado do jogo (kills/áreas/convergences).
  // São aplicados em combat/economy, não no motor de stats estático.
  DYNAMIC: ["dmgPerKill", "dmgPerArea", "atkPerConvergence", "globalPerCycle", "lumensPerArea"],
  // efeito "primário" de cada árvore (usado só no resumo visual ×multiplicador)
  PRIMARY: { eclat: "atkPct", vestige: "lumensPct", fracture: "convPointsPct" },

  // ---- definição das árvores (15 nós cada): list[i] = [nome, effectKey] ----
  // Identidade: Éclat = poder imediato · Vestige = economia · Fracture = meta
  // (fraca no início, escala com o tempo). Mecânicas memoráveis concentradas
  // na Fracture (Ancient Memory, Fractured Destiny, Perfect Cycle, Resonance).
  trees: {
    eclat: {
      label: "Éclat", sub: "Combat & Vitality", cls: "t-eclat", stat: "power",
      list: [
        ["ATK %", "atkPct"], ["Bloodlust", "dmgPerKill"], ["Crit Rate", "critRate"],
        ["Crit Damage", "critDmg"], ["Iron Body", "hpToDamage"],
        ["Slayer", "bossDmg"], ["Exterminator", "eliteDmg"], ["ATK %", "atkPct"],
        ["Crit Rate", "critRate"], ["HP %", "hpPct"],
        ["ATK %", "atkPct"], ["Crit Damage", "critDmg"], ["HP %", "hpPct"], ["ATK %", "atkPct"],
        ["Hybrid Capstone", "capstoneEclat"],
      ],
    },
    vestige: {
      label: "Vestige", sub: "Economy & Farm", cls: "t-vest", stat: "gains",
      list: [
        ["Lumens %", "lumensPct"], ["Lumens %", "lumensPct"], ["Material Quantity", "matQuantity"],
        ["Drop Rate", "dropRate"], ["Deep Explorer", "lumensPerArea"],
        ["Material Common %", "matCommonPct"], ["Material Uncommon %", "matUncommonPct"],
        ["Upgrade Cost Reduction", "upgradeCostReduction"],
        ["General Materials %", "matGeneralPct"], ["Promotion Cost Reduction", "promotionCostReduction"],
        ["Lumens %", "lumensPct"], ["XP %", "xpPct"], ["Drop Rate", "dropRate"], ["Materials %", "matGeneralPct"],
        ["Infinite Prosperity Capstone", "capstoneVestige"],
      ],
    },
    fracture: {
      label: "Fracture", sub: "Metaprogression & World Rules", cls: "t-frac", stat: "account",
      list: [
        ["Vestiges %", "convPointsPct"], ["Ancient Memory", "atkPerConvergence"],
        ["Fractured Destiny", "dmgPerArea"],
        ["Vestiges %", "convPointsPct"], ["Awaken Materials %", "awakenMatPct"],
        ["Awaken Requirement Reduction", "awakenReqReduction"],
        ["Elite Chance", "eliteChance"], ["Lower Mini Boss Threshold", "miniBossThreshold"],
        ["More Simultaneous Enemies", "moreEnemies"],
        ["Gear XP", "gearXp"], ["Perfect Cycle", "globalPerCycle"],
        ["Fragment Resonance", "resonancePerConv"],
        ["Convergence Efficiency", "convEfficiency"], ["Awaken Efficiency", "awakenEfficiency"],
        ["Hybrid Capstone", "capstoneFracture"],
      ],
    },
  },

  // descrição (texto de UI) por efeito
  EFFECT_DESC: {
    atkPct: "Increases your ATK.", hpPct: "Increases your HP.",
    critRate: "Increases your critical chance.", critDmg: "Increases your critical damage.",
    hpToDamage: "Iron Body — converts part of your max HP into ATK.",
    bossDmg: "Slayer — increases damage dealt to Bosses and Mini Bosses.",
    eliteDmg: "Exterminator — increases damage dealt to Elites.",
    dmgPerKill: "Bloodlust — gain damage with every kill; resets on Convergence.",
    capstoneEclat: "Hybrid capstone — multiplies your ATK and HP.",
    lumensPct: "Increases Lumens gained.", xpPct: "Increases XP gained.",
    matCommonPct: "Increases Common material gains.", matUncommonPct: "Increases Uncommon material gains.",
    matGeneralPct: "Increases all material gains.", dropRate: "Increases drop rate.",
    matQuantity: "Increases the quantity of materials dropped.",
    lumensPerArea: "Deep Explorer — more Lumens for every area you have reached.",
    capstoneVestige: "Infinite Prosperity — multiplies your Lumens and XP.",
    convPointsPct: "Increases Vestiges earned on Convergence.",
    convPointsMin: "Guarantees a minimum of Vestiges.",
    awakenMatPct: "Increases Awaken material gains.",
    awakenReqReduction: "Reduces Awaken requirements.",
    eliteChance: "Increases the chance for Elites to appear.",
    miniBossThreshold: "Lowers the kill threshold for Mini Bosses.",
    atkPerConvergence: "Ancient Memory — permanent ATK that grows with every Convergence.",
    dmgPerArea: "Fractured Destiny — permanent damage for every area you have reached.",
    globalPerCycle: "Perfect Cycle — a global multiplier for every 10 Convergences.",
    resonancePerConv: "Fragment Resonance — each Convergence amplifies ALL of your passives.",
    moreEnemies: "Planned for Map 2 — requires multi-enemy combat.",
    gearXp: "Planned for Map 2 — requires the Gear XP system.",
    upgradeCostReduction: "Reduces Gear upgrade cost.",
    promotionCostReduction: "Reduces rarity promotion cost.",
    convEfficiency: "Improves Convergence efficiency.", awakenEfficiency: "Improves Awaken efficiency.",
    capstoneFracture: "Hybrid capstone — amplifies your account-wide meta power.",
  },

  // posição de cada nó (%x,%y) sobre a Árvore-Mundo: G1 base → G2 meio → G3 copa
  POSITIONS: [
    { x: 31, y: 70 }, { x: 41, y: 65 }, { x: 50, y: 63 }, { x: 61, y: 63 }, { x: 73, y: 66 },
    { x: 25, y: 48 }, { x: 37, y: 42 }, { x: 50, y: 39 }, { x: 66, y: 39 }, { x: 79, y: 44 },
    { x: 35, y: 26 }, { x: 43, y: 20 }, { x: 50, y: 16 }, { x: 59, y: 18 }, { x: 69, y: 23 },
  ],

  // ---- estado / metadados de nó ----
  freshSet() { return { eclat: Array(15).fill(0), vestige: Array(15).fill(0), fracture: Array(15).fill(0) }; },
  groupOf(i) { return Math.floor(i / this.GROUP_SIZE); },
  posOf(i) { return i % this.GROUP_SIZE; },
  unlocked() { return (G.state.data.convergences || 0) >= 1; },
  level(tree, i) { const p = G.state.data.passives; return (p && p[tree] && p[tree][i]) || 0; },
  effectOf(tree, i) { return this.trees[tree].list[i][1]; },
  isCapstone(key) { return /^capstone/.test(key); },
  // nó adiado ao Mapa 2: indisponível (não comprável, fora do gating de grupo)
  isDeferred(tree, i) { return this.MAP2.indexOf(this.effectOf(tree, i)) !== -1; },
  // teto de nível POR NÓ: capstone = 1 (nó único); demais = maxLevel (placeholder)
  nodeMax(tree, i) { return this.isCapstone(this.effectOf(tree, i)) ? 1 : this.maxLevel; },

  // ---- custo / gating (placeholders herdados) ----
  unlockCost(i) { return this.unlockLadder[this.posOf(i)] * this.groupMult[this.groupOf(i)]; },
  nextCost(tree, i) {
    const lv = this.level(tree, i);
    if (lv === 0) return this.unlockCost(i);
    return Math.ceil(this.unlockCost(i) * this.evoFactor * Math.pow(this.evoRamp, lv - 1));
  },
  isMax(tree, i) { return this.level(tree, i) >= this.nodeMax(tree, i); },
  groupUnlocked(tree, g) {
    if (g === 0) return true;
    const arr = G.state.data.passives && G.state.data.passives[tree];
    if (!arr) return false;
    for (let p = 0; p < this.GROUP_SIZE; p++) {
      const idx = (g - 1) * this.GROUP_SIZE + p;
      if (this.isDeferred(tree, idx)) continue;        // nós Mapa 2 não travam o grupo
      if (arr[idx] < this.nodeMax(tree, idx)) return false;
    }
    return true;
  },
  canBuy(tree, i) {
    return this.unlocked() && !this.isDeferred(tree, i) && !this.isMax(tree, i) &&
      this.groupUnlocked(tree, this.groupOf(i)) &&
      (G.state.data.vestiges || 0) >= this.nextCost(tree, i);
  },
  buy(tree, i) {
    if (!this.canBuy(tree, i)) return false;
    G.state.data.vestiges -= this.nextCost(tree, i);
    G.state.data.passives[tree][i] += 1;
    G.state.invalidateStats();
    G.state.save();
    return true;
  },

  // ================= EFEITOS =================
  unit(key) { return this.UNIT[key] != null ? this.UNIT[key] : this.UNIT._default; },
  // soma de TODOS os efeitos investidos: { effectKey: magnitudeTotal }.
  // Fragment Resonance (Fracture): cada Convergence amplifica TODAS as outras
  // passivas — aplicado como um escalar global no fim (não sobre si mesmo).
  effects() {
    const out = {};
    for (const tree of this.TREES) {
      const list = this.trees[tree].list;
      for (let i = 0; i < list.length; i++) {
        if (this.isDeferred(tree, i)) continue;        // nós Mapa 2 não produzem efeito
        const lv = this.level(tree, i);
        if (!lv) continue;
        const key = list[i][1];
        out[key] = (out[key] || 0) + lv * this.unit(key);
      }
    }
    const convs = (G.state.data && G.state.data.convergences) || 0;
    const resonance = 1 + ((out.resonancePerConv || 0) / 100) * convs;
    if (resonance !== 1) for (const k in out) if (k !== "resonancePerConv") out[k] *= resonance;
    return out;
  },
  effect(key) { return this.effects()[key] || 0; },

  // ---- multiplicadores DINÂMICOS (escalam com o estado do jogo) ----
  // fator do estado para cada efeito dinâmico (kills da run, áreas alcançadas, …)
  dynFactor(key) {
    const d = G.state.data || {};
    switch (key) {
      case "dmgPerKill": return d.runKills || 0;                 // Bloodlust (zera na Convergence)
      case "dmgPerArea": return d.maxAreaUnlocked || 0;          // Fractured Destiny (permanente)
      case "lumensPerArea": return d.maxAreaUnlocked || 0;       // Deep Explorer
      case "atkPerConvergence": return d.convergences || 0;      // Ancient Memory
      case "globalPerCycle": return Math.floor((d.convergences || 0) / 10); // Perfect Cycle
      default: return 0;
    }
  },
  // multiplicador de DANO vindo de efeitos dinâmicos de combate (Éclat + Fracture)
  dynDamageMult() {
    const e = this.effects();
    let m = 1;
    m += ((e.dmgPerKill || 0) / 100) * this.dynFactor("dmgPerKill");
    m += ((e.dmgPerArea || 0) / 100) * this.dynFactor("dmgPerArea");
    m += ((e.atkPerConvergence || 0) / 100) * this.dynFactor("atkPerConvergence");
    m += ((e.globalPerCycle || 0) / 100) * this.dynFactor("globalPerCycle");  // Perfect Cycle (global)
    return m;
  },
  // multiplicador de ECONOMIA (Lumens) vindo de efeitos dinâmicos (Vestige + Fracture)
  dynLumensMult() {
    const e = this.effects();
    let m = 1;
    m += ((e.lumensPerArea || 0) / 100) * this.dynFactor("lumensPerArea");
    m += ((e.globalPerCycle || 0) / 100) * this.dynFactor("globalPerCycle");  // Perfect Cycle (global)
    return m;
  },

  // materiais de Awaken (consumido por combat.js no drop de Essence) — placeholder
  materialsMult() { return 1 + this.effect("awakenMatPct") / 100; },

  // ---- helpers de UI (estilo) ----
  // role-engine = capstone (visual de "ápice"); role-lever = efeito especial não-LIVE
  isEngine(tree, key) { return this.isCapstone(key); },
  leverOf(key) {
    if (this.isCapstone(key)) return null;
    return this.LIVE.indexOf(key) === -1 ? key : null; // não-LIVE → estilo "lever"
  },
  // multiplicador representativo da árvore (apenas exibição do resumo)
  treeMult(tree) { return 1 + this.effect(this.PRIMARY[tree]) / 100; },

  treeProgress(tree) {
    const arr = G.state.data.passives[tree];
    let u = 0, m = 0, total = 0;
    for (let i = 0; i < arr.length; i++) {
      if (this.isDeferred(tree, i)) continue;          // nós Mapa 2 não contam
      total++;
      if (arr[i] > 0) u++;
      if (arr[i] >= this.nodeMax(tree, i)) m++;
    }
    return { unlocked: u, maxed: m, total };
  },
};
