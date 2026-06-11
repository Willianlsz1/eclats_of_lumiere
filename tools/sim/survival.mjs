// Camada 2 — Sobrevivência. Simula uma ONDA tick-a-tick (igual ao combatTick)
// com jogador parametrizado, p/ escolher a razão dano/HP CONSTANTE e a curva
// de Defesa. Uso: `node tools/sim/survival.mjs`.
//
// Modelo do jogador é power-independent: descrito por
//   k  = damagePerHit / mobHp   (k≥1 = one-shot; k<1 = precisa de 1/k hits)
//   hp = 5.4 × damagePerHit     (HP rastreia o dano: hp_max/dano = (50/7)×(vit/str)≈5.4)
//   def = defMult × packDps     (defMult=0 sem Veil; 1 = def≈packDps = 50% mit)

import { COMBAT } from '../../src/data/constants.js';

const APS = 15;                 // Camada 1
const PACK = [2, 4, 6, 9, 12];  // Camada 1
const RATIO = 0.02;             // razão dano/HP CONSTANTE candidata

// Simula uma onda. Retorna {survived, clearTime, minHpFrac}.
function simWave({ mobHp, packSize, k, hpMax, def }) {
  const dt = 0.1;
  const damagePerHit = k * mobHp;
  const mobDmg = RATIO * mobHp;
  let mobs = Array.from({ length: packSize }, () => mobHp);
  let hp = hpMax, t = 0, minHp = hpMax, attackAcc = 0;
  const interval = 1 / APS;
  while (t < 600) {
    // ataques do jogador (1 alvo: menor HP vivo; máx 1 kill/ataque)
    attackAcc += dt;
    while (attackAcc >= interval) {
      attackAcc -= interval;
      let ti = -1, lo = Infinity;
      for (let i = 0; i < mobs.length; i++) if (mobs[i] > 0 && mobs[i] < lo) { lo = mobs[i]; ti = i; }
      if (ti < 0) break;
      mobs[ti] -= damagePerHit;
      if (mobs[ti] <= 0) hp = Math.min(hpMax, hp + hpMax * COMBAT.regenOnKill); // regen on-kill
    }
    if (mobs.every((m) => m <= 0)) return { survived: true, clearTime: t, minHpFrac: minHp / hpMax };
    // dano do pack (vivos) com mitigação por razão/armadura
    const packDps = mobs.reduce((s, m) => s + (m > 0 ? mobDmg : 0), 0);
    const taken = (packDps * packDps) / (def + packDps); // = packDps×(1−def/(def+packDps))
    hp -= taken * dt;
    hp = Math.min(hpMax, hp + hpMax * COMBAT.regenPerSec * dt); // regen/s
    minHp = Math.min(minHp, hp);
    if (hp <= 0) return { survived: false, clearTime: t, minHpFrac: 0 };
    t += dt;
  }
  return { survived: false, clearTime: t, minHpFrac: minHp / hpMax };
}

const mobHp = 1e6; // escala arbitrária (resultado é power-independent, só razões importam)
console.log(`Razão dano/HP CONSTANTE = ${RATIO}.  APS=${APS}.  (mobHp de referência = ${mobHp})\n`);

for (const packSize of [2, 12]) {
  console.log(`--- pack ${packSize} (${packSize === 2 ? 'sub1' : 'sub5'}) ---`);
  for (const k of [1, 0.3, 0.1, 0.03, 0.01]) {
    const hpMax = 5.4 * k * mobHp;
    const packDps = packSize * RATIO * mobHp;
    for (const defMult of [0, 1, 4]) {
      const def = defMult * packDps;
      const r = simWave({ mobHp, packSize, k, hpMax, def });
      const tag = r.survived ? `OK  limpa em ${r.clearTime.toFixed(1)}s, HP mín ${(r.minHpFrac*100).toFixed(0)}%`
                             : `MORRE em ${r.clearTime.toFixed(1)}s`;
      console.log(`  k=${String(k).padEnd(5)} def=${defMult}×packDps : ${tag}`);
    }
  }
  console.log('');
}
