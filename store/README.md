# App Store Connect package: Cosmic Drift: Workshop

Everything needed to fill in the listing, ready to paste or upload.

| File | What it is |
|---|---|
| `listing.md` | Name, subtitle, promo text, description, keywords, URLs, categories, age rating, App Privacy, export compliance, content rights, App Review notes. Character counts included. |
| `iap.md` | The Workshop Pass in-app purchase: product fields, description, review screenshot, review notes. |
| `screenshots/final/` | Framed marketing screenshots at Apple's required sizes. **Upload these.** |
| `screenshots/raw/` | Untouched Simulator captures at native resolution. Use `iphone-08-paywall.png` as the IAP review screenshot. |
| `frame_screenshots.py` | Rebuilds `final/` from `raw/` (Pillow). Captions live in the `CAPTIONS` table at the top. |

App: App Store Connect app ID 6824282421, bundle ID `com.medwin.cosmicdrift`.

## Do this first: privacy contact email

`privacy.html` still contains `CONTACT_EMAIL_PLACEHOLDER` (twice, in the
Contact section). Replace it with a real address, deploy the page to
`https://cosmicdriftapp.com/privacy.html`, and run `npm run ios:sync` so the
copy bundled in the app (shown from the paywall) matches. App Review opens the
Privacy Policy URL, so do not submit while the placeholder is live.

## Order of work in App Store Connect

1. **Business > Agreements**: accept the Paid Applications Agreement and finish
   banking and tax forms. The in-app purchase cannot go live without it.
2. **App Information**: name, subtitle, category (Games > Puzzle, secondary
   Arcade), content rights, age rating. Values in `listing.md`.
3. **Pricing and Availability**: Free, all territories except the EU.
4. **App Privacy**: "Data Not Collected", Privacy Policy URL (needs the email fix above). Values in `listing.md`.
5. **Game Center**: turn it on for the app. The six leaderboards are already
   created (see `GAMECENTER.md`).
6. **Monetization > In-App Purchases**: create the Workshop Pass from `iap.md`,
   upload `raw/iphone-08-paywall.png` as its review screenshot.
7. **Version 1.0 page**: upload the screenshots (below), paste the promotional
   text, description, keywords, support URL, marketing URL, copyright.
8. **Version 1.0 page > In-App Purchases and Subscriptions**: attach the
   Workshop Pass. Skipping this is a common rejection ("no products found").
9. **App Review Information**: paste the notes from `listing.md`, leave sign-in
   off, fill in your contact name, phone and email.
10. **Build**: in Xcode set your team under Signing & Capabilities, Archive,
    upload, then pick the build on the version page. Export compliance should
    not prompt because `ITSAppUsesNonExemptEncryption` is already `false`.
11. **Add for Review**.

## Screenshots

Upload from `screenshots/final/`, in file-name order (the numbers are the
display order). Apple only requires the largest size per device family; it
scales the rest.

| Device slot in ASC | Size | Files |
|---|---|---|
| iPhone with Dynamic Island (medium display), the required slot | 1206 x 2622 | `final/medium/iphone-01` to `iphone-08` |
| iPhone with Dynamic Island (large display), optional | 1320 x 2868 | `final/iphone-01` to `iphone-08` |
| iPad 13" display, required | 2064 x 2752 | `final/ipad-01` to `ipad-08` |

App Store Connect rejects a 1320 x 2868 file in the medium slot ("File dimensions
are invalid"), so upload the `medium/` set there. The large slot is optional; if it
is not shown on the version page, skip it and Apple scales the medium set.

The first three show in search results, so the order is: chain reaction,
Workshop, Level Builder, then Block Designer, Hangar, Level Clear, title
screen, paywall. Drop the paywall one if you would rather not show a price
screen in the carousel.

## Decisions and risks for Dan

- **Possible trademark problem in the Hangar.** The ship model picker (Hangar >
  Edit > Models) lists "Red 5", "Millenia Falcon", "Star Track", "Bird of Play",
  "Police Box", "My Tie", and the sample ship "USS Driftwood" resembles a
  Federation starship. These read as references to Star Wars, Star Trek and
  Doctor Who. App Review can reject on IP grounds (guideline 5.2), and
  screenshots or review notes that show them make it more likely. The marketing
  screenshots avoid them (the Hangar shot uses the neutral "Artie-2" rocket and
  shows the parts list, not the model grid). Consider renaming or removing
  those models before submission.
- **The iPad layout is a phone-width column.** During gameplay on the iPad the
  board is a narrow strip centered on a wide empty screen, so the ship and
  blocks look small in the iPad screenshots, and the Workshop screens leave a
  large empty area below the module list. Fixing that means changing the game
  layout for wide screens, which this phase did not touch.
- The Simulator draws a stray grey arc in the bottom-right corner of iPad
  captures. `frame_screenshots.py` paints it out of the framed versions; the
  raw files keep it.
- The paywall and Workshop screenshots were captured on a fresh Simulator
  install with the Pass bought through the local StoreKit test file, so the
  Workshop splash shows the sample content that ships in the app (First Contact
  level, block designs, ships).
- Subtitle and keyword choices are mine from the viability report. Change them
  freely; the counts in `listing.md` show how much room there is.
- The keywords leave out "puzzle", "shooter", "block" and "game" because the
  subtitle and category already cover them.
- App Review notes and the IAP review notes both describe how to reach the
  paywall, since Review cannot guess the Workshop switch is the way in.
