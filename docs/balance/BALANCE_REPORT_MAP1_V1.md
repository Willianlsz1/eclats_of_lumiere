# Balance Report — Map 1, Day 1 Rewrite
**Date:** 2026-06-24  
**Scope:** Areas 1–9, gear system, XP curve, Lumens economy  
**Status:** Research + audit + plan verified. Nothing implemented yet.

---

## 1. Research Synthesis

### Kill Time Targets (industry consensus)
- **Farming zone:** 2–5s per mob. Sub-1s feels trivial; >10s signals "wrong zone."
- **Boss:** 15–30s. Hard timers (Clicker Heroes) skip at 30s to preserve forward momentum.
- **Frontier (wall zone):** 30–60s or full fail — this IS the "buy more power" signal.

### HP Jump Between Zones
- **Safe range:** 1.5×–4× per area transition.
- **Idle Champions:** ~2.03× per zone. Clicker Heroes: ~1.55× early, ~1.14× late.
- **Rule:** zone HP should be clearable with gear at the zone's entry level — not by over-grinding the previous zone.

### XP Per Kill Ratios
- **Early game target:** 10–20 kills per level.
- **Mid/late game target:** 30–50 kills per level (rising, to signal the prestige gate).
- Formula baseline: `xpToNext = 10–14 × level` (linear) — standard, but creates a flat curve.

### Currency Economy
- Upgrade costs grow exponentially (×1.1–1.15 per level); income grows polynomially or linearly.
- Early game: production outpaces costs (hooked feeling).
- Mid game: cost wall kicks in (friction the gear gate solves).
- Late game: prestige multiplier restores surplus faster than grinding.
- **Design rule:** the crossover point (cost > income) is the intentional wall. Design it, don't stumble into it.

### First Prestige Gate Timing
- Genre consensus: **20–40 minutes** of active play on the first run.
- Signal to prestige: XP/hour or DPS drops to ~10–20% of its peak rate.
- Runs requiring 60+ minutes before the first prestige cause early abandonment.

### Sources consulted
- The Math of Idle Games (GDC / Gamedeveloper.com, Parts I & III)
- Balancing Tips: Idle Idol (Gamedeveloper.com)
- Clicker Heroes Zone Farming Guide
- Firestone Idle RPG community data
- Idle Champions campaign area data
- Eric Guan — Idle Game Design Principles

---

## 2. Mathematical Analysis

### 2.1 XP Speed (current: linear formula)

```
xpToNext(L) = ceil(14 × L)
xp per kill = 10 × mobLevel  (mobLevel = playerLevel in area 1)
ratio = 14/10 = 1.4 → always exactly 2 kills per level, L1 to L79
```

**Total XP to level 80:** `14 × (79×80/2) = 44,240`  
**Total kills to level 80:** `158 kills` (constant 2 per level)

**Time per kill:**
- Level 1: ATK=1000, mob HP=2000 → 2 hits × 1.11s + 1s respawn = 3.2s
- Level 40: ATK~1078, mob HP~2242 → 3 hits × 1.11s + 1s = 4.3s
- Level 79: same as L40 → 4.3s

**Total time to level 80:** ~8 kills × 3.2s + 150 kills × 4.3s ≈ **676s ≈ 11 minutes**

**Problem:** The 14:10 XP ratio is constant at every level. The leveling curve has no shape. A player gets zero feedback that they're growing stronger or hitting a wall. It is a metronome.

---

### 2.2 Lumens Economy (current values)

```
lumens per kill = ceil(mobHP × 0.25) × (1 + lumensBonus/100)
lumensBonus base = 10 + level × 0.05  → ranges 10.05% (L1) to 14% (L80)
```

**Income from 100–200 area-1 kills** (including rare mob variance ×1.22):
| Kills | Est. Lumens |
|-------|------------|
| 100   | ~68,000    |
| 200   | ~136,000   |

**Gear cost to level ONE piece:**
| Target Level | Cost (gearCostBase=1100, growth=1.05) |
|---|---|
| 1 → 50  | ~218,000 Lumens |
| 1 → 100 | ~2,871,000 Lumens |
| 1 → 500 | ~875 billion Lumens |

**All 6 pieces to level 50:** ~1,310,000 Lumens  
**What player can afford with 100–200 kills:** gear level **~10–15 per piece** only.

**Conclusion:** Economy is hard-starved in area 1. The player cannot reach gear level 50 on even one piece before the boss gate. This is structurally broken without a prestige loop (Convergence) as a safety valve.

---

### 2.3 HP Walls Between Areas

Mob HP at area boundaries (formula: `hp[0] × growth^(level - lo)`):

