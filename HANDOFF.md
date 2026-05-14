# Cosmic Drift - Claude Code Handoff

## What You're Working With

**Cosmic Drift** is a mobile-first iOS-compatible arcade/puzzle block shooter built as a single React JSX file. It's being separated into two artifacts:

- **Cosmic Drift** (gameplay) - `index.html`, built from `CosmicDriftV76.jsx`
- **Cosmic Workshop** (creative tools) - `workshop.html`, built from `CosmicWorkshop_v2.jsx`

Both share data via localStorage with a `cd_` prefix shim. Both are hosted at `cosmicdriftapp.com` via GitHub Pages from the `cosmic-drift` repo.

**Created by:** Dan Medwin and Claude (Opus 4.6), 2026

---

## Repo Structure

```
cosmic-drift/
  index.html          <- Game (compiled from CosmicDriftV76.jsx)
  workshop.html       <- Workshop (compiled from CosmicWorkshop_v2.jsx)
  build.js            <- Babel build script (JSX -> standalone HTML)
  CosmicDriftV76.jsx  <- Game source
  CosmicWorkshop_v2.jsx <- Workshop source
  CNAME               <- cosmicdriftapp.com
  favicon.png
  apple-touch-icon.png
```

---

## Build Process

```bash
npm install @babel/core @babel/cli @babel/preset-react
node build.js CosmicDriftV76.jsx index.html "Cosmic Drift"
node build.js CosmicWorkshop_v2.jsx workshop.html "Cosmic Workshop"
```

The build script:
1. Strips the `import` line
2. Captures the component name from `export default function`
3. Strips `export default`
4. Runs Babel with classic JSX transform (`React.createElement`)
5. Wraps in HTML with: unpkg React 18 CDN, localStorage shim (cd_ prefix), loading screen, mount code

**Critical:** The component name detection must use the `export default function` match, not the first function in the file.

---

## Code Constraints (BOTH files)

- `var` only (NO `let` or `const`)
- NO arrow functions
- NO destructuring
- NO template literals
- `Object.assign({}, obj, {key: val})` instead of spread
- `fontSize: 16` on all text inputs (iOS zoom prevention)
- ANIM_CSS edits via Python string replacement only (never str_replace tool)

---

## Current State

### Game (v76, ~2210 lines)
- Builder code removed (~597 lines cut from v75)
- `navigateToWorkshop()` function added (detects hosted vs artifact context)
- URL param handler: `?play=levelId` auto-loads custom levels
- "Workshop" button on splash screen
- Simplified read-only "My Levels" with Play buttons only
- "Open in Workshop" in game menu (replaces "Open in Builder")
- All gameplay, scoring, tutorial, sound, VFX intact

### Workshop (v2.0, ~1266 lines)
- Splash screen with Level Builder and Block Designer cards
- **Level Builder**: My Levels list (sort, rename, import, export, delete) + grid editor (palette, crate variants, UFO, eraser, tour)
- **Block Designer**: My Blocks list (My Designs/Game Blocks tabs, sort, rename, import, export, delete) + design editor (shape, color, border, pattern, icon panels with HUD tabs)
- Unified UI patterns: shared WorkshopTopBar, shared overlay renderers, shared button styles, shared card styles
- "First Contact" sample level seeds on first visit

### Shared Storage Keys
- `cosmic_drift_levels` - custom levels (array of {id, name, grid, shipStart, startPlasma, ...})
- `cosmic-drift-block-designs` - block designs (array of design objects)
- `cosmic_drift_save_game` - game save data
- `cosmic_drift_best_score_{difficulty}` - high scores
- `cosmic_drift_best_level_{difficulty}` - highest levels
- `cosmic_drift_builder_tour` - "seen" flag
- `cosmic_drift_ios_prompt_dismissed` - iOS prompt flag

---

## What's Next (from the roadmap)

1. **Block skin rendering in game** - Game reads active designs from storage and renders blocks using the Block Designer's SVG system instead of hardcoded icons
2. **Workshop → Game play links** - "Play" buttons in Workshop My Levels that navigate to `index.html?play=levelId`
3. **Icon unification** - Level Builder grid should use Block Designer's path-based icon system
4. **Gravity Block and Black Hole Block** - New block types introduced at level 9
5. **Guide overlay overhaul**
6. **UFO warp-stopping bug** - Investigate with debug logs

---

## Key Architecture Notes

- Game uses JSX syntax throughout, Babel compiles it
- Workshop uses `React.createElement` calls directly (no JSX)
- Both use `window.storage` shim that maps to localStorage with `cd_` prefix
- Storage is isolated per-artifact in Claude app, but shared when hosted at same origin
- `ANIM_CSS` is a string containing CSS keyframes, injected via `<style>` tag
- Canvas VFX uses HTML Canvas + requestAnimationFrame (off React state)
- Game refs (`gridRef2`, `plasmaRef`, `processedRef`, etc.) are source of truth for synchronous game logic
- `processedRef` races are a recurring bug source

---

## Dan's Working Style

- Makes all product and design decisions; Claude handles implementation
- Prefers plain-English explanations before diving into code
- Terse feedback, annotated screenshots, red markup overlays
- Strongly prefers interactive playgrounds/labs for parameter tuning over iterating in code
- Custom levels designed in builder first, then baked into `FIXED_LEVELS` as signature levels
- Decimal version increments for fixes, whole numbers for features
- No em-dashes in UI text
