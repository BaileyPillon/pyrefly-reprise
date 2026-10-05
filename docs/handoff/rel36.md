# rel36: the EYE CANDY page and the MAX mix on one branch, connected and proved end to end

**Decisions.** D-316 (Bailey, 2026-10-01, "all your recommendations, godspeed": the recommended MAX visuals mix) and D-317
(Bailey, 2026-10-02, the same words: the nine part switches on one EYE CANDY page, option A; it builds D-297, "in the settings I
want to be able to turn each one off. Default will be on."). Release 36 puts the two lanes on one branch and proves that every
switch on the page drives the part of the mix it names.

**Branch** `rel36` in `D:/pyrefly-advisor-v3`, from origin/main `39234415` (release 35, `ef3f6bbf`, and its live-check record).
Pushed to `origin/rel36`. **Not deployed; `main` untouched.** Save-data class (`src/app/SaveData.ts`): a deep review runs before
it goes live (see "Gates"). No retail asset; nothing written under `public/art`.

**Game case (rule 14): both.** One pause and one save serve FFX and FFX-2; the plumbing (seam, page, save, gates) is shared.
OVERDRIVE SHOT and its banner rule are FFX only (the Overdrive input is FFX's, `research/ffx-combat-core.md` section 5);
DRESSPHERE SHOT and the twirl-key slot are FFX-2 only (the spherechange sequence, `research/ffx-vs-ffx2-presentation.md` section
6). Each game's page lists 11 of the 12 switches; FF7 draws no mix and shows no EYE CANDY row. Proved in Chapter I (FFX,
`seymour-flux`) and Chapter IV (FFX-2, `ffx2-bahamut`).

## What merged

| Merge | Tip | Lane handoff | What it brings |
|---|---|---|---|
| `226a93aa` eye-candy-page | `7a4bed7e` | `docs/handoff/eye-candy-page.md` | the settings schema (`Settings` extends `FxPartSettings`: nine booleans, default ON, `SAVE_VERSION` stays 1) and the upgrade (`migrateFxParts`: a part the stored blob lacks takes its look's value, once), the EYE CANDY page (one OPTIONS row opens it), `applyComfort` installing the seam's provider at boot and on every settings write, the OPTIONS cursor-dot fix, three save fixtures from releases 33 to 35 |
| `334c8ae5` mix-build | `c8e4cb09` | `docs/handoff/mix-build.md` | the MAX mix: `src/engine/fx/mix/*` (18 files, none over 400 lines), its hooks in `LivingPaintings.ts` (bound with every FFX and FFX-2 battle), `battleSpectacle.ts` (the splash asks SPLASH ART first), `fxApi.ts` (`__pyrefly.fx.mix`), the NaN fix in `fx/c/FxPools.ts` |

No conflict. The only file both branches add is the seam, `src/engine/fx/eyeCandyFlags.ts`, the same git blob (`7c80d69b`) on both
sides, so the second merge added nothing to it. Rule 7 holds (largest new file `framing.ts`, 372 lines; `SaveData.ts` stays at its
573 and `PauseScreen.ts` at 399). Rule 2: the page lane's `docs/CONTRACT-CHANGES.md` entry came in with the merge; the mix lane
touches no contract file. This release adds one test file, this note and the screenshots below; no game code changed. (The fix commit on top, "Fixes after integration" at the end of this note, does change presentation code: the held shots under REDUCE MOTION, two help lines, and the device notes.)

## How the two halves connect

The page saves twelve settings fields; `applyComfort` installs `eyeCandyProviderFor(settings)` on the seam (a look key answers the
look, a part key the look AND the part); the mix asks the seam every frame and also reads the look through the existing OPTIONS-row
path (`eyeCandy.enabled(a|b|c)`), REDUCE MOTION and the tier (`engine/fx/mix/gates.ts`). The chain, switch by switch:

| Page switch (settings field) | Seam key | Mix part | What stops when it is OFF (the meter the proof reads) | Game |
|---|---|---|---|---|
| CINEMA LIGHT (`fxLight`) | `cinemaLight` | the look of A | DEPTH OF FIELD, FOG and SMOOTH EDGES below, and CINEMA LIGHT's own grade | both |
| DEPTH OF FIELD (`fxDof`) | `depthOfField` | `Cinema.dof` | the tilt-shift band is no longer re-aimed at the figures (the renderer's uniforms go back to the scene's own) | both, full tier |
| FOG (`fxFog`) | `fog` | `Cinema.fogUpdate` | the two `fx-mix-fog` meshes are hidden | both, not LOW |
| SMOOTH EDGES (`fxEdges`) | `smoothEdges` | `Cinema.aa` + the defringe | the SMAA pass (FXAA on the phone) leaves the composer; the figures' `mixDefringe` uniform and patch go | both |
| LIVING PAINTINGS (`fxLiving`) | `livingPaintings` | the look of B | BREATHING and KO COLLAPSE below | both |
| BREATHING (`fxBreath`) | `breathing` | `LivingFigure` | the chest-phase uniform is 0 and the figure's own whole-figure breathing is back | both |
| KO COLLAPSE (`fxKo`) | `koCollapse` | `LivingFigure.onSetPose` | the KO is today's crossfade: no buckle in the figure's shader | both |
| BATTLE SPECTACLE (`fxSpectacle`) | `battleSpectacle` | the look of C | CHAPTER FRAMING, the shot, SPLASH ART below, and C's own spell light and splash | both |
| CHAPTER FRAMING (`fxFraming`) | `chapterFraming` | `Framing` | the lens shift and BOSS SCALE at once; the camera rig back on today's with the next calm frame with no menu open | both |
| OVERDRIVE SHOT (`fxHero`) | `overdriveShot` | `HeldShots`, `OdBanner` | no hero cut while the Overdrive input is up; the name banner hangs where it always did | FFX |
| DRESSPHERE SHOT (`fxSphere`) | `dressphereShot` | `HeldShots`, `TwirlSlot` | no close cut on a spherechange | FFX-2 |
| SPLASH ART (`fxSplash`) | `splashArt` | `mixSplashArt` | the splash slab shows today's whole painting, not the focal crop | both |

`tests/unit/eye-candy-mix-connection.test.ts` (new, 33 tests) pins this table with no browser: the nine page keys are the nine
mix parts, each under the look the mix gates it by, and every switch closes exactly its parts in each game through the real
`applyComfort` and the existing look path. Its expectations are written out literally (field to part, field to look), so a pair
swapped in either table fails it: checked by swapping DEPTH OF FIELD's and FOG's keys in `fxParts.ts` (6 tests failed), then restoring.

## The end-to-end proof

**Method.** Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`, ANGLE D3D11), the worktree's own dev server on port 5760
(stopped afterwards), a fresh profile for every run and for every fight scenario. Every switch is flipped on the page by **real keys** (Escape opens the
pause, Q or E walks to OPTIONS, Down to the EYE CANDY row, Enter opens the page, Down walks, Enter flips, Left and Right on ALL
LOOKS, Escape walks back out) and, on the phone, by **real finger input** (CDP touch events: taps, one horizontal swipe on the tab
strip, one vertical swipe on the list). Each flip is checked at five levels: the page (the row's value, `n of 11 on`), the save
(`app.save.settings` and localStorage), the seam (`__pyrefly.fx.snapshot().flags`), the mix's gate (`snapshot().mix.parts`), and
the **effect itself**, read from the game's own objects and independent of the gates: the renderer's tilt-shift uniforms, the
composer's passes, the visible fog meshes, the figures' own shader uniforms (`mixDefringe`, the buckle, the chest phase), the
camera's view offset and the figures' screen boxes, the held-shot state with the camera's displacement, and the splash slab's
painting (its URL and natural size).

**Pixels (FFX Chapter I only).** Its CTB battle waits for the player, so with `fx.freeze` and the HUD hidden while the stills are
taken (the advisor card re-docks itself, which is DOM over the canvas) two shots 300 ms apart are identical (noise 0). Each part's
OFF frame differs from its ON frame (mean absolute difference, 0 to 255: DEPTH OF FIELD 0.36, FOG 0.37, SMOOTH EDGES 0.34,
BREATHING 0.86, CHAPTER FRAMING 34.4) and with the part ON again the frame is bit-identical (0). FFX-2's Active ATB keeps the fight
moving, so its frames are not still enough to compare: its proof is the meters.

**Labelled injections** (everything else is real input): (1) FFX, Tidus's Overdrive gauge is set to 100 before the first menu, so
the real menu offers the Overdrive (the mix lane's method); (2) FFX-2, Bahamut's action counter is set to 11 so his next turn is
Mega Flare (his loop is turn-counted, step 12), the only splash of Chapter IV, and in the long FFX-2 scenarios a keep-alive tops
the party's HP up and holds the counter at 3 or less until that step (Active ATB runs while the pause is closed); (3) a KO is
presentation-level: the call the presenter's KO beat makes (`actor.setPose('ko')`), read on the figure's own shader; (4) the
chapter is entered through `gotoChapter` (no title, cutscenes or prep).

**Result: 308 of 308 checks passed** (static 89 + 79, in the fight 57 + 49, phone 12 + 12, LOW EFFECTS 5 + 5), 0 console errors,
0 404s. Scripts and raw reports (agent scratch): `D:/Tools/pyrefly-scratch/2026-10-02-rel36/` (`lib.mjs`, `prove-static.mjs`,
`prove-dynamic.mjs`, `prove-phone.mjs`, `prove-low.mjs`, `shots.mjs`, `make-tables.mjs`, `out/*.json`).

### FFX Chapter I and FFX-2 Chapter IV, 1600x900: the static parts and the looks

Every row below passed at all five levels, both ways (OFF, then ON again). "ON then OFF" is what the effect meter read.

| Switch | FFX Ch I | FFX-2 Ch IV |
|---|---|---|
| DEPTH OF FIELD | tilt-shift band 0.5098 / 0.3931 -> the scene's own 0.4 / 0.16; pixels 0.36, back 0 | 0.4715 / 0.3727 -> the scene's own 0.54 / 0.15 |
| FOG | visible fog meshes 2 -> 0; pixels 0.37, back 0 | 2 -> 0 |
| SMOOTH EDGES | SMAA pass + defringe on 10 figures -> none; pixels 0.34, back 0 | SMAA + defringe on 8 -> none |
| BREATHING | chest phase 0.026 -> 0, the figure's own breathing 0 -> 0.016; pixels 0.86, back 0 | the same numbers |
| CHAPTER FRAMING | lens shift [-128, 36] -> none at once; pixels 34.4, back 0 | lens [128, 0] -> none at once; Bahamut 571 px -> 411 px at once |
| CINEMA LIGHT (the look) | DEPTH OF FIELD, FOG and SMOOTH EDGES all stop; their own switches stay ON and are drawn dim (`7 of 11`); BREATHING and the framing still play | the same |
| LIVING PAINTINGS (the look) | BREATHING stops (`8 of 11`); the other looks' effects still play | the same |
| BATTLE SPECTACLE (the look) | the lens shift stops (`7 of 11`); the other looks' effects still play | the same |
| ALL LOOKS, Left then Right | ALL OFF (`0 of 11`): no part gate open, no fog, no SMAA, no defringe, chest 0, no lens shift, figures breathe as today (0.016); ALL ON: all of it back | the same |
| Reload with FOG and LIVING PAINTINGS OFF | the save, localStorage and the seam hold both OFF at boot, before any battle; in the new battle fog 0, chest 0, the rest play; the page reads `7 of 11` (BREATHING and KO COLLAPSE `ON` but dim); ALL ON brings fog (2) and breathing (0.026) back | the same |

**CHAPTER FRAMING switched mid-fight** (the part with a delay, see finding 2): OFF takes the lens shift and BOSS SCALE away at
once; the camera rig goes back to today's after **1 action** in FFX Ch I (master `-0.01, 3.12, 9.93` -> `0, 3.05, 9.5`) and after
**2 actions** in FFX-2 Ch IV (the colossus master `1.03, 0.9, 8.69` fov 36 -> `0, 3, 9.6` fov 32). ON again shows nothing at once;
the chapter's plan is back after **1 action** in Ch I (lens `[-128, 36]`) and **4 actions** in Ch IV (Bahamut 419 px -> 584 px).

### The parts that need a moment in the fight (FFX Ch I: 57 of 57; FFX-2 Ch IV: 49 of 49)

Each scenario is a fresh profile and a fresh battle; the switches are flipped on the page at the first menu, then the fight
plays: a KO, then the game's shot through the real menu and input, then the splash.

| Scenario | KO COLLAPSE (the buckle in the figure's own shader) | OVERDRIVE SHOT, FFX (camera moved by) | Overdrive banner | SPLASH ART (Overdrive splash) |
|---|---|---|---|---|
| D1 every switch ON | collapse, buckle 0 -> 1, count 0 -> 1 | hero shot, 4.6 units | moved, top 22 % | crop of the painting, 788x664 blob |
| D2 KO COLLAPSE OFF | plain KO, buckle 0 | hero shot, 4.9 | moved | crop |
| D3 OVERDRIVE SHOT OFF | collapse | **master held, 0.25** | **not moved** | crop |
| D4 SPLASH ART OFF | collapse | hero shot, 4.8 | moved | **today's `attack.png`, 816x1135** |
| D5 BATTLE SPECTACLE OFF | collapse | **master held, 0.26** | **not moved** | **no splash at all** |
| D6 LIVING PAINTINGS OFF | **plain KO** | hero shot, 4.6 | moved | crop |
| D7 ALL OFF then ALL ON | collapse | hero shot, 4.8 | moved | crop |
| D8 shot and KO COLLAPSE OFF, reload | plain KO | master held, 0.36 | not moved | crop |

| Scenario | KO COLLAPSE | DRESSPHERE SHOT, FFX-2 (camera moved by; twirl changes) | SPLASH ART (Bahamut's Mega Flare) |
|---|---|---|---|
| D1 every switch ON | collapse, buckle 0 -> 1 | close shot, 4.3 units; 1 | crop of the splash painting, 1491x1491 blob |
| D2 KO COLLAPSE OFF | plain KO | close shot, 3.4; 1 | crop |
| D3 DRESSPHERE SHOT OFF | collapse | **master held, 0.98; 0** | crop |
| D4 SPLASH ART OFF | collapse | close shot, 3.2; 1 | **today's `ffx2-bahamut/splash.png`, 1656x1656** |
| D5 BATTLE SPECTACLE OFF | collapse | **master held, 0.53; 0** | **no splash at all** (Mega Flare is in the log) |
| D6 LIVING PAINTINGS OFF | **plain KO** | close shot, 3.8; 1 | crop |
| D7 ALL OFF then ALL ON | collapse | close shot, 3.2; 1 | crop |
| D8 shot and KO COLLAPSE OFF, reload | plain KO | master held, 0.35; 0 | crop |

**REDUCE MOTION** (the OPTIONS row, by real keys), both games: the page's heading reads REDUCE MOTION IS ON, BREATHING `ON · STILL`,
KO COLLAPSE `ON · CUT`, the game's shot `ON · CUT`, and every switch stays ON in the save and on the seam. The mix: BREATHING still
(chest 0), the fog's drift stops (uT constant), KO COLLAPSE is a plain cut (cuts +1, no buckle), **and no held shot plays** (FFX:
shots 0, the master holds, the banner rule still moves the slab; FFX-2: shots 0), the splash plays. See finding 1.

### The phone, 390x844, by touch only (FFX Ch I and FFX-2 Ch IV: 12 of 12 each)

PAUSE chip tapped; the tab strip swiped; OPTIONS tapped; the list swiped; the EYE CANDY row tapped (the page opens on 11 switches);
one tap on FOG flips it (`10 of 11`; the save and the seam hold FOG OFF and nothing else); `Esc BACK` tapped (the OPTIONS row reads
`10 OF 11`); `Esc resume` tapped. In the battle: fog meshes **2 -> 0**, smooth edges (FXAA, the phone tier) and breathing still play.
A second round taps FOG back ON and BREATHING OFF (fog 2, chest phase 0.026 -> 0); a tap on ALL LOOKS (MIXED) turns everything ON;
a reload with FOG tapped OFF keeps it (localStorage, seam at boot, no fog in the new battle). DEPTH OF FIELD is closed by the tier
on the phone (the tilt-shift stays), as the README's table says.

### LOW EFFECTS (the OPTIONS row), both games: 5 of 5 each

Tier `low`: fog 0 and DEPTH OF FIELD closed with their switches still ON, no post pass (SMAA gone), the defringe stays (10 and 8
figures), breathing plays; the page still reads `11 of 11`, nothing is written, the seam still answers ON for all twelve keys.

## Gates

- `npx tsc --noEmit`: clean (TypeScript 7.0.2).
- Full `npx vitest run --testTimeout=60000`: **746 files passed, 5 skipped; 11,002 tests passed, 40 skipped, 1 todo, 0 failed**
  (the two lanes' 745 files and 10,969 tests, plus the connection test's 33).
- `node tools/orphans.mjs`: 1177 modules, 24 orphaned: the same 24 as main (diffed); the 22 new modules are all reachable.
- `node tools/audio/qa.mjs --strict`: exit 0, 0 cues with findings, 0 sfx findings, 88.49 MB of the 90 MB budget.
- `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 469 ok, 0 mismatched, 0 missing. `node tools/fx-assets.mjs verify`: PASS.
- `node tools/critic-plan.mjs --json` (against the previous build `ef3f6bbf`): **depth `deep`, `deepBeforeDeploy: true`**,
  `focusedBeforeDeploy: true`, `deepAfterDeploy: false`; obligations live, focused and deep; the release 35 deep review is still
  carried (`carriedDeep: ef3f6bbf`); games both, 18 chapters; checks CHK-002, 003, 008, 009, 013, 015, 016, 017, 020, 021, 022,
  024; target groups pause, phone, presentation. **It is deep before deploy because of the settings change:** `src/app/SaveData.ts`
  (the `Settings` interface and the upgrade wiring) matches the `save-schema` class of `critic/policy.json`
  (`deepBeforeDeploy: true`, "save data and settings is a shared system"). The other reasons it lists are paths the policy does not
  classify (`fxParts.ts`, `fxLooks.ts`, `applyComfort.ts`, `saveComfort.ts`: "unclassified product path is a shared system") and the
  new `pause-eye-candy.css` ("global layout, input and boot"). The mix paths alone (`--paths` on `gates.ts`, `MaxMix.ts`,
  `cinema.ts`, `LivingPaintings.ts`, `battleSpectacle.ts`, `FxPools.ts`, `fxApi.ts` and the seam) plan a FOCUSED review before the
  deploy and the deep one after it ("34 substantial checkpoints since the last deep review"); only the settings change makes it
  deep first.

## Findings from the integration (new in release 36; nothing changed for any of them)

1. **REDUCE MOTION: the page promises one cut, the mix plays none. Needs a product judgement.** *(Fixed in the commit on top: the build now matches the approved page; see "Fixes after integration".)* The approved page
   (`a3-page-reduce-motion-ffx-1600x900.jpg`; README section 1 gives OVERDRIVE SHOT and DRESSPHERE SHOT "one cut") reads `ON · CUT`
   for the two held shots under REDUCE MOTION, and their help lines say "REDUCE MOTION keeps one cut". The mix as built
   (`gates.ts`, `mix-build.md`: "REDUCE MOTION: no hero shot / no close shot") plays **no** held shot; measured in both games
   above. KO COLLAPSE (`ON · CUT`: a plain cut) and BREATHING (`ON · STILL`) match their rows. Either the mix keeps one cut to the
   shot (and one back) under REDUCE MOTION, as the approved page says, or the two rows and help lines change. Bailey or the driver picks.
2. **CHAPTER FRAMING switched mid-fight takes effect in two steps, and ON is slower than OFF.** OFF: the lens shift and BOSS
   SCALE go at once; the camera rig follows with the next frame on which no command menu is open and every figure stands still
   (`framing.ts`: a plan is put on screen only with no menu open): 1 action later in FFX Ch I, 2 in FFX-2 Ch IV (Active ATB keeps
   a girl's menu up), and in between the camera is still the colossus master with Bahamut already back at today's size. ON: nothing
   at once (the OFF plan replaced the chapter's), the plan returns after 1 action in Ch I and 4 in Ch IV. The player changed it in
   the pause, not at a menu, so committing the pending plan on the resume from the pause would remove the gap; that edits the mix's
   "no cut while a player is choosing" rule, so it is left for the driver.
3. **The page does not know the tier.** *(Fixed in the commit on top: the page now shows `ON · OFF HERE` and `ON · LESS HERE`, and why; see "Fixes after integration".)* On the phone tier DEPTH OF FIELD plays nothing (today's tilt-shift stays) and under LOW
   EFFECTS DEPTH OF FIELD, FOG and the post pass are closed; the page shows them ON and flips them normally ("the switch stays",
   README section 1). Measured above: the seam and the saved switches never change with the tier. Wording only, unless Bailey wants
   the page to say so (as it does for REDUCE MOTION).
4. **Two help lines describe the approved mock, not the build.** *(Fixed in the commit on top.)* DRESSPHERE SHOT "full the first time, instant after": the held
   close shot plays on every spherechange (one per change in every run); only the painted twirl keys, none installed yet, have a
   first-time and a repeat mode. DEPTH OF FIELD "Off: today's even focus": with the part OFF the scene's own tilt-shift band stays
   (Ch I 0.4 / 0.16, Ch IV 0.54 / 0.15); the part only re-aims it.
5. `__pyrefly.fx.mix.parts(true | false | [keys])` replaces the settings provider on the seam until the next settings write
   reinstalls it (captures only, as its comment says): a check that calls it and then flips a switch is measuring the page again
   only from that write on. A `?fx=` URL still wins over the three look rows for that page load (`EyeCandy.ts`) and the page does
   not show it; both are capture features, not player paths.
6. Proof history (so nobody repeats it): the first static run failed two pixel "back" checks because the HUD (the advisor card
   re-docking itself against the figures) was in the stills; with the HUD hidden for the shots the 3D frame returns bit-identical.
   The first FFX-2 framing check asserted a plan commit after one action; Active ATB needs more (finding 2).

## Open items carried from both lanes

From `docs/handoff/eye-candy-page.md`:
- Resolved here: "the nine parts switch nothing yet". Each page switch now stops its effect (above); the preflight's last bullet
  (`docs/plans/eye-candy-page-review.md` section 4: "each part's switch actually stops its effect") is answered by this proof.
- Polish: at 844x390 the help line sits under the list's fold (it scrolls into view with the list).
- For Bailey (inferred, not named; rule 15): dropping "NEW." from the help lines; ALL OFF as "the three looks OFF, parts keep their
  values" (ALL ON sets all twelve); the mirror layout; the LIVING PAINTINGS help text (it does not mention the undelivered living
  pause portraits).
- Deep review before deploy (save-data class): `docs/plans/eye-candy-page-review.md` section 4 (CHK-024 matrix, the page by keys,
  pad, mouse and touch, the mirrored pause and short windows, nothing in FF7).
- `docs/target/decisions.json`: D-316 and D-317 read `not-scheduled`; this release did not touch the decisions file or NOW.md.

From `docs/handoff/mix-build.md` (numbers are its own):
- 1. Rule 9 / targets: the colossus masters re-compose approved battle tiles (Natus, Bahamut); each needs a side by side and Bailey's
  yes before it ships as an approved composition.
- 3. The Sensor card over a colossus at the first menu (Ch X Natus; Ch I Yuna's staff tip) and the intent card over a colossus's
  wing (Ch IV, 0.28 to 0.31 of Bahamut's painted pixels).
- 4. Evrae and BFA keep today's size (no colossus master passes the rules there): a new options question.
- 5. The first plan of a session uses predicted panels; a re-plan is decided on the next calm frame and reaches the screen with the
  presenter's next move (never with a menu open), at most three a battle.
- 6. Phone: held shots and colossus scale are off (a slice the HUD slides, A-12); **no real phone GPU was measured**, owed before the deploy.
- 7. Twirl keys: the slot is built and unit-tested; none is installed (the overnight candidates wait for Bailey's pick).
- 8. Camera lab (D-318): the mix wraps the battle camera's `moveTo` and `snapTo` on the instance and sets a view offset on the render
  camera (`rigWatch.ts`, `framing.ts`); a line to the camera-lab session before both meet on main (`docs/plans/camera-lab-review.md`
  covers the rebase).
- 9. The judges' animation note: breathing and the collapse are small by design; the visible gain comes with the approved pose keys.
- 10. The battle-start hitch: the patched figure programs and SMAA compile behind the battle-start card (Ch V's longest early frame
  348 -> 625 ms); warming them with the diorama's programs is a follow-up.
- 11. A re-plan's fog and depth-of-field band are set when the plan is committed, while the camera may still stand on the previous master.
- 12. Phone Ch III: the party is one pixel under its floor at the first menu (117 against 118), inside today's own spread.

## Screenshots (`docs/screenshots/`, side by side, HUD included)

- `rel36-ffx-all-on-vs-all-off-1600x900.png`, `rel36-ffx2-all-on-vs-all-off-1600x900.png`: ALL ON and ALL OFF at the first menu,
  switched on the real page.
- `rel36-ffx-overdrive-shot-on-vs-off-1600x900.png`: the hero shot while the Overdrive input is up, and the master holding with
  OVERDRIVE SHOT OFF on the page.
- `rel36-ffx2-dressphere-shot-on-vs-off-1600x900.png`: the close shot on a spherechange, and the master holding with DRESSPHERE SHOT OFF.
- `rel36-phone-ffx-tap-fog-390x844.png`, `rel36-phone-ffx2-tap-fog-390x844.png`: the page after the tap on FOG, and the battle
  without the fog.

## How to look at it

`npm run dev`, any FFX or FFX-2 chapter, Escape, OPTIONS, EYE CANDY. Every switch is ON by default; flip one and the battle behind
the pause changes when it resumes. `__pyrefly.fx.snapshot()` reports `flags` (the seam) and `mix` (the parts, the master, the held
shot, the counters).

## Fixes after integration (the driver's brief, 2026-10-02; one commit on top of `06e659d9`)

Findings 1, 3 and 4 above, fixed so the build matches the approved page (`docs/concepts/eye-candy-settings-2026-10-02/`, D-317
option A; `a3-page-reduce-motion-*` for the two shots). Branch `rel36`, worktree `D:/pyrefly-advisor-v3`. **Not deployed; `main`
untouched; `SaveData.ts` and the settings schema untouched** (no save change, so the deploy plan above stands: deep before deploy).
Rule 1: presentation only. Rule 7: the largest touched source file is `framing.ts`, 382 lines. No new module (orphans: the same 24).

**Game case (rule 14).** REDUCE MOTION fix: both games, each its own shot (OVERDRIVE SHOT FFX only, the Overdrive input is FFX's;
DRESSPHERE SHOT FFX-2 only, the spherechange is FFX-2's; the twirl-key slot is FFX-2 only). Help lines: DEPTH OF FIELD both games,
DRESSPHERE SHOT FFX-2 only. Device notes: both games; the shot row is the game's own; CHAPTER FRAMING's note appears in a colossus
fight only (Chapter IV's Bahamut here; Chapter I's Mortiorchis loses nothing and shows none). Decided from the code and
`docs/handoff/mix-build.md` (the phone and tier rules), not from memory.

### 1. REDUCE MOTION keeps one static cut to each held shot and one cut back

What the approved page says (`ON · CUT`, "REDUCE MOTION keeps one cut") is now what plays.

- `src/engine/fx/mix/gates.ts`: the two shots no longer close under REDUCE MOTION (`partOn`). A held shot already is one cut to
  the shot and one cut back (`HeldShots` writes one constant pose each frame, no tween), so no shot code had to change; it is
  held for its normal length (FFX: while the Overdrive input is up; FFX-2: at least 1.6 s once she is quiet, at most 3 s) and an
  FFX-2 shot still never opens, and is handed back the frame, a girl's menu opens. New `twirlKeysOn`: the FFX-2 twirl keys (a
  motion; none are installed yet) do not play under REDUCE MOTION, as `twirl.ts` always said. `MaxMix.ts`: the twirl slot asks
  `twirlKeysOn`; the Overdrive banner rule reads the part itself (it never depended on REDUCE MOTION).
- "No lens drift", made true by construction: while a shot is up, `MaxMix` holds the lens shift at the value the shot was framed
  against (`Framing.applyLens(on, hold)`), so a camera move running underneath cannot drift it. It goes on with the cut back.

**Proof** (headless Chromium on the real GPU, `PYREFLY_BROWSER=gpu`; the worktree's own dev server on port 5780, stopped; a fresh
profile and battle per run; every rendered frame sampled by an in-page recorder that runs after the game's own frame: camera
position, orientation, field of view, view offset, whether the mix holds a shot, and, independently, whether a command list is on
screen). REDUCE MOTION turned on by the OPTIONS row with real keys (and once by the OS preference, with the row left OFF). The
only injection, labelled, is the old one: Tidus's Overdrive gauge set to 100 before the first FFX menu. Chapter I (FFX,
`seymour-flux`) through the real command menu and the real input; Chapter IV (FFX-2, `ffx2-bahamut`) through a girl's real menu
(Change, a dressphere).

| Run (1600x900) | held | camera inside the shot (position, turn, fov, lens shift) | cut in | cut back | other jumps, 6 frames before to 3 after | menu on a held frame |
|---|---|---|---|---|---|---|
| FFX Ch I, REDUCE MOTION (row) | 186 frames, 3077 ms (the input's length) | deviation 0, 0 deg, 0, `[-128, 36]` unchanged | 4.72 units, one frame | 3.79 units, one frame | none | 0 of 186 |
| FFX Ch I, REDUCE MOTION (OS) | 186 frames, 3077 ms | 0, 0, 0, unchanged | 4.60 | 3.81 | none | 0 of 186 |
| FFX-2 Ch IV, REDUCE MOTION (row) | 29 frames, 444 ms | 0, 0, 0, `[128, 0]` unchanged | 4.40 | 4.40 | none | 0 of 29 |
| FFX-2 Ch IV, REDUCE MOTION (OS) | 29 frames, 450 ms | 0, 0, 0, unchanged | 4.37 | 4.37 | none | 0 of 29 |
| FFX Ch I, normal motion (baseline) | 187 frames, 3094 ms | 0, 0, 0, unchanged | 4.94 | 5.04 | the presenter's own moves after the cut back | 0 of 187 |
| FFX-2 Ch IV, normal motion (baseline) | 29 frames, 444 ms | 0, 0, 0, unchanged | 3.17 | 3.15 | none | 0 of 29 |

Exactly two cuts under REDUCE MOTION in all four runs; the shot counters moved by one cut and one hand back each (`shots.od` or
`shots.sc` +1, `handBacks` +1). 15 of 15 checks per REDUCE MOTION run, 10 of 10 per baseline, 0 console errors. The recording ran at
16.7 ms a frame on average (longest gap 27 to 82 ms). In the same runs, everything else REDUCE MOTION does is unchanged: the page
reads `REDUCE MOTION IS ON`, BREATHING `ON · STILL`, KO COLLAPSE and the shot `ON · CUT`, all twelve switches saved ON and the seam
ON for all twelve; the mix reads BREATHING closed and the shot's part open; chest phase 0; the fog's drift constant; the KO a plain
cut (`cuts` +1, no buckle); the FFX Overdrive banner rule moved the slab to 22 %; the FFX-2 twirl slot counted 0 changes (1 in the
normal run: it is closed under REDUCE MOTION).

Two things the FFX-2 runs show about the rule, not about REDUCE MOTION: the first spherechange of each run produced **no shot at
all**, because a girl's menu was open on every recorded frame (327 of 327 and 304 of 304; Active ATB keeps one up): "never while a
menu is open", observed. The shot that did play was handed back after 444 and 450 ms, the frame the next girl's menu opened; a
full 1.6 s hold was not reachable in these fights (Bahamut's Curse seals a girl's Change: the later attempts read `ChangeCursed`), so
the normal-length path is shown by FFX (the input's whole length) and by the unchanged code.

### 2. The two help lines say what the build does

| Switch | Was (the mockup) | Now |
|---|---|---|
| DRESSPHERE SHOT (FFX-2) | "A held close shot and painted keys on a dressphere change: full the first time, instant after. REDUCE MOTION keeps one cut." | "On a dressphere change the camera cuts to a held close shot of the girl, then cuts back. REDUCE MOTION keeps one cut." |
| DEPTH OF FIELD (both) | "A soft focus band that melts the far and near edges, set for each chapter's camera. Off: today's even focus." | "Aims the soft focus band at your fighters, set for each chapter's camera. Off: the scene keeps its own band." |

The held close shot plays on every spherechange; only the painted twirl keys (none installed) have a first-time and a repeat mode,
so the line no longer mentions them. With DEPTH OF FIELD off, the scene's own tilt-shift band stays (Ch I 0.4 / 0.16, Ch IV
0.54 / 0.15; measured again below); the part only re-aims it.

### 3. The page says what the device does, and never writes it

One rule, `deviceNote(part, device)` in `gates.ts`, read by both the page and the mix (the mix holds the shots on a phone through
`deviceCloses`), so they cannot disagree. A row whose part is ON in the save and whose look is ON reads `ON · OFF HERE` (the
device closes it) or `ON · LESS HERE` (it trims it), the help line closes with the reason in the accent, and the saved value, the
count (`11 of 11 on`), ALL LOOKS and the OPTIONS row's `ALL ON` / `n OF 11` stay the saved state. A part turned OFF, or whose
look is OFF, shows no note (it plays nothing anyway), as REDUCE MOTION's notes. On a row both apply to, the device wins (a shot
closed on a phone is not "one cut"). `snapshot().eyeCandy` gains `device` and per-row `limit`; `__pyrefly.fx.mix.snapshot()` gains
`device` and `limits`.

| Device | Row note | Why line under the help |
|---|---|---|
| Phone tier (a screen under 600 px) or LOW EFFECTS: DEPTH OF FIELD | `ON · OFF HERE` | "Off on a phone screen." / "Off under LOW EFFECTS." |
| LOW EFFECTS: FOG | `ON · OFF HERE` | "Off under LOW EFFECTS." |
| LOW EFFECTS: SMOOTH EDGES (no SMAA or FXAA pass; the defringe stays) | `ON · LESS HERE` | "LOW EFFECTS keeps only the fringe fix, not the outline pass." |
| A phone held upright: OVERDRIVE SHOT (FFX) / DRESSPHERE SHOT (FFX-2) | `ON · OFF HERE` | "Off on a phone held upright: it shows a slice of the picture, so the camera stays wide." |
| A phone held upright, in a colossus fight: CHAPTER FRAMING (no colossus master or BOSS SCALE) | `ON · LESS HERE` | "On a phone held upright the bosses keep today's size; the rest still works." |

BREATHING, KO COLLAPSE and SPLASH ART are the same on every device (a coarser grid or a static splash line is not a part closed),
and the phone's FXAA is still a pass, so SMOOTH EDGES reads plain `ON` there. The colossus fact comes from the framing's own
decision (`FramingReport.colossusFight`, known from the first decision whatever the switches say; `fightFacts` in `gates.ts`
carries it to the page): Chapter I shows no CHAPTER FRAMING note on a phone because there is no boss to scale.

**Fit** (measured on the live page, label text against value text per row, one line each, nothing past the row's edge):
1600x900: the widest note is 133 px (`ON · LESS HERE`) in a 344 px row, the smallest label-to-value gap 41 px (45 px on DEPTH OF
FIELD). 390x844: widest 114 px in a 350 px row, smallest gap 64 px (FFX-2; 83 px in FFX); the help block ends at y 786 above the prompts at 796; the list
needs 0 px of scrolling with the longest reason up (570 px of rows in a 570 px box, as before). Narrower, which the brief did not
name: the column is `clamp(290px, 21.5vw, 400px)`, so below 1480 px of width a note beside a long label ran 14 to 21 px past the
column's edge; the column now grows to its widest row (`width: max-content` with the clamp as its minimum, `pause-eye-candy.css`;
a 14 px gap between label and value), which moves nothing when there is no note (344 px at 1600x900 still). Checked on 1920x1080,
1366x768, 1280x720, 1024x768, 360x640, 844x390: columns 400, 314, 313, 312, 320, 312 px, smallest gap 14 px or more; and in the
mirrored pause (the chrome on the right), where the value sits on the left.

**Proof that the notes are true** (`device-mix`, per game and device; page opened by real keys, battle measured): the page's notes
equal the mix's own `limits` in every case, and each claim is measured on the real battle.

| Device | Measured |
|---|---|
| LOW EFFECTS, 1600x900 | fog meshes 0; no SMAA or FXAA pass, the defringe on 10 figures (FFX) / 8 (FFX-2); DEPTH OF FIELD not re-aimed, the tilt-shift at the scene's own `[0.4, 0.16]` (FFX) / `[0.54, 0.15]` (FFX-2); FFX: the Overdrive hero shot plays (186 frames, the camera cut 4.8 units); FFX-2: the colossus master plays (`colossus` true) |
| Phone 390x844 | fog 2 meshes, FXAA plus the defringe, DEPTH OF FIELD not re-aimed (same bands); FFX: through the real menu and input no hero shot (`shots.od` 0, no held frame); FFX-2 (Bahamut, a colossus): `colossusFight` true but no colossus master (`colossus` false), a real spherechange through the girl's menu and no close shot (`shots.sc` +0); FFX Ch I: `colossusFight` false, no limit on CHAPTER FRAMING |
| Phone 390x844 with LOW EFFECTS | fog 0, no AA pass, the defringe stays, the same shot and framing results |

By real input: the page by keys at 1600x900 (and for LOW EFFECTS, the OPTIONS row by keys); the 390x844 page opened by finger
(the PAUSE chip tapped, the strip swiped, OPTIONS tapped, the list swiped, the EYE CANDY row tapped), the cursor walked by keys
(a tap would flip the switch). Page checks: 28 of 28 per game (default, LOW EFFECTS, phone, phone with LOW EFFECTS: the notes, the
twelve saved switches untouched, the count `11 of 11 on`, the seam all ON, the fit, each limited row's reason, the help block
clear of the prompts); mix checks: 26 of 26 per game; narrow checks: 18 of 18 per game. 0 console errors.

### Gates

- `npx tsc --noEmit`: clean.
- Targeted: `fx-mix-gates` (20 tests; the RM test now says the shots stay, new tests for `twirlKeysOn`, the whole `deviceNote` table
  and the colossus rule; mutation-checked: putting the REDUCE MOTION clause back fails it), `eye-candy-mix-connection` (35: two new,
  REDUCE MOTION leaves each game's shot playing, and what the page calls OFF HERE the mix does not play), `pause-eye-candy-page`
  (36: the two help lines word for word, the device notes on a phone and under LOW EFFECTS, no note on an OFF part or an OFF look,
  the device outranking REDUCE MOTION, every noted row has a reason, Chapter I's no-colossus case), `fx-mix-parts`,
  `fx-parts-model`, `pause-comfort-rows`, `save-fx-parts`, `eyecandy-flags`: 173 passed.
- Full `npx vitest run --testTimeout=60000`: **746 files passed, 5 skipped; 11,031 tests passed, 40 skipped, 1 todo, 0 failed**
  (the 11,002 of the integration plus 29).
- `node tools/orphans.mjs`: 1177 modules, 24 orphaned, the same list as before.
- `node tools/critic-plan.mjs --paths` on the touched files: DEEP, focused before deploy and deep after, because of
  `pause-eye-candy.css` ("global layout, input and boot"); the release's own plan (deep before deploy, `SaveData.ts`) is unchanged.

### Rule 15: what is mine and not named by Bailey (ask before treating it as approved)

- The two words, `OFF HERE` (the driver's example) and `LESS HERE` (mine, for the two trimmed cases: SMOOTH EDGES under LOW EFFECTS,
  CHAPTER FRAMING on a phone in a colossus fight), and the five reason lines.
- The count, ALL LOOKS and the OPTIONS row stay the saved state; the device is shown per row only.
- The device outranks REDUCE MOTION on a row; the FFX-2 twirl keys do not play under REDUCE MOTION.
- The column growing on narrow windows (a note beside a long label); at 1600x900 and on a phone nothing moved.

### Not done, and proof history

- Finding 2 (CHAPTER FRAMING takes effect in two steps when switched mid-fight) is untouched, as is finding 5.
- No real phone GPU was measured (carried from the mix lane, item 6).
- Proof history: `prove-dynamic.mjs` of the integration run marked an FFX-2 spherechange as done without checking that a dressphere
  was picked; under Active ATB its walker can end in the target step with "Attack" selected. The new walker reads the command list
  from the DOM, presses nothing outside a menu, and counts a change only on the engine's own `spherechange` event.
  Under REDUCE MOTION the twirl slot's own counter stays 0 by design, so it cannot be the signal.

### Screenshots (`docs/screenshots/`)

- `rel36-fix-reduce-motion-ffx-shot-1600x900.png`, `rel36-fix-reduce-motion-ffx2-shot-1600x900.png`: the master, and the held shot
  under REDUCE MOTION frozen on its first frame (`fx.freeze` for the still only; the camera proof above ran unfrozen).
- `rel36-fix-device-low-effects-ffx-1600x900.png`: the page normally, and under LOW EFFECTS with the cursor on DEPTH OF FIELD.
- `rel36-fix-device-phone-390x844.png`: the page on a phone, FFX on OVERDRIVE SHOT and FFX-2 on DRESSPHERE SHOT.

Scripts and raw reports (agent scratch): `D:/Tools/pyrefly-scratch/2026-10-02-rel36-fix/` (`prove-rm.mjs`, `prove-device-page.mjs`,
`prove-device-mix.mjs`, `prove-device-narrow.mjs`, `shots-rm.mjs`, `compose-fix.py`, `out/*.json`).
