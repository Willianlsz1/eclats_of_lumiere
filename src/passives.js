// =============================================================
// passives.js — Árvores de Passivas (Éclat · Vestige · Fracture)
// =============================================================
// 3 árvores × 15 nós. Cada nó declara um EFEITO (chave semântica). A MAGNITUDE
// de cada efeito é um PLACEHOLDER configurável (ver UNIT).
//
// Efeitos "LIVE" (atkPct/hpPct/critRate/critDmg/lumensPct/xpPct/hpToDamage) já
// têm alvo no motor de stats (state.stats()). Os demais existem estruturalmente
// e são expostos por effect(key) para os sistemas futuros, hoje com magnitude 0.

G.passives = {
  TREES: ["eclat", "vestige", "fracture"],
  GROUP_SIZE: 5,
  maxLevel: 10,

  // ---- gating / custo (placeholders) ----
  // custo de unlock por POSIÇÃO no tier — escalonado: cada nó custa mais que o anterior.
  // tier mais fundo escala via groupMult (tier2 ×10, tier3 ×100).
  unlockLadder: [40, 90, 160, 250, 360],
  groupMult: [1, 10, 100],
  evoFactor: 0.3, evoRamp: 1.3,

  // ================= MAGNITUDES POR NÍVEL =================
  // Tier 1 = additive warm-up, Tier 2 = boss/elite specialization, Tier 3 = multiplicative capstone
  UNIT: {
    // ---- Éclat (combat) ----
    atkFlat:    100,  // T1 — flat ATK per level (×10 = +1,000 ATK at max)
    atkPct:       5,  // T1/T3 — +% ATK per level (2+1 nodes × 10 = +150% total)
    critRate:     3,  // T1 — +% crit chance per level (×10 = +30%)
    critDmg:     50,  // T1/T2/T3 — +% crit damage per level (3 nodes × 10 = +1,500%)
    specialDmg:  12,  // T1 — vs rares & bosses (×10 = +120%)
    hpPct:        8,  // T2/T3 — +% HP per level (2 nodes × 10 = +160%)
    bossDmg:     15,  // T2 — +% damage to bosses per level (2 nodes × 10 = +300%)
    eliteDmg:    10,  // T2 — +% damage to elites per level (×10 = +100%)
    hpToDamage:   4,  // T3 — converts 4% max HP to flat ATK per level (×10 = 40% HP→ATK)
    capstoneEclat: 150, // T3 capstone — ATK ×2.5

    // ---- Vestige (economy) ----
    lumensPct:   10,  // T1 — +% Lumens per level (4 nodes × 10 = +400%)
    xpPct:       10,  // T1/T3 — +% XP per level (3+1 nodes × 10 = +400%)
    matCommonPct:   25, // T2 — +% common material quantity (×10 = +250%)
    matUncommonPct: 30, // T2 — +% uncommon material quantity (×10 = +300%)
    matGeneralPct:  15, // T2/T3 — +% all materials (2 nodes × 10 = +300%)
    dropRate:    10,  // T2 — +% material drop chance per level (2 nodes × 10 = +200%)
    matQuantity: 20,  // T3 — +% material quantity dropped per level (×10 = +200%)
    capstoneVestige: 100, // T3 capstone — Lumens & XP ×2

    // ---- Fracture (meta) ----
    convPointsPct:  10, // T1 — +% convergence points per level (2 nodes × 10 = +200%)
    convPointsMin: 100, // T1 — minimum convergence points per level (×10 = 1,000 guaranteed)
    awakenMatPct:   20, // T2 — +% awaken material per level (2 nodes × 10 = +400%)
    awakenReqReduction: 3, // T2 — reduce awaken requirement % (×10 = 30% reduction)
    eliteChance:    3,  // T2 — +% elite spawn chance per level (×10 = +30%)
    miniBossThreshold: 3, // T2 — lowers kill threshold for mini-boss
    moreEnemies:    0,  // Map 2 — requires multi-enemy combat (future)
    gearXp:         0,  // Map 2 — requires Gear XP system (future)
    convEfficiency: 15, // T3 — +% convergence efficiency per level (×10 = +150%)
    awakenEfficiency: 15, // T3 — +% awaken efficiency per level (×10 = +150%)
    capstoneFracture: 50, // T3 capstone — Conv Points ×1.5

    _default: 0,
  },
  // efeitos ADIADOS para o Mapa 2 (exigem sistemas inexistentes) — nós indisponíveis
  MAP2: ["moreEnemies", "gearXp"],
  LIVE: ["atkFlat", "atkPct", "hpPct", "critRate", "critDmg", "lumensPct", "xpPct"],
  PRIMARY: { eclat: "atkPct", vestige: "lumensPct", fracture: "convPointsPct" },

  // ---- definição das árvores (15 nós cada): list[i] = [nome, effectKey] ----
  trees: {
    eclat: {
      label: "Éclat", sub: "Combat & Vitality", cls: "t-eclat", stat: "power",
      list: [
        // Tier 1 — galho de dano (flat → increased → crit pair → spike)
        ["Flat Power", "atkFlat"], ["Increased Power", "atkPct"],
        ["Crit Rate", "critRate"], ["Crit Damage", "critDmg"],
        ["Giant Slayer", "specialDmg"],
        // Tiers 2–3 (a redesenhar) — travados na slice
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
        ["Gear XP", "gearXp"], ["Refined Methods", "xpPct"],
        ["Battle Hardened", "atkPct"],
        ["Convergence Efficiency", "convEfficiency"], ["Awaken Efficiency", "awakenEfficiency"],
        ["Hybrid Capstone", "capstoneFracture"],
      ],
    },
  },

  EFFECT_DESC: {
    atkFlat: "Adds flat ATK — strongest in the early game.",
    specialDmg: "Deals more damage to Rares and Bosses.",
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
  isDeferred(tree, i) { return this.MAP2.indexOf(this.effectOf(tree, i)) !== -1; },
  nodeMax(tree, i) { return this.isCapstone(this.effectOf(tree, i)) ? 1 : this.maxLevel; },

  // ---- custo / gating ----
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
      if (this.isDeferred(tree, idx)) continue;
      if (arr[idx] < this.nodeMax(tree, idx)) return false;
    }
    return true;
  },
  canBuy(tree, i) {
    return this.unlocked() && !this.isDeferred(tree, i) && !this.isMax(tree, i) &&
      this.groupUnlocked(tree, this.groupOf(i)) &&
      (G.state.data.convergencePoints || 0) >= this.nextCost(tree, i);
  },
  buy(tree, i) {
    if (!this.canBuy(tree, i)) return false;
    G.state.data.convergencePoints -= this.nextCost(tree, i);
    G.state.data.passives[tree][i] += 1;
    G.state.invalidateStats();
    G.state.save();
    return true;
  },

  // ================= EFEITOS =================
  unit(key) { return this.UNIT[key] != null ? this.UNIT[key] : this.UNIT._default; },
  effects() {
    const out = {};
    for (const tree of this.TREES) {
      const list = this.trees[tree].list;
      for (let i = 0; i < list.length; i++) {
        if (this.isDeferred(tree, i)) continue;
        const lv = this.level(tree, i);
        if (!lv) continue;
        const key = list[i][1];
        out[key] = (out[key] || 0) + lv * this.unit(key);
      }
    }
    return out;
  },
  effect(key) { return this.effects()[key] || 0; },

  // texto da magnitude real de um nó (p/ o tooltip): { perLevel, current }
  magnitude(tree, i) {
    const key = this.effectOf(tree, i);
    const per = this.unit(key);
    const FMT = {
      atkFlat:    (v) => `+${v} ATK`,
      atkPct:     (v) => `+${v}% ATK`,
      critRate:   (v) => `+${v}% Crit Rate`,
      critDmg:    (v) => `+${v}% Crit Damage`,
      specialDmg: (v) => `+${v}% vs Rares & Bosses`,
      lumensPct:  (v) => `+${v}% Lumens`,
      xpPct:      (v) => `+${v}% XP`,
      hpPct:      (v) => `+${v}% HP`,
      hpToDamage: (v) => `${v}% of HP as ATK`,
    };
    const fmt = FMT[key];
    if (!fmt || per === 0) return null;
    const r = (x) => +(+x).toFixed(2);
    const lvl = this.level(tree, i);
    return { perLevel: fmt(r(per)), current: lvl > 0 ? fmt(r(per * lvl)) : null };
  },

  materialsMult() { return 1 + this.effect("awakenMatPct") / 100; },

  // ---- helpers de UI (estilo) ----
  isEngine(tree, key) { return this.isCapstone(key); },
  leverOf(key) {
    if (this.isCapstone(key)) return null;
    return this.LIVE.indexOf(key) === -1 ? key : null;
  },
  treeMult(tree) { return 1 + this.effect(this.PRIMARY[tree]) / 100; },

  treeProgress(tree) {
    const arr = G.state.data.passives[tree];
    let u = 0, m = 0, total = 0;
    for (let i = 0; i < arr.length; i++) {
      if (this.isDeferred(tree, i)) continue;
      total++;
      if (arr[i] > 0) u++;
      if (arr[i] >= this.nodeMax(tree, i)) m++;
    }
    return { unlocked: u, maxed: m, total };
  },
};
