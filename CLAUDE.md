# Éclats of Lumière

Browser-based idle/loot game (Map 1 focus). Vanilla JS, no framework, no build step for development. We are in active development of Map 1's core loop — finishing, not restarting.

---

## Stack

| Layer | Detail |
|-------|--------|
| Runtime | Browser (Chrome/Edge) |
| Language | Vanilla JS (ES5-compatible, no modules, no TypeScript) |
| Module system | Global `G` object — every module registers itself as `G.module = {...}` |
| Entry point | `index.html` loads CSS then JS via `<script>` tags (order matters) |
| CSS | Split into `styles/base.css`, `components.css`, `hud.css`, `gear.css`, `convergence.css`, `awaken.css`, `worldmap.css`, `passives.css` |
| Save | `localStorage` key `eclats_v4` (JSON). Falls back to in-memory if `file://` |
| Fonts | Google Fonts: Cormorant Garamond (display), Outfit (UI) |
| Dev server | `node .claude/static-server.js` or double-click `Jogar Eclats.bat` |
| Tests | None |
| Libraries | None in source code (node_modules has break_infinity.js but it is not imported) |

---

## Source Map

| File | Owns |
|------|------|
| `src/data.js` | All game constants: areas, enemies, rarities, gear base stats, balance params. **Tuning = edit here only.** |
| `src/util.js` | Pure helpers: `pick`, `weightedPick`, `chance`, `randInt`, `randFloat`, `clamp`, `fmt` |
| `src/state.js` | Single source of truth. `G.state.data` is the save object. Layered stat computation (`flat × (1+pct%) × mult`). `invalidateStats()` clears the cache. `save()` / `load()`. |
| `src/combat.js` | Game loop tick (called by `setInterval` in main). Spawn, projectile flight, kill/death, level-up, offline simulation. |
| `src/gear.js` | 6 fixed gear pieces. Level-up (geometric Lumens cost). Rarity promotion (Common → Uncommon). `affixValue(item, af)` is the stat formula. |
| `src/economy.js` | Material drop tables and storage (`gearMaterials`, `awakenMaterials`). Infrastructure only — no balancing yet. |
| `src/passives.js` | 3 passive trees: Éclat, Vestige, Fracture. `effects()` returns aggregated effect map. `effect(key)` returns a single value. |
| `src/awaken.js` | Awaken milestones (permanent progression gates). `canAwaken(id)`, `awaken(id)`. Bonus values in `data.awakens[].bonus` are placeholders. |
| `src/convergence.js` | Prestige reset. `converge()` resets level/XP/area, credits Convergence Points. Formula weights in `weights` are placeholders (only level term is active). |
| `src/ui.js` | DOM reads and writes only. No game logic. `renderAll()`, `renderEnemy()`, `renderHeroHp()`, `renderResources()`, `renderHero()`, `renderHud()`. |
| `src/main.js` | Init + two `setInterval` clocks (100ms combat, 1000ms UI). Offline progress on load. |

---

## How to Run

```
node .claude/static-server.js
# then open http://localhost:3000
```

Or double-click `Jogar Eclats.bat`. Do **not** open `index.html` directly as `file://` — localStorage is blocked and saves won't persist.

**Balance simulator** (headless, runs the real `src/` modules in Node — never mirror formulas by hand):

```
node tools/sim.js baseline [--to-level N] [--hours H]   # one run, no prestige: time-to-level, TTK/TTD per area
node tools/sim.js gates --gates 80,150,351              # time + points of the 1st Convergence per candidate gate
node tools/sim.js campaign --gate 351 [--push 2.0]      # full Map 1 loop to First Light
```

Seeded RNG (`--seed`), deterministic. Any balance change must be justified with sim output.

To reset save from the browser console: `G.state.reset(); location.reload()`

---

## Architecture Rules

**The G object is the entire module system.** All modules live on `G`. Script load order in `index.html` is the dependency order — do not reorder.

**State mutation flow:**
1. Mutate `G.state.data.*` directly
2. Call `G.state.invalidateStats()` if the change affects any stat (atk, hp, crit, critDmg, atkSpeed, xpBonus, lumensBonus)
3. Call `G.ui.renderAll()` (or a specific render) to reflect the change on screen
4. Call `G.state.save()` if the change should persist

**Stat computation** (`state.js:stats()`):
- Sources accumulate into layers: `flat`, `pct`, `mult`
- Final value = `flat × (1 + pct/100) × mult`
- Order of sources: base+level → gear affixes → Awaken bonuses → passive effects
- HP→Damage conversion (Éclat passive) runs last, after HP is finalized
- `_statsCache` is valid until `invalidateStats()` is called

**Data is the only place for numbers.** Balance constants live in `G.data.balance`. Enemy stats in `G.data.areas[].enemies`. Gear stats in `G.data.gearBase`. Do not hardcode numeric values in logic files.

**Rendering is explicit, not reactive.** There is no observer or virtual DOM. After any state change, call the appropriate render function manually.

**Module defensiveness:** modules check `if (G.economy)`, `if (G.passives)`, `if (G.ui)` before calling siblings. Preserve this — it prevents crashes if load order shifts.

---

## Scope Rules

**Work on:**
- Map 1 content and balance (9 areas, gear system, passives, Awaken, Convergence)
- UI and rendering bugs
- Data balance in `src/data.js`
- Completing partially-built systems (gear promotion UI, materials display, mini-boss/elite encounters)

