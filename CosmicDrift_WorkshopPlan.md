# Cosmic Drift - Block Designer & Workshop Separation Report

## Session Summary

This session built the **Block Designer** (v4.5) as a standalone React artifact for designing custom block skins. The tool is feature-complete as a standalone and ready for integration. Dan approved a plan to separate the game into two artifacts: **Cosmic Drift** (gameplay) and **Cosmic Workshop** (creative tools).

**Created by:** Dan Medwin and Claude (Opus 4.6), 2026

---

## Block Designer - Current State (v4.5)

**File:** `BlockDesigner_v4.5.jsx` (~1,575 lines)
**Storage key:** `cosmic-drift-block-designs`
**Font:** Exo 2 (Google Fonts)

### Features

**Design Controls (HUD-style tab bar):**
- Shape: 8 options (Square, Circle, Octagon, Hexagon, Star, Asteroid, Cross, Shield) with rotation slider and corner radius (square only)
- Fill Color: picker + 12 preset swatches
- Border: color, thickness, glow toggle with color/intensity
- Pattern Fill: 8 types (None, Dots, Lines, Crosshatch, Chevrons, Waves, Circles, Squares) with conditional controls per pattern type (lineWidth only for stroke patterns, filled toggle only for circles/squares). Pattern scales from center of block via patternTransform.
- Icon: 13 options with per-icon fillRule support. Icon glow system (SVG filter blur) with color and spread controls.

**Icons available:** Cross (4-directional arrows), Bolt, Dot, Drone (quadcopter with capsule body), Barrel (with bands), Crate (box with lid line), Console Open (open-lid crate), Skull, Flame, Shield, Gear (8 even teeth), Ring

**Force Field Phase System:** When "Force Field" is selected as block type, a P1/P2/P3 phase picker appears. Phase 1 is the base design. Phases 2 and 3 store overrides for: glowEnabled, glowColor, glowIntensity, borderColor, borderWidth, icon, iconColor, iconOpacity, iconGlow, iconGlowColor, iconGlowIntensity. Helper function `getDesignForPhase(design, phase)` merges base with overrides.

**Saved View:** Two-tab layout (Game Blocks / My Designs). Game Blocks shows 9 factory presets matching actual game block colors (from BLOCK_COLORS in game code). Each has a "Copy" button that loads a duplicate into the designer. My Designs shows user-saved designs with Edit and Delete.

**Layout:** Fixed header (title, Save/New/Saved buttons, live preview with 3x3 mini grid). Name + Block Type on one line below header. HUD tab bar for 5 control areas. Only one panel open at a time.

### Factory Preset Colors (from game's BLOCK_COLORS)

| Block | Color | Border | Icon | Notes |
|-------|-------|--------|------|-------|
| Regular | #7b5ea7 | #6b4e97 | none | Subtle glow intensity 4 |
| Cross Shot | #e0457b | #c03868 | cross (arrows) | |
| Lightning | #9a7020 | #7a5a18 | bolt (#ffe066) | |
| Plasma | #3060b0 | #2850a0 | dot (#80ddff) | Icon glow enabled, #50c8ff |
| Crate | #b8862a | #9a7020 | crate_ic (#4a4a5a) | Dark icon color |
| Drone | #8844cc | #6633aa | drone_ic (#e8e8ff) | 75% opacity |
| Indestructible | #707580 | #555555 | none | Squares pattern: #323232, 80%, 2.6x, 45deg, width 2, filled |
| Acid Barrel | #2a8a2a | #1a6a1a | barrel (#80ff80) | |
| Force Field | #4060a0 | #3050a0 | crate_ic (#82b4ff) | Glow intensity 5, phases configured |

### Force Field Phase Defaults

| Phase | Glow | Border Width | Border Color | Icon |
|-------|------|-------------|--------------|------|
| 1 | Enabled, #82b4ff, intensity 5 | 2 | #3050a0 | crate_ic |
| 2 | Disabled | 1 | rgba(130,180,255,0.35) | (inherits crate_ic) |
| 3 | Disabled | 0 | transparent | console_open |

### Design Data Format

```json
{
  "name": "My Design",
  "id": "unique_id",
  "createdAt": "ISO date",
  "shape": "square",
  "shapeRotation": 0,
  "cornerRadius": 6,
  "color": "#7b5ea7",
  "borderColor": "#6b4e97",
  "borderWidth": 2,
  "glowEnabled": true,
  "glowColor": "#9f7fd0",
  "glowIntensity": 4,
  "pattern": "none",
  "patternColor": "#ffffff",
  "patternOpacity": 0.3,
  "patternScale": 1,
  "patternRotation": 0,
  "patternFilled": false,
  "patternLineWidth": 1.5,
  "icon": "none",
  "iconColor": "#ffffff",
  "iconOpacity": 0.8,
  "iconGlow": false,
  "iconGlowColor": "#ffffff",
  "iconGlowIntensity": 6,
  "assignedTo": "regular",
  "phases": null
}
```

