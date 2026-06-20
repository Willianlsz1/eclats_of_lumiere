import { describe, it, expect } from 'vitest';
import { goldForKill, xpForKill, upgradeCost, buyUpgrade } from './economy.js';
import { ECONOMY, UPGRADES } from '../data/constants.js';

describe('recompensas por kill', () => {
  it('gold e xp são proporcionais ao HP máx do mob', () => {
    const mob = { hpMax: 1000 };
    expect(goldForKill(mob)).toBe(1000 * ECONOMY.goldPerKillRatio);
    expect(xpForKill(mob)).toBe(1000 * ECONOMY.xpPerKillRatio);
  });
});

describe('upgrades', () => {
  it('custo cresce geometricamente com o nº já comprado', () => {
    expect(upgradeCost('dano', 0)).toBe(UPGRADES.dano.costBase);
    expect(upgradeCost('dano', 1)).toBe(
      Math.round(UPGRADES.dano.costBase * UPGRADES.dano.costGrowth)
    );
    expect(upgradeCost('dano', 5)).toBeGreaterThan(upgradeCost('dano', 4));
  });
  it('buyUpgrade desconta gold e incrementa quando dá', () => {
    const s = { gold: 100, upgrades: { dano: 0, vida: 0 } };
    expect(buyUpgrade(s, 'dano')).toBe(true);
    expect(s.upgrades.dano).toBe(1);
    expect(s.gold).toBe(100 - UPGRADES.dano.costBase);
  });
  it('buyUpgrade falha sem gold suficiente (sem efeito)', () => {
    const s = { gold: 5, upgrades: { dano: 0, vida: 0 } };
    expect(buyUpgrade(s, 'dano')).toBe(false);
    expect(s.upgrades.dano).toBe(0);
    expect(s.gold).toBe(5);
  });
});
