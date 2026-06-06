// ===== Loop principal, save/load e botões =====
const SAVE_KEY = "gaiadon_clone_save";
let state = defaultState();
let pendingOffline = null; // ganhos offline a mostrar após o load

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const d = defaultState();
      state = Object.assign(d, parsed);
      // Sanitiza o equipamento: garante { rarity:int, level:number } por slot.
      // Saves antigos (raridade como texto, item objeto, etc.) são descartados sem quebrar.
      state.equipped = {};
      for (const slot of SLOTS) {
        const it = (parsed.equipped || {})[slot.id];
        const validRarity = it && Number.isInteger(it.rarity) && it.rarity >= 0 && it.rarity < RARITIES.length;
        const validLevel = it && typeof it.level === "number" && it.level >= 1;
        state.equipped[slot.id] = (validRarity && validLevel)
          ? { rarity: it.rarity, level: it.level }
          : { rarity: 0, level: 1 };
      }
      // Migração de saves antigos: remove campos de Essence que não existem mais.
      if (state.asc !== undefined)     delete state.asc;
      if (state.essence !== undefined) delete state.essence;

      // Progresso offline: credita os ganhos do tempo ausente (acima de 1 min).
      if (state.lastSeen) {
        const elapsed = (Date.now() - state.lastSeen) / 1000;
        if (elapsed > 60) {
          const g = computeOfflineGains(state, elapsed);
          if (g.gold > 0 || g.xp > 0 || g.shards > 0) {
            state.gold += g.gold; state.shards += g.shards; gainXp(state, g.xp);
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
    delete copy.enemies; delete copy.playerHp; // regenerados ao carregar
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

let floatAccum = 0, floatTick = 0;
let eqDirty = false, eqTick = 0;
function gameLoop() {
  const events = tick(state, 0.1); // 100ms por tick
  handleEvents(events);

  // Game feel: acumula o dano e mostra um número flutuante a cada ~300ms.
  for (const e of events) if (e.type === "hit") floatAccum += e.amount;
  if (++floatTick >= 3) {
    if (floatAccum > 0) {
      const isBoss = state.enemies && state.enemies[0] && state.enemies[0].isBoss;
      const isCrit = critRate(state) > 0 && Math.random() < critRate(state);
      const shown = isCrit ? floatAccum * critMult(state) : floatAccum;
      spawnFloatingDamage(shown, isBoss, isCrit);
      const nm = $("enemyName"); nm.classList.add("hit"); setTimeout(() => nm.classList.remove("hit"), 120);
    }
    floatAccum = 0; floatTick = 0;
  }

  renderResources(state);
  renderCombat(state);
  renderHero(state);
  renderNextGoal(state);
  // Equipamento/ascensão re-renderizam no máx a cada ~500ms (menos churn, clique estável).
  if (events.some(e => e.type === "kill")) eqDirty = true;
  if (eqDirty && ++eqTick >= 5) { renderEquipment(state); renderAscend(state); eqDirty = false; eqTick = 0; }
}

function bindButtons() {
  $("prevZone").onclick = () => { if (changeZone(state, -1)) renderAll(state); };
  $("nextZone").onclick = () => { if (changeZone(state, +1)) renderAll(state); };

  // Cliques de equipamento por DELEGAÇÃO (listener fixo no container) — robusto
  // mesmo com o painel re-renderizando durante o combate.
  $("equipment").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const slot = b.dataset.slot, act = b.dataset.act;
    const ok = act === "level" ? levelUpItem(state, slot)
             : act === "max"   ? levelUpMax(state, slot) > 0
             : rarityUpItem(state, slot);
    if (ok) {
      if (act === "rarity") logMsg(`⚔️ ${slot} is now ${RARITIES[state.equipped[slot].rarity].name}!`, "milestone");
      renderEquipment(state); renderResources(state); renderCombat(state); renderHero(state);
      if (act === "rarity") flashSlot(slot);
    }
  });
  $("ascendBtn").onclick = () => {
    if (!canAscend(state)) return;
    const tier  = heroTier(state);
    const nextT = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;
    const isTierPromo = nextT && state.ascensions + 1 === nextT.minAsc;
    const msg = isTierPromo
      ? `TIER PROMOTION: ${TIERS[tier].name} → ${nextT.name}!\n\nPower Spike ×${fmt(nextT.spike)} awaits!\nThis resets gold, zones and level — equipment is kept.\n\nAscend?`
      : `Ascending resets gold, zones and character level.\nYou KEEP your equipment.\n\nAscend?`;
    if (confirm(msg)) {
      ascend(state);
      spawnPack(state); state.playerHp = playerMaxHp(state);
      const tName = TIERS[heroTier(state)].name;
      logMsg(isTierPromo ? `🎉 TIER UP! Welcome, ${tName}!` : `✨ Ascension #${state.ascensions}! Keep pushing, ${tName}!`, "milestone");
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
  if (pendingOffline) showOfflineSummary(pendingOffline);
  setInterval(gameLoop, 100);   // combate
  setInterval(save, 15000);     // autosave a cada 15s
});
