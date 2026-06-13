// Persistência em localStorage com versão de schema.
// Autosave a cada 10s e no beforeunload.

import { SAVE_KEY, SCHEMA_VERSION, AUTOSAVE_MS } from '../data/constants.js';
import { toSnapshot, applySnapshot } from './state.js';

export function save() {
  try {
    // savedAt marca o momento do save — base do progresso offline (§15)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...toSnapshot(), savedAt: Date.now() }));
  } catch (e) {
    // localStorage cheio ou indisponível — não derruba o jogo
    console.warn('Falha ao salvar:', e);
  }
}

// Retorna o snapshot carregado (já aplicado ao estado) ou null.
export function load() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    console.warn('Save corrompido — começando do zero.');
    return null;
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    // Migrações entram aqui quando o schema evoluir; por ora, descarta.
    console.warn(`Schema ${snapshot.schemaVersion} ≠ ${SCHEMA_VERSION} — save descartado.`);
    return null;
  }
  applySnapshot(snapshot);
  return snapshot;
}

export function setupAutosave() {
  setInterval(save, AUTOSAVE_MS);
  window.addEventListener('beforeunload', save);
}

// Apaga o save e recomeça do zero. Remove o listener de beforeunload pra o
// autosave NÃO regravar o estado antigo antes do reload.
export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* indisponível */ }
  window.removeEventListener('beforeunload', save);
  window.location.reload();
}
