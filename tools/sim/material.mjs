// Camada 4 — CRAFT/MATERIAIS (REVISTO 2026-06-11 c/ feedback do Willian).
// Pontos: (1) raridade NÃO depende de dificuldade — tudo no Normal; (2) Converged
// abre no Map 4 (antes do Map 5); (3) material = % de drop do MOB (~1%).
// Uso: node tools/sim/material.mjs

const PIECES = 6;

// Mob solta material do TIER DO MAPA atual, por CHANCE % (Willian: ~0.8-1%).
// Map 1→T1 ... Map 4→T4 (Map 5 = T4/future). Isso pacing-a "1 raridade por mapa"
// SEM precisar de boss nem dificuldade: você sobe a raridade do mapa só farmando.
const dropChance = 0.01;          // 1% por mob
const bossBonus  = 30;            // Guardião/boss final: chunk garantido (acelera, não gate)

// custo p/ subir 1 PEÇA um tier (mesmo p/ todos — o gate real é o tier estar no mapa)
const upgradePerPiece = 40;       // → 240 p/ as 6 peças por tier

const refino = 12;
const diffMult = { Normal: 1, Difícil: 3, Nightmare: 10, Tormento: 30 };

// referências de kills/hora
const KR = { 'seu ref (180k/h)': 180000, 'piso 15 APS (54k/h)': 54000 };

const totalPerTier = PIECES * upgradePerPiece;   // 240
const killsNeeded = totalPerTier / dropChance;   // 24.000 mobs

console.log(`Drop: ${dropChance*100}% por mob (tier = tier do MAPA). Boss bônus: +${bossBonus} garantido.`);
console.log(`Custo p/ subir TODAS as 6 peças 1 tier: ${totalPerTier} materiais.`);
console.log(`→ ${killsNeeded.toLocaleString('en')} mob kills (sem contar bônus de boss).\n`);

console.log('TEMPO p/ subir a raridade do mapa (todas as 6 peças), por ritmo de kill:');
for (const [name, perHour] of Object.entries(KR)) {
  const min = (killsNeeded / perHour) * 60;
  console.log(`  ${name.padEnd(22)} → ${min.toFixed(0)} min de farm`);
}

console.log('\nPACING por mapa (raridade alvo de cada mapa, no Normal):');
const plan = [['Map 1','Kindled (T1)'],['Map 2','Luminous (T2) — motor × liga'],
  ['Map 3','Radiant (T3)'],['Map 4','Converged (T4) — ÚLTIMO TIER, antes do Map 5'],['Map 5','já Converged + nível/Ascension']];
for (const [m, r] of plan) console.log(`  ${m}: ${r}`);

console.log(`\nRefino: ${refino}:1 entre tiers (usa excedente). Dificuldade só MULTIPLICA o yield (opcional):`);
for (const [k, v] of Object.entries(diffMult)) console.log(`  ${k.padEnd(9)} ×${v}  (acelera; NUNCA requisito p/ raridade)`);
