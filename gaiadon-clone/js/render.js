// ===== Render dispatch =====
// Maps state-change categories to render functions.
// Callers declare *what changed*; this module decides *which functions fire*.
// Throttle timing stays with callers — this module is stateless.
//
// Categories:
//   "resources"  → renderResources
//   "combat"     → renderCombat, renderNextGoal
//   "hero"       → renderHero
//   "equipment"  → renderEquipment
//   "ascension"  → renderAscend

const RENDER_DISPATCH = {
  resources:  [renderResources],
  combat:     [renderCombat, renderNextGoal],
  hero:       [renderHero],
  equipment:  [renderEquipment, renderSynergy],
  ascension:  [renderAscend],
};

function scheduleRender(dirty, state) {
  for (const cat of dirty) {
    const fns = RENDER_DISPATCH[cat];
    if (fns) fns.forEach(fn => fn(state));
  }
}

// Convenience: re-render everything (startup, reset, zone change, ascension).
function renderAll(state) {
  scheduleRender(new Set(["resources", "combat", "hero", "equipment", "ascension"]), state);
}
