# Workshop Pass (in-app purchase)

The iOS app sells one thing: the **Workshop Pass**, a one-time, non-consumable
purchase at $4.99 that unlocks everything outside the free tier. No
subscription, no consumables, no third-party SDK (the privacy label stays
"Data Not Collected").

| | |
|---|---|
| Product ID | `com.medwin.cosmicdrift.workshoppass` |
| Type | Non-consumable |
| Price | $4.99 (Tier 5 in the US storefront; let App Store Connect set the other territories) |
| Display name | Workshop Pass |

## What is free, what the Pass unlocks

Free: the whole game in Infinite mode, Solve levels 15 to 50, the Level
Builder with up to **3 saved levels**, and sharing, importing and playing
shared levels in full. The Workshop splash and the game splash show the Pass
and its price; nothing ever interrupts live play.

The Pass: unlimited saved levels, Block Designer, VFX Studio, UFO Customizer,
Hangar, Plasma Lab, Sets (and Set mode in the game), Solve levels 55 to 100.

## How it is built

- `ios/App/App/WorkshopPassPlugin.swift`: a local Capacitor plugin on StoreKit 2
  (iOS 15+). Methods `getProduct`, `purchase`, `restore` (`AppStore.sync` then
  re-check), `isEntitled` (`Transaction.currentEntitlements`, ignoring revoked
  transactions). It listens to `Transaction.updates` for the app's lifetime and
  raises `entitlementChanged`, so a purchase, refund or restore on another
  device shows up while the app runs. Registered in `CDViewController.swift`.
- `build.js` defines `window.cdEntitlement` in both pages: `get()`,
  `unlocked()`, `subscribe(fn)`, `refresh()`, `getProduct()`, `purchase()`,
  `restore()`. The last known answer is cached in localStorage as
  `cd_workshop_pass` (mirrored to Preferences like every `cd_` key) so a
  paying player never sees a locked flash at launch; the real check runs on
  every launch and overrides the cache. On the plain web build there is no
  store and everything is unlocked.
- Each `.jsx` has `useEntitlement()` plus the paywall card (`WsPassCard` in the
  Workshop, `PassOverlay` in the game) and the gates: `FREE_LEVEL_LIMIT` (3)
  in the Workshop, `FREE_SOLVE_MAX` (50) in the game.
- The In-App Purchase capability is on the App target (`SystemCapabilities` in
  the project; it needs no entitlement key). With automatic signing Xcode adds
  it to the App ID on the first signed build.

### Test seam for the web build

In a browser, `localStorage.setItem("cd_dev_lock", "1")` and reload simulates a
locked install with a fake $4.99 store: Unlock "buys" (sets
`cd_dev_lock_owned`), Restore re-checks. Remove both keys and
`cd_workshop_pass` to go back to normal. The seam is inert whenever the native
plugin exists.

## Testing in the Simulator (no App Store Connect needed)

`ios/App/App/Products.storekit` is a StoreKit configuration file with the
product at $4.99. The shared scheme (`App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`)
attaches it to the Run action, so **running from Xcode** (Product → Run) gives
the app a local store. `xcrun simctl launch` does not apply StoreKit
configurations, so launch through Xcode when testing purchases.

1. `npm run ios:sync`, open the project (`npm run ios:open`), pick a simulator,
   Run.
2. Workshop → tap the Workshop Pass panel or any locked module → Unlock. The
   StoreKit test sheet appears; confirm. Everything unlocks in place.
3. Stop the app in Xcode and Run again: still unlocked (entitlement re-read on
   launch; the cache only covers the first frame).
4. Refund: Xcode → Debug → StoreKit → Manage Transactions, select the
   transaction, **Refund**. The app relocks live (`Transaction.updates`
   delivers the revocation) or on the next launch.
5. Restore: the StoreKit test store keeps its transaction history per app
   install, so deleting the app also deletes the test purchase; after a
   reinstall, Restore Purchases runs the simulated Apple Account sign-in and
   then reports "No Workshop Pass found" (verified). To prove the entitlement
   comes from StoreKit and not the app's cache, stop the app, delete
   `Library/WebKit`, `Library/Caches` and `Library/Preferences/*` inside the
   app's data container (`xcrun simctl get_app_container booted
   com.medwin.cosmicdrift data`) and Run again: it launches unlocked with no
   cache (verified). A true cross-install restore needs a real device and a
   sandbox Apple Account (below).

Also verified in the Simulator: the paywall's Terms of Use link opens Apple's
standard EULA in Safari with a "back to Cosmic Drift" affordance, and the
Privacy Policy link shows the bundled `privacy.html` inside the app.

Editor → Enable StoreKit Testing is not needed when the scheme carries the
configuration; "Ask to Buy" and failure cases can be toggled in the
configuration file's Editor menu.

## App Store Connect

App Store Connect → the app → **Monetization → In-App Purchases → +**:

| Field | Value |
|---|---|
| Type | Non-Consumable |
| Reference Name | Workshop Pass |
| Product ID | `com.medwin.cosmicdrift.workshoppass` |
| Availability | all territories |
| Price Schedule | $4.99 (US); accept the generated equivalents |
| Localization (en-US) display name | Workshop Pass |
| Localization description | Unlimited saved levels, every Workshop module, Sets and Set mode, Solve levels 55 to 100. One purchase, no subscription. |
| Review screenshot | a 1242 × 2208 (or any iPhone size) screenshot of the paywall: Workshop → Workshop Pass panel. Review notes: "Non-consumable unlock of the Workshop creative suite. Tap Workshop Pass on the Workshop splash to see the paywall; Restore Purchases is on the same screen." |

The product ID must match `WorkshopPassPlugin.productID` exactly; it cannot
be changed after creation. The product must be in "Ready to Submit" state and
**attached to the app version** (version page → In-App Purchases and
Subscriptions) when the first build is submitted, or review will fail with
"no products found".

Paid apps and in-app purchases also need the **Paid Applications
Agreement** accepted under Business → Agreements, with banking and tax forms
completed, before sandbox purchases work on a device and before the product
can go live.

## Testing with a sandbox Apple Account (real device)

1. App Store Connect → Users and Access → **Sandbox** → Test Accounts → +:
   any unused email (a plus-address of your own works), a password, region
   United States.
2. On the iPhone: Settings → App Store → scroll to **Sandbox Account** → sign
   in with that test account (do not sign out of your real Apple Account).
3. Install the app from Xcode or TestFlight. Buy: the sheet says
   "[Environment: Sandbox]"; no money changes hands. Restore Purchases runs
   `AppStore.sync`, which may ask for the sandbox password.
4. Settings → App Store → Sandbox Account → Manage lets you clear purchase
   history to test a fresh buy again; refunds can be simulated there too.

Things the Simulator cannot show: the real Apple sign-in sheet on Restore,
Ask to Buy approval, Family Sharing (off for this product), and the actual
localized price strings from App Store Connect.

## Open questions for Dan

- The free-tier level cap counts every level in My Levels, including imported
  ones (imports are always allowed). A free player with three imported levels
  cannot save a fourth from the builder until one is deleted. Alternative:
  count only builder-made levels.
- The Solve level picker (the "Solve Levels" list) was never wired to a
  control before this phase; it now opens when SOLVE is tapped while already
  selected, with a hint in the readout strip. Keep that gesture or move it?
- A free player who clears level 50 in Solve mode gets "Back to Menu" on the
  level-clear card, lands on the splash with the picker open and the locked
  rows visible; the paywall only appears if they tap one. Say if a stronger
  prompt is wanted.
