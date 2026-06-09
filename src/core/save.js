// Persistência em localStorage com versão de schema.
// Autosave a cada 10s e no beforeunload.

import { SAVE_KEY, SCHEMA_VERSION, AUTOSAVE_MS } from '../data/constants.js';
import { toSnapshot, applySnapshot } from './state.js';

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSnapshot()));
  } catch (e) {
    // localStorage cheio ou indisponível — não derruba o jogo
    console.warn('Falha ao salvar:', e);
  }
}

// Retorna true se um save válido foi carregado.
export function load() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    console.warn('Save corrompido — começando do zero.');
    return false;
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    // Migrações entram aqui quando o schema evoluir; por ora, descarta.
    console.warn(`Schema ${snapshot.schemaVersion} ≠ ${SCHEMA_VERSION} — save descartado.`);
    return false;
  }
  applySnapshot(snapshot);
  return true;
}

export function setupAutosave() {
  setInterval(save, AUTOSAVE_MS);
  window.addEventListener('beforeunload', save);
}
