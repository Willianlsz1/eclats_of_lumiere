// Motor de Gear — GDD §13 / §10.5.5 (Passo 3 do wiring).
// 6 peças fixas, cada uma com nível (Lumens) e raridade. Cada peça tem 1 afixo
// PRIMÁRIO inerente + SECUNDÁRIOS que a raridade destrava em ordem (determinístico).
// Modelo de valor calibrado (Camada 3): linear × motor exponencial (Luminous+);
// secundário = primário^0.30 (30% das décadas). Cap de nível da raridade topo sobe
// +capPerAsc por Ascension (motor sem-teto). Persiste sempre (não reseta).

import { GEAR, GEAR_RARITIES, CRAFT, NUMBER_CAP, MAPS, GILDED } from '../data/constants.js';

const maxRarity = GEAR_RARITIES.length - 1;

// Cap de raridade do MAPA atual (✅ 18/jun: Map 1 = Incomum/Kindled, índice 1). Sem o campo
// `gearRarityCap` no mapa → sem cap (maxRarity). Trava o rarity-up na raridade do mapa.
export function mapRarityCap(state) {
  const map = MAPS[((state && state.map) || 1) - 1] || MAPS[0];
  return map.gearRarityCap != null ? map.gearRarityCap : maxRarity;
}

// ───── Modelo de valor de um afixo ─────

// multiplicador do afixo PRIMÁRIO = 2 camadas LINEARES que multiplicam (modelo Gaiadon):
//   Bonus% = (1 + nível × bonusRate × rarityMult) · ×Multiplier = (1 + nível × multRate × rarityMult)
// Lineares → o produto cresce ~nível² (polinomial); com a base flat (Primary) → ~nível³.
export function primaryMult(level, rarity) {
  const rm = GEAR.rarityMult[rarity];
  const bonus = 1 + level * GEAR.bonusRate * rm;
  // ✅ 18/jun: afixo MULTIPLIER × (camada multiplicativa) só destrava no INCOMUM (rarity ≥ 1).
  // No COMUM (Faded) a peça tem só flat + % (mult = 1).
  const mult = rarity >= 1 ? 1 + level * GEAR.multRate * rm : 1;
  return bonus * mult;
}
// afixo SECUNDÁRIO multiplicativo = primário^0.30 (30% das décadas — gear.mjs corrigido)
export const secondaryMult = (level, rarity) => primaryMult(level, rarity) ** GEAR.secondaryExp;

// crit chance (afixo plano): nível × critPerLevel × rarityMult
export const critOf = (level, rarity) => level * GEAR.critPerLevel * GEAR.rarityMult[rarity];
// Gilded chance (afixo plano do Manto): nível × gildedPerLevel × rarityMult (teto global no agregado)
export const gildedOf = (level, rarity) => level * GEAR.gildedPerLevel * GEAR.rarityMult[rarity];
// crit damage (afixo plano, bônus sobre a base): nível × critDmgPerLevel × rarityMult
export const critDmgOf = (level, rarity) => level * GEAR.critDmgPerLevel * GEAR.rarityMult[rarity];

// Secundários ATIVOS de uma peça conforme a raridade. ✅ 14/jun: TODA peça comum
// (Faded) tem 2 afixos. Peças cujo PRIMÁRIO tem flat (dmg/hp/defesa/aps) já fecham
// 2 com flat + % → 0 secundário no Faded. Peças sem flat no primário (lumens=anel,
// crit=grasp) ganham 1 secundário já no Faded pra fechar 2. Cada raridade acima
// destrava +1 secundário, capado pelo tamanho da lista.
export function activeSecondaries(def, rarity) {
  const primaryHasFlat = (GEAR.flatPerLevel[def.primary] || 0) > 0;
  return def.secondary.slice(0, rarity + (primaryHasFlat ? 0 : 1));
}

// ───── Agregação por tipo de afixo ─────

// Produto dos afixos MULTIPLICATIVOS de um tipo (primário + secundários ativos a 30%)
function gearMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= primaryMult(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) m *= secondaryMult(p.level, p.rarity);
    }
  }
  return m;
}

