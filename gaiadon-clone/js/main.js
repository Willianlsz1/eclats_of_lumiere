// ===== Loop principal, save/load e botões =====
const SAVE_KEY = "gaiadon_clone_save";
let state = defaultState();
let pendingOffline = null;
const eventCtx = createEventCtx();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(defaultState(), parsed);
      migrate(state);

      // Progresso offline.
      if (state.lastSeen) {
        const elapsed = (Date.now() - state.lastSeen) / 1000;
        if (elapsed > 60) {
          const g = computeOfflineGains(state, elapsed);
          if (g.lumens > 0 || g.xp > 0 || g.vestiges > 0) {
            state.lumens += g.lumens; state.vestiges += g.vestiges; gainXp(state, g.xp);
            // Acumula kills offline no Map Mastery.
            if (g.kills > 0) {
              addMapMasteryKills(state, state.map, g.kills);
            }
            pendingOffline = g;
          }
        }
      }
    }
  } catch (e) { console.warn("Failed to load save", e); }
  spawnPack(state);
  state.playerHp = playerMaxHp(state);
}

function save() {
  try {
    state.lastSeen = Date.now();
    const copy = Object.assign({}, state);
    delete copy.enemies; delete copy.playerHp;
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    $("saveStatus").textContent = "Saved ✓";
    setTimeout(() => $("saveStatus").textContent = "", 1500);
  } catch (e) { console.warn(e); }
}

let eqDirty = false, eqTick = 0;
function gameLoop() {
  const events = tick(state, 0.1);
  dispatchEvents(events, state, eventCtx);

  scheduleRender(new Set(["resources", "combat", "hero"]), state);
  if (events.some(e => e.type === "kill")) eqDirty = true;
  if (eqDirty && ++eqTick >= 5) {
    scheduleRender(new Set(["equipment", "ascension", "passives"]), state);
    eqDirty = false; eqTick = 0;
  }
  // Re-render map when a difficulty is cleared (to show new unlocks).
  if (events.some(e => e.difficultyCleared)) {
    scheduleRender(new Set(["map"]), state);
  }
}

function bindButtons() {
  // ── Main navigation: each button switches the entire view ──
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
      const VIEW_CAT = { stats: "hero", ascension: "ascension", equipment: "equipment", map: "map", train: "goldStats", passives: "passives" };
      const cat = VIEW_CAT[btn.dataset.view];
      if (cat) scheduleRender(new Set([cat]), state);
    });
  });

  // ── Map: clique em "Viajar" → entra no mapa/subárea ──
  $("mapGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button.map-diff-btn");
    if (!btn || btn.disabled) return;
    const mapIdx = parseInt(btn.dataset.map, 10);
    const subIdx = parseInt(btn.dataset.sub, 10) || 0;
    enterMap(state, mapIdx, subIdx);
    // Muda para a view de combate.
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelector('.nav-btn[data-view="combat"]').classList.add("active");
    document.getElementById("view-combat").classList.add("active");
    renderAll(state);
    logMsg(`⚔️ Viajando para ${REGIONS[mapIdx].name} · Subárea ${subIdx + 1}!`);
  });

  // ── Equipamento (delegação) ──
  $("equipment").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const slot = b.dataset.slot, act = b.dataset.act;
    const ok = act === "level" ? levelUpItem(state, slot)
             : act === "max"   ? levelUpMax(state, slot) > 0
             : rarityUpItem(state, slot);
    if (ok) {
      if (act === "rarity") {
        const newRarity = state.equipped[slot].rarity;
        const rName     = RARITIES[newRarity].name;
        const newAffix  = getNewAffix(slot, newRarity);
        if (newAffix) {
          const val   = (affixValue(newAffix, state.equipped[slot].level) * 100).toFixed(1);
          const aName = AFFIX_NAMES[newAffix.stat] || newAffix.stat;
          logMsg(`💎 ${slot} → ${rName}! New affix: +${val}% ${aName}`, "milestone");
        } else {
          logMsg(`💎 ${slot} upgraded to ${rName}!`, "milestone");
        }
        flashSlot(slot);
      }
      scheduleRender(new Set(["equipment", "resources", "combat", "hero"]), state);
    }
  });

  // ── Passivas (delegação) ──
  $("passivesPanel").addEventListener("click", function(e) {
    var btn = e.target.closest("button.pn-btn[data-passive-id]");
    if (!btn || btn.disabled) return;
    var id = btn.dataset.passiveId;
    if (buyPassive(state, id)) {
      var def = passiveDef(id);
      logMsg("🌿 " + def.name + " Lv " + passiveLevel(state, id) + "!");
      scheduleRender(new Set(["resources", "passives", "hero"]), state);
    }
  });

  // ── Ascensão ──
  $("ascendBtn").onclick = () => {
    const asc = getAscensionStatus(state);
    if (!asc.canAscend) return;
    const msg = `🔮 Ascensão — ${asc.tierName} → ${asc.nextTierName}!\n\n`
      + `✓ MANTÉM — Equipamento, Passivas, Materiais e Progresso de Mapa\n`
      + `✗ RESETA — Lumens, Nível e Gold Stats\n\n`
      + `Desbloqueia o próximo mapa. Power Spike ×${fmt(CONFIG.ascension.spikePerTier)}.\n\nAscender?`;
    if (confirm(msg)) {
      ascend(state);
      spawnPack(state); state.playerHp = playerMaxHp(state);
      const postAsc = getAscensionStatus(state);
      logMsg(`🎉 Ascensão! Bem-vindo a ${postAsc.mapName}, ${postAsc.tierName}!`, "milestone");
      renderAll(state);
    }
  };

  $("convergeBtn").onclick = () => {
    const cv = getConvergenceStatus(state);
    if (!cv.canConverge) return;
    const msg = `🔄 Convergence #${cv.convergences + 1}\n\n✓ KEEP — Equipment, Passives, Map Progress, Ascensions\n✗ RESET — Gold, Level, Wave position\n\nPower: ×${fmt(cv.currentMult)} → ×${fmt(cv.nextMult)} (+${cv.gainPct.toFixed(1)}%)\n\nConverge?`;
    if (confirm(msg)) {
      converge(state);
      spawnPack(state); state.playerHp = playerMaxHp(state);
      logMsg(`🔄 Convergence #${state.convergences}! Power mult ×${fmt(convergenceMult(state))}.`, "milestone");
      renderAll(state);
    }
  };

  $("offlineCollect").onclick = () => { $("offlineModal").classList.add("hidden"); };
  $("saveBtn").onclick = save;
  $("resetBtn").onclick = () => {
    if (confirm("Erase ALL progress, including equipment and ascensions?")) {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      spawnPack(state); state.playerHp = playerMaxHp(state);
      renderAll(state); logMsg("Game reset from scratch.");
    }
  };
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  bindButtons();
  renderAll(state);
  const region = REGIONS[state.map];
  logMsg(`⚔️ Retomando em ${region.name} · Subárea ${state.subarea + 1}! Derrote inimigos, colete 💰 Lumens. Toque 🛡️ Gear para evoluir!`);
  if (pendingOffline) showOfflineSummary(pendingOffline);
  setInterval(gameLoop, 100);
  setInterval(save, 15000);
});
