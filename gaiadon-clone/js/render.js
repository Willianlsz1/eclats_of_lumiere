// ===== Render dispatch =====
// Maps state-change categories to render functions.
// Callers declare *what changed*; this module decides *which functions fire*.

const RENDER_DISPATCH = {
  resources:  [renderResources],
  combat:     [renderCombat],
  hero:       [renderHero],
  equipment:  [renderEquipment, renderSynergy],
  ascension:  [renderAscend],
  map:        [renderMap],
  goldStats:  [renderGoldStats],
  passives:   [renderPassives],
};

function scheduleRender(dirty, state) {
  for (const cat of dirty) {
    const fns = RENDER_DISPATCH[cat];
    if (fns) fns.forEach(fn => fn(state));
  }
}

// Convenience: re-render everything (startup, reset, ascension).
function renderAll(state) {
  scheduleRender(new Set(["resources", "combat", "hero", "equipment", "ascension", "map", "goldStats", "passives"]), state);
}
