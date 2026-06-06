// ===== Loop principal, save/load e botões =====
const SAVE_KEY = "gaiadon_clone_save";
let state = defaultState();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(defaultState(), parsed);
      // garante estruturas
      state.shop = Object.assign({ dmg: 0, hp: 0, spd: 0, gold: 0 }, parsed.shop || {});
      state.equipped = Object.assign({ Arma: null, Armadura: null, Amuleto: null }, parsed.equipped || {});
    }
  } catch (e) { console.warn("Falha ao carregar save", e); }
  spawnEnemy(state);
  state.playerHp = playerMaxHp(state);
}

function save() {
  try {
    const copy = Object.assign({}, state);
    delete copy.enemy; delete copy.playerHp; // regenerados ao carregar
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    $("saveStatus").textContent = "Salvo ✓";
    setTimeout(() => $("saveStatus").textContent = "", 1500);
  } catch (e) { console.warn(e); }
}

function handleEvents(events) {
  for (const ev of events) {
    if (ev.type === "kill") {
      let msg = `Derrotou ${ev.name}! +${fmt(ev.gold)} ouro.`;
      if (ev.leveled) msg += ` Subiu para o nível ${state.level}!`;
      if (ev.drop) msg += ` 🎁 Dropou: ${ev.drop.name} (${ev.drop.rarity} +${ev.drop.power})`;
      logMsg(msg);
    }
  }
}

function gameLoop() {
  const events = tick(state, 0.1); // 100ms por tick
  handleEvents(events);
  renderResources(state);
  renderCombat(state);
  if (events.some(e => e.drop)) renderGear(state);
  if (events.some(e => e.type === "kill")) { renderShop(state); renderAscend(state); }
}

function bindButtons() {
  $("prevZone").onclick = () => { if (changeZone(state, -1)) renderAll(state); };
  $("nextZone").onclick = () => { if (changeZone(state, +1)) renderAll(state); };
  $("ascendBtn").onclick = () => {
    if (confirm("Ascender reinicia todo o progresso (exceto Essência). Continuar?")) {
      const g = ascend(state);
      spawnEnemy(state); state.playerHp = playerMaxHp(state);
      logMsg(`✨ Você ascendeu! +${fmt(g)} de essência.`);
      renderAll(state);
    }
  };
  $("saveBtn").onclick = save;
  $("resetBtn").onclick = () => {
    if (confirm("Apagar TODO o progresso, incluindo essência?")) {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      spawnEnemy(state); state.playerHp = playerMaxHp(state);
      renderAll(state); logMsg("Jogo reiniciado do zero.");
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
