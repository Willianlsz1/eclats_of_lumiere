import { describe, it, expect } from 'vitest';
import {
  xpToNext,
  xpForLevel,
  levelFromXp,
  playerDano,
  playerHpMax,
  playerAPS,
  dps,
} from './player.js';
import { PLAYER, UPGRADES } from '../data/constants.js';

describe('curva de nível', () => {
  it('nível 1 começa em 0 XP acumulado', () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it('xpForLevel é a soma cumulativa de xpToNext', () => {
    expect(xpForLevel(3)).toBe(xpToNext(1) + xpToNext(2));
  });
  it('levelFromXp é o inverso de xpForLevel', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(10))).toBe(10);
    expect(levelFromXp(xpForLevel(10) - 1)).toBe(9);
  });
  it('XP cresce a cada nível (geométrico)', () => {
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1));
  });
});

describe('stats derivados', () => {
  const base = { xpTotal: 0, upgrades: { dano: 0, vida: 0 } };
  it('no lv 1 sem upgrades = base', () => {
    expect(playerDano(base)).toBe(PLAYER.baseDano);
    expect(playerHpMax(base)).toBe(PLAYER.baseHp);
    expect(playerAPS(base)).toBe(PLAYER.baseAPS);
  });
  it('upgrades de dano somam perLevel', () => {
    expect(playerDano({ ...base, upgrades: { dano: 3, vida: 0 } })).toBe(
      PLAYER.baseDano + 3 * UPGRADES.dano.perLevel
    );
  });
  it('upgrades de vida somam perLevel', () => {
    expect(playerHpMax({ ...base, upgrades: { dano: 0, vida: 2 } })).toBe(
      PLAYER.baseHp + 2 * UPGRADES.vida.perLevel
    );
  });
  it('nível soma a base por nível', () => {
    const atLv10 = { xpTotal: xpForLevel(10), upgrades: { dano: 0, vida: 0 } };
    expect(playerDano(atLv10)).toBe(PLAYER.baseDano + 9 * PLAYER.danoPerLevel);
  });
  it('dps = dano × aps', () => {
    expect(dps(base)).toBe(playerDano(base) * playerAPS(base));
  });
});

describe('âncora Dano÷HP', () => {
  it('a razão Dano÷HP base é constante entre níveis (Nível cancela)', () => {
    const lv1 = { xpTotal: 0, upgrades: { dano: 0, vida: 0 } };
    const lv40 = { xpTotal: xpForLevel(40), upgrades: { dano: 0, vida: 0 } };
    const r1 = playerDano(lv1) / playerHpMax(lv1);
    const r40 = playerDano(lv40) / playerHpMax(lv40);
    expect(r40).toBeCloseTo(r1, 10);
  });
});
