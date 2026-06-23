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
  STATES: { NOT_FOUND: "notFound", FOUND: "found" },

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
      premierMatin: { state: "notFound" },
      desRires: { state: "notFound" },
      deLaMarche: { state: "notFound" },
    };
  },

  // garante o campo em saves antigos; preenche faltantes; sanea estados inválidos.
  // nunca apaga um "found" já existente.
  reconcile(data) {
    if (!data.memoires || typeof data.memoires !== "object") data.memoires = {};
    for (const id of this.all()) {
      const cur = data.memoires[id];
      const st = cur && cur.state === "found" ? "found" : "notFound";
      data.memoires[id] = { state: st };
    }
    return data.memoires;
  },

  // ---- leitura ----
  get(id) {
    const m = G.state.data && G.state.data.memoires && G.state.data.memoires[id];
    const st = m && m.state === "found" ? "found" : "notFound"; // nunca estado inválido
    return { id, state: st, name: (this.defs[id] && this.defs[id].name) || id };
  },
  isFound(id) { return this.get(id).state === "found"; },
  remaining() { return this.all().filter((id) => !this.isFound(id)); },

  // ---- descoberta ----
  // muda notFound -> found. Idempotente: já encontrada devolve false (não duplica).
  find(id) {
    if (!this.defs[id]) return false;
    const set = G.state.data.memoires || (G.state.data.memoires = this.freshSet());
    if (!set[id]) set[id] = { state: "notFound" };
    if (set[id].state === "found") return false;
    set[id].state = "found";
    if (G.ui && G.ui.renderMemoires) G.ui.renderMemoires();
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
