# Cosmic Drift - Project Report

## Overview

Cosmic Drift is a mobile-first iOS-compatible arcade/puzzle block shooter built as a single React JSX file. The player controls a ship at the bottom of an 8x6 grid, firing plasma upward to destroy blocks. The game features chain reactions, 10 base block types + 6 crate variants, 5 power-ups, a 3-tier difficulty system (Easy/Regular/Hard with core caps), a level builder with walkthrough, custom level sharing via JSON export/import, and 17 hand-crafted "signature levels" woven into an infinite procedural campaign. A "Signature Levels" mode allows playing just the hand-crafted levels back-to-back. High scores and highest level reached are tracked persistently. Procedural sound effects (Web Audio API) and background music with mute controls. A standalone HTML version is hosted at cosmicdriftapp.com.

**Created by:** Dan Medwin and Claude (Sonnet 4.6), 2026
**Current version:** v76
**Files:** `CosmicDriftV76.jsx` (~2,950 lines) · `CosmicWorkshop_v2.jsx` (~2,800 lines)
**Platform:** React JSX compiled via Babel, optimized for iOS Safari / iOS home screen webapp
**Standalone:** `index.html` + `workshop.html` pre-compiled, hosted at cosmicdriftapp.com (GitHub Pages)

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
- **Game file uses JSX syntax** (`<Component />`); **Workshop file uses `React.createElement`** — never mix

**CRITICAL: When adding new @keyframes to ANIM_CSS, use `\n` separators (single-escaped). The `str_replace` tool double-escapes `\\n` to `\\\\n`, which silently breaks CSS parsing.**

**Version numbering convention:**
- Bugfix/minor edits: decimal versions (e.g., v76.1, v76.2)
- New feature builds: whole numbers (v76, v77)
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
- **Side frame bars:** `inset box-shadow` (not CSS `border`) so `clientWidth` measurements are unaffected
- **Constants:** GAP=5, BOARD_PAD=10

---

## GS Cockpit Design System (v76)

All game UI — nav bar, HUD, modals, Level Clear card, Game Over card, in-game menu — uses the **GS (Gray Steel) cockpit design language**.

### Style Constants (`GS` object)

```js
GS.bg            // radial dark navy background
GS.brushed       // brushed metal: two-layer bg (gradient + stripe texture), blend overlay
GS.brushedSolid  // same gradient without stripe (for buttons)
GS.inset         // deep inset panel (dark navy, inner shadow)
GS.pb / GS.pbl   // panel border (1px #404a58 / lighter #525c6c)
GS.ps            // panel box-shadow (top highlight + bottom depth)
GS.ib / GS.is    // inset border + shadow
GS.green / GS.blue  // accent colors #50ffae / #80ddff
```

### Components

| Component | Usage |
|-----------|-------|
| `GsPanel` | Brushed metal container with 4 corner rivets (6px spheres). `riveted=false` disables rivets. `inset` prop flips to dark inset style. |
| `GsRivet` | Absolute-positioned 6px sphere. Radial gradient simulates a machined bolt head. Accepts `pos` prop (CSS position object) and optional `size`. |
| `GsMono` | JetBrains Mono label, uppercase, configurable size/letterSpacing/color. |
| `GsLED` | Small circular status indicator with glow. |
| `GsIconBtn` | Icon button used in HUD. |

### Applied screens (game)

- **Top nav bar**: GS brushed metal. 6 rivets: left column pair, right column pair, flanking the hamburger.
- **HUD**: GS brushed metal. 6 rivets at the corners and mid-panel separation points. Readout panels use `GS.inset`. Side frame bars use inset box-shadow (not CSS border) so grid width calculation is unaffected.
- **Level Clear card**: GsPanel with hazard stripes, inset score panels, plasma-used stat, per-level score tracking.
- **Game Over card**: GsPanel matching Level Clear structure.
- **All modal dialogs** (Exit confirm, Restart confirm, Convert Core, Deadlock, Intro card): GsPanel.
- **In-game dropdown menu**: GsPanel with brushed metal and rivets.

---

## Workshop Architecture

Two files share a common storage layer:

| File | Output | Purpose |
|------|--------|---------|
| `CosmicDriftV76.jsx` | `index.html` | Game |
| `CosmicWorkshop_v2.jsx` | `workshop.html` | Creative suite |

### Workshop Screens

