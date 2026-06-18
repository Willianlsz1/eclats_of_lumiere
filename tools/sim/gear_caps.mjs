// Relatório dos stats do Gear nos CAPS — Comum (Faded, nível 500) e Incomum (Kindled, 1400).
// Usa as funções REAIS de src/game/gear.js. Uso: node tools/sim/gear_caps.mjs
import { GEAR, GEAR_RARITY_LABELS } from '../../src/data/constants.js';
import {
  primaryMult, secondaryMult, critOf, critDmgOf, activeSecondaries,
  gearDamageMult, gearHpMult, gearDefesaMult, gearApsFlat, gearDamageFlat, gearHpFlat,
  gearCritAdd, gearCritDmgAdd, gearLumensMult, gearXpMult,
} from '../../src/game/gear.js';

const pe = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(x < 0.01 ? 3 : 1)}%`;
const fnum = (n) => n >= 1e9 ? (n / 1e9).toFixed(2) + 'bi' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : (Math.round(n * 1000) / 1000).toString();
const TYPE_PT = { dmg: 'Dano', hp: 'HP', defesa: 'Defesa', aps: 'Atk Speed', crit: 'Crit Rate', critDmg: 'Crit Dmg', bossDmg: 'Dano em Boss', regen: 'Regen', lumens: 'Gold', xp: 'XP', materiais: 'Materiais', erosao: 'Erosão' };

// Afixos de UMA peça num dado nível/raridade (espelha a agregação do gear.js).
function pieceAffixes(def, level, rarity) {
  const rm = GEAR.rarityMult[rarity];
  const out = [];
  const hasFlat = (GEAR.flatPerLevel[def.primary] || 0) > 0;
  // PRIMÁRIO: flat (se houver) + bônus% + (multiplier× se rarity≥1)
  if (hasFlat) out.push(`${TYPE_PT[def.primary]} flat ${fnum(level * GEAR.flatPerLevel[def.primary] * rm)}`);
  if (['dmg', 'hp', 'defesa', 'aps'].includes(def.primary)) {
    const bonus = 1 + level * GEAR.bonusRate * rm;
    out.push(`${TYPE_PT[def.primary]} ${pe(bonus - 1)} (bônus%)`);
    if (rarity >= 1) { const mult = 1 + level * GEAR.multRate * rm; out.push(`${TYPE_PT[def.primary]} ${pe(mult - 1)} (MULTIPLIER ×)`); }
  } else if (def.primary === 'crit') {
    out.push(`${TYPE_PT.crit} ${pe(critOf(level, rarity))}`);
  } else if (['lumens', 'xp', 'materiais'].includes(def.primary)) {
    out.push(`${TYPE_PT[def.primary]} ${pe(level * GEAR.affixPctRate * rm)}`);
  }
  // SECUNDÁRIOS ativos (a 0.30): valor já amortecido
  for (const sec of activeSecondaries(def, rarity)) {
    if (sec === 'crit') out.push(`${TYPE_PT.crit} ${pe(critOf(level, rarity) * GEAR.secondaryExp)} (sec)`);
    else if (sec === 'critDmg') out.push(`${TYPE_PT.critDmg} +${(critDmgOf(level, rarity) * GEAR.secondaryExp).toFixed(2)}× (sec)`);
    else if (['lumens', 'xp', 'materiais'].includes(sec)) out.push(`${TYPE_PT[sec]} ${pe(level * GEAR.affixPctRate * rm * GEAR.secondaryExp)} (sec)`);
    else { const sm = secondaryMult(level, rarity); out.push(`${TYPE_PT[sec]} ${pe(sm - 1)} (sec ×)`); }
  }
  return out;
}

function report(rarity, level) {
  console.log(`\n══════ ${GEAR_RARITY_LABELS[rarity]} (${rarity === 0 ? 'Comum' : 'Incomum'}) — nível CAP ${level} ══════`);
  for (const def of GEAR.pieces) {
    console.log(`  ${def.slot.padEnd(9)} ${def.name}`);
    for (const a of pieceAffixes(def, level, rarity)) console.log(`      · ${a}`);
  }
  // AGREGADO do set completo (todas as 6 peças no cap) — o que chega no player
  const state = { gear: {}, map: 1 };
  for (const def of GEAR.pieces) state.gear[def.key] = { level, rarity };
  console.log(`  ── AGREGADO do set (todas as 6 peças no cap) ──`);
  console.log(`      Dano:  flat +${fnum(gearDamageFlat(state))}   ×${gearDamageMult(state).toFixed(2)} (mult)`);
  console.log(`      HP:    flat +${fnum(gearHpFlat(state))}   ×${gearHpMult(state).toFixed(2)} (mult)`);
  console.log(`      Defesa: ×${gearDefesaMult(state).toFixed(2)}`);
  console.log(`      Atk Speed: +${gearApsFlat(state).toFixed(3)} (flat, antes do cap)`);
  console.log(`      Crit Rate: ${pe(gearCritAdd(state))}   ·   Crit Dmg: +${gearCritDmgAdd(state).toFixed(2)}×`);
  console.log(`      Gold: ×${gearLumensMult(state).toFixed(2)}   ·   XP: ×${gearXpMult(state).toFixed(2)}`);
}

console.log('STATS DO GEAR NOS CAPS — Map 1 (cada peça = 1 nível escala todos os afixos)');
report(0, GEAR.levelCap[0]); // Comum / Faded — cap 500
report(1, GEAR.levelCap[1]); // Incomum / Kindled — cap 1400
