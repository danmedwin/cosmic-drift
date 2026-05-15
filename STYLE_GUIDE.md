# Cosmic Drift — UI Style Guide & Navigation Norms

Reference for future Claude sessions. Read this before adding any new screen,
button, panel, or navigation pattern to either JSX file.

Repo: `~/Documents/Cosmic Drift/cosmic-drift/`
Source files: `CosmicWorkshop_v2.jsx` (Workshop) · `CosmicDriftV76.jsx` (Game)

---

## 1. Color System

### Section accent colors
Each Workshop section has one accent color used for titles, borders, and
call-to-action buttons. Never mix these across sections.

| Section | Accent | Usage |
|---|---|---|
| Level Builder | `#80ddff` (sky blue) | title, EDIT button border, "+ New" |
| Block Designer | `#c8b8ff` (soft purple) | title, EXPORT button color |
| VFX Studio | `#ffb43c` (amber) | title |
| UFO Customizer | `#64dcb4` (teal-green) | title, set-active tints |

### Global palette
```
Background app       #0b0c1a  (dark navy)
Panel gradient (PNL) linear-gradient(180deg, #3d3d4a, #2a2a35)
Panel border (PNLB)  2px solid #505058
Screen bg (SCRN)     linear-gradient(180deg, #0a0a14, #12121e)
Screen border(SCRNB) 2px solid #3a3a45

Active/confirm green #80dd90 / bg: linear-gradient(180deg,#2a5a3a,#1a3a28)
Destructive red      #ff8866 / bg: rgba(80,20,20,0.4)
Neutral dim text     rgba(200,210,220,0.5–0.8)
```

### Fonts
- **Quicksand** — UI labels, buttons, body text (default)
- **Exo 2** — Block Designer editor (deliberately distinct, more technical feel)
- All `<input>` elements: `fontSize: 16` (prevents iOS auto-zoom — mandatory)

---

## 2. Panel & Container System

```
PNL   = "linear-gradient(180deg, #3d3d4a 0%, #2a2a35 100%)"
PNLB  = "2px solid #505058"
PNLS  = "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.3)"

SCRN  = "linear-gradient(180deg, #0a0a14 0%, #12121e 100%)"
SCRNB = "2px solid #3a3a45"
SCRNS = "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)"

CARD_STYLE = {
  background: "rgba(20,20,35,0.6)",
  border: "1px solid rgba(60,60,80,0.4)",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 8
}
```

**Use PNL** for top bars, buttons, floating panels.
**Use SCRN** for text input fields and text areas.
**Use CARD_STYLE** for list-row cards in My Levels, My Designs, My Effects, My UFOs.

Control group panels (color pickers, sliders grouped together):
```js
{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px" }
```

---

## 3. Button Taxonomy

All card-row buttons share `BTN_BASE` — always extend it, never write button
styles from scratch.

```js
BTN_BASE = {
  borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer",
  letterSpacing: 0.5, textTransform: "uppercase",
  fontFamily: "'Quicksand',sans-serif"
}
```

### Card-row buttons (inside list cards)

| Constant | Color | Use for |
|---|---|---|
| `BTN_EDIT` | blue `#80ddff` border | Open item in editor |
| `BTN_RENAME` | dim neutral | Rename in place |
| `BTN_EXPORT` | purple `#c8b8ff` | Show export/copy overlay |
| `BTN_DELETE` | red `#ff8866` | Delete with confirmation |
| `BTN_PLAY` | green `#80dd90` | Launch level in game |
| `BTN_SETACTIVE` | light green outline | Set as active (not yet active) |
| `BTN_ISACTIVE` | green filled | Currently active (click to deactivate) |

**Button order in list rows (left → right):**
EDIT · (RENAME if applicable) · (SET ACTIVE / ★ ACTIVE) · EXPORT · DELETE

### Top-bar buttons

| Constant | Color | Use for |
|---|---|---|
| `BTN_TOPBAR` | neutral | Secondary actions (Rename, Exp All, Import) |
| `BTN_TOPBAR_ACCENT` | blue `#80ddff` | Primary CTA (Save, + New) — override bg for section color |
| `BTN_TOPBAR_PURPLE` | purple `#c8b8ff` | Block Designer import |
| `BTN_SAVE` | green `#80dd90` | Explicit save in some contexts |

