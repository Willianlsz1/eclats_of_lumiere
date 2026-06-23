// =============================================================
// memoires.js — DESCOBERTA das Mémoires (CP-2B) — Era I apenas
// =============================================================
// Conforme MEMOIRES_V1. Esta camada implementa SOMENTE a descoberta:
// estados notFound/found, find/remaining, tabela de descoberta e o roll.
// NÃO há Éclats como custo, restauração, níveis, efeitos, Era Restaurada nem
// Ascension — isso vem em CPs seguintes.
//
// O estado usa `state` (string), não `found:true/false`, p/ evitar migração
// quando os estados "restored"/níveis entrarem no CP-2C.

G.memoires = {
  STATES: { NOT_FOUND: "notFound", FOUND: "found", RESTORED: "restored" },
  RESTORE_COST: 1, // custo em Éclats p/ restaurar (Lv1) — PLACEHOLDER único (CP-2C)

  // metadados mínimos da Era I (nome de exibição). SEM efeitos/lore/níveis.
  defs: {
    premierMatin: { id: "premierMatin", name: "du Premier Matin", era: 1 },
    desRires:     { id: "desRires",     name: "des Rires",        era: 1 },
    deLaMarche:   { id: "deLaMarche",   name: "de la Marche",     era: 1 },
  },

  // ids da Era I, em ordem canônica
  all() { return ["premierMatin", "desRires", "deLaMarche"]; },

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
      lv = st === "restored" ? Math.max(1, lv) : 0;
      data.memoires[id] = { state: st, level: lv };
    }
    return data.memoires;
  },

  // ---- leitura ----
  get(id) {
    const m = G.state.data && G.state.data.memoires && G.state.data.memoires[id];
    let st = (m && (m.state === "found" || m.state === "restored")) ? m.state : "notFound";
    let lv = (m && typeof m.level === "number" && isFinite(m.level)) ? Math.floor(m.level) : 0;
    lv = st === "restored" ? Math.max(1, lv) : 0; // nunca estado/nível inválido
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
    set[id].level = 1;                                 // CP-2C: nível máximo = 1
    if (G.ui && G.ui.renderMemoires) G.ui.renderMemoires();
    if (G.ui && G.ui.renderResources) G.ui.renderResources();
    return true;
  },

  // ---- tabela de descoberta (Era I) — chances PLACEHOLDER ----
  // estrutura configurável; nenhum número é final (balanceamento na Fase 3).
  discoveryTable: {
    premierMatin: { chance: 0 }, // [PLACEHOLDER]
    desRires:     { chance: 0 }, // [PLACEHOLDER]
    deLaMarche:   { chance: 0 }, // [PLACEHOLDER]
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
