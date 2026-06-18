// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de stats foi removido. Estas funções devolvem valores de AMOSTRA só para
// as telas (player/combat/gear/awaken) renderizarem. Serão reescritas no replanejamento.

export const runLevel       = (s) => 12 + (s?.convergences || 0);
export const playerHpMax    = () => 1000;
export const damagePerHit   = () => 140;
export const dps            = () => 350;
export const currentAPS     = () => 1.8;
export const apsBonus       = () => 0.3;
export const critChance     = () => 0.25;
export const critChanceRaw  = () => 0.25;
export const critDamageMult = () => 2.0;
export const levelProgress  = () => 0.45;
export const levelXpInfo    = () => ({ into: 4500, total: 10000, remaining: 5500 });

// Convergence (display): bônus de amostra escalado pelo nº de converges semeado.
export const convMult       = (s) => 1 + 0.20 * (s?.convergences || 0);
export const convLumensMult = (s) => 1 + 0.005 * (s?.convergences || 0);
