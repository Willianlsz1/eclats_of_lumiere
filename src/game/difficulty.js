// Dificuldades — §8 (Camada 7, Passo 5). Re-roda mapas com HP/dano ×mult e
// recompensa (materiais/Éclats) ×rewardMult. Sistema abre na A2; gate dos modos
// = PODER (você morre se fraco) + bloqueio de OVERFLOW (≤ 1e100). Nightmare/Tormento
// = break_infinity → visíveis mas sempre bloqueados (não implementa a lib agora).

import { DIFFICULTIES, NUMBER_CAP, COMBAT } from '../data/constants.js';
import { getCurrentMap, hpForLevel, subareaLevelRange } from './enemies.js';

export const currentDifficulty = (state) => DIFFICULTIES[state.difficulty] || DIFFICULTIES[0];

// HP do boss mais fundo do mapa atual (proxy de overflow) × hpMult ≤ 1e100 ?
function noOverflow(state, hpMult) {
  const map = getCurrentMap(state);
  const deepBossHp = hpForLevel(map, subareaLevelRange(map, map.subareaCount).hi) * COMBAT.bossHpMult;
  return deepBossHp * hpMult <= NUMBER_CAP;
}

// Uma dificuldade está DISPONÍVEL p/ o conteúdo atual?
export function difficultyAvailable(state, idx) {
  const d = DIFFICULTIES[idx];
  if (!d) return false;
  if (idx === 0) return true;                         // Normal sempre
  if (d.breakInf) return false;                       // Nightmare/Tormento: visível mas bloqueado (break_infinity)
  if (state.ascensions < d.minAscension) return false; // sistema abre na A2
  return noOverflow(state, d.hpMult);                 // não pode estourar 1e100
}

// Dificuldade EFETIVA (clamp p/ Normal se a selecionada não está disponível no conteúdo atual)
export function effectiveDifficulty(state) {
  return difficultyAvailable(state, state.difficulty) ? currentDifficulty(state) : DIFFICULTIES[0];
}

// Tenta selecionar uma dificuldade (respeita disponibilidade). Retorna true se aplicou.
export function setDifficulty(state, idx) {
  if (!difficultyAvailable(state, idx)) return false;
  state.difficulty = idx;
  return true;
}