export const gearDamageMult   = (s) => gearMultBy(s, 'dmg');
export const gearHpMult       = (s) => gearMultBy(s, 'hp');
export const gearDefesaMult   = (s) => gearMultBy(s, 'defesa');   // consumido na mitigação (Passo 2)
export const gearApsMult      = (s) => gearMultBy(s, 'aps');      // ⛓️ consumidor no apsCap (passo futuro)
export const gearRegenMult    = (s) => gearMultBy(s, 'regen');    // ⛓️ consumidor no regen (passo futuro)
export const gearBossDmgMult  = (s) => gearMultBy(s, 'bossDmg');  // ⛓️ consumidor no hit em boss (passo futuro)

// ── Afixo FLAT por nível (CP-4): soma flat à BASE do stat (não multiplica).
//    Primário = valor cheio; secundário = × secondaryExp. Escala pela raridade.
function gearFlatBy(state, type) {
  const per = GEAR.flatPerLevel[type] || 0;
  if (!per) return 0;
  let flat = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    const rm = GEAR.rarityMult[p.rarity];
    if (def.primary === type) flat += p.level * per * rm;
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) flat += p.level * per * rm * GEAR.secondaryExp;
    }
  }
  return flat;
}
export const gearDamageFlat = (s) => gearFlatBy(s, 'dmg'); // soma na base de dano
export const gearHpFlat     = (s) => gearFlatBy(s, 'hp');  // soma na base de HP
export const gearApsFlat    = (s) => gearFlatBy(s, 'aps'); // soma na base de APS (capado depois)
export const gearDefesaFlat = (s) => gearFlatBy(s, 'defesa'); // soma na base de Defesa

// ── Afixos de FARM (Lumens/XP/Materiais) — REGRA Bloco 3: só flat/% ADITIVO, NUNCA o motor ×.
// Valor LINEAR do afixo (sem o 1.0039^L): mantém o farm como bônus modesto, não motor de décadas.
function farmLinear(level, rarity, isSec) {
  return 1 + level * GEAR.affixPctRate * GEAR.rarityMult[rarity] * (isSec ? GEAR.secondaryExp : 1);
}
function farmMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= farmLinear(p.level, p.rarity, false);
    for (const sec of activeSecondaries(def, p.rarity)) if (sec === type) m *= farmLinear(p.level, p.rarity, true);
  }
  return m;
}
export const gearLumensMult = (s) => farmMultBy(s, 'lumens'); // Farm: linear (sem motor)
export const gearXpMult     = (s) => farmMultBy(s, 'xp');     // Farm: linear (sem motor)
// Materiais → DROP: AMORTECIDO por log (o bruto linear ~×70 viraria pacing absurdo). yield = 1 + 0.5×log10(bruto).
// Justificativa: log transforma o crescimento do afixo em bônus ADITIVO limitado; 0.5 lança ≈ ×2 no endgame
// (linear bruto ×70 → log10=1.85 → ×1.9), preservando o pacing de ~27 min/tier (drop base 1% intocado).
export const gearMaterialDropMult = (s) => 1 + 0.5 * Math.log10(Math.max(1, farmMultBy(s, 'materiais')));

// Gilded chance: soma plana dos afixos 'gilded' (primário Manto + secundários a 30%),
// limitada ao teto GLOBAL (GILDED.chanceCap = 30%).
export function gearGildedChance(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'gilded') a += gildedOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'gilded') a += gildedOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return Math.min(GILDED.chanceCap, a);
}

// Crit chance: soma plana (primário Grasp + secundário Resonance a 30%)
export function gearCritAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'crit') a += critOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'crit') a += critOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a;
}

// Crit damage: bônus plano sobre a base ×2 (só secundário — Edge/Grasp), a 30% como secundário.
export function gearCritDmgAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'critDmg') a += critDmgOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'critDmg') a += critDmgOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a; // ⛓️ consumidor em critDamageMult (wiring quando o Crit fechar — §16.6)
}

// ───── Custos e gates ─────

