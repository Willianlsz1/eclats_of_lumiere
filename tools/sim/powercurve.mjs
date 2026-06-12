// Curva de poder vs necessidade nos 10 checkpoints (entrada + sub5 de cada mapa).
// Modela o investimento de Mémoire APROPRIADO p/ a profundidade (Clarté ≈ 0.74×h, Camada 6)
// e mede o OVERSHOOT estrutural = quanto os efeitos INDIVIDUAIS (#1 du Premier Matin + #10 de
// la Blessure) empurram o dano ACIMA do necessário. Gap deve ser pequeno e CONSTANTE.
// Uso: node tools/sim/powercurve.mjs
import { createInitialState } from '../../src/core/state.js';
import { MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';
import { memoireDmgMult, clarte } from '../../src/game/memoires.js';
import { levelBonus as lvlBonus } from '../../src/game/stats.js';

const d = (x) => Math.log10(x);
const MEMOIRE_SHARE = 0.74;
const CLARTE_LOG = Math.log10(1.07);

// nível de Mémoire (por relíquia) apropriado p/ one-shotar HP=H: Clarté ≈ 0.74×log10(H)
const memLevelFor = (h) => Math.round((MEMOIRE_SHARE * h / CLARTE_LOG) / 15);

function memOvershoot(h) {
  const L = memLevelFor(h);
  const s = createInitialState();
  s.memoires = s.memoires.map(() => L);
  const indiv = d(memoireDmgMult(s)) - d(clarte(s)); // #1 + #10 acima da Clarté
  return { L, indiv };
}

// xpTotal típico ao farmar HP=H (xp/kill ∝ mob_hp): ~H acumulado → level_bonus
const levelBonusAt = (h) => d(lvlBonus(10 ** h));

console.log('checkpoint           |  h (log10 HP) | Mém L | gap Mém #1+#10 | gap level_bonus');
console.log('-'.repeat(78));
const rows = [];
for (const m of MAPS) {
  for (const [tag, sub] of [['entrada(sub1)', 1], ['sub5', m.subareaCount]]) {
    const r = subareaLevelRange(m, sub);
    const hp = hpForLevel(m, Math.sqrt(r.lo * r.hi));
    const h = d(hp);
    const { L, indiv } = memOvershoot(h);
    const lb = levelBonusAt(h);
    rows.push({ map: m.id, tag, h, L, indiv, lb });
    console.log(`Map${m.id} ${tag.padEnd(14)} | ${h.toFixed(1).padStart(11)} | ${String(L).padStart(5)} | ${indiv.toFixed(2).padStart(11)}    | ${lb.toFixed(2).padStart(11)}`);
  }
}
const first = rows[0], last = rows[rows.length - 1];
console.log('-'.repeat(78));
console.log(`\nGap Mémoire (#1+#10): ${first.indiv.toFixed(1)} déc (Map1) → ${last.indiv.toFixed(1)} déc (Map5) — ABRE ${(last.indiv - first.indiv).toFixed(1)} déc na jornada`);
console.log(`Gap level_bonus:      ${first.lb.toFixed(1)} déc (Map1) → ${last.lb.toFixed(1)} déc (Map5) — quase constante (offset)`);
console.log(`\nVEREDITO: gap total abre ${((last.indiv+last.lb)-(first.indiv+first.lb)).toFixed(0)} déc do Map1 ao Map5.`);
console.log(`(quebrado se >20; "paredes constantes" se pequeno e estável)`);
