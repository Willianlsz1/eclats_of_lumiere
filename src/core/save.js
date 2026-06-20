// Persistência em localStorage — schema versionado + autosave (CP-1).

import { SCHEMA_VERSION } from '../data/constants.js';
import { applySnapshot, toSnapshot } from './state.js';

const KEY = 'eclats_save';

// Carrega e aplica o save (se houver). Devolve o snapshot bruto (ou null).
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    // saves de schema incompatível são ignorados (recomeça limpo) — migração é CP próprio
    if (snap.schemaVersion !== SCHEMA_VERSION) return null;
    applySnapshot(snap);
    return snap;
  } catch {
    return null;
  }
}

let resetting = false;

// Grava o estado atual.
export function save() {
  if (resetting) return; // não re-salva durante um reset (senão o beforeunload reverte)
  try {
    const snap = toSnapshot();
    snap.savedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    /* localStorage cheio/indisponível — ignora silenciosamente */
  }
}

let timer = null;
// Liga o autosave periódico + salva ao fechar a aba.
export function setupAutosave(intervalMs = 10000) {
  if (timer) clearInterval(timer);
  timer = setInterval(save, intervalMs);
  window.addEventListener('beforeunload', save);
}

// Apaga o save e recomeça do zero.
export function resetSave() {
  resetting = true;
  if (timer) clearInterval(timer);
  localStorage.removeItem(KEY);
  location.reload();
}