**Top-bar layout (left → right):**
`[← Back]`  ·  `[centered title]`  ·  `[secondary btn?]  [primary CTA]`

When both Set Active and Save appear together in an editor top bar:
`[← Back]`  ·  `[title]`  ·  `[Set Active / ★ Active]  [Save]`

### Set Active / ★ Active toggle (standard pattern)
- **In list rows** — use `BTN_SETACTIVE` / `BTN_ISACTIVE` pair, always visible.
  Label: `"★ Active"` when active (click deactivates), `"Set Active"` when not.
- **In editor top bar** — inline `BTN_TOPBAR` with color override:
  - Active: `color: "#80dd90"`, `border: "2px solid rgba(80,200,100,0.5)"`, label `"★ Active"`
  - Inactive: `color: "rgba(200,210,220,0.7)"`, `border: PNLB`, label `"Set Active"`
  - Clicking either state **toggles** (active → deactivate by passing `null`; inactive → activate).
- **Never** show "SET ACTIVE" on list rows using `BTN_TOPBAR` (smaller, wrong padding).

### Splash tile cards (Workshop home)
```js
{
  background: "linear-gradient(135deg, rgba(R,G,B,0.08), rgba(R,G,B,0.02))",
  border: "1px solid rgba(R,G,B,0.2)",
  borderRadius: 12, padding: "20px 20px", cursor: "pointer"
}
```
Icon box inside: `48×48`, `borderRadius: 10`, `rgba(R,G,B,0.1)` bg, `rgba(R,G,B,0.2)` border.
Title: section accent color, `fontSize: 16`, `fontWeight: 700`, `letterSpacing: 1`.
Subtitle: `rgba(180,200,220,0.35)`, `fontSize: 11`, `marginTop: 3`.

---

## 4. Navigation Architecture (Workshop)

```
screen = "splash"
  → "builder"   (Level Builder)
      lbScreen = "list" | "editor"
  → "designer"  (Block Designer)
      bdCurrentView = "list" | "editor"
  → "vfx"       (VFX Studio)
      vfxCurrentView = "list" | "editor"
  → "ufo"       (UFO Customizer)
      ufoView = "list" | "editor"
```

Each section follows the same two-level pattern: a **list view** and an
**editor view**. Never add a third level; keep any additional state as tabs
within the editor.

---

## 5. Back Button Norms

### WorkshopTopBar back button
The `WorkshopTopBar` component renders the back button. Always pass:
- `onBack` — the navigation function
- `backLabel` — the label that appears after the ‹ chevron (not "Back")
- `title` — centered section title in the accent color
- `color` — the section accent hex

### Back behavior rules

| Location | Back label | `onBack` action | Dirty check? |
|---|---|---|---|
| Any section **list** view | `"Workshop"` | `setScreen("splash")` | No |
| Any section **editor** | Name of the list (e.g. `"My Blocks"`) | Show back-warn overlay if dirty, else go to list | Yes |
| Level Builder editor | `"My Levels"` (rendered in topbar inside the editor) | `handleBuilderBack()` | Yes |

**Never** call `setScreen("splash")` from an editor sub-view. Editors always go
back to their section's list, not all the way to splash.

### Back-warn overlay
Triggered when the user taps back with unsaved changes. All four sections use
the shared `renderBackWarnOverlay(onStay, onLeave)`:
- **Stay**: dismisses overlay, keeps editor open
- **Leave**: discards changes, goes to list

Dirty state tracking:
- Level Builder: `builderDirty` (state)
- Block Designer: `bdDesignDirty` (state — triggers re-render for indicator)
- VFX Studio: `vfxDirty` (state)
- UFO Customizer: `ufoEditDirtyRef` (ref — no re-render needed, only checked on back)

---

## 6. List View Pattern

Every section list view follows this structure:

```
WorkshopTopBar
  backLabel: "Workshop"
  title: "My [Items]"
  rightContent: [+ New button]

scrollable list of CARD_STYLE rows
  [preview thumbnail]  [name]  [status badge if active]
  [EDIT] [SET ACTIVE / ★ ACTIVE] [EXPORT] [DELETE]

empty-state message when list is empty

deleteConfirm overlay (renderDeleteOverlay)
exportOverlay (renderExportOverlay)
```