**Do not touch:**
- Mémoires system — not yet scoped for implementation
- Ascension/Divinity system — not yet scoped for implementation
- Map 2 content — not in scope until Map 1 ships

**Do not add:**
- New systems not already in the codebase or explicitly requested
- TypeScript, bundlers, frameworks, or build steps
- New dependencies (no npm installs)
- Abstractions that don't solve an immediate problem
- Comments that describe what the code does (read the code)

**Before adding a new file**, ask: does this belong in an existing file? The 13-module structure is intentional.

---

## Code Style

**Language:** Vanilla JS. ES6 syntax (arrow functions, const/let, destructuring, template literals) is fine. No classes (not used anywhere). No ES modules (`import`/`export`).

**Naming:**
- Functions: `camelCase`
- Constants/config: `camelCase` (no ALL_CAPS)
- Module methods: short, direct (`spawn`, `tick`, `onKill`, `levelUp`)
- DOM IDs: `kebab-case` (match existing IDs in `index.html`)

**UI text:** Always in English. Game log messages, button labels, stat names — English only.

**No defensive error handling for internal calls.** Trust that `G.state.data` exists when a module runs. Only validate at real boundaries (localStorage parse, user input).

**No comments explaining what the code does.** The code already does that. Only comment a non-obvious constraint or workaround.

**Formatting:** 2-space indent (match existing files). No trailing whitespace.

---

## Game Systems Reference

### Combat
- 10 ticks/second (`setInterval 100ms`). Each tick calls `combat.tick(dt)`.
- Player attacks at `1 / atkSpeed` seconds. Enemy attacks at `0.99s` fixed.
- Projectile flight of `0.5s` before damage applies (matches CSS transition).
- On player death: full heal, enemy respawns at full HP. No penalty. This is intentional — gear is the wall.
- Level up: XP curve `xpCurveBase × level^xpCurveExp` (14 × L^1.62 — kills/level rise with level). Mob level = player level, clamped to area range.

### Gear (6 fixed pieces)
- weapon, helmet, armor, gloves, boots, cloak — always equipped, never swapped.
- Level up with Lumens: cost = `gearCostBase × gearCostGrowth^(level-1)`.
- Cap by rarity (`data.rarities[].cap`): Common = 500, Uncommon = 1500, Rare = 3000.
- Promote Common → Uncommon: requires max level + materials (`economy.getGear`).
- Balance: **only `src/data.js` controls `gearBase`, `gearCostBase`, `gearCostGrowth`**.

### Economy / Materials
- `gearMaterials: { common, uncommon }` — for gear rarity promotion.
- `awakenMaterials: { firstLight }` — for Awaken milestones.
- Drop table in `economy.dropTable` — all values are placeholders.
- Passive modifiers (Vestige: `matQuantity`, `matGeneralPct`, etc.) are wired but inert (passive values are 0 in `data.js`).

### Passives (3 trees)
- **Éclat** — offensive: ATK%, HP%, Crit, CritDmg, BossDmg, EliteDmg, HP→Damage
- **Vestige** — economy: Lumens%, XP%, materials, drop rate
- **Fracture** — Convergence meta: Convergence Points, Awaken efficiency, upgrade cost reduction, elite chance

Unlock with Convergence Points. Passive effects aggregate in `passives.effects()` — called once per stat computation.

### Awaken
- Permanent milestone gates (not a prestige). 
- Requirements: area reached, level, totalKills, convergences, materials.
- `data.awakens[].bonus` values are placeholders — magnitudes not balanced.
- `awaken.applyTo(layer)` injects bonuses into the stat layer system.

### Convergence (Prestige)
- Gate: level ≥ 80 (placeholder — canonical gate is area 3 clear).
- Formula: `Pontos = area + bosses + level + kills`. Only the level term is active (weights for others are 0).
- Resets: level, XP, Lumens, area, run counters.
- Keeps: gear, materials, passives, awakens, Convergence Points, records.

---

## Common Mistakes

**Do not call `G.ui.renderAll()` without calling `invalidateStats()` first** when a stat source changed. The render reads cached stats that may be stale.

**Do not modify `data.js` constants inside logic files.** They are read-only configuration. If a value needs to change dynamically, it belongs in `state.data`, not in `G.data.balance`.

**Do not write to `G.state.data` from `ui.js`.** ui.js is read-only with respect to state.

**Do not use `Math.random()` inside tests or idle simulation.** Pass an `rng` option (see `economy.rollDrops(enemy, opts)` pattern).

**Do not create new global variables.** Everything goes on `G`.

**Do not implement Mémoires, Ascension, or Map 2 features.** These are not in scope for current work.

**Awakening Essence (`awakenEssence`) is a legacy field.** It migrates to `awakenMaterials.firstLight` on load. Do not use it for new code.

---

## Before You Code

Answer these before writing anything:

1. Which file owns this change? (Check Source Map above — do not create a new file unless forced.)
2. Does this change any stat source? → call `invalidateStats()` after.
3. Does this change visible state? → call the right render function after.
4. Is the value I'm writing a constant? → it goes in `data.js`, not inline.
5. Am I adding a feature not currently in the codebase? → confirm it's in scope first.
6. Does `G.state.save()` need to be called? (Only for persistent state changes.)