// Cap de nível da peça = cap DURO da raridade (Comum 500 · Incomum 1400). A raridade TOPO
// (Converged) ganha +capPerAsc por Ascension (sem-teto §13). NÃO é atrelado à Convergence.
export function levelCapFor(piece, state) {
  const base = GEAR.levelCap[piece.rarity];
  return piece.rarity === maxRarity ? base + (state.ascensions || 0) * GEAR.capPerAsc : base;
}
export const atLevelCap = (piece, state) => piece.level >= levelCapFor(piece, state);

// ✅ recalibração "em branco": custo de 1 nível EXPONENCIAL (sim) — dobra a cada 10 níveis.
// cost(L) = base × costRamp^L × costMult[raridade]. Cria teto-SUAVE (~280) abaixo do cap
// duro (400). Clampado a NUMBER_CAP (caps altos de M2+ serão recalibrados num CP próprio).
export function levelCost(piece) {
  const c = GEAR.levelCostBase * GEAR.costRamp ** piece.level * GEAR.costMult[piece.rarity];
  return Math.min(NUMBER_CAP, c);
}

// Tier de material que paga a raridade atual→próxima (= índice da raridade atual: T1 paga 0→1)
export const rarityUpTier = (piece) => piece.rarity;
// custo de raridade = MATERIAIS do tier (não mais Lumens, §13B); Infinity se já no topo.
export function rarityUpCost(piece) {
  return piece.rarity >= maxRarity ? Infinity : CRAFT.rarityUpMaterial;
}

// Menor raridade entre TODAS as peças (piso do set, pro gate lockstep).
function minSetRarity(state) {
  let m = Infinity;
  for (const def of GEAR.pieces) m = Math.min(m, state.gear[def.key].rarity);
  return m;
}

// Rarity-up gateado por: (1) MATERIAL do tier + (2) LOCKSTEP — uma peça só sobe pra
// R+1 se TODAS já estão ≥ R (✅ 14/jun: não passa pra Luminous enquanto nem todas
// estiverem Kindled). Uma peça por vez, na ordem que o jogador quiser, dentro do piso.
export function canRarityUp(state, key) {
  const p = state.gear[key];
  return p.rarity < maxRarity
    && p.rarity < mapRarityCap(state)               // ✅ 18/jun: trava no cap de raridade do mapa (Map 1 = Incomum)
    && minSetRarity(state) >= p.rarity              // a peça está no piso do set
    && state.materiais[rarityUpTier(p)] >= CRAFT.rarityUpMaterial;
}

// ───── Ações (gastam Lumens) ─────

export function buyLevel(state, key) {
  const p = state.gear[key];
  if (atLevelCap(p, state)) return false;
  const cost = levelCost(p);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  p.level += 1;
  return true;
}

// Bulk-buy: compra o máximo de níveis que o orçamento permite. Com custo EXPONENCIAL o
// teto duro é baixo (≤ 400 no Faded; ≤ 5000 nas raridades altas) → loop simples e seguro
// (sem closed-form). O custo cresce rápido, então poucas iterações por chamada na prática.
export function buyLevels(state, key, n) {
  const p = state.gear[key];
  let bought = 0;
  while (bought < n && !atLevelCap(p, state)) {
    const cost = levelCost(p);
    if (state.lumens < cost) break;
    state.lumens -= cost;
    p.level += 1;
    bought += 1;
  }
  return bought;
}

export function doRarityUp(state, key) {
  if (!canRarityUp(state, key)) return false;
  const p = state.gear[key];
  state.materiais[rarityUpTier(p)] -= CRAFT.rarityUpMaterial; // paga em materiais do tier
  p.rarity += 1; // mantém o nível: segue subindo até o cap maior da nova raridade
  return true;
}

// ───── Refino de materiais (§13B): 12:1, SÓ pra cima ─────
export const canRefino = (state, fromTier) =>
  fromTier >= 0 && fromTier < 3 && state.materiais[fromTier] >= CRAFT.refinoRatio;

export function doRefino(state, fromTier) {
  if (!canRefino(state, fromTier)) return false;
  state.materiais[fromTier] -= CRAFT.refinoRatio;
  state.materiais[fromTier + 1] += 1;
  return true;
}
