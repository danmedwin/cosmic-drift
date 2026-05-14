# Cosmic Drift - Project Report

## Overview

Cosmic Drift is a mobile-first iOS-compatible arcade/puzzle block shooter built as a single React JSX file. The player controls a ship at the bottom of an 8x6 grid, firing plasma upward to destroy blocks. The game features chain reactions, 10 base block types + 6 crate variants, 5 power-ups, a 3-tier difficulty system (Easy/Regular/Hard with core caps), a level builder with walkthrough, custom level sharing via JSON export/import, and 17 hand-crafted "signature levels" woven into an infinite procedural campaign. A "Signature Levels" mode allows playing just the hand-crafted levels back-to-back. High scores and highest level reached are tracked persistently. Procedural sound effects (Web Audio API) and background music with mute controls. A standalone HTML version is hosted at techrabbi.org/cosmic-drift/.

**Created by:** Dan Medwin and Claude (Opus 4.6), 2026
**Current version:** v75
**File:** `CosmicDriftV75.jsx` (~2,807 lines)
**Platform:** React JSX artifact rendered in Claude.ai, optimized for iOS Safari
**Standalone:** `index.html` pre-compiled via Babel, hosted at techrabbi.org/cosmic-drift/

---

## Critical Code Constraints

**ALL code MUST follow these rules (iOS compatibility):**

- `var` declarations only (NO `let` or `const`)
- NO arrow functions (use `function(){}` everywhere)
- NO destructuring (use `_state[0]`, `_state[1]` pattern)
- NO template literals (use string concatenation with `+`)
- `Object.assign({}, obj, {key: val})` instead of spread (`{...obj, key: val}`)
- All text inputs must use `fontSize: 16` to prevent iOS zoom
- Touch handlers need `onTouchEnd` with `e.preventDefault()` alongside `onClick` for iOS keyboard dismissal

**CRITICAL: When adding new @keyframes to ANIM_CSS, use `\n` separators (single-escaped). The `str_replace` tool double-escapes `\\n` to `\\\\n`, which silently breaks CSS parsing. Use Python to edit ANIM_CSS instead.**

**Version numbering convention:**
- Bugfix/minor edits: decimal versions (e.g., v74.1, v74.2)
- New feature builds: whole numbers (v74, v75)
- `GAME_VERSION` constant at top of file, displayed in tester menu and Guide overlay

---

## Architecture

### Screens

| Screen | State | Description |
|--------|-------|-------------|
| `splash` | Start screen | Animated ship, drifting stars, Play/Builder/My Levels/Guide, Campaign/Signature toggle, high score display, FOR TESTERS button |
| `game` | Gameplay | Grid, ship, HUD, dropdown menu, tutorial overlays, training buttons (levels 1-9) |
| `builder` | Level editor | 8x6 grid editor with block palette, crate sub-panel, ship position, plasma setting, walkthrough tour |
| `mylevels` | Saved levels | List with Play/Edit/Rename/Delete/Export, sort, import |

### Game Modes

| Mode | Description |
|------|-------------|
| `campaign` | Default. Levels 1-9 (guided training with named levels), then infinite procedural + signature levels |
| `highlights` | Signature levels only (level 15+), played back-to-back. Fresh 3 cores per level, score carries over |

### Training Levels (1-9)

Levels 1-3 have named titles displayed in the game header:
| Level | Name |
|-------|------|
| 1 | Moving and Shooting |
| 2 | Power-up Blocks |
| 3 | Indestructible |

During levels 1-9 in campaign mode, two square buttons flank the tutorial text area at the bottom of the screen:
- **Retry Level** (left, reload icon): Regenerates the same level grid with fresh plasma. No core cost.
- **Skip Level** (right, fast-forward icon): Advances to the next level. No core cost or bonus.

Buttons appear during `playing` and `needsRecharge` states. When no tutorial text is present, a flex spacer keeps the buttons pinned to the sides.

### Game States

| State | Description |
|-------|-------------|
| `playing` | Active gameplay, player can fire |
| `needsRecharge` | Plasma depleted, waiting for player tap to recharge |
| `recharging` | Core-to-plasma conversion animation (600ms). Always restores 10 plasma regardless of level's starting plasma count |
| `bonus` | Level cleared, draining remaining plasma to bonus points |
| `lost` | All cores depleted, game over |