### Active badge chip (in list rows)
Used on the design that is currently active. Shows instead of (or alongside)
the Set Active button:
```js
{ display: "inline-block", background: "rgba(100,220,180,0.15)",
  border: "1px solid rgba(100,220,180,0.35)", borderRadius: 4,
  padding: "1px 6px", fontSize: 10, color: "#64dcb4", fontWeight: 700 }
// label: "ACTIVE"
```
(The exact tint uses the section accent color, not always teal.)

---

## 7. Editor View Pattern

```
WorkshopTopBar
  backLabel: "My [Items]"
  title: "Edit [Item]" or "New [Item]"
  rightContent: [Set Active toggle]  [Save]

scrollable content:
  [large live preview, centered, ~140px]
  [NAME input field panel]
  [controls panel: BDColorPicker, BDSlider, BDToggle rows]
  [Reset to Defaults button, centered, below controls]
```

- Live preview must always use a unique `uid` prop if the component uses SVG
  gradient/clip IDs (e.g. `UFOBlockSvg`). Use `uid="edit"` in the editor.
- Name field: `fontSize: 16` (iOS zoom), `fontFamily: "'Quicksand',sans-serif"`.
- Reset to Defaults: resets design fields only, never the name.

---

## 8. Overlay Patterns

### Delete confirmation — `renderDeleteOverlay(title, onCancel, onConfirm)`
Shows before any destructive delete. Title is `"Delete [Item Type]?"`.

### Export — `renderExportOverlay(title, text, isCopied, onCopy, onClose)`
Shows JSON code in a scrollable box with a "Copy" button. Title is
`"Export [Item Type]"`. The `isCopied` state lives per-section (e.g.
`bdCopied`, `vfxCopied`, `ufoCopied`) so multiple overlays don't share state.

### Back warn — `renderBackWarnOverlay(onStay, onLeave)`
Shared across all editors. No customization — always the same wording.

### Import — `renderImportOverlay(title, text, setText, error, setError, onImport, onClose)`
Only Level Builder and Block Designer currently have import. Pattern is
reusable for other sections.

---

## 9. Storage Key Conventions

```
cosmic-drift-block-designs    → BD saved designs array
cosmic-drift-active-blocks    → BD active map { bdTypeId: designId }
cosmic-drift-vfx-designs      → VFX saved designs array
cosmic-drift-vfx-active       → VFX active map { effectType: designId }
cosmic-drift-ufo-designs      → UFO saved designs array
cosmic-drift-ufo-active       → UFO active design id (string, not map)
cosmic-drift-ufo-design       → LEGACY single-design key (migrate only)
```

**Array items always have:** `id` (string, e.g. `"ufo_" + Date.now()`),
`name` (string), `savedAt` (ISO date string).

**Active pointers:**
- BD and VFX use a **map** (`{ typeId: designId }`) because multiple block/effect
  types can each have a different active design.
- UFO uses a **single string id** because there is only one "active UFO".

When adding a new designable thing, choose the map form if it has sub-types,
the single-id form if there is only one slot.

---

## 10. SVG Gradient/Clip ID Isolation

Any component that defines SVG `<defs>` with `id` attributes (gradients, clip
paths, filters) **must** accept a `uid` prop and suffix every ID:

```js
// ✗ BAD — shared across all instances on the page
React.createElement("radialGradient", { id: "ufo-h" }, ...)

// ✓ GOOD
var uid = props.uid || "0";
React.createElement("radialGradient", { id: "ufo-h-" + uid }, ...)
```

Pass `uid={item.id}` in list rows, `uid="edit"` in the editor preview,
`uid="splash"` on the splash tile. The game typically has one instance so
`uid="0"` (default) is fine there.

**PlasmaIcon** and **PlasmaContainer** each generate their own local gradient
ID from `props.size`. This is fine as long as two PlasmaIcons at the same size
don't share a page — if that becomes a risk, add a `uid` prop there too.

---

## 11. Identified Inconsistencies (as of 2026-05-15)

Fix these the next time the relevant area is touched.

### Workshop (`CosmicWorkshop_v2.jsx`)