```
screen = "splash"
  → "builder"   (Level Builder)      lbScreen = "list" | "editor"
  → "designer"  (Block Designer)     bdCurrentView = "list" | "editor"
  → "vfx"       (VFX Studio)         vfxCurrentView = "list" | "editor"
  → "ufo"       (UFO Customizer)     ufoView = "list" | "editor"
```

### WS Cockpit Design System

All workshop module screens (Level Builder, Block Designer, VFX Studio, UFO Customizer) share the WS cockpit design language, parallel to the game's GS system.

```js
WS.brushed   // brushed metal bg (same gradient + stripe as GS.brushed)
WS.inset     // inset panel
WS.pb/pbl    // panel border
WS.ps/is     // panel + inset shadows
WS.green / WS.blue
```

**WorkshopTopBar**: Uses `WS.brushed` background. Contains 2 top-corner `WsRivet` elements (`top:4, left:4` and `top:4, right:4`).

**Module outer wrapper**: Each module screen (`screen === "builder"` etc.) has `WS.brushed` + `backgroundBlendMode: "overlay"` applied to its outer div, plus `WsRivet` at `bottom:5, left:5` and `bottom:5, right:5`. Combined with the top-bar rivets, this gives 4 visible corner rivets per module screen.

**Level Builder editor** has a custom top bar (not `WorkshopTopBar`) that also uses `WS.brushed` + top-corner rivets.

### Storage Keys

```
cosmic-drift-block-designs    → BD saved designs array
cosmic-drift-active-blocks    → BD active map { bdTypeId: designId }
cosmic-drift-vfx-designs      → VFX saved designs array
cosmic-drift-vfx-active       → VFX active map { effectType: designId }
cosmic-drift-ufo-designs      → UFO saved designs array
cosmic-drift-ufo-active       → UFO active design id (string)
cosmic-drift-ufo-design       → LEGACY single-design key (migrate only)
cosmic_drift_ship_size        → Ship display size in px (integer 34–204); default 64
```

### Cross-App Navigation

| Trigger | Mechanism |
|---------|-----------|
| Game → Workshop | `navigateToWorkshop()`: sets `sessionStorage.cd_transition_from = "game"`, navigates to `workshop.html` |
| Workshop → Game (custom level) | Sets `sessionStorage.cd_autoload_save` or `cd_transition_from = "workshop"`, navigates to `index.html` |
| Exit custom level → Workshop levels | Sets `sessionStorage.cd_open_section = "levels"`, calls `navigateToWorkshop()`. Workshop reads key on mount and routes to Level Builder list. |

### Block Design System

Game and Workshop share two storage keys — `cosmic-drift-block-designs` (custom designs) and `cosmic-drift-active-blocks` (active map). `bdResolveActiveDesign` / `BDBlockPreview` render blocks; `BLOCK_TYPE_TO_BD` maps numeric block types to designer string ids.

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

**Shot counter:** Incremented by `tickUfoCounter` at tap time (before the 60ms fire delay), only when: UFO is on the board AND ufoActiveRef=false AND empActiveRef=false. Counter frozen during both warp animations and the entire EMP sequence. Called from all three fire paths: grid tap, ship zone tap, and touch end handler.

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
| `HudPanelMemo` | baseCores, extraCores, plasma, maxPlasma, score, scoreFlash, gameState, setGameState, shipDisplaySize, showShipSizeSlider, onToggleShipSizeSlider | Grid, VFX, projectile, inventory changes |
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

`node build.js` compiles JSX with `@babel/core` into a UMD bundle replacing the inline script in `index.html` / `workshop.html`. React 18 / ReactDOM 18 from unpkg CDN. `window.storage` shim wraps localStorage with `cd_` key prefix.

```
npm run build        # builds both index.html and workshop.html
npm run build:game   # builds index.html only
npm run build:workshop  # builds workshop.html only
```

iOS webapp meta tags: `viewport` without `viewport-fit=cover`, `apple-mobile-web-app-status-bar-style` set to `default` (fixes touch offset issue where taps registered lower than finger position). Cache-control meta tags force iOS webapps to fetch the latest version on each load; localStorage (save data, high scores) is unaffected.

---

## Changelog

### V76 — Hangar v2: Ship Size, New Hulls, Editor Polish (2026-05-19)

#### Ship Size Control (Game HUD)