| Transition | Area N end HP | Area N+1 start HP | Jump Ratio | Classification |
|---|---|---|---|---|
| A1 → A2 | 2,500 | 40,000 | **×16** | Hard Stop |
| A2 → A3 | 80,000 | 1,000,000 | **×12.5** | Hard Stop |
| A3 → A4 | 3,000,000 | 20,000,000 | **×6.67** | Fair Wall |
| A4 → A5 | 80,000,000 | 400,000,000 | **×5** | Fair Wall |
| A5 → A6 | 1,500,000,000 | 6,000,000,000 | **×4** | Fair Wall |
| A6 → A7 | 20,000,000,000 | 40,000,000,000 | **×2** | Too Soft |
| A7 → A8 | 100,000,000,000 | 120,000,000,000 | **×1.2** | Too Soft |
| A8 → A9 | 200,000,000,000 | 220,000,000,000 | **×1.1** | Too Soft |

**Target range:** 3×–8× per transition. Areas 1–2 transitions are 2–5× above the ceiling. Areas 7–9 transitions are virtually nonexistent.

**Mob ATK scaling:** `45 × 1.00085^(level-1)`
- Level 80: 48 ATK — cosmetically inert
- Level 350: 60.5 ATK — player barely notices
- Level 1700: 190 ATK — starting to matter
- Level 5000: 3,155 ATK — relevant only at endgame

Mob ATK is effectively irrelevant as a threat for the entire early/mid game. HP investment has no reason to exist in areas 1–4.

---

### 2.4 Gear Power Curve

**Player ATK at level 80, all gear at level N:**

```
ATK flat = 1158 + 20×(N-1)       [weapon]
ATK pct  = (N-1) + (N-1) = 2×(N-1)%   [weapon + cloak]
Final ATK = flat × (1 + pct/100)
```

| Gear Level | Final ATK | ATK Multiplier vs base |
|---|---|---|
| 1   | 1,158    | 1.00× |
| 50  | 4,233    | 3.66× |
| 100 | 9,351    | 8.07× |
| 200 | 25,587   | 22.1× |
| 500 | 122,295  | 105.6× |

**ATK crossover points:**
- 10× base ATK → gear level **~117**
- 50× base ATK → gear level **~328**
- 100× base ATK → gear level **~485** (nearly the Common cap of 500)

**HP at gear level N (same player, level 80):**

```
HP flat = 1158 + 20×(N-1)       [helmet]
HP pct  = (N-1)%                  [armor only — one source]
Final HP = flat × (1 + pct/100)
```

| Gear Level | Final HP | HP Multiplier |
|---|---|---|
| 1   | 1,158   | 1.00× |
| 50  | 3,186   | 2.75× |
| 100 | 6,245   | 5.39× |
| 200 | 15,363  | 13.3× |
| 500 | 66,717  | 57.6× |

**Problem:** ATK scales 105× at cap; HP scales only 57×. The player is inadvertently a glass cannon — not by design, but because ATK has two pct sources (weapon + cloak) while HP has only one (armor).

---

## 3. Issue Audit

11 issues total: **3 critical, 5 major, 3 minor.**

### Critical

| ID | System | Description |
|---|---|---|
| **B-01** | Convergence / Awaken | `convergence.js` and `awaken.js` do not exist. CLAUDE.md identifies both as required power gates for area progression. Without them, there is no prestige path and no permanent power layer beyond gear + forge. All HP-wall analysis that assumed Convergence would bridge gear gaps is computing a broken assumption. |
| **B-02** | HP Walls | A1→A2 jump is ×16. A player clearing the area 1 boss has gear ~Lv.10–20. Area 2 mobs at 40,000 HP take ~20–30s per kill at that power level. With Convergence absent (B-01) there is no escape. Day 1 playtest cannot reach area 2. |
| **B-03** | HP Walls | A2→A3 jump is ×12.5. At gear Lv.100 (~2.87M Lumens to reach), DPS is ~24,600. Area 3 start HP = 1,000,000 → 40s kill time while player survives ~79s. Near-certain hard stop. Areas 1–3 are supposed to be reachable in 30–60 min. |

### Major