| # | Location | Issue | Fix |
|---|---|---|---|
| 1 | UFO list rows (line 2422) | "SET ACTIVE" uses `BTN_TOPBAR` (top-bar size/boxShadow). BD and VFX list rows use `BTN_SETACTIVE` (card-level size, no shadow). | Replace with `BTN_SETACTIVE` / `BTN_ISACTIVE` pair, always visible with toggle. |
| 2 | UFO list rows | Active state shown only as a chip badge; "SET ACTIVE" hidden when active. BD/VFX show a clickable "★ Active" button on every row (consistent toggle). | Show `BTN_ISACTIVE` "★ Active" when active (click deactivates), `BTN_SETACTIVE` "Set Active" when not — removes the badge chip or keeps it, but the toggle should always be present. |
| 3 | UFO Customizer list back | `onBack` does `setScreen("splash"); setUfoView("list")` — the `setUfoView("list")` is redundant (we're already in list). | Remove `setUfoView("list")` from the list back handler. |
| 4 | Dirty-state tracking | UFO editor uses `ufoEditDirtyRef` (a ref), all other editors use state variables (`builderDirty`, `bdDesignDirty`, `vfxDirty`). | Fine functionally (ref avoids unneeded re-renders), but future editors should pick one pattern. Ref is the leaner choice for back-warn only. |
| 5 | Block Designer "My Blocks" list | Back button does `setScreen("splash")` without resetting `bdCurrentView`. If somehow the editor view was active, going back and re-entering would show a stale editor. | Add `setBdCurrentView("list")` in the block list back handler (currently it goes from the list, so usually fine, but defensive reset is good practice). |
| 6 | VFX Studio list back (line 2277) | Same as #5 for VFX — `setScreen("splash")` without resetting `vfxCurrentView`. | Add `setVfxCurrentView("list")` for safety. |

### Game (`CosmicDriftV76.jsx`)

The game file has separate UI patterns (HUD, modals, gameplay screens). The
Workshop style guide does not apply to gameplay UI. Key items to know:

- Game uses JSX syntax (the Workshop uses `React.createElement`). **Do not mix
  these.** Game source is transpiled by Babel; Workshop source already uses
  the createElement form for historical reasons.
- `GAME_UFO_DESIGN`, `GAME_BLOCK_DESIGNS`, `GAME_ACTIVE_BLOCKS`, `GAME_VFX_DESIGNS`,
  `GAME_VFX_ACTIVE` are **module-level mutable globals** set on mount from
  storage. They are not React state and do not trigger re-renders. This is
  intentional for performance.
- Block rendering in the game goes through `BlockContent` → `DesignBlock` /
  `BDBlockPreview` just like the Workshop. Both files must stay in sync when
  the block-design schema changes.

---

## 12. Code Constraints (both files)

These are hard requirements — violating any one breaks the build or runtime:

- `var` only — no `let`, no `const`
- No arrow functions
- No destructuring
- No template literals (use `"string" + variable`)
- `Object.assign({}, ...)` instead of spread (`{...obj}`)
- `fontSize: 16` on every `<input>` (iOS auto-zoom prevention)
- Workshop source uses `React.createElement(...)` syntax (not JSX)
- Game source uses JSX (`<Component />`) syntax
- Both compile via `node build.js` (Babel classic JSX transform)

---

---

## 13. Screen Reference Screenshots

Captured at 430×932 (iPhone viewport). All files in `~/Documents/Cosmic Drift/screenshots/`.

### Game

| Screen | File |
|---|---|
| Splash / main menu | `game-splash.jpg` |

### Workshop

| Screen | File |
|---|---|
| Splash (section picker) | `ws-splash.jpg` |
| Level Builder — list | `ws-builder-list.jpg` |
| Level Builder — editor | `ws-builder-editor.jpg` |
| Block Designer — list | `ws-designer-list.jpg` |
| Block Designer — editor (New) | `ws-designer-editor.jpg` |
| VFX Studio — list | `ws-vfx-list.jpg` |
| VFX Studio — editor (New) | `ws-vfx-editor.jpg` |
| UFO Customizer — list | `ws-ufo-list.jpg` |
| UFO Customizer — editor (New) | `ws-ufo-editor.jpg` |

#### Notes on the screenshots
- List screens captured with empty localStorage (headless Chrome), so they show the
  correct empty-state messaging. Populated list appearance follows `CARD_STYLE` rows.
- Level Builder editor shows the tutorial overlay (guide walkthrough on first open).
- UFO editor shows the full color + slider control layout and live preview.
- To regenerate: `node ~/Documents/Cosmic\ Drift/screenshots/take-screenshots.js`
  (requires the preview server running on port 8765 — `npm run preview` or
  `npx serve . -p 8765` in the repo dir).

---

*Last updated: 2026-05-15 by Claude Sonnet 4.6*
