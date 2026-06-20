import { describe, it, expect } from 'vitest';
import { spawnEnemy } from './enemy.js';
import { playerHpMax, xpForLevel } from './player.js';
import { ENEMY, AREAS } from '../data/constants.js';

const mk = (over = {}) => ({ xpTotal: 0, upgrades: { dano: 0, vida: 0 }, area: 1, ...over });

describe('spawnEnemy (HP relativo)', () => {
  it('HP do mob comum = HP do player × hpMultCommon × ×área', () => {
    const s = mk();
    const e = spawnEnemy(s);
    expect(e.hpMax).toBeCloseTo(playerHpMax(s) * ENEMY.hpMultCommon * AREAS[0].hpMult, 5);
    expect(e.hp).toBe(e.hpMax);
  });
  it('comprar HP aumenta o HP do mob junto', () => {
    const fraco = spawnEnemy(mk());
    const forte = spawnEnemy(mk({ upgrades: { dano: 0, vida: 5 } }));
    expect(forte.hpMax).toBeGreaterThan(fraco.hpMax);
  });
  it('nível do mob acompanha o player, capado no cap da área', () => {
    const e = spawnEnemy(mk({ xpTotal: xpForLevel(80) }));
    expect(e.level).toBe(AREAS[0].lvlCap);
  });
  it('dano do mob cresce com o nível', () => {
    const lvl1 = spawnEnemy(mk());
    const lvl30 = spawnEnemy(mk({ xpTotal: xpForLevel(30) }));
    expect(lvl30.dmg).toBeGreaterThan(lvl1.dmg);
  });
});
