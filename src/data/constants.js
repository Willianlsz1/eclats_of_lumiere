// Constantes do v0 — "A primeira subida" (recomeço do zero, 2026-06-20).
// TODOS os números são SEMENTES, afináveis pelo simulador (tools/sim/v0.mjs).
// Fonte do design: docs/eclats_recomeco_nucleo_2026-06-19.md §3 (núcleo) e §4 (v0).
//
// ÂNCORA DE DESIGN (não quebrar sem intenção): no motor relativo, o HP do mob
// acompanha o HP do player. Como baseDano/baseHp e danoPerLevel/hpPerLevel são
// proporcionais, o termo de Nível CANCELA na razão Dano÷HP — só upgrades de
// gold (e, no futuro, gear/conv assimétricos) movem o tempo-de-kill. Vigie UMA
// razão: Dano÷HP.

// Save / loop
export const SCHEMA_VERSION = 100; // recomeço: schema novo (saves antigos descartados)

// Player: base + ganho por nível. O Nível é uma base PEQUENA; o gold é o que cresce.
export const PLAYER = {
  baseDano: 10,
  baseHp: 100,
  baseAPS: 1.0, // ataques/seg — constante no v0 (sem upgrade de APS)
  danoPerLevel: 2,
  hpPerLevel: 20,
  regenPerSec: 0.04, // 4%/s do HP máx (parede sem punição — sustenta o farm)
  regenOnKill: 0.05, // +5% do HP máx ao matar
  respawnSeconds: 3, // sem perda de progresso: respawn com HP cheio
};

// Upgrades comprados com gold (custo geométrico — padrão do gênero).
export const UPGRADES = {
  dano: { stat: 'dano', label: 'Forjar Dano', perLevel: 4, costBase: 10, costGrowth: 1.15 },
  vida: { stat: 'hp', label: 'Reforçar Vida', perLevel: 40, costBase: 12, costGrowth: 1.15 },
};

// Inimigo: HP relativo ao player; dano escala com o nível, não com seu HP. §3.1
export const ENEMY = {
  hpMultCommon: 1.3,
  hpMultRare: 1.8, // hook p/ v1 (v0 só usa comum)
  dmgBase: 4,
  dmgPerLevel: 1.5,
};

// Economia: gold/xp por kill, proporcionais ao HP do mob.
export const ECONOMY = {
  goldPerKillRatio: 0.5,
  xpPerKillRatio: 0.45,
};

// Curva de nível: XP p/ ir de L → L+1 (geométrica).
export const LEVEL = {
  base: 40,
  growth: 1.10,
};

// Áreas. v0 = só a Área 1 (lv 1→60, ×HP da área = 1.0).
export const AREAS = [
  {
    id: 1,
    name: 'The Dreaming Wood',
    lvlLo: 1,
    lvlCap: 60,
    hpMult: 1.0,
    bg: 'backgrounds.map1',
    enemyName: 'Candlewisp Shade',
    enemyArt: 'enemies.map1.candlewisp_shade',
  },
];
