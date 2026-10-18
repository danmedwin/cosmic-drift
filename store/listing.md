# Cosmic Drift: Workshop, App Store Connect listing

Everything below is paste-ready. Each text field sits in its own code block, and
the character counts were measured by script (Unicode characters, spaces and
line breaks included). There are no em-dashes or en-dashes anywhere.

| Field | Limit | Used |
|---|---|---|
| App name | 30 | 22 |
| Subtitle | 30 | 20 |
| Promotional text | 170 | 139 |
| Description | 4,000 | 2,567 |
| Keywords | 100 | 96 |
| App Review notes | 4,000 | 2,859 |

## App information

**Name** (22 / 30)

```
Cosmic Drift: Workshop
```

**Subtitle** (20 / 30)

```
Block Shooter Puzzle
```

**Promotional text** (139 / 170). This one can be edited any time
without a new build.

```
Fire one shot and watch a chain reaction clear the board. Then open the Workshop and build your own levels, blocks and ships. Free to play.
```

**Description** (2,567 / 4,000)

```
Aim. Fire. Watch the whole board go.

Cosmic Drift is a block shooter puzzle with a chain reaction at its heart. Slide your ship under a column, take one shot, and see what happens next. Lightning blocks arc across the grid. Acid barrels burst into the blocks around them. Cross shots fire in every direction. Plasma cells, crates, drones and force fields turn every level into a little machine you have to read before you pull the trigger. Plan the right first shot and a single tap can clear the board. Plan it wrong and you will be spending reactor cores.

THREE WAYS TO PLAY
Infinite: endless levels that grow as you do. New block types and power-ups arrive gradually, and you earn reactor cores as you climb.
Solve: hand-built challenge levels with fixed layouts and a fixed starting setup. Find the shot that works.
Set: play a custom sequence of levels, in order, that you or a friend built in the Workshop.

THE WORKSHOP
Cosmic Drift: Workshop has a full creative suite built in. Make the game you want to play, then share it.
Level Builder: paint your own grids with every block type, set your plasma, and test as you go.
Block Designer: draw custom block skins with shapes, colors, borders, patterns, icons and glow.
VFX Studio: tune the visual effects.
UFO Customizer: configure the alien hull.
Hangar: build your own ship from parts, or start from a model and make it yours.
Plasma Lab: design your plasma effects.
Set Editor: bundle levels and designs into sets.
Share any level, design or set with the iOS share sheet and let someone else play it. Levels that are shared or imported always play in full, free.

MADE FOR PHONE AND IPAD
Haptics on every shot and every chain reaction. Game Center leaderboards for Infinite and Solve. Plays fully offline. No ads, no accounts, no tracking, nothing to sign in to. Your progress and your designs stay on your device.

FREE, AND WHAT THE WORKSHOP PASS ADDS
The game is free to download and free to play, and nothing ever interrupts a level.
Free: all of Infinite mode, Solve levels 15 to 50, the Level Builder with up to 3 saved levels, Game Center leaderboards, and playing any level that is shared with you.
Workshop Pass, a one-time purchase (US $4.99): unlimited saved levels, Block Designer, VFX Studio, UFO Customizer, Hangar, Plasma Lab, Set Editor and Set mode, and Solve levels 55 to 100.
The Pass is a single purchase. No subscription, no consumables, no ads. You can restore it at any time from the Workshop on any device signed in to your Apple Account.

Designed by Dan Medwin. Built with Claude.
```

**Keywords** (96 / 100)

Comma separated, no spaces. None of the words in the name (cosmic, drift,
workshop) appear. The subtitle words (block, shooter, puzzle) and the category
words are left out too, because Apple already indexes them.

```
arcade,brick,breaker,level,editor,builder,maker,create,design,custom,chain,reaction,ship,sandbox
```

**Support URL**

```
https://cosmicdriftapp.com
```

**Privacy Policy URL**

```
https://cosmicdriftapp.com/privacy.html
```

**Marketing URL** (optional)

```
https://cosmicdriftapp.com
```

**Copyright**

```
2026 Dan Medwin
```

**Version**: 1.0 (matches `MARKETING_VERSION` in the Xcode project). Leave
"What's New" at its default for a first release.

## Categories

- Primary: **Games**, subcategory **Puzzle**
- Secondary: **Games**, subcategory **Arcade**

Puzzle first because the core loop is a one-shot grid puzzle. Arcade second
because the closest comparable, Geometry Dash, lives there and the Workshop is
the selling point.

## Age rating questionnaire

Answer every content question **None** or **No**, in App Store Connect under
App Information > Age Rating > Edit. The expected result is **4+**.

| Question | Answer | Why |
|---|---|---|
| Cartoon or Fantasy Violence | None | Blocks break and chain-react. No characters, creatures or people are harmed. |
| Realistic Violence | None | |
| Prolonged Graphic or Sadistic Realistic Violence | None | |
| Guns or Other Weapons | None | The ship fires abstract plasma at blocks. |
| Profanity or Crude Humor | None | |
| Mature or Suggestive Themes | None | |
| Sexual Content or Nudity | None | |
| Graphic Sexual Content and Nudity | None | |
| Horror or Fear Themes | None | |
| Alcohol, Tobacco, or Drug Use or References | None | |
| Medical or Treatment Information / Health or Wellness | None / No | |
| Simulated Gambling | None | The Workshop Pass is a fixed-price unlock. No loot boxes, random rewards or paid currency. |
| Contests | None | |
| Gambling (real money) | No | |
| Unrestricted Web Access | No | The only web links open Apple's standard EULA in Safari. |
| User-Generated Content | No | Players export and import their own levels as text, but nothing is hosted, uploaded or shared inside the app. No accounts, community or chat. |
| Messaging and Chat | No | |
| Advertising | No | |
| Parental Controls / Age Assurance | No | |