- **Ship size button** added to `HudPanel` as a compact 4th column (fixed `flex: 0 0 32px`). Shows current size as a percentage and an expand icon. Reactor Cores + Score panels reduced from `flex: 1.3` to `flex: 1` to make room.
- **Tapping** opens a `position: fixed` bottom-sheet slider overlay. Range: 50%–300% of the 68 px ship row (34–204 px). Large 32 × 32 px thumb matches the Workshop slider style.
- **Ship size persists** across sessions via `cosmic_drift_ship_size` storage key (integer px, validated 34–204 on load).
- **Ship zone render** changed from `display:flex / align-items:flex-end` to `position:relative` with the ship SVG using `position:absolute; bottom:2; left:50%; transform:translateX(-50%)`. This ensures the ship grows upward correctly at any size without flex overflow clipping.
- **Ship glow** removed as a hardcoded default (`drop-shadow(0 0 10px rgba(255,168,255,0.5))`). The filter is now driven by `GAME_SHIP_DESIGN.glowEnabled`, `GAME_SHIP_DESIGN.glowColor`, and `GAME_SHIP_DESIGN.glowIntensity`. Defaults to `none`.

#### Workshop — Hangar Editor Improvements

- **Ship Glow option**: Toggle + color picker + intensity slider added to the Name panel in the ship editor. Settings (`glowEnabled`, `glowColor`, `glowIntensity`) are saved in the ship design and read by the game at runtime. Preview applies the glow filter live on the sticky ship preview.
- **Name field removed from Color + Position tabs**: `renderShipSelectedHeader` no longer renders a duplicate Name input. The ship name is already editable at the top of the editor panel.
- **Pencil rename on parts list**: Each row in the List tab now has a gold pencil icon button. Tapping it opens an inline input pre-filled with the part's current name. Enter or blur saves; Escape cancels. The button turns pink while active.
- **Templates tab overhaul**: Tapping any template tile now immediately replaces all parts (no Replace / Add / Cancel prompt). "None" removed from the template grid. A full-width brushed-metal **Reset — Clear All Parts** button sits below the grid; tapping it opens a confirmation modal (brushed metal, Clear All + Cancel buttons) before wiping the design.

#### Hull Templates

Added three new templates baked into `HULL_PRESETS` (both JSX files) and the Workshop picker:
- **Gorram Ship** (`fireflight`, 13 parts) — replaces the previous Fireflight preset
- **UFO 2.0** (`saucer`, 9 parts) — replaces the previous Saucer preset
- **Hex Fighter** (`ironeye`, 13 parts)
- **Stinger-II** (`vespa`, 12 parts) — replaces the previous Raptor preset
- **Police Box** (`callbox`, 16 parts) — new; a TARDIS-inspired blue police box

Removed from picker: Dart, Wedge, Raptor (replaced by above). Total templates: 9 designs + None (clear).

---

### V76 - GS Cockpit Design + Workshop Polish

#### GS Cockpit Design System

Applied the Gray Steel (GS) cockpit visual language to all game UI. The `GS` object defines brushed metal gradients, border styles, and shadow constants mirroring the Workshop's `WS` system.

**Game screens redesigned:**
- **HUD**: brushed metal panel, 6 rivets, inset readout screens for plasma/score/cores. Side frame bars converted from CSS `border` to `inset box-shadow` to fix grid centering (border removed width from `clientWidth` measurement; box-shadow does not).
- **Top nav bar**: brushed metal, 6 rivets positioned to avoid hamburger button overlap.
- **Level Clear card**: hazard stripe header, per-stat inset panels, plasma-used display, brushed metal body.
- **Game Over card**: matches Level Clear card structure (GsPanel, same inset stat layout).
- **All modal dialogs**: Exit confirm, Restart confirm, Convert Core, Deadlock notice, Intro card — all use GsPanel.
- **In-game dropdown menu**: GsPanel with brushed metal and rivets.

Rivet positions were dialed in using an interactive placement tool (`rivet-tool.html`) built specifically for this session. Tool allows click-to-place, drag-to-reposition, double-click-to-remove, with smart coordinate anchoring (pixel values near edges, percentage values in the interior).

#### Workshop: GS Cockpit Applied to Module Screens

`WorkshopTopBar` updated to use `WS.brushed` background (was `PNL`), creating a seamless cockpit-panel surface across the entire module area.

Each module screen outer wrapper (`screen === "builder"` etc.) gains:
- `background: WS.brushed, backgroundBlendMode: "overlay"`
- `WsRivet` at `bottom: 5, left/right: 5` (bottom corners)

`WorkshopTopBar` gets `WsRivet` at `top: 4, left/right: 4` (top corners). Level Builder's custom editor top bar gets the same treatment. Combined: 4 corner rivets per module screen, none overlapping panels.

#### Workshop: Edit Copy in My Designs

