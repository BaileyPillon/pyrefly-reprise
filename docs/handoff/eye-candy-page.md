# The EYE CANDY page (D-317, option A)

**Decision.** Bailey, 2026-10-02 ~01:15 EDT, on the settings options page (recommendation A): "all your
recommendations, godspeed" (D-317). It builds D-297 (2026-09-29: "in the settings I want to be able to turn each one
off. Default will be on.") for the nine new parts of the MAX mix (D-316). Approved target: the `a1-list-*`,
`a2-page-*` and `a3-page-reduce-motion-*` frames in `docs/concepts/eye-candy-settings-2026-10-02/` and that folder's
README (the model, the names, the keys, §7 "Notes for whoever builds the pick").

**Branch** `eye-candy-page` in `D:/pyrefly-advisor-v4`, from `ef3f6bbf` (release 35): the code in `56798bd1`, this
hand-off, the preflight, the contract note and the screenshots in the commit after it. Not pushed, not deployed.
**Save-data class:** a deep review runs before it goes live (`docs/plans/eye-candy-page-review.md`, rule-15 preflight).

**Game case: both.** One pause and one save serve FFX and FFX-2. OVERDRIVE SHOT is listed only in an FFX chapter and
DRESSPHERE SHOT only in an FFX-2 chapter (the Overdrive input is FFX's, `research/ffx-combat-core.md` §5; the
spherechange sequence is FFX-2 only, `research/ffx-vs-ffx2-presentation.md` §6), so each game shows 11 of the 12
switches. Accents are the pause's own `--pu-accent`: gold in FFX, pyre pink in FFX-2. FF7 shows no EYE CANDY row.
Checked in Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`).

## What was built, where

| Part | File |
|---|---|
| The seam the MAX mix's looks read, byte-identical with the mix-build lane's copy (blob `7c80d69b`) | `src/engine/fx/eyeCandyFlags.ts` |
| The nine parts: table, defaults, the upgrade rule, the master rule, the seam's provider, counts, ALL ON / ALL OFF | `src/app/fxParts.ts` (new) |
| The three looks gain their seam keys | `src/app/fxLooks.ts` |
| `Settings` extends `FxPartSettings`; defaults; the upgrade wired with no line growth (573 lines, as before) | `src/app/SaveData.ts`, `src/app/saveComfort.ts` |
| The provider installed at boot and on every settings write; `__pyrefly.fx.snapshot().flags` reads the seam | `src/app/applyComfort.ts` |
| OPTIONS: one EYE CANDY row (ALL ON, ALL OFF or `n OF 11`) where the three look rows were; FF7 drops it | `src/app/screens/PauseScreenPanels.ts`, `pause/panels.ts` |
| The row opens the page; the twelve switches flip through `adjustSetting` | `pause/actions.ts`, `pause/settings.ts` |
| The page: markup, cursor, flips, help line, REDUCE MOTION note, snapshot | `src/app/screens/pause/eyeCandyPage.ts` (new) |
| Open / close / input while up, one `pageInput` for CREDITS and EYE CANDY | `pause/PauseOverlays.ts` |
| Wiring, focus back to the row, `eyeCandy` in the pause snapshot (kept at 399 lines) | `src/app/screens/PauseScreen.ts` |
| Styles, the cursor-dot fix (own file: `pause-screen.css` is past the cap) | `src/ui/common/pause-eye-candy.css` (new) |
| Saves written by the live release-33, -34 and -35 builds, each with a look OFF | `tests/fixtures/saves/release-33.json`, `-34`, `-35` |
| Tests | `tests/unit/fx-parts-model.test.ts`, `save-fx-parts.test.ts`, `pause-eye-candy-page.test.ts` (new); `pause-fx-looks-rows`, `save-fx-looks`, `save-comfort-migration`, `pause-remake` (re-pinned) |

## The rules as built

- **Twelve switches, all default ON.** The three looks keep their ids (`fxLight`, `fxLiving`, `fxSpectacle`); the nine
  parts are `fxDof`, `fxFog`, `fxEdges` (CINEMA LIGHT), `fxBreath`, `fxKo` (LIVING PAINTINGS), `fxFraming`, `fxHero`
  (OVERDRIVE SHOT, FFX), `fxSphere` (DRESSPHERE SHOT, FFX-2), `fxSplash` (BATTLE SPECTACLE).
- **A look is the master of its parts.** A part plays only while its look is ON (`fxSwitchOn`). Turning a look OFF never
  rewrites its parts: they keep their own values and the page draws them dim. A part turned OFF stays OFF when its look
  returns.
- **Upgrade (once).** A part the stored blob does not hold as a boolean takes its look's value (`migrateFxParts`,
  reading the raw blob). Releases 33 to 35 store the looks and no parts: a look OFF brings its parts in OFF, the rest
  ON. Releases 32 and older store no looks: everything ON. Any non-boolean part follows its look (CHK-024). After the
  first write every part is stored, so the rule never fires again; `SAVE_VERSION` stays 1; `migrate` is idempotent.
- **ALL LOOKS** reads ALL ON, ALL OFF or MIXED from what plays among the game's 11. ALL ON sets all twelve ON (both
  games' shots included); ALL OFF turns the three looks OFF, which stops every part, and leaves each part its own value
  for when its look returns. Left is ALL OFF, Right is ALL ON, Confirm and a tap flip between ALL ON and not.
- **The seam.** `applyComfort` installs `eyeCandyProviderFor(settings)` at boot (the `SaveStore` constructor) and on
  every settings write: a look key answers the look, a part key look AND part, an unknown key ON.
- **REDUCE MOTION still wins, where motion plays.** It never writes or changes a switch or the seam's answer. The page
  shows it: the heading says REDUCE MOTION IS ON, BREATHING reads `ON · STILL`, KO COLLAPSE, OVERDRIVE SHOT and
  DRESSPHERE SHOT `ON · CUT` (read through `prefersReducedMotion`, the OPTIONS row or the OS).

Inputs: keys (Down into OPTIONS to EYE CANDY, Enter / Right / Left open it; Up / Down walk one list, column one then
column two, wrapping; Left / Right / Enter flip), the pad (the D-pad and stick walk, Cross flips, Circle and Start go
back, L1 / R1 close it and change tab), pointer and touch (a tap on the row opens it, a tap on a switch flips it and
puts the cursor there, the `Esc BACK` prompt goes back). Esc, X and Backspace go back with the cursor **and** DOM focus
on EYE CANDY; Q / E or a tab click close it and change tab; P still resumes, H still hides the chrome (as CREDITS).

## Proof

- **Gates.** `npx tsc --noEmit` clean; full `npx vitest run --testTimeout=60000`: 742 files passed, 5 skipped, 10 935
  tests passed; `node tools/orphans.mjs`: 24 orphaned, the same 24 as main (the three new modules are reachable).
- **Real input, headless** (Playwright from node, `PYREFLY_BROWSER=gpu`, the worktree's dev server on port 5744,
  stopped after): 126 of 126 checks in Chapter I and Chapter IV at 1600x900 and 390x844. Each opens the page by keys,
  by mouse and by touch (on the phone: one real finger swipe brings EYE CANDY into the five-row window, then a tap),
  flips a part (FOG), a look (LIVING PAINTINGS), ALL OFF, ALL ON by keys, the same by clicks, and FOG, LIVING PAINTINGS
  and the game's shot by taps; closes it by Esc, by the clicked and by the tapped `Esc BACK`; reloads and finds every
  switch in the save, in localStorage, on the seam (`__pyrefly.fx.snapshot().flags`) and on the page (EYE CANDY reads
  `6 OF 11`); checks REDUCE MOTION (FFX desktop, FFX-2 phone) and the mirrored pause (YUNA, PAINE). Layout: rows 40 px
  on a phone, all twelve on one screen (scroll height 570 in a 570 box), the help line pinned under them; on a desktop
  the page ends at y=599 and the objective line at y=702 stays visible: the numbers the mockup round measured.
- **CHK-024 in the browser:** 21 of 21. The release-33 (LIVING PAINTINGS OFF), -34 (CINEMA LIGHT and BATTLE SPECTACLE
  OFF) and -35 (BATTLE SPECTACLE OFF) saves, written by those live builds themselves (their parked gate dists) and put
  in localStorage before boot: the OFF looks' parts come up OFF and dim, every other part ON, every other setting,
  clear, best time and coach id verbatim, the seam OFF for them from boot; turning the look back ON with real keys
  brings the look and keeps its parts OFF, and a reload keeps that.
- **The cursor-dot fix:** with EYE CANDY selected the dot's box lies inside the scrolling settings column and its centre
  pixel is the accent (gold `227,185,74`, pink `247,182,217`), in both games, both sizes and the mirror. On the phone a
  row past the fifth sits on the window's faded last row (PR-0098), so its dot is dimmed with its text (79 %); TEXT
  SPEED, the fourth row, shows it at full strength.
- **Other windows** (real keys): 1280x720 (FFX), 1024x768 (FFX-2) and 1920x1080 (FFX) fit with no label cut and nothing
  over the objective line; 844x390 (a phone held sideways, which gets the desktop layout) scrolls the list under the
  credits panel's fades, and walking to KO COLLAPSE, the lowest row, scrolls it into view.
- Scripts (agent scratch): `D:/Tools/pyrefly-scratch/2026-10-02-eyecandy-page/` `prove.mjs`, `prove-fixtures.mjs`,
  `sizes.mjs`, `export-fixtures.mjs` (made the three fixtures), `lib.mjs`, `serve.mjs`; reports in `out/`.

## Target vs build

| Target (approved) | Build |
|---|---|
| `a2-page-ffx-1600x900.jpg` | `docs/screenshots/eye-candy-page-ffx-1600x900.png` |
| `a2-page-ffx2-1600x900.jpg` | `docs/screenshots/eye-candy-page-ffx2-1600x900.png` |
| `a2-page-ffx-390x844.jpg` | `docs/screenshots/eye-candy-page-ffx-390x844.png` |
| `a2-page-ffx2-390x844.jpg` | `docs/screenshots/eye-candy-page-ffx2-390x844.png` |
| `a1-list-ffx-1600x900.jpg` | `docs/screenshots/eye-candy-page-options-ffx-1600x900.png` |
| `a3-page-reduce-motion-ffx-1600x900.jpg` | `docs/screenshots/eye-candy-page-reduce-motion-ffx-1600x900.png` |

Same state, same cursor, same geometry. Every visible difference:

1. **The help line's game note drops "NEW."**: FFX ONLY., FFX-2 ONLY., BOTH GAMES. (the frames: "FFX ONLY. NEW."). It
   annotated the round for Bailey and would be wrong in a shipped menu after this release; the looks' "TODAY'S ROW."
   (in the mock's script, in no frame) is dropped for the same reason. One table in `eyeCandyPage.ts` to restore.
2. **LIVING PAINTINGS' help** (in no frame) does not mention the living pause portraits: they are not delivered
   (release 35, FR-35-01, "do not announce them"). It reads "Scenery that moves: depth, weather, lamplight and a slow
   drift of the camera." Every other help line is the mock's own text.
3. **The OPTIONS list draws the cursor dot** (the defect the round found); the `a1` frames, made on the old build, have none.
4. Not in any frame, built as the frames' mirror: the page under a mirrored plate (YUNA or KIMAHRI in FFX, PAINE in
   FFX-2) anchors right, labels right-aligned with the dash after them, the dot on the right; a short window scrolls the
   list with the credits panel's fades.
5. The page opens with the cursor on ALL LOOKS (the frames place it on a part to show its help).

## Open items

- **The nine parts switch nothing yet.** The looks they control are being ported on the mix-build lane
  (`D:/pyrefly-fb-camera`); each play site must ask `eyeCandyOn(key)` (and apply REDUCE MOTION itself). Until then the
  page writes, persists and answers correctly, but only the three looks change the picture. Merge order: either lane
  first; `eyeCandyFlags.ts` is the same blob in both.
- Polish, not in any frame: at 844x390 the help line sits under the list's fold (it scrolls into view with the list).
- **For Bailey (inferred, not named; rule 15):** dropping "NEW." from the help lines; ALL OFF as "the three looks OFF,
  parts keep their values" (ALL ON sets all twelve); the mirror layout; the LIVING PAINTINGS help text.
- `docs/target/decisions.json` D-317 `delivery` can move to `implemented` (branch only) when the driver records it;
  this lane did not touch the decisions file or NOW.md.
- Deep review before deploy (save-data class): the checklist is §4 of `docs/plans/eye-candy-page-review.md`.
