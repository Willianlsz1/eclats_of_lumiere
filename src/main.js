// Bootstrap do Éclats of Lumière — CP-1 (núcleo) + CP-2 (nível/XP/áreas).
// Carrega o save, monta a UI, liga o autosave e roda o loop (tick → render).
// O combate (dano/kills) ainda é stub — CP-3.

import '../style.css';
import { state } from './core/state.js';
import { load, setupAutosave, resetSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack, updateUnlockByLevel } from './game/combat.js';
import { playerHpMax, runLevel, damagePerHit, currentAPS, levelXpInfo } from './game/stats.js';
import { rollItem, equipItem, gearDamageMult, gearHpMult, upgradeItem, rarityUpItem, forgeItem, refineMat } from './game/gear.js';
import { setupUI, renderUI } from './ui/ui.js';

// Carrega o save (se houver) e reconstrói o runtime.
load();
updateUnlockByLevel(state);           // áreas liberadas conforme o nível salvo
state.player.hp = playerHpMax(state); // HP cheio no boot
state.player.dead = false;
resetPack(state);                     // popula a cena (mobs estáticos até o CP-3)

setupUI(state);
setupAutosave();

// Tick fixo (100ms). combatTick é stub até o CP-3; updateUnlockByLevel libera
// áreas conforme o nível sobe.
startLoop((dt) => {
  combatTick(state, dt);
  updateUnlockByLevel(state);
  renderUI(state);
});

renderUI(state);

// Atalhos de teste no console (removidos num CP de polish):
//   eclatsReset()  → apaga o save e recomeça
//   eclatsXp(n)    → adiciona XP da run (testa nível/áreas até o combate existir)
window.eclatsReset = resetSave;
window.eclatsXp = (n = 1e6) => { state.xpRun += n; state.xpTotal += n; };
window.eclatsDebug = () => ({
  level: runLevel(state), subarea: state.subarea, unlocked: state.unlockedSubarea,
  hp: Math.round(playerHpMax(state)), dmg: Math.round(damagePerHit(state)),
  aps: +currentAPS(state).toFixed(2), xpToNext: Math.round(levelXpInfo(state).remaining),
  lumens: Math.round(state.lumens), kills: state.killsTotal,
  killsInArea: state.killsInSubarea, enemies: state.enemies.length, dead: state.player.dead,
  invCount: state.inventory.length,
});
// Hooks de teste do gear (CP-4a; UI vem no CP-4b):
window.eclatsDrop = (rarity = 2, slot = 'edge') => { state.inventory.push(rollItem(state, slot, rarity, state.subarea)); return state.inventory.length; };
window.eclatsInv = () => state.inventory.map((it) => ({ id: it.id, slot: it.slot, rar: it.rarity, affixes: it.affixes.map((a) => `${a.type}=${(a.value * 100).toFixed(1)}%`) }));
window.eclatsEquip = (id) => equipItem(state, id);
window.eclatsGear = () => ({ dmgMult: +gearDamageMult(state).toFixed(3), hpMult: +gearHpMult(state).toFixed(3), equipped: Object.fromEntries(Object.entries(state.equipped).map(([k, v]) => [k, v ? `r${v.rarity}L${v.level}` : null])) });
// CP-5: upgrade/material
window.eclatsUpgrade = (id) => upgradeItem(state, id);
window.eclatsRarityUp = (id) => rarityUpItem(state, id);
window.eclatsForge = (slot = 'edge', tier = 0) => forgeItem(state, slot, tier);
window.eclatsRefine = (t = 0) => refineMat(state, t);
window.eclatsMat = (a = [100, 100, 100, 0]) => { state.materiais = a; state.lumens += 1e6; return state.materiais; };