For force field, `phases` contains:
```json
{
  "2": { "glowEnabled": false, "borderWidth": 1, "borderColor": "rgba(130,180,255,0.35)" },
  "3": { "glowEnabled": false, "borderWidth": 0, "borderColor": "transparent", "icon": "console_open" }
}
```

### Technical Notes

- **Per-icon fillRule**: Icons default to `"evenodd"` (needed for ring, gear, barrel, crate cutouts). Drone uses `"nonzero"` (set via `fillRule` property on icon definition) because its overlapping capsule body + arm subpaths would create holes with evenodd.
- **Drone winding direction**: Arms must wind clockwise (same as capsule body) to prevent fill inversion at overlap areas with nonzero fill rule. Dan tuned the final drone path using the DronePlayground tool.
- **Pattern centering**: Uses `patternTransform="translate(50 50) scale(s) rotate(r) translate(-50 -50)"` on a fixed 10x10 tile.
- **Pattern conditional controls**: `PATTERN_CAPS` object defines which controls each pattern type supports (lineWidth, filled).
- **Corner radius**: Only available for square shape. Switches rendering from `<path>` to `<rect>` with rx/ry.
- **Icon glow**: SVG `<filter>` with `feGaussianBlur` + `feMerge`, defined in `<defs>`, applied to a duplicate path behind the main icon.

### Companion Tools

- **DronePlayground.jsx**: Interactive tool for tuning drone icon layout. Separate top/bottom rotor Y positions, independent arm start/end placement, capsule body controls. Exports SVG path for copy/paste into Block Designer. Arm winding fixed to match capsule CW direction.

### Open Items for Block Designer

- Force field visual states need playtesting once integrated
- Import/export of individual designs and full sets (JSON clipboard or file)
- Sort options for My Designs (name, assigned block, active set)
- "Sets" concept: named collections of block designs that can be activated as a group

---

## Workshop Separation Plan

### Architecture

The game splits into two separate React JSX artifacts sharing `window.storage`:

**Cosmic Drift** (gameplay) - `index.html`
- Gameplay, splash screen, HUD, tutorial, guide
- Custom level playback (read-only list of My Levels with Play button)
- Block skin rendering (reads active design set from storage)
- "Edit" button in My Levels navigates to Workshop
- "Open in Builder" menu option navigates to Workshop
- "Workshop" button on splash screen

**Cosmic Workshop** (creative suite) - `workshop.html`
- Level Builder (extracted from game)
- My Levels management (edit, delete, reorder, export/import)
- Block Designer (already built)
- Block design set management
- "Play" button navigates to Game
- "Save & Play" for levels navigates to Game with level pre-loaded
- Future: effects customizer, playgrounds, unlock progression

Both hosted at same origin (e.g., techrabbi.org/cosmic-drift/) so they share `window.storage`.

### Navigation Between Game and Workshop

| Action | From | To | URL |
|--------|------|----|-----|
| Open Workshop | Game splash | Workshop home | workshop.html |
| Edit Level | Game My Levels | Workshop builder | workshop.html?edit=levelId |
| Open in Builder | Game menu | Workshop builder | workshop.html?edit=levelId |
| Play Game | Workshop | Game splash | index.html |
| Save & Play Level | Workshop builder | Game playing level | index.html?play=levelId |
| Play Custom Level | Workshop My Levels | Game playing level | index.html?play=levelId |

Both pages check URL params on mount and route accordingly.

### Visual Identity

