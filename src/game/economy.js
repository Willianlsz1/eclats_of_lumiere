// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de economia foi removido. perKillEstimate devolve uma estimativa de amostra
// (mesmo shape consumido pela tela de Mapa) só para o painel de recursos aparecer.

export const perKillEstimate = (_state, subarea = 1) => ({
  lumens: 100 * subarea,
  vestiges: subarea,
  tier: 0,
  matChance: 0.05,
  matPerDrop: 1,
});
