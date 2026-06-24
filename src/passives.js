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

  // ================= PLACEHOLDERS DE MAGNITUDE (balanceamento pendente) =========
  // Magnitude por nível, por tipo de efeito. Valores são PLACEHOLDERS.
  //   LIVE (têm alvo no motor de stats): magnitude token = 1 (visível/funcional).
  //   NÃO-LIVE (sistemas ainda inexistentes): magnitude 0 (estrutura sem efeito).
  PLACEHOLDER_PER_LEVEL: 1,
  UNIT: {
    // --- LIVE (Éclat / economia) ---
    atkPct: 1, hpPct: 1, critRate: 1, critDmg: 1,   // +1 (% ou ponto) por nível — placeholder
    lumensPct: 1, xpPct: 1,
    hpToDamage: 0,        // converte % do HP em ATK — magnitude pendente de design
    // --- NÃO-LIVE (aguardando sistemas/balanceamento) — magnitude 0 ---
    bossDmg: 0, eliteDmg: 0, capstoneEclat: 0,
    matCommonPct: 0, matUncommonPct: 0, matGeneralPct: 0, dropRate: 0,
    matQuantity: 0, capstoneVestige: 0,
    convPointsPct: 0, convPointsMin: 0, awakenMatPct: 0, awakenReqReduction: 0,
    eliteChance: 0, miniBossThreshold: 0, moreEnemies: 0, gearXp: 0,
    upgradeCostReduction: 0, promotionCostReduction: 0,
    convEfficiency: 0, awakenEfficiency: 0, capstoneFracture: 0,
    _default: 0,
  },
  // efeitos ADIADOS para o Mapa 2 (exigem sistemas inexistentes: combate
  // multi-inimigo / XP de gear). Seus nós ficam INDISPONÍVEIS (não compráveis e
  // fora do gating de grupo) — nenhum nó comprável fica sem efeito.
  MAP2: ["moreEnemies", "gearXp"],
  // efeitos que o motor de stats consome agora (para estilo/roteamento)
  LIVE: ["atkPct", "hpPct", "critRate", "critDmg", "lumensPct", "xpPct"],
  // efeito "primário" de cada árvore (usado só no resumo visual ×multiplicador)
  PRIMARY: { eclat: "atkPct", vestige: "lumensPct", fracture: "convPointsPct" },

  // ---- definição das árvores (15 nós cada): list[i] = [nome, effectKey] ----
  trees: {
    eclat: {
      label: "Éclat", sub: "Combat & Vitality", cls: "t-eclat", stat: "power",
      list: [
        ["ATK %", "atkPct"], ["ATK %", "atkPct"], ["ATK %", "atkPct"],
        ["Crit Rate", "critRate"], ["Crit Rate", "critRate"],
        ["Crit Damage", "critDmg"],
        ["Boss Damage", "bossDmg"], ["Elite Damage", "eliteDmg"], ["Boss Damage", "bossDmg"],
        ["HP %", "hpPct"], ["HP %", "hpPct"], ["HP → Damage", "hpToDamage"],
        ["ATK %", "atkPct"], ["Crit Damage", "critDmg"],
        ["Hybrid Capstone", "capstoneEclat"],
      ],
    },
    vestige: {
      label: "Vestige", sub: "Economy & Farm", cls: "t-vest", stat: "gains",
      list: [
        ["Lumens %", "lumensPct"], ["Lumens %", "lumensPct"], ["Lumens %", "lumensPct"],
        ["XP %", "xpPct"], ["XP %", "xpPct"], ["XP %", "xpPct"],
        ["Material Common %", "matCommonPct"], ["Material Uncommon %", "matUncommonPct"],
        ["General Materials %", "matGeneralPct"],
        ["Drop Rate", "dropRate"], ["Drop Rate", "dropRate"],
        ["Material Quantity", "matQuantity"],
        ["Lumens %", "lumensPct"], ["Materials %", "matGeneralPct"],
        ["Infinite Prosperity Capstone", "capstoneVestige"],
      ],
    },
    fracture: {
      label: "Fracture", sub: "Metaprogression & World Rules", cls: "t-frac", stat: "account",
      list: [
        ["Convergence Points %", "convPointsPct"], ["Convergence Points %", "convPointsPct"],
        ["Guaranteed Min Points", "convPointsMin"],
        ["Awaken Materials %", "awakenMatPct"], ["Awaken Materials %", "awakenMatPct"],
        ["Awaken Requirement Reduction", "awakenReqReduction"],
        ["Elite Chance", "eliteChance"], ["Lower Mini Boss Threshold", "miniBossThreshold"],
        ["More Simultaneous Enemies", "moreEnemies"],
        ["Gear XP", "gearXp"], ["Upgrade Cost Reduction", "upgradeCostReduction"],
        ["Promotion Cost Reduction", "promotionCostReduction"],
        ["Convergence Efficiency", "convEfficiency"], ["Awaken Efficiency", "awakenEfficiency"],
        ["Hybrid Capstone", "capstoneFracture"],
      ],
    },
  },

  // descrição (texto de UI) por efeito — sem números (magnitude é placeholder)
  EFFECT_DESC: {
    atkPct: "Increases your ATK.", hpPct: "Increases your HP.",
    critRate: "Increases your critical chance.", critDmg: "Increases your critical damage.",
    hpToDamage: "Converts part of your HP into ATK.",
    bossDmg: "Increases damage dealt to Bosses.", eliteDmg: "Increases damage dealt to Elites.",
    capstoneEclat: "Hybrid capstone — combined combat power.",
    lumensPct: "Increases Lumens gained.", xpPct: "Increases XP gained.",
    matCommonPct: "Increases Common material gains.", matUncommonPct: "Increases Uncommon material gains.",
    matGeneralPct: "Increases all material gains.", dropRate: "Increases drop rate.",
    matQuantity: "Increases the quantity of materials dropped.",
    capstoneVestige: "Infinite Prosperity — ultimate economy bonus (Lumens & XP).",
    convPointsPct: "Increases Convergence Points earned.",
    convPointsMin: "Guarantees a minimum of Convergence Points.",
    awakenMatPct: "Increases Awaken material gains.",
    awakenReqReduction: "Reduces Awaken requirements.",
    eliteChance: "Increases the chance for Elites to appear.",
    miniBossThreshold: "Lowers the kill threshold for Mini Bosses.",
    moreEnemies: "Planned for Map 2 — requires multi-enemy combat.",
    gearXp: "Planned for Map 2 — requires the Gear XP system.",
    upgradeCostReduction: "Reduces Gear upgrade cost.",
    promotionCostReduction: "Reduces rarity promotion cost.",
    convEfficiency: "Improves Convergence efficiency.", awakenEfficiency: "Improves Awaken efficiency.",
    capstoneFracture: "Hybrid capstone — combined account power.",
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
  // soma de TODOS os efeitos investidos: { effectKey: magnitudeTotal } (placeholder)
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
    return out;
  },
  effect(key) { return this.effects()[key] || 0; },

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