Both artifacts should feel like one app: same dark space theme, same fonts (Quicksand for game, Exo 2 for designer), same color palette (#0b0c1a background, blue/purple accent colors), same button styles and HUD aesthetic.

### Storage Schema

**Existing keys (game):**
- `cosmic_drift_best_score_{difficulty}` - high score per difficulty
- `cosmic_drift_best_level_{difficulty}` - highest level per difficulty
- `cosmic_drift_save_game` - save/continue data
- `cosmic_drift_custom_levels` - array of custom level JSON
- `cosmic_drift_builder_tour` - "seen" flag

**New keys (Block Designer):**
- `cosmic-drift-block-designs` - array of user-created block designs
- `cosmic-drift-block-sets` - array of named design sets (future)
- `cosmic-drift-active-set` - ID of active design set (future)

### Implementation Phases

**Phase 1: Create Workshop shell**
- New JSX artifact with navigation tabs (Level Builder, My Levels, Block Designer)
- Integrate Block Designer (already built, ~1575 lines)
- Level Builder tab shows placeholder initially
- Establish shared visual style

**Phase 2: Extract Level Builder from game**
Code to move (identified in game v75):
- Builder state declarations: lines ~949-964 (15 lines)
- Builder tour seen check: line ~1099
- Builder functions: lines ~1727-1855 (openBuilder, builderCellAction, all touch/mouse handlers, getBuilderIdxFromTouch, validateBuilderGrid, handleBuilderSave, handleBuilderBack, playBuilderLevel, saveAndPlay) (~128 lines)
- Level storage functions: lines ~1925-1966 (loadSavedLevels, deleteLevel) (~41 lines)
- Builder UI rendering: lines ~2363-2504 (~141 lines)
- My Levels UI rendering: lines ~2505-2807 (~302 lines)
- Total: ~627 lines to extract

Shared dependencies that need to be duplicated in Workshop:
- Constants: COLS, ROWS, GAP, BOARD_PAD, START_PLASMA, BLOCK_COLORS, BLOCK_LABELS, BLOCK_DESC, CRATE_VARIANTS, BUILDER_TOUR_STEPS, isCrate function, WIN_EXEMPT_TYPES
- Components: BlockContent, all icon components (CrossShotIcon, LightningIcon, PlasmaIcon, CoreIcon, DroneIcon, AcidBarrelIcon, TreasureCrateIcon, DiamondPlateBlock, UFOBlockSvg)

**Phase 3: Wire navigation**
- Game: add URL param handling for `?play=levelId`
- Game: replace Builder/My Levels buttons with Workshop link
- Game: keep read-only "My Levels" play list (reads from storage)
- Workshop: add URL param handling for `?edit=levelId`
- Workshop: "Play" and "Save & Play" buttons navigate to game

**Phase 4: Clean up game + add skin rendering**
- Remove builder code from game (~627 lines)
- Add block skin renderer that checks storage for active design set
- Game renders custom skins via SVG (same BlockPreview approach from designer)
- Estimated game file reduction: ~2800 lines down to ~2200 lines

### Key Considerations

- **playCustomLevel** function currently in the game sets up game state for a custom level. This stays in the game but needs to support receiving a level ID via URL param and loading it from storage.
- **Custom level JSON format** is unchanged: `{ name, grid, ship, plasma, savedAt }`
- **Level Builder tour** (walkthrough) state can reset per-Workshop-session or persist via storage.
- **Sound system** stays entirely in the game. Workshop doesn't need audio.
- **All game code constraints apply to Workshop too**: var only, no arrow functions, no destructuring, no template literals, Object.assign instead of spread, fontSize 16 on inputs.

---

## Critical Code Constraints (both artifacts)

- `var` declarations only (NO `let` or `const`)
- NO arrow functions (use `function(){}` everywhere)
- NO destructuring (use `_state[0]`, `_state[1]` pattern)
- NO template literals (use string concatenation with `+`)
- `Object.assign({}, obj, {key: val})` instead of spread
- All text inputs must use `fontSize: 16` to prevent iOS zoom
- ANIM_CSS edits via Python string replacement only (never str_replace tool)

### Build Process

Both artifacts compile to standalone HTML via Babel:
- Working file at `/home/claude/{filename}.jsx`
- Build: `node /home/claude/build.js`
- Output: HTML with embedded CSS loading screen
- Versioned copies to `/mnt/user-data/outputs/`

### Version Convention

- Block Designer: decimal for fixes (v4.1, v4.2), whole for features (v4.0, v5.0)
- Workshop: will start at v1.0 when created
- Game: continues from v75, version displayed in tester menu

---

## Files from This Session

| File | Description |
|------|-------------|
| BlockDesigner_v4.5.jsx | Current Block Designer (final version this session) |
| DronePlayground.jsx | Drone icon tuning tool |
| BlockDesigner_v1.1.jsx through v4.4.jsx | Earlier iterations (can be discarded) |

---

## Recommended Next Session Start

1. Upload `CosmicDriftV75.jsx` and this report
2. Create the Workshop shell (Phase 1): new artifact with tabs, integrate Block Designer
3. Begin Level Builder extraction (Phase 2): copy shared constants, move builder state/functions/UI
4. Test that custom levels still save/load correctly via shared storage