| ID | System | Description |
|---|---|---|
| **B-04** | XP / Leveling | XP cost (`14L`) and XP per kill (`10L`) both scale linearly with level. Ratio is always 1.4 → always 2 kills per level. No acceleration, no deceleration, no tension. The early game has no shape. |
| **B-05** | Lumens Economy | Economy is hard-starved in area 1. Players earn ~68K–136K Lumens from 100–200 kills. A single gear piece to Lv.50 costs 218K. Without Convergence, there is no way to fund meaningful gear before the boss gate. |
| **B-06** | lumensBonus | Base formula `10 + level × 0.05` gives 10.05% at L1, 14% at L80 — a 4-percentage-point gain over 79 levels. Cosmetically negligible. Income does not feel like it grows during a run. |
| **B-07** | Late HP Walls | Areas 6–9 transitions are ×2, ×1.2, ×1.1. Within-area curves are also nearly flat (Area 8: 120B→200B = ×1.67 across 900 levels). Endgame has zero resistance and will be trivialized the moment it is reached. |
| **B-08** | Gear HP/ATK Asymmetry | ATK: 106× at cap (two pct sources). HP: 58× at cap (one pct source). Player is a glass cannon at high gear levels by accident, not design. |

### Minor

| ID | System | Description |
|---|---|---|
| **B-09** | Gear ATK Curve | 100× ATK crossover at gear Lv.~485 — consuming virtually the full Common cap. Weapon perLevel=20 is undersized; doubling to 40 shifts 100× crossover to ~Lv.360, leaving the 360–500 range as post-Convergence headroom. |
| **B-10** | Boss Reward | Area 1 boss awards only ~15,000 Lumens (10–22% of total run earnings). A named boss gate at level 80 should feel like a meaningful inflection point. |
| **B-11** | Mob ATK | `mobAtkGrowth = 1.00085` makes mob ATK irrelevant through areas 1–4. HP investment has no early-game reason. Death has no early-game consequence. |

---

## 4. Proposed Balance Plan

All changes go in `src/data.js` or the stat initializers in `src/state.js` (formula-only lines, no game logic).

### 4.1 Economy Changes

| Constant | File | Current | Proposed | Reason |
|---|---|---|---|---|
| `balance.goldRatio` | `data.js` | `0.25` | `0.55` | Income rises to ~1,210–1,513 Lumens/kill in area 1. 700 kills (new level-80 requirement) yields ~950K Lumens — enough to fund 6 pieces to Lv.50 at the new cost base. Industry range: 0.40–0.75 in early areas. |
| `balance.gearCostBase` | `data.js` | `1100` | `250` | Level 50 single piece: ~50K Lumens (was 218K). Level 100 single piece: ~652K. Level 500 single piece: ~200B. Exponential shape preserved; absolute magnitude corrected to match income. |
| `balance.mobAtkGrowth` | `data.js` | `1.00085` | `1.0015` | L80: 50.7 ATK (gentle in A1). L350: 75.9 ATK (HP pressure starts). L700: 128 ATK. L1700: 574 ATK. Creates a rising threat curve that makes HP gear worth buying from area 2 onward. |

### 4.2 Area HP Walls

| Area | Constant | Current | Proposed | Jump ratio (after) |
|---|---|---|---|---|
| Area 2 Lantern Mire | `hp[0]` | 40,000 | **8,000** | A1→A2: ×3.2 ✓ |
| Area 3 Whispering Hollows | `hp[0]` | 1,000,000 | **250,000** | A2→A3: ×3.1 ✓ |
| Area 3 Whispering Hollows | `hp[1]` | 3,000,000 | **1,500,000** | Prevents A3→A4 from becoming ×13 after A4 hp[0] fix |
| Area 4 Moonlit Canopy | `hp[0]` | 20,000,000 | **4,500,000** | A3→A4: ×3.0 ✓ |
| Area 7 Hollow Cathedral | `hp[0]` | 40,000,000,000 | **60,000,000,000** | A6→A7: ×3.0 ✓ |
| Area 7 Hollow Cathedral | `hp[1]` | 100,000,000,000 | **300,000,000,000** | A7 internal: ×5 over 800 levels (was ×2.5). Fixes grinding desert. |
| Area 8 Weeping Roots | `hp[0]` | 120,000,000,000 | **350,000,000,000** | A7→A8: ×1.17 (soft but A7 end is now 300B) |
| Area 8 Weeping Roots | `hp[1]` | 200,000,000,000 | **1,200,000,000,000** | A8 internal: ×3.43 over 900 levels (was ×1.67) |
| Area 9 Hollow Sanctum | `hp[0]` | 220,000,000,000 | **1,800,000,000,000** | A8→A9: ×1.5 — deliberate exception, final area narrative payoff |
| Area 9 Hollow Sanctum | `hp[1]` | 350,000,000,000 | **5,000,000,000,000** | Final boss HP = 5T × 4 = 20T. A genuine Map 1 climax. |

### 4.3 Gear Stat Changes