### Grid System

- **Dimensions:** 8 columns x 6 rows (COLS=8, ROWS=6)
- **Storage:** Flat 48-element array, index = row * COLS + col
- **Rendering:** CSS grid with `blockSize` calculated from viewport width
- **Constants:** GAP=5, BOARD_PAD=10

---

## Block Types

| Type | Name | WIN_EXEMPT | Behavior |
|------|------|-----------|----------|
| 1 | Standard | No | Destroyed for points, no chain |
| 2 | Cross Shot | No | Fires plasma in 4 cardinal directions |
| 3 | Lightning | No | Fires upward through ALL blocks in column (stops at indestructible/shielded force field) |
| 4 | Extra Core | No | Adds a reactor core when destroyed |
| 5 | Plasma Cell | No | Adds +3 plasma after 550ms delay when destroyed |
| 6 | Drone Strike | No | Flies to densest 3x3 area and explodes |
| 7 | Indestructible | Yes | Cannot be destroyed. Blocks plasma, lightning, and ooze |
| 8 | Acid Barrel | Yes | Ooze flows downward destroying blocks. Drains plasma if ooze reaches ship |
| 9 | Treasure Crate | Yes | Drops a random power-up when destroyed |
| 10 | Force Field | No | 2-hit shield. Spawns 2 regular blocks + 1 random power block when destroyed. Uses `pendingFFRef` counter (set synchronously in processHit) + `removingRef.size` guard to prevent premature level clear during 500ms eruption animation. All three level-clear paths (main win check, acid demo completion, recharge completion) are guarded |
| 11-15 | Specific Crates | Yes | Drone / Lightning / Cross / Split / Hammer power-up |
| 16 | Core Crate | Yes | Grants a Reactor Core when destroyed |
| 17 | UFO | Yes | Warps every 2 plasma shots. Drops EMP. See UFO section below |

---

## UFO (Block Type 17)

### Overview
The UFO is a mobile enemy entity that appears on procedurally generated levels starting at level 51. It is not required to destroy to win the level (WIN_EXEMPT). It occupies a grid cell like any block and is rendered as a copper-hulled flying saucer with a spinning 3-light stealth ring.

**Visual settings:** domeShape=classic, glassTint=aqua, hullRx=48, hullRy=14, metalColor=copper, rimStyle=smooth, lightCount=3, lightPalette=stealth, lightSpeed=8, beamOn=false, glowStrength=off

### Placement (v71.41+)
- Appears in the initial grid layout at level 51+
- Single UFO per level enforced: `grid.indexOf(17) < 0` check before placement
- Spawn priority: hidden rows 0-2, hidden rows 3-5, exposed rows 0-2, exposed rows 3-5 (always prefers hidden cells)
- Excluded from the `NEW_BLOCK_AT` guarantee placement and chosen-pool injection (dedicated placement handles it separately)
- Only placed on procedural levels; never signature levels
- Intro card appears at level 51 via `NEW_BLOCK_AT[51] = 17` and `BLOCK_INTROS[17]`

### Behavior State Machine

**Idle:** UFO sits in its cell. Shot counter at 0.

**Shot counter:** Incremented by `tickUfoCounter` at tap time (before the 60ms fire delay), only when: UFO is on the board AND ufoActiveRef=false AND empActiveRef=false. Counter frozen during both warp animations and the entire EMP sequence. Called from all three fire paths: grid tap, ship zone tap, and touch end handler. (v71.33 fixed missing `tickUfoCounter` call in ship zone handler.)

**On shot 2:** `ufoWarpArmedRef` flag is set at tap time. `fire()` picks it up 60ms later and queues `triggerUfoWarp()` with a 350ms delay. The 350ms gives chain-hit weapons time to destroy the UFO first.

**Warp sequence:**
1. `triggerUfoWarp()` fires: checks `ufoBeingDestroyedRef` (abort if UFO is mid-destruction) and `removingRef` (abort if removing). Sets `ufoActiveRef=true`.
2. UFO cell cleared from grid immediately (any in-flight plasma misses). `processedRef` and `removingRef` cleared for the new cell to prevent stale entries from previously-destroyed blocks (v72.1 fix).
3. `warpOut` animation: 500ms grow + fade
4. New cell chosen by `findEmpTargetIdx()` (see targeting logic below)
5. UFO written to new cell, `warpIn` animation: 600ms
6. `ufoActiveRef=false`, EMP drop starts immediately

