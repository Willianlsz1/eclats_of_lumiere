// Camada 5 — PASSIVAS. Calibra por ESQUEMA (não 45 números soltos): a maioria é
// % aditivo capado; poucas late são o motor multiplicativo que entrega as décadas.
// Orçamento: árvore Éclat ~8 décadas de dano (Fracture ~8 de HP; Vestige = economia).
// Uso: node tools/sim/passives.mjs

const maxLevel = 12;                  // teto de nível de TODA passiva (gate grupo→grupo funciona)
const groupMult = [1, 10, 100];      // custo em Vestiges por grupo (mantido)

// % aditivo por nível, por grupo (a maioria das passivas)
const addPct = [0.05, 0.10, 0.20];   // g1 5% · g2 10% · g3 20% por nível
const addPassivesPerGroup = [5, 4, 2]; // qtd de passivas "% aditivo" por grupo (resto = motor/funcional)

// MOTOR multiplicativo: 3 passivas late (grupo 3) — game-changers (Fractured Soul, etc.)
const enginePassives = 3;
const engineMultPerLevel = 1.52;     // ×1.52/nível, capado em maxLevel

// passive_dano = (1 + Σ% aditivo) × Π motor
let addSum = 0;
for (let g = 0; g < 3; g++) addSum += addPassivesPerGroup[g] * addPct[g] * maxLevel;
const additive = 1 + addSum;
const engine = (engineMultPerLevel ** maxLevel) ** enginePassives;
const passiveDano = additive * engine;

const dec = (x) => Math.log10(x).toFixed(2);
console.log('ÁRVORE ÉCLAT (dano) — calibração por esquema:\n');
console.log(`  parte ADITIVA (maioria):  ×${additive.toFixed(0)}  (${dec(additive)} déc)`);
console.log(`  MOTOR (3 late ×${engineMultPerLevel}/nv, max ${maxLevel}): ×${engine.toExponential(2)}  (${dec(engine)} déc)`);
console.log(`  → passive_dano total: ×${passiveDano.toExponential(2)}  = ${dec(passiveDano)} décadas  (alvo ~8)\n`);

console.log('ALAVANCAS FUNCIONAIS (targets, não décadas de dano):');
console.log('  Fracture Pulse (APS): leva o APS de ~1.5 (AGI) a ~10; o gear (Resonance) fecha p/ 15.');
console.log('  Luminal Edge (crit chance): + a fração que falta p/ 100% (com Grasp/gear); transbordo→dmg.');
console.log('  Void Awareness (cap de mobs): + base [2,4,6,9,12] rumo ao teto ~24.');
console.log('  Void Piercing / Weakened Void: penetra/reduz a defesa de inimigos (§4).');
console.log('  Vestige Pull (materiais): × na taxa de drop de material (§13B).');
console.log('\nGATE: maximizar os 5 de um grupo (no maxLevel) libera o próximo. groupMult custo =', JSON.stringify(groupMult));
console.log('HP (árvore Fracture) e economia (Vestige) seguem o MESMO esquema nos seus temas.');
