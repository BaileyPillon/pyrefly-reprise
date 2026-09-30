# Paper preflight: eye-candy D as the default look (both games)

Rule-15 preflight, written 2026-09-29 before any product code on `fx-d` changed for this track.
Track `eye-candy-d`. Worktree `D:/pyrefly-r29-plate`, branch `fx-d`, merged with origin/main at
`122015f4` (main had OPTIONS accessibility A2: REDUCE MOTION, LOW EFFECTS, TEXT SIZE, and the
camera rest-pose fix).

Bailey, verbatim, 2026-09-29 about 21:00 EDT, answering the driver's recommendations:

> "I'll go with all of your recommendations please"

The recommendation for eye candy was **option D, all three looks together** (A Golden-Hour Cinema
+ B Living Paintings + C Spectacle Combat), **after fixing the judge's must-fix list**, with the
three re-offers (B's figure sway, C's hit-stop, C's Overdrive/Special splash cut-in) and
Aerospark's lightning lance (D-233) carried as parts of D. The target is the options page
(`docs/concepts/eye-candy-2026-09-29/index.html`, D's stills in `d/stills/`), tuned by the judge's
list (`JUDGE.md`, "Defects that must be fixed").

## 1. What `critic-plan` says

```
node tools/critic-plan.mjs --paths src/engine/fx/EyeCandy.ts,src/engine/Renderer.ts,
  src/app/screens/BattleScreen.ts,src/engine/BattlePresenterBeats.ts,src/debug/fxApi.ts,
  .gitignore,tools/deploy-pages.mjs
  review:       DEEP
  before deploy: FOCUSED review of the production candidate
  after deploy:  live verification, then the DEEP review on the live build (this build owes it)
  because:      src/engine/Renderer.ts: global layout, input and boot is a shared system
  because:      src/engine/BattlePresenterBeats.ts: battle presenter and lifecycle is a shared system
  games:        both, all 18 chapters
```

Not the save-data class: nothing here writes the save or changes its schema (LOW EFFECTS and
REDUCE MOTION are read, never written). So the release path is focused before, deep after.

## 2. Game case (rule 14)

**Both, with a skin per game**, decided from `research/ffx-vs-ffx2-presentation.md` as the
options round already did: FFX (Chapters I to III, VII and the other FFX chapters) gold and calm,
anamorphic streaks, 85 ms holds on heavy blows, slow beams; FFX-2 (Chapters IV, V, XVI and the
other FFX-2 chapters) pink and quick, four-point stars, holds on crits only, beams 1.6x. The
plumbing (default switch, settings, tiers, derived files, perf) is shared. **FF7 never switches
any of it on** (every entry point already checks the game).

## 3. What changes, and the risk of each

| # | Change | Where | Risk | Guard |
|---|---|---|---|---|
| 1 | D is the default (no `?fx` = A + B + C; `?fx=off` = today's look) | `EyeCandy.ts` `parseFxQuery` | every chapter now draws D, including 14 rooms the options page never showed | (f) the 18-chapter loop; a room with no entry gets only the grade, bloom and combat layer (A's `sceneLookA` fallback, B's `ROOMS` lookup returns early) |
| 2 | The settings reach the fx in the product, not only via the debug API | new `src/app/fxEnv.ts`, called from `main.ts` | today `eyeCandy.env` is wired inside `installFxDebug`; if the debug API ever stops installing, REDUCE MOTION and LOW EFFECTS stop applying | one product module, one test |
| 3 | REDUCE MOTION: B's drift and sway, C's hit-stop, kicks and shakes, the victory orbit and the ink frame off; light and weather stay | `LivingPaintings.ts`, `SpectacleRules.ts` (already), `GoldenHour.ts` (already) | the brief keeps weather under REDUCE MOTION, B's option dropped it | read "keep light and weather still" as "light and weather stay"; the weather keeps drawing, the lamps' flicker and the lightning flash stay off (a flash, not weather) |
| 4 | LOW EFFECTS: the lighter tier (fewer particles, no reflections, no heat haze, no lens flare) | already the `low` tier of each option | none new | snapshot check per flag |
| 5 | Judge's must-fix 1 to 7 | `EyeCandy.ts` (`FX_OVERLAP`), `sceneLooks.ts`, `ambient/*.ts`, `HitDraw.ts`, `SpellMoments.ts`, `overdrive-splash.css` | tuning only, no new effect; a fix must not undo the "maximum eye candy" read | before/after capture per defect at the same frozen moment |
| 6 | Derived files (B's depth maps) leave git: `public/fx/` gitignored, backed up, verified before build and deploy | `.gitignore`, `tools/fx-assets.mjs` (new), `tools/deploy-pages.mjs`, `tools/deploy-classify.mjs` | a release worktree without `public/fx` would ship B with no plates (it falls back silently: `DepthPlates.build` throws, B draws weather only) | `fx-assets verify` refuses the deploy when a map is missing or its hash differs from the committed list |
| 7 | Tests and captures that must compare against today pass `?fx=off` | e2e / screenshot tools only if they compare pixels | a spec keyed on pixels would drift | grep the specs; unit tests run in Node where no renderer exists |

**Engine and RNG:** untouched (rule 1). C's hooks live in the presenter and only wait longer on a
heavy blow (hit-stop) or the victory (orbit); the engine's ATB clock never sees them. The FFX-2
Active clock: C's hit-stop freezes the field only (`stageDt`), never the engine, as the options
round measured.

**Files over 400 lines:** `BattleScreen.ts` (970) must not grow; `SpectacleFx.ts` is at 399 and
must not grow. New logic goes in new files or in the small ones.

## 4. The must-fix list, and the planned fix for each

1. **Whiteouts** (Mega Flare's white disc over Bahamut; Spiral Cut blanking the party): D-only
   overlap on `bloom` and `flare` (judge: 0.8), the Mega Flare shell and the hit core flash cooler
   in D, then re-shoot the special frame and measure that the target's region is not clipped.
2. **Gagazet's moon**: no lens streaks on Gagazet's moon when B is on, and a smaller source disc;
   the painted disc must read (measured: the moon's region not clipped to white).
3. **Buried backdrop**: A's `haze` lower in D, B's weather dial 0.8 at Bevelle; Gagazet's upper-left
   haze lowered.
4. **Hit rings hide the fighter**: thinner, more transparent rings; the hot core star smaller.
5. **Phone-tier spells clip to blobs**: lower spell and halo gain on the phone tier.
6. **Chapter IV splash title under the CHARGING chip**: move the name stamp clear of the FFX-2
   HUD's left column (measured by bounding boxes, not by eye).
7. **Djose's work lamp runs hot**: B's lamp gain 0.8 at Djose, A's lamp source weaker.

What the judge also listed and this track does **not** change: the re-offers are now approved as
parts of D (Bailey's yes to the recommendation), so they ship on; REDUCE FLASHES does not exist on
main yet (A2 shipped REDUCE MOTION, LOW EFFECTS and TEXT SIZE), so the ink frame is gated by REDUCE
MOTION as the brief says and by the flash budget; Bahamut's splash stays slab and name (no painting
is approved, none is made).

## 5. Evidence plan

- Before and after for each must-fix at the same seeded, frozen moment (`docs/concepts/eye-candy-2026-09-29/d-final/fixes/`).
- Perf gate (spec section 8) in Chapters I, IV, VII, XVI: desktop 1600x900 vsync p95 <= 17.0 ms and
  ON - OFF <= 0.3 ms; phone 390x844 DPR 3, CPU 4x, p95 <= 33.4 ms; plus an uncapped desktop run.
- All 18 chapters load and reach a player turn with D on, 0 console errors.
- Target vs build: D's stills re-shot at the options page's moments (rest, hit, spell, impact,
  special, victory; four chapters; desktop and phone) beside the options page frame.
- `npx tsc --noEmit`, the fx unit tests, `node tools/orphans.mjs`, the full suite once.

## 6. What would make me stop

- A fix that needs a new effect or a new painting (rule 9: nothing the mockup does not show).
- A must-fix that needs the engine touched.
- The perf gate failing with D on and no lighter tier inside the approved look.

## 7. Addendum (2026-09-30 ~00:30 EDT): the three look rows in OPTIONS (save-data class)

Bailey, verbatim, 2026-09-29 ~23:45 EDT: "Ok yes I picked D so all 3 together however in the settings I want to be
able to turn each one off. Default will be on. Please."

`critic-plan --paths src/app/SaveData.ts,src/app/saveComfort.ts,src/app/applyComfort.ts,src/app/screens/PauseScreenPanels.ts,src/app/screens/pause/settings.ts,src/app/screens/pause/panels.ts,src/engine/fx/EyeCandy.ts,src/app/fxEnv.ts`
now says **DEEP before deploy** (save data and settings is a shared system): this track is the **save-data class**
from here on, so section 1's "focused before, deep after" no longer holds. The release that carries it owes a deep
review of the production candidate before it goes public.

What is built (and nothing else):

| # | Change | Where | Risk | Guard |
|---|---|---|---|---|
| 8 | Three `Settings` booleans, `fxLight` (A, Golden-Hour Cinema; FFX-2's pink hour is the same switch), `fxLiving` (B) and `fxSpectacle` (C), default `true` | `SaveData.ts` (`Settings extends FxLookSettings`, one line, the file is over 400 and must not grow), new `src/app/fxLooks.ts` | an old save reads a missing field as `undefined` and a look goes dark for a veteran | `migrateComfort` coerces every non-boolean to `true`; `SAVE_VERSION` stays 1: the fields are additive and the `...raw.settings` spread already carries them (the `textSize` / `battleHelp` precedent); proven on the release-29, release-30 and release-31a fixtures that nothing else in the save changes |
| 9 | Three ON/OFF rows on the approved OPTIONS tab, under LOW EFFECTS: CINEMA LIGHT, LIVING PAINTINGS, BATTLE SPECTACLE | `PauseScreenPanels.ts` `optionRows`, `pause/settings.ts` `adjustSetting` | the settings column gets three rows taller at 390x844 | real keys (Left/Right, Enter), mouse and taps at 1600x900 and 390x844; the column must still fit; FF7 never shows them (it never draws eye candy) |
| 10 | A row applies live: `applyComfort` (called by `SaveStore` at construction, on a merge and on every settings write) hands the three flags to `eyeCandy.applyLooks` | `applyComfort.ts`, `EyeCandy.ts` | a URL `?fx=` must still win for tests and captures | `parseFxQuery` reports whether the URL named options; `applyLooks` is a no-op for that page load when it did |

REDUCE MOTION and LOW EFFECTS keep cutting their parts inside a look that is ON (they are read per frame and do not
touch `eyeCandy.on`). A look turned OFF draws nothing of that look (the same `eyeCandy.set(opt, false)` the options
round's ON/OFF captures used).

Not built: a per-row help line. The approved A2 frame (`docs/concepts/r29-options/shots/desk-A2.jpg`) has none on
any row, so none is added (rule 9); the question goes to Bailey. The rows had no mockup of their own; the
target-vs-build sheet puts the A2 frame beside the build with the three rows, and the README says so.