**EMP drop:**
- Ball falls from UFO's column to ship row (~1.1s CSS animation)
- On impact: `empHit` sound always plays. Drain check: 50% plasma if ship same column, 25% if +/-1 column
- `empActiveRef=true` for entire sequence (fall + 1s after impact). Shot counter frozen throughout
- Bloom animation + electric sparks at impact point
- EMP continues to completion even if UFO is destroyed mid-flight (v72.3 fix)

**Destruction:**
- One hit from any weapon (plasma, drone, ZAP, split, cross shot, smash)
- `ufoBeingDestroyedRef` is set synchronously in `processedRef.current.add()` when type 17 is detected, preventing warp from firing during destruction sequence
- Drone/ZAP/split shots lock `ufoActiveRef=true` during travel time to prevent warp escape
- Block-triggered drones (type 6 in processHit) also lock `ufoActiveRef` during flight (v71.3 fix)
- Inventory drone scans full 3x3 blast area for UFO (not just center cell), and releases lock after processHit (v71.3 fix)
- Drone explosion VFX, +10 pts, EMP timers cancelled only if EMP not yet in flight, all refs reset

### Warp Targeting (`findEmpTargetIdx`)

6-tier priority (best to worst), all tiers prefer hidden over exposed. Cells sorted by ascending row within each tier:
1. Rows 0-2, hidden (block below), ship column
2. Rows 0-2, hidden, any column
3. Rows 3-5, hidden
4. Rows 0-2, exposed, ship column
5. Rows 0-2, exposed, any column
6. Rows 3-5, exposed

Additional rules:
- Never lands on the same cell it just warped from
- Plasma avoidance: exposed cells in columns with active canvas projectiles are skipped (hidden cells immune since a block absorbs the shot)

### Key Refs

| Ref | Purpose |
|-----|---------|
| `ufoPhaseRef` | 'idle' / 'warpOut' / 'warpIn' |
| `ufoActiveRef` | true during warp + drone/zap/split lock |
| `ufoBeingDestroyedRef` | set synchronously when processHit identifies type 17 |
| `ufoWarpArmedRef` | armed at tap time, consumed by fire() |
| `ufoShotCountRef` | 0-1, resets to 0 after warp triggers |
| `empActiveRef` | true during EMP fall + 1s after impact |
| `empTimerRef` | array of setTimeout handles for EMP sequence |
| `ufoLogRef` | circular log of 30 recent events for debug overlay |

### clearBoardState UFO resets (v71.3+)
All UFO refs are reset in `clearBoardState`: `ufoShotCountRef`, `ufoActiveRef`, `ufoBeingDestroyedRef`, `ufoWarpArmedRef`, `ufoPhaseRef`. Prevents stale flags from carrying across level transitions.

### Debug System

**"For Testers"** menu accessible from both the splash screen and the in-game dropdown menu (hamburger). Opens a bottom-sheet overlay (z-index 450) showing:
- Version number
- Jump to Level input (any level number)
- Release notes history
- Report a Bug email link

A `_shotTimingLog` array (last 20 shots) records `fireT`, `arriveT`, `hitT`, `popT` timestamps for diagnosing timing issues. Viewable in the For Testers menu under "DEBUG LOG (last 10)" with shot timing errors and callback delays. UFO event log (`ufoLogRef`, 30 entries) is maintained separately.

---

## Builder

### Block Palette Layout
Row 1: Standard (1), Cross Shot (2), Lightning (3), Plasma Cell (5), Crate (9)
Row 2: Drone (6), Indestructible (7), Acid Barrel (8), Force Field (10), UFO (17)

Extra Core (type 4) was removed from the builder palette in v71.32.

### Crate Sub-Panel
Tapping the Crate button opens a sub-panel above the palette showing crate variants (Random, Drone, Lightning, Cross, Split, Hammer). The Crate button gets a gold "opened lid" visual treatment when the panel is open (v71.32).

