// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de inimigos foi removido. getCurrentMap devolve o mapa real (constantes)
// para o shape ficar correto; subareaLevelRange devolve uma faixa de amostra.

import { MAPS } from '../data/constants.js';

export const getCurrentMap = (state) => MAPS[((state && state.map) || 1) - 1] || MAPS[0];

export const subareaLevelRange = (_map, subarea) => ({
  lo: (subarea || 1) * 100,
  hi: ((subarea || 1) + 1) * 100,
});
