// =============================================================
// passives.js — Árvore-Mundo (3 árvores × 15 nós) — recuperada do jogo antigo
// =============================================================
// Éclat (dano) · Vestige (economia) · Fracture (HP). 3 grupos de 5 por árvore;
// maximizar um grupo libera o próximo. 3 MOTORES por árvore (×1.52/nível) +
// ALAVANCAS (efeitos especiais: crit, atk speed, materiais). Moeda = Pontos de
// Convergence. Liberada na 1ª Convergence. Custos/efeitos = do design antigo.

G.passives = {
  TREES: ["eclat", "vestige", "fracture"],
  GROUP_SIZE: 5,
  maxLevel: 12,
  unlockLadder: [100, 500, 2500, 12500, 62500],
  groupMult: [1, 10, 100],
  evoFactor: 0.3, evoRamp: 1.3,
  groupAddPct: [0.05, 0.1, 0.2],
  engineMult: 1.52,
  engines: {
    eclat: ["e_luminal_explosion", "e_oreinsof_touch", "e_shattered_light"],
    vestige: ["v_eternal_vestige", "v_fractured_soul", "v_collector"],
    fracture: ["f_void_collapse", "f_claimed_domination", "f_void_endurance"],
  },
  levers: {
    e_luminal_edge: "crit", e_void_piercing: "enemyPen",
    f_fracture_pulse: "aps", f_void_awareness: "mobCap", f_weakened_void: "enemyReduce",
    v_vestige_pull: "material",
  },
  lever: { critPerLevel: 0.04, apsPerLevel: 0.46, mobPerLevel: 0.5, materialPerLevel: 0.75, penPerLevel: 0.04, reducePerLevel: 0.04 },
  // árvore: label, sub, classe de cor, lista [nome, chave-de-arte]
  trees: {
    eclat: { label: "Éclat", sub: "Combat · damage", cls: "t-eclat", stat: "damage", list: [
      ["Radiant Strike", "e_radiant_strike"], ["Luminal Edge", "e_luminal_edge"], ["Éclat Surge", "e_eclat_surge"], ["Refraction", "e_refraction"], ["Crit Cascade", "e_crit_cascade"],
      ["Shard Burst", "e_shard_burst"], ["Resonant Force", "e_resonant_force"], ["Momentum", "e_momentum"], ["Fracture Weakness", "e_fracture_weakness"], ["Execute", "e_execute"],
      ["Overkill", "e_overkill"], ["Luminal Explosion", "e_luminal_explosion"], ["Or Ein Sof's Touch", "e_oreinsof_touch"], ["Shattered Light", "e_shattered_light"], ["Void Piercing", "e_void_piercing"],
    ] },
    vestige: { label: "Vestige", sub: "Economy · gains", cls: "t-vest", stat: "gains (Lumens & XP)", list: [
      ["Lumen's Blessing", "v_lumens_blessing"], ["Wisdom of Ruins", "v_wisdom_ruins"], ["Remnant Harvest", "v_remnant_harvest"], ["Scavenger", "v_scavenger"], ["Echo of Greed", "v_echo_greed"],
      ["Awakened Harvest", "v_awakened_harvest"], ["Hoarder", "v_hoarder"], ["Dreamwalker", "v_dreamwalker"], ["Beast Caller", "v_beast_caller"], ["Vestige Pull", "v_vestige_pull"],
      ["Void Scavenger", "v_void_scavenger"], ["Eternal Vestige", "v_eternal_vestige"], ["Fractured Soul", "v_fractured_soul"], ["Luminal Cache", "v_luminal_cache"], ["The Collector", "v_collector"],
    ] },
    fracture: { label: "Fracture", sub: "Utility · HP", cls: "t-frac", stat: "HP", list: [
      ["Fracture Pulse", "f_fracture_pulse"], ["Void Haste", "f_void_haste"], ["Fracture Sense", "f_fracture_sense"], ["Void Awareness", "f_void_awareness"], ["Last Light", "f_last_light"],
      ["Weakened Void", "f_weakened_void"], ["Shard Disruption", "f_shard_disruption"], ["Nihel's Shadow", "f_nihels_shadow"], ["Éclat Attunement", "f_eclat_attunement"], ["The Fracture's Gift", "f_fractures_gift"],
      ["Void Collapse", "f_void_collapse"], ["La Fracture's Echo", "f_fractures_echo"], ["Claimed Domination", "f_claimed_domination"], ["Nil's Embrace", "f_nils_embrace"], ["Void Endurance", "f_void_endurance"],
    ] },
  },
  // posição de cada nó (%x,%y) sobre a Árvore-Mundo: G1 base → G2 meio → G3 copa
  POSITIONS: [
    { x: 31, y: 70 }, { x: 41, y: 65 }, { x: 50, y: 63 }, { x: 61, y: 63 }, { x: 73, y: 66 },
    { x: 25, y: 48 }, { x: 37, y: 42 }, { x: 50, y: 39 }, { x: 66, y: 39 }, { x: 79, y: 44 },
    { x: 35, y: 26 }, { x: 43, y: 20 }, { x: 50, y: 16 }, { x: 59, y: 18 }, { x: 69, y: 23 },
  ],

  // ---- estado / custos / gating ----
  freshSet() { return { eclat: Array(15).fill(0), vestige: Array(15).fill(0), fracture: Array(15).fill(0) }; },
  groupOf(i) { return Math.floor(i / this.GROUP_SIZE); },
  posOf(i) { return i % this.GROUP_SIZE; },
  unlocked() { return (G.state.data.convergences || 0) >= 1; },
  level(tree, i) { const p = G.state.data.passives; return (p && p[tree] && p[tree][i]) || 0; },
  unlockCost(i) { return this.unlockLadder[this.posOf(i)] * this.groupMult[this.groupOf(i)]; },
  nextCost(tree, i) {
    const lv = this.level(tree, i);
    if (lv === 0) return this.unlockCost(i);
    return Math.ceil(this.unlockCost(i) * this.evoFactor * Math.pow(this.evoRamp, lv - 1));
  },
  isMax(tree, i) { return this.level(tree, i) >= this.maxLevel; },
  groupUnlocked(tree, g) {
    if (g === 0) return true;
    const arr = G.state.data.passives[tree];
    for (let p = 0; p < this.GROUP_SIZE; p++) if (arr[(g - 1) * this.GROUP_SIZE + p] < this.maxLevel) return false;
    return true;
  },
  canBuy(tree, i) {
    return this.unlocked() && !this.isMax(tree, i) && this.groupUnlocked(tree, this.groupOf(i)) &&
      (G.state.data.convergencePoints || 0) >= this.nextCost(tree, i);
  },
  buy(tree, i) {
    if (!this.canBuy(tree, i)) return false;
    G.state.data.convergencePoints -= this.nextCost(tree, i);
    G.state.data.passives[tree][i] += 1;
    G.state.save();
    return true;
  },

  // ---- efeitos ----
  isEngine(tree, art) { return this.engines[tree].indexOf(art) !== -1; },
  leverOf(art) { return this.levers[art]; },
  // multiplicador primário de uma árvore (default % aditivo × motores compostos)
  treeMult(tree) {
    const arr = G.state.data.passives[tree];
    let add = 0, eng = 1;
    this.trees[tree].list.forEach((entry, i) => {
      const art = entry[1], lv = arr[i];
      if (!lv || this.levers[art]) return;
      if (this.isEngine(tree, art)) eng *= Math.pow(this.engineMult, lv);
      else add += this.groupAddPct[this.groupOf(i)] * lv;
    });
    return (1 + add) * eng;
  },
  dmgMult() { return this.treeMult("eclat"); },
  hpMult() { return this.treeMult("fracture"); },
  ecoMult() { return this.treeMult("vestige"); },
  leverLevel(art) {
    for (const t of this.TREES) { const idx = this.trees[t].list.findIndex((e) => e[1] === art); if (idx >= 0) return G.state.data.passives[t][idx]; }
    return 0;
  },
  critAddPts() { return this.leverLevel("e_luminal_edge") * this.lever.critPerLevel * 100; },
  apsMult() { return 1 + this.leverLevel("f_fracture_pulse") * this.lever.apsPerLevel; },
  materialsMult() { return 1 + Math.log10(1 + this.leverLevel("v_vestige_pull") * this.lever.materialPerLevel); },

  treeProgress(tree) {
    const arr = G.state.data.passives[tree];
    let u = 0, m = 0;
    for (const lv of arr) { if (lv > 0) u++; if (lv >= this.maxLevel) m++; }
    return { unlocked: u, maxed: m, total: arr.length };
  },
};
