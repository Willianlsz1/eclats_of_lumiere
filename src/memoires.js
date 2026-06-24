// =============================================================
// memoires.js — Mémoires (Era I) — descoberta, restauração e níveis
// =============================================================
// Conforme MEMOIRES_V1 / CANON_V2. Sistema completo da Era I:
// estados notFound→found→restored, descoberta (tabela + roll + pity por área),
// restauração e níveis (Lv1–Lv10) pagos em Éclats, e a Era Restaurada (derivada).
// Os bônus mecânicos próprios de cada Mémoire (CANON_V2 §2) ainda NÃO estão
// ligados aqui — são uma camada futura.
//
// O estado usa `state` (string: notFound/found/restored), não found:true/false.

G.memoires = {
  STATES: { NOT_FOUND: "notFound", FOUND: "found", RESTORED: "restored" },
  RESTORE_COST: 1, // custo em Éclats p/ restaurar (Lv1) — PLACEHOLDER único (CP-2C)
  MAX_LEVEL: 10,   // teto de nível das Mémoires (CP-2D) — igual p/ todas
  // custo em Éclats para subir ATÉ o nível N (CP-2D) — PLACEHOLDER único (todos 1).
  // A Fase 3 define a curva real.
  LEVEL_COSTS: { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 },

  // metadados mínimos da Era I (nome de exibição). SEM efeitos/lore/níveis.
  defs: {
    premierMatin: { id: "premierMatin", name: "du Premier Matin", era: 1 },
    desRires:     { id: "desRires",     name: "des Rires",        era: 1 },
    deLaMarche:   { id: "deLaMarche",   name: "de la Marche",     era: 1 },
  },

  // ids da Era I, em ordem canônica
  // definição CENTRALIZADA das Eras (generalizado p/ I..V; só a Era I existe hoje).
  // Evita lógica hardcoded espalhada — Eras futuras entram aqui.
  ERAS: {
    1: ["premierMatin", "desRires", "deLaMarche"],
    // 2: [...], 3: [...], 4: [...], 5: [...]  ← Mapas/Eras seguintes
  },

  // todos os ids (achatado das Eras, em ordem)
  all() {
    const out = [];
    for (const era of Object.keys(this.ERAS)) for (const id of this.ERAS[era]) out.push(id);
    return out;
  },
  eraOf(id) { return (this.defs[id] && this.defs[id].era) || null; },
  eraIds(era) { return this.ERAS[era] || []; },

  // estrutura inicial p/ fresh()/reconcile()
  freshSet() {
    return {
      premierMatin: { state: "notFound", level: 0 },
      desRires: { state: "notFound", level: 0 },
      deLaMarche: { state: "notFound", level: 0 },
    };
  },

  // garante o campo em saves antigos; preenche faltantes; sanea estados/níveis
  // inválidos. Nunca apaga uma descoberta/restauração válida. Regras de nível:
  //   notFound/found => 0 · restored => >= 1.
  reconcile(data) {
    if (!data.memoires || typeof data.memoires !== "object") data.memoires = {};
    for (const id of this.all()) {
      const cur = data.memoires[id] || {};
      let st = cur.state;
      if (st !== "found" && st !== "restored") st = "notFound"; // sanea estado inválido
      let lv = (typeof cur.level === "number" && isFinite(cur.level)) ? Math.floor(cur.level) : 0;
      // restored => clamp [1, MAX_LEVEL]; notFound/found => 0
      lv = st === "restored" ? Math.min(this.MAX_LEVEL, Math.max(1, lv)) : 0;
      data.memoires[id] = { state: st, level: lv };
    }
    return data.memoires;
  },

  // ---- leitura ----
  get(id) {
    const m = G.state.data && G.state.data.memoires && G.state.data.memoires[id];
    let st = (m && (m.state === "found" || m.state === "restored")) ? m.state : "notFound";
    let lv = (m && typeof m.level === "number" && isFinite(m.level)) ? Math.floor(m.level) : 0;
    lv = st === "restored" ? Math.min(this.MAX_LEVEL, Math.max(1, lv)) : 0; // nunca estado/nível inválido
    return { id, state: st, level: lv, name: (this.defs[id] && this.defs[id].name) || id };
  },
  level(id) { return this.get(id).level; },
  // "descoberta" = não-notFound (found OU restored) — usada por remaining/roll
  isFound(id) { return this.get(id).state !== "notFound"; },
  isRestored(id) { return this.get(id).state === "restored"; },
  remaining() { return this.all().filter((id) => !this.isFound(id)); },

  // ---- descoberta ----
  // muda notFound -> found. Idempotente: já descoberta/restaurada devolve false.
  find(id) {
    if (!this.defs[id]) return false;
    const set = G.state.data.memoires || (G.state.data.memoires = this.freshSet());
    if (!set[id]) set[id] = { state: "notFound", level: 0 };
    if (set[id].state !== "notFound") return false; // já found/restored — não duplica
    set[id].state = "found";
    set[id].level = 0;
    if (G.ui && G.ui.renderMemoires) G.ui.renderMemoires();
    return true;
  },

  // ---- restauração (CP-2C): found -> restored (Lv1), consome Éclats ----
  // pode restaurar agora? (existe, está em "found", e tem Éclats suficientes)
  canRestore(id) {
    return !!this.defs[id] && this.get(id).state === "found" &&
      (G.economy ? G.economy.getEclats() : 0) >= this.RESTORE_COST;
  },
  restore(id) {
    if (!this.canRestore(id)) return false;
    G.economy.addEclats(-this.RESTORE_COST);          // consome Éclats (clamp >=0 garantido)
    const set = G.state.data.memoires;
    set[id].state = "restored";
    set[id].level = 1;                                 // restauração entra no Lv1
    if (G.ui && G.ui.renderMemoires) G.ui.renderMemoires();
    if (G.ui && G.ui.renderResources) G.ui.renderResources();
    return true;
  },

  // ---- evolução (CP-2D): Lv1 -> Lv10, consome Éclats ----
  maxLevel() { return this.MAX_LEVEL; },
  // custo em Éclats para subir do nível atual ao próximo (LEVEL_COSTS[nível-alvo])
  upgradeCost(id) {
    const next = this.get(id).level + 1;
    return (this.LEVEL_COSTS[next] != null) ? this.LEVEL_COSTS[next] : 0;
  },
  // pode evoluir agora? (restaurada, abaixo do teto e com Éclats suficientes)
  canLevel(id) {
    if (!this.defs[id]) return false;
    const g = this.get(id);
    if (g.state !== "restored" || g.level >= this.MAX_LEVEL) return false;
    return (G.economy ? G.economy.getEclats() : 0) >= this.upgradeCost(id);
  },
  upgrade(id) {
    if (!this.canLevel(id)) return false;
    G.economy.addEclats(-this.upgradeCost(id));        // consome Éclats (clamp >=0 garantido)
    const set = G.state.data.memoires;
    set[id].level = Math.min(this.MAX_LEVEL, (set[id].level || 1) + 1); // nunca passa do teto
    if (G.ui && G.ui.renderMemoires) G.ui.renderMemoires();
    if (G.ui && G.ui.renderResources) G.ui.renderResources();
    return true;
  },

  // ---- Era Restaurada (CP-2E): estado DERIVADO (sem campo novo no save) ----
  // uma Mémoire está "completa" quando está no nível máximo (implica restaurada).
  // progresso da Era: { total, completed }.
  eraProgress(era) {
    const ids = this.eraIds(era);
    const completed = ids.filter((id) => this.get(id).level >= this.MAX_LEVEL).length;
    return { total: ids.length, completed };
  },
  // a Era está restaurada quando TODAS as suas Mémoires estão no nível máximo.
  isEraRestored(era) {
    const p = this.eraProgress(era);
    return p.total > 0 && p.completed === p.total;
  },

  // ---- tabela de descoberta (Era I) — chances PLACEHOLDER (CP-3D ligou >0) ----
  // estrutura configurável; nenhum número é final (balanceamento na Fase 3).
  discoveryTable: {
    premierMatin: { chance: 0.02 }, // [PLACEHOLDER]
    desRires:     { chance: 0.02 }, // [PLACEHOLDER]
    deLaMarche:   { chance: 0.02 }, // [PLACEHOLDER]
  },

  // proteção anti-azar (CP-3D / CONTINENT1_CANON): área (1-based) até a qual cada
  // Mémoire é GARANTIDA caso ainda não encontrada.
  PITY: { premierMatin: 8, desRires: 14, deLaMarche: 18 },
  // garante (find) as Mémoires vencidas pelo pity na área atual. Devolve os ids.
  applyPity(areaNumber) {
    const out = [];
    for (const id of this.all()) {
      const limit = this.PITY[id];
      if (limit != null && areaNumber >= limit && this.get(id).state === "notFound") {
        if (this.find(id)) out.push(id);
      }
    }
    return out;
  },

  // ---- roll de descoberta (PURO: não muta; devolve o id candidato ou null) ----
  // considera só Mémoires ainda não encontradas; o caller comita via find(id).
  // opts.rng = RNG injetável; opts.chance = sobrepõe a chance (testes/futuro).
  rollDiscovery(opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const pool = this.remaining(); // já exclui as encontradas (saem da "tabela")
    if (!pool.length) return null;
    for (const id of pool) {
      const base = (this.discoveryTable[id] && this.discoveryTable[id].chance) || 0;
      const chance = (opts.chance != null) ? opts.chance : base;
      if (chance > 0 && rng() < chance) return id;
    }
    return null;
  },
};
