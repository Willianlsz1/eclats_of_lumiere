// ===== Loop principal, save/load e botões =====
const SAVE_KEY = "gaiadon_clone_save";
let state = defaultState();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(defaultState(), parsed);
      // garante estruturas (caso o save seja de uma versão mais antiga)
      state.shop = Object.assign({ dmg: 0, hp: 0, spd: 0, gold: 0, offlineEff: 0, offlineCap: 0 }, parsed.shop || {});
      state.equipped = Object.assign({ Weapon: null, Armor: null, Amulet: null }, parsed.equipped || {});
    }
  } catch (e) { console.warn("Failed to load save", e); }
  spawnEnemy(state);
  state.playerHp = playerMaxHp(state);
}

function save() {
  try {
    state.lastSeen = Date.now(); // timestamp para o cálculo offline (Task 5)
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
      let msg = `Defeated ${ev.name}! +${fmt(ev.gold)} gold.`;
      if (ev.leveled) msg += ` Reached level ${state.level}!`;
      if (ev.drop) msg += ` 🎁 Dropped: ${ev.drop.name} (${ev.drop.rarity} +${ev.drop.power})`;
      logMsg(msg);
      if (ev.walledCleared) {
        logMsg(`✨ Broke through to Zone ${ev.zone}!`, "milestone");
      }
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
  if (events.some(e => e.drop)) renderGear(state);
  if (events.some(e => e.type === "kill")) { renderShop(state); renderAscend(state); }
}

function bindButtons() {
  $("ascendBtn").onclick = () => {
    if (!canAscend(state)) return;
    if (confirm("Ascending resets all progress (except Essence). Continue?")) {
      const g = ascend(state);
      spawnEnemy(state); state.playerHp = playerMaxHp(state);
      logMsg(`✨ You ascended! +${fmt(g)} essence.`, "milestone");
      renderAll(state);
    }
  };
  $("saveBtn").onclick = save;
  $("resetBtn").onclick = () => {
    if (confirm("Erase ALL progress, including essence?")) {
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
