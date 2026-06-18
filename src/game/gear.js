// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de Gear/Forge foi removido. Multiplicadores de stat devolvem neutro (1/0);
// os helpers de exibição por peça devolvem valores leves escalados pelo nível só para
// os cards aparecerem variados. Ações (comprar/refinar/upar) são no-op.

// ── Multiplicadores agregados (breakdown do Player) — neutros ──
export const gearDamageMult = () => 1;
export const gearHpMult     = () => 1;
export const gearApsMult    = () => 1;
export const gearLumensMult = () => 1;
export const gearXpMult     = () => 1;
export const gearCritAdd    = () => 0;
export const gearCritDmgAdd = () => 0;

// ── Helpers de exibição por peça (cards de Gear/Forge) — amostra leve ──
export const primaryMult   = (level = 0) => 1 + level * 0.05;
export const secondaryMult = (level = 0) => 1 + level * 0.015;
export const critOf        = (level = 0) => level * 0.001;
export const critDmgOf     = (level = 0) => level * 0.002;
export const gildedOf      = (level = 0) => level * 0.0005;
export const activeSecondaries = () => [];

// ── Custos / caps (amostra) ──
export const levelCost   = (piece) => 100 * 1.1 ** (piece?.level || 0);
export const levelCapFor = () => 500;
export const atLevelCap  = () => false;
export const rarityUpTier = (piece) => piece?.rarity || 0;

// ── Ações (no-op na casca) ──
export const buyLevels   = () => 0;
export const canRefino   = () => false;
export const doRefino    = () => false;
export const canRarityUp = () => false;
export const doRarityUp  = () => false;
