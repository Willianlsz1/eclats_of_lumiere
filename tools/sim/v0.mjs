// Simulador da subida v0 (lv1→60). Roda: node tools/sim/v0.mjs
// Importa as fórmulas REAIS de src/ — é o "juiz" do balanceamento (recomeço §2).
// Reporta, por faixa de nível: tempo (min), gold acumulado, tempo-de-kill (s),
// razão Dano÷HP e décadas (log10) de cada fonte de poder.
import { createInitialState } from '../../src/core/state.js';
import { combatTick } from '../../src/game/combat.js';
import { playerHpMax, playerDano, playerAPS, levelFromXp } from '../../src/game/player.js';
import { upgradeCost, buyUpgrade } from '../../src/game/economy.js';
import { AREAS, PLAYER } from '../../src/data/constants.js';

const DT = 0.1;
const s = createInitialState();
s.player.hp = playerHpMax(s);

let t = 0;
let deaths = 0;
let lastDead = false;
const cap = AREAS[0].lvlCap;
const samples = [];
let nextSample = 10;

while (levelFromXp(s.xpTotal) < cap && t < 60 * 60 * 24) {
  combatTick(s, DT);
  t += DT;
  if (s.player.dead && !lastDead) deaths++;
  lastDead = s.player.dead;

  // Política de compra simples: mantém uma folga de sobrevivência, senão investe em dano.
  const ttk = (playerHpMax(s) * 1.3) / (playerDano(s) * playerAPS(s));
  const wantVida = ttk < 1.2; // mata rápido demais → encorpa
  for (let i = 0; i < 100; i++) {
    const kind = wantVida ? 'vida' : 'dano';
    if (s.gold >= upgradeCost(kind, s.upgrades[kind])) buyUpgrade(s, kind);
    else break;
  }

  const lvl = levelFromXp(s.xpTotal);
  if (lvl >= nextSample) {
    const dano = playerDano(s);
    const hp = playerHpMax(s);
    samples.push({
      lvl,
      min: +(t / 60).toFixed(1),
      gold: Math.round(s.gold),
      'kill(s)': +ttk.toFixed(2),
      'Dano/HP': +(dano / hp).toFixed(3),
      'déc dano': +Math.log10(dano).toFixed(2),
      'déc upg': +Math.log10(1 + s.upgrades.dano * 4 + s.upgrades.vida * 40).toFixed(2),
    });
    nextSample += 10;
  }
}

const reached = levelFromXp(s.xpTotal);
console.log(
  `\nÉclats v0 — subida Área 1 (lv1→${cap})\n` +
    `Chegou ao lv ${reached} em ${(t / 60).toFixed(1)} min · ${deaths} mortes · ${s.killsTotal} kills\n` +
    `regen ${(PLAYER.regenPerSec * 100).toFixed(0)}%/s · APS ${playerAPS(s)}\n`
);
console.table(samples);
