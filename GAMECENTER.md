# Game Center leaderboards

The iOS app submits a score to Game Center every time the game saves a new best
score (the same moments it writes `cosmic_drift_best_score_<mode>_<difficulty>`
to storage). The splash screen shows a **LEADERBOARDS** button in the native
app only; it opens the leaderboard for the mode and difficulty currently
selected, or the Game Center sign-in sheet if the player is not signed in.

Nothing is submitted on the web build, and nothing is submitted when the player
is not signed in to Game Center (the plugin just resolves `submitted: false`).

## IDs to create in App Store Connect

App Store Connect → the app → **Game Center** → **Leaderboards** → **+**,
type **Classic**, one per row. Score format: **Integer**, sort **High to Low**,
no score range limits. Reference name and localized title are suggestions.

| Leaderboard ID | Reference name | Title (en) |
|---|---|---|
| `com.medwin.cosmicdrift.lb.infinite.easy` | Infinite - Easy | Infinite · Easy |
| `com.medwin.cosmicdrift.lb.infinite.regular` | Infinite - Regular | Infinite · Regular |
| `com.medwin.cosmicdrift.lb.infinite.hard` | Infinite - Hard | Infinite · Hard |
| `com.medwin.cosmicdrift.lb.solve.easy` | Solve - Easy | Solve · Easy |
| `com.medwin.cosmicdrift.lb.solve.regular` | Solve - Regular | Solve · Regular |
| `com.medwin.cosmicdrift.lb.solve.hard` | Solve - Hard | Solve · Hard |
| `com.medwin.cosmicdrift.lb.set.easy` | Set - Easy | Set · Easy |
| `com.medwin.cosmicdrift.lb.set.regular` | Set - Regular | Set · Regular |
| `com.medwin.cosmicdrift.lb.set.hard` | Set - Hard | Set · Hard |

The ID is built in `build.js` (`CDNative.leaderboardId`):
`"com.medwin.cosmicdrift.lb." + mode + "." + difficulty`. If you rename the
prefix there, rename it here and in App Store Connect too.

Optional: a leaderboard **set** called "Cosmic Drift" grouping all nine makes the
Game Center sheet tidier; it is not required for submission to work.

## Enabling Game Center for the app

1. App Store Connect → the app → Game Center: turn it on for the app record.
2. Xcode → App target → Signing & Capabilities: **Game Center** is already in
   `ios/App/App/App.entitlements`; with automatic signing Xcode adds the
   capability to the App ID the first time you build with your team selected.
3. Leaderboards created in App Store Connect work in TestFlight and in the
   Simulator once you sign in to a Game Center account (Settings → Game Center
   on the simulated device). Sandbox scores do not reach the live leaderboards.

## Open question for Dan

**Set mode scores:** Set mode plays user-made level sets, so scores between two
players are not comparable. The three `set.*` leaderboards exist because the
plan asked for every mode, but it would be reasonable to leave them out of App
Store Connect; the app simply gets `submitted: false` for an unknown ID.

## Plugin

The bridge is a small local Capacitor plugin, no third-party dependency:
`ios/App/App/GameCenterPlugin.swift` (methods `isAuthenticated`, `signIn`,
`submitScore`, `showLeaderboard`), registered in `CDViewController.swift`.
The JS side is `window.CDNative` in `build.js`.