"Edit Copy" button added to the custom (My Designs) list in all four sections:
- **Block Designer**: calls `bdCopyPreset(saved)` — opens a copy in the editor with `(custom)` appended to the name, `id: null`
- **VFX Studio**: calls `vfxCopyPreset(saved)` — same pattern
- **Level Builder**: new `copyLevel(lv)` function — calls `openBuilder` with `id: null` and `(copy)` appended
- **UFO Customizer**: inline copy — sets `ufoEditId: null`, appends `(copy)` to name, opens editor

Previously "Edit Copy" only existed in the Factory/Active tabs; now available in all three tabs for each section.

#### Workshop: Exit Custom Level → Workshop Levels

Tapping Exit while playing a custom level now routes back to the Workshop levels list rather than the game splash:

1. Exit confirm handler checks `customLevelMode`
2. If true: sets `sessionStorage.cd_open_section = "levels"` and calls `navigateToWorkshop()`
3. Workshop mount `useEffect` reads `cd_open_section`, routes to `screen = "builder", lbScreen = "list"` and removes the key

The `cd_open_section` key is extensible — values `"designer"`, `"vfx"`, `"ufo"` also handled.

#### Workshop: Module Tiles → Active Tab

Splash screen module tiles (Block Designer, VFX Studio) now set the Active tab when tapped:
- Block Designer tile: adds `setBdSavedTab("active")`
- VFX Studio tile: adds `setVfxCurrentView("list"); setVfxSavedTab("active")`
- Hamburger menu links updated to match

Active Loadout quick-link tiles (the 4-column grid) already opened the Active tab; the main module tiles now do too.

#### Workshop Splash Polish

- **CONTINUE button**: renamed from "RESUME" to "CONTINUE"
- **Active Loadout per-tile dates**: each tile (Grid, Blocks, VFX, Hull) now shows the last-edit date for that slot's active item, in the section accent color at low opacity. Dates pull from `level.modified`, `design.modifiedAt`, or `ufo.savedAt` as appropriate.

---

### V74-V75 - Canvas Projectiles, Training UX, Economy Fixes, FF Level Clear

#### Canvas Projectile System (v73.5-v73.7)
Resolved the plasma-to-block-pop delay on iOS. Root cause: CSS animations start on first paint (delayed by React rendering) while setTimeout starts immediately, creating a timing mismatch of 50-200ms on iOS.

Final solution (v73.7): Plasma projectiles moved from React divs with CSS animation to direct canvas rendering on the existing VFX canvas. Position interpolated via rAF, `processHit` fires in the same frame the ball arrives. No setTimeout, no React render, no CSS in the critical path. Canvas z-index raised from 40 to 50.

#### Training Level UX (v74-v74.5)
- Named training levels: Level 1 "Moving and Shooting", Level 2 "Power-up Blocks", Level 3 "Indestructible"
- Retry Level / Skip Level buttons flanking tutorial text area during levels 1-9 in campaign mode

#### Economy Fixes (v74-v74.2)
- Recharge always gives 10 plasma (`START_PLASMA`) regardless of level's starting count
- `gainCore` at cap shows animated teal ball (bonusCharge VFX) before adding 5 points

#### Force Field Level Clear Fix (v74-v75)
Belt-and-suspenders guards on all three level-clear paths (main win check, acid demo, recharge completion) using `pendingFFRef.current <= 0 && removingRef.current.size === 0`. Root cause: iOS Home Screen webapp mode can trigger synchronous re-renders, firing win-check useEffect before guards set inside `setTimeout(fn, 0)`. Fix: set `pendingFFRef++` synchronously in processHit before queuing the timeout.

---

### V73 - Performance Optimization + UFO Bugfixes

- `HudPanelMemo`, `InventoryBarMemo`, `GameGridMemo`: memoized components
- `flushGrid()`: batches grid/VFX/projectile/plasma/score updates into single rAF
- Canvas particle cap (150), idle-pausing loop
- UFO bugfixes: `clearBoardState` resets, `tickUfoCounter` in ship zone handler, EMP continues post-destruction, `processedRef`/`removingRef` cleared on warp-in
- iOS viewport fix: removed `viewport-fit=cover`, status bar `default`

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

1. **Gravity Block and Black Hole Block** - New block types that may work with a "dark" level
2. **Workshop module redesign** - Ship Customizer screen (5th tile)
3. **Preset sets** - Import/export block designs + VFX as themed packages ("sets")
4. **Share via URL** - Import blocks, levels, or effects via URL parameters
