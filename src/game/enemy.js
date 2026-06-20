// Inimigo — lógica PURA. HP relativo ao player (§3.1): mob = HP player × raridade × ×área.
import { ENEMY, AREAS } from '../data/constants.js';
import { playerHpMax, levelFromXp } from './player.js';

export function spawnEnemy(state, rarity = 'common') {
  const area = AREAS[state.area - 1];
  const hpMult = rarity === 'rare' ? ENEMY.hpMultRare : ENEMY.hpMultCommon;
  const hpMax = playerHpMax(state) * hpMult * area.hpMult;
  // mob nasce no nível do player, capado no cap da área (depois fica no cap)
  const level = Math.min(levelFromXp(state.xpTotal), area.lvlCap);
  return {
    hpMax,
    hp: hpMax,
    dmg: ENEMY.dmgBase + level * ENEMY.dmgPerLevel,
    level,
    rarity,
    name: area.enemyName,
    art: area.enemyArt,
  };
}