### UFO Builder Cap
Only one UFO per custom level. Enforced at 4 points:
1. Palette button grays out when UFO already on board
2. `builderCellAction` blocks placement with warning message
3. Touch drag handler skips UFO placement if one exists
4. Mouse drag handler skips UFO placement if one exists

Warning text: "Only one UFO allowed. Remove it from the board to place in a new location."

---

## Power-Ups

| Key | Name | Deploy | Effect |
|-----|------|--------|--------|
| `drone` | Drone Strike | Tap grid cell | 3x3 explosion. Locks UFO from warping during flight if targeting UFO |
| `lightning` | Lightning | Tap column | Zaps all blocks upward. Locks UFO from warping during ZAP sequence if UFO is in column |
| `crossshot` | Cross Shot | Tap block | Destroys block, fires plasma in 4 directions |
| `anglebounce` | Split Shot | Tap ship or column | Two diagonal bouncing plasma balls. Locks UFO from warping during travel if targeting UFO |
| `hammer` | Smash | Tap any block | Instantly destroys one block |

Power-ups can be armed and deployed during `needsRecharge` state.

---

## Difficulty System

| Tier | Core Cap | +1 Core on Level Clear |
|------|----------|----------------------|
| Easy | 5 | Yes |
| Regular | 3 | Yes |
| Hard | 3 | No |

### Core Economy

- Recharging from a core always restores 10 plasma (START_PLASMA), regardless of the level's starting plasma count
- When `gainCore` is called and the player is at their difficulty cap, the core converts to 5 points with an animated teal ball (bonusCharge VFX) flying from the cores HUD to the score HUD, matching the end-of-level plasma drain visual
- `triggerRecharge` will not fire while canvas projectiles are in flight (prevents premature game over on last shot of a bonus level)

---

## Performance Architecture (v72-v74)

### Memoized Components

| Component | Props | Skips re-render during |
|-----------|-------|----------------------|
| `GameGridMemo` | grid, removingBlocks, shakingBlocks, blockSize, burntBlocksRef, shieldRef, ufoPhase | Score, plasma, VFX, projectile, inventory changes |
| `HudPanelMemo` | baseCores, extraCores, plasma, maxPlasma, score, scoreFlash, gameState, setGameState | Grid, VFX, projectile, inventory changes |
| `InventoryBarMemo` | invDrones, invLightnings, invCrossShots, invAngleBounces, invHammers, armedItem, onArmItem, level, tutPhase, convertOffer, convertFlash, onConvert, isStuck, hasPowerUps, coreCount, gameState | Grid, VFX, projectile, score changes |

Style constants (`PNL`, `PNLB`, `SCRN`, etc.) are at module level to avoid recreating objects on each render.

### flushGrid Batching System

`flushGrid()` coalesces multiple state updates into a single `requestAnimationFrame` callback:

```
function flushGrid() {
  if (gridRafRef.current) return;  // skip if rAF already pending
  gridRafRef.current = requestAnimationFrame(function() {
    gridRafRef.current = null;
    setGrid(gridRef2.current.slice());
    setRemovingBlocks(new Set(visualRemovingRef.current));
    setVfx(vfxRef.current.slice());
    setProjectiles(projRef.current.slice());
    setShakingBlocks(new Set(shakingRef.current));
    setScore(scoreRef.current);
    setPlasma(plasmaRef.current);
  });
}
```

**Batched (via refs + flushGrid):** grid, removingBlocks (via visualRemovingRef), VFX (via vfxRef), projectiles (via projRef), shakingBlocks (via shakingRef), score (via scoreRef), plasma (via plasmaRef)

**Un-batched (direct setState for time-critical visuals):**
- `removeBlock`: calls `setRemovingBlocks` directly for immediate block pop animation start; also applies `blockPop`/`blockBurn` animation via direct DOM manipulation (`data-gi` attribute + querySelector)
- `firing`: uses ref + direct DOM style manipulation (no state at all)

**Collision vs Visual tracking:** `removingRef` tracks collision state (set early in fire() to prevent double-hits). `visualRemovingRef` tracks visual state (set in removeBlock when block actually starts popping). Only `visualRemovingRef` is synced to `removingBlocks` state.

### Canvas Particle & Projectile System

The HTML Canvas overlay (z-index 50, fixed position) handles both VFX particles and plasma projectiles in a single `requestAnimationFrame` loop. The loop auto-pauses when idle and restarts via `_kickCvfx()` on next spawn.

