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
          if (g.gold > 0 || g.xp > 0 || g.shards > 0) {
            state.gold += g.gold; state.shards += g.shards; gainXp(state, g.xp);
            // Acumula kills offline no Region Mastery.
            if (g.kills > 0) {
              addRegionMasteryKills(state, state.region, g.kills);
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
    scheduleRender(new Set(["equipment", "ascension"]), state);
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
      const VIEW_CAT = { stats: "hero", ascension: "ascension", equipment: "equipment", map: "map", train: "goldStats" };
      const cat = VIEW_CAT[btn.dataset.view];
      if (cat) scheduleRender(new Set([cat]), state);
    });
  });

  // ── Map: clique em botão de dificuldade → entra na região ──
  $("mapGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button.map-diff-btn");
    if (!btn || btn.disabled) return;
    const regionIdx = parseInt(btn.dataset.region, 10);
    const diffIdx   = parseInt(btn.dataset.diff, 10);
    enterRegion(state, regionIdx, diffIdx);
    // Muda para a view de combate.
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelector('.nav-btn[data-view="combat"]').classList.add("active");
    document.getElementById("view-combat").classList.add("active");
    renderAll(state);
    logMsg(`⚔️ Entering ${REGIONS[regionIdx].name} · ${DIFFICULTIES[diffIdx].name}!`);
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

  // ── Ascensão ──
  $("ascendBtn").onclick = () => {
    const asc = getAscensionStatus(state);
    if (!asc.canAscend) return;
    const msg = asc.isTierPromo
      ? `🎉 TIER PROMOTION!\n${asc.tierName} → ${asc.nextTier.name}!\n\n✓ KEEP  — All Equipment & Map Progress\n✗ RESET — Gold, Level, Wave position\n\nPower Spike ×${fmt(asc.nextTier.spike)} will be applied!\n\nAscend?`
      : `🎖️ Ascension #${asc.ascensionNumber}\n\n✓ KEEP  — All Equipment & Map Progress\n✗ RESET — Gold, Level, Wave position\n\nEach ascension: ×${asc.tierMult.toFixed(2)} to all stats (compounds!)\nYou'll rebuild much faster.\n\nAscend?`;
    if (confirm(msg)) {
      ascend(state);
      spawnPack(state); state.playerHp = playerMaxHp(state);
      const postAsc = getAscensionStatus(state);
      logMsg(asc.isTierPromo ? `🎉 TIER UP! Welcome, ${postAsc.tierName}!` : `✨ Ascension #${state.ascensions}! Keep pushing, ${postAsc.tierName}!`, "milestone");
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
  const region = REGIONS[state.region];
  const diff   = DIFFICULTIES[state.difficulty];
  logMsg(`⚔️ Resuming in ${region.name} · ${diff.name}! Defeat enemies, collect 💰 Gold. Tap 🛡️ Gear to upgrade!`);
  if (pendingOffline) showOfflineSummary(pendingOffline);
  setInterval(gameLoop, 100);
  setInterval(save, 15000);
});