| Affix | File | Current | Proposed | Reason |
|---|---|---|---|---|
| `gearBase.weapon affixes[0].perLevel` (ATK flat) | `data.js` | `20` | `40` | 10× ATK crossover shifts from Lv.117 → Lv.77. 100× crossover: Lv.485 → Lv.360. Players see visible power milestones within the Common cap. |
| `gearBase.armor affixes[0].perLevel` (HP pct) | `data.js` | `1` | `2` | HP cap scaling matches ATK cap scaling (~106×). Eliminates accidental glass-cannon. |

### 4.4 Formula Changes

| Formula | File | Current | Proposed | Reason |
|---|---|---|---|---|
| `xpToNext()` | `state.js` | `Math.ceil(14 * this.data.level)` | `Math.ceil(14 * Math.pow(this.data.level, 1.5))` | Kills per level at L1=2, L50=10, L80=12.5. Total ~700 kills to L80 ≈ 33 min. Creates visible deceleration near the area 1 cap — the "I need more power" signal. |
| `lumensBonus` base slope | `state.js` | `10 + d.level * 0.05` | `10 + d.level * 0.15` | Base lumensBonus at L80: 22% (was 14%). Combined with cloak gear at L40: ~66% total. Income ramp is visible within a single run. |

### 4.5 Blocked Changes

| Change | Reason Blocked | Alternative |
|---|---|---|
| `balance.bossRewardMult: 6 → 14` | **bossRewardMult is never applied to Lumens in `combat.js`.** It only multiplies XP (`xp *= b.bossRewardMult` in `spawn()`). The Lumens formula is `lumens = maxHp * b.goldRatio`, which uses `bossHpMult` not `bossRewardMult`. Changing this to 14 would only inflate boss XP by 14×, giving ~11,200 XP vs `xpToNext(80)=10,018` — causing an unintended level-skip on boss kill. | Add a separate `bossLumenMult: 5` constant to `balance` and apply it in `combat.js spawn()` as `lumens *= b.bossLumenMult` when `isBoss=true`. At new goldRatio=0.55: boss drops 27,500 base Lumens ≈ 20 equivalent regular kills — a meaningful milestone reward. |
| `areas[6] hp[0]: 40B → 60B` (alone) | Fix is incomplete. Changing A7 entry to 60B while leaving hp[1] at 100B creates ×1.67 internal growth over 800 levels — the flattest area in the game, a grinding desert. Must be paired with hp[1] change. | Apply `hp[0]=60B` AND `hp[1]=300B` together (5× internal range, 1.00202×/level — matches other areas). This also makes A7→A8 transition = 350B/300B = 1.17×, which is soft but acceptable given A8's new hp[1]=1200B creates subsequent pressure. |

---

## 5. Verification Verdict

**Verdict: `approved_with_changes`**  
14 of 17 changes approved. 2 blocked. 1 mandatory fix required.

### Problems Found by Adversarial Check

1. **[CRITICAL] bossRewardMult misread in combat.js** — confirmed blocked (see §4.5 above).

2. **[CRITICAL] Income model uses wrong kill count** — Plan uses 250 kills as baseline, but the proposed `level^1.5` XP formula requires ~700 kills to reach level 80. At 700 kills: ~950K–1M Lumens (with cloak affix stacking). Six pieces to Lv.50 at new gearCostBase=250 costs ~298K. Player has a ~700K Lumens surplus on reaching the boss gate — they will grind gear well past Lv.50 before being income-limited. The economy is looser than the plan describes but not broken: the gear cost curve (×1.05/level geometric) will absorb the surplus in area 2.

3. **[CRITICAL] lumensBonus is underestimated in the plan** — At cloak Lv.40, the cloak affix alone adds 44% lumensBonus. Combined with new base formula at L80: total lumensBonus ≈ 66%, not 10% as the plan models. Economy is ~51% richer than stated — acceptable but the plan undersells the combined effect.

4. **[MAJOR] A7 internal growth flat — confirmed blocked** (see §4.5 above).

5. **[MAJOR] Save migration required for `xpToNext` change** — A player at level 40 with XP=500 (89% to next level under old formula) would see `xpToNext(40)` jump from 560 to 3,542. Their progress resets to 14% of the new threshold. **Required fix: bump save key from `eclats_v3` to `eclats_v4`** — clean break, no migration code needed, consistent with existing pattern.

6. **[MAJOR] bossRewardMult=14 inflates boss XP unintentionally** — Boss XP = `10 × 80 × 14 = 11,200` vs `xpToNext(80) = 10,018`. Boss kill grants 1.12 levels worth of XP, pushing player to level 81 with banked XP. Minor unintended effect, resolved by keeping `bossRewardMult: 6` and adding separate `bossLumenMult`.