**Canvas Projectiles (v73.7):**
Plasma projectiles are drawn directly on the canvas rather than as React divs. Each projectile is a three-layer circle (outer glow, body, hot-spot) with position interpolated from `startY` to `endY` over `duration` ms. When `progress >= 1`, the `onDone` callback fires `processHit` in the same rAF frame. This eliminates the timing mismatch between CSS animations (which start on first paint, delayed by React rendering) and JavaScript setTimeout (which starts immediately). No setTimeout, no React render, and no CSS animation in the critical hit-detection path.

`_canvasProjectiles` array replaces the old React `projectilesRef`. Checked by `scheduleRechargeCheck` (length > 0 guard), `findEmpTargetIdx` (plasma avoidance), and `triggerRecharge` (prevents premature game over while shot in flight).

**VFX Particles (5 types):**
- `spawnBurnScatter` (18 particles per block: 12 colored + 6 white)
- `spawnPlasmaShatter` (8 particles, fadeIn effect, 36px spread, size 6)
- `spawnOozeSplash` (6 particles)
- `spawnFizzle` (6 particles + 1 ring)
- `spawnWallSpark` (5 particles)

**Optimizations:**
- Particle cap at 150 (`MAX_PARTICLES`): burnScatter and plasmaShatter skip spawning beyond cap
- Idle-pausing loop: canvas rAF stops when both particle and projectile arrays are empty, restarts via `_kickCvfx()` on next spawn
- FadeIn effect: shatter particles start invisible and fade in over first 30% of lifetime via `fadeIn` flag + `fadeInRate` multiplier

### Plasma Projectile Visual