## App Privacy

App Store Connect > App Privacy > Data Types: answer
**"No, we do not collect data from this app"**. The label then reads
**Data Not Collected**. Tracking: **No**. Leave the Privacy Choices URL blank.

This is accurate: no analytics, no advertising, no tracking, no accounts, no
third-party SDKs, and no network requests while playing. Progress and designs
stay on the device. Game Center and StoreKit are Apple's own frameworks, and
the app itself receives no personal data from either. `privacy.html` (also
shown inside the app) says the same.

## Export compliance

The app uses only encryption that is exempt: HTTPS and the encryption built
into iOS (StoreKit and Game Center). It has no proprietary or custom
cryptography.

- "Does your app use encryption?" Answer so that it counts as **exempt
  encryption only** (answer **No** to "uses non-exempt encryption").
- `ITSAppUsesNonExemptEncryption` is already `false` in
  `ios/App/App/Info.plist`, so App Store Connect should not ask again on each
  upload. If it does ask anyway, give the same answer.
- No French encryption declaration is needed for exempt-only use, and the EU
  is excluded from availability.

## Content rights

"Does your app contain, show, or access third-party content?" Answer **Yes**,
and confirm the rights: the music is "Space Fighter Loop" by Kevin MacLeod
(incompetech.com), licensed CC BY 4.0, credited in the in-app Credits screen
and in `privacy.html`.

## Availability and pricing

- Base price: **Free**. The Workshop Pass is the in-app purchase, see `iap.md`.
- Territories: all except the **European Union** member states (the plan
  excludes the EU, so no EU trader declaration is needed).
- Minimum iOS: 15.0 (the project's deployment target).
- Game Center: enable it for the app. The six leaderboards already exist, see
  `GAMECENTER.md`.

## App Review notes

Paste into App Store Connect > the version page > App Review Information >
Notes (2,859 / 4,000). Sign-in required: **No**. Leave the demo account
fields empty. The contact fields (name, phone, email) are Dan's to fill in and
are not stored in the repo.

```
Cosmic Drift: Workshop is a block shooter puzzle game plus a seven-module creative suite called the Workshop. There is no login, no account and no demo credentials: the app opens straight to the title screen and nothing asks you to sign in.

HOW TO PLAY (30 seconds)
1. On the title screen choose INFINITE and tap PLAY. Choose "Skip Training Levels" if the welcome dialog appears.
2. Tap a column to move the ship under it, then tap the ship to fire. Blocks break and trigger chain reactions. Clear every breakable block to finish the level.

THE WORKSHOP
Tap the WORKSHOP switch on the title screen. The Workshop is a set of editors (Level Builder, Block Designer, VFX Studio, UFO Customizer, Hangar, Plasma Lab, Set Editor) where players make their own levels, block skins, effects and ships, then play them in the game or share them as text. Nothing is uploaded or hosted: shared items are plain text passed through the iOS share sheet or the clipboard.

HOW TO REACH THE PAYWALL
Title screen > WORKSHOP > tap the WORKSHOP PASS panel (below the module list), or tap any module with a lock and PASS chip (Block Designer, VFX Studio, UFO Customizer, Hangar, Plasma Lab, Set Editor). A card shows "Unlock the full Workshop" with the price and a Restore Purchases button. The paywall can also be reached from the title screen by tapping the SET mode button (lock icon) or by trying a Solve level above 50.
The Workshop Pass (com.medwin.cosmicdrift.workshoppass) is one non-consumable, one-time purchase. It is not a subscription. Free tier: all of Infinite mode, Solve levels 15 to 50, Level Builder with up to 3 saved levels, and playing shared or imported levels.

NATIVE FEATURES (this is not a website wrapper)
- Game Center: scores for Infinite and Solve post to six leaderboards (mode x difficulty). The LEADERBOARDS button on the title screen opens the native Game Center sheet.
- Haptics: UIKit haptic feedback on each shot, each destroyed block (rate-limited during chain reactions) and on level clear.
- Offline play: the whole game, all fonts, music and art ship inside the app. It makes no network requests while playing, so it works in airplane mode.
- Native share sheet: every Workshop export screen has a Share button that opens the iOS share sheet.
- Native storage: progress, best scores and designs are mirrored to UserDefaults (Capacitor Preferences) so they survive the system clearing web view data.
- StoreKit 2 for the Workshop Pass, including Restore Purchases and handling of refunds and purchases made on other devices.

PRIVACY
No analytics, no ads, no tracking, no accounts, no third-party SDKs. App Privacy is "Data Not Collected". The privacy policy is also bundled and shown inside the app from the paywall.

The music is "Space Fighter Loop" by Kevin MacLeod (incompetech.com), CC BY 4.0, credited in the in-app Credits screen.
```
