// ===== Loop principal, save/load e botões =====
const SAVE_KEY = "gaiadon_clone_save";
let state = defaultState();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const d = defaultState();
      state = Object.assign(d, parsed);
      // re-merge das estruturas aninhadas (saves antigos podem não ter tudo)
      state.equipped = Object.assign({}, d.equipped, parsed.equipped || {});
      for (const slot of SLOTS) {
        state.equipped[slot.id] = Object.assign({ rarity: 0, level: 1 }, state.equipped[slot.id]);
      }
      state.asc = Object.assign({ power: 0, offlineEff: 0, offlineCap: 0 }, parsed.asc || {});
    }
  } catch (e) { console.warn("Failed to load save", e); }
  spawnEnemy(state);
  state.playerHp = playerMaxHp(state);
}

function save() {
  try {
    state.lastSeen = Date.now();
    const copy = Object.assign({}, state);
    delete copy.enemy; delete copy.playerHp; // regenerados ao carregar
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    $("saveStatus").textContent = "Saved ✓";
    setTimeout(() => $("saveStatus").textContent = "", 1500);
  } catch (e) { console.warn(e); }
}

function handleEvents(events) {
  for (const ev of events) {
    if (ev.type === "kill") {
      let msg = `Defeated ${ev.name}! +${fmt(ev.gold)} gold, +${fmt(ev.shards)} shards.`;
      if (ev.leveled) msg += ` Reached level ${state.level}!`;
      logMsg(msg);
      if (ev.walledCleared) logMsg(`✨ Broke through to Zone ${ev.zone}!`, "milestone");
    } else if (ev.type === "death") {
      logMsg(`💀 You're not strong enough for Zone ${ev.wallZone} yet. Farm and grow stronger!`);
    }
  }
}

function gameLoop() {
  const events = tick(state, 0.1); // 100ms por tick
  handleEvents(events);
  renderResources(state);
  renderCombat(state);
  renderHero(state);
  renderNextGoal(state);
  if (events.some(e => e.type === "kill")) { renderEquipment(state); renderAscend(state); }
}

function bindButtons() {
  $("ascendBtn").onclick = () => {
    if (!canAscend(state)) return;
    if (confirm("Ascending resets your run (gold, zones, equipment). You keep Essence and permanent upgrades. Continue?")) {
      const g = ascend(state);
      spawnEnemy(state); state.playerHp = playerMaxHp(state);
      logMsg(`✨ You ascended! +${fmt(g)} essence.`, "milestone");
      renderAll(state);
    }
  };
  $("saveBtn").onclick = save;
  $("resetBtn").onclick = () => {
    if (confirm("Erase ALL progress, including essence and upgrades?")) {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      spawnEnemy(state); state.playerHp = playerMaxHp(state);
      renderAll(state); logMsg("Game reset from scratch.");
    }
  };
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  bindButtons();
  renderAll(state);
  setInterval(gameLoop, 100);   // combate
  setInterval(save, 15000);     // autosave a cada 15s
});