7. **[MINOR] A8→A9 transition at ×1.5 explicitly violates the 3–8× rule** — Intentional exception for the final area narrative payoff. Must be documented in `data.js` so future edits don't "fix" it.

8. **[MINOR] Areas 5–6 not reviewed** — A5 and A6 internal growth (×3.75 and ×3.33) are unverified against the new mobAtkGrowth. Mob ATK at area 5 mid-point (L~1400) = 45 × 1.0015^1399 ≈ 252. Check HP gear vs mob ATK here before finalizing.

9. **[MINOR] lumensBonus at L5000 = 760%** with new slope — Not game-breaking (still bounded by mob HP), but stat loses meaning at endgame. Flag for review when area 9 is being playtested.

### Approved Changes Summary

| # | Change | Status |
|---|---|---|
| 1 | goldRatio: 0.25 → 0.55 | ✅ Approved |
| 2 | gearCostBase: 1100 → 250 | ✅ Approved |
| 3 | bossRewardMult: 6 → 14 | ❌ Blocked — does not affect Lumens |
| 4 | mobAtkGrowth: 1.00085 → 1.0015 | ✅ Approved |
| 5 | Area 2 hp[0]: 40K → 8K | ✅ Approved |
| 6 | Area 3 hp[0]: 1M → 250K | ✅ Approved |
| 7 | Area 3 hp[1]: 3M → 1.5M | ✅ Approved |
| 8 | Area 4 hp[0]: 20M → 4.5M | ✅ Approved |
| 9 | Area 7 hp[0]: 40B → 60B (alone) | ❌ Blocked — must include hp[1] fix |
| 9b | Area 7 hp[0]: 40B → 60B + hp[1]: 100B → 300B | ✅ Alternative approved |
| 10 | Area 8 hp[0]: 120B → 350B | ✅ Approved |
| 11 | Area 8 hp[1]: 200B → 1,200B | ✅ Approved |
| 12 | Area 9 hp[0]: 220B → 1,800B | ✅ Approved (deliberate ×1.5 exception) |
| 13 | Area 9 hp[1]: 350B → 5,000B | ✅ Approved |
| 14 | weapon flat ATK perLevel: 20 → 40 | ✅ Approved |
| 15 | armor HP pct perLevel: 1 → 2 | ✅ Approved |
| 16 | xpToNext: linear → level^1.5 | ✅ Approved (requires save key bump) |
| 17 | lumensBonus slope: 0.05 → 0.15 | ✅ Approved |
| — | bossLumenMult: (new) → 5 | ✅ Add to replace blocked change #3 |
| — | Save key: eclats_v3 → eclats_v4 | ✅ Required alongside change #16 |

---

## 6. Expected Session Flow (after changes)

1. **Minutes 0–5:** Area 1 opens. First mob (Candlewisp Shade, HP~2000) dies in 2 hits. Kills: Lumens ~1,200/kill. Gear levels up visibly every few kills.

2. **Minutes 5–20:** Player around level 20–30. Gear pieces at Lv.15–25. XP curve (`level^1.5`) starts to slow — leveling takes 5–7 kills per level. Kill time stays 1–3s. Income compounds through cloak affix.

3. **Minutes 20–33:** Level 50–80. Gear at Lv.30–50. Kill time 2–4s. XP takes 10–12 kills per level — the "I need to upgrade more" signal fires. Lumens surplus is large enough to push multiple pieces to Lv.40–60 before the boss gate.

4. **~Minute 33:** Level 80 reached. Area 1 boss (The Waking Bloom, HP=10,000) spawns. Player ATK ~6,000–10,000 at this point — boss dies in 2–4 hits. Boss drops ~27,500 Lumens (bossLumenMult proposal).

5. **After boss:** Area 2 unlocks. Entry HP = 8,000 (was 40,000). Player in their 1–2 hit range. Area 2 progression mirrors area 1 but slower — gear levels 50→100 cost exponentially more, creating the natural income wall where **Convergence (prestige)** should be implemented next.

---

## 7. What This Report Does NOT Resolve

- **B-01 (Convergence / Awaken absent):** No code exists for these systems. They must be implemented before the game can be meaningfully playtested past area 2. The balance proposals above create a stable area 1 loop without them, but they remain the critical missing piece for Map 1 completion.
- **Areas 5–6 internal growth:** Unverified against new mobAtkGrowth. Needs a second pass once B-01 is addressed (Convergence compounding changes the calculation).
- **Forge balance:** `forgeCostBase=20, forgeCostGrowth=1.064` untouched. Not flagged as an issue but not verified either.
- **Passive trees, Awaken bonuses, Convergence formula:** Out of scope for Day 1 (systems don't exist yet).
