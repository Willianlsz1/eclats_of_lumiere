import { describe, it, expect } from 'vitest';
import { createInitialState } from '../core/state.js';
import { combatTick } from './combat.js';
import { playerHpMax } from './player.js';

function fresh() {
  const s = createInitialState();
  s.player.hp = playerHpMax(s);
  return s;
}

describe('combatTick — loop básico', () => {
  it('spawna um mob no primeiro tick', () => {
    const s = fresh();
    combatTick(s, 0.1);
    expect(s.enemy).not.toBeNull();
  });
  it('matar o mob dá gold e xp e limpa o inimigo', () => {
    const s = fresh();
    s.upgrades.dano = 1000; // muito dano: mata num golpe
    combatTick(s, 1); // 1s: pelo menos 1 ataque
    expect(s.gold).toBeGreaterThan(0);
    expect(s.xpTotal).toBeGreaterThan(0);
    expect(s.killsTotal).toBeGreaterThanOrEqual(1);
  });
});

describe('combatTick — sobrevivência e gate', () => {
  it('HP zera → morre e agenda respawn, depois volta cheio', () => {
    const s = fresh();
    s.player.hp = 1;
    s.enemy = { hpMax: 1e9, hp: 1e9, dmg: 1e6, level: 1, rarity: 'common', name: 'x', art: 'x' };
    combatTick(s, 0.1); // toma dano fatal
    expect(s.player.dead).toBe(true);
    combatTick(s, 5); // passa o respawnTimer
    expect(s.player.dead).toBe(false);
    expect(s.player.hp).toBe(playerHpMax(s));
  });
  it('alcançar o cap da área destrava a próxima', () => {
    const s = fresh();
    s.xpTotal = 1e12; // bem acima do cap (lv 60)
    s.upgrades.dano = 1e6;
    combatTick(s, 1); // mata e roda o gate
    expect(s.unlockedArea).toBe(2);
  });
});