- Speed: `PLASMA_SPEED = 0.85` px/ms
- Rendered as canvas circles: 12px outer glow (#50c8ff at 0.3 alpha), 7px body (#80ddff at 0.85 alpha), 3px hot-spot (#ffffff)
- `processHit` fires in the same rAF frame when the ball reaches the target (progress >= 1)

---

## Audio System

20 procedural SFX via Web Audio API (includes `ufoWarp` and `empHit`). Background music ("Space Fighter Loop" by Kevin MacLeod, CC BY 4.0). SFX/Music mute toggles on splash and game menu.

---

## Save System

Single save slot. "Save + Quit" on game menu. "Continue" on splash. `loadSaveGame` reads synchronously from `saveDataRef`. Save includes: level, score, grid, ship, plasma, inventory, cores, difficulty, game mode.

---

## Signature Levels

17 hand-crafted levels (15-90). UFO does not appear in signature levels. Level 90: "Ooze the Force".

---

## Build System

`node build.js` compiles JSX with `@babel/core` into a UMD bundle replacing the inline script in `index.html`. React 18 / ReactDOM 18 from unpkg CDN. `window.storage` shim wraps localStorage with `cd_` key prefix.

iOS webapp meta tags: `viewport` without `viewport-fit=cover`, `apple-mobile-web-app-status-bar-style` set to `default` (fixes touch offset issue where taps registered lower than finger position). Cache-control meta tags (`no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`) force iOS webapps to fetch the latest version on each load; localStorage (save data, high scores) is unaffected.

---

## Changelog

### V74-V75 - Canvas Projectiles, Training UX, Economy Fixes, FF Level Clear

#### Canvas Projectile System (v73.5-v73.7)
Resolved the plasma-to-block-pop delay on iOS. Root cause: CSS animations start on first paint (delayed by React rendering) while setTimeout starts immediately, creating a timing mismatch of 50-200ms on iOS. Attempted intermediate fixes:
- v73.5: Direct DOM manipulation (`projDomRefs`, `style.visibility = "hidden"`) -- still delayed because the setTimeout callback itself fires late when main thread is blocked
- v73.6: CSS compositor opacity trick (`opacity: 0` base style, `opacity: 1` in keyframes, no `forwards` fill-mode) -- still delayed on iOS Safari

Final solution (v73.7): Plasma projectiles moved from React divs with CSS animation to direct canvas rendering on the existing VFX canvas. Position interpolated via rAF, `processHit` fires in the same frame the ball arrives. No setTimeout, no React render, no CSS in the critical path. Canvas z-index raised from 40 to 50. `_canvasProjectiles` replaces `projectilesRef` in all consumers.

#### Training Level UX (v74-v74.5)
- Named training levels: Level 1 "Moving and Shooting", Level 2 "Power-up Blocks", Level 3 "Indestructible". Names shown in game header via `getLevelName()`.
- Retry Level / Skip Level buttons flanking tutorial text area during levels 1-9 in campaign mode. Square buttons with reload and fast-forward icons. No core cost for either action. Buttons use `introFadeIn` animation (not `tutFadeIn` which had `translateX(-50%)` causing a flash-left bug). When no tutorial text is present, a `flex: 1` spacer keeps buttons pinned to the sides.

#### Economy Fixes (v74-v74.2)
- Recharge always gives 10 plasma (`START_PLASMA`) regardless of level's starting count. Previously used `getLevelPlasma(level)` which could give fewer.
- `gainCore` at cap now shows animated teal ball (bonusCharge VFX) flying from cores HUD to score HUD before adding 5 points. 400ms delay before score update for visual clarity.
- `triggerRecharge` guards against `_canvasProjectiles.length > 0`, preventing premature game over while a shot is in flight on bonus levels.

#### Force Field Level Clear Fix (v74-v75)
When a force field is destroyed, it spawns 3 replacement blocks with a 500ms eruption animation. The win-check could fire during the animation window, declaring level clear prematurely. This was an extended debugging effort across multiple versions, ultimately revealing a platform-specific race condition between iOS Safari and iOS Home Screen webapp mode.

**Attempted fixes:**
- v74: Wrote spawned blocks to grid immediately. Fixed the timing but made blocks visible before the eruption animation completed.
- v74.1: `pendingFFRef` counter incremented when blocks spawn, decremented when each lands at 500ms. Win-check requires `pendingFFRef.current <= 0`. Fixed the artifact but not the iOS webapp.
- v74.6: Moved `pendingFFRef++` guard from inside processHit's `setTimeout(fn, 0)` to before `removeBlock()`. Still inside the setTimeout callback. Failed in webapp.
- v74.7: Moved `pendingFFRef++` guard to processHit's synchronous body (before the setTimeout is queued). Still failed in webapp.

**Root cause:** iOS Home Screen webapps may process React state updates differently from Safari. The `removeBlock` function calls `setRemovingBlocks()` as a direct (un-batched) setState. In webapp mode, this could trigger a synchronous re-render, firing the win-check useEffect before `pendingFFRef` was set (even when set synchronously). Additionally, the acid demo completion and recharge completion paths had no guards at all.

**Final fix (v74.8/v75):** Belt-and-suspenders guards on ALL three level-clear paths:
1. **Main win check useEffect:** `countDestructible() === 0 && pendingFFRef.current <= 0 && removingRef.current.size === 0`
2. **Acid demo completion (1000ms callback):** `countDestructible() > 0 || pendingFFRef.current > 0 || removingRef.current.size > 0` early return
3. **Recharge completion:** `countDestructible() <= 0 && pendingFFRef.current <= 0`

Plus `pendingFFRef++` set synchronously in processHit (line 1266), before the setTimeout is queued.

**Key learning:** iOS Home Screen webapp mode can exhibit different React rendering behavior than the same code in Safari. Guards relying on ref values set inside `setTimeout(fn, 0)` are insufficient; guards must be set synchronously in the calling function, and multiple independent guards (pendingFFRef + removingRef.size) provide defense in depth.

#### For Testers Menu (v74-v75)
Replaced "Shot Timing Debug" (v73.7) and "Copy UFO Debug" with a unified "For Testers" bottom-sheet accessible from both splash screen and in-game dropdown menu. Rendered at top level with `position: fixed, zIndex: 450` so it works on all screens. Includes version display, jump-to-level, release notes, report-a-bug email link, and a debug log showing shot timing data.

### V73 - Performance Optimization + UFO Bugfixes

#### Performance: Memoized Components (v72)
- `HudPanelMemo`: cores, plasma, score display. Only re-renders when its specific props change.
- `InventoryBarMemo`: 5 power-up slots + cancel button. Only re-renders when inventory/armed state changes.
- Style constants moved to module level.

#### Performance: State Batching (v72.4-v72.6)
- `flushGrid()` system coalesces grid, removingBlocks, VFX, projectiles, shakingBlocks, score, and plasma into a single rAF callback.
- `visualRemovingRef` separates collision tracking from visual animation, preventing blocks from disappearing when plasma is fired (before impact).

#### Performance: Canvas Particle Optimization (v72.7)
- Burn scatter reduced from 60 to 18 particles per block.
- Global particle cap at 150.
- Canvas loop pauses when idle (no particles), auto-restarts on spawn.

#### Performance: Un-batched Time-Critical Visuals (v73, v73.4)
- `firing` state converted to ref + direct DOM manipulation (saves 2 renders per shot).
- `shakingBlocks` batched into flushGrid via shakingRef.
- `score` and `plasma` batched into flushGrid via scoreRef/plasmaRef.
- `removeBlock` un-batched: calls `setRemovingBlocks` directly for immediate block pop animation start.

#### Plasma Visual Tuning (v73.1-v73.3)
- `PLASMA_SPEED` increased from 0.55 to 0.85 px/ms.
- `spawnPlasmaImpact` (impact ring) removed entirely.
- `spawnPlasmaShatter` particles: fadeIn effect (start invisible, fade in over first 30% of lifetime), 36px spread, size 6.
- Shatter particle lifetime shortened from 30 to 16 frames.
- Projectile box-shadow reduced from triple-layer to single for GPU performance.
- Projectile div removed when ball enters block cell (before reaching center).

#### UFO Bugfixes (v71.3-v72.3)
- `clearBoardState` now resets `ufoBeingDestroyedRef` and `ufoWarpArmedRef` (root cause of "stops warping after many shots").
- `tickUfoCounter` added to ship zone tap handler (root cause of "shots not counting" -- most iOS taps go through ship zone, not grid).
- Block-triggered drone (type 6) now locks `ufoActiveRef` during 650ms flight.
- Inventory drone scans full 3x3 blast area for UFO lock (was center cell only).
- Inventory drone releases `ufoActiveRef` after processHit loop (was before).
- `processedRef` and `removingRef` cleared for new cell when UFO warps in (prevents stale entries from making UFO invincible to lightning chains -- v72.1).
- Single UFO enforced in procedural levels via three guards in `generateGrid` (v71.41).
- UFO spawn prefers hidden cells, matching warp targeting priority (v71.42-v71.44).
- EMP continues if UFO is destroyed mid-flight (v72.3).
- Shielded Force Field now counts as destructible for win check (v72.2).

#### Builder Enhancements (v71.31-v71.4)
- UFO (type 17) added to builder palette.
- Palette reordered: Standard, Cross, Lightning, Plasma, Crate | Drone, Indestructible, Acid, Force Field, UFO.
- Extra Core (type 4) removed from palette.
- Crate button gets gold "opened lid" visual when sub-panel is open.
- UFO capped at 1 per custom level (enforced in palette, tap, touch drag, and mouse drag).

#### iOS Webapp Fix (v73)
- `viewport-fit=cover` removed and status bar style changed to `default`. Fixes touch offset issue where taps registered ~47px lower than finger position.

#### Removed
- FivePackIcon and five-pack core display logic removed (extra cores show as individual small icons).
- `spawnPlasmaImpact` function and all call sites removed.

---

## Known Issues

### iOS Splitter Drag
When Split Shot is armed, dragging the ship on iOS is unreliable. Tap-to-warp works. Desktop drag works fine.

---

## Custom Level JSON Format

```json
{
  "name": "Level Name",
  "grid": [48 integers, row-major order],
  "ship": 3,
  "plasma": 10,
  "savedAt": "5/10/2026, 3:00:00 PM"
}
```

Grid values 0-17 are valid. Array format supported for batch import.

---

## Next Tasks

1. **Gravity Block and Black Hole Block** - New block types (no specific level assignment yet)
2. **Dark level mechanic** - Level variant with limited visibility
3. **Front/back architecture concept** - Play as the "front door," with a builder + effects customizer as an unlockable "workshop" behind it; interactive labs (OozePlayground, BurnLab) as unlockable in-game rewards at milestone levels
4. **Develop cosmicdriftapp.com website** - Move HTML build from GitHub to new domain, forward techrabbi.org/cosmic-drift to new location
