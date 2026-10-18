# Vendored third-party files

Everything the built pages need is served from this folder so the app works
with no network connection (App Store / Capacitor build).

| File | Source | License |
|---|---|---|
| `react.production.min.js` | React 18.3.1 UMD build (unpkg.com/react@18.3.1/umd/) | MIT |
| `capacitor.js` | @capacitor/core 8.5.3 `dist/capacitor.js` browser build (copied by hand; re-copy after a Capacitor upgrade) | MIT |
| `react-dom.production.min.js` | ReactDOM 18.3.1 UMD build (unpkg.com/react-dom@18.3.1/umd/) | MIT |
| `fonts/quicksand-latin.woff2` | Quicksand variable font, latin subset (Google Fonts, v37) | SIL Open Font License 1.1 |
| `fonts/exo2-latin.woff2` | Exo 2 variable font, latin subset (Google Fonts, v26) | SIL Open Font License 1.1 |
| `fonts/jetbrains-mono-latin.woff2` | JetBrains Mono variable font, latin subset (Google Fonts, v24) | SIL Open Font License 1.1 |

The `@font-face` rules that register these fonts live in `build.js`, so the
family names used in the JSX sources ("Quicksand", "Exo 2", "JetBrains Mono")
are unchanged.

`capacitor.js` defines `window.Capacitor`. In a browser it reports platform `web` and
every native call in `window.CDNative` (built by `build.js`) is a no-op; inside the iOS app
it routes plugin calls to the native bridge.
