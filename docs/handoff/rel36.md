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
touches no contract file. This release adds one test file, this note and the screenshots below; no game code changed.

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

1. **REDUCE MOTION: the page promises one cut, the mix plays none. Needs a product judgement.** The approved page
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
3. **The page does not know the tier.** On the phone tier DEPTH OF FIELD plays nothing (today's tilt-shift stays) and under LOW
   EFFECTS DEPTH OF FIELD, FOG and the post pass are closed; the page shows them ON and flips them normally ("the switch stays",
   README section 1). Measured above: the seam and the saved switches never change with the tier. Wording only, unless Bailey wants
   the page to say so (as it does for REDUCE MOTION).
4. **Two help lines describe the approved mock, not the build.** DRESSPHERE SHOT "full the first time, instant after": the held
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
