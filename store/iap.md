# Workshop Pass, in-app purchase metadata

App Store Connect > the app > Monetization > In-App Purchases > **+**. The
product ID must match `WorkshopPassPlugin.productID` exactly and cannot be
changed after creation. Background and testing steps: `IAP.md` in the repo root.

| Field | Value | Limit / count |
|---|---|---|
| Type | **Non-Consumable** | |
| Reference Name | `Workshop Pass` | internal only |
| Product ID | `com.medwin.cosmicdrift.workshoppass` | |
| Family Sharing | Off | |
| Availability | All territories except the EU (match the app) | |
| Price | **US $4.99** (the $4.99 price point, historically "Tier 5"). Accept the generated prices for other territories. | |
| Display Name (en-US) | `Workshop Pass` | 13 / 30 |
| Description (en-US) | `Unlock the full Workshop. One-time purchase.` | 44 / 45 |

Paste-ready:

```
Workshop Pass
```

```
Unlock the full Workshop. One-time purchase.
```

## What the Pass unlocks (for your own reference)

Unlimited saved levels in the Level Builder, Block Designer, VFX Studio, UFO
Customizer, Hangar, Plasma Lab, Set Editor and Set mode, and Solve levels 55 to
100. The free tier is all of Infinite mode, Solve levels 15 to 50, the Level
Builder with up to 3 saved levels, and playing shared or imported levels.

## Review screenshot

Use `store/screenshots/raw/iphone-08-paywall.png` (1320 x 2868, the paywall
card "Unlock the full Workshop" showing "UNLOCK - $4.99", Restore Purchases,
Privacy Policy and Terms of Use). Use the raw capture, not the framed one, so
Review sees the real screen. It was captured in the Simulator with the local
StoreKit test file, so the price shown is the test price; it matches the real
$4.99 point.

## Review notes (paste into the IAP's Review Notes)

```
Non-consumable, one-time unlock of the Workshop creative suite and unlimited saved levels. Not a subscription. To see the paywall: open the app, tap the WORKSHOP switch on the title screen, then tap the WORKSHOP PASS panel below the module list (or any module marked PASS). Restore Purchases is on the same card. There is no login.
```

## Before this can be "Ready to Submit"

- Accept the **Paid Applications Agreement** and finish banking and tax forms
  (Business > Agreements). Without it the product stays in "Missing Metadata"
  or sandbox purchases fail.
- Add the localization and the review screenshot above.
- On the app version page, scroll to **In-App Purchases and Subscriptions**
  and attach the Workshop Pass to version 1.0. If you skip this, Review
  rejects the build with "no products found".
